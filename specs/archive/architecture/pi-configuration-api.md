# PI Configuration - Backend Architecture Specification

**Document Version:** 1.0  
**Created:** 2026-01-15  
**Author:** Backend Architect Agent  
**Status:** Draft  
**Input:** specs/requirements/pi-configuration.md  

---

## 1. Overview

This document defines the backend architecture for PI Configuration, Holiday Calendar, and Capacity Auto-Calculation features.

### 1.1 Scope
- SQLAlchemy models for PI, Iteration, Holiday, MemberLeave, TeamIterationCapacity
- Pydantic schemas for request/response validation
- FastAPI routes and endpoints
- Business logic services
- Capacity calculation algorithms

---

## 2. Database Models

### 2.1 PI Model (`app/models/pi.py`)

```python
import uuid
import enum
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Date, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base


class PIStatus(str, enum.Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"


class PI(Base):
    __tablename__ = "pis"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False, index=True)
    sequence = Column(Integer, nullable=False)  # 1, 2, 3, 4...
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(
        SQLEnum(PIStatus),
        nullable=False,
        default=PIStatus.PLANNING,
        index=True
    )
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    iterations = relationship(
        "Iteration",
        back_populates="pi",
        cascade="all, delete-orphan",
        order_by="Iteration.sequence"
    )

    # Computed properties
    @property
    def start_week(self) -> int:
        """ISO week number of start date"""
        return self.start_date.isocalendar()[1]

    @property
    def end_week(self) -> int:
        """ISO week number of end date"""
        return self.end_date.isocalendar()[1]

    @property
    def duration_weeks(self) -> int:
        """Total weeks in PI"""
        return (self.end_date - self.start_date).days // 7

    __table_args__ = (
        # Unique PI name per year
        {'sqlite_autoincrement': True},
    )
```

### 2.2 Iteration Model

```python
class Iteration(Base):
    __tablename__ = "iterations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pi_id = Column(String(36), ForeignKey("pis.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(50), nullable=False)
    sequence = Column(Integer, nullable=False)  # 1, 2, 3...
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    duration_weeks = Column(Integer, nullable=False, default=2)
    is_ip_iteration = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    pi = relationship("PI", back_populates="iterations")
    team_capacities = relationship(
        "TeamIterationCapacity",
        back_populates="iteration",
        cascade="all, delete-orphan"
    )

    @property
    def start_week(self) -> int:
        return self.start_date.isocalendar()[1]

    @property
    def end_week(self) -> int:
        return self.end_date.isocalendar()[1]

    @property
    def working_days(self) -> int:
        """Calculate working days (Mon-Fri) in iteration"""
        from app.services.calendar_service import CalendarService
        return CalendarService.count_working_days(self.start_date, self.end_date)

    __table_args__ = (
        UniqueConstraint('pi_id', 'sequence', name='uq_iteration_sequence'),
    )
```

### 2.3 Holiday Model

```python
class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    date = Column(Date, nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    is_half_day = Column(Boolean, nullable=False, default=False)
    is_recurring = Column(Boolean, nullable=False, default=False)
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=True, index=True)
    country_code = Column(String(2), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    team = relationship("Team", backref="holidays")

    __table_args__ = (
        UniqueConstraint('date', 'team_id', name='uq_holiday_date_team'),
    )
```

### 2.4 MemberLeave Model

```python
class LeaveType(str, enum.Enum):
    VACATION = "vacation"
    SICK = "sick"
    TRAINING = "training"
    OTHER = "other"


class MemberLeave(Base):
    __tablename__ = "member_leaves"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id = Column(String(36), ForeignKey("team_members.id", ondelete="CASCADE"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    leave_type = Column(
        SQLEnum(LeaveType),
        nullable=False,
        default=LeaveType.VACATION
    )
    is_half_day = Column(Boolean, nullable=False, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    member = relationship("TeamMember", backref="leaves")

    __table_args__ = (
        Index('ix_member_leave_dates', 'member_id', 'start_date', 'end_date'),
    )
```

