# Backend Architecture - Dashboard Module

**Document Version:** 1.0  
**Created:** 2026-01-15  
**Author:** Backend Architect Agent  
**Status:** Draft  

---

## 1. Overview

This document defines the backend architecture for the Dashboard module, which aggregates data from Products, Budgets, Teams, and Features to provide summary metrics and health indicators.

---

## 2. Pydantic Schemas

```python
# app/schemas/dashboard.py

from typing import List, Dict, Optional
from uuid import UUID
from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    total_budget: float
    budget_consumed: float
    total_features: int
    active_teams: int


class BudgetHealthItem(BaseModel):
    product_id: UUID
    product_name: str
    product_code: str
    total_budget: float
    consumed_budget: float
    utilization: float
    status: str  # 'healthy', 'warning', 'critical'


class QuarterCapacity(BaseModel):
    total: int
    allocated: int
    utilization: float
    status: str


class CapacityHeatmapItem(BaseModel):
    team_id: UUID
    team_name: str
    team_code: str
    quarters: Dict[str, QuarterCapacity]


class FeatureStats(BaseModel):
    not_started: int
    in_progress: int
    completed: int
    total: int


class DashboardSummary(BaseModel):
    metrics: DashboardMetrics
    budget_health: List[BudgetHealthItem]
    capacity_heatmap: List[CapacityHeatmapItem]
    feature_stats: FeatureStats
```

---

## 3. API Routes

```python
# app/routes/dashboard.py

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.dashboard import (
    DashboardSummary,
    DashboardMetrics,
    BudgetHealthItem,
    CapacityHeatmapItem,
    FeatureStats
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


@router.get("/budget-health", response_model=list[BudgetHealthItem])
def get_budget_health(
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get budget health by product."""
    return DashboardService.get_budget_health(db, year)


@router.get("/capacity-heatmap", response_model=list[CapacityHeatmapItem])
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
```

---

## 4. Service Layer

