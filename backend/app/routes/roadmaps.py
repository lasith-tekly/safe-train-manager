"""
Roadmap Planning API Routes

RESTful API endpoints for roadmap management, feature planning, and budget tracking.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from decimal import Decimal

from app.database import get_db
from app.models.roadmap import Roadmap, RoadmapFeature
from app.models.product import Product
from app.models.budget_new import FiscalYear, BudgetVersion, BudgetLine, BudgetCategory
from app.models.global_settings import GlobalSettings
from app.services.roadmap_service import RoadmapService
from app.schemas.roadmap import (
    RoadmapCreate, RoadmapUpdate, RoadmapStatusUpdate,
    RoadmapFeatureCreate, RoadmapFeatureUpdate, FeatureStatusUpdate,
    FeatureReorderRequest, BudgetCalculationRequest, EffortDaysCalculationRequest,
    RoadmapResponse, RoadmapListResponse, RoadmapListItem, RoadmapFeatureResponse,
    BudgetCalculationResponse, EffortDaysCalculationResponse, BudgetValidationResponse,
    QuarterlySummaryResponse, MessageResponse, RoadmapSummary, QuarterlyTotals,
    QuarterlyAllocation, BudgetLineSummary
)

router = APIRouter(prefix="/api/roadmaps", tags=["Roadmaps"])


# ============================================
# Roadmap Management Endpoints
# ============================================

@router.get("", response_model=RoadmapListResponse)
def list_roadmaps(
    product_id: Optional[str] = Query(None, description="Filter by product ID"),
    fiscal_year_id: Optional[str] = Query(None, description="Filter by fiscal year ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db)
):
    """List all roadmaps with optional filtering and pagination"""
    
    # Build query
    query = db.query(Roadmap).options(
        joinedload(Roadmap.product),
        joinedload(Roadmap.fiscal_year)
    )
    
    # Apply filters
    if product_id:
        query = query.filter(Roadmap.product_id == product_id)
    if fiscal_year_id:
        query = query.filter(Roadmap.fiscal_year_id == fiscal_year_id)
    if status:
        query = query.filter(Roadmap.status == status)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    roadmaps = query.offset(offset).limit(page_size).all()
    
    # Build response items
    items = []
    for roadmap in roadmaps:
        # Calculate summary stats
        features = db.query(RoadmapFeature).filter(
            RoadmapFeature.roadmap_id == roadmap.id
        ).all()
        
        total_budget = sum(Decimal(str(f.total_budget_keur)) for f in features)
        feature_count = len(features)
        
        # Get allocated budget (simplified - from budget summary)
        budget_summary = RoadmapService.get_budget_summary(roadmap.id, db)
        allocated = budget_summary["total_allocated_budget_keur"]
        remaining = allocated - total_budget
        utilization = (total_budget / allocated * 100) if allocated > 0 else Decimal("0")
        
        items.append(RoadmapListItem(
            id=roadmap.id,
            product_id=roadmap.product_id,
            product_name=roadmap.product.name,
            fiscal_year_id=roadmap.fiscal_year_id,
            fiscal_year_name=roadmap.fiscal_year.name,
            budget_version_id=roadmap.budget_version_id,
            name=roadmap.name,
            description=roadmap.description,
            status=roadmap.status,
            total_budget_keur=allocated,
            planned_budget_keur=total_budget,
            remaining_budget_keur=remaining,
            utilization_percent=round(utilization, 2),
            feature_count=feature_count,
            created_by=roadmap.created_by,
            created_at=roadmap.created_at,
            updated_at=roadmap.updated_at
        ))
    
    return RoadmapListResponse(
        data=items,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{roadmap_id}", response_model=RoadmapResponse)
def get_roadmap(roadmap_id: str, db: Session = Depends(get_db)):
    """Get roadmap details with all features"""
    
    # Get roadmap with relationships
    roadmap = db.query(Roadmap).options(
        joinedload(Roadmap.product),
        joinedload(Roadmap.fiscal_year),
        joinedload(Roadmap.features).joinedload(RoadmapFeature.budget_line),
        joinedload(Roadmap.features).joinedload(RoadmapFeature.budget_category)
    ).filter(Roadmap.id == roadmap_id).first()
    
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )
    
    # Get budget summary
    budget_summary = RoadmapService.get_budget_summary(roadmap_id, db)
    
    # Calculate quarterly totals
    quarterly_totals = {
        "q1": {"effort_days": Decimal("0"), "budget_keur": Decimal("0")},
        "q2": {"effort_days": Decimal("0"), "budget_keur": Decimal("0")},
        "q3": {"effort_days": Decimal("0"), "budget_keur": Decimal("0")},
        "q4": {"effort_days": Decimal("0"), "budget_keur": Decimal("0")}
    }
    
    for feature in roadmap.features:
        quarterly_totals["q1"]["effort_days"] += feature.q1_effort_days
        quarterly_totals["q1"]["budget_keur"] += feature.q1_budget_keur
        quarterly_totals["q2"]["effort_days"] += feature.q2_effort_days
        quarterly_totals["q2"]["budget_keur"] += feature.q2_budget_keur
        quarterly_totals["q3"]["effort_days"] += feature.q3_effort_days
        quarterly_totals["q3"]["budget_keur"] += feature.q3_budget_keur
        quarterly_totals["q4"]["effort_days"] += feature.q4_effort_days
        quarterly_totals["q4"]["budget_keur"] += feature.q4_budget_keur
    
    # Build summary
    summary = RoadmapSummary(
        total_budget_keur=budget_summary["total_allocated_budget_keur"],
        planned_budget_keur=budget_summary["total_planned_budget_keur"],
        remaining_budget_keur=budget_summary["total_remaining_budget_keur"],
        utilization_percent=budget_summary["total_utilization_percent"],
        feature_count=len(roadmap.features),
        quarterly_totals=QuarterlyTotals(
            q1=QuarterlyAllocation(**quarterly_totals["q1"]),
            q2=QuarterlyAllocation(**quarterly_totals["q2"]),
            q3=QuarterlyAllocation(**quarterly_totals["q3"]),
            q4=QuarterlyAllocation(**quarterly_totals["q4"])
        )
    )
    
    # Build budget lines summary
    budget_lines = [BudgetLineSummary(**line) for line in budget_summary["budget_lines"]]
    
    # Build features response
    features = []
    for feature in roadmap.features:
        features.append(RoadmapFeatureResponse(
            id=feature.id,
            roadmap_id=feature.roadmap_id,
            budget_line_id=feature.budget_line_id,
            budget_line_name=feature.budget_line.name,
            budget_category_id=feature.budget_category_id,
            budget_category_name=feature.budget_category.name if feature.budget_category else None,
            name=feature.name,
            description=feature.description,
            priority=feature.priority,
            status=feature.status,
            total_effort_days=feature.total_effort_days,
            total_budget_keur=feature.total_budget_keur,
            q1_effort_days=feature.q1_effort_days,
            q1_budget_keur=feature.q1_budget_keur,
            q2_effort_days=feature.q2_effort_days,
            q2_budget_keur=feature.q2_budget_keur,
            q3_effort_days=feature.q3_effort_days,
            q3_budget_keur=feature.q3_budget_keur,
            q4_effort_days=feature.q4_effort_days,
            q4_budget_keur=feature.q4_budget_keur,
            created_by=feature.created_by,
            created_at=feature.created_at,
            updated_at=feature.updated_at
        ))
    
    return RoadmapResponse(
        id=roadmap.id,
        product_id=roadmap.product_id,
        product_name=roadmap.product.name,
        product_code=roadmap.product.short_code,
        fiscal_year_id=roadmap.fiscal_year_id,
        fiscal_year_name=roadmap.fiscal_year.name,
        budget_version_id=roadmap.budget_version_id,
        name=roadmap.name,
        description=roadmap.description,
        status=roadmap.status,
        created_by=roadmap.created_by,
        created_at=roadmap.created_at,
        updated_at=roadmap.updated_at,
        summary=summary,
        budget_lines=budget_lines,
        features=features
    )


@router.post("", response_model=RoadmapResponse, status_code=status.HTTP_201_CREATED)
def create_roadmap(
    roadmap_data: RoadmapCreate,
    db: Session = Depends(get_db),
    current_user_id: str = "system"  # TODO: Get from auth
):
    """Create a new roadmap"""
    
    # Validate product exists
    product = db.query(Product).filter(Product.id == str(roadmap_data.product_id)).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Validate fiscal year exists
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == str(roadmap_data.fiscal_year_id)).first()
    if not fiscal_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fiscal year not found"
        )
    
    # Validate budget version exists
    budget_version = db.query(BudgetVersion).filter(BudgetVersion.id == str(roadmap_data.budget_version_id)).first()
    if not budget_version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget version not found"
        )
    
    # Check if active roadmap already exists for this product/year
    existing_active = db.query(Roadmap).filter(
        Roadmap.product_id == str(roadmap_data.product_id),
        Roadmap.fiscal_year_id == str(roadmap_data.fiscal_year_id),
        Roadmap.status == "active"
    ).first()
    
    if existing_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Active roadmap already exists for {product.name} in {fiscal_year.name}"
        )
    
    # Create roadmap
    roadmap = Roadmap(
        product_id=str(roadmap_data.product_id),
        fiscal_year_id=str(roadmap_data.fiscal_year_id),
        budget_version_id=str(roadmap_data.budget_version_id),
        name=roadmap_data.name,
        description=roadmap_data.description,
        status="draft",
        created_by=current_user_id
    )
    
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)
    
    # Return full roadmap details
    return get_roadmap(roadmap.id, db)


@router.put("/{roadmap_id}", response_model=RoadmapResponse)
def update_roadmap(
    roadmap_id: str,
    update_data: RoadmapUpdate,
    db: Session = Depends(get_db)
):
    """Update roadmap details"""
    
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )
    
    # Cannot edit archived roadmap
    if roadmap.status == "archived":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot edit archived roadmap"
        )
    
    # Update fields
    if update_data.name is not None:
        roadmap.name = update_data.name
    if update_data.description is not None:
        roadmap.description = update_data.description
    
    db.commit()
    db.refresh(roadmap)
    
    return get_roadmap(roadmap_id, db)


@router.patch("/{roadmap_id}/status", response_model=RoadmapResponse)
def update_roadmap_status(
    roadmap_id: str,
    status_update: RoadmapStatusUpdate,
    db: Session = Depends(get_db)
):
    """Change roadmap status"""
    
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )
    
    # Validate status transition
    if not RoadmapService.validate_status_transition(roadmap.status, status_update.status):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from {roadmap.status} to {status_update.status}"
        )
    
    # If activating, check for existing active roadmap
    if status_update.status == "active":
        existing_active = db.query(Roadmap).filter(
            Roadmap.product_id == roadmap.product_id,
            Roadmap.fiscal_year_id == roadmap.fiscal_year_id,
            Roadmap.status == "active",
            Roadmap.id != roadmap_id
        ).first()
        
        if existing_active:
            # Archive the existing active roadmap
            existing_active.status = "archived"
    
    # Update status
    roadmap.status = status_update.status
    db.commit()
    db.refresh(roadmap)
    
    return get_roadmap(roadmap_id, db)


@router.delete("/{roadmap_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_roadmap(roadmap_id: str, db: Session = Depends(get_db)):
    """Delete a roadmap (only draft roadmaps)"""
    
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )
    
    # Can only delete draft roadmaps
    if roadmap.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only delete draft roadmaps"
        )
    
    db.delete(roadmap)
    db.commit()
    
    return None


# ============================================
# Feature Management Endpoints
# ============================================

@router.post("/{roadmap_id}/features", response_model=RoadmapFeatureResponse, status_code=status.HTTP_201_CREATED)
def create_feature(
    roadmap_id: str,
    feature_data: RoadmapFeatureCreate,
    db: Session = Depends(get_db),
    current_user_id: str = "system"  # TODO: Get from auth
):
    """Add a feature to roadmap"""
    
    # Validate roadmap exists
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )
    
    # Validate budget line exists
    budget_line = db.query(BudgetLine).filter(BudgetLine.id == str(feature_data.budget_line_id)).first()
    if not budget_line:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget line not found"
        )
    
    # Validate budget category if provided
    if feature_data.budget_category_id:
        budget_category = db.query(BudgetCategory).filter(
            BudgetCategory.id == str(feature_data.budget_category_id)
        ).first()
        if not budget_category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget category not found"
            )
    
    # Calculate totals and budgets
    calculated = RoadmapService.calculate_feature_totals(
        feature_data,
        roadmap.fiscal_year_id,
        db
    )
    
    # Validate budget allocation
    validation = RoadmapService.validate_budget_allocation(
        roadmap_id,
        str(feature_data.budget_line_id),
        str(feature_data.budget_category_id) if feature_data.budget_category_id else None,
        calculated["total_budget_keur"],
        db
    )
    
    # Warn if over budget (but allow creation)
    if not validation["valid"]:
        # Could raise exception here if strict validation needed
        pass
    
    # Create feature
    feature = RoadmapFeature(
        roadmap_id=roadmap_id,
        budget_line_id=str(feature_data.budget_line_id),
        budget_category_id=str(feature_data.budget_category_id) if feature_data.budget_category_id else None,
        name=feature_data.name,
        description=feature_data.description,
        priority=feature_data.priority,
        status="planned",
        total_effort_days=calculated["total_effort_days"],
        total_budget_keur=calculated["total_budget_keur"],
        q1_effort_days=feature_data.q1_effort_days,
        q1_budget_keur=calculated["q1_budget_keur"],
        q2_effort_days=feature_data.q2_effort_days,
        q2_budget_keur=calculated["q2_budget_keur"],
        q3_effort_days=feature_data.q3_effort_days,
        q3_budget_keur=calculated["q3_budget_keur"],
        q4_effort_days=feature_data.q4_effort_days,
        q4_budget_keur=calculated["q4_budget_keur"],
        created_by=current_user_id
    )
    
    db.add(feature)
    db.commit()
    db.refresh(feature)
    
    # Load relationships
    feature = db.query(RoadmapFeature).options(
        joinedload(RoadmapFeature.budget_line),
        joinedload(RoadmapFeature.budget_category)
    ).filter(RoadmapFeature.id == feature.id).first()
    
    return RoadmapFeatureResponse(
        id=feature.id,
        roadmap_id=feature.roadmap_id,
        budget_line_id=feature.budget_line_id,
        budget_line_name=feature.budget_line.name,
        budget_category_id=feature.budget_category_id,
        budget_category_name=feature.budget_category.name if feature.budget_category else None,
        name=feature.name,
        description=feature.description,
        priority=feature.priority,
        status=feature.status,
        total_effort_days=feature.total_effort_days,
        total_budget_keur=feature.total_budget_keur,
        q1_effort_days=feature.q1_effort_days,
        q1_budget_keur=feature.q1_budget_keur,
        q2_effort_days=feature.q2_effort_days,
        q2_budget_keur=feature.q2_budget_keur,
        q3_effort_days=feature.q3_effort_days,
        q3_budget_keur=feature.q3_budget_keur,
        q4_effort_days=feature.q4_effort_days,
        q4_budget_keur=feature.q4_budget_keur,
        created_by=feature.created_by,
        created_at=feature.created_at,
        updated_at=feature.updated_at
    )


@router.put("/{roadmap_id}/features/{feature_id}", response_model=RoadmapFeatureResponse)
def update_feature(
    roadmap_id: str,
    feature_id: str,
    update_data: RoadmapFeatureUpdate,
    db: Session = Depends(get_db)
):
    """Update a feature"""
    
    feature = db.query(RoadmapFeature).filter(
        RoadmapFeature.id == feature_id,
        RoadmapFeature.roadmap_id == roadmap_id
    ).first()
    
    if not feature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature not found"
        )
    
    # Get roadmap for fiscal year
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    
    # Recalculate if effort days changed
    if any([
        update_data.q1_effort_days is not None,
        update_data.q2_effort_days is not None,
        update_data.q3_effort_days is not None,
        update_data.q4_effort_days is not None
    ]):
        calculated = RoadmapService.recalculate_feature_totals(
            feature,
            update_data,
            roadmap.fiscal_year_id,
            db
        )
        
        # Update calculated fields
        feature.total_effort_days = calculated["total_effort_days"]
        feature.total_budget_keur = calculated["total_budget_keur"]
        feature.q1_effort_days = calculated["q1_effort_days"]
        feature.q1_budget_keur = calculated["q1_budget_keur"]
        feature.q2_effort_days = calculated["q2_effort_days"]
        feature.q2_budget_keur = calculated["q2_budget_keur"]
        feature.q3_effort_days = calculated["q3_effort_days"]
        feature.q3_budget_keur = calculated["q3_budget_keur"]
        feature.q4_effort_days = calculated["q4_effort_days"]
        feature.q4_budget_keur = calculated["q4_budget_keur"]
    
    # Update other fields
    if update_data.name is not None:
        feature.name = update_data.name
    if update_data.description is not None:
        feature.description = update_data.description
    if update_data.priority is not None:
        feature.priority = update_data.priority
    
    db.commit()
    db.refresh(feature)
    
    # Load relationships
    feature = db.query(RoadmapFeature).options(
        joinedload(RoadmapFeature.budget_line),
        joinedload(RoadmapFeature.budget_category)
    ).filter(RoadmapFeature.id == feature.id).first()
    
    return RoadmapFeatureResponse(
        id=feature.id,
        roadmap_id=feature.roadmap_id,
        budget_line_id=feature.budget_line_id,
        budget_line_name=feature.budget_line.name,
        budget_category_id=feature.budget_category_id,
        budget_category_name=feature.budget_category.name if feature.budget_category else None,
        name=feature.name,
        description=feature.description,
        priority=feature.priority,
        status=feature.status,
        total_effort_days=feature.total_effort_days,
        total_budget_keur=feature.total_budget_keur,
        q1_effort_days=feature.q1_effort_days,
        q1_budget_keur=feature.q1_budget_keur,
        q2_effort_days=feature.q2_effort_days,
        q2_budget_keur=feature.q2_budget_keur,
        q3_effort_days=feature.q3_effort_days,
        q3_budget_keur=feature.q3_budget_keur,
        q4_effort_days=feature.q4_effort_days,
        q4_budget_keur=feature.q4_budget_keur,
        created_by=feature.created_by,
        created_at=feature.created_at,
        updated_at=feature.updated_at
    )


@router.patch("/{roadmap_id}/features/{feature_id}/status", response_model=RoadmapFeatureResponse)
def update_feature_status(
    roadmap_id: str,
    feature_id: str,
    status_update: FeatureStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update feature status"""
    
    feature = db.query(RoadmapFeature).filter(
        RoadmapFeature.id == feature_id,
        RoadmapFeature.roadmap_id == roadmap_id
    ).first()
    
    if not feature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature not found"
        )
    
    # Validate status transition
    if not RoadmapService.validate_feature_status_transition(feature.status, status_update.status):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from {feature.status} to {status_update.status}"
        )
    
    feature.status = status_update.status
    db.commit()
    db.refresh(feature)
    
    # Load relationships
    feature = db.query(RoadmapFeature).options(
        joinedload(RoadmapFeature.budget_line),
        joinedload(RoadmapFeature.budget_category)
    ).filter(RoadmapFeature.id == feature.id).first()
    
    return RoadmapFeatureResponse(
        id=feature.id,
        roadmap_id=feature.roadmap_id,
        budget_line_id=feature.budget_line_id,
        budget_line_name=feature.budget_line.name,
        budget_category_id=feature.budget_category_id,
        budget_category_name=feature.budget_category.name if feature.budget_category else None,
        name=feature.name,
        description=feature.description,
        priority=feature.priority,
        status=feature.status,
        total_effort_days=feature.total_effort_days,
        total_budget_keur=feature.total_budget_keur,
        q1_effort_days=feature.q1_effort_days,
        q1_budget_keur=feature.q1_budget_keur,
        q2_effort_days=feature.q2_effort_days,
        q2_budget_keur=feature.q2_budget_keur,
        q3_effort_days=feature.q3_effort_days,
        q3_budget_keur=feature.q3_budget_keur,
        q4_effort_days=feature.q4_effort_days,
        q4_budget_keur=feature.q4_budget_keur,
        created_by=feature.created_by,
        created_at=feature.created_at,
        updated_at=feature.updated_at
    )