### 2.5 TeamIterationCapacity Model

```python
class TeamIterationCapacity(Base):
    __tablename__ = "team_iteration_capacities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    iteration_id = Column(String(36), ForeignKey("iterations.id", ondelete="CASCADE"), nullable=False, index=True)
    calculated_capacity = Column(Numeric(8, 2), nullable=False, default=0)
    manual_override = Column(Numeric(8, 2), nullable=True)
    override_reason = Column(Text, nullable=True)
    allocated = Column(Numeric(8, 2), nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    team = relationship("Team", backref="iteration_capacities")
    iteration = relationship("Iteration", back_populates="team_capacities")

    @property
    def final_capacity(self) -> float:
        """Return override if set, otherwise calculated"""
        return float(self.manual_override or self.calculated_capacity)

    @property
    def available(self) -> float:
        """Remaining capacity"""
        return self.final_capacity - float(self.allocated)

    @property
    def utilization(self) -> float:
        """Utilization percentage"""
        if self.final_capacity == 0:
            return 0
        return round((float(self.allocated) / self.final_capacity) * 100, 1)

    __table_args__ = (
        UniqueConstraint('team_id', 'iteration_id', name='uq_team_iteration_capacity'),
    )
```

---

## 3. Pydantic Schemas

### 3.1 PI Schemas (`app/schemas/pi.py`)

```python
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


class IterationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    sequence: int = Field(..., ge=1, le=10)
    start_date: date
    end_date: date
    duration_weeks: int = Field(2, ge=1, le=4)
    is_ip_iteration: bool = False


class IterationCreate(IterationBase):
    pass


class IterationResponse(IterationBase):
    id: str
    pi_id: str
    start_week: int
    end_week: int
    working_days: int
    created_at: datetime

    class Config:
        from_attributes = True


class PIBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    year: int = Field(..., ge=2020, le=2100)
    sequence: int = Field(..., ge=1, le=10)
    start_date: date
    end_date: date
    status: str = "planning"

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        if v not in ['planning', 'active', 'completed']:
            raise ValueError('Invalid status')
        return v

    @field_validator('end_date')
    @classmethod
    def validate_dates(cls, v, info):
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class PICreate(PIBase):
    iterations: List[IterationCreate] = []


class PIUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None


class PIResponse(PIBase):
    id: str
    start_week: int
    end_week: int
    duration_weeks: int
    iterations: List[IterationResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PIListResponse(BaseModel):
    data: List[PIResponse]
    total: int


class PIGenerateRequest(BaseModel):
    year: int = Field(..., ge=2020, le=2100)
    start_date: date
    template: str = "standard"  # standard, quarterly, custom
    iterations_per_pi: int = Field(5, ge=2, le=10)
    iteration_weeks: int = Field(2, ge=1, le=4)
    include_ip: bool = True
    pi_count: int = Field(4, ge=1, le=6)
```

### 3.2 Holiday Schemas (`app/schemas/holiday.py`)

```python
class HolidayBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    date: date
    is_half_day: bool = False
    is_recurring: bool = False
    team_id: Optional[str] = None
    country_code: Optional[str] = Field(None, max_length=2)


class HolidayCreate(HolidayBase):
    pass


class HolidayUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    date: Optional[date] = None
    is_half_day: Optional[bool] = None
    is_recurring: Optional[bool] = None


class HolidayResponse(HolidayBase):
    id: str
    year: int
    created_at: datetime

    class Config:
        from_attributes = True


class HolidayListResponse(BaseModel):
    data: List[HolidayResponse]
    total: int


class HolidayImportRequest(BaseModel):
    year: int
    country_code: str = Field(..., min_length=2, max_length=2)
    replace_existing: bool = False
```

### 3.3 Member Leave Schemas (`app/schemas/member_leave.py`)

