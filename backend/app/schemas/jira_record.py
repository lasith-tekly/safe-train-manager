"""
Pydantic schemas for JIRA Records API

Handles request/response validation for execution planning endpoints.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from enum import Enum


class WorkflowStatus(str, Enum):
    """Workflow status enum for JIRA records (Phase 3.2)"""
    PLANNED = "PLANNED"
    IMPLEMENTING = "IMPLEMENTING"
    INTERNAL_TESTING = "INTERNAL_TESTING"
    LOAD_TO_UAT = "LOAD_TO_UAT"
    CUSTOMER_TESTING = "CUSTOMER_TESTING"
    LOAD_TO_PRD = "LOAD_TO_PRD"
    COMPLETED = "COMPLETED"


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
    workflow_status: Optional[str] = None  # Phase 3.2: New workflow status field
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
    status: str  # Legacy field
    workflow_status: Optional[str] = "PLANNED"  # Phase 3.2: New workflow status
    is_spillover: bool = False  # Phase 3.2: Spillover flag
    spillover_from_pi_id: Optional[str]
    spillover_from_pi_name: Optional[str] = None
    spillover_reason: Optional[str]
    spillover_category: Optional[str] = None
    spillover_effort: Optional[float] = None
    completed_effort: float = 0
    spillover_count: int = 0
    original_pi_id: Optional[str] = None
    original_pi_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class SpilloverSummary(BaseModel):
    """Schema for spillover summary statistics."""
    count: int = Field(..., description="Number of spillover records")
    total_effort: float = Field(..., description="Total planned effort of spillover records")
    by_source_pi: List[Dict[str, Any]] = Field(default_factory=list, description="Breakdown by source PI")


class UpdateSpilloverRequest(BaseModel):
    """Schema for updating spillover details (Phase 3.2)"""
    spillover_reason: str = Field(..., min_length=10, max_length=500, description="Reason for spillover")
    spillover_category: str = Field(..., description="Category: technical_debt, dependencies, scope_creep, etc.")
    spillover_effort: float = Field(..., ge=0.5, description="Effort spilling over (eD)")
    completed_effort: float = Field(..., ge=0, description="Effort completed before spillover (eD)")
    edit_reason: Optional[str] = Field(None, max_length=500, description="Reason for editing spillover details")


class RecordHistoryResponse(BaseModel):
    """Schema for record history entry (Phase 3.2)"""
    id: str
    jira_record_id: str
    event_type: str
    from_value: Optional[str]
    to_value: Optional[str]
    field_name: Optional[str]
    from_pi_id: Optional[str]
    to_pi_id: Optional[str]
    from_pi_name: Optional[str] = None
    to_pi_name: Optional[str] = None
    spillover_effort: Optional[float]
    completed_effort: Optional[float]
    spillover_reason: Optional[str]
    spillover_category: Optional[str]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True


class RecordHistoryListResponse(BaseModel):
    """Schema for paginated list of record history."""
    data: List[RecordHistoryResponse]
    total: int


class JiraRecordListResponse(BaseModel):
    """Schema for paginated list of JIRA records."""
    data: List[JiraRecordResponse]
    total: int
    summary: Optional[Dict] = Field(default=None, description="Effort summaries")
    spillover_summary: Optional[SpilloverSummary] = Field(default=None, description="Spillover statistics")


class MarkSpilloverRequest(BaseModel):
    """Schema for marking a JIRA record as spillover."""
    new_pi_id: str = Field(..., description="Target PI ID where work will be completed")
    spillover_from_pi_id: str = Field(..., description="Original PI ID where work was planned")
    spillover_reason: str = Field(..., min_length=10, max_length=500, description="Reason for spillover (10-500 characters)")
    spillover_category: str = Field(..., description="Category: technical_debt, dependencies, scope_creep, resource_constraints, external_factors, other")
    spillover_category_other: Optional[str] = Field(None, max_length=500, description="Custom reason when category is 'other'")
    spillover_effort: Optional[float] = Field(None, gt=0, description="Effort amount spilling over (defaults to planned_effort)")
    completed_effort: Optional[float] = Field(0, ge=0, description="Effort completed in original PI (defaults to 0)")
    
    @validator('spillover_category')
    def validate_category(cls, v):
        allowed = ['technical_debt', 'dependencies', 'scope_creep', 'resource_constraints', 'external_factors', 'other']
        if v not in allowed:
            raise ValueError(f'Category must be one of: {", ".join(allowed)}')
        return v
    
    @validator('spillover_reason')
    def validate_reason_content(cls, v):
        # Reject meaningless reasons
        if v.strip().lower() in ['n/a', 'tbd', 'delayed', 'late', 'na']:
            raise ValueError('Please provide a meaningful spillover reason')
        return v.strip()


# Alias for backward compatibility
SpilloverRequest = MarkSpilloverRequest


class SpilloverHistoryResponse(BaseModel):
    """Schema for spillover history entry."""
    id: str
    sequence: int
    from_pi_id: Optional[str]
    from_pi_name: Optional[str]
    to_pi_id: Optional[str]
    to_pi_name: Optional[str]
    spillover_effort: float
    completed_effort: float
    reason: str
    category: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


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
