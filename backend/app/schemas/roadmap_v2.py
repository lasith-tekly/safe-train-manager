"""
Roadmap Planning Schemas V2

Pydantic schemas for multi-year roadmap planning API.
"""
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, validator, UUID4
from decimal import Decimal
from datetime import datetime


# ============================================
# Request Schemas
# ============================================

class PIAllocationInput(BaseModel):
    """PI-level (quarterly) budget allocation input"""
    quarter: int = Field(..., ge=1, le=4, description="Quarter (1-4)")
    budget_keur: Decimal = Field(..., ge=0, description="Budget in KEUR")

    class Config:
        json_schema_extra = {
            "example": {
                "quarter": 1,
                "budget_keur": 20.0
            }
        }


class YearAllocationInput(BaseModel):
    """Year-based budget allocation input"""
    year: int = Field(..., ge=2020, le=2050, description="Year (e.g., 2026)")
    budget_keur: Decimal = Field(..., ge=0, description="Budget in KEUR")
    pi_allocations: Optional[List[PIAllocationInput]] = Field(None, description="Optional quarterly breakdown")

    @validator('pi_allocations')
    def validate_pi_allocations(cls, v, values):
        """Validate PI allocations if provided"""
        if v is not None:
            if not v:
                return v  # Empty list is ok, means no PI breakdown
            
            # Check for duplicate quarters
            quarters = [pi.quarter for pi in v]
            if len(quarters) != len(set(quarters)):
                raise ValueError("Duplicate quarters in PI allocations")
            
            # Validate sum equals year budget (with tolerance for floating point)
            if 'budget_keur' in values:
                year_budget = values['budget_keur']
                pi_sum = sum(pi.budget_keur for pi in v)
                if abs(pi_sum - year_budget) > Decimal('0.01'):
                    diff = pi_sum - year_budget
                    raise ValueError(
                        f"PI allocations sum ({pi_sum} KEUR) must equal year budget ({year_budget} KEUR). "
                        f"Difference: {'+' if diff > 0 else ''}{diff} KEUR"
                    )
        
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "year": 2026,
                "budget_keur": 100.0,
                "pi_allocations": [
                    {"quarter": 1, "budget_keur": 20.0},
                    {"quarter": 2, "budget_keur": 50.0},
                    {"quarter": 3, "budget_keur": 30.0},
                    {"quarter": 4, "budget_keur": 0.0}
                ]
            }
        }


class RoadmapCreate(BaseModel):
    """Schema for creating a new roadmap"""
    product_id: UUID4
    name: str = Field(..., max_length=200, description="Roadmap name")
    description: Optional[str] = Field(None, description="Optional description")

    class Config:
        json_schema_extra = {
            "example": {
                "product_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "name": "BRS Roadmap",
                "description": "Multi-year roadmap for BRS product"
            }
        }


class RoadmapUpdate(BaseModel):
    """Schema for updating roadmap details"""
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "BRS Roadmap - Updated",
                "description": "Updated description"
            }
        }


class RoadmapFeatureCreate(BaseModel):
    """Schema for creating a new feature in roadmap"""
    budget_line_id: UUID4
    budget_category_id: Optional[UUID4] = None
    name: str = Field(..., max_length=300, description="Feature name")
    description: Optional[str] = None
    priority: Optional[int] = Field(0, description="Priority for ordering")
    year_allocations: List[YearAllocationInput] = Field(..., min_items=1, description="Year-based budget allocations")

    @validator('year_allocations')
    def validate_year_allocations(cls, v):
        """Ensure at least one year has budget > 0"""
        if not v:
            raise ValueError("At least one year allocation is required")
        
        total_budget = sum(alloc.budget_keur for alloc in v)
        if total_budget == 0:
            raise ValueError("Total budget must be greater than 0")
        
        # Check for duplicate years
        years = [alloc.year for alloc in v]
        if len(years) != len(set(years)):
            raise ValueError("Duplicate years in allocations")
        
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "budget_line_id": "budget-line-uuid",
                "budget_category_id": "budget-cat-uuid",
                "name": "Feature A - Product Enhancement",
                "description": "Enhance product capabilities",
                "priority": 1,
                "year_allocations": [
                    {"year": 2026, "budget_keur": 50.0},
                    {"year": 2027, "budget_keur": 50.0}
                ]
            }
        }


class RoadmapFeatureUpdate(BaseModel):
    """Schema for updating a feature"""
    name: Optional[str] = Field(None, max_length=300)
    description: Optional[str] = None
    budget_line_id: Optional[UUID4] = None
    budget_category_id: Optional[UUID4] = None
    priority: Optional[int] = None
    status: Optional[Literal["planned", "in_progress", "completed", "cancelled"]] = None
    year_allocations: Optional[List[YearAllocationInput]] = None

    @validator('year_allocations')
    def validate_year_allocations(cls, v):
        """Validate year allocations if provided"""
        if v is not None:
            if not v:
                raise ValueError("If provided, year_allocations must not be empty")
            
            # Check for duplicate years
            years = [alloc.year for alloc in v]
            if len(years) != len(set(years)):
                raise ValueError("Duplicate years in allocations")
        
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Feature A - Updated",
                "year_allocations": [
                    {"year": 2026, "budget_keur": 70.0},
                    {"year": 2027, "budget_keur": 30.0}
                ]
            }
        }


class BudgetCalculationRequest(BaseModel):
    """Schema for calculating budget from effort days"""
    effort_days: Decimal = Field(..., gt=0, description="Effort days to convert")
    year: int = Field(..., ge=2020, le=2050, description="Year for conversion factors")

    class Config:
        json_schema_extra = {
            "example": {
                "effort_days": 50.0,
                "year": 2026
            }
        }


