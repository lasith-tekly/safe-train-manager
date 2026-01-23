from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


# Valid working day codes
VALID_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


class GlobalSettingsBase(BaseModel):
    year: int = Field(..., ge=2020, le=2100)
    
    # Work Schedule
    working_days: str = Field(
        "mon,tue,wed,thu,fri",
        description="Comma-separated list of working days (mon,tue,wed,thu,fri,sat,sun)"
    )
    week_start_day: int = Field(
        1, ge=0, le=1,
        description="0=Sunday, 1=Monday"
    )
    default_hours_per_day: Decimal = Field(Decimal("8.0"), ge=0, le=24)
    
    # Capacity Settings
    global_productivity_percentage: int = Field(70, ge=0, le=100)
    
    # Capacity Allocation
    feature_capacity_percentage: int = Field(20, ge=0, le=100, description="Percentage for feature work")
    it_excellence_percentage: int = Field(12, ge=0, le=100, description="Percentage for IT excellence/tech debt")
    component_work_percentage: int = Field(8, ge=0, le=100, description="Percentage for component/shared work")
    
    # PI Defaults
    default_sprint_duration_weeks: int = Field(2, ge=1, le=6)
    default_ip_duration_weeks: int = Field(2, ge=1, le=4)
    default_sprints_per_pi: int = Field(5, ge=1, le=10)
    pi_planning_days: int = Field(3, ge=0, le=10, description="Days reserved for PI Planning event")
    apply_productivity_to_ip: bool = Field(False, description="Whether to apply productivity % to IP capacity")
    
    # Budget & Cost Configuration
    train_structural_cost_ratio: float = Field(2.8, ge=1.0, le=5.0, description="Overhead multiplier for budget calculations")
    effort_days_per_year: int = Field(220, ge=100, le=365, description="Annual working days for effort calculation")
    train_unit_cost_keur: float = Field(85.0, ge=0, le=500, description="Average cost per FTE in KEUR/year")
    
    # Calendar Lock
    pi_calendar_locked: bool = Field(False, description="Whether the PI calendar is locked for this year")

    @field_validator('working_days')
    @classmethod
    def validate_working_days(cls, v: str) -> str:
        if not v:
            raise ValueError("At least one working day must be specified")
        days = [d.strip().lower() for d in v.split(",") if d.strip()]
        if not days:
            raise ValueError("At least one working day must be specified")
        for day in days:
            if day not in VALID_DAYS:
                raise ValueError(f"Invalid day: {day}. Must be one of: {', '.join(VALID_DAYS)}")
        return ",".join(days)


class GlobalSettingsCreate(GlobalSettingsBase):
    pass


class GlobalSettingsUpdate(BaseModel):
    # Work Schedule
    working_days: Optional[str] = Field(None, description="Comma-separated list of working days")
    week_start_day: Optional[int] = Field(None, ge=0, le=1)
    default_hours_per_day: Optional[Decimal] = Field(None, ge=0, le=24)
    
    # Capacity Settings
    global_productivity_percentage: Optional[int] = Field(None, ge=0, le=100)
    
    # Capacity Allocation
    feature_capacity_percentage: Optional[int] = Field(None, ge=0, le=100)
    it_excellence_percentage: Optional[int] = Field(None, ge=0, le=100)
    component_work_percentage: Optional[int] = Field(None, ge=0, le=100)
    
    # PI Defaults
    default_sprint_duration_weeks: Optional[int] = Field(None, ge=1, le=6)
    default_ip_duration_weeks: Optional[int] = Field(None, ge=1, le=4)
    default_sprints_per_pi: Optional[int] = Field(None, ge=1, le=10)
    pi_planning_days: Optional[int] = Field(None, ge=0, le=10)
    apply_productivity_to_ip: Optional[bool] = Field(None)
    
    # Budget & Cost Configuration
    train_structural_cost_ratio: Optional[float] = Field(None, ge=1.0, le=5.0)
    effort_days_per_year: Optional[int] = Field(None, ge=100, le=365)
    train_unit_cost_keur: Optional[float] = Field(None, ge=0, le=500)
    
    # Calendar Lock
    pi_calendar_locked: Optional[bool] = Field(None, description="Whether the PI calendar is locked for this year")

    @field_validator('working_days')
    @classmethod
    def validate_working_days(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        days = [d.strip().lower() for d in v.split(",") if d.strip()]
        if not days:
            raise ValueError("At least one working day must be specified")
        for day in days:
            if day not in VALID_DAYS:
                raise ValueError(f"Invalid day: {day}. Must be one of: {', '.join(VALID_DAYS)}")
        return ",".join(days)


class GlobalSettingsResponse(GlobalSettingsBase):
    id: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
