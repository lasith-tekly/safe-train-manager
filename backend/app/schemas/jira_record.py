"""
Pydantic schemas for JIRA Records API

Handles request/response validation for execution planning endpoints.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict
from datetime import datetime
from decimal import Decimal


class JiraRecordCreate(BaseModel):
    """Schema for creating a new JIRA record."""
    jira_key: Optional[str] = Field(None, max_length=50, description="JIRA issue key (e.g., PROJ-123)")
    title: str = Field(..., min_length=1, max_length=255, description="JIRA record title")
    description: Optional[str] = Field(None, description="Detailed description")
    team_id: Optional[str] = Field(None, description="Assigned team ID")
    pi_id: Optional[str] = Field(None, description="Target PI ID")
    planned_effort: float = Field(0, ge=0, description="Planned effort in eD")
    status: str = Field("PLANNED", description="Status: PLANNED, IN_PROGRESS, COMPLETED, SPILLOVER")
    
    @validator('status')
    def validate_status(cls, v):
        allowed = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SPILLOVER']
        if v not in allowed:
            raise ValueError(f'Status must be one of: {", ".join(allowed)}')
        return v
    
    @validator('jira_key')
    def validate_jira_key(cls, v):
        if v and not v.strip():
            return None
        return v


class JiraRecordUpdate(BaseModel):
    """Schema for updating an existing JIRA record."""
    jira_key: Optional[str] = Field(None, max_length=50)
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    team_id: Optional[str] = None
    pi_id: Optional[str] = None
    planned_effort: Optional[float] = Field(None, ge=0)
    actual_effort: Optional[float] = Field(None, ge=0)
    status: Optional[str] = None
    spillover_from_pi_id: Optional[str] = None
    spillover_reason: Optional[str] = Field(None, max_length=100)
    
    @validator('status')
    def validate_status(cls, v):
        if v is not None:
            allowed = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SPILLOVER']
            if v not in allowed:
                raise ValueError(f'Status must be one of: {", ".join(allowed)}')
        return v


class JiraRecordResponse(BaseModel):
    """Schema for JIRA record response."""
    id: str
    jira_key: Optional[str]
    title: str
    description: Optional[str]
    feature_id: str
    feature_name: Optional[str] = None
    team_id: Optional[str]
    team_name: Optional[str] = None
    pi_id: Optional[str]
    pi_name: Optional[str] = None
    planned_effort: float
    actual_effort: Optional[float]
    status: str
    spillover_from_pi_id: Optional[str]
    spillover_from_pi_name: Optional[str] = None
    spillover_reason: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class JiraRecordListResponse(BaseModel):
    """Schema for paginated list of JIRA records."""
    items: List[JiraRecordResponse]
    total: int
    summary: Dict[str, float] = Field(default_factory=dict, description="Effort summaries")


class SpilloverRequest(BaseModel):
    """Schema for marking a JIRA record as spillover."""
    new_pi_id: str = Field(..., description="Target PI to move the record to")
    reason: str = Field(..., max_length=100, description="Reason for spillover")
    
    @validator('reason')
    def validate_reason(cls, v):
        allowed = ['Capacity', 'Scope Change', 'Dependencies', 'Other']
        if v not in allowed:
            raise ValueError(f'Reason must be one of: {", ".join(allowed)}')
        return v


class TeamPIAllocationResponse(BaseModel):
    """Schema for team's PI allocation summary."""
    team_id: str
    team_name: str
    pi_id: str
    pi_name: str
    total_capacity_ed: float = Field(..., description="Team's total capacity for this PI in eD")
    allocated_effort_ed: float = Field(..., description="Sum of JIRA records assigned to team in this PI")
    available_effort_ed: float = Field(..., description="Remaining capacity")
    utilization_percent: float = Field(..., description="Percentage of capacity used")
    is_over_allocated: bool = Field(..., description="True if allocated > capacity")
    jira_records: List[JiraRecordResponse] = Field(default_factory=list)


class TeamPIAllocationsResponse(BaseModel):
    """Schema for all PI allocations for a team."""
    team_id: str
    team_name: str
    allocations: List[TeamPIAllocationResponse]


class ExecutionValidationWarning(BaseModel):
    """Schema for validation warning."""
    level: str = Field(..., description="warning or error")
    message: str
    details: Optional[Dict] = None


class QuarterAllocationComparison(BaseModel):
    """Schema for comparing strategic vs execution allocation."""
    year: int
    quarter: int
    strategic_allocation_ed: float = Field(..., description="From roadmap quarterly allocation")
    execution_allocation_ed: float = Field(..., description="Sum of JIRA records for this quarter")
    difference_ed: float = Field(..., description="Strategic - Execution")
    is_matched: bool = Field(..., description="True if difference is within tolerance")


class ExecutionValidationResponse(BaseModel):
    """Schema for execution plan validation."""
    feature_id: str
    feature_name: str
    is_valid: bool
    warnings: List[ExecutionValidationWarning] = Field(default_factory=list)
    quarterly_comparisons: List[QuarterAllocationComparison] = Field(default_factory=list)
    total_strategic_ed: float
    total_execution_ed: float
    total_difference_ed: float


class PIQuarterMapping(BaseModel):
    """Schema for PI to Quarter mapping."""
    pi_id: str
    pi_name: str
    year: int
    quarter: int
    start_date: datetime
    end_date: datetime


class PIListResponse(BaseModel):
    """Schema for list of PIs."""
    items: List[PIQuarterMapping]
    total: int


class JiraRecordBulkCreateRequest(BaseModel):
    """Schema for bulk creating JIRA records."""
    records: List[JiraRecordCreate] = Field(..., min_items=1, max_items=50)


class JiraRecordBulkCreateResponse(BaseModel):
    """Schema for bulk create response."""
    created: List[JiraRecordResponse]
    failed: List[Dict[str, str]] = Field(default_factory=list)
    total_created: int
    total_failed: int


class CapacityWarning(BaseModel):
    """Schema for capacity warning."""
    team_id: str
    team_name: str
    pi_id: str
    pi_name: str
    capacity_ed: float
    current_allocation_ed: float
    new_allocation_ed: float
    total_allocation_ed: float
    over_allocation_ed: float
    message: str
