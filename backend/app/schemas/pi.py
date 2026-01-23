"""
PI and Iteration Pydantic schemas.
"""
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


class IterationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    sequence: int = Field(..., ge=1, le=10)
    start_date: date
    end_date: date
    duration_weeks: int = Field(2, ge=1, le=4)
    is_ip_iteration: bool = False

    @field_validator('end_date')
    @classmethod
    def validate_dates(cls, v, info):
        if 'start_date' in info.data and v < info.data['start_date']:
            raise ValueError('end_date must be >= start_date')
        return v


class IterationCreate(IterationBase):
    pass


class IterationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    sequence: Optional[int] = Field(None, ge=1, le=10)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration_weeks: Optional[int] = Field(None, ge=1, le=4)
    is_ip_iteration: Optional[bool] = None


class PIRecalculateRequest(BaseModel):
    """Request to recalculate PI dates based on iterations."""
    adjust_pi_dates: bool = True  # Auto-adjust PI start/end to match iterations


class IterationResponse(IterationBase):
    id: str
    pi_id: str
    start_week: int
    end_week: int
    created_at: datetime

    class Config:
        from_attributes = True


class PIBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    year: int = Field(..., ge=2020, le=2100)
    sequence: int = Field(..., ge=1, le=10)
    start_date: date
    end_date: date
    status: str = "planning"

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        if v not in ['planning', 'active', 'completed']:
            raise ValueError('Invalid status')
        return v

    @field_validator('end_date')
    @classmethod
    def validate_dates(cls, v, info):
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class PICreate(PIBase):
    iterations: List[IterationCreate] = []


class PIUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        if v is not None and v not in ['planning', 'active', 'completed']:
            raise ValueError('Invalid status')
        return v


class PIResponse(PIBase):
    id: str
    start_week: int
    end_week: int
    duration_weeks: int
    iterations: List[IterationResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PIListResponse(BaseModel):
    data: List[PIResponse]
    total: int


class PIGenerateRequest(BaseModel):
    year: int = Field(..., ge=2020, le=2100)
    start_date: date
    template: str = "standard"  # standard, quarterly, custom
    iterations_per_pi: int = Field(5, ge=2, le=10)
    iteration_weeks: int = Field(2, ge=1, le=4)
    include_ip: bool = True
    pi_count: int = Field(4, ge=1, le=6)

    @field_validator('template')
    @classmethod
    def validate_template(cls, v):
        if v not in ['standard', 'quarterly', 'custom']:
            raise ValueError('Invalid template')
        return v


# Cascade Preview/Apply schemas
class IterationChangePreview(BaseModel):
    """Preview of changes to a single iteration."""
    iteration_id: str
    iteration_name: str
    old_start_date: date
    old_end_date: date
    new_start_date: date
    new_end_date: date
    shift_days: int


class PIChangePreview(BaseModel):
    """Preview of changes to a PI."""
    pi_id: str
    pi_name: str
    old_start_date: date
    old_end_date: date
    new_start_date: date
    new_end_date: date
    shift_days: int


class CascadePreviewResponse(BaseModel):
    """Response showing cascade impact preview."""
    source_iteration_id: str
    source_iteration_name: str
    old_duration_weeks: int
    new_duration_weeks: int
    shift_days: int
    affected_iterations: List[IterationChangePreview] = []
    affected_pis: List[PIChangePreview] = []
    warnings: List[str] = []


class CascadeApplyRequest(BaseModel):
    """Request to apply cascade changes."""
    iteration_id: str
    new_duration_weeks: int = Field(..., ge=1, le=4)
    cascade_to_following_iterations: bool = True
    cascade_to_following_pis: bool = False
    pi_ids_to_cascade: List[str] = []  # Specific PIs to cascade to


class IterationEditRequest(BaseModel):
    """Request to edit an iteration with cascade preview."""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    duration_weeks: Optional[int] = Field(None, ge=1, le=4)
    is_ip_iteration: Optional[bool] = None
    preview_cascade: bool = True  # If true, return preview instead of applying
