"""
Iteration Capacity Pydantic schemas.
"""
from typing import Optional, List
from pydantic import BaseModel, Field


class IterationCapacityResponse(BaseModel):
    iteration_id: str
    iteration_name: str
    iteration_sequence: int
    start_week: int
    end_week: int
    is_ip: bool
    calculated_capacity: float
    manual_override: Optional[float] = None
    override_reason: Optional[str] = None
    final_capacity: float
    allocated: float
    available: float
    utilization: float
    dev_capacity: float = 0.0
    pd_capacity: float = 0.0
    qa_capacity: float = 0.0


class TeamIterationCapacityResponse(BaseModel):
    team_id: str
    team_name: str
    team_code: str
    member_count: int
    fte: float = 0.0
    iterations: List[IterationCapacityResponse]
    pi_total_capacity: float
    pi_feature_capacity: float = 0.0
    pi_planned_effort: float = 0.0
    pi_total_allocated: float
    pi_utilization: float
    dev_capacity: float = 0.0
    pd_capacity: float = 0.0
    qa_capacity: float = 0.0


class CapacityOverrideRequest(BaseModel):
    manual_override: float = Field(..., ge=0)
    override_reason: str = Field(..., min_length=1, max_length=500)


class CapacitySummaryResponse(BaseModel):
    pi_id: str
    pi_name: str
    teams: List[TeamIterationCapacityResponse]
    total_capacity: float
    total_feature_capacity: float = 0.0
    total_planned_effort: float = 0.0
    total_allocated: float
    overall_utilization: float


class AnnualTeamSummary(BaseModel):
    team_id: str
    team_name: str
    team_code: str
    fte: float
    member_count: int
    total_capacity: float
    feature_capacity: float
    planned_effort: float
    utilisation_pct: float
    dev_capacity: float = 0.0
    pd_capacity: float = 0.0
    qa_capacity: float = 0.0


class AnnualPISummary(BaseModel):
    pi_id: str
    pi_name: str
    start_date: str
    end_date: str
    teams: List[AnnualTeamSummary]
    totals: dict


class AnnualCapacitySummaryResponse(BaseModel):
    year: int
    pis: List[AnnualPISummary]