```python
class MemberLeaveBase(BaseModel):
    start_date: date
    end_date: date
    leave_type: str = "vacation"
    is_half_day: bool = False
    notes: Optional[str] = None

    @field_validator('leave_type')
    @classmethod
    def validate_leave_type(cls, v):
        if v not in ['vacation', 'sick', 'training', 'other']:
            raise ValueError('Invalid leave type')
        return v

    @field_validator('end_date')
    @classmethod
    def validate_dates(cls, v, info):
        if 'start_date' in info.data and v < info.data['start_date']:
            raise ValueError('end_date must be >= start_date')
        return v


class MemberLeaveCreate(MemberLeaveBase):
    pass


class MemberLeaveResponse(MemberLeaveBase):
    id: str
    member_id: str
    days: int  # Calculated leave days
    created_at: datetime

    class Config:
        from_attributes = True
```

### 3.4 Capacity Schemas (`app/schemas/capacity.py`)

```python
class IterationCapacityResponse(BaseModel):
    iteration_id: str
    iteration_name: str
    iteration_sequence: int
    start_week: int
    end_week: int
    is_ip: bool
    calculated_capacity: float
    manual_override: Optional[float] = None
    override_reason: Optional[str] = None
    final_capacity: float
    allocated: float
    available: float
    utilization: float


class TeamIterationCapacityResponse(BaseModel):
    team_id: str
    team_name: str
    team_code: str
    member_count: int
    iterations: List[IterationCapacityResponse]
    pi_total_capacity: float
    pi_total_allocated: float
    pi_utilization: float


class CapacityOverrideRequest(BaseModel):
    manual_override: float = Field(..., ge=0)
    override_reason: str = Field(..., min_length=1, max_length=500)


class CapacitySummaryResponse(BaseModel):
    pi_id: str
    pi_name: str
    teams: List[TeamIterationCapacityResponse]
    total_capacity: float
    total_allocated: float
    overall_utilization: float
```

---

## 4. API Routes

### 4.1 PI Routes (`app/routes/pis.py`)

```python
router = APIRouter(prefix="/api/pis", tags=["pis"])

@router.get("", response_model=PIListResponse)
def list_pis(
    year: int = Query(..., ge=2020, le=2100),
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all PIs for a year with their iterations."""
    pass

@router.post("", response_model=PIResponse, status_code=201)
def create_pi(data: PICreate, db: Session = Depends(get_db)):
    """Create a new PI with iterations."""
    pass

@router.get("/{pi_id}", response_model=PIResponse)
def get_pi(pi_id: str, db: Session = Depends(get_db)):
    """Get a PI with all iterations."""
    pass

@router.put("/{pi_id}", response_model=PIResponse)
def update_pi(pi_id: str, data: PIUpdate, db: Session = Depends(get_db)):
    """Update PI details."""
    pass

@router.delete("/{pi_id}", status_code=204)
def delete_pi(pi_id: str, db: Session = Depends(get_db)):
    """Delete PI and all iterations."""
    pass

@router.post("/generate", response_model=PIListResponse)
def generate_pis(data: PIGenerateRequest, db: Session = Depends(get_db)):
    """Generate PIs from template."""
    pass

@router.post("/{pi_id}/iterations", response_model=IterationResponse, status_code=201)
def add_iteration(pi_id: str, data: IterationCreate, db: Session = Depends(get_db)):
    """Add iteration to PI."""
    pass

@router.put("/iterations/{iteration_id}", response_model=IterationResponse)
def update_iteration(iteration_id: str, data: IterationCreate, db: Session = Depends(get_db)):
    """Update iteration."""
    pass

@router.delete("/iterations/{iteration_id}", status_code=204)
def delete_iteration(iteration_id: str, db: Session = Depends(get_db)):
    """Delete iteration."""
    pass
```

### 4.2 Holiday Routes (`app/routes/holidays.py`)

