"""
PM Review Service - Phase 6A

CRITICAL BUSINESS RULES:
1. No locking after approval - PO can request changes in next iteration
2. Descope approval: Remove from PI (planned_effort=0), flag for future
3. Notifications have NO expiry - persist until read
"""
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime
import uuid

from app.models.team_planning import TeamPlanning, PlanningNotification, POPlanVersion
from app.models.roadmap_v4 import JiraRecord
from app.models.team import Team
from app.models.pi import PI


class PMReviewService:
    """Service for PM review and approval workflow."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_pending_reviews(self, product_id: str) -> List[Dict]:
        """
        Get all pending plan reviews for a product.
        Groups by team + PI where review_status = 'pending'.
        """
        # Query planning items pending review
        results = self.db.query(
            TeamPlanning.team_id,
            TeamPlanning.pi_id,
            TeamPlanning.plan_version_id,
            func.count(TeamPlanning.id).label('items_count'),
            func.sum(
                func.coalesce(TeamPlanning.planned_effort, 0) - 
                func.coalesce(TeamPlanning.original_pm_effort, 0)
            ).label('net_change'),
            func.min(TeamPlanning.committed_at).label('committed_at')
        ).join(
            JiraRecord, TeamPlanning.jira_record_id == JiraRecord.id
        ).filter(
            and_(
                TeamPlanning.review_status == 'pending',
                TeamPlanning.is_orphaned == False
            )
        ).group_by(
            TeamPlanning.team_id,
            TeamPlanning.pi_id,
            TeamPlanning.plan_version_id
        ).all()
        
        reviews = []
        for r in results:
            plan_version = self.db.query(POPlanVersion).filter(
                POPlanVersion.id == r.plan_version_id
            ).first()
            
            team = self.db.query(Team).filter(Team.id == r.team_id).first()
            pi = self.db.query(PI).filter(PI.id == r.pi_id).first()
            
            reviews.append({
                'team_id': r.team_id,
                'team_name': team.name if team else 'Unknown',
                'pi_id': r.pi_id,
                'pi_name': pi.name if pi else 'Unknown',
                'plan_version_id': r.plan_version_id,
                'committed_by': plan_version.committed_by if plan_version else None,
                'committed_at': r.committed_at,
                'items_count': r.items_count,
                'net_change_ed': float(r.net_change or 0)
            })
        
        return reviews
    
    def get_review_items(
        self,
        team_id: str,
        pi_id: str,
        version_id: str
    ) -> List[TeamPlanning]:
        """Get items pending review for a specific team/PI."""
        return self.db.query(TeamPlanning).filter(
            and_(
                TeamPlanning.team_id == team_id,
                TeamPlanning.pi_id == pi_id,
                TeamPlanning.version_id == version_id,
                TeamPlanning.review_status == 'pending',
                TeamPlanning.is_orphaned == False
            )
        ).all()
    
    def approve_item(
        self,
        planning_id: str,
        reviewer_id: str,
        note: Optional[str] = None
    ) -> TeamPlanning:
        """
        Approve a planning item and update JIRA record.
        
        CRITICAL: Does NOT lock the item.
        PO can request changes in next iteration.
        """
        planning = self.db.query(TeamPlanning).filter(
            TeamPlanning.id == planning_id
        ).first()
        
        if not planning:
            raise ValueError("Planning item not found")
        
        if planning.is_orphaned:
            raise ValueError("Cannot approve orphaned item")
        
        # Update planning record - NO LOCKING
        planning.review_status = 'approved'
        planning.reviewed_at = datetime.utcnow()
        planning.reviewed_by = reviewer_id
        planning.review_note = note
        # NOTE: No planning.locked = True - locking does not exist
        
        # Update JIRA record with approved values
        jira_record = self.db.query(JiraRecord).filter(
            JiraRecord.id == planning.jira_record_id
        ).first()
        
        if not jira_record:
            raise ValueError("JIRA record not found")
        
        if planning.is_descoped:
            # DESCOPE APPROVAL: Remove from PI, flag for future
            jira_record.planned_effort = 0
            jira_record.is_descoped = True
            jira_record.descope_reason = planning.descope_reason
            jira_record.flagged_for_future_pi = True  # Flag for future PI consideration
        else:
            # Update effort and role breakdown
            jira_record.planned_effort = planning.planned_effort
            jira_record.dev_effort = planning.dev_effort
            jira_record.pd_effort = planning.pd_effort
            jira_record.qa_effort = planning.qa_effort
        
        self.db.commit()
        
        # Create notification for PO (NO expiry)
        self._create_notification(
            planning=planning,
            notification_type='plan_approved',
            message=f'Your planning for {jira_record.jira_key} has been approved'
        )
        
        return planning
    
    def reject_item(
        self,
        planning_id: str,
        reviewer_id: str,
        reason: str
    ) -> TeamPlanning:
        """Reject a planning item with reason."""
        planning = self.db.query(TeamPlanning).filter(
            TeamPlanning.id == planning_id
        ).first()
        
        if not planning:
            raise ValueError("Planning item not found")
        
        planning.review_status = 'rejected'
        planning.reviewed_at = datetime.utcnow()
        planning.reviewed_by = reviewer_id
        planning.rejection_reason = reason
        
        self.db.commit()
        
        # Create notification for PO (NO expiry)
        jira_record = self.db.query(JiraRecord).filter(
            JiraRecord.id == planning.jira_record_id
        ).first()
        
        if jira_record:
            self._create_notification(
                planning=planning,
                notification_type='plan_rejected',
                message=f'Your planning for {jira_record.jira_key} was rejected: {reason}'
            )
        
        return planning
    
    def bulk_approve(
        self,
        planning_ids: List[str],
        reviewer_id: str,
        note: Optional[str] = None
    ) -> Dict:
        """
        Bulk approve multiple items.
        NO LOCKING - PO can request changes in next iteration.
        """
        approved_count = 0
        errors = []
        
        for planning_id in planning_ids:
            try:
                self.approve_item(planning_id, reviewer_id, note)
                approved_count += 1
            except Exception as e:
                errors.append({
                    'planning_id': planning_id,
                    'error': str(e)
                })
        
        return {
            'approved_count': approved_count,
            'errors': errors,
            'locked': False  # Explicitly confirm no locking
        }
    
    def bulk_reject(
        self,
        planning_ids: List[str],
        reviewer_id: str,
        reason: str
    ) -> Dict:
        """Bulk reject multiple items."""
        rejected_count = 0
        errors = []
        
        for planning_id in planning_ids:
            try:
                self.reject_item(planning_id, reviewer_id, reason)
                rejected_count += 1
            except Exception as e:
                errors.append({
                    'planning_id': planning_id,
                    'error': str(e)
                })
        
        return {
            'rejected_count': rejected_count,
            'errors': errors
        }
    
    def get_notifications(
        self,
        user_id: Optional[str] = None,
        role: Optional[str] = None,
        is_read: Optional[bool] = None
    ) -> Dict:
        """
        Get notifications for a user.
        NO EXPIRY - all unread notifications are returned.
        """
        query = self.db.query(PlanningNotification)
        
        # Filter by read status
        if is_read is not None:
            query = query.filter(PlanningNotification.is_read == is_read)
        
        # Filter by role or user
        if role:
            query = query.filter(PlanningNotification.target_role == role)
        elif user_id:
            query = query.filter(PlanningNotification.target_user_id == user_id)
        
        # NO expiry filter - notifications persist until read
        # NO: query.filter(PlanningNotification.expires_at > datetime.utcnow())
        
        notifications = query.order_by(
            PlanningNotification.created_at.desc()
        ).limit(50).all()
        
        unread_count = self.db.query(PlanningNotification).filter(
            PlanningNotification.is_read == False
        ).count()
        
        return {
            'unread_count': unread_count,
            'notifications': notifications
        }
    
    def mark_notification_read(self, notification_id: str) -> None:
        """Mark a notification as read."""
        notification = self.db.query(PlanningNotification).filter(
            PlanningNotification.id == notification_id
        ).first()
        
        if notification:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            self.db.commit()
    
    def _create_notification(
        self,
        planning: TeamPlanning,
        notification_type: str,
        message: str
    ) -> PlanningNotification:
        """
        Create a notification.
        NO expiry - notifications persist until read.
        """
        jira = self.db.query(JiraRecord).filter(
            JiraRecord.id == planning.jira_record_id
        ).first()
        
        notification = PlanningNotification(
            id=str(uuid.uuid4()),
            team_id=planning.team_id,
            pi_id=planning.pi_id,
            product_id=jira.feature.product_id if jira and jira.feature else None,
            notification_type=notification_type,
            message=message,
            target_user_id=planning.committed_by,
            target_role='PO',
            planning_id=planning.id,
            is_read=False
            # NO expires_at field - notifications persist until read
        )
        self.db.add(notification)
        self.db.commit()
        return notification
