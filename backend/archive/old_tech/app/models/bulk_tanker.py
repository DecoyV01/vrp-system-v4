"""
Bulk Tanker Database Models
MPAD Implementation: Real-World Fuel Logistics - Multi-Compartment Tanker Management

SQLAlchemy models for bulk fuel tanker operations supporting multi-compartment
vehicles with cross-contamination prevention and fuel specification compliance.

Based on industry research:
- Multi-compartment tankers (2-6 compartments typical, up to 12 for specialized)
- Fuel specifications: Diesel 10ppm/50ppm, Petrol 50ppm/500ppm sulfur content
- DOT compliance and hazmat certification requirements
- Cross-contamination prevention protocols
"""

from sqlalchemy import (
    Column, Integer, String, DECIMAL, Boolean, Text, 
    DateTime, ForeignKey, CheckConstraint, UniqueConstraint,
    Index, func, Enum
)
from sqlalchemy.dialects.postgresql import JSONB, UUID, ARRAY
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

from app.database.connection import Base

# ===============================================
# ENUMS FOR FUEL LOGISTICS
# ===============================================

class FuelType(enum.Enum):
    """Fuel type classifications based on industry standards."""
    DIESEL = "diesel"
    PETROL = "petrol"
    KEROSENE = "kerosene"
    JET_FUEL = "jet_fuel"
    HEATING_OIL = "heating_oil"
    MARINE_FUEL = "marine_fuel"
    BIOFUEL = "biofuel"

class CompartmentStatus(enum.Enum):
    """Compartment operational status."""
    OPERATIONAL = "operational"
    MAINTENANCE_REQUIRED = "maintenance_required"
    FAILED = "failed"
    CLEANING_IN_PROGRESS = "cleaning_in_progress"
    OUT_OF_SERVICE = "out_of_service"

class TankerCertificationStatus(enum.Enum):
    """DOT and regulatory certification status."""
    CERTIFIED = "certified"
    EXPIRED = "expired"
    SUSPENDED = "suspended"
    PENDING_RENEWAL = "pending_renewal"

# ===============================================
# BULK TANKER VEHICLES TABLE
# ===============================================

class BulkTankerVehicles(Base):
    """
    Bulk tanker vehicle registry with multi-compartment support.
    
    Manages specialized fuel transport vehicles with detailed compartment
    configurations, DOT compliance tracking, and operational status.
    """
    __tablename__ = "bulk_tanker_vehicles"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Vehicle identification
    vehicle_name = Column(String(100), nullable=False, index=True)
    license_plate = Column(String(20), nullable=False, unique=True, index=True)
    vin_number = Column(String(17), nullable=True, unique=True)
    manufacturer = Column(String(50), nullable=True)
    model = Column(String(50), nullable=True)
    year_manufactured = Column(Integer, nullable=True)
    
    # Project association
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Capacity specifications
    total_capacity_liters = Column(Integer, nullable=False)
    compartment_count = Column(Integer, nullable=False)
    max_gross_weight_kg = Column(Integer, nullable=True)
    
    # DOT and regulatory compliance
    dot_certified = Column(Boolean, nullable=False, default=False)
    dot_number = Column(String(20), nullable=True, index=True)
    hazmat_certification = Column(Boolean, nullable=False, default=False)
    certification_status = Column(Enum(TankerCertificationStatus), nullable=False, default=TankerCertificationStatus.PENDING_RENEWAL)
    last_inspection = Column(DateTime, nullable=True)
    inspection_expiry = Column(DateTime, nullable=True)
    hazmat_expiry = Column(DateTime, nullable=True)
    
    # Operational details
    current_driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True, index=True)
    operational_status = Column(String(50), nullable=False, default='available', index=True)
    last_cleaning = Column(DateTime, nullable=True)
    next_maintenance = Column(DateTime, nullable=True)
    
    # Insurance and safety
    insurance_policy_number = Column(String(50), nullable=True)
    insurance_expiry = Column(DateTime, nullable=True)
    safety_equipment = Column(JSONB, nullable=False, default=list)  # ['fire_extinguisher', 'spill_kits', 'grounding_equipment']
    
    # Location tracking
    current_location = Column(JSONB, nullable=True)  # {'lat': 40.7128, 'lng': -74.0060, 'timestamp': '2025-06-21T10:00:00Z'}
    home_depot_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    
    # System fields
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID, ForeignKey("auth.users.id"), nullable=True)
    
    # Relationships
    project = relationship("Projects", back_populates="bulk_tanker_vehicles")
    compartments = relationship("TankerCompartments", back_populates="tanker_vehicle", cascade="all, delete-orphan")
    deliveries = relationship("BulkTankerDeliveries", back_populates="tanker_vehicle")
    current_driver = relationship("Drivers", foreign_keys=[current_driver_id], backref="assigned_tankers")
    home_depot = relationship("Locations", foreign_keys=[home_depot_id], backref="based_tankers")
    
    # Constraints
    __table_args__ = (
        # Capacity validation
        CheckConstraint('total_capacity_liters > 0', name='tanker_capacity_positive'),
        CheckConstraint('compartment_count BETWEEN 1 AND 12', name='tanker_compartment_count_valid'),
        CheckConstraint('max_gross_weight_kg IS NULL OR max_gross_weight_kg > 0', name='tanker_weight_positive'),
        
        # Status validation
        CheckConstraint(
            "operational_status IN ('available', 'in_transit', 'loading', 'unloading', 'maintenance', 'out_of_service')",
            name='tanker_status_valid'
        ),
        
        # Performance indexes
        Index('idx_tankers_project_status', 'project_id', 'operational_status'),
        Index('idx_tankers_certification', 'dot_certified', 'hazmat_certification'),
        Index('idx_tankers_location', 'project_id', 'current_location'),
    )

    def __repr__(self):
        return f"<BulkTankerVehicle(id={self.id}, name='{self.vehicle_name}', plate='{self.license_plate}')>"

