import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Numeric, DateTime, Boolean

from app.database import Base


class GlobalSettings(Base):
    __tablename__ = "global_settings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    year = Column(Integer, nullable=False, unique=True, index=True)
    
    # Work Schedule
    working_days = Column(String(30), nullable=False, default="mon,tue,wed,thu,fri")
    week_start_day = Column(Integer, nullable=False, default=1)  # 0=Sunday, 1=Monday
    default_hours_per_day = Column(Numeric(4, 2), nullable=False, default=8.0)
    
    # Capacity Settings
    global_productivity_percentage = Column(Integer, nullable=False, default=70)
    
    # Capacity Allocation
    feature_capacity_percentage = Column(Integer, nullable=False, default=20)
    it_excellence_percentage = Column(Integer, nullable=False, default=12)
    component_work_percentage = Column(Integer, nullable=False, default=8)
    
    # PI Defaults
    default_sprint_duration_weeks = Column(Integer, nullable=False, default=2)
    default_ip_duration_weeks = Column(Integer, nullable=False, default=2)
    default_sprints_per_pi = Column(Integer, nullable=False, default=5)
    pi_planning_days = Column(Integer, nullable=False, default=3)  # Days reserved for PI Planning event
    apply_productivity_to_ip = Column(Boolean, nullable=False, default=False)  # Whether to apply productivity % to IP capacity
    
    # Budget & Cost Configuration
    train_structural_cost_ratio = Column(Float, nullable=False, default=2.8)
    effort_days_per_year = Column(Integer, nullable=False, default=220)
    train_unit_cost_keur = Column(Float, nullable=False, default=85.0)
    
    # Calendar Lock
    pi_calendar_locked = Column(Boolean, nullable=False, default=False)
    
    # Audit
    created_by = Column(String(36), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<GlobalSettings {self.year}: {self.global_productivity_percentage}%>"
    
    def get_working_days_list(self) -> list:
        """Return working days as a list."""
        return [d.strip() for d in self.working_days.split(",") if d.strip()]
    
    def is_working_day(self, day_name: str) -> bool:
        """Check if a day is a working day."""
        return day_name.lower()[:3] in self.get_working_days_list()
