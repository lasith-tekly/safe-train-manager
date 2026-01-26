from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


# Valid roles for team members (simplified to 3 primary roles)
VALID_ROLES = ['developer', 'pd', 'qa']
VALID_LEAVE_TYPES = ['vacation', 'sick', 'training', 'other']


class MemberAvailabilityBase(BaseModel):
    year: int = Field(..., ge=2020, le=2100)
    quarter: int = Field(..., ge=1, le=4)
    working_days: int = Field(0, ge=0, le=100)
    holidays: int = Field(0, ge=0, le=50)
    leaves: int = Field(0, ge=0, le=50)
    notes: Optional[str] = None


class MemberAvailabilityCreate(MemberAvailabilityBase):
    pass


class MemberAvailabilityUpdate(BaseModel):
    working_days: Optional[int] = Field(None, ge=0, le=100)
    holidays: Optional[int] = Field(None, ge=0, le=50)
    leaves: Optional[int] = Field(None, ge=0, le=50)
    notes: Optional[str] = None


class MemberAvailabilityResponse(BaseModel):
    id: str
    member_id: str
    year: int
    quarter: int
    working_days: int
    holidays: int
    leaves: int
    available_days: int  # Calculated: working_days - holidays - leaves
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TeamMemberBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=100)
    site_id: Optional[str] = Field(None, description="Member's site (can differ from team site)")
    role: str = Field("developer")
    is_scrum_master: bool = Field(False, description="Whether this member is a Scrum Master for the team")
    is_product_owner: bool = Field(False, description="Whether this member is a Product Owner for the team")
    transversal_role: Optional[str] = Field(None, max_length=50, description="e.g., QA Manager, Dev Manager, Tech Lead")
    specialization: Optional[str] = Field(None, max_length=50, description="e.g., Android, iOS, Backend, Frontend")
    train_allocation_percent: int = Field(100, ge=0, le=100, description="Commitment to this train (for transversal roles)")
    allocation_percentage: int = Field(100, ge=0, le=100)  # Legacy field
    hours_per_day: Decimal = Field(Decimal("8.0"), ge=0, le=24)
    individual_productivity: Optional[int] = Field(None, ge=0, le=100, description="NULL = use global setting")
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in VALID_ROLES:
            raise ValueError(f'Role must be one of: {", ".join(VALID_ROLES)}')
        return v


class TeamMemberCreate(TeamMemberBase):
    pass


class TeamMemberUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=100)
    site_id: Optional[str] = None
    role: Optional[str] = None
    is_scrum_master: Optional[bool] = None
    is_product_owner: Optional[bool] = None
    transversal_role: Optional[str] = Field(None, max_length=50)
    specialization: Optional[str] = Field(None, max_length=50)
    train_allocation_percent: Optional[int] = Field(None, ge=0, le=100)
    allocation_percentage: Optional[int] = Field(None, ge=0, le=100)
    hours_per_day: Optional[Decimal] = Field(None, ge=0, le=24)
    individual_productivity: Optional[int] = Field(None, ge=0, le=100)
    end_date: Optional[date] = None
    status: Optional[str] = None
    component_hat_ids: Optional[List[str]] = Field(None, description="List of component hat IDs to assign")

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if v not in VALID_ROLES:
            raise ValueError(f'Role must be one of: {", ".join(VALID_ROLES)}')
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if v not in ['active', 'inactive']:
            raise ValueError('Status must be active or inactive')
        return v


class ComponentHatResponse(BaseModel):
    id: str
    name: str
    color: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class TeamMemberResponse(BaseModel):
    id: str
    team_id: str
    site_id: Optional[str] = None
    site_name: Optional[str] = None  # Populated from relationship
    name: str
    email: Optional[str] = None
    role: str
    is_scrum_master: bool = False
    is_product_owner: bool = False
    transversal_role: Optional[str] = None
    specialization: Optional[str] = None
    train_allocation_percent: int
    allocation_percentage: int
    hours_per_day: Decimal
    individual_productivity: Optional[int] = None
    effective_productivity: int  # Individual or global
    effective_capacity_percent: float  # train_allocation * productivity / 100
    start_date: datetime
    end_date: Optional[datetime] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    availability: List[MemberAvailabilityResponse] = []
    component_hats: List[ComponentHatResponse] = []

    class Config:
        from_attributes = True


