# Backend Architecture - Teams Management v2.0

**Document Version:** 2.0  
**Created:** 2026-01-15  
**Author:** Backend Architect Agent  
**Status:** Draft  

---

## 1. Overview

This document defines the backend architecture for the enhanced Teams Management module with member-level capacity tracking, productivity percentages, and holiday/leave management.

---

## 2. Database Schema

### 2.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐
│  GlobalSettings │       │     Product      │
│─────────────────│       │──────────────────│
│ id              │       │ id               │
│ year (unique)   │       │ name             │
│ productivity_%  │       │ short_code       │
│ default_hours   │       └────────┬─────────┘
│ created_by      │                │
└─────────────────┘                │ M:M
                                   │
┌─────────────────┐       ┌────────┴─────────┐
│      Team       │───────│   TeamProduct    │
│─────────────────│       │──────────────────│
│ id              │       │ team_id (FK)     │
│ name            │       │ product_id (FK)  │
│ short_code      │       └──────────────────┘
│ description     │
│ velocity_factor │
│ status          │
└────────┬────────┘
         │ 1:M
         │
┌────────┴────────┐
│   TeamMember    │
│─────────────────│
│ id              │
│ team_id (FK)    │
│ name            │
│ email           │
│ role            │
│ allocation_%    │
│ hours_per_day   │
│ individual_prod │
│ start_date      │
│ end_date        │
│ status          │
└────────┬────────┘
         │ 1:M
         │
┌────────┴─────────────────┐
│ MemberQuarterlyAvailability │
│──────────────────────────│
│ id                       │
│ member_id (FK)           │
│ year                     │
│ quarter                  │
│ working_days             │
│ holidays                 │
│ leaves                   │
│ notes                    │
└──────────────────────────┘
```

---

## 3. SQLAlchemy Models

### 3.1 GlobalSettings Model

```python
# app/models/global_settings.py

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Numeric, DateTime
from sqlalchemy.orm import relationship

from app.database import Base


class GlobalSettings(Base):
    __tablename__ = "global_settings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    year = Column(Integer, nullable=False, unique=True, index=True)
    global_productivity_percentage = Column(Integer, nullable=False, default=70)
    default_hours_per_day = Column(Numeric(4, 2), nullable=False, default=8.0)
    created_by = Column(String(36), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<GlobalSettings {self.year}: {self.global_productivity_percentage}%>"
```

### 3.2 Updated Team Model

```python
# app/models/team.py (updated)

import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, Numeric, ForeignKey, Table
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.database import Base


class TeamStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class MemberRole(str, enum.Enum):
    DEVELOPER = "developer"
    QA = "qa"
    DESIGNER = "designer"
    SCRUM_MASTER = "scrum_master"
    PRODUCT_OWNER = "product_owner"
    OTHER = "other"


# Many-to-Many association table
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
    status = Column(
        SQLEnum(TeamStatus),
        nullable=False,
        default=TeamStatus.ACTIVE,
        index=True
    )
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
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
    capacities = relationship(
        "TeamCapacity",
        back_populates="team",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Team {self.short_code}: {self.name}>"


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True)
    role = Column(
        SQLEnum(MemberRole),
        nullable=False,
        default=MemberRole.DEVELOPER
    )
    allocation_percentage = Column(Integer, nullable=False, default=100)
    hours_per_day = Column(Numeric(4, 2), nullable=False, default=8.0)
    individual_productivity = Column(Integer, nullable=True)  # NULL = use global
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

    # Relationships
    team = relationship("Team", back_populates="members")
    availability = relationship(
        "MemberQuarterlyAvailability",
        back_populates="member",
        cascade="all, delete-orphan"
    )

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
        # Unique constraint: one record per member per quarter per year
        {'sqlite_autoincrement': True},
    )

    def __repr__(self):
        return f"<Availability {self.member_id} {self.year}-Q{self.quarter}>"
```

---

## 4. Pydantic Schemas

### 4.1 Global Settings Schemas

```python
# app/schemas/global_settings.py

from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class GlobalSettingsBase(BaseModel):
    year: int = Field(..., ge=2020, le=2100)
    global_productivity_percentage: int = Field(70, ge=0, le=100)
    default_hours_per_day: Decimal = Field(Decimal("8.0"), ge=0, le=24)


class GlobalSettingsCreate(GlobalSettingsBase):
    pass


class GlobalSettingsUpdate(BaseModel):
    global_productivity_percentage: Optional[int] = Field(None, ge=0, le=100)
    default_hours_per_day: Optional[Decimal] = Field(None, ge=0, le=24)


