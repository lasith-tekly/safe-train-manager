from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from enum import Enum


class AllocationType(str, Enum):
    PERCENTAGE = "PERCENTAGE"
    ABSOLUTE = "ABSOLUTE"


# ============= Fiscal Year Schemas =============

class FiscalYearBase(BaseModel):
    year: int = Field(..., ge=2020, le=2100)
    start_month: int = Field(..., ge=1, le=12)
    start_day: int = Field(..., ge=1, le=31)
    end_month: int = Field(..., ge=1, le=12)
    end_day: int = Field(..., ge=1, le=31)
    is_current: bool = False


class FiscalYearCreate(FiscalYearBase):
    pass


class FiscalYearUpdate(BaseModel):
    is_current: Optional[bool] = None


class FiscalYearResponse(FiscalYearBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============= Budget Version Schemas =============

class BudgetVersionBase(BaseModel):
    fiscal_year_id: UUID
    effective_date: date
    notes: Optional[str] = Field(None, max_length=1000)


class BudgetVersionCreate(BudgetVersionBase):
    copy_from_version_id: Optional[UUID] = None


class BudgetVersionResponse(BaseModel):
    id: UUID
    fiscal_year_id: UUID
    version_number: int
    effective_date: date
    notes: Optional[str]
    is_active: bool
    created_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class UserInfo(BaseModel):
    id: UUID
    name: str


class BudgetVersionDetailResponse(BudgetVersionResponse):
    created_by_user: Optional[UserInfo] = None
    product_budgets: List["ProductBudgetResponse"] = []
    summary: Optional["BudgetSummary"] = None


# ============= Product Budget Schemas =============

class ProductBudgetBase(BaseModel):
    budget_version_id: UUID
    product_id: UUID
    allocated_amount: int = Field(..., ge=0)


class ProductBudgetCreate(ProductBudgetBase):
    pass


class ProductBudgetUpdate(BaseModel):
    allocated_amount: int = Field(..., ge=0)


class ProductInfo(BaseModel):
    id: UUID
    name: str
    short_code: str


class ProductBudgetResponse(BaseModel):
    id: UUID
    budget_version_id: UUID
    product: ProductInfo
    allocated_amount: float
    consumed_amount: float = 0.0
    remaining_amount: float = 0.0
    utilization_percentage: float = 0.0
    budget_lines_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ProductBudgetDetailResponse(ProductBudgetResponse):
    budget_lines: List["BudgetLineResponse"] = []


# ============= Budget Line Schemas =============

class BudgetLineAllocationCreate(BaseModel):
    product_budget_id: UUID
    allocation_type: AllocationType
    allocation_value: int = Field(..., ge=0)


class BudgetLineBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=10)
    name: str = Field(..., min_length=1, max_length=100)
    allocated_amount: int = Field(..., ge=0)
    is_transversal: bool = False
    is_roadmap_eligible: bool = True


class BudgetLineCreate(BudgetLineBase):
    budget_version_id: UUID
    product_id: Optional[UUID] = None  # Required for non-transversal lines
    product_budget_id: Optional[UUID] = None  # Auto-set by service
    product_allocations: Optional[List[BudgetLineAllocationCreate]] = None

    @field_validator('product_allocations')
    @classmethod
    def validate_transversal(cls, v, info):
        is_transversal = info.data.get('is_transversal', False)
        if is_transversal and (not v or len(v) < 2):
            raise ValueError('Transversal budget lines must have at least 2 product allocations')
        if not is_transversal and v:
            raise ValueError('Non-transversal budget lines cannot have product allocations')
        return v
    
    @field_validator('product_id')
    @classmethod
    def validate_product_id(cls, v, info):
        is_transversal = info.data.get('is_transversal', False)
        if not is_transversal and not v:
            raise ValueError('product_id is required for non-transversal budget lines')
        return v


class BudgetLineUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    allocated_amount: Optional[int] = Field(None, ge=0)
    is_transversal: Optional[bool] = None
    is_roadmap_eligible: Optional[bool] = None


class BudgetLineAllocationResponse(BaseModel):
    id: UUID
    product_budget_id: UUID
    allocation_type: AllocationType
    allocation_value: int

    class Config:
        from_attributes = True


class BudgetLineResponse(BaseModel):
    id: UUID
    product_budget_id: Optional[UUID]
    code: str
    name: str
    allocated_amount: int
    consumed_amount: int = 0
    remaining_amount: int = 0
    is_transversal: bool
    is_roadmap_eligible: bool = True
    created_at: datetime
    updated_at: Optional[datetime]
    categories: List["BudgetCategoryResponse"] = []
    product_allocations: List[BudgetLineAllocationResponse] = []

    class Config:
        from_attributes = True


# ============= Budget Category Schemas =============

class BudgetCategoryBase(BaseModel):
    budget_line_id: UUID
    name: str = Field(..., min_length=1, max_length=100)
    allocated_amount: int = Field(..., ge=0)


class BudgetCategoryCreate(BudgetCategoryBase):
    pass


class BudgetCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    allocated_amount: Optional[int] = Field(None, ge=0)


class BudgetCategoryResponse(BaseModel):
    id: UUID
    budget_line_id: UUID
    name: str
    allocated_amount: int
    consumed_amount: int = 0
    remaining_amount: int = 0
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============= Budget Summary Schemas =============

class BudgetSummary(BaseModel):
    total_budget: int
    total_consumed: int
    total_remaining: int
    utilization_percentage: float


class ProductBudgetSummary(BaseModel):
    product_id: UUID
    product_name: str
    allocated: int
    consumed: int
    remaining: int
    utilization: float


class BudgetLineSummary(BaseModel):
    code: str
    name: str
    allocated: int
    consumed: int
    remaining: int
    utilization: float


class BudgetSummaryResponse(BaseModel):
    fiscal_year: FiscalYearResponse
    version: BudgetVersionResponse
    total_budget: int
    total_consumed: int
    total_remaining: int
    utilization_percentage: float
    products: List[ProductBudgetSummary]
    budget_lines: List[BudgetLineSummary]


# ============= Budget Comparison Schemas =============

class BudgetVersionInfo(BaseModel):
    version_number: int
    effective_date: date


class BudgetChange(BaseModel):
    entity_type: str
    entity_name: str
    field: str
    old_value: int
    new_value: int
    change: int
    change_percentage: float


class BudgetComparisonResponse(BaseModel):
    version_1: BudgetVersionInfo
    version_2: BudgetVersionInfo
    changes: List[BudgetChange]


# ============= Audit Log Schemas =============

class BudgetAuditLogResponse(BaseModel):
    id: UUID
    entity_type: str
    entity_id: UUID
    action: str
    field_changed: Optional[str]
    old_value: Optional[str]
    new_value: Optional[str]
    changed_by: UserInfo
    changed_at: datetime

    class Config:
        from_attributes = True


class BudgetAuditLogListResponse(BaseModel):
    data: List[BudgetAuditLogResponse]
    pagination: dict


# ============= List Response Schemas =============

class FiscalYearListResponse(BaseModel):
    data: List[FiscalYearResponse]


class BudgetVersionListResponse(BaseModel):
    data: List[BudgetVersionResponse]


class ProductBudgetListResponse(BaseModel):
    data: List[ProductBudgetResponse]


# Update forward references
BudgetVersionDetailResponse.model_rebuild()
ProductBudgetDetailResponse.model_rebuild()
BudgetLineResponse.model_rebuild()
