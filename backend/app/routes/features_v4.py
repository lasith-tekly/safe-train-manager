"""
Features V4 API Routes - Effort-Centric Roadmap Planning

API endpoints for managing roadmap features with effort-based planning
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.schemas.roadmap_v4 import (
    CreateFeatureRequest, UpdateFeatureRequest, FeatureResponse, FeatureListResponse,
    CreateJiraRecordRequest, UpdateJiraRecordRequest, JiraRecordResponse,
    CalculateSizingRequest, CalculateSizingResponse,
    BudgetValidationResult, CapacityValidationResult, ValidationSummaryResponse,
    TrainConfigResponse, UpdateTrainConfigRequest, QuarterlyAllocationInput,
    BudgetLineAllocationResponse
)
from app.services.feature_service_v4 import FeatureServiceV4
from app.services.calculation_service import CalculationService
from app.services.validation_service_v4 import ValidationServiceV4
from app.models.global_settings import GlobalSettings
from app.models.roadmap_v4 import RoadmapFeature
from app.dependencies.auth import get_train_context
from app.models.product import Product

router = APIRouter(prefix="/api/features", tags=["Features V4"])


def serialize_feature(feature: RoadmapFeature) -> dict:
    """Serialize feature with budget line names populated"""
    feature_dict = {
        "id": feature.id,
        "product_id": feature.product_id,
        "name": feature.name,
        "customer": feature.customer,
        "priority": feature.priority,
        "status": feature.status,
        "remarks": feature.remarks,
        "gross_sizing_ed": feature.gross_sizing_ed,
        "net_sizing_ed": feature.net_sizing_ed,
        "total_cost_keur": feature.total_cost_keur,
        "created_at": feature.created_at,
        "updated_at": feature.updated_at,
        "created_by": feature.created_by,
        "teams": [{"id": str(team.id), "name": team.name} for team in feature.teams],
        "quarterly_allocations": [
            {
                "id": str(qa.id),
                "year": qa.year,
                "quarter": qa.quarter,
                "allocated_ed": qa.allocated_ed,
                "created_at": qa.created_at,
                "updated_at": qa.updated_at
            }
            for qa in feature.quarterly_allocations
        ],
        "budget_allocations": [
            {
                "id": str(alloc.id),
                "budget_line_id": str(alloc.budget_line_id),
                "budget_line_name": alloc.budget_line.name if alloc.budget_line else None,
                "category_id": str(alloc.category_id) if alloc.category_id else None,
                "allocation_percentage": alloc.allocation_percentage,
                "allocated_effort_days": alloc.allocated_effort_days,
                "created_at": alloc.created_at,
                "updated_at": alloc.updated_at
            }
            for alloc in feature.budget_allocations
        ],
        "jira_records": [
            {
                "id": str(jr.id),
                "feature_id": str(jr.feature_id),
                "jira_key": jr.jira_key,
                "title": getattr(jr, 'title', getattr(jr, 'summary', '')),
                "description": getattr(jr, 'description', getattr(jr, 'remarks', None)),
                "team_id": str(jr.team_id) if jr.team_id else None,
                "team": {"id": str(jr.team.id), "name": jr.team.name} if jr.team else None,
                "pi_id": str(jr.pi_id) if getattr(jr, 'pi_id', None) else None,
                "pi": {"id": str(jr.pi.id), "name": jr.pi.name} if getattr(jr, 'pi', None) else None,
                "planned_effort": getattr(jr, 'planned_effort', 0),
                "actual_effort": getattr(jr, 'actual_effort', None),
                "status": jr.status,
                "spillover_from_pi_id": str(jr.spillover_from_pi_id) if getattr(jr, 'spillover_from_pi_id', None) else None,
                "spillover_reason": getattr(jr, 'spillover_reason', None),
                "created_at": jr.created_at,
                "updated_at": jr.updated_at,
                "quarterly_allocations": [
                    {
                        "id": str(qa.id),
                        "year": qa.year,
                        "quarter": qa.quarter,
                        "allocated_ed": qa.allocated_ed,
                        "created_at": qa.created_at,
                        "updated_at": qa.updated_at
                    }
                    for qa in jr.quarterly_allocations
                ],
                "created_at": jr.created_at,
                "updated_at": jr.updated_at
            }
            for jr in (feature.jira_records or [])
        ]
    }
    return feature_dict


# ============================================
# Feature CRUD Endpoints
# ============================================

@router.post("", response_model=FeatureResponse, status_code=201)
def create_feature(
    request: CreateFeatureRequest,
    db: Session = Depends(get_db),
    created_by: Optional[str] = None
):
    """Create a new roadmap feature"""
    service = FeatureServiceV4(db)
    feature = service.create_feature(request, created_by)
    return serialize_feature(feature)


@router.get("", response_model=FeatureListResponse)
def list_features(
    product_id: Optional[str] = Query(None),
    budget_line_id: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    train_id: Optional[str] = Depends(get_train_context),
):
    """List features with filters and pagination"""
    # If train_id scoping needed and no product_id specified,
    # get all product_ids for this train first
    train_product_ids: Optional[List[str]] = None
    if train_id is not None and not product_id:
        train_products = db.query(Product.id).filter(
            Product.train_id == train_id
        ).all()
        train_product_ids = [str(p.id) for p in train_products]
        if not train_product_ids:
            return FeatureListResponse(data=[], total=0, page=page,
                                       page_size=page_size)

    service = FeatureServiceV4(db)
    result = service.list_features(product_id, budget_line_id, year, status, page, page_size)

    # Post-filter by train if needed
    if train_id is not None and train_product_ids is not None and result.get('data'):
        result['data'] = [
            f for f in result['data']
            if str(f.product_id) in train_product_ids
        ]
        result['total'] = len(result['data'])

    # Serialize all features with budget line names
    serialized_features = [serialize_feature(feature) for feature in result['data']]

    return {
        "data": serialized_features,
        "total": result['total'],
        "page": result['page'],
        "page_size": result['page_size']
    }


@router.get("/{feature_id}", response_model=FeatureResponse)
def get_feature(
    feature_id: str,
    include_jira: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Get a single feature by ID"""
    service = FeatureServiceV4(db)
    feature = service.get_feature(feature_id, include_jira)
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    return serialize_feature(feature)