class GlobalSettingsResponse(GlobalSettingsBase):
    id: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
```

### 4.2 Team Member Schemas

```python
# app/schemas/team_member.py

from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


class MemberAvailabilityBase(BaseModel):
    year: int = Field(..., ge=2020, le=2100)
    quarter: int = Field(..., ge=1, le=4)
    working_days: int = Field(0, ge=0, le=100)
    holidays: int = Field(0, ge=0, le=50)
    leaves: int = Field(0, ge=0, le=50)
    notes: Optional[str] = None


class MemberAvailabilityCreate(MemberAvailabilityBase):
    pass


class MemberAvailabilityUpdate(BaseModel):
    working_days: Optional[int] = Field(None, ge=0, le=100)
    holidays: Optional[int] = Field(None, ge=0, le=50)
    leaves: Optional[int] = Field(None, ge=0, le=50)
    notes: Optional[str] = None


class MemberAvailabilityResponse(MemberAvailabilityBase):
    id: str
    member_id: str
    available_days: int  # Calculated: working_days - holidays - leaves
    created_at: datetime

    class Config:
        from_attributes = True


class TeamMemberBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=100)
    role: str = Field("developer")
    allocation_percentage: int = Field(100, ge=0, le=100)
    hours_per_day: Decimal = Field(Decimal("8.0"), ge=0, le=24)
    individual_productivity: Optional[int] = Field(None, ge=0, le=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str) -> str:
        valid = ['developer', 'qa', 'designer', 'scrum_master', 'product_owner', 'other']
        if v not in valid:
            raise ValueError(f'Role must be one of: {", ".join(valid)}')
        return v


class TeamMemberCreate(TeamMemberBase):
    pass


class TeamMemberUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=100)
    role: Optional[str] = None
    allocation_percentage: Optional[int] = Field(None, ge=0, le=100)
    hours_per_day: Optional[Decimal] = Field(None, ge=0, le=24)
    individual_productivity: Optional[int] = Field(None, ge=0, le=100)
    end_date: Optional[date] = None
    status: Optional[str] = None


class TeamMemberResponse(TeamMemberBase):
    id: str
    team_id: str
    status: str
    effective_productivity: int  # Individual or global
    created_at: datetime
    updated_at: Optional[datetime] = None
    availability: List[MemberAvailabilityResponse] = []

    class Config:
        from_attributes = True


class MemberCapacityResponse(BaseModel):
    """Calculated capacity for a member"""
    member_id: str
    member_name: str
    year: int
    quarter: int
    working_days: int
    holidays: int
    leaves: int
    available_days: int
    allocation_percentage: int
    productivity_percentage: int
    effective_days: float  # Final calculated capacity
```

### 4.3 Updated Team Schemas

```python
# app/schemas/team.py (updated)

from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


class ProductSummary(BaseModel):
    id: str
    name: str
    short_code: str

    class Config:
        from_attributes = True


class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    short_code: str = Field(..., min_length=2, max_length=10)
    description: Optional[str] = Field(None, max_length=500)
    velocity_factor: Decimal = Field(Decimal("1.0"), ge=0)
    status: str = Field("active")

    @field_validator('short_code')
    @classmethod
    def validate_short_code(cls, v: str) -> str:
        if not v.isalnum():
            raise ValueError('Short code must be alphanumeric')
        return v.upper()

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ['active', 'inactive']:
            raise ValueError('Status must be active or inactive')
        return v


class TeamCreate(TeamBase):
    product_ids: List[str] = []  # Associated products


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    velocity_factor: Optional[Decimal] = Field(None, ge=0)
    status: Optional[str] = None
    product_ids: Optional[List[str]] = None


class QuarterCapacity(BaseModel):
    quarter: int
    total_capacity_days: float
    total_capacity_points: float
    allocated: float = 0
    available: float = 0
    utilization_percentage: float = 0


class TeamCapacitySummary(BaseModel):
    year: int
    quarters: List[QuarterCapacity]
    total_members: int
    active_members: int


class TeamResponse(TeamBase):
    id: str
    products: List[ProductSummary] = []
    member_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TeamDetailResponse(TeamResponse):
    members: List['TeamMemberResponse'] = []
    capacity: Optional[TeamCapacitySummary] = None


class TeamListResponse(BaseModel):
    data: List[TeamResponse]
    total: int
```

---

## 5. Service Layer

### 5.1 Global Settings Service

```python
# app/services/global_settings_service.py

from typing import Optional
from sqlalchemy.orm import Session

from app.models.global_settings import GlobalSettings
from app.schemas.global_settings import GlobalSettingsCreate, GlobalSettingsUpdate


