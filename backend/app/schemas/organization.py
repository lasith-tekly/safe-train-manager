"""Organization schemas - Country and Site."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ============================================
# Country Schemas
# ============================================

class CountryBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=3, description="ISO 3166-1 alpha-3 code")
    name: str = Field(..., min_length=1, max_length=100)
    timezone: str = Field("UTC", max_length=50)
    is_active: bool = True


class CountryCreate(CountryBase):
    pass


class CountryUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=2, max_length=3)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    timezone: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class CountryResponse(CountryBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    site_count: int = 0
    team_count: int = 0

    class Config:
        from_attributes = True


class CountryWithSites(CountryResponse):
    sites: List["SiteResponse"] = []


# ============================================
# Site Schemas
# ============================================

class SiteBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=10)
    name: str = Field(..., min_length=1, max_length=100)
    country_id: str
    address: Optional[str] = None
    unit_cost_keur: float = Field(85.0, ge=0, description="Unit cost in KEUR/year per FTE")
    is_active: bool = True


class SiteCreate(SiteBase):
    pass


class SiteUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=1, max_length=10)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    country_id: Optional[str] = None
    address: Optional[str] = None
    unit_cost_keur: Optional[float] = Field(None, ge=0, description="Unit cost in KEUR/year per FTE")
    is_active: Optional[bool] = None


class SiteResponse(SiteBase):
    id: str
    unit_cost_keur: float = 85.0
    created_at: datetime
    updated_at: Optional[datetime] = None
    team_count: int = 0
    country_name: Optional[str] = None
    country_code: Optional[str] = None

    class Config:
        from_attributes = True


class SiteWithTeams(SiteResponse):
    teams: List[dict] = []  # Basic team info


# Update forward references
CountryWithSites.model_rebuild()
