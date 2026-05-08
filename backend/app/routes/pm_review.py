"""
PM Review Router - Phase 6A

API endpoints for PM review and approval workflow.

CRITICAL BUSINESS RULES:
1. No locking after approval - PO can request changes in next iteration
2. Descope approval: Remove from PI, flag for future
3. Notifications have NO expiry
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.database import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.schemas.pm_review import (
    PendingReviewsResponse,
    ApproveRequest,
    ApproveResponse,
    RejectRequest,
    BulkApproveRequest,
    BulkApproveResponse,
    BulkRejectRequest,
    BulkRejectResponse,
    NotificationsResponse
)
from app.services.pm_review_service import PMReviewService


class ReviewItemRequest(BaseModel):
    action: str  # 'approve' or 'reject'
    reason: Optional[str] = None  # optional for approve, required for reject


class CompleteReviewRequest(BaseModel):
    pi_id: str

router = APIRouter(prefix="/api", tags=["PM Review"])


@router.get("/products/{product_id}/planning-reviews", response_model=PendingReviewsResponse)
def get_pending_reviews(
    product_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all pending planning reviews for a product.
    Groups by team + PI.
    """
    try:
        service = PMReviewService(db)
        reviews = service.get_pending_reviews(product_id)
        return PendingReviewsResponse(pending_reviews=reviews)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/planning/{planning_id}/approve", response_model=ApproveResponse)
def approve_item(
    planning_id: str,
    data: ApproveRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Approve a planning item.

    CRITICAL: This does NOT lock the item. PO can request changes in next iteration.

    If item is descoped:
    - Remove from current PI (planned_effort = 0)
    - Flag for future PI consideration
    """
    try:
        service = PMReviewService(db)
        reviewer_id = current_user.id

        result = service.approve_item(planning_id, reviewer_id, data.note)
        
        return ApproveResponse(
            status="approved",
            jira_updated=True,
            locked=False  # Explicitly confirm no locking
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/planning/{planning_id}/reject")
def reject_item(
    planning_id: str,
    data: RejectRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Reject a planning item with reason.
    PO will receive notification with rejection reason.
    """
    try:
        service = PMReviewService(db)
        reviewer_id = current_user.id

        result = service.reject_item(planning_id, reviewer_id, data.reason)
        
        return {
            "status": "rejected",
            "notification_sent": True
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/planning/bulk-approve", response_model=BulkApproveResponse)
def bulk_approve(
    data: BulkApproveRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Bulk approve multiple items.

    CRITICAL: Items are NOT locked after approval.
    PO can request changes in next iteration.
    """
    try:
        service = PMReviewService(db)
        reviewer_id = current_user.id

        result = service.bulk_approve(data.planning_ids, reviewer_id, data.note)
        
        return BulkApproveResponse(
            approved_count=result['approved_count'],
            errors=result['errors'],
            locked=False  # Explicitly confirm no locking
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/planning/bulk-reject", response_model=BulkRejectResponse)
def bulk_reject(
    data: BulkRejectRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Bulk reject multiple items with reason.
    All items will receive the same rejection reason.
    """
    try:
        service = PMReviewService(db)
        reviewer_id = current_user.id

        result = service.bulk_reject(data.planning_ids, reviewer_id, data.reason)
        
        return BulkRejectResponse(
            rejected_count=result['rejected_count'],
            errors=result['errors']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/notifications/planning", response_model=NotificationsResponse)
def get_planning_notifications(
    is_read: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get planning notifications for current user.

    CRITICAL: Notifications do NOT expire. They persist until read.
    No expiry filter is applied.
    """
    try:
        service = PMReviewService(db)
        user_id = current_user.id

        result = service.get_notifications(user_id=user_id, is_read=is_read)
        
        return NotificationsResponse(
            unread_count=result['unread_count'],
            notifications=result['notifications']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Mark notification as read."""
    try:
        service = PMReviewService(db)
        service.mark_notification_read(notification_id)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/teams/{team_id}/planning/review")
def get_review_items(
    team_id: str,
    pi_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """PM fetches committed plan for review"""
    try:
        from app.services.team_planning_service import TeamPlanningService
        service = TeamPlanningService(db)
        return service.get_committed_plan(team_id, pi_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/teams/{team_id}/planning/{jira_record_id}/review")
def review_item(
    team_id: str,
    jira_record_id: str,
    request: ReviewItemRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """PM approves or rejects a single item"""
    try:
        print(f"REVIEW: team={team_id}, jira={jira_record_id}, action={request.action}")
        if request.action == 'reject' and not request.reason:
            raise HTTPException(status_code=400, detail="Rejection reason is required")

        from app.services.team_planning_service import TeamPlanningService
        service = TeamPlanningService(db)
        return service.review_item(team_id, jira_record_id, request.action, request.reason)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        print(f"REVIEW ERROR: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/teams/{team_id}/planning/review/complete")
def complete_review(
    team_id: str,
    request: CompleteReviewRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """PM submits final review decision"""
    try:
        print(f"COMPLETE REVIEW: team={team_id}, pi={request.pi_id}")
        from app.services.team_planning_service import TeamPlanningService
        service = TeamPlanningService(db)
        return service.complete_review(team_id, request.pi_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        print(f"COMPLETE REVIEW ERROR: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/notifications/pending-reviews")
def get_pending_reviews_count(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get count of plans pending PM review - for notification badge"""
    try:
        from app.services.team_planning_service import TeamPlanningService
        service = TeamPlanningService(db)
        return service.get_pending_review_count()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/teams/{team_id}/planning/resubmit")
def resubmit_plan(
    team_id: str,
    pi_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Reset rejected plan to draft for revision"""
    try:
        from app.models.team_planning import POPlanVersion, TeamPlanning
        from sqlalchemy import and_
        
        po_plan = db.query(POPlanVersion).filter(
            and_(
                POPlanVersion.team_id == team_id,
                POPlanVersion.pi_id == pi_id,
                POPlanVersion.status == 'rejected'
            )
        ).first()
        
        if not po_plan:
            raise HTTPException(status_code=404, detail="No rejected plan found")
        
        po_plan.status = 'draft'
        
        # Reset review status on all items
        db.query(TeamPlanning).filter(
            and_(
                TeamPlanning.team_id == team_id,
                TeamPlanning.pi_id == pi_id
            )
        ).update({"review_status": None, "rejection_reason": None, "reviewed_at": None})
        
        db.commit()
        return {"status": "draft", "message": "Plan reset for revision"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
