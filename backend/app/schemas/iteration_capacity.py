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


class TeamIterationCapacityResponse(BaseModel):
    team_id: str
    team_name: str
    team_code: str
    member_count: int
    iterations: List[IterationCapacityResponse]
    pi_total_capacity: float
    pi_total_allocated: float
    pi_utilization: float


class CapacityOverrideRequest(BaseModel):
    manual_override: float = Field(..., ge=0)
    override_reason: str = Field(..., min_length=1, max_length=500)


class CapacitySummaryResponse(BaseModel):
    pi_id: str
    pi_name: str
    teams: List[TeamIterationCapacityResponse]
    total_capacity: float
    total_allocated: float
    overall_utilization: float
