import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Boolean, UniqueConstraint, Index

from app.database import Base


class CapacityAllocationCategory(Base):
    """
    Dynamic capacity allocation categories that can be configured per year.
    Examples: Feature Capacity, IT Excellence, Component Work, Security, etc.
    """
    __tablename__ = "capacity_allocation_categories"
    
    # Table constraints
    __table_args__ = (
        UniqueConstraint('year', 'code', name='uq_capacity_allocation_year_code'),
        Index('idx_capacity_allocation_year_active', 'year', 'is_active'),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    year = Column(Integer, nullable=False, index=True)
    
    # Category details
    name = Column(String(100), nullable=False)  # "Feature Capacity"
    code = Column(String(50), nullable=False)   # "feature_capacity"
    description = Column(String(255), nullable=True)  # "New features for business"
    
    # Allocation
    default_percentage = Column(Integer, nullable=False, default=0)
    
    # UI customization
    color = Column(String(20), nullable=True, default="#1890ff")
    sort_order = Column(Integer, nullable=False, default=0)
    
    # Status
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Audit
    created_by = Column(String(36), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<CapacityAllocationCategory {self.name}: {self.default_percentage}%>"
