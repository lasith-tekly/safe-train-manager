"""
Roadmap V4 Models - Effort-Centric Design

Models for the new roadmap planning system focused on effort days (eD)
rather than budget allocations.
"""
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, Boolean, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid


class RoadmapFeature(Base):
    """
    Roadmap Feature - Effort-centric feature planning
    
    Key Concept: Features are sized in Gross eD, system calculates Net eD and Cost
    """
    __tablename__ = "roadmap_features"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Relationships to existing tables
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    budget_line_id = Column(String(36), ForeignKey("budget_lines.id"), nullable=False)
    category_id = Column(String(36), ForeignKey("budget_categories.id"), nullable=True)
    
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
    budget_line = relationship("BudgetLine", backref="roadmap_features")
    category = relationship("BudgetCategory", backref="roadmap_features")
    teams = relationship("Team", secondary="feature_teams", backref="assigned_features")
    quarterly_allocations = relationship("FeatureQuarterlyAllocation", back_populates="feature", cascade="all, delete-orphan")
    jira_records = relationship("JiraRecord", back_populates="feature", cascade="all, delete-orphan")


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
    JIRA Record - Execution-level tracking
    
    Links features to actual JIRA issues with team assignments
    """
    __tablename__ = "jira_records"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    feature_id = Column(String(36), ForeignKey("roadmap_features.id", ondelete="CASCADE"), nullable=False)
    
    # JIRA details
    jira_key = Column(String(50), nullable=False)  # e.g., "AOP-25718"
    summary = Column(String(500), nullable=True)
    
    # Assignment
    team_id = Column(String(36), ForeignKey("teams.id"), nullable=False)
    
    # Status
    status = Column(String(50), default="planned")  # planned, in_progress, done, spillover
    is_spillover = Column(Boolean, default=False)
    spillover_from_quarter = Column(Integer, nullable=True)
    spillover_from_year = Column(Integer, nullable=True)
    
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    feature = relationship("RoadmapFeature", back_populates="jira_records")
    team = relationship("Team", backref="jira_records")
    quarterly_allocations = relationship("JiraQuarterlyAllocation", back_populates="jira_record", cascade="all, delete-orphan")


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
