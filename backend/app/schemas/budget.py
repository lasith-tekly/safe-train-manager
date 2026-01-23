from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class BudgetLineBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    allocated_amount: Decimal = Field(..., ge=0)
    display_order: int = Field(default=0)


class BudgetLineCreate(BudgetLineBase):
    pass


class BudgetLineUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    allocated_amount: Optional[Decimal] = Field(None, ge=0)
    display_order: Optional[int] = None


class BudgetLineResponse(BudgetLineBase):
    id: UUID
    consumed_amount: Decimal = Decimal("0")
    remaining_amount: Decimal = Decimal("0")
    consumption_percentage: float = 0.0

    class Config:
        from_attributes = True


class BudgetVersionBase(BaseModel):
    product_id: UUID
    year: int = Field(..., ge=2020, le=2100)
    name: str = Field(..., min_length=1, max_length=100)
    notes: Optional[str] = Field(None, max_length=1000)
    status: str = Field(default="draft")

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid = ['draft', 'active', 'archived', 'locked']
        if v not in valid:
            raise ValueError(f'Status must be one of: {", ".join(valid)}')
        return v


class BudgetVersionCreate(BudgetVersionBase):
    budget_lines: List[BudgetLineCreate]


class BudgetVersionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    notes: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = None
    budget_lines: Optional[List[BudgetLineCreate]] = None

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid = ['draft', 'active', 'archived', 'locked']
        if v not in valid:
            raise ValueError(f'Status must be one of: {", ".join(valid)}')
        return v


class BudgetVersionResponse(BaseModel):
    id: UUID
    product_id: UUID
    year: int
    name: str
    notes: Optional[str]
    status: str
    total_budget: Decimal
    total_consumed: Decimal = Decimal("0")
    total_remaining: Decimal = Decimal("0")
    budget_lines: List[BudgetLineResponse]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class BudgetVersionListResponse(BaseModel):
    data: List[BudgetVersionResponse]
    total: int
