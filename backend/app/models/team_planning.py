"""
Team Planning Models - Phase 5+6

CRITICAL BUSINESS RULES:
1. Orphaned JIRA Support: ON DELETE SET NULL for jira_record_id
2. No Locking: NO locked/is_locked columns
3. No Notification Expiry: NO expires_at column
4. Max 2 Draft Versions: CHECK constraint version_number <= 2
5. Preserve Orphaned Data: orphaned_jira_key, orphaned_jira_title columns
"""
from sqlalchemy import Column, String, Boolean, Numeric, DateTime, ForeignKey, Text, Integer, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class POPlanVersion(Base):
    """
    PO Plan Versions - Track draft plan versions (max 2 per team/PI).
    """
    __tablename__ = "po_plan_versions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    pi_id = Column(String(36), ForeignKey("pis.id", ondelete="CASCADE"), nullable=False)
    strategic_version_id = Column(String(36), ForeignKey("roadmap_versions.id", ondelete="CASCADE"), nullable=True)  # Temporary - will be removed
    
    version_number = Column(Integer, nullable=False, default=1)
    status = Column(String(20), nullable=False, default="draft")
    
    # Preserve planning data for outdated drafts (stored as JSON string in SQLite)
    planning_snapshot = Column(Text)
    
    # Outdated tracking - when PM changes JIRA assignments
    is_outdated = Column(Boolean, nullable=False, default=False)
    outdated_reason = Column(Text, nullable=True)
    outdated_at = Column(DateTime, nullable=True)
    
    committed_at = Column(DateTime)
    committed_by = Column(String(36), nullable=True)  # User ID (no FK - users table doesn't exist yet)
    reviewed_at = Column(DateTime, nullable=True)  # When PM completed review
    
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    team = relationship("Team", back_populates="plan_versions")
    pi = relationship("PI", foreign_keys=[pi_id])
    planning_items = relationship("TeamPlanning", back_populates="plan_version")
    
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'committed', 'approved', 'rejected', 'outdated')", 
            name="po_plan_versions_status_check"
        ),
        CheckConstraint("version_number <= 2", name="po_plan_versions_max_two"),
        UniqueConstraint("team_id", "pi_id", "version_number", name="po_plan_versions_unique"),
    )


class TeamPlanning(Base):
    """
    Team Planning - PO's planning data with auto-calculated status.
    
    CRITICAL: 
    - jira_record_id uses ON DELETE SET NULL to detect orphaned JIRAs
    - NO locked column (items do NOT lock after approval)
    - Status is auto-calculated, includes 'orphaned'
    """
    __tablename__ = "team_planning"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # CRITICAL: ON DELETE SET NULL to detect orphaned JIRAs
    jira_record_id = Column(String(36), ForeignKey("jira_records.id", ondelete="SET NULL"), nullable=True)
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    pi_id = Column(String(36), ForeignKey("pis.id", ondelete="CASCADE"), nullable=False)
    version_id = Column(String(36), ForeignKey("roadmap_versions.id", ondelete="CASCADE"), nullable=False)
    
    # PO's planning data
    planned_effort = Column(Numeric(10, 2))
    dev_effort = Column(Numeric(10, 2), nullable=False, default=0)
    pd_effort = Column(Numeric(10, 2), nullable=False, default=0)
    qa_effort = Column(Numeric(10, 2), nullable=False, default=0)
    
    # Status tracking (auto-calculated, includes 'orphaned')
    status = Column(String(20), nullable=False, default="not_planned")
    original_pm_effort = Column(Numeric(10, 2))
    
    # Orphan tracking - preserve data when JIRA deleted
    is_orphaned = Column(Boolean, nullable=False, default=False)
    orphaned_jira_key = Column(String(50))
    orphaned_jira_title = Column(Text)
    orphaned_at = Column(DateTime)
    
    # Descope
    is_descoped = Column(Boolean, nullable=False, default=False)
    descope_reason = Column(Text)
    descoped_at = Column(DateTime)
    
    # Commit workflow
    committed_at = Column(DateTime)
    committed_by = Column(String(36), nullable=True)  # User ID (no FK - users table doesn't exist yet)
    plan_version_id = Column(String(36), ForeignKey("po_plan_versions.id"))
    
    # PM review - NOTE: NO locked column
    review_status = Column(String(20))
    reviewed_at = Column(DateTime)
    reviewed_by = Column(String(36), nullable=True)  # User ID (no FK - users table doesn't exist yet)
    review_note = Column(Text)
    rejection_reason = Column(Text)
    
    # Audit
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(36), nullable=True)  # User ID (no FK - users table doesn't exist yet)
    
    # Relationships
    jira_record = relationship("JiraRecord", back_populates="team_planning")
    team = relationship("Team", back_populates="planning_items")
    pi = relationship("PI", foreign_keys=[pi_id])
    version = relationship("RoadmapVersion", foreign_keys=[version_id])
    plan_version = relationship("POPlanVersion", back_populates="planning_items")
    
    __table_args__ = (
        CheckConstraint(
            "status IN ('not_planned', 'accepted', 'modified', 'descope_proposed', 'orphaned')", 
            name="team_planning_status_check"
        ),
        CheckConstraint(
            "review_status IS NULL OR review_status IN ('pending', 'approved', 'rejected')", 
            name="team_planning_review_status_check"
        ),
    )


class PlanningNotification(Base):
    """
    Planning Notifications - NO expiry, persist until read.
    
    CRITICAL: NO expires_at column - notifications persist until read.
    """
    __tablename__ = "planning_notifications"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    pi_id = Column(String(36), ForeignKey("pis.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    
    notification_type = Column(String(30), nullable=False)
    message = Column(Text)
    
    target_user_id = Column(String(36), nullable=True)  # User ID (no FK - users table doesn't exist yet)
    target_role = Column(String(20))
    
    # NO expiry - persist until read
    is_read = Column(Boolean, nullable=False, default=False)
    read_at = Column(DateTime)
    # NOTE: NO expires_at column
    
    planning_id = Column(String(36), ForeignKey("team_planning.id", ondelete="SET NULL"))
    plan_version_id = Column(String(36), ForeignKey("po_plan_versions.id", ondelete="SET NULL"))
    
    # Metadata
    items_count = Column(Integer, default=0)
    total_effort_change = Column(Numeric(10, 2), default=0)
    
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    team = relationship("Team", foreign_keys=[team_id])
    pi = relationship("PI", foreign_keys=[pi_id])
    product = relationship("Product", foreign_keys=[product_id])
    # target_user relationship removed - User model doesn't exist yet
    planning = relationship("TeamPlanning", foreign_keys=[planning_id])
    plan_version = relationship("POPlanVersion", foreign_keys=[plan_version_id])
    
    __table_args__ = (
        CheckConstraint(
            "notification_type IN ('plan_committed', 'plan_approved', 'plan_rejected', 'version_changed', 'plan_needs_revision')",
            name="planning_notifications_type_check"
        ),
    )