```python
router = APIRouter(prefix="/api/holidays", tags=["holidays"])

@router.get("", response_model=HolidayListResponse)
def list_holidays(
    year: int = Query(..., ge=2020, le=2100),
    team_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List holidays for a year."""
    pass

@router.post("", response_model=HolidayResponse, status_code=201)
def create_holiday(data: HolidayCreate, db: Session = Depends(get_db)):
    """Create a holiday."""
    pass

@router.put("/{holiday_id}", response_model=HolidayResponse)
def update_holiday(holiday_id: str, data: HolidayUpdate, db: Session = Depends(get_db)):
    """Update a holiday."""
    pass

@router.delete("/{holiday_id}", status_code=204)
def delete_holiday(holiday_id: str, db: Session = Depends(get_db)):
    """Delete a holiday."""
    pass

@router.post("/import", response_model=HolidayListResponse)
def import_holidays(data: HolidayImportRequest, db: Session = Depends(get_db)):
    """Import holidays from country preset."""
    pass

@router.get("/presets")
def list_presets():
    """List available country presets."""
    return {"presets": ["US", "UK", "IN", "AU", "CA", "DE"]}
```

### 4.3 Member Leave Routes (`app/routes/member_leaves.py`)

```python
router = APIRouter(prefix="/api/members/{member_id}/leaves", tags=["member-leaves"])

@router.get("", response_model=List[MemberLeaveResponse])
def list_member_leaves(
    member_id: str,
    year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """List leaves for a member."""
    pass

@router.post("", response_model=MemberLeaveResponse, status_code=201)
def create_leave(member_id: str, data: MemberLeaveCreate, db: Session = Depends(get_db)):
    """Add leave for a member."""
    pass

@router.put("/{leave_id}", response_model=MemberLeaveResponse)
def update_leave(member_id: str, leave_id: str, data: MemberLeaveCreate, db: Session = Depends(get_db)):
    """Update a leave."""
    pass

@router.delete("/{leave_id}", status_code=204)
def delete_leave(member_id: str, leave_id: str, db: Session = Depends(get_db)):
    """Delete a leave."""
    pass
```

### 4.4 Capacity Routes (`app/routes/capacity.py`)

```python
router = APIRouter(prefix="/api/capacity", tags=["capacity"])

@router.get("/summary", response_model=CapacitySummaryResponse)
def get_capacity_summary(
    year: int = Query(...),
    pi_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get capacity summary for all teams."""
    pass

@router.get("/teams/{team_id}/iterations", response_model=TeamIterationCapacityResponse)
def get_team_iteration_capacity(
    team_id: str,
    pi_id: str = Query(...),
    db: Session = Depends(get_db)
):
    """Get team capacity by iteration."""
    pass

@router.post("/teams/{team_id}/calculate")
def calculate_team_capacity(
    team_id: str,
    pi_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Recalculate team capacity."""
    pass

@router.put("/teams/{team_id}/iterations/{iteration_id}", response_model=IterationCapacityResponse)
def override_capacity(
    team_id: str,
    iteration_id: str,
    data: CapacityOverrideRequest,
    db: Session = Depends(get_db)
):
    """Override calculated capacity."""
    pass

@router.delete("/teams/{team_id}/iterations/{iteration_id}/override", status_code=204)
def reset_capacity_override(
    team_id: str,
    iteration_id: str,
    db: Session = Depends(get_db)
):
    """Reset to calculated capacity."""
    pass
```

---

## 5. Business Logic Services

### 5.1 Calendar Service (`app/services/calendar_service.py`)

