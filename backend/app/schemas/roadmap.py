"""
Roadmap Planning Schemas

Pydantic schemas for request/response validation in Roadmap Planning API.
"""
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, validator, UUID4
from decimal import Decimal
from datetime import datetime


# ============================================
# Request Schemas
# ============================================

class RoadmapCreate(BaseModel):
    """Schema for creating a new roadmap"""
    product_id: UUID4
    fiscal_year_id: UUID4
    budget_version_id: UUID4
    name: str = Field(..., max_length=200, description="Roadmap name")
    description: Optional[str] = Field(None, description="Optional description")

    class Config:
        schema_extra = {
            "example": {
                "product_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "fiscal_year_id": "fy-2026-uuid",
                "budget_version_id": "budget-v1-uuid",
                "name": "BRS 2026 Roadmap",
                "description": "Annual roadmap for BRS product"
            }
        }


class RoadmapUpdate(BaseModel):
    """Schema for updating roadmap details"""
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "name": "BRS 2026 Roadmap - Updated",
                "description": "Updated description"
            }
        }


class RoadmapStatusUpdate(BaseModel):
    """Schema for updating roadmap status"""
    status: Literal["draft", "active", "archived"]

    class Config:
        schema_extra = {
            "example": {
                "status": "active"
            }
        }


class RoadmapFeatureCreate(BaseModel):
    """Schema for creating a new feature in roadmap"""
    budget_line_id: UUID4
    budget_category_id: Optional[UUID4] = None
    name: str = Field(..., max_length=300, description="Feature name")
    description: Optional[str] = None
    priority: Optional[int] = Field(0, description="Priority for ordering")
    q1_effort_days: Decimal = Field(default=Decimal("0"), ge=0, description="Q1 effort days")
    q2_effort_days: Decimal = Field(default=Decimal("0"), ge=0, description="Q2 effort days")
    q3_effort_days: Decimal = Field(default=Decimal("0"), ge=0, description="Q3 effort days")
    q4_effort_days: Decimal = Field(default=Decimal("0"), ge=0, description="Q4 effort days")

    @validator('q4_effort_days')
    def validate_total_not_zero(cls, v, values):
        """Ensure at least one quarter has effort days > 0"""
        total = (
            values.get('q1_effort_days', Decimal("0")) +
            values.get('q2_effort_days', Decimal("0")) +
            values.get('q3_effort_days', Decimal("0")) +
            v
        )
        if total == 0:
            raise ValueError("At least one quarter must have effort days > 0")
        return v

    class Config:
        schema_extra = {
            "example": {
                "budget_line_id": "budget-line-uuid",
                "budget_category_id": "budget-cat-uuid",
                "name": "Feature A - Product Enhancement",
                "description": "Enhance product capabilities",
                "priority": 1,
                "q1_effort_days": 50.0,
                "q2_effort_days": 20.0,
                "q3_effort_days": 80.0,
                "q4_effort_days": 50.0
            }
        }


class RoadmapFeatureUpdate(BaseModel):
    """Schema for updating a feature"""
    name: Optional[str] = Field(None, max_length=300)
    description: Optional[str] = None
    priority: Optional[int] = None
    q1_effort_days: Optional[Decimal] = Field(None, ge=0)
    q2_effort_days: Optional[Decimal] = Field(None, ge=0)
    q3_effort_days: Optional[Decimal] = Field(None, ge=0)
    q4_effort_days: Optional[Decimal] = Field(None, ge=0)

    class Config:
        schema_extra = {
            "example": {
                "name": "Feature A - Updated",
                "q1_effort_days": 60.0,
                "q2_effort_days": 30.0
            }
        }


class FeatureStatusUpdate(BaseModel):
    """Schema for updating feature status"""
    status: Literal["planned", "in_progress", "completed", "cancelled"]

    class Config:
        schema_extra = {
            "example": {
                "status": "in_progress"
            }
        }


class FeatureReorderRequest(BaseModel):
    """Schema for reordering features"""
    feature_ids: List[UUID4] = Field(..., description="Ordered list of feature IDs")

    class Config:
        schema_extra = {
            "example": {
                "feature_ids": [
                    "feat-uuid-1",
                    "feat-uuid-2",
                    "feat-uuid-3"
                ]
            }
        }


class BudgetCalculationRequest(BaseModel):
    """Schema for calculating budget from effort days"""
    effort_days: Decimal = Field(..., gt=0, description="Effort days to convert")
    fiscal_year_id: UUID4

    class Config:
        schema_extra = {
            "example": {
                "effort_days": 50.0,
                "fiscal_year_id": "fy-2026-uuid"
            }
        }


