from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# MPAD CLEANUP: Only import optimization-related routers
# All CRUD operations have been successfully transitioned to Supabase Edge Functions
from .api.v1.optimization import router as optimization_router
# Optional: Keep bulk_tanker_delivery if business decision is to retain
from .api.v1.bulk_tanker_delivery import router as bulk_tanker_router

app = FastAPI(
    title="VRP Optimization Engine",
    description="Vehicle Routing Problem Optimization Backend - VROOM Integration Only",
    version="3.0.0"
)

# Configure CORS - reduced scope for optimization-only backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://vrp-system.pages.dev",  # Production frontend
        "https://xzwsmladddtdgsrkiwlg.supabase.co"  # Supabase Edge Functions
    ],
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],  # Reduced to optimization methods only
    allow_headers=["*"],
)

# Include only optimization-related routers
app.include_router(optimization_router, prefix="/api/v1")
# Optional: Include bulk tanker if business decision is to retain complex logistics
app.include_router(bulk_tanker_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "VRP Optimization Engine", 
        "version": "3.0.0", 
        "status": "running",
        "purpose": "VROOM solver integration only",
        "architecture": "optimization_only",
        "features": ["optimization", "vroom_integration"],
        "crud_operations": "handled_by_supabase_edge_functions",
        "edge_functions_url": "https://xzwsmladddtdgsrkiwlg.supabase.co/functions/v1/"
    }

@app.get("/health")
async def health_check():
    """
    Health check focused on optimization engine status
    """
    from .core.vroom import vroom_service
    import time
    
    start_time = time.time()
    health_status = {
        "status": "healthy",
        "timestamp": int(time.time()),
        "environment": "optimization_only",
        "response_time_ms": 0,
        "services": {
            "optimization_api": {"status": "healthy", "details": "Optimization FastAPI server running"},
            "vroom_solver": {"status": "unknown", "details": "Checking VROOM engine..."}
        },
        "crud_operations": {
            "status": "delegated",
            "details": "All CRUD operations handled by Supabase Edge Functions",
            "edge_functions_url": "https://xzwsmladddtdgsrkiwlg.supabase.co/functions/v1/"
        }
    }
    
    # Check VROOM solver - this is the primary health indicator
    try:
        vroom_healthy = await vroom_service.health_check()
        if vroom_healthy:
            health_status["services"]["vroom_solver"] = {
                "status": "healthy", 
                "details": "VROOM optimization engine responding normally",
                "url": vroom_service.api_url
            }
        else:
            health_status["services"]["vroom_solver"] = {
                "status": "degraded", 
                "details": "VROOM engine not responding - optimization unavailable"
            }
            health_status["status"] = "degraded"
    except Exception as e:
        health_status["services"]["vroom_solver"] = {
            "status": "unhealthy", 
            "details": f"VROOM engine error: {str(e)}"
        }
        health_status["status"] = "unhealthy"
    
    # Calculate response time
    health_status["response_time_ms"] = round((time.time() - start_time) * 1000, 2)
    
    return health_status

@app.get("/api/v1/status")
async def optimization_status():
    """
    Detailed optimization engine status for monitoring
    """
    from .core.vroom import vroom_service
    import time
    import psutil
    
    start_time = time.time()
    
    # System performance metrics
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    
    status_response = {
        "overall_status": "healthy",
        "timestamp": int(time.time()),
        "architecture": "optimization_only",
        "system_metrics": {
            "cpu_usage_percent": cpu_percent,
            "memory_usage_percent": memory.percent,
            "memory_available_gb": round(memory.available / (1024**3), 2)
        },
        "services": {
            "optimization_engine": {
                "status": "healthy",
                "details": "Optimization FastAPI server operational",
                "version": "3.0.0",
                "purpose": "VROOM integration only"
            },
            "vroom_solver": {
                "status": "checking",
                "details": "Validating VROOM optimization engine...",
                "url": vroom_service.api_url
            }
        },
        "crud_operations": {
            "status": "delegated",
            "details": "All CRUD operations handled by Supabase Edge Functions",
            "edge_functions_url": "https://xzwsmladddtdgsrkiwlg.supabase.co/functions/v1/"
        }
    }
    
    # VROOM solver validation - critical for optimization-only backend
    try:
        vroom_healthy = await vroom_service.health_check()
        if vroom_healthy:
            status_response["services"]["vroom_solver"] = {
                "status": "healthy",
                "details": "VROOM optimization engine responding normally",
                "url": vroom_service.api_url,
                "timeout_config": "30 seconds"
            }
        else:
            status_response["services"]["vroom_solver"] = {
                "status": "degraded",
                "details": "VROOM engine not responding - optimization unavailable",
                "url": vroom_service.api_url,
                "recommendation": "Check VROOM service on port 30010"
            }
            status_response["overall_status"] = "degraded"
    except Exception as e:
        status_response["services"]["vroom_solver"] = {
            "status": "error",
            "details": f"VROOM engine health check failed: {str(e)}",
            "url": vroom_service.api_url,
            "recommendation": "Verify VROOM engine connectivity"
        }
        status_response["overall_status"] = "degraded"
    
    # Performance timing
    status_response["response_time_ms"] = round((time.time() - start_time) * 1000, 2)
    
    return status_response

@app.get("/api/v1/architecture")
async def architecture_info():
    """
    Architecture information endpoint
    """
    return {
        "architecture": "microservices_optimized",
        "backend_purpose": "optimization_only",
        "version": "3.0.0",
        "components": {
            "fastapi_backend": {
                "purpose": "VROOM solver integration",
                "responsibilities": ["optimization", "complex_calculations"],
                "port": 8000
            },
            "supabase_edge_functions": {
                "purpose": "CRUD operations",
                "responsibilities": ["projects", "vehicles", "jobs", "locations", "scenarios", "datasets", "products", "skills"],
                "url": "https://xzwsmladddtdgsrkiwlg.supabase.co/functions/v1/"
            },
            "vroom_solver": {
                "purpose": "optimization_engine",
                "responsibilities": ["route_optimization", "vrp_solving"],
                "port": 30010
            }
        },
        "data_flow": {
            "crud_operations": "Frontend → Supabase Edge Functions → PostgreSQL",
            "optimization": "Frontend → FastAPI → VROOM Solver → Results Storage"
        },
        "migration_status": {
            "vehicles_api": "transitioned_to_edge_functions",
            "projects_api": "transitioned_to_edge_functions",
            "scenarios_api": "transitioned_to_edge_functions",
            "datasets_api": "transitioned_to_edge_functions",
            "products_api": "transitioned_to_edge_functions",
            "skills_api": "transitioned_to_edge_functions",
            "optimization_api": "remains_in_fastapi",
            "bulk_tanker_api": "business_decision_pending"
        }
    }

@app.get("/api/v1/test")
async def test_endpoint():
    return {
        "message": "Optimization Engine API is working!", 
        "timestamp": "2025-06-22",
        "purpose": "VROOM optimization only",
        "crud_operations": "handled_by_edge_functions",
        "edge_functions_url": "https://xzwsmladddtdgsrkiwlg.supabase.co/functions/v1/"
    }
