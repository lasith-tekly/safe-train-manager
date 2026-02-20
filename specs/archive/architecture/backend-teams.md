# Backend Architecture - Teams Module

**Document Version:** 1.0  
**Created:** 2026-01-15  
**Author:** Backend Architect Agent  
**Status:** Draft  

---

## 1. Overview

This document defines the backend architecture for the Teams Management feature, including team entities and quarterly capacity tracking.

---

## 2. Database Schema

### 2.1 Team Model

```python
# app/models/team.py

import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class TeamStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class Team(Base):
    __tablename__ = "teams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True, index=True)
    short_code = Column(String(10), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    status = Column(
        SQLEnum(TeamStatus),
        nullable=False,
        default=TeamStatus.ACTIVE,
        index=True
    )
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    capacities = relationship(
        "TeamCapacity",
        back_populates="team",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Team {self.short_code}: {self.name}>"


class TeamCapacity(Base):
    __tablename__ = "team_capacities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
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
        # Unique constraint on team_id + year
        {'sqlite_autoincrement': True},
    )

    def __repr__(self):
        return f"<TeamCapacity {self.team_id} {self.year}>"
```

---

## 3. Pydantic Schemas

```python
# app/schemas/team.py

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
import re


class QuarterCapacity(BaseModel):
    total: int = 0
    allocated: int = 0
    available: int = 0
    utilization: float = 0.0


class TeamCapacityBase(BaseModel):
    year: int = Field(..., ge=2020, le=2100)
    q1_capacity: int = Field(default=0, ge=0, le=9999)
    q2_capacity: int = Field(default=0, ge=0, le=9999)
    q3_capacity: int = Field(default=0, ge=0, le=9999)
    q4_capacity: int = Field(default=0, ge=0, le=9999)


class TeamCapacityCreate(TeamCapacityBase):
    pass


class TeamCapacityUpdate(BaseModel):
    q1_capacity: Optional[int] = Field(None, ge=0, le=9999)
    q2_capacity: Optional[int] = Field(None, ge=0, le=9999)
    q3_capacity: Optional[int] = Field(None, ge=0, le=9999)
    q4_capacity: Optional[int] = Field(None, ge=0, le=9999)


class TeamCapacityResponse(BaseModel):
    year: int
    q1: QuarterCapacity
    q2: QuarterCapacity
    q3: QuarterCapacity
    q4: QuarterCapacity

    class Config:
        from_attributes = True


class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    short_code: str = Field(..., min_length=2, max_length=10)
    description: Optional[str] = Field(None, max_length=500)
    status: str = Field(default="active")

    @field_validator('short_code')
    @classmethod
    def validate_short_code(cls, v: str) -> str:
        v = v.upper().strip()
        if not re.match(r'^[A-Z0-9]{2,10}$', v):
            raise ValueError('Short code must be 2-10 uppercase alphanumeric characters')
        return v

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r'^[a-zA-Z0-9\s\-]+$', v):
            raise ValueError('Name can only contain letters, numbers, spaces, and hyphens')
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ['active', 'inactive']:
            raise ValueError('Status must be active or inactive')
        return v


class TeamCreate(TeamBase):
    capacity: Optional[TeamCapacityCreate] = None


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    short_code: Optional[str] = Field(None, min_length=2, max_length=10)
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = None

    @field_validator('short_code')
    @classmethod
    def validate_short_code(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.upper().strip()
        if not re.match(r'^[A-Z0-9]{2,10}$', v):
            raise ValueError('Short code must be 2-10 uppercase alphanumeric characters')
        return v

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not re.match(r'^[a-zA-Z0-9\s\-]+$', v):
            raise ValueError('Name can only contain letters, numbers, spaces, and hyphens')
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if v not in ['active', 'inactive']:
            raise ValueError('Status must be active or inactive')
        return v


class TeamResponse(BaseModel):
    id: UUID
    name: str
    short_code: str
    description: Optional[str] = None
    status: str
    member_count: int = 0
    capacity: Optional[TeamCapacityResponse] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TeamListResponse(BaseModel):
    data: List[TeamResponse]
    total: int
```

---

## 4. API Routes

