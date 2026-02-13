"""
Alignment Schemas - Phase 4

Pydantic schemas for alignment actions and responses.
"""
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional
from enum import Enum
from datetime import datetime


class AlignmentAction(str, Enum):
    """Alignment action types"""
    AUTO_ALIGN = "auto_align"
    MANUAL_UPDATE = "manual_update"
    ADJUST_EXECUTION = "adjust_execution"
    ACKNOWLEDGE = "acknowledge"


class QuarterAllocation(BaseModel):
    """Quarterly allocation for manual update"""
    pi_id: str = Field(..., description="PI identifier")
    effort_ed: float = Field(..., ge=0, description="Effort in Net eD")

    class Config:
        json_schema_extra = {
            "example": {
                "pi_id": "uuid",
                "effort_ed": 10.5
            }
        }


class AlignFeatureRequest(BaseModel):
    """Request to align a feature"""
    action: AlignmentAction
    quarterly_allocations: Optional[List[QuarterAllocation]] = None
    acknowledge_reason: Optional[str] = Field(None, min_length=0, max_length=1000)

    @validator('quarterly_allocations')
    def validate_manual_update(cls, v, values):
        if values.get('action') == AlignmentAction.MANUAL_UPDATE and not v:
            raise ValueError("quarterly_allocations required for manual_update action")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "action": "auto_align",
                "quarterly_allocations": None,
                "acknowledge_reason": None
            }
        }


class AlignFeatureResponse(BaseModel):
    """Response from align feature operation"""
    feature_id: str
    action: AlignmentAction
    previous_total: float = Field(..., description="Previous total effort in Net eD")
    new_total: float = Field(..., description="New total effort in Net eD")
    change: float = Field(..., description="Change in effort (new - previous)")
    quarterly_changes: Dict[str, Dict] = Field(default_factory=dict)
    success: bool
    message: str

    class Config:
        json_schema_extra = {
            "example": {
                "feature_id": "uuid",
                "action": "auto_align",
                "previous_total": 30.0,
                "new_total": 33.0,
                "change": 3.0,
                "quarterly_changes": {
                    "Q1 2026": {"previous": 10.0, "new": 12.0, "change": 2.0}
                },
                "success": True,
                "message": "Feature aligned successfully"
            }
        }


class BatchJiraUpdateItem(BaseModel):
    """Single JIRA record update"""
    record_id: str
    new_pi_id: Optional[str] = None
    new_effort: Optional[float] = Field(None, ge=0)

    class Config:
        json_schema_extra = {
            "example": {
                "record_id": "uuid",
                "new_pi_id": "uuid",
                "new_effort": 5.0
            }
        }


class BatchJiraUpdateRequest(BaseModel):
    """Request for batch JIRA record updates"""
    updates: List[BatchJiraUpdateItem] = Field(..., min_length=1)

    class Config:
        json_schema_extra = {
            "example": {
                "updates": [
                    {
                        "record_id": "uuid1",
                        "new_pi_id": "uuid2",
                        "new_effort": 5.0
                    }
                ]
            }
        }


class BatchJiraUpdateResponse(BaseModel):
    """Response from batch JIRA update"""
    updated_count: int
    failed_count: int
    results: List[Dict]

    class Config:
        json_schema_extra = {
            "example": {
                "updated_count": 3,
                "failed_count": 1,
                "results": [
                    {
                        "record_id": "uuid",
                        "status": "updated",
                        "changes": {"pi_id": "old → new"}
                    }
                ]
            }
        }


class CreateVersionFromAlignmentRequest(BaseModel):
    """Request to create version from alignment changes"""
    product_id: str
    source_version_id: str
    version_name: str = Field(..., min_length=1, max_length=255)
    notes: Optional[str] = None
    alignment_changes: Dict = Field(default_factory=dict)
    publish_immediately: bool = False

    class Config:
        json_schema_extra = {
            "example": {
                "product_id": "uuid",
                "source_version_id": "uuid",
                "version_name": "Alignment - 2026-02-11",
                "notes": "Aligned 5 features with execution plan",
                "alignment_changes": {},
                "publish_immediately": False
            }
        }


class CreateVersionFromAlignmentResponse(BaseModel):
    """Response from create version"""
    version_id: str
    version_name: str
    status: str
    created_at: str
    features_aligned: int
    total_deviation_before: float
    total_deviation_after: float

    class Config:
        json_schema_extra = {
            "example": {
                "version_id": "uuid",
                "version_name": "Alignment - 2026-02-11",
                "status": "DRAFT",
                "created_at": "2026-02-11T09:40:00Z",
                "features_aligned": 5,
                "total_deviation_before": 45.2,
                "total_deviation_after": 2.1
            }
        }


class AcknowledgeDeviationRequest(BaseModel):
    """Request to acknowledge deviation"""
    reason: str = Field(default="", min_length=0, max_length=1000)

    class Config:
        json_schema_extra = {
            "example": {
                "reason": "Spillover from previous PI due to dependency delays"
            }
        }


class AcknowledgeDeviationResponse(BaseModel):
    """Response from acknowledge deviation"""
    feature_id: str
    acknowledged: bool
    reason: str
    acknowledged_at: str

    class Config:
        json_schema_extra = {
            "example": {
                "feature_id": "uuid",
                "acknowledged": True,
                "reason": "Spillover from previous PI due to dependency delays",
                "acknowledged_at": "2026-02-11T09:40:00Z"
            }
        }
