from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.dashboard import (
    DashboardSummary,
    DashboardMetrics,
    BudgetHealthItem,
    CapacityHeatmapItem,
    FeatureStats,
    # Capacity Dashboard schemas
    CapacitySummaryResponse,
    ProductCapacityResponse,
    SiteCapacityResponse,
    TeamCapacityResponse,
    AllocationCapacityResponse
)
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get complete dashboard summary."""
    return DashboardService.get_summary(db, year)


@router.get("/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get key metrics only."""
    return DashboardService.get_metrics(db, year)


@router.get("/budget-health", response_model=List[BudgetHealthItem])
def get_budget_health(
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get budget health by product."""
    return DashboardService.get_budget_health(db, year)


@router.get("/capacity-heatmap", response_model=List[CapacityHeatmapItem])
def get_capacity_heatmap(
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get team capacity heatmap."""
    return DashboardService.get_capacity_heatmap(db, year)


@router.get("/feature-stats", response_model=FeatureStats)
def get_feature_stats(
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get feature status statistics."""
    return DashboardService.get_feature_stats(db, year)


# ============================================
# Train Capacity Dashboard Endpoints
# ============================================

@router.get("/capacity/summary", response_model=CapacitySummaryResponse)
def get_capacity_summary(
    pi_id: str = Query(..., description="PI UUID"),
    db: Session = Depends(get_db)
):
    """Get overall capacity summary for a PI."""
    try:
        return DashboardService.get_capacity_summary(db, pi_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/capacity/by-product", response_model=ProductCapacityResponse)
def get_capacity_by_product(
    pi_id: str = Query(..., description="PI UUID"),
    db: Session = Depends(get_db)
):
    """Get capacity breakdown by product for a PI."""
    try:
        return DashboardService.get_capacity_by_product(db, pi_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/capacity/by-site", response_model=SiteCapacityResponse)
def get_capacity_by_site(
    pi_id: str = Query(..., description="PI UUID"),
    db: Session = Depends(get_db)
):
    """Get capacity breakdown by site/country for a PI."""
    try:
        return DashboardService.get_capacity_by_site(db, pi_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/capacity/by-team", response_model=TeamCapacityResponse)
def get_capacity_by_team(
    pi_id: str = Query(..., description="PI UUID"),
    product_id: Optional[str] = Query(None, description="Filter by product"),
    site_id: Optional[str] = Query(None, description="Filter by site"),
    db: Session = Depends(get_db)
):
    """Get capacity breakdown by team for a PI with optional filters."""
    try:
        return DashboardService.get_capacity_by_team(db, pi_id, product_id, site_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/capacity/by-allocation", response_model=AllocationCapacityResponse)
def get_capacity_by_allocation(
    pi_id: str = Query(..., description="PI UUID"),
    db: Session = Depends(get_db)
):
    """Get capacity breakdown by allocation category for a PI."""
    try:
        return DashboardService.get_capacity_by_allocation(db, pi_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============================================
# Train Dashboard Endpoints
# ============================================

@router.get("/train-overview")
def get_train_overview(
    pi_id: str = Query(..., description="PI UUID"),
    db: Session = Depends(get_db)
):
    """Get complete train dashboard overview for a PI."""
    try:
        return DashboardService.get_train_overview(db, pi_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/team-detail")
def get_team_detail_expanded(
    team_id: str = Query(..., description="Team UUID"),
    pi_id: str = Query(..., description="PI UUID"),
    db: Session = Depends(get_db)
):
    """Get detailed team capacity breakdown for expanded view."""
    try:
        return DashboardService.get_team_detail_expanded(db, team_id, pi_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
