from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.products import router as products_router
# from app.routes.budgets import router as budgets_router  # Old budget routes - commented out
from app.routes.teams import router as teams_router
# from app.routes.features import router as features_router  # Old - removed for V4
from app.routes.jira import router as jira_router
from app.routes.dashboard import router as dashboard_router
from app.routes.global_settings import router as global_settings_router
from app.routes.team_members import router as team_members_router
from app.routes.pis import router as pis_router
from app.routes.holidays import router as holidays_router
from app.routes.member_leaves import router as member_leaves_router
from app.routes.capacity import router as capacity_router
from app.routes.organization import router as organization_router
from app.routers.capacity_allocation import router as capacity_allocation_router
from app.routes.component_hats import router as component_hats_router
from app.routes.member_leave import router as member_leave_router
from app.routes.site_holidays import router as site_holidays_router
from app.routes.pi_allocations import router as pi_allocations_router
from app.routers.budget_config import router as budget_config_router
from app.routers.budget_dashboard import router as budget_dashboard_router
# Old roadmap routes removed - replaced with V4
from app.routes.features_v4 import router as features_v4_router
from app.database import engine, Base

# Create tables - DISABLED: Using SQL migrations instead
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Amadeus Elevate API",
    description="API for managing SAFe train budgets, capacity, and features",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(products_router)
# app.include_router(budgets_router)  # Old budget router - commented out
app.include_router(teams_router)
app.include_router(team_members_router)
# app.include_router(features_router)  # Old - removed for V4
app.include_router(jira_router)
app.include_router(dashboard_router)
app.include_router(global_settings_router)
app.include_router(pis_router)
app.include_router(holidays_router)
app.include_router(member_leaves_router)
app.include_router(capacity_router)
app.include_router(organization_router)
app.include_router(capacity_allocation_router)
app.include_router(component_hats_router)
app.include_router(member_leave_router)
app.include_router(site_holidays_router)
app.include_router(pi_allocations_router)
app.include_router(budget_config_router)
app.include_router(budget_dashboard_router)
# Old roadmap routes removed - replaced with V4
app.include_router(features_v4_router)


@app.get("/health", tags=["health"])
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "safe-train-manager-api"}


@app.get("/", tags=["root"])
def root():
    """Root endpoint with API info."""
    return {
        "name": "Amadeus Elevate API",
        "version": "1.0.0",
        "docs": "/docs"
    }