class TeamMemberListResponse(BaseModel):
    data: List[TeamMemberResponse]
    total: int


class MemberCapacityResponse(BaseModel):
    """Calculated capacity for a member"""
    member_id: str
    member_name: str
    year: int
    quarter: int
    working_days: int
    holidays: int
    leaves: int
    available_days: int
    allocation_percentage: int
    productivity_percentage: int
    effective_days: float  # Final calculated capacity


class BulkAvailabilityUpdate(BaseModel):
    """Update availability for multiple quarters at once"""
    year: int = Field(..., ge=2020, le=2100)
    quarters: List[MemberAvailabilityCreate]


# Component Hat Schemas
class ComponentHatBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field("#1890ff", pattern=r'^#[0-9A-Fa-f]{6}$')
    description: Optional[str] = None


class ComponentHatCreate(ComponentHatBase):
    pass


class ComponentHatUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    description: Optional[str] = None


class ComponentHatListResponse(BaseModel):
    data: List[ComponentHatResponse]
    total: int


# Member Leave Schemas
class MemberLeaveBase(BaseModel):
    leave_days: Decimal = Field(..., ge=0, le=30, description="Number of leave days (supports half days, e.g., 2.5)")
    leave_type: str = Field("vacation")
    notes: Optional[str] = None

    @field_validator('leave_type')
    @classmethod
    def validate_leave_type(cls, v: str) -> str:
        if v not in VALID_LEAVE_TYPES:
            raise ValueError(f'Leave type must be one of: {", ".join(VALID_LEAVE_TYPES)}')
        return v


class MemberLeaveCreate(MemberLeaveBase):
    member_id: str
    iteration_id: str


class MemberLeaveUpdate(BaseModel):
    leave_days: Optional[Decimal] = Field(None, ge=0, le=30)
    leave_type: Optional[str] = None
    notes: Optional[str] = None

    @field_validator('leave_type')
    @classmethod
    def validate_leave_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if v not in VALID_LEAVE_TYPES:
            raise ValueError(f'Leave type must be one of: {", ".join(VALID_LEAVE_TYPES)}')
        return v


class MemberLeaveResponse(BaseModel):
    id: str
    member_id: str
    member_name: str  # Populated from relationship
    iteration_id: str
    iteration_name: str  # Populated from relationship
    leave_days: Decimal
    leave_type: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MemberLeaveListResponse(BaseModel):
    data: List[MemberLeaveResponse]
    total: int


# Site Holiday Schemas
class SiteHolidayBase(BaseModel):
    date: date
    name: str = Field(..., min_length=1, max_length=100)
    year: int = Field(..., ge=2020, le=2100)


class SiteHolidayCreate(SiteHolidayBase):
    site_id: str


class SiteHolidayUpdate(BaseModel):
    date: Optional[date] = None
    name: Optional[str] = Field(None, min_length=1, max_length=100)


class SiteHolidayResponse(BaseModel):
    id: str
    site_id: str
    site_name: str  # Populated from relationship
    date: date
    name: str
    year: int
    created_at: datetime

    class Config:
        from_attributes = True


class SiteHolidayListResponse(BaseModel):
    data: List[SiteHolidayResponse]
    total: int


# ============================================
# Member PI Allocation Schemas
# ============================================

