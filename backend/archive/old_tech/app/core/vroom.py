"""
VROOM Solver Integration
Interface with VROOM optimization engine
"""

import httpx
import os
import logging
from typing import Dict, List, Optional
from pydantic import BaseModel
from fastapi import HTTPException, status

# VROOM API Configuration
# When deployed on same VM as VROOM, use localhost for better performance
VROOM_API_URL = os.getenv("VROOM_API_URL", "http://localhost:30010")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VROOMVehicle(BaseModel):
    id: int
    start: List[float]  # [longitude, latitude]
    end: Optional[List[float]] = None
    capacity: Optional[List[int]] = None
    skills: Optional[List[int]] = None
    time_window: Optional[List[int]] = None
    costs: Optional[Dict[str, int]] = None
    max_distance: Optional[int] = None
    max_travel_time: Optional[int] = None

class VROOMJob(BaseModel):
    id: int
    location: List[float]  # [longitude, latitude]
    setup: Optional[int] = 0
    service: Optional[int] = 0
    delivery: Optional[List[int]] = None
    pickup: Optional[List[int]] = None
    skills: Optional[List[int]] = None
    priority: Optional[int] = 100
    time_windows: Optional[List[List[int]]] = None

class VROOMRequest(BaseModel):
    vehicles: List[VROOMVehicle]
    jobs: List[VROOMJob]
    options: Optional[Dict] = None

class VROOMService:
    def __init__(self):
        self.api_url = VROOM_API_URL
        self.timeout = 300  # 5 minutes
        logger.info(f"VROOM Service initialized with URL: {self.api_url}")

    async def optimize(self, request: VROOMRequest) -> Dict:
        """
        Send optimization request to VROOM solver
        """
        try:
            # Log request details
            logger.info(f"Sending VROOM request to {self.api_url}")
            logger.info(f"Request details: {len(request.vehicles)} vehicles, {len(request.jobs)} jobs")
            
            # Prepare request data
            request_data = request.model_dump(exclude_none=True)
            logger.debug(f"Request payload: {request_data}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.api_url}/",
                    json=request_data,
                    headers={"Content-Type": "application/json"}
                )
                
                logger.info(f"VROOM response status: {response.status_code}")
                
                if response.status_code != 200:
                    error_text = response.text
                    logger.error(f"VROOM solver error {response.status_code}: {error_text}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"VROOM solver error: {response.status_code} - {error_text}"
                    )
                
                result = response.json()
                logger.info(f"VROOM optimization completed with code: {result.get('code', 'unknown')}")
                
                # Check VROOM response code
                if result.get('code', 0) != 0:
                    error_msg = result.get('error', 'Unknown VROOM error')
                    logger.error(f"VROOM internal error: {error_msg}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"VROOM optimization error: {error_msg}"
                    )
                
                return result
                
        except httpx.TimeoutException:
            logger.error("VROOM request timed out")
            raise HTTPException(
                status_code=status.HTTP_408_REQUEST_TIMEOUT,
                detail="VROOM solver request timed out (300s)"
            )
        except httpx.ConnectError as e:
            logger.error(f"Failed to connect to VROOM solver: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to VROOM solver at {self.api_url}"
            )
        except Exception as e:
            logger.error(f"Unexpected VROOM error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"VROOM solver error: {str(e)}"
            )

    async def health_check(self) -> bool:
        """
        Check if VROOM solver is available
        """
        try:
            logger.info(f"Checking VROOM health at {self.api_url}")
            async with httpx.AsyncClient(timeout=10) as client:
                # Try to connect to the VROOM solver using GET / 
                response = await client.get(f"{self.api_url}/")
                # VROOM returns 200 with "Cannot GET /" message, which means it's running and responding
                # Check for both 404 and 200 status codes and verify the response content
                is_healthy = (response.status_code in [200, 404]) and (
                    "Cannot GET" in response.text or 
                    response.status_code == 404
                )
                logger.info(f"VROOM health check result: {'healthy' if is_healthy else 'unhealthy'} (status: {response.status_code}, content: {response.text[:50]})")
                return is_healthy
        except Exception as e:
            logger.warning(f"VROOM health check failed: {e}")
            return False

    async def test_optimization(self) -> Dict:
        """
        Run a simple test optimization to verify VROOM is working
        """
        test_request = VROOMRequest(
            vehicles=[
                VROOMVehicle(
                    id=1,
                    start=[28.0, -26.0],  # Johannesburg
                    end=[28.0, -26.0],
                    capacity=[1000],
                    skills=[1],
                    time_window=[0, 86400]
                )
            ],
            jobs=[
                VROOMJob(
                    id=1,
                    location=[28.1, -26.1],
                    service=300,  # 5 minutes
                    delivery=[100],
                    skills=[1]
                ),
                VROOMJob(
                    id=2,
                    location=[28.2, -26.2],
                    service=300,
                    delivery=[100],
                    skills=[1]
                )
            ],
            options={"g": True, "useMatrix": False, "threads": 4}
        )
        
        return await self.optimize(test_request)

# Global VROOM service instance
vroom_service = VROOMService()
