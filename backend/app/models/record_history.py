"""
RecordHistory Model - Track all changes to JIRA records
Phase 3.2: Complete record lifecycle tracking
"""
from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class RecordHistory(Base):
    """Track all changes to JIRA records"""
    __tablename__ = "record_history"

    id = Column(String(36), primary_key=True)
    jira_record_id = Column(String(36), ForeignKey("jira_records.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Event type: CREATED, STATUS_CHANGE, SPILLOVER, SPILLOVER_EDIT, etc.
    event_type = Column(String(50), nullable=False, index=True)
    
    # Generic change tracking
    from_value = Column(Text, nullable=True)
    to_value = Column(Text, nullable=True)
    field_name = Column(String(100), nullable=True)
    
    # Spillover-specific fields
    from_pi_id = Column(String(36), ForeignKey("pis.id"), nullable=True)
    to_pi_id = Column(String(36), ForeignKey("pis.id"), nullable=True)
    spillover_effort = Column(Float, nullable=True)
    completed_effort = Column(Float, nullable=True)
    spillover_reason = Column(String(500), nullable=True)
    spillover_category = Column(String(50), nullable=True)
    
    # Event metadata (JSON stored as text)
    event_metadata = Column(Text, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