class EffortDaysCalculationRequest(BaseModel):
    """Schema for calculating effort days from budget"""
    budget_keur: Decimal = Field(..., gt=0, description="Budget in KEUR to convert")
    year: int = Field(..., ge=2020, le=2050, description="Year for conversion factors")

    class Config:
        json_schema_extra = {
            "example": {
                "budget_keur": 50.0,
                "year": 2026
            }
        }


# ============================================
# Response Schemas
# ============================================

class PIAllocationResponse(BaseModel):
    """PI-level allocation response"""
    id: UUID4
    quarter: int
    budget_keur: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class YearAllocationResponse(BaseModel):
    """Year-based allocation response"""
    id: UUID4
    year: int
    budget_keur: Decimal
    effort_days: Decimal
    pi_allocations: List[PIAllocationResponse] = []

    class Config:
        from_attributes = True


class BudgetAlertResponse(BaseModel):
    """Budget alert for a specific year"""
    year: int
    budget_line_name: str
    category_name: Optional[str]
    status: Literal["balanced", "under_planned", "over_budget", "no_budget"]
    message: str
    allocated_keur: Optional[Decimal]
    planned_keur: Decimal
    variance_keur: Optional[Decimal]
    utilization_percent: Optional[Decimal]

    class Config:
        json_schema_extra = {
            "example": {
                "year": 2026,
                "budget_line_name": "Product Evolution",
                "category_name": "New Features",
                "status": "over_budget",
                "message": "Over budget by 5 KEUR",
                "allocated_keur": 60.0,
                "planned_keur": 65.0,
                "variance_keur": -5.0,
                "utilization_percent": 108.3
            }
        }


class RoadmapFeatureResponse(BaseModel):
    """Schema for feature response"""
    id: UUID4
    roadmap_id: UUID4
    budget_line_id: UUID4
    budget_line_name: str
    budget_category_id: Optional[UUID4]
    budget_category_name: Optional[str]
    name: str
    description: Optional[str]
    priority: int
    status: str
    total_budget_keur: Decimal
    total_effort_days: Decimal
    year_allocations: List[YearAllocationResponse]
    created_by: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BudgetCategorySummary(BaseModel):
    """Budget category summary for a specific year"""
    budget_category_id: UUID4
    category_name: str
    allocated_keur: Optional[Decimal]
    planned_keur: Decimal
    variance_keur: Optional[Decimal]
    utilization_percent: Optional[Decimal]
    status: Literal["balanced", "under_planned", "over_budget", "no_budget"]
    feature_count: int


class BudgetLineSummary(BaseModel):
    """Budget line summary for a specific year"""
    budget_line_id: UUID4
    budget_line_name: str
    allocated_keur: Optional[Decimal]
    planned_keur: Decimal
    variance_keur: Optional[Decimal]
    utilization_percent: Optional[Decimal]
    status: Literal["balanced", "under_planned", "over_budget", "no_budget"]
    feature_count: int
    categories: List[BudgetCategorySummary] = []


class YearBudgetSummary(BaseModel):
    """Budget summary for a specific year"""
    year: int
    has_budget: bool
    fiscal_year_id: Optional[UUID4] = None
    budget_version_id: Optional[UUID4] = None
    budget_version_name: Optional[str] = None
    total_allocated_keur: Optional[Decimal] = None
    total_planned_keur: Decimal
    overall_status: Optional[Literal["balanced", "under_planned", "over_budget"]] = None
    budget_lines: List[BudgetLineSummary] = []
    note: Optional[str] = None


class RoadmapResponse(BaseModel):
    """Complete roadmap response with features"""
    id: UUID4
    product_id: UUID4
    product_name: str
    product_code: str
    name: str
    description: Optional[str]
    status: str
    created_by: UUID4
    created_at: datetime
    updated_at: datetime
    features: List[RoadmapFeatureResponse]
    budget_summary: Dict[int, YearBudgetSummary]  # Key: year

    class Config:
        from_attributes = True


class RoadmapListItem(BaseModel):
    """Roadmap list item for listing endpoint"""
    id: UUID4
    product_id: UUID4
    product_name: str
    name: str
    description: Optional[str]
    status: str
    feature_count: int
    total_budget_keur: Decimal
    years_covered: List[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RoadmapListResponse(BaseModel):
    """Paginated list of roadmaps"""
    data: List[RoadmapListItem]
    total: int


class BudgetLineOption(BaseModel):
    """Budget line option for dropdown"""
    budget_line_id: UUID4
    budget_line_name: str
    budget_line_code: str
    categories: List[Dict[str, Any]]
    allocations_by_year: Dict[int, Dict[str, Any]]


class BudgetLinesResponse(BaseModel):
    """Response for budget lines endpoint"""
    data: List[BudgetLineOption]


class BudgetCalculationResponse(BaseModel):
    """Response for budget calculation"""
    effort_days: Decimal
    budget_keur: Decimal
    calculation: Dict[str, Any]


class EffortDaysCalculationResponse(BaseModel):
    """Response for effort days calculation"""
    budget_keur: Decimal
    effort_days: Decimal
    calculation: Dict[str, Any]


class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    data: Optional[Dict[str, Any]] = None


class FeatureCreateResponse(BaseModel):
    """Response after creating a feature"""
    feature: RoadmapFeatureResponse
    budget_alerts: List[BudgetAlertResponse]
