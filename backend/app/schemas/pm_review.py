"""
PM Review Schemas - Phase 6A

Pydantic schemas for PM review and approval workflow.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class PendingReview(BaseModel):
    """Single pending review summary."""
    team_id: str
    team_name: str
    pi_id: str
    pi_name: str
    plan_version_id: str
    committed_by: Optional[str] = None
    committed_at: Optional[datetime] = None
    items_count: int
    net_change_ed: float


class PendingReviewsResponse(BaseModel):
    """Response for pending reviews list."""
    pending_reviews: List[PendingReview]


class ApproveRequest(BaseModel):
    """Request to approve a planning item."""
    note: Optional[str] = Field(None, max_length=500)


class RejectRequest(BaseModel):
    """Request to reject a planning item."""
    reason: str = Field(..., min_length=10, max_length=500)


class BulkApproveRequest(BaseModel):
    """Request to bulk approve items."""
    planning_ids: List[str]
    note: Optional[str] = Field(None, max_length=500)


class BulkRejectRequest(BaseModel):
    """Request to bulk reject items."""
    planning_ids: List[str]
    reason: str = Field(..., min_length=10, max_length=500)


class ApproveResponse(BaseModel):
    """Response after approving an item."""
    status: str
    jira_updated: bool
    locked: bool = False  # Always False - no locking


class BulkApproveResponse(BaseModel):
    """Response after bulk approve."""
    approved_count: int
    errors: List[dict] = []
    locked: bool = False  # Always False - no locking


class BulkRejectResponse(BaseModel):
    """Response after bulk reject."""
    rejected_count: int
    errors: List[dict] = []


class NotificationItem(BaseModel):
    """Single notification item."""
    id: str
    team_id: str
    pi_id: str
    product_id: Optional[str]
    notification_type: str
    message: str
    is_read: bool
    read_at: Optional[datetime]
    created_at: datetime
    # NOTE: NO expires_at field - notifications persist until read
    
    class Config:
        from_attributes = True


class NotificationsResponse(BaseModel):
    """Response for notifications list."""
    unread_count: int
    notifications: List[NotificationItem]
