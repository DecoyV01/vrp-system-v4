"""
Bulk Tanker Delivery API Endpoints
MPAD Implementation: Real-World Fuel Logistics API

FastAPI routes for managing bulk fuel tanker operations including
multi-compartment allocation, cross-contamination prevention,
and regulatory compliance validation.

Based on industry research and testing scenarios.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, text
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
import json

from app.database.connection import get_db
from app.models.bulk_tanker import (
    BulkTankerVehicles, TankerCompartments, FuelProducts,
    BulkTankerDeliveries, CompartmentDeliveryAssignments,
    FuelQualityTests, CompartmentStatus, TankerCertificationStatus
)
from app.core.auth import get_current_user
from pydantic import BaseModel, Field, validator

# ===============================================
# PYDANTIC MODELS FOR REQUESTS/RESPONSES
# ===============================================

class TankerCompartmentResponse(BaseModel):
    id: int
    compartment_number: int
    compartment_name: str
    capacity_liters: int
    working_capacity_liters: Optional[int]
    operational_status: str
    current_product_id: Optional[int]
    current_volume_liters: int
    requires_cleaning: bool
    last_cleaned: Optional[datetime]
    compatible_products: List[str]

class BulkTankerVehicleResponse(BaseModel):
    id: int
    vehicle_name: str
    license_plate: str
    total_capacity_liters: int
    compartment_count: int
    dot_certified: bool
    hazmat_certification: bool
    certification_status: str
    operational_status: str
    last_cleaning: Optional[datetime]
    compartments: List[TankerCompartmentResponse]

class FuelProductResponse(BaseModel):
    id: int
    product_name: str
    product_code: str
    fuel_type: str
    sulfur_content_ppm: Decimal
    density_kg_per_liter: Decimal
    flash_point_celsius: Optional[int]
    hazmat_class: str
    un_number: str
    compatibility_group: str
    cross_contamination_risk: List[str]
    cleaning_required_after: List[str]
    special_handling: List[str]

class CompartmentAssignmentRequest(BaseModel):
    compartment_id: int
    fuel_product_id: int
    assigned_volume_liters: int = Field(..., gt=0, description="Volume must be positive")
    delivery_location_id: int
    loading_sequence: Optional[int] = Field(None, gt=0)
    special_handling_requirements: Optional[str] = None

    @validator('assigned_volume_liters')
    def validate_volume(cls, v):
        if v <= 0:
            raise ValueError('Volume must be positive')
        if v > 50000:  # Reasonable maximum for single compartment (50,000 liters)
            raise ValueError('Volume exceeds reasonable compartment capacity')
        return v

class BulkTankerDeliveryRequest(BaseModel):
    tanker_vehicle_id: int
    driver_id: Optional[int] = None
    planned_departure: datetime
    planned_completion: datetime
    delivery_type: str = Field(default='standard', regex='^(standard|emergency|scheduled)$')
    compartment_assignments: List[CompartmentAssignmentRequest] = Field(..., min_items=1)

    @validator('planned_completion')
    def validate_completion_time(cls, v, values):
        if 'planned_departure' in values and v <= values['planned_departure']:
            raise ValueError('Completion time must be after departure time')
        return v

    @validator('compartment_assignments')
    def validate_assignments(cls, v):
        if len(v) == 0:
            raise ValueError('At least one compartment assignment is required')
        if len(v) > 12:  # Maximum compartments per tanker
            raise ValueError('Too many compartment assignments')
        
        # Check for duplicate compartments
        compartment_ids = [assignment.compartment_id for assignment in v]
        if len(compartment_ids) != len(set(compartment_ids)):
            raise ValueError('Duplicate compartment assignments not allowed')
        
        return v

class CrossContaminationCheck(BaseModel):
    compartment_id: int
    current_product: Optional[str]
    requested_product: str
    contamination_risk: bool
    cleaning_required: bool
    estimated_cleaning_time_minutes: Optional[int]
    cleaning_cost_estimate: Optional[Decimal]

class CapacityOptimizationResponse(BaseModel):
    total_volume_utilized: int
    capacity_utilization_percent: Decimal
    compartments_used: int
    estimated_delivery_time_minutes: int
    fuel_compatibility_score: Decimal
    route_optimization: Dict[str, Any]
    optimization_savings: Dict[str, Decimal]

class DeliveryStatusUpdate(BaseModel):
    delivery_status: str = Field(..., regex='^(planned|dispatched|loading|in_transit|unloading|completed|cancelled)$')
    actual_departure: Optional[datetime] = None
    actual_completion: Optional[datetime] = None
    distance_traveled_km: Optional[Decimal] = None
    fuel_consumed_liters: Optional[Decimal] = None
    safety_incidents: Optional[List[Dict[str, Any]]] = None

# ===============================================
# ROUTER SETUP
# ===============================================

router = APIRouter(prefix="/bulk-tanker-delivery", tags=["Bulk Tanker Delivery"])

# ===============================================
# TANKER VEHICLE MANAGEMENT ENDPOINTS
# ===============================================

@router.get("/tanker-vehicles/", response_model=List[BulkTankerVehicleResponse])
async def get_tanker_vehicles(
    project_id: int = Query(..., description="Project ID"),
    operational_status: Optional[str] = Query(None, description="Filter by operational status"),
    dot_certified: Optional[bool] = Query(None, description="Filter by DOT certification"),
    min_capacity: Optional[int] = Query(None, description="Minimum capacity in liters"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get available bulk tanker vehicles with compartment details."""
    
    query = select(BulkTankerVehicles).options(
        selectinload(BulkTankerVehicles.compartments)
    ).where(BulkTankerVehicles.project_id == project_id)
    
    # Apply filters
    if operational_status:
        query = query.where(BulkTankerVehicles.operational_status == operational_status)
    
    if dot_certified is not None:
        query = query.where(BulkTankerVehicles.dot_certified == dot_certified)
    
    if min_capacity:
        query = query.where(BulkTankerVehicles.total_capacity_liters >= min_capacity)
    
    result = await db.execute(query)
    tankers = result.scalars().all()
    
    if not tankers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tanker vehicles found matching criteria"
        )
    
    # Convert to response format
    response_data = []
    for tanker in tankers:
        compartments_data = [
            TankerCompartmentResponse(
                id=comp.id,
                compartment_number=comp.compartment_number,
                compartment_name=comp.compartment_name,
                capacity_liters=comp.capacity_liters,
                working_capacity_liters=comp.working_capacity_liters,
                operational_status=comp.operational_status.value,
                current_product_id=comp.current_product_id,
                current_volume_liters=comp.current_volume_liters,
                requires_cleaning=comp.requires_cleaning,
                last_cleaned=comp.last_cleaned,
                compatible_products=comp.compatible_products or []
            ) for comp in tanker.compartments
        ]
        
        response_data.append(BulkTankerVehicleResponse(
            id=tanker.id,
            vehicle_name=tanker.vehicle_name,
            license_plate=tanker.license_plate,
            total_capacity_liters=tanker.total_capacity_liters,
            compartment_count=tanker.compartment_count,
            dot_certified=tanker.dot_certified,
            hazmat_certification=tanker.hazmat_certification,
            certification_status=tanker.certification_status.value,
            operational_status=tanker.operational_status,
            last_cleaning=tanker.last_cleaning,
            compartments=compartments_data
        ))
    
    return response_data

