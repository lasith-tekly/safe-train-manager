from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.feature import (
    FeatureUpdate,
    FeatureResponse,
    FeatureListResponse,
    BulkFeatureCreate,
    BulkFeatureResponse,
    ManualFeatureCreate
)
from app.services.feature_service import FeatureService

router = APIRouter(prefix="/api/features", tags=["features"])


@router.get("", response_model=FeatureListResponse)
def list_features(
    product_id: Optional[UUID] = Query(None),
    budget_line_id: Optional[UUID] = Query(None),
    team_id: Optional[UUID] = Query(None),
    year: Optional[int] = Query(None),
    quarter: Optional[int] = Query(None, ge=1, le=4),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List features with filtering and pagination."""
    features, total = FeatureService.get_all(
        db,
        product_id=product_id,
        budget_line_id=budget_line_id,
        team_id=team_id,
        year=year,
        quarter=quarter,
        status=status,
        search=search,
        page=page,
        page_size=page_size
    )
    return FeatureListResponse(
        data=features,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{feature_id}", response_model=FeatureResponse)
def get_feature(
    feature_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a single feature by ID."""
    feature = FeatureService.get_by_id(db, feature_id)
    if not feature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature not found"
        )
    return FeatureService.build_feature_response(feature)


@router.post("", response_model=BulkFeatureResponse, status_code=status.HTTP_201_CREATED)
def create_features(
    data: BulkFeatureCreate,
    db: Session = Depends(get_db)
):
    """Import features (bulk create/update)."""
    return FeatureService.bulk_import(db, data.features)


@router.post("/manual", response_model=FeatureResponse, status_code=status.HTTP_201_CREATED)
def create_manual_feature(
    data: ManualFeatureCreate,
    db: Session = Depends(get_db)
):
    """Create a feature manually without JIRA."""
    feature = FeatureService.create_manual(db, data)
    return FeatureService.build_feature_response(feature)


@router.put("/{feature_id}", response_model=FeatureResponse)
def update_feature(
    feature_id: UUID,
    data: FeatureUpdate,
    db: Session = Depends(get_db)
):
    """Update feature mapping."""
    feature = FeatureService.get_by_id(db, feature_id)
    if not feature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature not found"
        )
    
    updated = FeatureService.update(db, feature_id, data)
    return FeatureService.build_feature_response(updated)


@router.delete("/{feature_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feature(
    feature_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a feature."""
    feature = FeatureService.get_by_id(db, feature_id)
    if not feature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature not found"
        )
    
    FeatureService.delete(db, feature_id)
    return None


@router.post("/{feature_id}/sync", response_model=FeatureResponse)
def sync_feature(
    feature_id: UUID,
    db: Session = Depends(get_db)
):
    """Sync a single feature from JIRA."""
    feature = FeatureService.get_by_id(db, feature_id)
    if not feature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature not found"
        )
    
    synced = FeatureService.sync_from_jira(db, feature)
    if not synced:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to sync from JIRA"
        )
    return FeatureService.build_feature_response(synced)


@router.post("/sync-all", response_model=BulkFeatureResponse)
def sync_all_features(
    db: Session = Depends(get_db)
):
    """Sync all features from JIRA."""
    return FeatureService.sync_all(db)
