"""
Team Iteration Capacity model.
"""
import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, UniqueConstraint, Numeric
from sqlalchemy.orm import relationship

from app.database import Base


class TeamIterationCapacity(Base):
    """Team capacity for a specific iteration."""
    __tablename__ = "team_iteration_capacities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    iteration_id = Column(String(36), ForeignKey("iterations.id", ondelete="CASCADE"), nullable=False, index=True)
    calculated_capacity = Column(Numeric(8, 2), nullable=False, default=Decimal("0"))
    manual_override = Column(Numeric(8, 2), nullable=True)
    override_reason = Column(Text, nullable=True)
    allocated = Column(Numeric(8, 2), nullable=False, default=Decimal("0"))
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    team = relationship("Team", backref="iteration_capacities")
    iteration = relationship("Iteration", back_populates="team_capacities")

    @property
    def final_capacity(self) -> float:
        """Return override if set, otherwise calculated."""
        return float(self.manual_override if self.manual_override is not None else self.calculated_capacity)

    @property
    def available(self) -> float:
        """Remaining capacity."""
        return self.final_capacity - float(self.allocated)

    @property
    def utilization(self) -> float:
        """Utilization percentage."""
        if self.final_capacity == 0:
            return 0.0
        return round((float(self.allocated) / self.final_capacity) * 100, 1)

    __table_args__ = (
        UniqueConstraint('team_id', 'iteration_id', name='uq_team_iteration_capacity'),
    )

    def __repr__(self):
        return f"<TeamIterationCapacity team={self.team_id} iter={self.iteration_id}>"