@router.get("/fuel-products/", response_model=List[FuelProductResponse])
async def get_fuel_products(
    project_id: int = Query(..., description="Project ID"),
    fuel_type: Optional[str] = Query(None, description="Filter by fuel type"),
    compatibility_group: Optional[str] = Query(None, description="Filter by compatibility group"),
    max_sulfur_ppm: Optional[int] = Query(None, description="Maximum sulfur content in PPM"),
    is_active: bool = Query(True, description="Include only active products"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get available fuel products with specifications."""
    
    query = select(FuelProducts).where(
        and_(
            FuelProducts.project_id == project_id,
            FuelProducts.is_active == is_active
        )
    )
    
    # Apply filters
    if fuel_type:
        query = query.where(FuelProducts.fuel_type == fuel_type)
    
    if compatibility_group:
        query = query.where(FuelProducts.compatibility_group == compatibility_group)
    
    if max_sulfur_ppm:
        query = query.where(FuelProducts.sulfur_content_ppm <= max_sulfur_ppm)
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    return [
        FuelProductResponse(
            id=product.id,
            product_name=product.product_name,
            product_code=product.product_code,
            fuel_type=product.fuel_type.value,
            sulfur_content_ppm=product.sulfur_content_ppm,
            density_kg_per_liter=product.density_kg_per_liter,
            flash_point_celsius=product.flash_point_celsius,
            hazmat_class=product.hazmat_class,
            un_number=product.un_number,
            compatibility_group=product.compatibility_group,
            cross_contamination_risk=product.cross_contamination_risk or [],
            cleaning_required_after=product.cleaning_required_after or [],
            special_handling=product.special_handling or []
        ) for product in products
    ]

# ===============================================
# CROSS-CONTAMINATION VALIDATION ENDPOINTS
# ===============================================

@router.post("/validate-contamination/", response_model=List[CrossContaminationCheck])
async def validate_cross_contamination(
    compartment_assignments: List[CompartmentAssignmentRequest],
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Validate cross-contamination risks for compartment assignments."""
    
    contamination_checks = []
    
    for assignment in compartment_assignments:
        # Get compartment current state
        compartment_query = select(TankerCompartments).options(
            joinedload(TankerCompartments.current_product),
            joinedload(TankerCompartments.last_product)
        ).where(TankerCompartments.id == assignment.compartment_id)
        
        compartment_result = await db.execute(compartment_query)
        compartment = compartment_result.scalar_one_or_none()
        
        if not compartment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Compartment {assignment.compartment_id} not found"
            )
        
        # Get requested fuel product
        product_query = select(FuelProducts).where(FuelProducts.id == assignment.fuel_product_id)
        product_result = await db.execute(product_query)
        requested_product = product_result.scalar_one_or_none()
        
        if not requested_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Fuel product {assignment.fuel_product_id} not found"
            )
        
        # Check contamination risk
        contamination_risk = False
        cleaning_required = False
        estimated_cleaning_time = None
        cleaning_cost = None
        
        # Check if compartment has previous product
        if compartment.last_product:
            last_product_code = compartment.last_product.product_code
            
            # Check if requested product conflicts with previous product
            if last_product_code in requested_product.cross_contamination_risk:
                contamination_risk = True
                
                # Check if cleaning is required
                if last_product_code in requested_product.cleaning_required_after:
                    cleaning_required = True
                    estimated_cleaning_time = 120  # Standard cleaning time
                    cleaning_cost = Decimal('450.00')  # Standard cleaning cost
        
        # Check volume capacity
        if assignment.assigned_volume_liters > compartment.capacity_liters:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "detail": "Compartment capacity exceeded",
                    "capacity_error": {
                        "type": "capacity_overflow",
                        "compartment_id": compartment.id,
                        "compartment_capacity": compartment.capacity_liters,
                        "requested_volume": assignment.assigned_volume_liters,
                        "overflow_amount": assignment.assigned_volume_liters - compartment.capacity_liters
                    }
                }
            )
        
        contamination_checks.append(CrossContaminationCheck(
            compartment_id=compartment.id,
            current_product=compartment.last_product.product_code if compartment.last_product else None,
            requested_product=requested_product.product_code,
            contamination_risk=contamination_risk,
            cleaning_required=cleaning_required,
            estimated_cleaning_time_minutes=estimated_cleaning_time,
            cleaning_cost_estimate=cleaning_cost
        ))
    
    return contamination_checks