class GlobalSettingsService:
    
    @staticmethod
    def get_by_year(db: Session, year: int) -> Optional[GlobalSettings]:
        return db.query(GlobalSettings).filter(GlobalSettings.year == year).first()
    
    @staticmethod
    def get_or_create(db: Session, year: int) -> GlobalSettings:
        settings = GlobalSettingsService.get_by_year(db, year)
        if not settings:
            settings = GlobalSettings(year=year)
            db.add(settings)
            db.commit()
            db.refresh(settings)
        return settings
    
    @staticmethod
    def update(db: Session, year: int, data: GlobalSettingsUpdate) -> GlobalSettings:
        settings = GlobalSettingsService.get_or_create(db, year)
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(settings, field, value)
        db.commit()
        db.refresh(settings)
        return settings
```

### 5.2 Team Capacity Calculator Service

```python
# app/services/capacity_calculator.py

from typing import List, Dict
from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.team import Team, TeamMember, MemberQuarterlyAvailability
from app.services.global_settings_service import GlobalSettingsService


class CapacityCalculator:
    
    # Default working days per quarter (approximate)
    DEFAULT_WORKING_DAYS = {1: 63, 2: 63, 3: 65, 4: 62}
    
    @staticmethod
    def calculate_member_quarterly_capacity(
        db: Session,
        member: TeamMember,
        year: int,
        quarter: int
    ) -> Dict:
        """Calculate effective capacity for a single member for a quarter."""
        
        # Get global settings
        global_settings = GlobalSettingsService.get_or_create(db, year)
        global_productivity = global_settings.global_productivity_percentage
        
        # Get member's availability for this quarter
        availability = db.query(MemberQuarterlyAvailability).filter(
            MemberQuarterlyAvailability.member_id == member.id,
            MemberQuarterlyAvailability.year == year,
            MemberQuarterlyAvailability.quarter == quarter
        ).first()
        
        if availability:
            working_days = availability.working_days
            holidays = availability.holidays
            leaves = availability.leaves
        else:
            # Use defaults
            working_days = CapacityCalculator.DEFAULT_WORKING_DAYS.get(quarter, 63)
            holidays = 0
            leaves = 0
        
        available_days = working_days - holidays - leaves
        
        # Determine productivity percentage
        productivity = member.individual_productivity or global_productivity
        
        # Calculate effective capacity
        effective_days = (
            available_days 
            * (member.allocation_percentage / 100) 
            * (productivity / 100)
        )
        
        return {
            'member_id': member.id,
            'member_name': member.name,
            'year': year,
            'quarter': quarter,
            'working_days': working_days,
            'holidays': holidays,
            'leaves': leaves,
            'available_days': available_days,
            'allocation_percentage': member.allocation_percentage,
            'productivity_percentage': productivity,
            'effective_days': round(effective_days, 2)
        }
    
    @staticmethod
    def calculate_team_quarterly_capacity(
        db: Session,
        team: Team,
        year: int,
        quarter: int
    ) -> Dict:
        """Calculate total team capacity for a quarter."""
        
        total_effective_days = 0
        member_capacities = []
        
        active_members = [m for m in team.members if m.status.value == 'active']
        
        for member in active_members:
            member_cap = CapacityCalculator.calculate_member_quarterly_capacity(
                db, member, year, quarter
            )
            member_capacities.append(member_cap)
            total_effective_days += member_cap['effective_days']
        
        # Convert to story points using velocity factor
        velocity_factor = float(team.velocity_factor) if team.velocity_factor else 1.0
        total_story_points = total_effective_days * velocity_factor
        
        return {
            'quarter': quarter,
            'total_capacity_days': round(total_effective_days, 2),
            'total_capacity_points': round(total_story_points, 2),
            'member_count': len(active_members),
            'member_capacities': member_capacities
        }
    
    @staticmethod
    def calculate_team_yearly_capacity(
        db: Session,
        team: Team,
        year: int
    ) -> Dict:
        """Calculate team capacity for all quarters in a year."""
        
        quarters = []
        for q in range(1, 5):
            quarter_cap = CapacityCalculator.calculate_team_quarterly_capacity(
                db, team, year, q
            )
            quarters.append(quarter_cap)
        
        return {
            'year': year,
            'quarters': quarters,
            'total_members': len(team.members),
            'active_members': len([m for m in team.members if m.status.value == 'active'])
        }
```

---

## 6. API Routes

### 6.1 Global Settings Routes

```python
# app/routes/global_settings.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.global_settings import GlobalSettingsResponse, GlobalSettingsUpdate
from app.services.global_settings_service import GlobalSettingsService

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/global/{year}", response_model=GlobalSettingsResponse)
def get_global_settings(year: int, db: Session = Depends(get_db)):
    """Get global settings for a year."""
    settings = GlobalSettingsService.get_or_create(db, year)
    return settings


