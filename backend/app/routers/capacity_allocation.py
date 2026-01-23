from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.capacity_allocation import (
    CapacityAllocationCategoryCreate,
    CapacityAllocationCategoryUpdate,
    CapacityAllocationCategoryResponse,
    CapacityAllocationSummary
)
from app.services.capacity_allocation_service import CapacityAllocationService

router = APIRouter(prefix="/api/capacity-allocations", tags=["Capacity Allocations"])


@router.get("/{year}", response_model=List[CapacityAllocationCategoryResponse])
def get_categories(year: int, include_inactive: bool = False, db: Session = Depends(get_db)):
    """Get all capacity allocation categories for a year"""
    categories = CapacityAllocationService.get_categories_by_year(
        db, year, active_only=not include_inactive
    )
    # Initialize defaults if none exist
    if not categories:
        categories = CapacityAllocationService.initialize_default_categories(db, year)
    return categories


@router.get("/{year}/summary", response_model=CapacityAllocationSummary)
def get_summary(year: int, db: Session = Depends(get_db)):
    """Get capacity allocation summary for a year"""
    # Ensure categories exist
    categories = CapacityAllocationService.get_categories_by_year(db, year, active_only=True)
    if not categories:
        CapacityAllocationService.initialize_default_categories(db, year)
    return CapacityAllocationService.get_summary(db, year)


@router.post("", response_model=CapacityAllocationCategoryResponse)
def create_category(data: CapacityAllocationCategoryCreate, db: Session = Depends(get_db)):
    """Create a new capacity allocation category"""
    # Check total doesn't exceed 100%
    existing = CapacityAllocationService.get_categories_by_year(db, data.year, active_only=True)
    total = sum(c.default_percentage for c in existing) + data.default_percentage
    if total > 100:
        raise HTTPException(
            status_code=400,
            detail=f"Total allocation would exceed 100% (current: {total - data.default_percentage}%, adding: {data.default_percentage}%)"
        )
    
    return CapacityAllocationService.create_category(db, data)


@router.put("/{category_id}", response_model=CapacityAllocationCategoryResponse)
def update_category(
    category_id: str, 
    data: CapacityAllocationCategoryUpdate, 
    db: Session = Depends(get_db)
):
    """Update a capacity allocation category"""
    category = CapacityAllocationService.get_category_by_id(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check total doesn't exceed 100% if percentage is being updated
    if data.default_percentage is not None:
        existing = CapacityAllocationService.get_categories_by_year(db, category.year, active_only=True)
        total = sum(c.default_percentage for c in existing if c.id != category_id) + data.default_percentage
        if total > 100:
            raise HTTPException(
                status_code=400,
                detail=f"Total allocation would exceed 100%"
            )
    
    updated = CapacityAllocationService.update_category(db, category_id, data)
    return updated


@router.delete("/{category_id}")
def delete_category(category_id: str, hard: bool = False, db: Session = Depends(get_db)):
    """Delete a capacity allocation category (soft delete by default)"""
    category = CapacityAllocationService.get_category_by_id(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if hard:
        success = CapacityAllocationService.hard_delete_category(db, category_id)
    else:
        success = CapacityAllocationService.delete_category(db, category_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete category")
    
    return {"message": "Category deleted successfully"}
