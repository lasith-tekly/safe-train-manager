"""
Roadmap V4 Schemas - Effort-Centric Design

Pydantic schemas for request/response validation
"""
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, validator, field_validator
from decimal import Decimal
from datetime import datetime


# ============================================
# Request Schemas
# ============================================

class BudgetLineAllocationInput(BaseModel):
    """Budget line allocation input with percentage"""
    budget_line_id: str
    category_id: Optional[str] = None
    allocation_percentage: Decimal = Field(..., gt=0, le=100, description="Percentage allocated to this budget line")
    
    class Config:
        json_schema_extra = {
            "example": {
                "budget_line_id": "uuid",
                "category_id": "uuid",
                "allocation_percentage": 50.00
            }
        }


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
    """Create feature request with multiple budget line allocations"""
    product_id: str
    budget_allocations: List[BudgetLineAllocationInput] = Field(..., min_length=1, description="Budget line allocations with percentages")
    name: str = Field(..., max_length=500)
    customer: Optional[str] = Field(None, max_length=255)
    priority: int = Field(default=0)
    gross_sizing_ed: Decimal = Field(..., gt=0, description="Gross effort days (user input)")
    remarks: Optional[str] = None
    team_ids: List[str] = Field(default_factory=list, description="Team IDs to assign")
    quarterly_allocations: List[QuarterlyAllocationInput] = Field(default_factory=list)

    @validator('budget_allocations')
    def validate_budget_allocations(cls, v):
        """Validate budget allocations sum to 100% and no duplicates"""
        if not v:
            raise ValueError("At least one budget line allocation is required")
        
        # Check for duplicate budget lines
        budget_line_ids = [alloc.budget_line_id for alloc in v]
        if len(budget_line_ids) != len(set(budget_line_ids)):
            raise ValueError("Duplicate budget lines are not allowed")
        
        # Check total percentage equals 100
        total = sum(alloc.allocation_percentage for alloc in v)
        if abs(total - 100) > 0.01:  # Allow small floating point differences
            raise ValueError(f"Budget allocations must sum to 100%, got {total}%")
        
        return v

    @validator('quarterly_allocations')
    def validate_quarterly_allocations(cls, v):
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
                "budget_allocations": [
                    {"budget_line_id": "uuid-1", "allocation_percentage": 50.00},
                    {"budget_line_id": "uuid-2", "allocation_percentage": 50.00}
                ],
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
    budget_allocations: Optional[List[BudgetLineAllocationInput]] = None
    team_ids: Optional[List[str]] = None
    quarterly_allocations: Optional[List[QuarterlyAllocationInput]] = None

    @validator('budget_allocations')
    def validate_budget_allocations(cls, v):
        """Validate budget allocations sum to 100% and no duplicates"""
        if v:
            # Check for duplicate budget lines
            budget_line_ids = [alloc.budget_line_id for alloc in v]
            if len(budget_line_ids) != len(set(budget_line_ids)):
                raise ValueError("Duplicate budget lines are not allowed")
            
            # Check total percentage equals 100
            total = sum(alloc.allocation_percentage for alloc in v)
            if abs(total - 100) > 0.01:
                raise ValueError(f"Budget allocations must sum to 100%, got {total}%")
        
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Disruption Management - Updated",
                "priority": 2,
                "status": "in_progress",
                "budget_allocations": [
                    {"budget_line_id": "uuid-1", "allocation_percentage": 60.00},
                    {"budget_line_id": "uuid-2", "allocation_percentage": 40.00}
                ]
            }
        }


class CreateJiraRecordRequest(BaseModel):
    """Create JIRA record request - supports both old and new field names"""
    jira_key: str = Field(..., max_length=50)
    
    # New PI-based fields (primary)
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    pi_id: Optional[str] = None
    planned_effort: float = Field(default=0, ge=0)
    version_id: Optional[str] = Field(None, description="Roadmap version ID - inherited from feature if not provided")
    
    # Old quarter-based fields (deprecated, for backward compatibility)
    summary: Optional[str] = Field(None, max_length=500)
    remarks: Optional[str] = None
    is_spillover: Optional[bool] = False
    spillover_from_quarter: Optional[int] = Field(None, ge=1, le=4)
    spillover_from_year: Optional[int] = Field(None, ge=2020, le=2050)
    
    # Common fields
    team_id: str
    status: Literal["PLANNED", "IN_PROGRESS", "COMPLETED", "SPILLOVER", "planned", "in_progress", "done", "spillover"] = "PLANNED"
    quarterly_allocations: List[QuarterlyAllocationInput] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "jira_key": "AOP-25718",
                "title": "User authentication module",
                "description": "Implement JWT authentication",
                "team_id": "team-uuid",
                "pi_id": "pi-uuid",
                "version_id": "version-uuid",
                "planned_effort": 15.0,
                "status": "PLANNED"
            }
        }


