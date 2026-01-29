"""
Feature Budget Line Allocation Model

Supports multiple budget line allocations per feature with percentage splits.
Example: A feature can be 50% Product Evolution, 50% Maintenance
"""
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func
from app.database import Base
import uuid


class FeatureBudgetLineAllocation(Base):
    """
    Junction table for feature-to-budget-line allocations with percentages
    
    Allows a single feature to be allocated across multiple budget lines.
    Example: Feature X = 50% from Product Evolution + 50% from Maintenance
    """
    __tablename__ = "feature_budget_line_allocations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign Keys
    feature_id = Column(String(36), ForeignKey("roadmap_features.id", ondelete="CASCADE"), nullable=False)
    budget_line_id = Column(String(36), ForeignKey("budget_lines.id", ondelete="RESTRICT"), nullable=False)
    
    # Allocation details
    allocation_percentage = Column(Numeric(5, 2), nullable=False)  # e.g., 50.00 for 50%
    allocated_effort_days = Column(Numeric(10, 2), nullable=True)  # Calculated: feature.gross_sizing_ed * (percentage/100)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    feature: Mapped["RoadmapFeature"] = relationship("RoadmapFeature", back_populates="budget_allocations")
    budget_line = relationship("BudgetLine")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('allocation_percentage > 0 AND allocation_percentage <= 100', name='valid_percentage'),
        UniqueConstraint('feature_id', 'budget_line_id', name='unique_feature_budget_line'),
    )
