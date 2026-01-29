"""
Budget Allocation Schemas

Schemas for feature budget line allocations with percentage splits
"""
from typing import Optional
from pydantic import BaseModel, Field, validator
from decimal import Decimal
from datetime import datetime


class BudgetLineAllocationInput(BaseModel):
    """Budget line allocation input with percentage"""
    budget_line_id: str
    allocation_percentage: Decimal = Field(..., gt=0, le=100, description="Percentage allocated to this budget line")
    
    class Config:
        json_schema_extra = {
            "example": {
                "budget_line_id": "uuid",
                "allocation_percentage": 50.00
            }
        }


class BudgetLineAllocationResponse(BaseModel):
    """Budget line allocation response"""
    id: str
    budget_line_id: str
    budget_line_name: Optional[str] = None
    budget_line_code: Optional[str] = None
    allocation_percentage: Decimal
    allocated_effort_days: Optional[Decimal] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "uuid",
                "budget_line_id": "uuid",
                "budget_line_name": "Product Evolution",
                "budget_line_code": "PE",
                "allocation_percentage": 50.00,
                "allocated_effort_days": 25.00,
                "created_at": "2026-01-29T12:00:00",
                "updated_at": None
            }
        }
