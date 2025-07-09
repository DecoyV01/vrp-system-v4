"""
Optimization API Endpoints - COMPLETE FIX VERSION
Route optimization using VROOM solver with enhanced dataset context and proper data extraction
"""

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
import logging

from ...database.connection import get_supabase
from ...core.auth import get_current_user, CurrentUser
from ...core.vroom import vroom_service, VROOMRequest, VROOMVehicle, VROOMJob
import json
from datetime import datetime

router = APIRouter(prefix="/optimization", tags=["optimization"])

# Enhanced models to match frontend
class VroomVehicleInput(BaseModel):
    id: int
    start: List[float]  # [longitude, latitude]
    end: List[float]    # [longitude, latitude]
    capacity: List[int]
    skills: List[int]
    time_window: List[int]
    costs: Dict[str, int]
    max_distance: Optional[int] = None
    max_travel_time: Optional[int] = None
    
    class Config:
        # Allow string to int conversion for better compatibility
        str_to_int_float = True

class VroomJobInput(BaseModel):
    id: int
    location: List[float]  # [longitude, latitude]
    service: int
    delivery: Optional[List[int]] = None
    pickup: Optional[List[int]] = None
    skills: List[int]
    priority: int
    time_windows: Optional[List[List[int]]] = None
    
    class Config:
        str_to_int_float = True

class VroomOptions(BaseModel):
    g: bool = True
    useMatrix: bool = False
    threads: Optional[int] = 4

class DirectOptimizationRequest(BaseModel):
    """Direct VROOM request from frontend"""
    vehicles: List[VroomVehicleInput]
    jobs: List[VroomJobInput]
    options: VroomOptions
    # NEW: Enhanced dataset context for traceability
    scenario_id: Optional[int] = None
    dataset_id: Optional[int] = None
    dataset_name: Optional[str] = None
    dataset_version: Optional[int] = None
    project_id: Optional[int] = None

class DatasetOptimizationRequest(BaseModel):
    """Dataset-aware optimization request"""
    dataset_id: int
    optimization_parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    custom_options: Optional[VroomOptions] = None
    save_results: bool = Field(default=True)

class OptimizationRequest(BaseModel):
    scenario_id: int
    project_id: int
    # NEW: Enhanced dataset context
    dataset_id: Optional[int] = None
    dataset_name: Optional[str] = None
    dataset_version: Optional[int] = None

