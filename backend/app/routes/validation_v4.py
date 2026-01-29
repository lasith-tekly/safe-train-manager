"""
Validation Routes - Budget, Capacity, and Feature Consistency Validation
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.services.validation_service import ValidationService

router = APIRouter(prefix="/api/validation", tags=["validation"])


@router.get("/budget")
def validate_budget(
    product_id: str = Query(..., description="Product ID"),
    year: int = Query(..., description="Year"),
    budget_line_id: Optional[str] = Query(None, description="Budget Line ID"),
    category_id: Optional[str] = Query(None, description="Category ID"),
    db: Session = Depends(get_db)
):
    """
    Validate budget at product, budget line, and category levels
    
    Returns validation results showing allocated vs planned costs
    """
    service = ValidationService(db)
    return service.validate_budget(product_id, year, budget_line_id, category_id)


@router.get("/capacity")
def validate_capacity(
    team_id: str = Query(..., description="Team ID"),
    year: int = Query(..., description="Year"),
    quarter: int = Query(..., ge=1, le=4, description="Quarter (1-4)"),
    db: Session = Depends(get_db)
):
    """
    Validate team capacity for a specific quarter
    
    Returns capacity vs allocated effort with utilization percentage
    """
    service = ValidationService(db)
    return service.validate_capacity(team_id, year, quarter)


@router.get("/capacity/summary")
def validate_capacity_summary(
    year: int = Query(..., description="Year"),
    quarter: Optional[int] = Query(None, ge=1, le=4, description="Quarter (1-4)"),
    db: Session = Depends(get_db)
):
    """
    Get capacity validation summary for all teams
    
    Returns list of teams with capacity issues (over-allocated or high utilization)
    """
    service = ValidationService(db)
    return service.validate_capacity_summary(year, quarter)


@router.get("/feature/{feature_id}")
def validate_feature(
    feature_id: str,
    db: Session = Depends(get_db)
):
    """
    Validate feature consistency
    
    Checks if JIRA allocations exceed feature quarterly plans
    """
    service = ValidationService(db)
    
    # Get budget validation for this feature's product
    from app.models.roadmap_v4 import RoadmapFeature
    feature = db.query(RoadmapFeature).filter(RoadmapFeature.id == feature_id).first()
    
    budget_validations = []
    if feature:
        # Get current year for budget validation
        from datetime import datetime
        current_year = datetime.now().year
        budget_validations = service.validate_budget(feature.product_id, current_year)
    
    consistency_issues = service.validate_feature_consistency(feature_id)
    
    return {
        'budget_validations': budget_validations,
        'consistency_issues': consistency_issues
    }


@router.get("/summary")
def get_validation_summary(
    product_id: Optional[str] = Query(None, description="Product ID"),
    year: Optional[int] = Query(None, description="Year"),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive validation summary
    
    Returns all validation alerts (budget, capacity, consistency)
    """
    service = ValidationService(db)
    return service.get_validation_summary(product_id, year)
