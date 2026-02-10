"""
Roadmap V4 Models - Effort-Centric Design

Models for the new roadmap planning system focused on effort days (eD)
rather than budget allocations.
"""
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, Boolean, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func
from app.database import Base
import uuid
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.feature_budget_allocation import FeatureBudgetLineAllocation


class RoadmapFeature(Base):
    """
    Roadmap Feature - Effort-centric feature planning
    
    Key Concept: Features are sized in Gross eD, system calculates Net eD and Cost
    Now supports multiple budget line allocations with percentage splits
    """
    __tablename__ = "roadmap_features"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Relationships to existing tables
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    version_id = Column(String(36), ForeignKey("roadmap_versions.id", ondelete="CASCADE"), nullable=True)
    # budget_line_id and category_id removed - now using budget_allocations relationship
    
    # Feature details
    name = Column(String(500), nullable=False)
    customer = Column(String(255), nullable=True)
    priority = Column(Integer, default=0)
    status = Column(String(50), default="planned")  # planned, in_progress, completed, cancelled
    remarks = Column(Text, nullable=True)
    
    # Sizing (Effort Days) - Core of V4 design
    gross_sizing_ed = Column(Float, nullable=False)  # User input
    net_sizing_ed = Column(Float, nullable=False)    # Calculated: gross / structural_cost_ratio
    total_cost_keur = Column(Float, nullable=False)  # Calculated: (gross / 220) * 78
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_by = Column(String(255), nullable=True)
    
    # Relationships
    product = relationship("Product", backref="roadmap_features")
    roadmap_version = relationship("RoadmapVersion", back_populates="features")
    teams = relationship("Team", secondary="feature_teams", backref="assigned_features")
    quarterly_allocations = relationship("FeatureQuarterlyAllocation", back_populates="feature", cascade="all, delete-orphan")
    jira_records = relationship("JiraRecord", back_populates="feature", cascade="all, delete-orphan")
    budget_allocations: Mapped[list["FeatureBudgetLineAllocation"]] = relationship(
        "FeatureBudgetLineAllocation", 
        back_populates="feature", 
        cascade="all, delete-orphan"
    )


class FeatureTeam(Base):
    """
    Feature-Team Association (Many-to-Many)
    
    High-level team assignment to features
    """
    __tablename__ = "feature_teams"
    __table_args__ = (
        UniqueConstraint('feature_id', 'team_id', name='uq_feature_team'),
    )
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    feature_id = Column(String(36), ForeignKey("roadmap_features.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(String(36), ForeignKey("teams.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class FeatureQuarterlyAllocation(Base):
    """
    Feature Quarterly Allocation
    
    Quarterly breakdown of Net effort days for a feature
    """
    __tablename__ = "feature_quarterly_allocations"
    __table_args__ = (
        UniqueConstraint('feature_id', 'year', 'quarter', name='uq_feature_year_quarter'),
        CheckConstraint('quarter >= 1 AND quarter <= 4', name='ck_quarter_range'),
    )
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    feature_id = Column(String(36), ForeignKey("roadmap_features.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    quarter = Column(Integer, nullable=False)  # 1-4
    allocated_ed = Column(Float, nullable=False)  # Net effort days
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    feature = relationship("RoadmapFeature", back_populates="quarterly_allocations")


class JiraRecord(Base):
    """
    JIRA Record - PI-Level Execution Planning
    
    Links strategic roadmap features to team execution at PI granularity.
    Supports spillover tracking and capacity validation.
    """
    __tablename__ = "jira_records"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # JIRA Integration
    jira_key = Column(String(50), nullable=True, unique=True)  # e.g., "PROJ-123"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Relationships
    feature_id = Column(String(36), ForeignKey("roadmap_features.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    pi_id = Column(String(36), ForeignKey("pis.id", ondelete="SET NULL"), nullable=True)
    
    # Effort Tracking
    planned_effort = Column(Float, nullable=False, default=0)  # in eD (effort days)
    actual_effort = Column(Float, nullable=True)  # filled after completion
    
    # Status & Spillover (Phase 3.2: Separated workflow status from spillover state)
    status = Column(String(20), nullable=False, default="PLANNED")  # Legacy - kept for backward compatibility
    workflow_status = Column(String(50), nullable=True, default="PLANNED")  # PLANNED, IMPLEMENTING, INTERNAL_TESTING, LOAD_TO_UAT, CUSTOMER_TESTING, LOAD_TO_PRD, COMPLETED
    is_spillover = Column(Boolean, default=False)  # True if record has been marked as spillover
    spillover_from_pi_id = Column(String(36), ForeignKey("pis.id", ondelete="SET NULL"), nullable=True)
    spillover_reason = Column(String(500), nullable=True)  # Detailed reason for spillover
    spillover_category = Column(String(50), nullable=True)  # technical_debt, dependencies, scope_creep, resource_constraints, external_factors, other
    spillover_category_other = Column(String(500), nullable=True)  # Custom reason when category is "other"
    
    # Partial Spillover & Cascading History (Phase 3.1)
    spillover_effort = Column(Float, nullable=True)  # Effort amount spilling over (may be < planned_effort)
    completed_effort = Column(Float, default=0)  # Effort completed before spillover
    spillover_count = Column(Integer, default=0)  # Number of times this record has spilled
    original_pi_id = Column(String(36), ForeignKey("pis.id", ondelete="SET NULL"), nullable=True)  # First PI where work was planned
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    feature = relationship("RoadmapFeature", back_populates="jira_records")
    team = relationship("Team", back_populates="jira_records")
    pi = relationship("PI", foreign_keys=[pi_id], back_populates="jira_records")
    spillover_from_pi = relationship("PI", foreign_keys=[spillover_from_pi_id])
    original_pi = relationship("PI", foreign_keys=[original_pi_id])
    quarterly_allocations = relationship("JiraQuarterlyAllocation", back_populates="jira_record", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        CheckConstraint("status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SPILLOVER')", name="ck_jira_status"),
        CheckConstraint("planned_effort >= 0", name="ck_planned_effort_positive"),
    )


class JiraQuarterlyAllocation(Base):
    """
    JIRA Quarterly Allocation
    
    Quarterly effort allocation for a specific JIRA issue
    """
    __tablename__ = "jira_quarterly_allocations"
    __table_args__ = (
        UniqueConstraint('jira_record_id', 'year', 'quarter', name='uq_jira_year_quarter'),
        CheckConstraint('quarter >= 1 AND quarter <= 4', name='ck_jira_quarter_range'),
    )
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    jira_record_id = Column(String(36), ForeignKey("jira_records.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    quarter = Column(Integer, nullable=False)  # 1-4
    allocated_ed = Column(Float, nullable=False)  # Effort days
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    jira_record = relationship("JiraRecord", back_populates="quarterly_allocations")
