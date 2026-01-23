from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class FeatureBase(BaseModel):
    jira_key: str = Field(..., max_length=20)
    jira_id: str = Field(..., max_length=50)
    title: str = Field(..., max_length=500)
    description: Optional[str] = None
    jira_status: Optional[str] = Field(None, max_length=50)
    story_points: Optional[int] = Field(0, ge=0)
    jira_url: Optional[str] = Field(None, max_length=500)


class FeatureCreate(FeatureBase):
    product_id: Optional[UUID] = None
    budget_line_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    quarter: Optional[int] = Field(None, ge=1, le=4)
    year: Optional[int] = Field(None, ge=2020, le=2100)
    cost: Optional[Decimal] = Field(Decimal("0"), ge=0)


class FeatureUpdate(BaseModel):
    product_id: Optional[UUID] = None
    budget_line_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    quarter: Optional[int] = Field(None, ge=1, le=4)
    year: Optional[int] = Field(None, ge=2020, le=2100)
    cost: Optional[Decimal] = Field(None, ge=0)
    internal_status: Optional[str] = None

    @field_validator('internal_status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid = ['not_started', 'in_progress', 'completed']
        if v not in valid:
            raise ValueError(f'Status must be one of: {", ".join(valid)}')
        return v


class ProductSummary(BaseModel):
    id: UUID
    name: str
    short_code: str

    class Config:
        from_attributes = True


class BudgetLineSummary(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True


class TeamSummary(BaseModel):
    id: UUID
    name: str
    short_code: str

    class Config:
        from_attributes = True


class FeatureResponse(BaseModel):
    id: UUID
    jira_key: str
    jira_id: str
    title: str
    description: Optional[str] = None
    jira_status: Optional[str] = None
    internal_status: str
    product: Optional[ProductSummary] = None
    budget_line: Optional[BudgetLineSummary] = None
    team: Optional[TeamSummary] = None
    quarter: Optional[int] = None
    year: Optional[int] = None
    story_points: int = 0
    cost: Decimal = Decimal("0")
    jira_url: Optional[str] = None
    last_synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FeatureListResponse(BaseModel):
    data: List[FeatureResponse]
    total: int
    page: int = 1
    page_size: int = 20


class ManualFeatureCreate(BaseModel):
    """For creating features manually without JIRA."""
    title: str = Field(..., max_length=500)
    description: Optional[str] = None
    product_id: Optional[UUID] = None
    budget_line_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    quarter: Optional[int] = Field(None, ge=1, le=4)
    year: Optional[int] = Field(None, ge=2020, le=2100)
    story_points: Optional[int] = Field(0, ge=0)
    cost: Optional[Decimal] = Field(Decimal("0"), ge=0)
    internal_status: Optional[str] = Field("not_started")

    @field_validator('internal_status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return "not_started"
        valid = ['not_started', 'in_progress', 'completed']
        if v not in valid:
            raise ValueError(f'Status must be one of: {", ".join(valid)}')
        return v


class BulkFeatureCreate(BaseModel):
    features: List[FeatureCreate]


class BulkFeatureResponse(BaseModel):
    imported: int
    failed: int
    errors: List[str] = []


# JIRA Schemas
class JiraConfigBase(BaseModel):
    jira_url: str = Field(..., max_length=200)
    username: str = Field(..., max_length=100)
    project_keys: Optional[List[str]] = None


class JiraConfigCreate(JiraConfigBase):
    api_token: str = Field(..., max_length=500)


class JiraConfigUpdate(BaseModel):
    jira_url: Optional[str] = Field(None, max_length=200)
    username: Optional[str] = Field(None, max_length=100)
    api_token: Optional[str] = Field(None, max_length=500)
    project_keys: Optional[List[str]] = None
    is_active: Optional[bool] = None


class JiraConfigResponse(BaseModel):
    id: UUID
    jira_url: str
    username: str
    project_keys: Optional[List[str]] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JiraTestResponse(BaseModel):
    success: bool
    message: str
    projects: Optional[List[str]] = None


class JiraSearchRequest(BaseModel):
    project_key: str
    jql: Optional[str] = None
    max_results: int = Field(50, ge=1, le=100)


class JiraIssue(BaseModel):
    key: str
    id: str
    summary: str
    status: str
    story_points: Optional[int] = 0
    labels: List[str] = []
    url: str
    already_imported: bool = False


class JiraSearchResponse(BaseModel):
    issues: List[JiraIssue]
    total: int