```python
from datetime import date, timedelta
from typing import List

class CalendarService:
    
    @staticmethod
    def count_working_days(start_date: date, end_date: date, holidays: List[date] = None) -> int:
        """Count working days (Mon-Fri) between dates, excluding holidays."""
        holidays = holidays or []
        working_days = 0
        current = start_date
        
        while current <= end_date:
            # Monday = 0, Sunday = 6
            if current.weekday() < 5 and current not in holidays:
                working_days += 1
            current += timedelta(days=1)
        
        return working_days
    
    @staticmethod
    def get_iso_week(d: date) -> int:
        """Get ISO week number."""
        return d.isocalendar()[1]
    
    @staticmethod
    def get_week_start(year: int, week: int) -> date:
        """Get the Monday of a given ISO week."""
        jan4 = date(year, 1, 4)
        start_of_week1 = jan4 - timedelta(days=jan4.weekday())
        return start_of_week1 + timedelta(weeks=week - 1)
```

### 5.2 PI Service (`app/services/pi_service.py`)

```python
class PIService:
    
    @staticmethod
    def generate_from_template(
        db: Session,
        year: int,
        start_date: date,
        template: str,
        iterations_per_pi: int = 5,
        iteration_weeks: int = 2,
        include_ip: bool = True,
        pi_count: int = 4
    ) -> List[PI]:
        """Generate PIs from template."""
        pis = []
        current_start = start_date
        
        for pi_seq in range(1, pi_count + 1):
            # Calculate PI duration
            dev_iterations = iterations_per_pi - (1 if include_ip else 0)
            ip_weeks = iteration_weeks if include_ip else 0
            pi_weeks = (dev_iterations * iteration_weeks) + ip_weeks
            pi_end = current_start + timedelta(weeks=pi_weeks) - timedelta(days=1)
            
            pi = PI(
                name=f"PI {year}-Q{pi_seq}",
                year=year,
                sequence=pi_seq,
                start_date=current_start,
                end_date=pi_end,
                status=PIStatus.PLANNING
            )
            
            # Generate iterations
            iter_start = current_start
            for iter_seq in range(1, iterations_per_pi + 1):
                is_ip = include_ip and iter_seq == iterations_per_pi
                iter_end = iter_start + timedelta(weeks=iteration_weeks) - timedelta(days=1)
                
                iteration = Iteration(
                    name=f"{'IP' if is_ip else f'Sprint {iter_seq}'}",
                    sequence=iter_seq,
                    start_date=iter_start,
                    end_date=iter_end,
                    duration_weeks=iteration_weeks,
                    is_ip_iteration=is_ip
                )
                pi.iterations.append(iteration)
                iter_start = iter_end + timedelta(days=1)
            
            pis.append(pi)
            current_start = pi_end + timedelta(days=1)
        
        # Save to database
        for pi in pis:
            db.add(pi)
        db.commit()
        
        return pis
```

### 5.3 Capacity Calculation Service (`app/services/iteration_capacity_service.py`)

