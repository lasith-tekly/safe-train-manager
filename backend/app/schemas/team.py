import re
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class QuarterCapacity(BaseModel):
    total: int = 0
    allocated: int = 0
    available: int = 0
    utilization: float = 0.0


class TeamCapacityBase(BaseModel):
    year: int = Field(..., ge=2020, le=2100)
    q1_capacity: int = Field(default=0, ge=0, le=9999)
    q2_capacity: int = Field(default=0, ge=0, le=9999)
    q3_capacity: int = Field(default=0, ge=0, le=9999)
    q4_capacity: int = Field(default=0, ge=0, le=9999)


class TeamCapacityCreate(TeamCapacityBase):
    pass


class TeamCapacityUpdate(BaseModel):
    q1_capacity: Optional[int] = Field(None, ge=0, le=9999)
    q2_capacity: Optional[int] = Field(None, ge=0, le=9999)
    q3_capacity: Optional[int] = Field(None, ge=0, le=9999)
    q4_capacity: Optional[int] = Field(None, ge=0, le=9999)


class TeamCapacityResponse(BaseModel):
    year: int
    q1: QuarterCapacity
    q2: QuarterCapacity
    q3: QuarterCapacity
    q4: QuarterCapacity

    class Config:
        from_attributes = True


class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    short_code: str = Field(..., min_length=2, max_length=10)
    description: Optional[str] = Field(None, max_length=500)
    status: str = Field(default="active")

    @field_validator('short_code')
    @classmethod
    def validate_short_code(cls, v: str) -> str:
        v = v.upper().strip()
        if not re.match(r'^[A-Z0-9]{2,10}$', v):
            raise ValueError('Short code must be 2-10 uppercase alphanumeric characters')
        return v

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r'^[a-zA-Z0-9\s\-]+$', v):
            raise ValueError('Name can only contain letters, numbers, spaces, and hyphens')
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ['active', 'inactive']:
            raise ValueError('Status must be active or inactive')
        return v


class TeamCreate(TeamBase):
    site_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    capacity: Optional[TeamCapacityCreate] = None


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    short_code: Optional[str] = Field(None, min_length=2, max_length=10)
    description: Optional[str] = Field(None, max_length=500)
    site_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    status: Optional[str] = None

    @field_validator('short_code')
    @classmethod
    def validate_short_code(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.upper().strip()
        if not re.match(r'^[A-Z0-9]{2,10}$', v):
            raise ValueError('Short code must be 2-10 uppercase alphanumeric characters')
        return v

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not re.match(r'^[a-zA-Z0-9\s\-]+$', v):
            raise ValueError('Name can only contain letters, numbers, spaces, and hyphens')
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if v not in ['active', 'inactive']:
            raise ValueError('Status must be active or inactive')
        return v


class ProductSummary(BaseModel):
    id: UUID
    name: str
    short_code: str

    class Config:
        from_attributes = True


class TeamResponse(BaseModel):
    id: UUID
    name: str
    short_code: str
    description: Optional[str] = None
    site_id: Optional[UUID] = None
    status: str
    member_count: int = 0
    scrum_master_name: Optional[str] = None
    product_owner_name: Optional[str] = None
    products: List[ProductSummary] = []
    capacity: Optional[TeamCapacityResponse] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TeamListResponse(BaseModel):
    data: List[TeamResponse]
    total: int
