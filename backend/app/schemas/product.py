import re
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class ProductBase(BaseModel):
    """Base schema with shared fields."""
    name: str = Field(..., min_length=1, max_length=100, description="Product name")
    short_code: str = Field(..., min_length=2, max_length=6, description="Short code (2-6 chars)")
    description: Optional[str] = Field(None, max_length=500, description="Product description")
    status: str = Field(default="active", description="Product status")

    @field_validator('short_code')
    @classmethod
    def validate_short_code(cls, v: str) -> str:
        v = v.upper().strip()
        if not re.match(r'^[A-Z0-9]{2,6}$', v):
            raise ValueError('Short code must be 2-6 alphanumeric characters')
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


class ProductCreate(ProductBase):
    """Schema for creating a product."""
    train_id: Optional[str] = None


class ProductUpdate(BaseModel):
    """Schema for updating a product (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    short_code: Optional[str] = Field(None, min_length=2, max_length=6)
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = None

    @field_validator('short_code')
    @classmethod
    def validate_short_code(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.upper().strip()
        if not re.match(r'^[A-Z0-9]{2,6}$', v):
            raise ValueError('Short code must be 2-6 alphanumeric characters')
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


class ProductResponse(BaseModel):
    """Schema for product response."""
    id: UUID
    name: str
    short_code: str
    description: Optional[str] = None
    status: str
    train_id: Optional[str] = None
    team_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    """Schema for list response."""
    data: List[ProductResponse]
    total: int