class MemberPIAllocationBase(BaseModel):
    train_allocation_percent: int = Field(100, ge=0, le=100, description="Train allocation for this PI")
    productivity_percent: Optional[int] = Field(None, ge=0, le=100, description="Productivity override for this PI")
    is_scrum_master: bool = Field(False, description="Whether member is SM for this PI")
    is_product_owner: bool = Field(False, description="Whether member is PO for this PI")
    transversal_role: Optional[str] = Field(None, max_length=50, description="Transversal role for this PI")
    specializations: Optional[List[str]] = Field(None, description="Specialization tags for this PI")
    ip_week_deduction: float = Field(0, ge=0, le=10, description="Additional IP week deduction days (e.g., for PO/SM)")
    notes: Optional[str] = None


class MemberPIAllocationCreate(MemberPIAllocationBase):
    member_id: str
    pi_id: str
    component_hat_ids: Optional[List[str]] = Field(None, description="Component hat IDs to assign to member")


class MemberPIAllocationUpdate(BaseModel):
    train_allocation_percent: Optional[int] = Field(None, ge=0, le=100)
    productivity_percent: Optional[int] = Field(None, ge=0, le=100)
    is_scrum_master: Optional[bool] = None
    is_product_owner: Optional[bool] = None
    transversal_role: Optional[str] = Field(None, max_length=50)
    specializations: Optional[List[str]] = None
    ip_week_deduction: Optional[float] = Field(None, ge=0, le=10)
    notes: Optional[str] = None


class MemberPIAllocationResponse(BaseModel):
    id: str
    member_id: str
    member_name: str  # Populated from relationship
    member_role: str  # Primary role from TeamMember
    pi_id: str
    pi_name: str  # Populated from relationship
    train_allocation_percent: int
    productivity_percent: Optional[int] = None
    effective_productivity: int  # Calculated: PI override or member default or global
    is_scrum_master: bool = False
    is_product_owner: bool = False
    transversal_role: Optional[str] = None
    specializations: Optional[List[str]] = None
    ip_week_deduction: float = 0  # Additional IP week deduction days
    component_hats: Optional[List[str]] = None  # From TeamMember relationship
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PIIterationSummary(BaseModel):
    """Summary of iteration working days"""
    iteration_name: str
    working_days: int

class MemberPIAllocationListResponse(BaseModel):
    data: List[MemberPIAllocationResponse]
    total: int
    site_holidays_count: Optional[int] = None
    iteration_working_days: Optional[List[PIIterationSummary]] = None


class BulkPIAllocationCreate(BaseModel):
    """Bulk create/update PI allocations for a team"""
    allocations: List[MemberPIAllocationCreate]


# ============================================
# Member Iteration Productivity Schemas
# ============================================

class MemberIterationProductivityBase(BaseModel):
    productivity_percent: Optional[int] = Field(None, ge=0, le=100, description="Productivity percentage for this iteration (null = delete override)")


class MemberIterationProductivityCreate(MemberIterationProductivityBase):
    member_id: str
    iteration_id: str


class MemberIterationProductivityUpdate(BaseModel):
    productivity_percent: Optional[int] = Field(None, ge=0, le=100)


class MemberIterationProductivityResponse(BaseModel):
    id: str
    member_id: str
    iteration_id: str
    productivity_percent: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BulkIterationProductivityCreate(BaseModel):
    """Bulk create/update iteration productivity for a team"""
    items: List[MemberIterationProductivityCreate]


# ============================================
# Team Capacity Summary Schemas (with role breakdown)
# ============================================

class RoleCapacity(BaseModel):
    role: str
    member_count: int
    total_days: float
    effective_days: float


class AllocationBreakdown(BaseModel):
    category: str
    percentage: float
    days: float
    color: str


class TeamCapacitySummary(BaseModel):
    team_id: str
    team_name: str
    pi_id: Optional[str] = None
    pi_name: Optional[str] = None
    total_members: int
    active_members: int
    total_capacity_days: float
    role_breakdown: List[RoleCapacity]
    allocation_breakdown: List[AllocationBreakdown]