```python
class IterationCapacityService:
    
    @staticmethod
    def calculate_team_iteration_capacity(
        db: Session,
        team_id: str,
        iteration: Iteration,
        global_settings: GlobalSettings
    ) -> float:
        """
        Calculate team capacity for a single iteration.
        
        Formula:
        For each active member:
            iteration_working_days = working_days_in_iteration - holidays
            member_available_days = iteration_working_days - member_leaves
            member_capacity = member_available_days × (allocation% / 100) × (productivity% / 100)
        
        Team Capacity = Σ member_capacity
        """
        # Get active team members
        members = db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.status == TeamStatus.ACTIVE
        ).all()
        
        if not members:
            return 0.0
        
        # Get holidays in iteration period
        holidays = db.query(Holiday).filter(
            Holiday.date >= iteration.start_date,
            Holiday.date <= iteration.end_date,
            or_(Holiday.team_id == None, Holiday.team_id == team_id)
        ).all()
        
        holiday_dates = [h.date for h in holidays]
        half_day_dates = [h.date for h in holidays if h.is_half_day]
        
        # Calculate base working days in iteration
        base_working_days = CalendarService.count_working_days(
            iteration.start_date,
            iteration.end_date,
            holiday_dates
        )
        
        # Add back half days (they count as 0.5)
        base_working_days += len(half_day_dates) * 0.5
        
        total_capacity = 0.0
        
        for member in members:
            # Get member leaves in iteration
            leaves = db.query(MemberLeave).filter(
                MemberLeave.member_id == member.id,
                MemberLeave.start_date <= iteration.end_date,
                MemberLeave.end_date >= iteration.start_date
            ).all()
            
            # Calculate leave days within iteration
            leave_days = 0
            for leave in leaves:
                leave_start = max(leave.start_date, iteration.start_date)
                leave_end = min(leave.end_date, iteration.end_date)
                days = CalendarService.count_working_days(leave_start, leave_end, holiday_dates)
                if leave.is_half_day:
                    days *= 0.5
                leave_days += days
            
            # Calculate member capacity
            available_days = base_working_days - leave_days
            allocation = member.allocation_percentage / 100
            productivity = (member.individual_productivity or global_settings.global_productivity_percentage) / 100
            
            member_capacity = available_days * allocation * productivity
            total_capacity += member_capacity
        
        return round(total_capacity, 2)
    
    @staticmethod
    def calculate_and_store_team_capacity(
        db: Session,
        team_id: str,
        pi_id: str = None
    ):
        """Calculate and store capacity for all iterations."""
        global_settings = GlobalSettingsService.get_or_create(db, datetime.now().year)
        
        # Get iterations
        query = db.query(Iteration)
        if pi_id:
            query = query.filter(Iteration.pi_id == pi_id)
        else:
            query = query.join(PI).filter(PI.year == datetime.now().year)
        
        iterations = query.all()
        
        for iteration in iterations:
            capacity = IterationCapacityService.calculate_team_iteration_capacity(
                db, team_id, iteration, global_settings
            )
            
            # Upsert capacity record
            existing = db.query(TeamIterationCapacity).filter(
                TeamIterationCapacity.team_id == team_id,
                TeamIterationCapacity.iteration_id == iteration.id
            ).first()
            
            if existing:
                existing.calculated_capacity = capacity
            else:
                new_capacity = TeamIterationCapacity(
                    team_id=team_id,
                    iteration_id=iteration.id,
                    calculated_capacity=capacity
                )
                db.add(new_capacity)
        
        db.commit()
```

---

## 6. Holiday Presets

### 6.1 Preset Data (`app/data/holiday_presets.py`)

```python
HOLIDAY_PRESETS = {
    "US": [
        {"name": "New Year's Day", "month": 1, "day": 1},
        {"name": "Martin Luther King Jr. Day", "month": 1, "day": 15, "floating": "third_monday"},
        {"name": "Presidents' Day", "month": 2, "day": 15, "floating": "third_monday"},
        {"name": "Memorial Day", "month": 5, "day": 25, "floating": "last_monday"},
        {"name": "Independence Day", "month": 7, "day": 4},
        {"name": "Labor Day", "month": 9, "day": 1, "floating": "first_monday"},
        {"name": "Thanksgiving", "month": 11, "day": 22, "floating": "fourth_thursday"},
        {"name": "Christmas Day", "month": 12, "day": 25},
    ],
    "UK": [
        {"name": "New Year's Day", "month": 1, "day": 1},
        {"name": "Good Friday", "floating": "easter_minus_2"},
        {"name": "Easter Monday", "floating": "easter_plus_1"},
        {"name": "Early May Bank Holiday", "month": 5, "day": 1, "floating": "first_monday"},
        {"name": "Spring Bank Holiday", "month": 5, "day": 25, "floating": "last_monday"},
        {"name": "Summer Bank Holiday", "month": 8, "day": 25, "floating": "last_monday"},
        {"name": "Christmas Day", "month": 12, "day": 25},
        {"name": "Boxing Day", "month": 12, "day": 26},
    ],
    "IN": [
        {"name": "Republic Day", "month": 1, "day": 26},
        {"name": "Independence Day", "month": 8, "day": 15},
        {"name": "Gandhi Jayanti", "month": 10, "day": 2},
        {"name": "Diwali", "floating": "variable"},
        {"name": "Holi", "floating": "variable"},
        {"name": "Christmas Day", "month": 12, "day": 25},
    ],
}
```