@router.delete("/{roadmap_id}/features/{feature_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feature(roadmap_id: str, feature_id: str, db: Session = Depends(get_db)):
    """Delete a feature"""
    
    feature = db.query(RoadmapFeature).filter(
        RoadmapFeature.id == feature_id,
        RoadmapFeature.roadmap_id == roadmap_id
    ).first()
    
    if not feature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature not found"
        )
    
    db.delete(feature)
    db.commit()
    
    return None


@router.post("/{roadmap_id}/features/reorder", response_model=MessageResponse)
def reorder_features(
    roadmap_id: str,
    reorder_data: FeatureReorderRequest,
    db: Session = Depends(get_db)
):
    """Reorder features by priority"""
    
    # Validate roadmap exists
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )
    
    # Update priorities
    updated_count = 0
    for index, feature_id in enumerate(reorder_data.feature_ids):
        feature = db.query(RoadmapFeature).filter(
            RoadmapFeature.id == str(feature_id),
            RoadmapFeature.roadmap_id == roadmap_id
        ).first()
        
        if feature:
            feature.priority = index + 1
            updated_count += 1
    
    db.commit()
    
    return MessageResponse(
        message="Features reordered successfully",
        updated_count=updated_count
    )


# ============================================
# Budget Summary & Calculations
# ============================================

