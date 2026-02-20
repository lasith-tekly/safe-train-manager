import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, Numeric, ForeignKey, UniqueConstraint, Table, Boolean, Float
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.database import Base


class TeamStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class MemberRole(str, enum.Enum):
    DEVELOPER = "developer"
    PD = "pd"  # Product Designer / Business Analyst
    QA = "qa"


# Many-to-Many association table for Team <-> Product
team_products = Table(
    'team_products',
    Base.metadata,
    Column('team_id', String(36), ForeignKey('teams.id', ondelete='CASCADE'), primary_key=True),
    Column('product_id', String(36), ForeignKey('products.id', ondelete='CASCADE'), primary_key=True)
)


class Team(Base):
    __tablename__ = "teams"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True, index=True)
    short_code = Column(String(10), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    velocity_factor = Column(Numeric(4, 2), nullable=False, default=1.0)
    site_id = Column(String(36), ForeignKey("sites.id"), nullable=True, index=True)
    status = Column(
        SQLEnum(TeamStatus),
        nullable=False,
        default=TeamStatus.ACTIVE,
        index=True
    )
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    site = relationship("Site", back_populates="teams")
    capacities = relationship(
        "TeamCapacity",
        back_populates="team",
        cascade="all, delete-orphan"
    )
    members = relationship(
        "TeamMember",
        back_populates="team",
        cascade="all, delete-orphan"
    )
    products = relationship(
        "Product",
        secondary=team_products,
        backref="teams"
    )
    jira_records = relationship("JiraRecord", back_populates="team")
    plan_versions = relationship("POPlanVersion", back_populates="team")
    planning_items = relationship("TeamPlanning", back_populates="team")

    def __repr__(self):
        return f"<Team {self.short_code}: {self.name}>"


class TeamCapacity(Base):
    __tablename__ = "team_capacities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    q1_capacity = Column(Integer, nullable=False, default=0)
    q2_capacity = Column(Integer, nullable=False, default=0)
    q3_capacity = Column(Integer, nullable=False, default=0)
    q4_capacity = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    team = relationship("Team", back_populates="capacities")

    __table_args__ = (
        UniqueConstraint('team_id', 'year', name='uq_team_capacity_year'),
    )

    def __repr__(self):
        return f"<TeamCapacity {self.team_id} {self.year}>"


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    site_id = Column(String(36), ForeignKey("sites.id"), nullable=True, index=True)  # Member's site (can differ from team)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True)
    role = Column(
        SQLEnum(MemberRole),
        nullable=False,
        default=MemberRole.DEVELOPER
    )
    is_scrum_master = Column(Boolean, nullable=False, default=False)
    is_product_owner = Column(Boolean, nullable=False, default=False)
    transversal_role = Column(String(50), nullable=True)  # e.g., QA Manager, Dev Manager, Tech Lead
    specialization = Column(String(50), nullable=True)  # Android, iOS, Backend, Frontend, etc.
    train_allocation_percent = Column(Integer, nullable=False, default=100)  # Commitment to this train
    allocation_percentage = Column(Integer, nullable=False, default=100)  # Legacy - kept for compatibility
    hours_per_day = Column(Numeric(4, 2), nullable=False, default=8.0)
    individual_productivity = Column(Integer, nullable=True)  # NULL = use global setting
    start_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    status = Column(
        SQLEnum(TeamStatus),
        nullable=False,
        default=TeamStatus.ACTIVE,
        index=True
    )
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
    
    # PI-scoped membership fields
    # NULL = active in all PIs (backwards compatible)
    effective_from_pi_id = Column(String(36), nullable=True)
    left_after_pi_id = Column(String(36), nullable=True)

    # Relationships
    team = relationship("Team", back_populates="members")
    site = relationship("Site")
    availability = relationship(
        "MemberQuarterlyAvailability",
        back_populates="member",
        cascade="all, delete-orphan"
    )
    component_hats = relationship(
        "ComponentHat",
        secondary="team_member_component_hats",
        back_populates="members"
    )
    # Note: leaves relationship is defined via backref in MemberLeave (holiday.py)

    def __repr__(self):
        return f"<TeamMember {self.name} ({self.team_id})>"


class MemberQuarterlyAvailability(Base):
    __tablename__ = "member_quarterly_availability"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id = Column(String(36), ForeignKey("team_members.id", ondelete="CASCADE"), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    quarter = Column(Integer, nullable=False)  # 1-4
    working_days = Column(Integer, nullable=False, default=0)
    holidays = Column(Integer, nullable=False, default=0)
    leaves = Column(Integer, nullable=False, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    member = relationship("TeamMember", back_populates="availability")

    __table_args__ = (
        UniqueConstraint('member_id', 'year', 'quarter', name='uq_member_availability'),
    )

    def __repr__(self):
        return f"<Availability {self.member_id} {self.year}-Q{self.quarter}>"


class MemberPIAllocation(Base):
    """PI-level allocation settings for team members.
    
    Train allocation and productivity can vary from PI to PI,
    so this model stores PI-specific overrides.
    """
    __tablename__ = "member_pi_allocations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id = Column(String(36), ForeignKey("team_members.id", ondelete="CASCADE"), nullable=False, index=True)
    pi_id = Column(String(36), ForeignKey("pis.id", ondelete="CASCADE"), nullable=False, index=True)
    train_allocation_percent = Column(Integer, nullable=False, default=100)  # Commitment to this train for this PI
    productivity_percent = Column(Integer, nullable=True)  # DEPRECATED: No longer used in calculations (kept for backward compatibility)
    
    # NEW: Agile Role Allocation - percentage of time spent on THIS train's agile work (0-100)
    # Default 0 forces users to explicitly set allocation
    agile_role_allocation_percent = Column(Integer, nullable=False, default=0)
    
    # PI-specific role flags
    is_scrum_master = Column(Boolean, nullable=False, default=False)
    is_product_owner = Column(Boolean, nullable=False, default=False)
    is_other_role = Column(Boolean, nullable=False, default=False)  # NEW: Indicates work on other train
    transversal_role = Column(String(50), nullable=True)  # e.g., QA Manager, Dev Manager
    specializations = Column(Text, nullable=True)  # JSON array of specialization tags
    
    # IP week deduction - additional days deducted from IP week capacity (e.g., for PO/SM PI planning activities)
    ip_week_deduction = Column(Float, nullable=False, default=0)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    member = relationship("TeamMember", backref="pi_allocations")
    pi = relationship("PI")

    __table_args__ = (
        UniqueConstraint('member_id', 'pi_id', name='uq_member_pi_allocation'),
    )

    def __repr__(self):
        return f"<MemberPIAllocation {self.member_id} - PI:{self.pi_id}>"


# Many-to-Many association table for TeamMember <-> ComponentHat
team_member_component_hats = Table(
    'team_member_component_hats',
    Base.metadata,
    Column('member_id', String(36), ForeignKey('team_members.id', ondelete='CASCADE'), primary_key=True),
    Column('component_hat_id', String(36), ForeignKey('component_hats.id', ondelete='CASCADE'), primary_key=True)
)


class ComponentHat(Base):
    """Component expertise labels that can be assigned to team members"""
    __tablename__ = "component_hats"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), nullable=False, unique=True, index=True)
    color = Column(String(7), nullable=False, default="#1890ff")  # Hex color for UI
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    members = relationship(
        "TeamMember",
        secondary=team_member_component_hats,
        back_populates="component_hats"
    )

    def __repr__(self):
        return f"<ComponentHat {self.name}>"


# Note: MemberLeave is defined in holiday.py to avoid duplication


class SiteHoliday(Base):
    """Site-specific holidays (in addition to country holidays)"""
    __tablename__ = "site_holidays"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    site_id = Column(String(36), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(DateTime, nullable=False)
    name = Column(String(100), nullable=False)
    year = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    site = relationship("Site")

    __table_args__ = (
        UniqueConstraint('site_id', 'date', name='uq_site_holiday_date'),
    )

    def __repr__(self):
        return f"<SiteHoliday {self.site_id} - {self.date}: {self.name}>"