```python
# app/routes/teams.py

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.team import Team, TeamCapacity, TeamStatus
from app.schemas.team import (
    TeamCreate,
    TeamUpdate,
    TeamResponse,
    TeamListResponse,
    TeamCapacityCreate,
    TeamCapacityUpdate,
    TeamCapacityResponse
)
from app.services.team_service import TeamService

router = APIRouter(prefix="/api/teams", tags=["teams"])


@router.get("", response_model=TeamListResponse)
def list_teams(
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by name"),
    year: Optional[int] = Query(None, description="Year for capacity data"),
    db: Session = Depends(get_db)
):
    """List all teams with optional filtering."""
    teams, total = TeamService.get_all(db, status=status, search=search, year=year)
    return TeamListResponse(data=teams, total=total)


@router.get("/{team_id}", response_model=TeamResponse)
def get_team(
    team_id: UUID,
    year: Optional[int] = Query(None, description="Year for capacity data"),
    db: Session = Depends(get_db)
):
    """Get a single team by ID."""
    team = TeamService.get_by_id(db, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    return TeamService.build_team_response(db, team, year)


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    data: TeamCreate,
    db: Session = Depends(get_db)
):
    """Create a new team."""
    # Check for duplicate name
    if TeamService.get_by_name(db, data.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A team with this name already exists"
        )

    # Check for duplicate short_code
    if TeamService.get_by_short_code(db, data.short_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A team with this short code already exists"
        )

    team = TeamService.create(db, data)
    year = data.capacity.year if data.capacity else None
    return TeamService.build_team_response(db, team, year)


@router.put("/{team_id}", response_model=TeamResponse)
def update_team(
    team_id: UUID,
    data: TeamUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing team."""
    team = TeamService.get_by_id(db, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    # Check name uniqueness if changing
    if data.name and data.name.strip().lower() != team.name.lower():
        if TeamService.get_by_name(db, data.name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A team with this name already exists"
            )

    # Check short_code uniqueness if changing
    if data.short_code and data.short_code.upper().strip() != team.short_code:
        if TeamService.get_by_short_code(db, data.short_code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A team with this short code already exists"
            )

    updated = TeamService.update(db, team_id, data)
    return TeamService.build_team_response(db, updated)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a team."""
    team = TeamService.get_by_id(db, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    can_delete, reason = TeamService.can_delete(db, team_id)
    if not can_delete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete: {reason}"
        )

    TeamService.delete(db, team_id)
    return None


@router.get("/{team_id}/capacity/{year}", response_model=TeamCapacityResponse)
def get_team_capacity(
    team_id: UUID,
    year: int,
    db: Session = Depends(get_db)
):
    """Get team capacity for a specific year."""
    team = TeamService.get_by_id(db, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    capacity = TeamService.get_capacity(db, team_id, year)
    return TeamService.build_capacity_response(db, team_id, capacity, year)


@router.put("/{team_id}/capacity/{year}", response_model=TeamCapacityResponse)
def update_team_capacity(
    team_id: UUID,
    year: int,
    data: TeamCapacityUpdate,
    db: Session = Depends(get_db)
):
    """Update team capacity for a specific year."""
    team = TeamService.get_by_id(db, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    capacity = TeamService.update_capacity(db, team_id, year, data)
    return TeamService.build_capacity_response(db, team_id, capacity, year)
```

---

## 5. Service Layer