@router.get("/{roadmap_id}/budget-summary")
def get_budget_summary(roadmap_id: str, db: Session = Depends(get_db)):
    """Get detailed budget summary by budget line and category"""
    
    summary = RoadmapService.get_budget_summary(roadmap_id, db)
    return summary


@router.get("/{roadmap_id}/quarterly-summary", response_model=QuarterlySummaryResponse)
def get_quarterly_summary(roadmap_id: str, db: Session = Depends(get_db)):
    """Get quarterly breakdown across all features"""
    
    quarters = RoadmapService.get_quarterly_summary(roadmap_id, db)
    
    return QuarterlySummaryResponse(
        roadmap_id=roadmap_id,
        quarters=quarters
    )


@router.post("/calculate-budget", response_model=BudgetCalculationResponse)
def calculate_budget(
    request: BudgetCalculationRequest,
    db: Session = Depends(get_db)
):
    """Calculate budget from effort days (utility endpoint)"""
    
    budget = RoadmapService.calculate_budget_from_effort(
        request.effort_days,
        str(request.fiscal_year_id),
        db
    )
    
    # Get settings for response
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == str(request.fiscal_year_id)).first()
    settings = db.query(GlobalSettings).filter(GlobalSettings.year == fiscal_year.year).first()
    
    return BudgetCalculationResponse(
        effort_days=request.effort_days,
        budget_keur=budget,
        calculation={
            "unit_cost_keur": float(settings.train_unit_cost_keur),
            "ed_per_year": settings.effort_days_per_year,
            "structural_cost_ratio": float(settings.train_structural_cost_ratio),
            "formula": "(eD × Structural_Cost_Ratio × Unit_Cost) / eD_per_Year"
        }
    )


@router.post("/calculate-effort-days", response_model=EffortDaysCalculationResponse)
def calculate_effort_days(
    request: EffortDaysCalculationRequest,
    db: Session = Depends(get_db)
):
    """Calculate effort days from budget (utility endpoint)"""
    
    effort_days = RoadmapService.calculate_effort_from_budget(
        request.budget_keur,
        str(request.fiscal_year_id),
        db
    )
    
    # Get settings for response
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == str(request.fiscal_year_id)).first()
    settings = db.query(GlobalSettings).filter(GlobalSettings.year == fiscal_year.year).first()
    
    return EffortDaysCalculationResponse(
        budget_keur=request.budget_keur,
        effort_days=effort_days,
        calculation={
            "unit_cost_keur": float(settings.train_unit_cost_keur),
            "ed_per_year": settings.effort_days_per_year,
            "structural_cost_ratio": float(settings.train_structural_cost_ratio),
            "formula": "((Budget / Unit_Cost) × eD_per_Year) / Structural_Cost_Ratio"
        }
    )