---

## 7. Database Migration

### 7.1 Migration Script

```python
# alembic/versions/xxx_add_pi_configuration.py

def upgrade():
    # Create PIs table
    op.create_table(
        'pis',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('year', sa.Integer, nullable=False, index=True),
        sa.Column('sequence', sa.Integer, nullable=False),
        sa.Column('start_date', sa.Date, nullable=False),
        sa.Column('end_date', sa.Date, nullable=False),
        sa.Column('status', sa.String(20), nullable=False, default='planning'),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=True),
    )
    
    # Create Iterations table
    op.create_table(
        'iterations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('pi_id', sa.String(36), sa.ForeignKey('pis.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('sequence', sa.Integer, nullable=False),
        sa.Column('start_date', sa.Date, nullable=False),
        sa.Column('end_date', sa.Date, nullable=False),
        sa.Column('duration_weeks', sa.Integer, nullable=False, default=2),
        sa.Column('is_ip_iteration', sa.Boolean, nullable=False, default=False),
        sa.Column('created_at', sa.DateTime, nullable=False),
    )
    op.create_index('ix_iterations_pi_id', 'iterations', ['pi_id'])
    
    # Create Holidays table
    op.create_table(
        'holidays',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('date', sa.Date, nullable=False, index=True),
        sa.Column('year', sa.Integer, nullable=False, index=True),
        sa.Column('is_half_day', sa.Boolean, nullable=False, default=False),
        sa.Column('is_recurring', sa.Boolean, nullable=False, default=False),
        sa.Column('team_id', sa.String(36), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=True),
        sa.Column('country_code', sa.String(2), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False),
    )
    
    # Create Member Leaves table
    op.create_table(
        'member_leaves',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('member_id', sa.String(36), sa.ForeignKey('team_members.id', ondelete='CASCADE'), nullable=False),
        sa.Column('start_date', sa.Date, nullable=False),
        sa.Column('end_date', sa.Date, nullable=False),
        sa.Column('leave_type', sa.String(20), nullable=False, default='vacation'),
        sa.Column('is_half_day', sa.Boolean, nullable=False, default=False),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False),
    )
    
    # Create Team Iteration Capacities table
    op.create_table(
        'team_iteration_capacities',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('team_id', sa.String(36), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('iteration_id', sa.String(36), sa.ForeignKey('iterations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('calculated_capacity', sa.Numeric(8, 2), nullable=False, default=0),
        sa.Column('manual_override', sa.Numeric(8, 2), nullable=True),
        sa.Column('override_reason', sa.Text, nullable=True),
        sa.Column('allocated', sa.Numeric(8, 2), nullable=False, default=0),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=True),
    )
    op.create_unique_constraint('uq_team_iteration_capacity', 'team_iteration_capacities', ['team_id', 'iteration_id'])


def downgrade():
    op.drop_table('team_iteration_capacities')
    op.drop_table('member_leaves')
    op.drop_table('holidays')
    op.drop_table('iterations')
    op.drop_table('pis')
```

---

## 8. Agent Handoff

### Completed:
- ✅ Data model design
- ✅ API endpoint structure
- ✅ Pydantic schemas
- ✅ Business logic services
- ✅ Migration script

### Next Steps:

1. **@UI-Designer**: Design visual mockups for:
   - PI Calendar timeline view
   - Holiday calendar view
   - Iteration capacity table

2. **@Frontend-Architect**: Plan component structure based on this API

3. **@Backend-Developer**: Implement the models, routes, and services

---

## 9. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-15 | Backend Architect Agent | Initial architecture |
