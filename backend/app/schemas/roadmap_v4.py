"""
Roadmap V4 Schemas - Effort-Centric Design

Pydantic schemas for request/response validation
"""
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, validator
from decimal import Decimal
from datetime import datetime


# ============================================
# Request Schemas
# ============================================

class QuarterlyAllocationInput(BaseModel):
    """Quarterly allocation input (Net eD)"""
    year: int = Field(..., ge=2020, le=2050)
    quarter: int = Field(..., ge=1, le=4)
    allocated_ed: Decimal = Field(..., ge=0, description="Net effort days")

    class Config:
        json_schema_extra = {
            "example": {
                "year": 2026,
                "quarter": 1,
                "allocated_ed": 10.0
            }
        }


class CreateFeatureRequest(BaseModel):
    """Create feature request"""
    product_id: str
    budget_line_id: str
    category_id: Optional[str] = None
    name: str = Field(..., max_length=500)
    customer: Optional[str] = Field(None, max_length=255)
    priority: int = Field(default=0)
    gross_sizing_ed: Decimal = Field(..., gt=0, description="Gross effort days (user input)")
    remarks: Optional[str] = None
    team_ids: List[str] = Field(default_factory=list, description="Team IDs to assign")
    quarterly_allocations: List[QuarterlyAllocationInput] = Field(default_factory=list)

    @validator('quarterly_allocations')
    def validate_allocations(cls, v):
        """Validate no duplicate year/quarter combinations"""
        if v:
            seen = set()
            for alloc in v:
                key = (alloc.year, alloc.quarter)
                if key in seen:
                    raise ValueError(f"Duplicate allocation for {alloc.year} Q{alloc.quarter}")
                seen.add(key)
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "product_id": "uuid",
                "budget_line_id": "uuid",
                "name": "Disruption Management",
                "customer": "AVINOR",
                "priority": 1,
                "gross_sizing_ed": 280.0,
                "team_ids": ["team-uuid-1", "team-uuid-2"],
                "quarterly_allocations": [
                    {"year": 2026, "quarter": 1, "allocated_ed": 10.0},
                    {"year": 2026, "quarter": 2, "allocated_ed": 20.0}
                ]
            }
        }


class UpdateFeatureRequest(BaseModel):
    """Update feature request"""
    name: Optional[str] = Field(None, max_length=500)
    customer: Optional[str] = Field(None, max_length=255)
    priority: Optional[int] = None
    gross_sizing_ed: Optional[Decimal] = Field(None, gt=0)
    remarks: Optional[str] = None
    status: Optional[Literal["planned", "in_progress", "completed", "cancelled"]] = None
    team_ids: Optional[List[str]] = None
    quarterly_allocations: Optional[List[QuarterlyAllocationInput]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Disruption Management - Updated",
                "priority": 2,
                "status": "in_progress"
            }
        }


class CreateJiraRecordRequest(BaseModel):
    """Create JIRA record request"""
    jira_key: str = Field(..., max_length=50)
    summary: Optional[str] = Field(None, max_length=500)
    team_id: str
    status: Literal["planned", "in_progress", "done", "spillover"] = "planned"
    is_spillover: bool = False
    spillover_from_quarter: Optional[int] = Field(None, ge=1, le=4)
    spillover_from_year: Optional[int] = Field(None, ge=2020, le=2050)
    remarks: Optional[str] = None
    quarterly_allocations: List[QuarterlyAllocationInput] = Field(default_factory=list)

    @validator('spillover_from_quarter')
    def validate_spillover_quarter(cls, v, values):
        """If spillover, must have spillover_from_quarter"""
        if values.get('is_spillover') and not v:
            raise ValueError("spillover_from_quarter required when is_spillover=True")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "jira_key": "AOP-25718",
                "summary": "User authentication module",
                "team_id": "team-uuid",
                "status": "planned",
                "quarterly_allocations": [
                    {"year": 2026, "quarter": 1, "allocated_ed": 20.0}
                ]
            }
        }


class UpdateJiraRecordRequest(BaseModel):
    """Update JIRA record request"""
    jira_key: Optional[str] = Field(None, max_length=50)
    summary: Optional[str] = Field(None, max_length=500)
    team_id: Optional[str] = None
    status: Optional[Literal["planned", "in_progress", "done", "spillover"]] = None
    is_spillover: Optional[bool] = None
    spillover_from_quarter: Optional[int] = Field(None, ge=1, le=4)
    spillover_from_year: Optional[int] = Field(None, ge=2020, le=2050)
    remarks: Optional[str] = None
    quarterly_allocations: Optional[List[QuarterlyAllocationInput]] = None


