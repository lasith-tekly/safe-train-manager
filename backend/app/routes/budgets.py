from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.budget import BudgetVersion, BudgetStatus
from app.schemas.budget import (
    BudgetVersionCreate,
    BudgetVersionUpdate,
    BudgetVersionResponse,
    BudgetVersionListResponse
)
from app.services.budget_service import BudgetService

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


@router.get("/versions", response_model=BudgetVersionListResponse)
def list_budget_versions(
    product_id: UUID = Query(..., description="Filter by product ID"),
    year: Optional[int] = Query(None, description="Filter by year"),
    db: Session = Depends(get_db)
):
    """List budget versions for a product, optionally filtered by year."""
    versions, total = BudgetService.get_versions(db, product_id, year)
    return BudgetVersionListResponse(data=versions, total=total)


@router.get("/versions/{version_id}", response_model=BudgetVersionResponse)
def get_budget_version(
    version_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a single budget version with its budget lines."""
    version = BudgetService.get_version_by_id(db, version_id)
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget version not found"
        )
    return BudgetService.build_version_response(db, version)


@router.post("/versions", response_model=BudgetVersionResponse, status_code=status.HTTP_201_CREATED)
def create_budget_version(
    data: BudgetVersionCreate,
    db: Session = Depends(get_db)
):
    """Create a new budget version with budget lines."""
    # Check for duplicate name
    existing = BudgetService.get_version_by_name(
        db, data.product_id, data.year, data.name
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A version with this name already exists for this product and year"
        )

    # If setting as active, deactivate current active
    if data.status == "active":
        BudgetService.deactivate_current_active(db, data.product_id, data.year)

    version = BudgetService.create_version(db, data)
    return BudgetService.build_version_response(db, version)


@router.put("/versions/{version_id}", response_model=BudgetVersionResponse)
def update_budget_version(
    version_id: UUID,
    data: BudgetVersionUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing budget version."""
    version = BudgetService.get_version_by_id(db, version_id)
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget version not found"
        )

    if version.status == BudgetStatus.LOCKED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Locked versions cannot be edited"
        )

    # Check name uniqueness if changing
    if data.name and data.name != version.name:
        existing = BudgetService.get_version_by_name(
            db, version.product_id, version.year, data.name
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A version with this name already exists"
            )

    # If activating, deactivate current active
    if data.status == "active" and version.status != BudgetStatus.ACTIVE:
        BudgetService.deactivate_current_active(db, version.product_id, version.year)

    updated = BudgetService.update_version(db, version_id, data)
    return BudgetService.build_version_response(db, updated)


@router.post("/versions/{version_id}/copy", response_model=BudgetVersionResponse, status_code=status.HTTP_201_CREATED)
def copy_budget_version(
    version_id: UUID,
    db: Session = Depends(get_db)
):
    """Create a copy of an existing budget version."""
    version = BudgetService.get_version_by_id(db, version_id)
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget version not found"
        )

    copied = BudgetService.copy_version(db, version)
    return BudgetService.build_version_response(db, copied)


@router.post("/versions/{version_id}/activate", response_model=BudgetVersionResponse)
def activate_budget_version(
    version_id: UUID,
    db: Session = Depends(get_db)
):
    """Activate a draft budget version."""
    version = BudgetService.get_version_by_id(db, version_id)
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget version not found"
        )

    if version.status != BudgetStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft versions can be activated"
        )

    BudgetService.deactivate_current_active(db, version.product_id, version.year)
    activated = BudgetService.activate_version(db, version_id)
    return BudgetService.build_version_response(db, activated)


@router.post("/versions/{version_id}/lock", response_model=BudgetVersionResponse)
def lock_budget_version(
    version_id: UUID,
    db: Session = Depends(get_db)
):
    """Lock an active budget version."""
    version = BudgetService.get_version_by_id(db, version_id)
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget version not found"
        )

    if version.status != BudgetStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active versions can be locked"
        )

    locked = BudgetService.lock_version(db, version_id)
    return BudgetService.build_version_response(db, locked)


@router.delete("/versions/{version_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget_version(
    version_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a draft budget version."""
    version = BudgetService.get_version_by_id(db, version_id)
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget version not found"
        )

    if version.status != BudgetStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft versions can be deleted"
        )

    BudgetService.delete_version(db, version_id)
    return None
