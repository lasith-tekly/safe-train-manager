from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class SpilloverHistory(Base):
    """Model for tracking spillover history events."""
    __tablename__ = "spillover_history"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    jira_record_id = Column(String(36), ForeignKey("jira_records.id", ondelete="CASCADE"), nullable=False)
    from_pi_id = Column(String(36), ForeignKey("pis.id", ondelete="SET NULL"), nullable=True)
    to_pi_id = Column(String(36), ForeignKey("pis.id", ondelete="SET NULL"), nullable=True)
    spillover_effort = Column(Float, nullable=False)
    completed_effort = Column(Float, default=0)
    reason = Column(String(500), nullable=False)
    category = Column(String(50), nullable=True)
    sequence = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    from_pi = relationship("PI", foreign_keys=[from_pi_id])
    to_pi = relationship("PI", foreign_keys=[to_pi_id])
