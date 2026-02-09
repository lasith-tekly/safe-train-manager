"""
Roadmap Version API Routes

API endpoints for managing roadmap versions.
Supports version CRUD, publishing, and feature copying.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.services.roadmap_version_service import RoadmapVersionService
from app.schemas.roadmap_version import (
    RoadmapVersionCreate,
    RoadmapVersionUpdate,
    RoadmapVersionResponse,
    RoadmapVersionListResponse,
    PublishVersionRequest
)
from app.schemas.roadmap_v4 import FeatureResponse


router = APIRouter(tags=["Roadmap Versions"])


@router.get("/api/products/{product_id}/roadmap-versions", response_model=RoadmapVersionListResponse)
def list_versions(
    product_id: str,
    db: Session = Depends(get_db)
):
    """
    List all roadmap versions for a product, newest first.
    
    Returns versions with feature counts.
    """
    service = RoadmapVersionService(db)
    versions = service.list_versions(product_id)
    
    return RoadmapVersionListResponse(
        items=versions,
        total=len(versions)
    )


@router.post("/api/products/{product_id}/roadmap-versions", response_model=RoadmapVersionResponse, status_code=status.HTTP_201_CREATED)
def create_version(
    product_id: str,
    data: RoadmapVersionCreate,
    db: Session = Depends(get_db),
    created_by: Optional[str] = None  # TODO: Get from auth context
):
    """
    Create a new roadmap version.
    
    Business Rules:
    - Only one DRAFT version allowed per product
    - If copy_from_version_id is provided, copies all features from that version
    - Version name defaults to current date if not provided
    
    Returns the newly created version.
    """
    service = RoadmapVersionService(db)
    version = service.create_version(product_id, data, created_by)
    return version


@router.get("/api/products/{product_id}/roadmap-versions/{version_id}", response_model=RoadmapVersionResponse)
def get_version(
    product_id: str,
    version_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific roadmap version by ID.
    
    Validates that the version belongs to the specified product.
    """
    service = RoadmapVersionService(db)
    version = service.get_version(version_id, product_id)
    return version


@router.put("/api/products/{product_id}/roadmap-versions/{version_id}", response_model=RoadmapVersionResponse)
def update_version(
    product_id: str,
    version_id: str,
    data: RoadmapVersionUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a roadmap version.
    
    Only description can be updated.
    Only DRAFT versions can be updated (PUBLISHED versions are read-only).
    """
    service = RoadmapVersionService(db)
    
    # Validate version belongs to product
    service.get_version(version_id, product_id)
    
    version = service.update_version(version_id, data)
    return version


@router.post("/api/products/{product_id}/roadmap-versions/{version_id}/publish", response_model=RoadmapVersionResponse)
def publish_version(
    product_id: str,
    version_id: str,
    request: PublishVersionRequest = PublishVersionRequest(),
    db: Session = Depends(get_db)
):
    """
    Publish a roadmap version.
    
    Publishing a version:
    - Changes status from DRAFT to PUBLISHED
    - Sets published_at timestamp
    - Locks the version from further edits
    - All features in the version become read-only
    
    Only DRAFT versions can be published.
    """
    service = RoadmapVersionService(db)
    
    # Validate version belongs to product
    service.get_version(version_id, product_id)
    
    version = service.publish_version(version_id, request.published_by)
    return version


@router.delete("/api/products/{product_id}/roadmap-versions/{version_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_version(
    product_id: str,
    version_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a roadmap version.
    
    Only DRAFT versions can be deleted.
    Cascade deletes all features in the version.
    """
    service = RoadmapVersionService(db)
    
    # Validate version belongs to product
    service.get_version(version_id, product_id)
    
    service.delete_version(version_id)
    return None


@router.get("/api/products/{product_id}/roadmap-versions/{version_id}/features")
def get_version_features(
    product_id: str,
    version_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all features for a specific version.
    
    Returns features with all related data (teams, allocations, etc.).
    """
    service = RoadmapVersionService(db)
    
    # Validate version belongs to product
    service.get_version(version_id, product_id)
    
    features = service.get_version_features(version_id)
    return {"data": features, "total": len(features)}


# Additional endpoint for getting current draft version
@router.get("/api/products/{product_id}/roadmap-versions/current/draft", response_model=RoadmapVersionResponse)
def get_current_draft(
    product_id: str,
    db: Session = Depends(get_db)
):
    """
    Get the current DRAFT version for a product.
    
    Returns 404 if no draft version exists.
    """
    service = RoadmapVersionService(db)
    versions = service.list_versions(product_id)
    
    draft_version = next((v for v in versions if v.status == "DRAFT"), None)
    
    if not draft_version:
        raise HTTPException(
            status_code=404,
            detail="No draft version found for this product"
        )
    
    return draft_version