```python
# app/services/dashboard_service.py

from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.product import Product, ProductStatus
from app.models.budget import BudgetVersion, BudgetLine, BudgetStatus
from app.models.team import Team, TeamCapacity, TeamStatus
from app.models.feature import Feature, FeatureStatus
from app.schemas.dashboard import (
    DashboardSummary,
    DashboardMetrics,
    BudgetHealthItem,
    CapacityHeatmapItem,
    FeatureStats,
    QuarterCapacity
)


class DashboardService:
    """Service layer for Dashboard aggregations."""

    @staticmethod
    def get_health_status(utilization: float) -> str:
        """Determine health status based on utilization percentage."""
        if utilization >= 90:
            return 'critical'
        elif utilization >= 80:
            return 'warning'
        return 'healthy'

    @staticmethod
    def get_summary(db: Session, year: Optional[int] = None) -> DashboardSummary:
        """Get complete dashboard summary."""
        if not year:
            year = datetime.now().year

        return DashboardSummary(
            metrics=DashboardService.get_metrics(db, year),
            budget_health=DashboardService.get_budget_health(db, year),
            capacity_heatmap=DashboardService.get_capacity_heatmap(db, year),
            feature_stats=DashboardService.get_feature_stats(db, year)
        )

    @staticmethod
    def get_metrics(db: Session, year: Optional[int] = None) -> DashboardMetrics:
        """Get key dashboard metrics."""
        if not year:
            year = datetime.now().year

        # Total budget from active budget versions
        total_budget = db.query(func.sum(BudgetLine.amount)).join(
            BudgetVersion, BudgetLine.budget_version_id == BudgetVersion.id
        ).filter(
            BudgetVersion.status == BudgetStatus.ACTIVE,
            BudgetVersion.year == year
        ).scalar() or Decimal('0')

        # Budget consumed from features
        budget_consumed = db.query(func.sum(Feature.cost)).filter(
            Feature.year == year
        ).scalar() or Decimal('0')

        # Total features for the year
        total_features = db.query(func.count(Feature.id)).filter(
            Feature.year == year
        ).scalar() or 0

        # Active teams
        active_teams = db.query(func.count(Team.id)).filter(
            Team.status == TeamStatus.ACTIVE
        ).scalar() or 0

        return DashboardMetrics(
            total_budget=float(total_budget),
            budget_consumed=float(budget_consumed),
            total_features=total_features,
            active_teams=active_teams
        )

    @staticmethod
    def get_budget_health(db: Session, year: Optional[int] = None) -> List[BudgetHealthItem]:
        """Get budget health for each product."""
        if not year:
            year = datetime.now().year

        products = db.query(Product).filter(
            Product.status == ProductStatus.ACTIVE
        ).all()

        result = []
        for product in products:
            # Get active budget version for this product and year
            budget_version = db.query(BudgetVersion).filter(
                BudgetVersion.product_id == product.id,
                BudgetVersion.year == year,
                BudgetVersion.status == BudgetStatus.ACTIVE
            ).first()

            if not budget_version:
                continue

            # Total budget for this product
            total_budget = db.query(func.sum(BudgetLine.amount)).filter(
                BudgetLine.budget_version_id == budget_version.id
            ).scalar() or Decimal('0')

            # Consumed budget from features
            consumed_budget = db.query(func.sum(Feature.cost)).filter(
                Feature.product_id == product.id,
                Feature.year == year
            ).scalar() or Decimal('0')

            total = float(total_budget)
            consumed = float(consumed_budget)
            utilization = (consumed / total * 100) if total > 0 else 0.0

            result.append(BudgetHealthItem(
                product_id=product.id,
                product_name=product.name,
                product_code=product.short_code,
                total_budget=total,
                consumed_budget=consumed,
                utilization=round(utilization, 1),
                status=DashboardService.get_health_status(utilization)
            ))

        # Sort by utilization descending
        result.sort(key=lambda x: x.utilization, reverse=True)
        return result

    @staticmethod
    def get_capacity_heatmap(db: Session, year: Optional[int] = None) -> List[CapacityHeatmapItem]:
        """Get team capacity heatmap data."""
        if not year:
            year = datetime.now().year

        teams = db.query(Team).filter(
            Team.status == TeamStatus.ACTIVE
        ).order_by(Team.name).all()

        result = []
        for team in teams:
            # Get capacity for this team and year
            capacity = db.query(TeamCapacity).filter(
                TeamCapacity.team_id == team.id,
                TeamCapacity.year == year
            ).first()

            quarters = {}
            for q in [1, 2, 3, 4]:
                q_key = f'q{q}'
                
                # Get total capacity
                if capacity:
                    total = getattr(capacity, f'q{q}_capacity', 0)
                else:
                    total = 0

                # Get allocated (sum of story points for features assigned to this team in this quarter)
                allocated = db.query(func.sum(Feature.story_points)).filter(
                    Feature.team_id == team.id,
                    Feature.year == year,
                    Feature.quarter == q
                ).scalar() or 0

                utilization = (allocated / total * 100) if total > 0 else 0.0

                quarters[q_key] = QuarterCapacity(
                    total=total,
                    allocated=allocated,
                    utilization=round(utilization, 1),
                    status=DashboardService.get_health_status(utilization) if total > 0 else 'none'
                )

            result.append(CapacityHeatmapItem(
                team_id=team.id,
                team_name=team.name,
                team_code=team.short_code,
                quarters=quarters
            ))

        return result

    @staticmethod
    def get_feature_stats(db: Session, year: Optional[int] = None) -> FeatureStats:
        """Get feature status statistics."""
        if not year:
            year = datetime.now().year

        not_started = db.query(func.count(Feature.id)).filter(
            Feature.year == year,
            Feature.internal_status == FeatureStatus.NOT_STARTED
        ).scalar() or 0

        in_progress = db.query(func.count(Feature.id)).filter(
            Feature.year == year,
            Feature.internal_status == FeatureStatus.IN_PROGRESS
        ).scalar() or 0

        completed = db.query(func.count(Feature.id)).filter(
            Feature.year == year,
            Feature.internal_status == FeatureStatus.COMPLETED
        ).scalar() or 0

        return FeatureStats(
            not_started=not_started,
            in_progress=in_progress,
            completed=completed,
            total=not_started + in_progress + completed
        )
```

---

## 5. File Structure Update

```
backend/app/
├── schemas/
│   ├── __init__.py      # Add Dashboard imports
│   └── dashboard.py     # NEW
├── routes/
│   ├── __init__.py      # Add dashboard router
│   └── dashboard.py     # NEW
├── services/
│   ├── __init__.py      # Add DashboardService
│   └── dashboard_service.py  # NEW
└── main.py              # Include dashboard router
```
