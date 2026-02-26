"""
Holiday and MemberLeave Pydantic schemas.
"""
from datetime import date as DateType, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


class HolidayBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    date: DateType
    is_half_day: bool = False
    is_recurring: bool = False
    team_id: Optional[str] = None
    country_id: Optional[str] = None
    country_code: Optional[str] = Field(None, max_length=3)


class HolidayCreate(HolidayBase):
    country_id: str  # Required for creating country-specific holidays


class HolidayUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    date: Optional[DateType] = None
    is_half_day: Optional[bool] = None
    is_recurring: Optional[bool] = None


class HolidayResponse(HolidayBase):
    id: str
    year: int
    created_at: datetime

    class Config:
        from_attributes = True


class HolidayListResponse(BaseModel):
    data: List[HolidayResponse]
    total: int


class HolidayImportRequest(BaseModel):
    year: int = Field(..., ge=2020, le=2100)
    country_code: str = Field(..., min_length=2, max_length=3)
    country_id: Optional[str] = None
    replace_existing: bool = False


class MemberLeaveBase(BaseModel):
    start_date: DateType
    end_date: DateType
    leave_type: str = "vacation"
    is_half_day: bool = False
    notes: Optional[str] = None

    @field_validator('leave_type')
    @classmethod
    def validate_leave_type(cls, v):
        if v not in ['vacation', 'sick', 'training', 'other']:
            raise ValueError('Invalid leave type')
        return v

    @field_validator('end_date')
    @classmethod
    def validate_dates(cls, v, info):
        if 'start_date' in info.data and v < info.data['start_date']:
            raise ValueError('end_date must be >= start_date')
        return v


class MemberLeaveCreate(MemberLeaveBase):
    pass


class MemberLeaveUpdate(BaseModel):
    start_date: Optional[DateType] = None
    end_date: Optional[DateType] = None
    leave_type: Optional[str] = None
    is_half_day: Optional[bool] = None
    notes: Optional[str] = None


class MemberLeaveResponse(MemberLeaveBase):
    id: str
    member_id: str
    days: int  # Calculated leave days
    created_at: datetime

    class Config:
        from_attributes = True
