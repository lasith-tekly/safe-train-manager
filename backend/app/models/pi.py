"""
PI (Program Increment) and Iteration models.
"""
import uuid
import enum
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Date, DateTime, Boolean, ForeignKey, UniqueConstraint, Index
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.database import Base


class PIStatus(str, enum.Enum):
    PLANNING = "planning"     # PI is being planned
    ACTIVE = "active"         # Current PI in execution
    COMPLETED = "completed"   # PI finished


class PI(Base):
    """Program Increment - a time-boxed planning interval (typically 8-12 weeks)."""
    __tablename__ = "pis"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False, index=True)
    sequence = Column(Integer, nullable=False)  # 1, 2, 3, 4...
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(
        SQLEnum(PIStatus),
        nullable=False,
        default=PIStatus.PLANNING,
        index=True
    )
    train_id = Column(String(36), ForeignKey("trains.id", ondelete="SET NULL"),
                      nullable=True, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    iterations = relationship(
        "Iteration",
        back_populates="pi",
        cascade="all, delete-orphan",
        order_by="Iteration.sequence"
    )
    jira_records = relationship("JiraRecord", foreign_keys="JiraRecord.pi_id", back_populates="pi")

    @property
    def start_week(self) -> int:
        """ISO week number of start date."""
        return self.start_date.isocalendar()[1]

    @property
    def end_week(self) -> int:
        """ISO week number of end date."""
        return self.end_date.isocalendar()[1]

    @property
    def duration_weeks(self) -> int:
        """Total weeks in PI."""
        return ((self.end_date - self.start_date).days // 7) + 1

    __table_args__ = (
        UniqueConstraint('year', 'sequence', name='uq_pi_year_sequence'),
        Index('ix_pi_year_status', 'year', 'status'),
    )

    def __repr__(self):
        return f"<PI {self.name} ({self.year})>"


class Iteration(Base):
    """An iteration within a PI."""
    __tablename__ = "iterations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pi_id = Column(String(36), ForeignKey("pis.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(50), nullable=False)
    sequence = Column(Integer, nullable=False)  # 1, 2, 3...
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    duration_weeks = Column(Integer, nullable=False, default=2)
    is_ip_iteration = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    pi = relationship("PI", back_populates="iterations")
    team_capacities = relationship(
        "TeamIterationCapacity",
        back_populates="iteration",
        cascade="all, delete-orphan"
    )

    @property
    def start_week(self) -> int:
        """ISO week number of start date."""
        return self.start_date.isocalendar()[1]

    @property
    def end_week(self) -> int:
        """ISO week number of end date."""
        return self.end_date.isocalendar()[1]

    __table_args__ = (
        UniqueConstraint('pi_id', 'sequence', name='uq_iteration_pi_sequence'),
    )

    def __repr__(self):
        return f"<Iteration {self.name} (PI: {self.pi_id})>"