# ===============================================
# TANKER COMPARTMENTS TABLE
# ===============================================

class TankerCompartments(Base):
    """
    Individual compartments within bulk tanker vehicles.
    
    Tracks compartment-specific details including capacity, current product,
    cleaning status, and operational condition for cross-contamination prevention.
    """
    __tablename__ = "tanker_compartments"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Tanker association
    tanker_vehicle_id = Column(Integer, ForeignKey("bulk_tanker_vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    compartment_number = Column(Integer, nullable=False)
    compartment_name = Column(String(20), nullable=False)  # 'Comp-1', 'A-Tank', etc.
    
    # Capacity specifications
    capacity_liters = Column(Integer, nullable=False)
    working_capacity_liters = Column(Integer, nullable=True)  # Usable capacity (accounting for safety margins)
    
    # Current status
    operational_status = Column(Enum(CompartmentStatus), nullable=False, default=CompartmentStatus.OPERATIONAL)
    current_product_id = Column(Integer, ForeignKey("fuel_products.id"), nullable=True, index=True)
    current_volume_liters = Column(Integer, nullable=False, default=0)
    last_product_id = Column(Integer, ForeignKey("fuel_products.id"), nullable=True)  # For contamination tracking
    
    # Cleaning and maintenance
    last_cleaned = Column(DateTime, nullable=True)
    cleaning_procedure_used = Column(String(100), nullable=True)  # 'steam_cleaning', 'solvent_wash', etc.
    cleaning_certification = Column(String(50), nullable=True)
    requires_cleaning = Column(Boolean, nullable=False, default=False)
    
    # Physical specifications
    compartment_location = Column(String(20), nullable=True)  # 'front', 'middle', 'rear'
    dedicated_product_type = Column(Enum(FuelType), nullable=True)  # Some compartments are dedicated to specific fuel types
    compatible_products = Column(ARRAY(String), nullable=False, default=list)  # Compatible fuel product codes
    
    # Safety equipment
    emergency_shutoff = Column(Boolean, nullable=False, default=True)
    pressure_relief_valve = Column(Boolean, nullable=False, default=True)
    overfill_protection = Column(Boolean, nullable=False, default=True)
    
    # System fields
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tanker_vehicle = relationship("BulkTankerVehicles", back_populates="compartments")
    current_product = relationship("FuelProducts", foreign_keys=[current_product_id], backref="current_compartments")
    last_product = relationship("FuelProducts", foreign_keys=[last_product_id], backref="previous_compartments")
    delivery_assignments = relationship("CompartmentDeliveryAssignments", back_populates="compartment")
    
    # Constraints
    __table_args__ = (
        # Unique compartment per tanker
        UniqueConstraint('tanker_vehicle_id', 'compartment_number', name='compartment_number_unique'),
        UniqueConstraint('tanker_vehicle_id', 'compartment_name', name='compartment_name_unique'),
        
        # Capacity validation
        CheckConstraint('capacity_liters > 0', name='compartment_capacity_positive'),
        CheckConstraint('current_volume_liters >= 0', name='compartment_volume_non_negative'),
        CheckConstraint('current_volume_liters <= capacity_liters', name='compartment_volume_within_capacity'),
        CheckConstraint('working_capacity_liters IS NULL OR working_capacity_liters <= capacity_liters', name='working_capacity_valid'),
        
        # Compartment numbering
        CheckConstraint('compartment_number > 0', name='compartment_number_positive'),
        
        # Performance indexes
        Index('idx_compartments_tanker_status', 'tanker_vehicle_id', 'operational_status'),
        Index('idx_compartments_product', 'current_product_id'),
        Index('idx_compartments_cleaning', 'requires_cleaning', 'last_cleaned'),
    )

    def __repr__(self):
        return f"<TankerCompartment(id={self.id}, tanker_id={self.tanker_vehicle_id}, name='{self.compartment_name}')>"

# ===============================================
# FUEL PRODUCTS TABLE
# ===============================================

class FuelProducts(Base):
    """
    Fuel product specifications and compatibility matrix.
    
    Defines fuel products with detailed specifications including sulfur content,
    density, flash point, and cross-contamination compatibility rules.
    """
    __tablename__ = "fuel_products"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Project association
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Product identification
    product_name = Column(String(100), nullable=False, index=True)
    product_code = Column(String(20), nullable=False, index=True)
    fuel_type = Column(Enum(FuelType), nullable=False, index=True)
    
    # Fuel specifications (based on industry standards)
    sulfur_content_ppm = Column(DECIMAL(8, 2), nullable=False)  # Parts per million
    density_kg_per_liter = Column(DECIMAL(6, 4), nullable=False)  # At 15°C
    flash_point_celsius = Column(Integer, nullable=True)
    cetane_number = Column(DECIMAL(4, 1), nullable=True)  # For diesel fuels
    octane_number = Column(DECIMAL(4, 1), nullable=True)  # For petrol fuels
    reid_vapor_pressure = Column(DECIMAL(4, 2), nullable=True)  # kPa at 37.8°C
    
    # Hazmat classification
    hazmat_class = Column(String(10), nullable=False)  # UN hazmat class (e.g., '3')
    un_number = Column(String(10), nullable=False)  # UN identification number
    packaging_group = Column(String(10), nullable=True)  # I, II, or III
    
    # Compatibility and contamination
    compatibility_group = Column(String(50), nullable=False, index=True)  # 'diesel_group', 'petrol_group', etc.
    cross_contamination_risk = Column(ARRAY(String), nullable=False, default=list)  # Product codes that cause contamination
    cleaning_required_after = Column(ARRAY(String), nullable=False, default=list)  # Products requiring cleaning
    max_contamination_ppm = Column(Integer, nullable=True, default=10)  # Maximum allowable contamination
    
    # Environmental and regulatory
    biodiesel_content_percent = Column(DECIMAL(4, 2), nullable=True)
    ethanol_content_percent = Column(DECIMAL(4, 2), nullable=True)
    environmental_grade = Column(String(20), nullable=True)  # 'euro_vi', 'tier_3', etc.
    
    # Handling requirements
    temperature_requirements = Column(JSONB, nullable=True)  # {'min_temp': -10, 'max_temp': 50, 'handling_temp': 15}
    special_handling = Column(ARRAY(String), nullable=False, default=list)  # ['temperature_controlled', 'static_protection']
    storage_stability_days = Column(Integer, nullable=True)
    
    # Cost and pricing
    base_cost_per_liter = Column(DECIMAL(8, 4), nullable=True)
    density_adjustment_factor = Column(DECIMAL(6, 4), nullable=True, default=1.0)
    
    # System fields
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID, ForeignKey("auth.users.id"), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Relationships
    project = relationship("Projects", back_populates="fuel_products")
    delivery_assignments = relationship("CompartmentDeliveryAssignments", back_populates="fuel_product")
    quality_tests = relationship("FuelQualityTests", back_populates="fuel_product")
    
    # Constraints
    __table_args__ = (
        # Unique product code per project
        UniqueConstraint('project_id', 'product_code', name='fuel_product_code_unique'),
        
        # Specification validation
        CheckConstraint('sulfur_content_ppm >= 0', name='sulfur_content_positive'),
        CheckConstraint('density_kg_per_liter > 0', name='density_positive'),
        CheckConstraint('flash_point_celsius >= -50 AND flash_point_celsius <= 300', name='flash_point_realistic'),
        CheckConstraint('cetane_number IS NULL OR cetane_number BETWEEN 30 AND 80', name='cetane_number_valid'),
        CheckConstraint('octane_number IS NULL OR octane_number BETWEEN 80 AND 130', name='octane_number_valid'),
        CheckConstraint('biodiesel_content_percent IS NULL OR biodiesel_content_percent BETWEEN 0 AND 100', name='biodiesel_content_valid'),
        CheckConstraint('ethanol_content_percent IS NULL OR ethanol_content_percent BETWEEN 0 AND 100', name='ethanol_content_valid'),
        
        # Performance indexes
        Index('idx_fuel_products_type_project', 'fuel_type', 'project_id'),
        Index('idx_fuel_products_compatibility', 'compatibility_group'),
        Index('idx_fuel_products_sulfur', 'sulfur_content_ppm'),
        Index('idx_fuel_products_active', 'is_active', 'project_id'),
    )

    def __repr__(self):
        return f"<FuelProduct(id={self.id}, code='{self.product_code}', name='{self.product_name}')>"

# ===============================================
# BULK TANKER DELIVERIES TABLE
# ===============================================

class BulkTankerDeliveries(Base):
    """
    Bulk tanker delivery operations with multi-compartment coordination.
    
    Manages complete delivery operations involving multiple fuel products,
    route optimization, and regulatory compliance tracking.
    """
    __tablename__ = "bulk_tanker_deliveries"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Delivery identification
    delivery_reference = Column(String(50), nullable=False, unique=True, index=True)
    delivery_type = Column(String(30), nullable=False, default='standard', index=True)  # 'standard', 'emergency', 'scheduled'
    
    # Project and vehicle association
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    tanker_vehicle_id = Column(Integer, ForeignKey("bulk_tanker_vehicles.id", ondelete="RESTRICT"), nullable=False, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True, index=True)
    
    # Delivery planning
    planned_departure = Column(DateTime, nullable=False)
    planned_completion = Column(DateTime, nullable=False)
    route_optimization_data = Column(JSONB, nullable=True)  # VROOM integration payload
    
    # Capacity and load details
    total_volume_liters = Column(Integer, nullable=False, default=0)
    total_weight_kg = Column(DECIMAL(10, 2), nullable=False, default=0)
    capacity_utilization_percent = Column(DECIMAL(5, 2), nullable=True)
    compartments_used = Column(Integer, nullable=False, default=0)
    
    # Status tracking
    delivery_status = Column(String(30), nullable=False, default='planned', index=True)
    # Status progression: planned → dispatched → loading → in_transit → unloading → completed → cancelled
    
    # Operational details
    actual_departure = Column(DateTime, nullable=True)
    actual_completion = Column(DateTime, nullable=True)
    distance_traveled_km = Column(DECIMAL(8, 2), nullable=True)
    fuel_consumed_liters = Column(DECIMAL(8, 2), nullable=True)
    
    # Environmental impact
    co2_emissions_kg = Column(DECIMAL(8, 2), nullable=True)
    nox_emissions_g = Column(DECIMAL(8, 2), nullable=True)
    particulate_matter_g = Column(DECIMAL(8, 2), nullable=True)
    
    # Financial tracking
    estimated_cost = Column(DECIMAL(10, 2), nullable=True)
    actual_cost = Column(DECIMAL(10, 2), nullable=True)
    fuel_cost = Column(DECIMAL(10, 2), nullable=True)
    driver_cost = Column(DECIMAL(10, 2), nullable=True)
    
    # Compliance and safety
    regulatory_compliance_check = Column(JSONB, nullable=True)  # DOT, hazmat, insurance validations
    safety_incidents = Column(JSONB, nullable=False, default=list)
    emergency_contacts = Column(JSONB, nullable=True)
    
    # System fields
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID, ForeignKey("auth.users.id"), nullable=True)
    
    # Relationships
    project = relationship("Projects", back_populates="bulk_tanker_deliveries")
    tanker_vehicle = relationship("BulkTankerVehicles", back_populates="deliveries")
    driver = relationship("Drivers", backref="bulk_deliveries")
    compartment_assignments = relationship("CompartmentDeliveryAssignments", back_populates="delivery", cascade="all, delete-orphan")
    quality_tests = relationship("FuelQualityTests", back_populates="delivery")
    
    # Constraints
    __table_args__ = (
        # Volume and weight validation
        CheckConstraint('total_volume_liters >= 0', name='delivery_volume_positive'),
        CheckConstraint('total_weight_kg >= 0', name='delivery_weight_positive'),
        CheckConstraint('capacity_utilization_percent IS NULL OR capacity_utilization_percent BETWEEN 0 AND 100', name='utilization_valid'),
        CheckConstraint('compartments_used >= 0', name='compartments_used_positive'),
        
        # Timing validation
        CheckConstraint('planned_departure < planned_completion', name='delivery_timing_valid'),
        CheckConstraint('actual_departure IS NULL OR actual_completion IS NULL OR actual_departure <= actual_completion', name='actual_timing_valid'),
        
        # Status validation
        CheckConstraint(
            "delivery_status IN ('planned', 'dispatched', 'loading', 'in_transit', 'unloading', 'completed', 'cancelled')",
            name='delivery_status_valid'
        ),
        
        # Performance indexes
        Index('idx_deliveries_project_status', 'project_id', 'delivery_status'),
        Index('idx_deliveries_tanker_date', 'tanker_vehicle_id', 'planned_departure'),
        Index('idx_deliveries_driver_date', 'driver_id', 'planned_departure'),
        Index('idx_deliveries_timeline', 'planned_departure', 'planned_completion'),
    )

    def __repr__(self):
        return f"<BulkTankerDelivery(id={self.id}, ref='{self.delivery_reference}', status='{self.delivery_status}')>"

# ===============================================
# COMPARTMENT DELIVERY ASSIGNMENTS TABLE
# ===============================================

class CompartmentDeliveryAssignments(Base):
    """
    Assignment of fuel products to specific compartments for deliveries.
    
    Tracks the allocation of fuel products to tanker compartments with
    volume specifications, delivery locations, and sequence information.
    """
    __tablename__ = "compartment_delivery_assignments"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    delivery_id = Column(Integer, ForeignKey("bulk_tanker_deliveries.id", ondelete="CASCADE"), nullable=False, index=True)
    compartment_id = Column(Integer, ForeignKey("tanker_compartments.id", ondelete="RESTRICT"), nullable=False, index=True)
    fuel_product_id = Column(Integer, ForeignKey("fuel_products.id", ondelete="RESTRICT"), nullable=False, index=True)
    delivery_location_id = Column(Integer, ForeignKey("locations.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    # Volume and calculations
    assigned_volume_liters = Column(Integer, nullable=False)
    calculated_weight_kg = Column(DECIMAL(10, 2), nullable=False)
    loading_sequence = Column(Integer, nullable=True)
    unloading_sequence = Column(Integer, nullable=True)
    
    # Delivery timing
    estimated_loading_time = Column(DateTime, nullable=True)
    estimated_delivery_time = Column(DateTime, nullable=True)
    actual_loading_time = Column(DateTime, nullable=True)
    actual_delivery_time = Column(DateTime, nullable=True)
    
    # Service details
    loading_duration_minutes = Column(Integer, nullable=True)
    unloading_duration_minutes = Column(Integer, nullable=True)
    delivery_rate_lpm = Column(Integer, nullable=True)  # Liters per minute
    
    # Quality control
    pre_loading_seal_number = Column(String(20), nullable=True)
    post_delivery_seal_number = Column(String(20), nullable=True)
    temperature_at_loading = Column(DECIMAL(5, 2), nullable=True)
    temperature_at_delivery = Column(DECIMAL(5, 2), nullable=True)
    
    # Status and completion
    assignment_status = Column(String(30), nullable=False, default='assigned', index=True)
    # Status: assigned → loading → loaded → in_transit → unloading → delivered → completed
    delivery_confirmation = Column(String(100), nullable=True)  # Customer signature/confirmation
    
    # Special instructions
    special_handling_requirements = Column(Text, nullable=True)
    safety_notes = Column(Text, nullable=True)
    
    # System fields
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    delivery = relationship("BulkTankerDeliveries", back_populates="compartment_assignments")
    compartment = relationship("TankerCompartments", back_populates="delivery_assignments")
    fuel_product = relationship("FuelProducts", back_populates="delivery_assignments")
    delivery_location = relationship("Locations", backref="fuel_deliveries")
    
    # Constraints
    __table_args__ = (
        # Unique assignment per delivery-compartment
        UniqueConstraint('delivery_id', 'compartment_id', name='delivery_compartment_unique'),
        
        # Volume validation
        CheckConstraint('assigned_volume_liters > 0', name='assignment_volume_positive'),
        CheckConstraint('calculated_weight_kg >= 0', name='assignment_weight_positive'),
        
        # Sequence validation
        CheckConstraint('loading_sequence IS NULL OR loading_sequence > 0', name='loading_sequence_positive'),
        CheckConstraint('unloading_sequence IS NULL OR unloading_sequence > 0', name='unloading_sequence_positive'),
        
        # Duration validation
        CheckConstraint('loading_duration_minutes IS NULL OR loading_duration_minutes >= 0', name='loading_duration_positive'),
        CheckConstraint('unloading_duration_minutes IS NULL OR unloading_duration_minutes >= 0', name='unloading_duration_positive'),
        CheckConstraint('delivery_rate_lpm IS NULL OR delivery_rate_lpm > 0', name='delivery_rate_positive'),
        
        # Status validation
        CheckConstraint(
            "assignment_status IN ('assigned', 'loading', 'loaded', 'in_transit', 'unloading', 'delivered', 'completed')",
            name='assignment_status_valid'
        ),
        
        # Performance indexes
        Index('idx_assignments_delivery_sequence', 'delivery_id', 'loading_sequence'),
        Index('idx_assignments_compartment', 'compartment_id', 'assignment_status'),
        Index('idx_assignments_location_time', 'delivery_location_id', 'estimated_delivery_time'),
        Index('idx_assignments_product', 'fuel_product_id'),
    )

    def __repr__(self):
        return f"<CompartmentDeliveryAssignment(id={self.id}, delivery_id={self.delivery_id}, compartment_id={self.compartment_id})>"

# ===============================================
# FUEL QUALITY TESTS TABLE
# ===============================================

class FuelQualityTests(Base):
    """
    Fuel quality test results and compliance tracking.
    
    Records fuel quality test results for batch tracking, compliance
    verification, and contamination detection in bulk fuel operations.
    """
    __tablename__ = "fuel_quality_tests"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Test identification
    test_reference = Column(String(50), nullable=False, unique=True, index=True)
    batch_number = Column(String(50), nullable=False, index=True)
    test_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    test_laboratory = Column(String(100), nullable=True)
    
    # Associations
    fuel_product_id = Column(Integer, ForeignKey("fuel_products.id", ondelete="RESTRICT"), nullable=False, index=True)
    delivery_id = Column(Integer, ForeignKey("bulk_tanker_deliveries.id", ondelete="SET NULL"), nullable=True, index=True)
    compartment_id = Column(Integer, ForeignKey("tanker_compartments.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Test results (key specifications)
    sulfur_content_ppm = Column(DECIMAL(8, 2), nullable=True)
    density_15c = Column(DECIMAL(6, 4), nullable=True)
    flash_point_celsius = Column(Integer, nullable=True)
    cetane_number = Column(DECIMAL(4, 1), nullable=True)
    octane_number = Column(DECIMAL(4, 1), nullable=True)
    water_content_percent = Column(DECIMAL(6, 4), nullable=True)
    sediment_content_percent = Column(DECIMAL(6, 4), nullable=True)
    reid_vapor_pressure = Column(DECIMAL(4, 2), nullable=True)
    
    # Contamination testing
    contamination_detected = Column(Boolean, nullable=False, default=False)
    contamination_type = Column(String(50), nullable=True)
    contamination_level_ppm = Column(DECIMAL(8, 2), nullable=True)
    
    # Compliance status
    test_status = Column(String(20), nullable=False, default='pending', index=True)  # pending, pass, fail, retest
    compliance_standard = Column(String(50), nullable=True)  # 'EN_590', 'ASTM_D975', etc.
    failed_parameters = Column(ARRAY(String), nullable=False, default=list)
    
    # Validity and actions
    expiry_date = Column(DateTime, nullable=True)
    remedial_actions = Column(ARRAY(String), nullable=False, default=list)
    retest_required = Column(Boolean, nullable=False, default=False)
    approved_for_delivery = Column(Boolean, nullable=False, default=False)
    
    # Additional test data
    additional_parameters = Column(JSONB, nullable=True)  # Other test parameters as key-value pairs
    test_equipment = Column(String(100), nullable=True)
    test_method = Column(String(50), nullable=True)
    
    # System fields
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    tested_by = Column(UUID, ForeignKey("auth.users.id"), nullable=True)
    approved_by = Column(UUID, ForeignKey("auth.users.id"), nullable=True)
    
    # Relationships
    fuel_product = relationship("FuelProducts", back_populates="quality_tests")
    delivery = relationship("BulkTankerDeliveries", back_populates="quality_tests")
    compartment = relationship("TankerCompartments", backref="quality_tests")
    
    # Constraints
    __table_args__ = (
        # Test result validation
        CheckConstraint('sulfur_content_ppm IS NULL OR sulfur_content_ppm >= 0', name='test_sulfur_positive'),
        CheckConstraint('density_15c IS NULL OR density_15c > 0', name='test_density_positive'),
        CheckConstraint('water_content_percent IS NULL OR water_content_percent BETWEEN 0 AND 100', name='test_water_valid'),
        CheckConstraint('sediment_content_percent IS NULL OR sediment_content_percent BETWEEN 0 AND 100', name='test_sediment_valid'),
        CheckConstraint('contamination_level_ppm IS NULL OR contamination_level_ppm >= 0', name='contamination_level_positive'),
        
        # Status validation
        CheckConstraint(
            "test_status IN ('pending', 'pass', 'fail', 'retest', 'cancelled')",
            name='test_status_valid'
        ),
        
        # Performance indexes
        Index('idx_quality_tests_batch', 'batch_number', 'test_date'),
        Index('idx_quality_tests_product_status', 'fuel_product_id', 'test_status'),
        Index('idx_quality_tests_delivery', 'delivery_id', 'approved_for_delivery'),
        Index('idx_quality_tests_contamination', 'contamination_detected', 'contamination_type'),
    )

    def __repr__(self):
        return f"<FuelQualityTest(id={self.id}, ref='{self.test_reference}', status='{self.test_status}')>"

# ===============================================
# EXTEND EXISTING MODELS
# ===============================================

def extend_existing_models():
    """Extend existing models with bulk tanker relationships."""
    
    # Add to Projects model
    if hasattr(Base, '_sa_registry') and 'Projects' in [cls.__name__ for cls in Base._sa_registry.data.values()]:
        Projects = next(cls for cls in Base._sa_registry.data.values() if cls.__name__ == 'Projects')
        if not hasattr(Projects, 'bulk_tanker_vehicles'):
            Projects.bulk_tanker_vehicles = relationship("BulkTankerVehicles", back_populates="project", cascade="all, delete-orphan")
            Projects.fuel_products = relationship("FuelProducts", back_populates="project", cascade="all, delete-orphan")
            Projects.bulk_tanker_deliveries = relationship("BulkTankerDeliveries", back_populates="project", cascade="all, delete-orphan")
    
    # Note: Other relationships are defined directly in the foreign key declarations

# Extend models when module is imported
try:
    extend_existing_models()
except Exception:
    # Models may not exist yet during initial migration
    pass