class UpdateJiraRecordRequest(BaseModel):
    """Update JIRA record request - supports both old and new field names"""
    jira_key: Optional[str] = Field(None, max_length=50)
    
    # New PI-based fields (primary)
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    pi_id: Optional[str] = None
    planned_effort: Optional[float] = Field(None, ge=0)
    actual_effort: Optional[float] = Field(None, ge=0)
    spillover_from_pi_id: Optional[str] = None
    spillover_reason: Optional[str] = None
    spillover_category: Optional[str] = None
    spillover_category_other: Optional[str] = Field(None, max_length=500)
    
    # Old quarter-based fields (deprecated, for backward compatibility)
    summary: Optional[str] = Field(None, max_length=500)
    remarks: Optional[str] = None
    is_spillover: Optional[bool] = None
    spillover_from_quarter: Optional[int] = Field(None, ge=1, le=4)
    spillover_from_year: Optional[int] = Field(None, ge=2020, le=2050)
    
    # Common fields
    team_id: Optional[str] = None
    status: Optional[Literal["PLANNED", "IN_PROGRESS", "COMPLETED", "SPILLOVER", "planned", "in_progress", "done", "spillover"]] = None
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
        json_encoders = {
            Decimal: float  # Serialize Decimal as float instead of string
        }


class BudgetLineAllocationResponse(BaseModel):
    """Budget line allocation response"""
    id: str
    budget_line_id: str
    budget_line_name: Optional[str] = None
    category_id: Optional[str]
    allocation_percentage: Decimal
    allocated_effort_days: Optional[Decimal]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: float  # Serialize Decimal as float instead of string
        }


class TeamSummary(BaseModel):
    """Team summary for feature"""
    id: str
    name: str

    class Config:
        from_attributes = True


class JiraRecordResponse(BaseModel):
    """JIRA record response - supports both old and new schemas"""
    id: str
    feature_id: str
    jira_key: Optional[str] = None
    
    # New PI-based fields (primary)
    title: Optional[str] = None
    description: Optional[str] = None
    pi_id: Optional[str] = None
    pi: Optional[dict] = None
    planned_effort: float = 0
    actual_effort: Optional[float] = None
    spillover_from_pi_id: Optional[str] = None
    spillover_reason: Optional[str] = None
    
    # Old quarter-based fields (deprecated, for backward compatibility)
    summary: Optional[str] = None
    remarks: Optional[str] = None
    is_spillover: Optional[bool] = False
    spillover_from_quarter: Optional[int] = None
    spillover_from_year: Optional[int] = None
    
    # Common fields
    team_id: Optional[str] = None
    team: Optional[TeamSummary] = None
    status: str = "PLANNED"
    quarterly_allocations: Optional[List[QuarterlyAllocationResponse]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: float  # Serialize Decimal as float instead of string
        }


class FeatureResponse(BaseModel):
    """Feature response with multiple budget line allocations"""
    id: str
    product_id: str
    budget_allocations: List[BudgetLineAllocationResponse]
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
        json_encoders = {
            Decimal: float  # Serialize Decimal as float instead of string
        }


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
        json_encoders = {
            Decimal: float  # Serialize Decimal as float instead of string
        }
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

    class Config:
        json_encoders = {
            Decimal: float  # Serialize Decimal as float instead of string
        }


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

    class Config:
        json_encoders = {
            Decimal: float  # Serialize Decimal as float instead of string
        }


class FeatureConsistencyResult(BaseModel):
    """Feature consistency validation"""
    feature_id: str
    year: int
    quarter: int
    feature_planned_ed: Decimal
    jira_allocated_ed: Decimal
    status: Literal["exceeded", "ok"]
    message: Optional[str]

    class Config:
        json_encoders = {
            Decimal: float  # Serialize Decimal as float instead of string
        }


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