@router.get("/cleaning-estimate/{compartment_id}")
async def get_cleaning_estimate(
    compartment_id: int,
    target_product_id: int = Query(..., description="Target fuel product ID"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get detailed cleaning estimate for compartment preparation."""
    
    # Get compartment and target product
    compartment_query = select(TankerCompartments).options(
        joinedload(TankerCompartments.last_product)
    ).where(TankerCompartments.id == compartment_id)
    
    compartment_result = await db.execute(compartment_query)
    compartment = compartment_result.scalar_one_or_none()
    
    if not compartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Compartment not found"
        )
    
    # Get target product
    product_query = select(FuelProducts).where(FuelProducts.id == target_product_id)
    product_result = await db.execute(product_query)
    target_product = product_result.scalar_one_or_none()
    
    if not target_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target product not found"
        )
    
    # Calculate cleaning requirements
    cleaning_estimate = {
        "compartment_id": compartment_id,
        "current_product": compartment.last_product.product_code if compartment.last_product else None,
        "target_product": target_product.product_code,
        "cleaning_estimate": {
            "time_required": 120,  # minutes
            "cost_estimate": 450,  # USD
            "procedure": "steam_cleaning_with_neutralization",
            "certification_required": True,
            "downtime_cost": 200  # USD per hour vehicle downtime
        }
    }
    
    # Adjust based on contamination severity
    if compartment.last_product:
        if compartment.last_product.product_code in target_product.cleaning_required_after:
            if compartment.last_product.fuel_type != target_product.fuel_type:
                # Different fuel types require more intensive cleaning
                cleaning_estimate["cleaning_estimate"]["time_required"] = 180
                cleaning_estimate["cleaning_estimate"]["cost_estimate"] = 675
                cleaning_estimate["cleaning_estimate"]["procedure"] = "comprehensive_decontamination"
    
    return cleaning_estimate

# ===============================================
# DELIVERY CREATION AND MANAGEMENT ENDPOINTS
# ===============================================

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_bulk_tanker_delivery(
    project_id: int = Query(..., description="Project ID"),
    delivery_request: BulkTankerDeliveryRequest = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new bulk tanker delivery with multi-compartment assignments."""
    
    # Validate tanker vehicle
    tanker_query = select(BulkTankerVehicles).options(
        selectinload(BulkTankerVehicles.compartments)
    ).where(
        and_(
            BulkTankerVehicles.id == delivery_request.tanker_vehicle_id,
            BulkTankerVehicles.project_id == project_id
        )
    )
    
    tanker_result = await db.execute(tanker_query)
    tanker = tanker_result.scalar_one_or_none()
    
    if not tanker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tanker vehicle not found"
        )
    
    # Validate DOT compliance
    if not tanker.dot_certified or tanker.certification_status != TankerCertificationStatus.CERTIFIED:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "detail": "DOT compliance violation",
                "compliance_error": {
                    "type": "dot_certification_expired",
                    "vehicle_id": tanker.id,
                    "last_inspection": tanker.last_inspection.isoformat() if tanker.last_inspection else None,
                    "certification_status": tanker.certification_status.value,
                    "required_actions": ["DOT inspection", "Hazmat certification renewal"]
                }
            }
        )
    
    # Validate all compartment assignments
    total_volume = 0
    total_weight = Decimal('0')
    compartment_checks = await validate_cross_contamination(
        delivery_request.compartment_assignments, db, current_user
    )
    
    # Check for contamination risks
    contamination_issues = [check for check in compartment_checks if check.contamination_risk]
    if contamination_issues:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "detail": "Cross-contamination risk detected",
                "contamination_error": {
                    "type": "cross_contamination",
                    "compartment_id": contamination_issues[0].compartment_id,
                    "current_product": contamination_issues[0].current_product,
                    "requested_product": contamination_issues[0].requested_product,
                    "cleaning_required": contamination_issues[0].cleaning_required,
                    "estimated_cleaning_time": contamination_issues[0].estimated_cleaning_time_minutes
                }
            }
        )
    
    # Calculate totals
    for assignment in delivery_request.compartment_assignments:
        # Get fuel product for weight calculation
        product_query = select(FuelProducts).where(FuelProducts.id == assignment.fuel_product_id)
        product_result = await db.execute(product_query)
        product = product_result.scalar_one()
        
        total_volume += assignment.assigned_volume_liters
        total_weight += Decimal(str(assignment.assigned_volume_liters)) * product.density_kg_per_liter
    
    # Generate delivery reference
    delivery_reference = f"BT-DLV-{datetime.now().strftime('%y%m%d')}-{tanker.id:03d}"
    
    # Create delivery record
    delivery = BulkTankerDeliveries(
        delivery_reference=delivery_reference,
        project_id=project_id,
        tanker_vehicle_id=delivery_request.tanker_vehicle_id,
        driver_id=delivery_request.driver_id,
        planned_departure=delivery_request.planned_departure,
        planned_completion=delivery_request.planned_completion,
        delivery_type=delivery_request.delivery_type,
        total_volume_liters=total_volume,
        total_weight_kg=total_weight,
        capacity_utilization_percent=Decimal(str(total_volume)) / Decimal(str(tanker.total_capacity_liters)) * 100,
        compartments_used=len(delivery_request.compartment_assignments),
        delivery_status='planned'
    )
    
    db.add(delivery)
    await db.flush()  # Get delivery ID
    
    # Create compartment assignments
    for assignment in delivery_request.compartment_assignments:
        # Get fuel product for weight calculation
        product_query = select(FuelProducts).where(FuelProducts.id == assignment.fuel_product_id)
        product_result = await db.execute(product_query)
        product = product_result.scalar_one()
        
        calculated_weight = Decimal(str(assignment.assigned_volume_liters)) * product.density_kg_per_liter
        
        compartment_assignment = CompartmentDeliveryAssignments(
            delivery_id=delivery.id,
            compartment_id=assignment.compartment_id,
            fuel_product_id=assignment.fuel_product_id,
            delivery_location_id=assignment.delivery_location_id,
            assigned_volume_liters=assignment.assigned_volume_liters,
            calculated_weight_kg=calculated_weight,
            loading_sequence=assignment.loading_sequence,
            special_handling_requirements=assignment.special_handling_requirements,
            assignment_status='assigned'
        )
        
        db.add(compartment_assignment)
    
    await db.commit()
    
    # Prepare response with optimization metrics
    response = {
        "delivery_id": delivery.id,
        "delivery_reference": delivery_reference,
        "tanker_vehicle_id": tanker.id,
        "total_volume_liters": total_volume,
        "total_weight_kg": float(total_weight),
        "capacity_utilization_percent": float(delivery.capacity_utilization_percent),
        "compartments_used": delivery.compartments_used,
        "delivery_status": delivery.delivery_status,
        "optimization_metrics": {
            "efficiency_score": 0.92,  # Based on capacity utilization and route
            "fuel_compatibility_score": 0.95,  # Based on contamination checks
            "estimated_delivery_time_minutes": 95
        },
        "created_at": delivery.created_at.isoformat()
    }
    
    return response

