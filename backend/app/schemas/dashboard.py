from typing import List, Dict, Optional
from uuid import UUID
from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    total_budget: float
    budget_consumed: float
    total_features: int
    active_teams: int


class BudgetHealthItem(BaseModel):
    product_id: UUID
    product_name: str
    product_code: str
    total_budget: float
    consumed_budget: float
    utilization: float
    status: str


class QuarterCapacity(BaseModel):
    total: int
    allocated: int
    utilization: float
    status: str


class CapacityHeatmapItem(BaseModel):
    team_id: UUID
    team_name: str
    team_code: str
    quarters: Dict[str, QuarterCapacity]


class FeatureStats(BaseModel):
    not_started: int
    in_progress: int
    completed: int
    total: int


class DashboardSummary(BaseModel):
    metrics: DashboardMetrics
    budget_health: List[BudgetHealthItem]
    capacity_heatmap: List[CapacityHeatmapItem]
    feature_stats: FeatureStats


# ============================================
# Train Capacity Dashboard Schemas
# ============================================

class PIInfo(BaseModel):
    id: str
    name: str
    start_date: str
    end_date: str
    status: str
    iteration_count: int


class CapacitySummary(BaseModel):
    total_capacity: float
    allocated: float
    available: float
    utilization_percent: float
    team_count: int
    member_count: int


class CapacitySummaryResponse(BaseModel):
    pi: PIInfo
    summary: CapacitySummary


class ProductCapacity(BaseModel):
    id: str
    name: str
    short_code: str
    team_count: int
    total_capacity: float
    allocated: float
    available: float
    utilization_percent: float


class ProductCapacityResponse(BaseModel):
    products: List[ProductCapacity]


class SiteCapacity(BaseModel):
    id: str
    code: str
    name: str
    team_count: int
    member_count: int
    total_capacity: float
    allocated: float
    available: float
    utilization_percent: float


class CountryCapacity(BaseModel):
    id: str
    code: str
    name: str
    sites: List[SiteCapacity]
    totals: CapacitySummary


class SiteCapacityResponse(BaseModel):
    countries: List[CountryCapacity]


class IterationCapacity(BaseModel):
    id: str
    name: str
    sequence: int
    is_ip_iteration: bool
    capacity: float
    allocated: float
    available: float
    utilization_percent: float


class ProductSummaryRef(BaseModel):
    id: str
    name: str


class SiteSummaryRef(BaseModel):
    id: str
    name: str
    country_code: str


class TeamCapacityDetail(BaseModel):
    id: str
    name: str
    short_code: str
    product: Optional[ProductSummaryRef] = None
    site: Optional[SiteSummaryRef] = None
    member_count: int
    total_capacity: float
    allocated: float
    available: float
    utilization_percent: float
    iterations: List[IterationCapacity]


class TeamCapacityResponse(BaseModel):
    teams: List[TeamCapacityDetail]


class AllocationCategory(BaseModel):
    id: str
    name: str
    code: str
    color: str
    percentage: int
    capacity: float


class AllocationCapacityResponse(BaseModel):
    categories: List[AllocationCategory]
    total_capacity: float


# ============================================
# Train Dashboard Schemas
# ============================================

class IterationCapacityValue(BaseModel):
    """Capacity value for a single iteration."""
    iteration_id: str
    iteration_name: str
    sequence: int
    is_ip: bool
    capacity: float


class TeamCapacityRow(BaseModel):
    """Row data for team capacity table."""
    team_id: str
    team_name: str
    short_code: str
    member_count: int
    fte: float  # Full-time equivalent
    iterations: List[IterationCapacityValue]
    productive_capacity: float
    allocations: Dict[str, float]  # {features: 159, it_excellence: 13, ...}


class TrainSummary(BaseModel):
    """Summary statistics for train dashboard."""
    active_teams: int
    total_members: int
    total_fte: float
    total_capacity: float  # Productive capacity in effort days
    overall_utilization: float  # Percentage


class TrainDashboardOverview(BaseModel):
    """Complete train dashboard overview response."""
    pi: PIInfo
    summary: TrainSummary
    teams: List[TeamCapacityRow]
    totals: TeamCapacityRow


# ============================================
# Team Detail Expanded View Schemas
# ============================================

class RoleBreakdown(BaseModel):
    """Breakdown by role (DEV, PD, QA, SRE)."""
    dev: float = 0.0
    pd: float = 0.0
    qa: float = 0.0
    sre: float = 0.0
    total: float = 0.0


class IterationRoleBreakdown(BaseModel):
    """Role breakdown for a single iteration."""
    iteration_id: str
    iteration_name: str
    sequence: int
    is_ip: bool
    breakdown: RoleBreakdown


class CategoryRow(BaseModel):
    """A row in a section (e.g., Days off, Training)."""
    item: str
    unit: str
    iterations: List[IterationRoleBreakdown]
    sum_value: RoleBreakdown
    ip_value: Optional[RoleBreakdown] = None


class SectionData(BaseModel):
    """Data for a section (People, Unavailable, etc.)."""
    rows: List[CategoryRow]
    total: Optional[CategoryRow] = None


class AllocationCategoryRow(BaseModel):
    """Allocation category with percentage and values."""
    name: str
    percentage: float
    iterations: List[IterationRoleBreakdown]
    sum_value: RoleBreakdown
    ip_value: Optional[RoleBreakdown] = None


class TeamDetailExpanded(BaseModel):
    """Complete team detail expanded view response."""
    team_id: str
    team_name: str
    short_code: str
    pi_id: str
    pi_name: str
    productive_ratio: float  # Productivity percentage (e.g., 57%)
    
    # Sections
    people: SectionData
    unavailable: SectionData
    theoretical_capacity: CategoryRow
    team_life: SectionData
    net_capacity: CategoryRow
    productive_capacity: CategoryRow
    capacity_allocation: List[AllocationCategoryRow]
