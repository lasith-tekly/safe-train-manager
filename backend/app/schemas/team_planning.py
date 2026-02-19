"""
Team Planning Schemas - Phase 5A

CRITICAL BUSINESS RULES:
1. Status is auto-calculated, never manually set
2. Capacity thresholds: <95% green, 95-100% amber, >100% red
3. No locked fields
4. No expires_at in notifications
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class RoleBreakdown(BaseModel):
    """Role breakdown for Dev/PD/QA effort."""
    dev_effort: Decimal = Field(default=0, ge=0, description="Developer effort in eD")
    pd_effort: Decimal = Field(default=0, ge=0, description="Product Designer effort in eD")
    qa_effort: Decimal = Field(default=0, ge=0, description="QA effort in eD")
    
    @validator('dev_effort', 'pd_effort', 'qa_effort')
    def validate_non_negative(cls, v):
        if v < 0:
            raise ValueError('Effort cannot be negative')
        return v


class TeamPlanningBase(BaseModel):
    """Base schema for team planning."""
    jira_record_id: str
    team_id: str
    pi_id: str
    version_id: Optional[str] = None  # Optional - backend gets from JIRA record
    po_plan_version_id: Optional[str] = None  # Which PO draft this belongs to
    planned_effort: Optional[Decimal] = None
    dev_effort: Decimal = Field(default=0, ge=0)
    pd_effort: Decimal = Field(default=0, ge=0)
    qa_effort: Decimal = Field(default=0, ge=0)


class TeamPlanningCreate(TeamPlanningBase):
    """Create team planning record (auto-save)."""
    
    @validator('dev_effort', 'pd_effort', 'qa_effort')
    def validate_non_negative(cls, v):
        if v < 0:
            raise ValueError('Effort cannot be negative')
        return v
    
    @validator('planned_effort', always=True)
    def calculate_planned_effort(cls, v, values):
        """Auto-calculate planned_effort from role breakdown."""
        if 'dev_effort' in values and 'pd_effort' in values and 'qa_effort' in values:
            return values['dev_effort'] + values['pd_effort'] + values['qa_effort']
        return v


class TeamPlanningUpdate(BaseModel):
    """Update team planning record."""
    planned_effort: Optional[Decimal] = None
    dev_effort: Optional[Decimal] = Field(None, ge=0)
    pd_effort: Optional[Decimal] = Field(None, ge=0)
    qa_effort: Optional[Decimal] = Field(None, ge=0)


class TeamPlanningResponse(BaseModel):
    """Team planning response with auto-calculated status."""
    id: str
    jira_record_id: Optional[str]
    team_id: str
    pi_id: str
    version_id: str
    
    # Planning data
    planned_effort: Optional[Decimal]
    dev_effort: Decimal
    pd_effort: Decimal
    qa_effort: Decimal
    
    # Status (auto-calculated)
    status: str  # not_planned, accepted, modified, descope_proposed, orphaned
    original_pm_effort: Optional[Decimal]
    delta: Optional[Decimal] = None
    
    # Descope
    is_descoped: bool
    descope_reason: Optional[str]
    descoped_at: Optional[datetime]
    
    # Orphan
    is_orphaned: bool
    orphaned_jira_key: Optional[str]
    orphaned_jira_title: Optional[str]
    orphaned_at: Optional[datetime]
    
    # Review
    review_status: Optional[str]
    rejection_reason: Optional[str]
    reviewed_at: Optional[datetime]
    
    # Commit
    committed_at: Optional[datetime]
    
    # Joined data (for non-orphaned)
    jira_key: Optional[str] = None
    jira_title: Optional[str] = None
    feature_name: Optional[str] = None
    is_spillover: bool = False
    
    # Audit
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class RoleCapacity(BaseModel):
    """Capacity breakdown by role."""
    available: float
    used: float
    remaining: float


class CapacityResponse(BaseModel):
    """
    Capacity response with EXACT thresholds:
    - < 95% = green
    - 95-100% = amber
    - > 100% = red
    """
    available_ed: float
    used_ed: float
    remaining_ed: float
    utilization_percent: float
    status: str  # green, amber, red, warning
    warning: Optional[str] = None
    roles: Optional[dict] = None  # {"dev": RoleCapacity, "pd": RoleCapacity, "qa": RoleCapacity}


class PlanningSummary(BaseModel):
    """Summary of planning items by status."""
    total: int
    accepted: int
    modified: int
    descoped: int
    not_planned: int
    orphaned: int


class TeamInfo(BaseModel):
    """Team information."""
    id: str
    name: str


class PIInfo(BaseModel):
    """PI information."""
    id: str
    name: str
    year: int
    sequence: int


class VersionInfo(BaseModel):
    """Version information."""
    id: str
    version_name: str
    status: str


class TeamPlanningListResponse(BaseModel):
    """Response for team planning list."""
    team: TeamInfo
    pi: PIInfo
    version: Optional[VersionInfo]
    capacity: CapacityResponse
    items: List[TeamPlanningResponse]
    summary: PlanningSummary
    is_outdated: bool = False
    outdated_reason: Optional[str] = None
    outdated_at: Optional[str] = None


class DescopeRequest(BaseModel):
    """Request to descope an item."""
    reason: str = Field(..., min_length=10, max_length=500, description="Reason for descoping (10-500 chars)")


class RestoreRequest(BaseModel):
    """Request to restore a descoped item."""
    pass


class CommitPlanRequest(BaseModel):
    """Request to commit plan for PM review."""
    pi_id: str
    version_id: Optional[str] = None  # Optional - backend will use single draft


class CommitPlanResponse(BaseModel):
    """Response after committing plan."""
    plan_version_id: str
    committed_at: datetime
    items_count: int
    notification_sent: bool
    summary: PlanningSummary


class AcknowledgeOrphanRequest(BaseModel):
    """Request to acknowledge and remove orphaned item."""
    pass