```python
# app/services/team_service.py

from typing import Optional, Tuple, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.models.team import Team, TeamCapacity, TeamStatus
from app.schemas.team import (
    TeamCreate,
    TeamUpdate,
    TeamResponse,
    TeamCapacityCreate,
    TeamCapacityUpdate,
    TeamCapacityResponse,
    QuarterCapacity
)


class TeamService:
    """Service layer for Team business logic."""

    @staticmethod
    def get_all(
        db: Session,
        status: Optional[str] = None,
        search: Optional[str] = None,
        year: Optional[int] = None
    ) -> Tuple[List[TeamResponse], int]:
        """Get all teams with optional filtering."""
        query = db.query(Team)

        if status:
            query = query.filter(Team.status == status)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Team.name.ilike(search_term),
                    Team.short_code.ilike(search_term)
                )
            )

        total = query.count()
        teams = query.order_by(Team.name).all()

        result = [TeamService.build_team_response(db, t, year) for t in teams]
        return result, total

    @staticmethod
    def get_by_id(db: Session, team_id: UUID) -> Optional[Team]:
        """Get team by ID."""
        return db.query(Team).filter(Team.id == team_id).first()

    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Team]:
        """Get team by name (case-insensitive)."""
        return db.query(Team).filter(
            func.lower(Team.name) == func.lower(name)
        ).first()

    @staticmethod
    def get_by_short_code(db: Session, short_code: str) -> Optional[Team]:
        """Get team by short code (case-insensitive)."""
        return db.query(Team).filter(
            func.lower(Team.short_code) == func.lower(short_code)
        ).first()

    @staticmethod
    def create(db: Session, data: TeamCreate) -> Team:
        """Create a new team."""
        team = Team(
            name=data.name.strip(),
            short_code=data.short_code.upper().strip(),
            description=data.description,
            status=TeamStatus(data.status)
        )
        db.add(team)
        db.flush()

        # Create capacity if provided
        if data.capacity:
            capacity = TeamCapacity(
                team_id=team.id,
                year=data.capacity.year,
                q1_capacity=data.capacity.q1_capacity,
                q2_capacity=data.capacity.q2_capacity,
                q3_capacity=data.capacity.q3_capacity,
                q4_capacity=data.capacity.q4_capacity
            )
            db.add(capacity)

        db.commit()
        db.refresh(team)
        return team

    @staticmethod
    def update(db: Session, team_id: UUID, data: TeamUpdate) -> Team:
        """Update an existing team."""
        team = db.query(Team).filter(Team.id == team_id).first()

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is None:
                continue
            if field == 'short_code':
                value = value.upper().strip()
            if field == 'status':
                value = TeamStatus(value)
            if field == 'name':
                value = value.strip()
            setattr(team, field, value)

        db.commit()
        db.refresh(team)
        return team

    @staticmethod
    def delete(db: Session, team_id: UUID) -> None:
        """Delete a team."""
        team = db.query(Team).filter(Team.id == team_id).first()
        db.delete(team)
        db.commit()

    @staticmethod
    def can_delete(db: Session, team_id: UUID) -> Tuple[bool, str]:
        """Check if team can be deleted."""
        # TODO: Check for assigned features when Feature model exists
        return True, ""

    @staticmethod
    def get_capacity(db: Session, team_id: UUID, year: int) -> Optional[TeamCapacity]:
        """Get team capacity for a year."""
        return db.query(TeamCapacity).filter(
            TeamCapacity.team_id == team_id,
            TeamCapacity.year == year
        ).first()

    @staticmethod
    def update_capacity(
        db: Session,
        team_id: UUID,
        year: int,
        data: TeamCapacityUpdate
    ) -> TeamCapacity:
        """Update or create team capacity for a year."""
        capacity = TeamService.get_capacity(db, team_id, year)

        if not capacity:
            # Create new capacity record
            capacity = TeamCapacity(
                team_id=team_id,
                year=year,
                q1_capacity=data.q1_capacity or 0,
                q2_capacity=data.q2_capacity or 0,
                q3_capacity=data.q3_capacity or 0,
                q4_capacity=data.q4_capacity or 0
            )
            db.add(capacity)
        else:
            # Update existing
            if data.q1_capacity is not None:
                capacity.q1_capacity = data.q1_capacity
            if data.q2_capacity is not None:
                capacity.q2_capacity = data.q2_capacity
            if data.q3_capacity is not None:
                capacity.q3_capacity = data.q3_capacity
            if data.q4_capacity is not None:
                capacity.q4_capacity = data.q4_capacity

        db.commit()
        db.refresh(capacity)
        return capacity

    @staticmethod
    def get_quarter_allocated(db: Session, team_id: UUID, year: int, quarter: int) -> int:
        """Get allocated capacity for a quarter from features."""
        # TODO: Implement when Feature model exists
        return 0

    @staticmethod
    def build_quarter_capacity(
        db: Session,
        team_id: UUID,
        year: int,
        quarter: int,
        total: int
    ) -> QuarterCapacity:
        """Build quarter capacity with utilization."""
        allocated = TeamService.get_quarter_allocated(db, team_id, year, quarter)
        available = max(0, total - allocated)
        utilization = (allocated / total * 100) if total > 0 else 0.0

        return QuarterCapacity(
            total=total,
            allocated=allocated,
            available=available,
            utilization=round(utilization, 1)
        )

    @staticmethod
    def build_capacity_response(
        db: Session,
        team_id: UUID,
        capacity: Optional[TeamCapacity],
        year: int
    ) -> TeamCapacityResponse:
        """Build capacity response with calculated fields."""
        if not capacity:
            return TeamCapacityResponse(
                year=year,
                q1=QuarterCapacity(),
                q2=QuarterCapacity(),
                q3=QuarterCapacity(),
                q4=QuarterCapacity()
            )

        return TeamCapacityResponse(
            year=year,
            q1=TeamService.build_quarter_capacity(db, team_id, year, 1, capacity.q1_capacity),
            q2=TeamService.build_quarter_capacity(db, team_id, year, 2, capacity.q2_capacity),
            q3=TeamService.build_quarter_capacity(db, team_id, year, 3, capacity.q3_capacity),
            q4=TeamService.build_quarter_capacity(db, team_id, year, 4, capacity.q4_capacity)
        )

    @staticmethod
    def build_team_response(
        db: Session,
        team: Team,
        year: Optional[int] = None
    ) -> TeamResponse:
        """Build team response with capacity."""
        import datetime
        current_year = year or datetime.datetime.now().year

        capacity = TeamService.get_capacity(db, team.id, current_year)
        capacity_response = TeamService.build_capacity_response(db, team.id, capacity, current_year) if capacity else None

        return TeamResponse(
            id=team.id,
            name=team.name,
            short_code=team.short_code,
            description=team.description,
            status=team.status.value if isinstance(team.status, TeamStatus) else team.status,
            member_count=0,  # TODO: Implement when member tracking exists
            capacity=capacity_response,
            created_at=team.created_at,
            updated_at=team.updated_at
        )
```

---

## 6. File Structure Update

```
backend/app/
├── models/
│   ├── __init__.py      # Add Team imports
│   └── team.py          # NEW
├── schemas/
│   ├── __init__.py      # Add Team imports
│   └── team.py          # NEW
├── routes/
│   ├── __init__.py      # Add teams router
│   └── teams.py         # NEW
├── services/
│   ├── __init__.py      # Add TeamService
│   └── team_service.py  # NEW
└── main.py              # Include teams router
```
