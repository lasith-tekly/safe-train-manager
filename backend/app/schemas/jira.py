"""
JIRA Record Schemas - Execution-level tracking
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class JiraQuarterlyAllocationInput(BaseModel):
    """Input schema for JIRA quarterly allocation"""
    year: int = Field(..., ge=2020, le=2050, description="Year")
    quarter: int = Field(..., ge=1, le=4, description="Quarter (1-4)")
    allocated_ed: Decimal = Field(..., ge=0, description="Allocated effort days")


class JiraQuarterlyAllocationResponse(BaseModel):
    """Response schema for JIRA quarterly allocation"""
    id: str
    jira_record_id: str
    year: int
    quarter: int
    allocated_ed: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CreateJiraRecordRequest(BaseModel):
    """Request schema for creating a JIRA record"""
    jira_key: str = Field(..., min_length=1, max_length=50, description="JIRA key (e.g., AOP-25718)")
    summary: Optional[str] = Field(None, max_length=500, description="JIRA issue summary")
    team_id: str = Field(..., description="Team ID")
    status: Optional[str] = Field("planned", description="Status: planned, in_progress, done, spillover")
    is_spillover: Optional[bool] = Field(False, description="Is this a spillover from previous quarter")
    spillover_from_year: Optional[int] = Field(None, description="Original year if spillover")
    spillover_from_quarter: Optional[int] = Field(None, ge=1, le=4, description="Original quarter if spillover")
    remarks: Optional[str] = Field(None, description="Additional remarks")
    quarterly_allocations: List[JiraQuarterlyAllocationInput] = Field(default_factory=list, description="Quarterly effort allocations")

    class Config:
        json_schema_extra = {
            "example": {
                "jira_key": "AOP-25718",
                "summary": "User authentication module",
                "team_id": "team-uuid",
                "status": "planned",
                "is_spillover": False,
                "quarterly_allocations": [
                    {"year": 2026, "quarter": 1, "allocated_ed": 20},
                    {"year": 2026, "quarter": 2, "allocated_ed": 30}
                ]
            }
        }


class UpdateJiraRecordRequest(BaseModel):
    """Request schema for updating a JIRA record"""
    jira_key: Optional[str] = Field(None, min_length=1, max_length=50)
    summary: Optional[str] = Field(None, max_length=500)
    team_id: Optional[str] = None
    status: Optional[str] = None
    is_spillover: Optional[bool] = None
    spillover_from_year: Optional[int] = None
    spillover_from_quarter: Optional[int] = Field(None, ge=1, le=4)
    remarks: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "status": "in_progress",
                "remarks": "Started implementation"
            }
        }


class UpdateJiraAllocationsRequest(BaseModel):
    """Request schema for updating JIRA quarterly allocations"""
    allocations: List[JiraQuarterlyAllocationInput] = Field(..., description="Quarterly allocations")

    class Config:
        json_schema_extra = {
            "example": {
                "allocations": [
                    {"year": 2026, "quarter": 1, "allocated_ed": 25},
                    {"year": 2026, "quarter": 2, "allocated_ed": 35}
                ]
            }
        }


class TeamSummary(BaseModel):
    """Summary of team information"""
    id: str
    name: str
    short_code: Optional[str] = None

    class Config:
        from_attributes = True


class JiraRecordResponse(BaseModel):
    """Response schema for JIRA record"""
    id: str
    feature_id: str
    jira_key: str
    summary: Optional[str]
    team_id: str
    team: Optional[TeamSummary] = None
    status: str
    is_spillover: bool
    spillover_from_year: Optional[int]
    spillover_from_quarter: Optional[int]
    remarks: Optional[str]
    quarterly_allocations: List[JiraQuarterlyAllocationResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JiraRecordListResponse(BaseModel):
    """Response schema for list of JIRA records"""
    data: List[JiraRecordResponse]
    total: int
