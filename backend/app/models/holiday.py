"""
Holiday and MemberLeave models.
"""
import uuid
import enum
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Boolean, Text, ForeignKey, UniqueConstraint, Index
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.database import Base


class Holiday(Base):
    """Public holiday - can be global, country-specific, or team-specific."""
    __tablename__ = "holidays"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    date = Column(Date, nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    is_half_day = Column(Boolean, nullable=False, default=False)
    is_recurring = Column(Boolean, nullable=False, default=False)
    country_id = Column(String(36), ForeignKey("countries.id", ondelete="SET NULL"), nullable=True, index=True)
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=True, index=True)
    country_code = Column(String(3), nullable=True)  # Legacy field, use country_id instead
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    country = relationship("Country", back_populates="holidays")
    team = relationship("Team", backref="team_holidays")

    __table_args__ = (
        UniqueConstraint('date', 'team_id', 'country_id', name='uq_holiday_date_team_country'),
        Index('ix_holiday_year_team', 'year', 'team_id'),
        Index('ix_holiday_year_country', 'year', 'country_id'),
    )

    def __repr__(self):
        return f"<Holiday {self.name} ({self.date})>"


class LeaveType(str, enum.Enum):
    VACATION = "vacation"
    SICK = "sick"
    TRAINING = "training"
    OTHER = "other"


class MemberLeave(Base):
    """Team member leave/time off - can be date-range or iteration-based."""
    __tablename__ = "member_leaves"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id = Column(String(36), ForeignKey("team_members.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Date-range based leave (legacy)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_half_day = Column(Boolean, nullable=False, default=False)
    
    # Iteration-based leave (new)
    iteration_id = Column(String(36), ForeignKey("iterations.id", ondelete="CASCADE"), nullable=True, index=True)
    leave_days = Column(Float, nullable=True)  # Number of days (supports decimals, e.g., 2.5 for half days)
    
    # Iteration-level productivity override (NULL = use PI-level or global)
    productivity_percent = Column(Integer, nullable=True)
    
    leave_type = Column(
        SQLEnum(LeaveType),
        nullable=False,
        default=LeaveType.VACATION
    )
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    member = relationship("TeamMember", backref="member_leaves")
    iteration = relationship("Iteration", backref="member_leaves")

    __table_args__ = (
        Index('ix_member_leave_dates', 'member_id', 'start_date', 'end_date'),
        Index('ix_member_leave_iteration', 'member_id', 'iteration_id'),
    )

    def __repr__(self):
        if self.iteration_id:
            return f"<MemberLeave {self.member_id} iteration={self.iteration_id}: {self.leave_days} days>"
        return f"<MemberLeave {self.member_id} ({self.start_date} - {self.end_date})>"
