import uuid
import enum
from datetime import datetime, date
from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean, ForeignKey, Date, CheckConstraint, UniqueConstraint
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.database import Base


class AllocationType(str, enum.Enum):
    PERCENTAGE = "PERCENTAGE"
    ABSOLUTE = "ABSOLUTE"


class EntityType(str, enum.Enum):
    PRODUCT_BUDGET = "PRODUCT_BUDGET"
    BUDGET_LINE = "BUDGET_LINE"
    CATEGORY = "CATEGORY"


class AuditAction(str, enum.Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"


class FiscalYear(Base):
    __tablename__ = "fiscal_years"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    year = Column(Integer, nullable=False, unique=True, index=True)
    start_month = Column(Integer, nullable=False)
    start_day = Column(Integer, nullable=False)
    end_month = Column(Integer, nullable=False)
    end_day = Column(Integer, nullable=False)
    is_current = Column(Boolean, default=False, index=True)
    train_id = Column(String(36), ForeignKey("trains.id", ondelete="SET NULL"),
                      nullable=True, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    budget_versions = relationship(
        "BudgetVersion",
        back_populates="fiscal_year",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint('start_month >= 1 AND start_month <= 12', name='check_start_month'),
        CheckConstraint('end_month >= 1 AND end_month <= 12', name='check_end_month'),
        CheckConstraint('start_day >= 1 AND start_day <= 31', name='check_start_day'),
        CheckConstraint('end_day >= 1 AND end_day <= 31', name='check_end_day'),
    )

    def __repr__(self):
        return f"<FiscalYear {self.year}>"


class BudgetVersion(Base):
    __tablename__ = "budget_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    fiscal_year_id = Column(String(36), ForeignKey("fiscal_years.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    effective_date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_by = Column(String(36), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    fiscal_year = relationship("FiscalYear", back_populates="budget_versions")
    product_budgets = relationship(
        "ProductBudget",
        back_populates="budget_version",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint('fiscal_year_id', 'version_number', name='uq_fiscal_year_version'),
    )

    def __repr__(self):
        return f"<BudgetVersion FY{self.fiscal_year.year if self.fiscal_year else '?'} V{self.version_number}>"


class ProductBudget(Base):
    __tablename__ = "product_budgets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    budget_version_id = Column(String(36), ForeignKey("budget_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False, index=True)
    allocated_amount = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    budget_version = relationship("BudgetVersion", back_populates="product_budgets")
    product = relationship("Product")
    budget_lines = relationship(
        "BudgetLine",
        back_populates="product_budget",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint('budget_version_id', 'product_id', name='uq_version_product'),
        CheckConstraint('allocated_amount >= 0', name='check_allocated_amount_positive'),
    )

    def __repr__(self):
        return f"<ProductBudget {self.product.name if self.product else '?'}: {self.allocated_amount} KEUR>"


class BudgetLine(Base):
    __tablename__ = "budget_lines"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    budget_version_id = Column(String(36), ForeignKey("budget_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=True, index=True)
    product_budget_id = Column(String(36), ForeignKey("product_budgets.id", ondelete="SET NULL"), nullable=True, index=True)
    code = Column(String(10), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    allocated_amount = Column(Integer, nullable=False, default=0)
    is_transversal = Column(Boolean, default=False, index=True)
    is_roadmap_eligible = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
    created_by = Column(String(36), nullable=False)
    updated_by = Column(String(36), nullable=True)

    # Relationships
    budget_version = relationship("BudgetVersion")
    product = relationship("Product")
    product_budget = relationship("ProductBudget", back_populates="budget_lines")
    categories = relationship(
        "BudgetCategory",
        back_populates="budget_line",
        cascade="all, delete-orphan"
    )
    transversal_products = relationship(
        "BudgetLineProduct",
        back_populates="budget_line",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint('allocated_amount >= 0', name='check_budget_line_amount_positive'),
    )

    @property
    def is_train_level(self) -> bool:
        return self.product_budget_id is None

    def __repr__(self):
        return f"<BudgetLine {self.code} - {self.name}: {self.allocated_amount} KEUR>"


class BudgetLineProduct(Base):
    __tablename__ = "budget_line_products"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    budget_line_id = Column(String(36), ForeignKey("budget_lines.id", ondelete="CASCADE"), nullable=False, index=True)
    product_budget_id = Column(String(36), ForeignKey("product_budgets.id", ondelete="CASCADE"), nullable=False, index=True)
    allocation_type = Column(SQLEnum(AllocationType), nullable=False)
    allocation_value = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    budget_line = relationship("BudgetLine", back_populates="transversal_products")
    product_budget = relationship("ProductBudget")

    __table_args__ = (
        UniqueConstraint('budget_line_id', 'product_budget_id', name='uq_budget_line_product'),
        CheckConstraint('allocation_value >= 0', name='check_allocation_value_positive'),
    )

    def __repr__(self):
        return f"<BudgetLineProduct {self.allocation_type}: {self.allocation_value}>"


class BudgetCategory(Base):
    __tablename__ = "budget_categories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    budget_line_id = Column(String(36), ForeignKey("budget_lines.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    allocated_amount = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
    created_by = Column(String(36), nullable=False)
    updated_by = Column(String(36), nullable=True)

    # Relationships
    budget_line = relationship("BudgetLine", back_populates="categories")

    __table_args__ = (
        CheckConstraint('allocated_amount >= 0', name='check_category_amount_positive'),
    )

    def __repr__(self):
        return f"<BudgetCategory {self.name}: {self.allocated_amount} KEUR>"


class BudgetAuditLog(Base):
    __tablename__ = "budget_audit_log"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type = Column(SQLEnum(EntityType), nullable=False, index=True)
    entity_id = Column(String(36), nullable=False, index=True)
    action = Column(SQLEnum(AuditAction), nullable=False)
    field_changed = Column(String(50), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    changed_by = Column(String(36), nullable=False, index=True)
    changed_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f"<BudgetAuditLog {self.entity_type} {self.action} by {self.changed_by}>"
