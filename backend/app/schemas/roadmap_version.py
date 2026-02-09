"""
Roadmap Version Schemas

Pydantic schemas for roadmap version management API.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class VersionStatus(str, Enum):
    """Version status enum"""
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"


class RoadmapVersionBase(BaseModel):
    """Base schema for roadmap version"""
    version_name: str = Field(..., min_length=1, max_length=50, description="Version name, typically date-based (e.g., '2026-02-05')")
    description: Optional[str] = Field(None, description="Optional description of this version")


class RoadmapVersionCreate(RoadmapVersionBase):
    """Schema for creating a new roadmap version"""
    copy_from_version_id: Optional[str] = Field(None, description="If provided, copies all features from this version")


class RoadmapVersionUpdate(BaseModel):
    """Schema for updating a roadmap version (only description can be updated)"""
    description: Optional[str] = Field(None, description="Updated description")


class RoadmapVersionResponse(RoadmapVersionBase):
    """Schema for roadmap version response"""
    id: str
    product_id: str
    status: VersionStatus
    created_at: datetime
    published_at: Optional[datetime] = None
    created_by: Optional[str] = None
    updated_at: Optional[datetime] = None
    feature_count: int = Field(default=0, description="Number of features in this version")
    
    class Config:
        from_attributes = True


class RoadmapVersionListResponse(BaseModel):
    """Schema for list of roadmap versions"""
    items: List[RoadmapVersionResponse]
    total: int


class PublishVersionRequest(BaseModel):
    """Schema for publishing a version"""
    published_by: Optional[str] = Field(None, description="User who is publishing the version")
