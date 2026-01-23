import uuid
import enum
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, String, Text, DateTime, Integer, Numeric, ForeignKey
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.database import Base


class BudgetStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"
    LOCKED = "locked"


class BudgetVersion(Base):
    __tablename__ = "budget_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(
        SQLEnum(BudgetStatus),
        nullable=False,
        default=BudgetStatus.DRAFT,
        index=True
    )
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
    created_by = Column(String(36), nullable=True)

    # Relationships
    product = relationship("Product", back_populates="budget_versions")
    budget_lines = relationship(
        "BudgetLine",
        back_populates="version",
        cascade="all, delete-orphan",
        order_by="BudgetLine.display_order"
    )

    @property
    def total_budget(self) -> Decimal:
        return sum(line.allocated_amount for line in self.budget_lines)

    def __repr__(self):
        return f"<BudgetVersion {self.name} ({self.year})>"


class BudgetLine(Base):
    __tablename__ = "budget_lines"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    version_id = Column(String(36), ForeignKey("budget_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    allocated_amount = Column(Numeric(12, 2), nullable=False, default=0)
    display_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    version = relationship("BudgetVersion", back_populates="budget_lines")

    def __repr__(self):
        return f"<BudgetLine {self.name}: {self.allocated_amount}>"