@router.put("/{feature_id}", response_model=FeatureResponse)
def update_feature(
    feature_id: str,
    request: UpdateFeatureRequest,
    db: Session = Depends(get_db)
):
    """Update a feature"""
    service = FeatureServiceV4(db)
    try:
        feature = service.update_feature(feature_id, request)
        return serialize_feature(feature)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{feature_id}", status_code=204)
def delete_feature(
    feature_id: str,
    db: Session = Depends(get_db)
):
    """Delete a feature"""
    service = FeatureServiceV4(db)
    success = service.delete_feature(feature_id)
    if not success:
        raise HTTPException(status_code=404, detail="Feature not found")
    return None


# ============================================
# JIRA Record Endpoints
# ============================================

@router.post("/{feature_id}/jira-records", response_model=JiraRecordResponse, status_code=201)
def create_jira_record(
    feature_id: str,
    request: CreateJiraRecordRequest,
    db: Session = Depends(get_db)
):
    """Create a JIRA record for a feature"""
    service = FeatureServiceV4(db)
    jira_record = service.create_jira_record(feature_id, request)
    return jira_record


@router.put("/jira-records/{jira_id}", response_model=JiraRecordResponse)
def update_jira_record(
    jira_id: str,
    request: UpdateJiraRecordRequest,
    db: Session = Depends(get_db)
):
    """Update a JIRA record"""
    service = FeatureServiceV4(db)
    try:
        jira_record = service.update_jira_record(jira_id, request)
        return jira_record
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/jira-records/{jira_id}", status_code=204)
def delete_jira_record(
    jira_id: str,
    db: Session = Depends(get_db)
):
    """Delete a JIRA record"""
    service = FeatureServiceV4(db)
    success = service.delete_jira_record(jira_id)
    if not success:
        raise HTTPException(status_code=404, detail="JIRA record not found")
    return None


# ============================================
# Calculation Endpoints
# ============================================

@router.post("/calculate", response_model=CalculateSizingResponse)
def calculate_sizing(
    request: CalculateSizingRequest,
    db: Session = Depends(get_db)
):
    """Calculate net sizing and cost from gross sizing"""
    service = CalculationService(db)
    result = service.calculate_sizing(request.gross_sizing_ed)
    return result


# ============================================
# Validation Endpoints
# ============================================

@router.get("/validation/budget", response_model=dict)
def validate_budget(
    product_id: str = Query(...),
    budget_line_id: str = Query(...),
    year: int = Query(...),
    category_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Validate budget at product, budget line, and category levels"""
    service = ValidationServiceV4(db)
    result = service.validate_budget(product_id, budget_line_id, category_id, year)
    return result


@router.get("/validation/capacity", response_model=CapacityValidationResult)
def validate_capacity(
    team_id: str = Query(...),
    year: int = Query(...),
    quarter: int = Query(..., ge=1, le=4),
    db: Session = Depends(get_db)
):
    """Validate team capacity for a specific quarter"""
    service = ValidationServiceV4(db)
    result = service.validate_team_capacity(team_id, year, quarter)
    return result


@router.get("/validation/feature/{feature_id}", response_model=dict)
def validate_feature(
    feature_id: str,
    year: int = Query(...),
    quarter: int = Query(..., ge=1, le=4),
    db: Session = Depends(get_db)
):
    """Validate feature consistency (JIRA vs Feature plan)"""
    service = ValidationServiceV4(db)
    result = service.validate_feature_consistency(feature_id, year, quarter)
    return result


# ============================================
# Train Configuration Endpoints
# ============================================

@router.get("/settings/train-config", response_model=TrainConfigResponse)
def get_train_config(db: Session = Depends(get_db)):
    """Get train configuration settings"""
    settings = db.query(GlobalSettings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Global settings not configured")
    
    return {
        "train_unit_cost_keur": settings.train_unit_cost_keur,
        "effort_days_per_year": settings.effort_days_per_year,
        "train_structural_cost_ratio": settings.train_structural_cost_ratio
    }


@router.put("/settings/train-config", response_model=TrainConfigResponse)
def update_train_config(
    request: UpdateTrainConfigRequest,
    db: Session = Depends(get_db)
):
    """Update train configuration settings"""
    settings = db.query(GlobalSettings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Global settings not configured")
    
    if request.train_unit_cost_keur is not None:
        settings.train_unit_cost_keur = request.train_unit_cost_keur
    if request.effort_days_per_year is not None:
        settings.effort_days_per_year = request.effort_days_per_year
    if request.train_structural_cost_ratio is not None:
        settings.train_structural_cost_ratio = request.train_structural_cost_ratio
    
    db.commit()
    db.refresh(settings)
    
    return {
        "train_unit_cost_keur": settings.train_unit_cost_keur,
        "effort_days_per_year": settings.effort_days_per_year,
        "train_structural_cost_ratio": settings.train_structural_cost_ratio
    }
