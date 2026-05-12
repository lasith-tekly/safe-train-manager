import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.products import router as products_router
# from app.routes.budgets import router as budgets_router  # Old budget routes - commented out
from app.routes.teams import router as teams_router
# from app.routes.features import router as features_router  # Old - removed for V4
from app.routes.jira import router as jira_router
# from app.routes.dashboard import router as dashboard_router  # Legacy — disabled
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
from app.routes.jira_v4 import router as jira_v4_router
from app.routes.validation_v4 import router as validation_v4_router
from app.routes.roadmap_versions import router as roadmap_versions_router
from app.routes.jira_records import router as jira_records_router
from app.routes.deviation import router as deviation_router
from app.routes.alignment import router as alignment_router
from app.routes.team_planning import router as team_planning_router
from app.routes.pm_review import router as pm_review_router
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.trains import router as trains_router
from app.services.auth_service import seed_admin_user
from app.database import engine, Base

# Import all models to register them with Base before creating tables
from app.models.auth import User, UserTeamAssignment, UserTrainAssignment  # noqa: F401
from app.models.train import Train  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.team import Team, TeamCapacity, TeamMember, MemberQuarterlyAvailability, MemberPIAllocation, ComponentHat, SiteHoliday  # noqa: F401
from app.models.pi import PI  # noqa: F401
from app.models.holiday import Holiday, MemberLeave  # noqa: F401
from app.models.organization import Country, Site  # noqa: F401
from app.models.capacity import TeamIterationCapacity  # noqa: F401
from app.models.capacity_allocation import CapacityAllocationCategory  # noqa: F401
from app.models.member_iteration_productivity import MemberIterationProductivity  # noqa: F401
from app.models.budget_new import FiscalYear, BudgetVersion, ProductBudget, BudgetLine, BudgetCategory, BudgetLineProduct, BudgetAuditLog, PIBudgetPlan  # noqa: F401
from app.models.roadmap_v4 import RoadmapFeature, FeatureQuarterlyAllocation, FeatureTeam, JIRARecord, JIRAQuarterlyAllocation  # noqa: F401
from app.models.roadmap_version import RoadmapVersion  # noqa: F401
from app.models.feature_budget_allocation import FeatureBudgetLineAllocation  # noqa: F401
from app.models.spillover_history import SpilloverHistory  # noqa: F401
from app.models.record_history import RecordHistory  # noqa: F401
from app.models.team_planning import TeamPlanning, POPlanVersion, PlanningNotification  # noqa: F401
from app.models.global_settings import GlobalSettings  # noqa: F401

# Create tables on startup (needed for fresh deployments)
Base.metadata.create_all(bind=engine)

def _get_allowed_origins() -> list[str]:
    """Build CORS origins from environment."""
    origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]
    extra = os.getenv("CORS_ORIGINS", "")
    if extra:
        # Support both "*" wildcard and comma-separated list
        if extra.strip() == "*":
            origins = ["*"]
        else:
            origins.extend([o.strip() for o in extra.split(",") if o.strip()])
    return origins


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
    allow_origins=_get_allowed_origins(),
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
# app.include_router(dashboard_router)  # Legacy — disabled
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
app.include_router(jira_v4_router)
app.include_router(validation_v4_router)
app.include_router(roadmap_versions_router)
app.include_router(jira_records_router)
app.include_router(deviation_router)
app.include_router(alignment_router)
app.include_router(team_planning_router)
app.include_router(pm_review_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(trains_router)


@app.on_event("startup")
def on_startup():
    import traceback
    try:
        print("Starting Amadeus Elevate API...")
        print(f"Database URL: {os.getenv('DATABASE_URL', 'Using default SQLite path')}")

        from app.database import SessionLocal
        db = SessionLocal()
        try:
            print("Seeding admin user...")
            seed_admin_user(db)
            print("Startup complete!")
        finally:
            db.close()
    except Exception as e:
        print(f"STARTUP ERROR: {e}")
        traceback.print_exc()
        raise


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
