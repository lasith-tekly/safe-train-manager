"""
Schemas for Team PI Capacity Detail View.
"""
from typing import List, Optional
from datetime import date
from pydantic import BaseModel


class CapacitySummary(BaseModel):
    """Summary statistics for team capacity in a PI."""
    # Team Total (including IP week)
    total_effort_days: float
    total_dev_days: float
    total_pd_days: float
    total_qa_days: float
    
    # IP Week capacity
    ip_capacity: float
    ip_dev_days: float
    ip_pd_days: float
    ip_qa_days: float
    ip_available: float  # IP capacity after PI planning days deducted
    pi_planning_days: int  # Days reserved for PI planning
    
    # PI capacity (iterations only, excludes IP week)
    pi_capacity: float
    pi_dev_days: float
    pi_pd_days: float
    pi_qa_days: float
    
    total_members: int
    dev_count: int
    pd_count: int
    qa_count: int


class RoleCapacityDetail(BaseModel):
    """Capacity breakdown by role."""
    role: str
    headcount: int
    effort_days: float


class AllocationSummary(BaseModel):
    """Allocation category summary."""
    category: str
    code: str
    percentage: float
    total_days: float
    color: Optional[str] = None


class AllocationByRole(BaseModel):
    """Allocation breakdown by role for each category."""
    category: str
    code: str
    dev_days: float
    pd_days: float
    qa_days: float
    total_days: float


class IterationAllocationDetail(BaseModel):
    """Allocation breakdown for a single iteration."""
    category: str
    code: str
    percentage: float
    total_days: float
    color: Optional[str] = None


class IterationCapacityDetail(BaseModel):
    """Capacity details for a single iteration."""
    iteration_id: str
    iteration_name: str
    iteration_number: int
    start_date: date
    end_date: date
    working_days: int
    total_capacity: float
    dev_capacity: float
    pd_capacity: float
    qa_capacity: float
    allocations: List[IterationAllocationDetail] = []


class MemberIterationCapacity(BaseModel):
    """Member capacity for a single iteration."""
    iteration_id: str
    iteration_name: str
    capacity_days: float


class MemberCapacityDetail(BaseModel):
    """Capacity details for a single team member."""
    member_id: str
    member_name: str
    role: str
    is_scrum_master: bool = False
    is_product_owner: bool = False
    transversal_role: Optional[str] = None
    availability_pct: float
    total_days: float
    leave_days: float
    iteration_capacities: List[MemberIterationCapacity] = []


class TeamPICapacityDetail(BaseModel):
    """Complete team capacity detail for a PI."""
    team_id: str
    team_name: str
    team_code: str
    pi_id: str
    pi_name: str
    summary: CapacitySummary
    capacity_by_role: List[RoleCapacityDetail]
    allocation_summary: List[AllocationSummary]
    allocation_by_role: List[AllocationByRole]
    iterations: List[IterationCapacityDetail]
    members: List[MemberCapacityDetail]

    class Config:
        from_attributes = True
