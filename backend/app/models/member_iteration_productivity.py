"""
MemberIterationProductivity model for iteration-level productivity overrides.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship

from app.database import Base


class MemberIterationProductivity(Base):
    """Iteration-level productivity override for team members.
    
    Allows setting a different productivity percentage for specific iterations,
    overriding the PI-level or global productivity setting.
    """
    __tablename__ = "member_iteration_productivity"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id = Column(String(36), ForeignKey("team_members.id", ondelete="CASCADE"), nullable=False, index=True)
    iteration_id = Column(String(36), ForeignKey("iterations.id", ondelete="CASCADE"), nullable=False, index=True)
    productivity_percent = Column(Integer, nullable=False)  # 0-100
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    member = relationship("TeamMember", backref="iteration_productivity")
    iteration = relationship("Iteration", backref="member_productivity")

    __table_args__ = (
        UniqueConstraint('member_id', 'iteration_id', name='uq_member_iteration_productivity'),
        Index('ix_member_iteration_prod', 'member_id', 'iteration_id'),
    )

    def __repr__(self):
        return f"<MemberIterationProductivity {self.member_id} - Iter:{self.iteration_id}: {self.productivity_percent}%>"
