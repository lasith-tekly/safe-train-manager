"""
Roadmap Planning Models

Models for multi-year product roadmaps with year-based feature planning.
"""
from sqlalchemy import Column, String, Text, Integer, Enum, DateTime, Numeric, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import text
from datetime import datetime
import uuid

from app.database import Base


class Roadmap(Base):
    """
    Multi-year roadmap for a product.
    
    A roadmap contains features planned across multiple years with budget allocations.
    Only one active roadmap is allowed per product.
    Budget comparison uses latest active budget version per year.
    """
    __tablename__ = "roadmaps"
    
    # Primary Key
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign Keys
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    
    # Roadmap Details
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(
        Enum("draft", "active", "archived", name="roadmap_status"),
        default="draft",
        nullable=False
    )
    
    # Audit Fields
    created_by = Column(String(36), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    product = relationship("Product", back_populates="roadmaps")
    features = relationship(
        "RoadmapFeature",
        back_populates="roadmap",
        cascade="all, delete-orphan",
        order_by="RoadmapFeature.priority"
    )
    
    # Indexes and Constraints
    __table_args__ = (
        # Index for filtering by product
        Index("idx_roadmap_product", "product_id"),
        # Index for filtering by status
        Index("idx_roadmap_status", "status"),
        # Note: One active roadmap per product constraint is enforced at application level
    )
    
    def __repr__(self):
        return f"<Roadmap(id={self.id}, name={self.name}, status={self.status})>"


class RoadmapFeature(Base):
    """
    Feature planned in a roadmap with year-based budget allocation.
    
    Each feature is linked to a budget line and optionally a budget category.
    Year-based allocations are stored in FeatureYearAllocation table.
    """
    __tablename__ = "roadmap_features"
    
    # Primary Key
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign Keys
    roadmap_id = Column(String(36), ForeignKey("roadmaps.id"), nullable=False)
    budget_line_id = Column(String(36), ForeignKey("budget_lines.id"), nullable=False)
    budget_category_id = Column(String(36), ForeignKey("budget_categories.id"), nullable=True)
    
    # Feature Details
    name = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Integer, default=0, nullable=False)
    status = Column(
        Enum("planned", "in_progress", "completed", "cancelled", name="feature_status"),
        default="planned",
        nullable=False
    )
    
    # Totals (Calculated from year allocations)
    total_budget_keur = Column(Numeric(12, 2), default=0, nullable=False)
    total_effort_days = Column(Numeric(10, 2), default=0, nullable=False)
    
    # Audit Fields
    created_by = Column(String(36), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    roadmap = relationship("Roadmap", back_populates="features")
    budget_line = relationship("BudgetLine")
    budget_category = relationship("BudgetCategory")
    year_allocations = relationship(
        "FeatureYearAllocation",
        back_populates="feature",
        cascade="all, delete-orphan",
        order_by="FeatureYearAllocation.year"
    )
    
    # Indexes
    __table_args__ = (
        # Index for filtering features by roadmap
        Index("idx_feature_roadmap", "roadmap_id"),
        # Index for filtering by budget line
        Index("idx_feature_budget_line", "budget_line_id"),
        # Index for filtering by category
        Index("idx_feature_budget_category", "budget_category_id"),
        # Index for ordering by priority within roadmap
        Index("idx_feature_priority", "roadmap_id", "priority"),
        # Index for filtering by status
        Index("idx_feature_status", "status"),
    )
    
    def __repr__(self):
        return f"<RoadmapFeature(id={self.id}, name={self.name}, total_budget={self.total_budget_keur})>"


class FeatureYearAllocation(Base):
    """
    Year-based budget allocation for a roadmap feature.
    
    Each feature can have allocations across multiple years (2026, 2027, 2028...).
    Budget and effort days are stored per year.
    Can optionally be broken down into quarterly (PI) allocations.
    """
    __tablename__ = "feature_year_allocations"
    
    # Primary Key
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign Keys
    feature_id = Column(String(36), ForeignKey("roadmap_features.id"), nullable=False)
    
    # Year Allocation
    year = Column(Integer, nullable=False)  # e.g., 2026, 2027
    budget_keur = Column(Numeric(12, 2), default=0, nullable=False)
    effort_days = Column(Numeric(10, 2), default=0, nullable=False)
    
    # Audit Fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    feature = relationship("RoadmapFeature", back_populates="year_allocations")
    pi_allocations = relationship(
        "FeaturePIAllocation",
        back_populates="year_allocation",
        cascade="all, delete-orphan",
        order_by="FeaturePIAllocation.quarter"
    )
    
    # Constraints
    __table_args__ = (
        # One allocation per feature per year
        UniqueConstraint("feature_id", "year", name="uq_feature_year"),
        # Index for filtering by feature
        Index("idx_allocation_feature", "feature_id"),
        # Index for filtering by year
        Index("idx_allocation_year", "year"),
    )
    
    def __repr__(self):
        return f"<FeatureYearAllocation(feature_id={self.feature_id}, year={self.year}, budget={self.budget_keur})>"


class FeaturePIAllocation(Base):
    """
    PI-level (quarterly) budget allocation for a feature year allocation.
    
    Breaks down year-level budget into quarters (Q1, Q2, Q3, Q4).
    Sum of PI allocations must equal year allocation budget.
    PI allocations are optional - features can remain at year-level only.
    """
    __tablename__ = "feature_pi_allocations"
    
    # Primary Key
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign Keys
    feature_year_allocation_id = Column(
        String(36), 
        ForeignKey("feature_year_allocations.id", ondelete="CASCADE"), 
        nullable=False
    )
    
    # PI Allocation
    quarter = Column(Integer, nullable=False)  # 1, 2, 3, or 4
    budget_keur = Column(Numeric(12, 2), default=0, nullable=False)
    
    # Audit Fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    year_allocation = relationship("FeatureYearAllocation", back_populates="pi_allocations")
    
    # Constraints
    __table_args__ = (
        # One allocation per year allocation per quarter
        UniqueConstraint("feature_year_allocation_id", "quarter", name="uq_year_allocation_quarter"),
        # Index for filtering by year allocation
        Index("idx_pi_allocation_year", "feature_year_allocation_id"),
        # Check constraint: quarter must be 1-4
        # Check constraint: budget must be non-negative
        # Note: SQLite doesn't enforce CHECK constraints by default, validation done in application
    )
    
    def __repr__(self):
        return f"<FeaturePIAllocation(year_allocation_id={self.feature_year_allocation_id}, quarter={self.quarter}, budget={self.budget_keur})>"