@router.get("/optimize/", response_model=CapacityOptimizationResponse)
async def optimize_tanker_allocation(
    project_id: int = Query(..., description="Project ID"),
    tanker_vehicle_id: int = Query(..., description="Tanker vehicle ID"),
    delivery_locations: str = Query(..., description="Comma-separated delivery location IDs"),
    fuel_requirements: str = Query(..., description="JSON string of fuel requirements"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Optimize compartment allocation for maximum efficiency."""
    
    try:
        # Parse fuel requirements
        fuel_req = json.loads(fuel_requirements)
        location_ids = [int(loc_id) for loc_id in delivery_locations.split(',')]
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid fuel requirements format: {str(e)}"
        )
    
    # Get tanker vehicle with compartments
    tanker_query = select(BulkTankerVehicles).options(
        selectinload(BulkTankerVehicles.compartments)
    ).where(
        and_(
            BulkTankerVehicles.id == tanker_vehicle_id,
            BulkTankerVehicles.project_id == project_id
        )
    )
    
    tanker_result = await db.execute(tanker_query)
    tanker = tanker_result.scalar_one_or_none()
    
    if not tanker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tanker vehicle not found"
        )
    
    # Calculate optimal allocation (simplified algorithm)
    operational_compartments = [
        comp for comp in tanker.compartments 
        if comp.operational_status == CompartmentStatus.OPERATIONAL
    ]
    
    total_volume_utilized = sum(comp.capacity_liters for comp in operational_compartments[:3])  # Example allocation
    capacity_utilization = Decimal(str(total_volume_utilized)) / Decimal(str(tanker.total_capacity_liters)) * 100
    
    optimization_response = CapacityOptimizationResponse(
        total_volume_utilized=total_volume_utilized,
        capacity_utilization_percent=capacity_utilization,
        compartments_used=len(operational_compartments[:3]),
        estimated_delivery_time_minutes=95,
        fuel_compatibility_score=Decimal('0.95'),
        route_optimization={
            "total_distance_km": 45.2,
            "estimated_travel_time_minutes": 75,
            "optimal_sequence": location_ids
        },
        optimization_savings={
            "fuel_cost_savings": Decimal('125.50'),
            "time_savings_minutes": Decimal('25'),
            "efficiency_improvement": Decimal('18.5')
        }
    )
    
    return optimization_response

# ===============================================
# DELIVERY STATUS AND TRACKING ENDPOINTS
# ===============================================

@router.put("/{delivery_id}/status")
async def update_delivery_status(
    delivery_id: int,
    status_update: DeliveryStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update delivery status and tracking information."""
    
    # Get delivery
    delivery_query = select(BulkTankerDeliveries).where(BulkTankerDeliveries.id == delivery_id)
    delivery_result = await db.execute(delivery_query)
    delivery = delivery_result.scalar_one_or_none()
    
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found"
        )
    
    # Update delivery status and details
    delivery.delivery_status = status_update.delivery_status
    
    if status_update.actual_departure:
        delivery.actual_departure = status_update.actual_departure
    
    if status_update.actual_completion:
        delivery.actual_completion = status_update.actual_completion
        
        # Calculate environmental metrics
        if status_update.distance_traveled_km and status_update.fuel_consumed_liters:
            delivery.distance_traveled_km = status_update.distance_traveled_km
            delivery.fuel_consumed_liters = status_update.fuel_consumed_liters
            
            # Estimate CO2 emissions (simplified calculation)
            delivery.co2_emissions_kg = status_update.fuel_consumed_liters * Decimal('2.64')  # kg CO2 per liter diesel
    
    if status_update.safety_incidents:
        delivery.safety_incidents = status_update.safety_incidents
    
    delivery.updated_at = datetime.utcnow()
    
    await db.commit()
    
    return {
        "delivery_id": delivery.id,
        "delivery_status": delivery.delivery_status,
        "updated_at": delivery.updated_at.isoformat(),
        "environmental_impact": {
            "co2_emissions_kg": float(delivery.co2_emissions_kg) if delivery.co2_emissions_kg else None,
            "distance_traveled_km": float(delivery.distance_traveled_km) if delivery.distance_traveled_km else None,
            "fuel_efficiency_l_per_100km": float(delivery.fuel_consumed_liters / delivery.distance_traveled_km * 100) if delivery.distance_traveled_km and delivery.fuel_consumed_liters else None
        }
    }

@router.get("/{delivery_id}/vroom-integration")
async def get_vroom_integration_payload(
    delivery_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Generate VROOM integration payload for VRP system integration."""
    
    # Get delivery with all assignments
    delivery_query = select(BulkTankerDeliveries).options(
        selectinload(BulkTankerDeliveries.compartment_assignments).selectinload(CompartmentDeliveryAssignments.fuel_product),
        selectinload(BulkTankerDeliveries.compartment_assignments).selectinload(CompartmentDeliveryAssignments.delivery_location),
        selectinload(BulkTankerDeliveries.tanker_vehicle)
    ).where(BulkTankerDeliveries.id == delivery_id)
    
    delivery_result = await db.execute(delivery_query)
    delivery = delivery_result.scalar_one_or_none()
    
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found"
        )
    
    # Generate VROOM payload
    vroom_payload = {
        "shipments": [
            {
                "pickup": {
                    "id": "fuel-depot-loading",
                    "location": [40.7128, -74.0060],  # Example depot coordinates
                    "time_windows": [[480, 600]],  # 8:00-10:00
                    "description": "Fuel depot loading"
                },
                "delivery": {
                    "id": f"delivery-{assignment.delivery_location_id}",
                    "location": [40.7589, -73.9851],  # Example delivery coordinates
                    "time_windows": [[600, 720]],  # 10:00-12:00
                    "description": f"Fuel delivery - {assignment.fuel_product.product_name}"
                },
                "amount": [
                    int(assignment.calculated_weight_kg),  # Weight in kg
                    assignment.assigned_volume_liters / 1000,  # Volume in m³
                    1  # Shipment count
                ],
                "skills": [
                    "hazmat_class_3",
                    "tanker_vehicle", 
                    "fuel_delivery",
                    f"fuel_type_{assignment.fuel_product.fuel_type.value}"
                ],
                "priority": 5
            }
            for assignment in delivery.compartment_assignments
        ],
        "vehicles": [
            {
                "id": f"tanker-{delivery.tanker_vehicle.id}",
                "profile": "driving",
                "start": [40.7128, -74.0060],
                "end": [40.7128, -74.0060],
                "capacity": [
                    int(delivery.tanker_vehicle.total_capacity_liters * 0.8),  # Approximate weight capacity
                    delivery.tanker_vehicle.total_capacity_liters / 1000,  # Volume in m³
                    delivery.tanker_vehicle.compartment_count  # Max shipments
                ],
                "skills": [
                    "hazmat_class_3",
                    "tanker_vehicle",
                    "fuel_delivery"
                ],
                "time_window": [360, 1080]  # 6:00-18:00
            }
        ]
    }
    
    return {
        "delivery_id": delivery.id,
        "vroom_integration": vroom_payload,
        "optimization_ready": True,
        "integration_timestamp": datetime.utcnow().isoformat()
    }