@router.put("/global/{year}", response_model=GlobalSettingsResponse)
def update_global_settings(
    year: int,
    data: GlobalSettingsUpdate,
    db: Session = Depends(get_db)
):
    """Update global settings for a year (RTE only)."""
    return GlobalSettingsService.update(db, year, data)
```

### 6.2 Team Member Routes

```python
# app/routes/team_members.py

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.team_member import (
    TeamMemberCreate, TeamMemberUpdate, TeamMemberResponse,
    MemberAvailabilityCreate, MemberAvailabilityUpdate, MemberAvailabilityResponse,
    MemberCapacityResponse
)
from app.services.team_member_service import TeamMemberService
from app.services.capacity_calculator import CapacityCalculator

router = APIRouter(prefix="/api/teams/{team_id}/members", tags=["team-members"])


@router.get("", response_model=list[TeamMemberResponse])
def list_team_members(
    team_id: str,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all members of a team."""
    return TeamMemberService.get_by_team(db, team_id, status)


@router.post("", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
def add_team_member(
    team_id: str,
    data: TeamMemberCreate,
    db: Session = Depends(get_db)
):
    """Add a member to a team."""
    return TeamMemberService.create(db, team_id, data)


@router.get("/{member_id}", response_model=TeamMemberResponse)
def get_team_member(
    team_id: str,
    member_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific team member."""
    member = TeamMemberService.get_by_id(db, member_id)
    if not member or member.team_id != team_id:
        raise HTTPException(status_code=404, detail="Member not found")
    return member


@router.put("/{member_id}", response_model=TeamMemberResponse)
def update_team_member(
    team_id: str,
    member_id: str,
    data: TeamMemberUpdate,
    db: Session = Depends(get_db)
):
    """Update a team member."""
    return TeamMemberService.update(db, member_id, data)


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    team_id: str,
    member_id: str,
    db: Session = Depends(get_db)
):
    """Remove a member from a team."""
    TeamMemberService.delete(db, member_id)


@router.get("/{member_id}/availability/{year}", response_model=list[MemberAvailabilityResponse])
def get_member_availability(
    team_id: str,
    member_id: str,
    year: int,
    db: Session = Depends(get_db)
):
    """Get member's quarterly availability for a year."""
    return TeamMemberService.get_availability(db, member_id, year)


@router.put("/{member_id}/availability/{year}/{quarter}", response_model=MemberAvailabilityResponse)
def update_member_availability(
    team_id: str,
    member_id: str,
    year: int,
    quarter: int,
    data: MemberAvailabilityUpdate,
    db: Session = Depends(get_db)
):
    """Update member's availability for a specific quarter."""
    return TeamMemberService.update_availability(db, member_id, year, quarter, data)


@router.get("/{member_id}/capacity/{year}/{quarter}", response_model=MemberCapacityResponse)
def get_member_capacity(
    team_id: str,
    member_id: str,
    year: int,
    quarter: int,
    db: Session = Depends(get_db)
):
    """Get calculated capacity for a member."""
    member = TeamMemberService.get_by_id(db, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return CapacityCalculator.calculate_member_quarterly_capacity(db, member, year, quarter)
```

---

## 7. Migration Strategy

### 7.1 New Tables to Create
1. `global_settings`
2. `team_members`
3. `member_quarterly_availability`
4. `team_products` (association table)

### 7.2 Existing Table Updates
- `teams`: Add `velocity_factor` column

### 7.3 Data Migration
- Existing `team_capacities` data can remain for backward compatibility
- New member-level capacity is additive

---

## 8. File Structure

```
backend/app/
├── models/
│   ├── __init__.py (update)
│   ├── global_settings.py (new)
│   └── team.py (update with TeamMember, MemberQuarterlyAvailability)
├── schemas/
│   ├── __init__.py (update)
│   ├── global_settings.py (new)
│   ├── team.py (update)
│   └── team_member.py (new)
├── services/
│   ├── __init__.py (update)
│   ├── global_settings_service.py (new)
│   ├── team_member_service.py (new)
│   ├── capacity_calculator.py (new)
│   └── team_service.py (update)
├── routes/
│   ├── __init__.py (update)
│   ├── global_settings.py (new)
│   ├── team_members.py (new)
│   └── teams.py (update)
└── main.py (update to include new routers)
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0 | 2026-01-15 | Backend Architect | Complete redesign with member-level capacity |
