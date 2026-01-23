from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class CapacityAllocationCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=255)
    default_percentage: int = Field(0, ge=0, le=100)
    color: Optional[str] = Field("#1890ff", max_length=20)
    sort_order: int = Field(0, ge=0)
    is_active: bool = Field(True)


class CapacityAllocationCategoryCreate(CapacityAllocationCategoryBase):
    year: int = Field(..., ge=2020, le=2100)


class CapacityAllocationCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    default_percentage: Optional[int] = Field(None, ge=0, le=100)
    color: Optional[str] = Field(None, max_length=20)
    sort_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class CapacityAllocationCategoryResponse(CapacityAllocationCategoryBase):
    id: str
    year: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CapacityAllocationSummary(BaseModel):
    """Summary of all capacity allocations for a year"""
    year: int
    categories: List[CapacityAllocationCategoryResponse]
    total_allocated: int
    remaining_for_iteration: int