class CalculateSizingRequest(BaseModel):
    """Calculate net sizing and cost from gross sizing"""
    gross_sizing_ed: Decimal = Field(..., gt=0)

    class Config:
        json_schema_extra = {
            "example": {
                "gross_sizing_ed": 280.0
            }
        }


# ============================================
# Response Schemas
# ============================================

class QuarterlyAllocationResponse(BaseModel):
    """Quarterly allocation response"""
    id: str
    year: int
    quarter: int
    allocated_ed: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TeamSummary(BaseModel):
    """Team summary for feature"""
    id: str
    name: str

    class Config:
        from_attributes = True


class JiraRecordResponse(BaseModel):
    """JIRA record response"""
    id: str
    feature_id: str
    jira_key: str
    summary: Optional[str]
    team_id: str
    team: Optional[TeamSummary]
    status: str
    is_spillover: bool
    spillover_from_quarter: Optional[int]
    spillover_from_year: Optional[int]
    remarks: Optional[str]
    quarterly_allocations: List[QuarterlyAllocationResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FeatureResponse(BaseModel):
    """Feature response"""
    id: str
    product_id: str
    budget_line_id: str
    category_id: Optional[str]
    name: str
    customer: Optional[str]
    priority: int
    status: str
    remarks: Optional[str]
    gross_sizing_ed: Decimal
    net_sizing_ed: Decimal
    total_cost_keur: Decimal
    teams: List[TeamSummary]
    quarterly_allocations: List[QuarterlyAllocationResponse]
    jira_records: Optional[List[JiraRecordResponse]] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str]

    class Config:
        from_attributes = True


class FeatureListResponse(BaseModel):
    """Paginated feature list response"""
    data: List[FeatureResponse]
    total: int
    page: int = 1
    page_size: int = 50


class CalculateSizingResponse(BaseModel):
    """Calculation response"""
    gross_sizing_ed: Decimal
    net_sizing_ed: Decimal
    total_cost_keur: Decimal

    class Config:
        json_schema_extra = {
            "example": {
                "gross_sizing_ed": 280.0,
                "net_sizing_ed": 100.0,
                "total_cost_keur": 99.27
            }
        }


# ============================================
# Validation Response Schemas
# ============================================

class BudgetValidationResult(BaseModel):
    """Budget validation result for a specific level"""
    level: Literal["product", "budget_line", "category"]
    name: str
    allocated_keur: Decimal
    planned_keur: Decimal
    percentage: Decimal
    status: Literal["over_planned", "approaching", "under_planned", "healthy", "no_budget"]
    message: str


class CapacityValidationResult(BaseModel):
    """Capacity validation result for a team/quarter"""
    team_id: str
    team_name: str
    year: int
    quarter: int
    capacity_ed: Decimal
    allocated_ed: Decimal
    remaining_ed: Decimal
    utilization: Decimal
    status: Literal["over_allocated", "high_utilization", "healthy", "no_capacity"]
    message: str


class FeatureConsistencyResult(BaseModel):
    """Feature consistency validation"""
    feature_id: str
    year: int
    quarter: int
    feature_planned_ed: Decimal
    jira_allocated_ed: Decimal
    status: Literal["exceeded", "ok"]
    message: Optional[str]


class ValidationSummaryResponse(BaseModel):
    """Complete validation summary"""
    budget_validations: List[BudgetValidationResult]
    capacity_validations: List[CapacityValidationResult]
    consistency_validations: List[FeatureConsistencyResult]
    has_errors: bool
    has_warnings: bool


# ============================================
# Train Configuration Schemas
# ============================================

class TrainConfigResponse(BaseModel):
    """Train configuration settings"""
    train_unit_cost_keur: float
    effort_days_per_year: int
    train_structural_cost_ratio: float

    class Config:
        json_schema_extra = {
            "example": {
                "train_unit_cost_keur": 78.0,
                "effort_days_per_year": 220,
                "train_structural_cost_ratio": 2.8
            }
        }


class UpdateTrainConfigRequest(BaseModel):
    """Update train configuration"""
    train_unit_cost_keur: Optional[float] = Field(None, gt=0)
    effort_days_per_year: Optional[int] = Field(None, gt=0)
    train_structural_cost_ratio: Optional[float] = Field(None, gt=0)

    class Config:
        json_schema_extra = {
            "example": {
                "train_unit_cost_keur": 80.0,
                "effort_days_per_year": 220,
                "train_structural_cost_ratio": 2.9
            }
        }