class EffortDaysCalculationRequest(BaseModel):
    """Schema for calculating effort days from budget"""
    budget_keur: Decimal = Field(..., gt=0, description="Budget in KEUR to convert")
    fiscal_year_id: UUID4

    class Config:
        schema_extra = {
            "example": {
                "budget_keur": 50.0,
                "fiscal_year_id": "fy-2026-uuid"
            }
        }


# ============================================
# Response Schemas
# ============================================

class QuarterlyAllocation(BaseModel):
    """Quarterly allocation details"""
    effort_days: Decimal
    budget_keur: Decimal

    class Config:
        orm_mode = True


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
    total_effort_days: Decimal
    total_budget_keur: Decimal
    q1_effort_days: Decimal
    q1_budget_keur: Decimal
    q2_effort_days: Decimal
    q2_budget_keur: Decimal
    q3_effort_days: Decimal
    q3_budget_keur: Decimal
    q4_effort_days: Decimal
    q4_budget_keur: Decimal
    created_by: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class BudgetCategorySummary(BaseModel):
    """Budget category summary"""
    budget_category_id: UUID4
    category_name: str
    allocated_budget_keur: Decimal
    planned_budget_keur: Decimal
    remaining_budget_keur: Decimal
    utilization_percent: Decimal
    status: str
    feature_count: int


class BudgetLineSummary(BaseModel):
    """Budget line summary with categories"""
    budget_line_id: UUID4
    budget_line_name: str
    allocated_budget_keur: Decimal
    planned_budget_keur: Decimal
    remaining_budget_keur: Decimal
    utilization_percent: Decimal
    status: str
    feature_count: int
    categories: List[BudgetCategorySummary] = []


class QuarterlyTotals(BaseModel):
    """Quarterly totals"""
    q1: QuarterlyAllocation
    q2: QuarterlyAllocation
    q3: QuarterlyAllocation
    q4: QuarterlyAllocation


class RoadmapSummary(BaseModel):
    """Roadmap summary statistics"""
    total_budget_keur: Decimal
    planned_budget_keur: Decimal
    remaining_budget_keur: Decimal
    utilization_percent: Decimal
    feature_count: int
    quarterly_totals: QuarterlyTotals


class RoadmapResponse(BaseModel):
    """Complete roadmap response with features"""
    id: UUID4
    product_id: UUID4
    product_name: str
    product_code: str
    fiscal_year_id: UUID4
    fiscal_year_name: str
    budget_version_id: UUID4
    name: str
    description: Optional[str]
    status: str
    created_by: UUID4
    created_at: datetime
    updated_at: datetime
    summary: RoadmapSummary
    budget_lines: List[BudgetLineSummary]
    features: List[RoadmapFeatureResponse]

    class Config:
        orm_mode = True


class RoadmapListItem(BaseModel):
    """Roadmap list item for listing endpoint"""
    id: UUID4
    product_id: UUID4
    product_name: str
    fiscal_year_id: UUID4
    fiscal_year_name: str
    budget_version_id: UUID4
    name: str
    description: Optional[str]
    status: str
    total_budget_keur: Decimal
    planned_budget_keur: Decimal
    remaining_budget_keur: Decimal
    utilization_percent: Decimal
    feature_count: int
    created_by: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class RoadmapListResponse(BaseModel):
    """Paginated list of roadmaps"""
    data: List[RoadmapListItem]
    total: int
    page: int
    page_size: int


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


class BudgetValidationResponse(BaseModel):
    """Response for budget validation"""
    valid: bool
    allocated_budget_keur: Decimal
    current_planned_keur: Decimal
    new_planned_keur: Decimal
    remaining_budget_keur: Decimal
    utilization_percent: Decimal
    status: str
    entity_name: str
    warning_message: Optional[str]


class QuarterlySummaryItem(BaseModel):
    """Quarterly summary for a budget line"""
    budget_line_id: UUID4
    budget_line_name: str
    effort_days: Decimal
    budget_keur: Decimal
    feature_count: int


class QuarterlySummary(BaseModel):
    """Summary for a quarter"""
    quarter: str
    total_effort_days: Decimal
    total_budget_keur: Decimal
    feature_count: int
    budget_lines: List[QuarterlySummaryItem]


class QuarterlySummaryResponse(BaseModel):
    """Response for quarterly summary endpoint"""
    roadmap_id: UUID4
    quarters: List[QuarterlySummary]


class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    updated_count: Optional[int] = None