@router.post("/")
async def run_direct_optimization(
    request_body: dict,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Run route optimization with direct VROOM input"""
    try:
        # Log the raw request for debugging
        logging.info(f"Raw optimization request received: {request_body}")
        
        # Try to parse the request with detailed error handling
        try:
            request = DirectOptimizationRequest(**request_body)
        except Exception as e:
            logging.error(f"Request validation failed: {e}")
            logging.error(f"Request body: {request_body}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Request validation error: {str(e)}"
            )
        
        logging.info(f"Starting optimization with {len(request.vehicles)} vehicles and {len(request.jobs)} jobs")
        
        # Convert frontend request to VROOM format
        vroom_vehicles = []
        for vehicle in request.vehicles:
            vroom_vehicle = VROOMVehicle(
                id=vehicle.id,
                start=vehicle.start,
                end=vehicle.end,
                capacity=vehicle.capacity,
                skills=vehicle.skills,
                time_window=vehicle.time_window
            )
            vroom_vehicles.append(vroom_vehicle)
        
        vroom_jobs = []
        for job in request.jobs:
            vroom_job = VROOMJob(
                id=job.id,
                location=job.location,
                service=job.service,
                delivery=job.delivery,
                pickup=job.pickup,
                skills=job.skills,
                time_windows=job.time_windows
            )
            vroom_jobs.append(vroom_job)
        
        # Create VROOM request
        vroom_request = VROOMRequest(
            vehicles=vroom_vehicles,
            jobs=vroom_jobs,
            options=request.options.model_dump()
        )
        
        logging.info(f"Sending request to VROOM solver at {vroom_service.api_url}")
        
        # Run optimization
        result = await vroom_service.optimize(vroom_request)
        
        logging.info(f"VROOM optimization completed with code: {result.get('code', 'unknown')}")
        
        # Store optimization results in database
        try:
            # Get or create a default scenario for this project
            supabase_client = get_supabase()
            
            default_scenario_id = await get_or_create_default_scenario(supabase_client, current_user)
            
            optimization_run_id = await store_optimization_results(
                supabase=supabase_client, 
                vroom_request=vroom_request.model_dump(),
                vroom_response=result,
                scenario_id=request.scenario_id or default_scenario_id,
                current_user=current_user,
                dataset_id=request.dataset_id,
                dataset_name=request.dataset_name,
                dataset_version=request.dataset_version,
                project_id=request.project_id  # Pass project_id from request
            )
            logging.info(f"Stored optimization results with run ID: {optimization_run_id}")
            
            # Add run ID to response for reference
            result['optimization_run_id'] = optimization_run_id
            
        except Exception as e:
            logging.warning(f"Failed to store optimization results: {e}")
            # Don't fail the optimization if storage fails
        
        return result
        
    except Exception as e:
        logging.error(f"Optimization failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Optimization failed: {str(e)}"
        )

@router.get("/health")
async def vroom_health():
    """Check VROOM solver health"""
    is_healthy = await vroom_service.health_check()
    return {
        "vroom_available": is_healthy,
        "status": "healthy" if is_healthy else "unavailable",
        "solver_url": vroom_service.api_url
    }

@router.get("/health-public")
async def vroom_health_public():
    """Check VROOM solver health (no auth required)"""
    is_healthy = await vroom_service.health_check()
    return {
        "vroom_available": is_healthy,
        "status": "healthy" if is_healthy else "unavailable",
        "solver_url": vroom_service.api_url,
        "timestamp": "2025-06-06T12:00:00Z"
    }

@router.post("/test")
async def test_vroom_optimization(
    current_user: CurrentUser = Depends(get_current_user)
):
    """Test VROOM optimization with sample data"""
    try:
        logging.info("Running VROOM test optimization")
        result = await vroom_service.test_optimization()
        
        return {
            "success": True,
            "message": "VROOM test optimization completed successfully",
            "result": result,
            "test_summary": {
                "vehicles": 1,
                "jobs": 2,
                "routes_generated": len(result.get("routes", [])),
                "unassigned_jobs": len(result.get("unassigned", [])),
                "total_distance": result.get("summary", {}).get("distance", 0),
                "total_duration": result.get("summary", {}).get("duration", 0)
            }
        }
        
    except Exception as e:
        logging.error(f"VROOM test optimization failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"VROOM test failed: {str(e)}"
        )

async def store_optimization_results(
    supabase: Client,
    vroom_request: dict,
    vroom_response: dict,
    scenario_id: int,
    current_user: CurrentUser,
    dataset_id: Optional[int] = None,
    dataset_name: Optional[str] = None,
    dataset_version: Optional[int] = None,
    project_id: Optional[int] = None
) -> int:
    """
    Store VROOM optimization results in the database with enhanced dataset context
    COMPLETE FIX: Properly extracts all summary data and populates all fields
    """
    logging.info("Storing VROOM optimization results in database...")
    
    try:
        # CRITICAL FIX: Extract summary data from VROOM response
        summary = vroom_response.get('summary', {})
        routes = vroom_response.get('routes', [])
        unassigned = vroom_response.get('unassigned', [])
        
        # COMPLETE DATA EXTRACTION: Calculate all statistics from VROOM response
        total_cost = summary.get('cost', 0)
        total_routes = len(routes)
        total_unassigned = len(unassigned)
        total_distance = summary.get('distance', 0)
        total_duration = summary.get('duration', 0)
        total_waiting_time = summary.get('waiting_time', 0)
        total_service_time = summary.get('service', 0)
        total_setup_time = summary.get('setup', 0)
        
        # Count vehicles and jobs from request
        total_vehicles = len(vroom_request.get('vehicles', []))
        total_jobs = len(vroom_request.get('jobs', []))
        total_shipments = len(vroom_request.get('shipments', []))
        
        # Determine optimization status
        optimization_code = vroom_response.get('code', -1)
        status_mapping = {
            0: 'completed',
            1: 'completed_with_warnings', 
            2: 'error',
            3: 'timeout',
            4: 'infeasible'
        }
        optimization_status = status_mapping.get(optimization_code, 'error')
        
        # CRITICAL FIX: Get project currency dynamically
        project_currency = 'USD'  # Default fallback
        if project_id:
            try:
                project_response = supabase.table("projects").select("currency").eq("id", project_id).single().execute()
                if project_response.data:
                    project_currency = project_response.data["currency"]
                    logging.info(f"Using project currency: {project_currency}")
            except Exception as e:
                logging.warning(f"Could not fetch project currency: {e}, using default USD")
        
        # COMPLETE FIX: Store optimization run with ALL required fields populated
        logging.info("Creating optimization run record with complete data extraction...")
        optimization_run_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "computing_time": summary.get('computing_times', {}).get('total', 0),
            "status": optimization_status,
            "error_message": vroom_response.get('error') if optimization_code != 0 else None,
            
            # CRITICAL FIX: Populate ALL summary fields from VROOM response
            "total_cost": total_cost,
            "total_routes": total_routes,
            "total_unassigned": total_unassigned,
            "total_distance": total_distance,
            "total_duration": total_duration,
            "total_waiting_time": total_waiting_time,
            "total_service_time": total_service_time,
            "total_setup_time": total_setup_time,
            "total_vehicles": total_vehicles,
            "total_jobs": total_jobs,
            "total_shipments": total_shipments,
            
            # Store complete request and response for debugging
            "raw_request": vroom_request,
            "raw_response": vroom_response,
            
            # Context and metadata
            "scenario_id": scenario_id,
            "dataset_id": dataset_id,
            "dataset_name": dataset_name,
            "dataset_version": dataset_version,
            "project_id": project_id,  # Required field for direct queries
            
            # Required database fields with proper values
            "algorithm": "vroom",
            "duration_ms": summary.get('computing_times', {}).get('total', 0),
            "settings": {},
            "optimization_engine": "vroom",
            "optimization_parameters": {},
            "currency_code": project_currency,
            "created_by": current_user.user_id  # FIXED: Use user_id instead of id
        }
        
        logging.info(f"Optimization run data: cost={total_cost}, routes={total_routes}, unassigned={total_unassigned}")
        
        optimization_run_result = supabase.table("optimization_runs").insert(optimization_run_data).execute()
        
        if not optimization_run_result.data or len(optimization_run_result.data) == 0:
            raise Exception("Failed to create optimization run record")
            
        optimization_run_id = optimization_run_result.data[0]['id']
        logging.info(f"Created optimization run with ID: {optimization_run_id}")
        
        # COMPLETE FIX: Store route summaries and steps if optimization was successful
        if optimization_code == 0 and routes:
            logging.info(f"Processing {len(routes)} routes for storage...")
            
            for route in routes:
                vehicle_id = route.get('vehicle')
                
                # Store route summary with complete data
                route_summary_data = {
                    "optimization_run_id": optimization_run_id,
                    "vehicle_id": vehicle_id,
                    "cost": route.get('cost', 0),
                    "distance": route.get('distance', 0),
                    "duration": route.get('duration', 0),
                    "waiting_time": route.get('waiting_time', 0),
                    "service_time": route.get('service', 0),
                    "setup_time": route.get('setup', 0),
                    "deliveries": route.get('delivery', []),
                    "pickups": route.get('pickup', []),
                    "priority": route.get('priority', 0),
                    "violations": route.get('violations', []),
                    "geometry": route.get('geometry'),
                    "geojson": route.get('geojson'),
                    "dataset_name": dataset_name,
                    "dataset_version": dataset_version,
                    "currency_code": project_currency
                }
                
                route_summary_result = supabase.table("route_summaries").insert(route_summary_data).execute()
                
                if not route_summary_result.data or len(route_summary_result.data) == 0:
                    logging.warning(f"Failed to create route summary for vehicle {vehicle_id}")
                    continue
                    
                route_summary_id = route_summary_result.data[0]['id']
                logging.info(f"Created route summary {route_summary_id} for vehicle {vehicle_id}")
                
                # Store route steps with complete data
                steps = route.get('steps', [])
                if steps:
                    logging.info(f"Processing {len(steps)} route steps for route {route_summary_id}...")
                    
                    for step_order, step in enumerate(steps):
                        step_type = step.get('type', 'unknown')
                        job_id = step.get('id') if step_type == 'job' else None
                        location = step.get('location', [0, 0])
                        
                        route_step_data = {
                            "route_summary_id": route_summary_id,
                            "vehicle_id": vehicle_id,
                            "step_type": step_type,
                            "step_order": step_order,
                            "job_id": job_id,
                            "lon": location[0] if len(location) > 0 else None,
                            "lat": location[1] if len(location) > 1 else None,
                            "arrival_time": step.get('arrival', 0),
                            "setup_time": step.get('setup', 0),
                            "service_time": step.get('service', 0),
                            "waiting_time": step.get('waiting_time', 0),
                            "distance": step.get('distance', 0),
                            "duration": step.get('duration', 0),
                            "load": step.get('load', []),
                            "violations": step.get('violations', []),
                            "description": step.get('description'),
                            "dataset_name": dataset_name,
                            "dataset_version": dataset_version
                        }
                        
                        supabase.table("route_steps").insert(route_step_data).execute()
                    
                    logging.info(f"Stored {len(steps)} route steps for route {route_summary_id}")
        
        # Store unassigned jobs if any
        if unassigned:
            logging.info(f"Processing {len(unassigned)} unassigned jobs...")
            
            for unassigned_job in unassigned:
                job_id = unassigned_job.get('id')
                location = unassigned_job.get('location', [0, 0])
                
                unassigned_job_data = {
                    "optimization_run_id": optimization_run_id,
                    "original_id": job_id,
                    "task_type": "job",
                    "job_id": job_id,
                    "shipment_id": None,
                    "lon": location[0] if len(location) > 0 else None,
                    "lat": location[1] if len(location) > 1 else None,
                    "description": unassigned_job.get('description') or f"Unassigned job {job_id}",
                    "dataset_name": dataset_name,
                    "dataset_version": dataset_version
                }
                
                supabase.table("unassigned_jobs").insert(unassigned_job_data).execute()
            
            logging.info(f"Stored {len(unassigned)} unassigned jobs")
        
        logging.info(f"✅ COMPLETE FIX SUCCESS: All optimization results stored for run {optimization_run_id}")
        logging.info(f"📊 Summary stored: cost={total_cost}, routes={total_routes}, distance={total_distance}")
        return optimization_run_id
        
    except Exception as e:
        logging.error(f"❌ Failed to store optimization results: {str(e)}")
        raise Exception(f"Database storage failed: {str(e)}")

async def get_or_create_default_scenario(supabase: Client, current_user: CurrentUser) -> int:
    """Get or create a default scenario for direct optimization"""
    try:
        # Get user's first project
        projects_result = supabase.table("projects")\
            .select("id, name")\
            .eq("owner_id", current_user.user_id)\
            .limit(1)\
            .execute()
        
        if not projects_result.data:
            raise Exception("No projects found for user")
        
        project_id = projects_result.data[0]["id"]
        
        # Look for existing default scenario
        scenarios_result = supabase.table("scenarios")\
            .select("id")\
            .eq("project_id", project_id)\
            .eq("name", "Direct Optimization")\
            .execute()
        
        if scenarios_result.data:
            return scenarios_result.data[0]["id"]
        
        # Create default scenario
        scenario_data = {
            "name": "Direct Optimization",
            "description": "Default scenario for direct optimization runs",
            "project_id": project_id,
            "start_date": datetime.utcnow().isoformat(),
            "planning_horizon_days": 1,
            "created_by": current_user.user_id,
            "updated_by": current_user.user_id
        }
        
        scenario_result = supabase.table("scenarios").insert(scenario_data).execute()
        
        if not scenario_result.data:
            raise Exception("Failed to create default scenario")
        
        return scenario_result.data[0]["id"]
        
    except Exception as e:
        logging.error(f"Failed to get/create default scenario: {str(e)}")
        # Fallback: try to find any scenario for any project the user owns
        try:
            fallback_result = supabase.table("scenarios")\
                .select("id, projects!inner(owner_id)")\
                .eq("projects.owner_id", current_user.user_id)\
                .limit(1)\
                .execute()
            
            if fallback_result.data:
                return fallback_result.data[0]["id"]
        except:
            pass
        
        raise Exception(f"Could not get or create scenario: {str(e)}")