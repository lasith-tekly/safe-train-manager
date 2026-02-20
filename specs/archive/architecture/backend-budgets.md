# Backend Architecture - Budgets Module

**Document Version:** 1.0  
**Created:** 2026-01-15  
**Author:** Backend Architect Agent  
**Status:** Draft  

---

## 1. Overview

This document defines the backend architecture for the Budgets Management feature, including budget versions and budget lines.

---

## 2. Database Schema

### 2.1 BudgetVersion Model

```python
# app/models/budget.py

import uuid
import enum
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, String, Text, DateTime, Integer, Numeric, ForeignKey
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class BudgetStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"
    LOCKED = "locked"


class BudgetVersion(Base):
    __tablename__ = "budget_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(
        SQLEnum(BudgetStatus),
        nullable=False,
        default=BudgetStatus.DRAFT,
        index=True
    )
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), nullable=True)

    # Relationships
    product = relationship("Product", back_populates="budget_versions")
    budget_lines = relationship(
        "BudgetLine",
        back_populates="version",
        cascade="all, delete-orphan",
        order_by="BudgetLine.display_order"
    )

    @property
    def total_budget(self) -> Decimal:
        return sum(line.allocated_amount for line in self.budget_lines)

    def __repr__(self):
        return f"<BudgetVersion {self.name} ({self.year})>"


class BudgetLine(Base):
    __tablename__ = "budget_lines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version_id = Column(UUID(as_uuid=True), ForeignKey("budget_versions.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    allocated_amount = Column(Numeric(12, 2), nullable=False, default=0)
    display_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    version = relationship("BudgetVersion", back_populates="budget_lines")
    # features = relationship("Feature", back_populates="budget_line")

    def __repr__(self):
        return f"<BudgetLine {self.name}: {self.allocated_amount}>"
```

### 2.2 Update Product Model

```python
# Add to app/models/product.py

# Add relationship
budget_versions = relationship(
    "BudgetVersion",
    back_populates="product",
    cascade="all, delete-orphan"
)
```

---

## 3. Pydantic Schemas

```python
# app/schemas/budget.py

from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class BudgetLineBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    allocated_amount: Decimal = Field(..., ge=0)
    display_order: int = Field(default=0)


class BudgetLineCreate(BudgetLineBase):
    pass


class BudgetLineUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    allocated_amount: Optional[Decimal] = Field(None, ge=0)
    display_order: Optional[int] = None


class BudgetLineResponse(BudgetLineBase):
    id: UUID
    consumed_amount: Decimal = Decimal("0")
    remaining_amount: Decimal = Decimal("0")
    consumption_percentage: float = 0.0

    class Config:
        from_attributes = True


class BudgetVersionBase(BaseModel):
    product_id: UUID
    year: int = Field(..., ge=2020, le=2100)
    name: str = Field(..., min_length=1, max_length=100)
    notes: Optional[str] = Field(None, max_length=1000)
    status: str = Field(default="draft")

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid = ['draft', 'active', 'archived', 'locked']
        if v not in valid:
            raise ValueError(f'Status must be one of: {", ".join(valid)}')
        return v


class BudgetVersionCreate(BudgetVersionBase):
    budget_lines: List[BudgetLineCreate]


class BudgetVersionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    notes: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = None
    budget_lines: Optional[List[BudgetLineCreate]] = None

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid = ['draft', 'active', 'archived', 'locked']
        if v not in valid:
            raise ValueError(f'Status must be one of: {", ".join(valid)}')
        return v


class BudgetVersionResponse(BaseModel):
    id: UUID
    product_id: UUID
    year: int
    name: str
    notes: Optional[str]
    status: str
    total_budget: Decimal
    total_consumed: Decimal = Decimal("0")
    total_remaining: Decimal = Decimal("0")
    budget_lines: List[BudgetLineResponse]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class BudgetVersionListResponse(BaseModel):
    data: List[BudgetVersionResponse]
    total: int
```

---

## 4. API Routes

```python
# app/routes/budgets.py

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.budget import BudgetVersion, BudgetLine, BudgetStatus
from app.schemas.budget import (
    BudgetVersionCreate,
    BudgetVersionUpdate,
    BudgetVersionResponse,
    BudgetVersionListResponse
)
from app.services.budget_service import BudgetService

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


@router.get("/versions", response_model=BudgetVersionListResponse)
def list_budget_versions(
    product_id: UUID = Query(..., description="Filter by product ID"),
    year: Optional[int] = Query(None, description="Filter by year"),
    db: Session = Depends(get_db)
):
    """List budget versions for a product, optionally filtered by year."""
    versions, total = BudgetService.get_versions(db, product_id, year)
    return BudgetVersionListResponse(data=versions, total=total)


@router.get("/versions/{version_id}", response_model=BudgetVersionResponse)
def get_budget_version(
    version_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a single budget version with its budget lines."""
    version = BudgetService.get_version_by_id(db, version_id)
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget version not found"
        )
    return BudgetService.build_version_response(db, version)


@router.post("/versions", response_model=BudgetVersionResponse, status_code=status.HTTP_201_CREATED)
def create_budget_version(
    data: BudgetVersionCreate,
    db: Session = Depends(get_db)
):
    """Create a new budget version with budget lines."""
    # Check for duplicate name
    existing = BudgetService.get_version_by_name(
        db, data.product_id, data.year, data.name
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A version with this name already exists for this product and year"
        )

    # If setting as active, deactivate current active
    if data.status == "active":
        BudgetService.deactivate_current_active(db, data.product_id, data.year)

    version = BudgetService.create_version(db, data)
    return BudgetService.build_version_response(db, version)


@router.put("/versions/{version_id}", response_model=BudgetVersionResponse)
def update_budget_version(
    version_id: UUID,
    data: BudgetVersionUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing budget version."""
    version = BudgetService.get_version_by_id(db, version_id)
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget version not found"
        )

    if version.status == BudgetStatus.LOCKED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Locked versions cannot be edited"
        )

    # Check name uniqueness if changing
    if data.name and data.name != version.name:
        existing = BudgetService.get_version_by_name(
            db, version.product_id, version.year, data.name
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A version with this name already exists"
            )

    # If activating, deactivate current active
    if data.status == "active" and version.status != BudgetStatus.ACTIVE:
        BudgetService.deactivate_current_active(db, version.product_id, version.year)

    updated = BudgetService.update_version(db, version_id, data)
    return BudgetService.build_version_response(db, updated)


@router.post("/versions/{version_id}/copy", response_model=BudgetVersionResponse, status_code=status.HTTP_201_CREATED)
def copy_budget_version(
    version_id: UUID,
    db: Session = Depends(get_db)
):
    """Create a copy of an existing budget version."""
    version = BudgetService.get_version_by_id(db, version_id)
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget version not found"
        )

    copied = BudgetService.copy_version(db, version)
    return BudgetService.build_version_response(db, copied)


@router.post("/versions/{version_id}/activate", response_model=BudgetVersionResponse)
def activate_budget_version(
    version_id: UUID,
    db: Session = Depends(get_db)
):
    """Activate a draft budget version."""
    version = BudgetService.get_version_by_id(db, version_id)
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget version not found"
        )

    if version.status != BudgetStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft versions can be activated"
        )

    BudgetService.deactivate_current_active(db, version.product_id, version.year)
    activated = BudgetService.activate_version(db, version_id)
    return BudgetService.build_version_response(db, activated)


@router.post("/versions/{version_id}/lock", response_model=BudgetVersionResponse)
def lock_budget_version(
    version_id: UUID,
    db: Session = Depends(get_db)
):
    """Lock an active budget version."""
    version = BudgetService.get_version_by_id(db, version_id)
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget version not found"
        )

    if version.status != BudgetStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active versions can be locked"
        )

    locked = BudgetService.lock_version(db, version_id)
    return BudgetService.build_version_response(db, locked)


@router.delete("/versions/{version_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget_version(
    version_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a draft budget version."""
    version = BudgetService.get_version_by_id(db, version_id)
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget version not found"
        )

    if version.status != BudgetStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft versions can be deleted"
        )

    BudgetService.delete_version(db, version_id)
    return None
```

---

## 5. Service Layer

```python
# app/services/budget_service.py

from typing import Optional, Tuple, List
from uuid import UUID
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.budget import BudgetVersion, BudgetLine, BudgetStatus
from app.schemas.budget import (
    BudgetVersionCreate,
    BudgetVersionUpdate,
    BudgetVersionResponse,
    BudgetLineResponse
)


class BudgetService:
    """Service layer for Budget business logic."""

    DEFAULT_BUDGET_LINES = [
        {"name": "Product Evolution", "display_order": 1},
        {"name": "Maintenance", "display_order": 2},
        {"name": "Implementation", "display_order": 3},
        {"name": "Bespoke", "display_order": 4},
    ]

    @staticmethod
    def get_versions(
        db: Session,
        product_id: UUID,
        year: Optional[int] = None
    ) -> Tuple[List[BudgetVersionResponse], int]:
        """Get all budget versions for a product."""
        query = db.query(BudgetVersion).filter(
            BudgetVersion.product_id == product_id
        )

        if year:
            query = query.filter(BudgetVersion.year == year)

        query = query.order_by(BudgetVersion.year.desc(), BudgetVersion.created_at.desc())
        
        versions = query.all()
        result = [BudgetService.build_version_response(db, v) for v in versions]
        
        return result, len(result)

    @staticmethod
    def get_version_by_id(db: Session, version_id: UUID) -> Optional[BudgetVersion]:
        """Get budget version by ID."""
        return db.query(BudgetVersion).filter(BudgetVersion.id == version_id).first()

    @staticmethod
    def get_version_by_name(
        db: Session,
        product_id: UUID,
        year: int,
        name: str
    ) -> Optional[BudgetVersion]:
        """Get budget version by name (unique per product+year)."""
        return db.query(BudgetVersion).filter(
            and_(
                BudgetVersion.product_id == product_id,
                BudgetVersion.year == year,
                BudgetVersion.name == name
            )
        ).first()

    @staticmethod
    def get_active_version(
        db: Session,
        product_id: UUID,
        year: int
    ) -> Optional[BudgetVersion]:
        """Get the active budget version for a product and year."""
        return db.query(BudgetVersion).filter(
            and_(
                BudgetVersion.product_id == product_id,
                BudgetVersion.year == year,
                BudgetVersion.status == BudgetStatus.ACTIVE
            )
        ).first()

    @staticmethod
    def create_version(db: Session, data: BudgetVersionCreate) -> BudgetVersion:
        """Create a new budget version with lines."""
        version = BudgetVersion(
            product_id=data.product_id,
            year=data.year,
            name=data.name,
            notes=data.notes,
            status=BudgetStatus(data.status)
        )
        db.add(version)
        db.flush()

        # Add budget lines
        for line_data in data.budget_lines:
            line = BudgetLine(
                version_id=version.id,
                name=line_data.name,
                allocated_amount=line_data.allocated_amount,
                display_order=line_data.display_order
            )
            db.add(line)

        db.commit()
        db.refresh(version)
        return version

    @staticmethod
    def update_version(
        db: Session,
        version_id: UUID,
        data: BudgetVersionUpdate
    ) -> BudgetVersion:
        """Update an existing budget version."""
        version = db.query(BudgetVersion).filter(BudgetVersion.id == version_id).first()

        # Update basic fields
        if data.name is not None:
            version.name = data.name
        if data.notes is not None:
            version.notes = data.notes
        if data.status is not None:
            version.status = BudgetStatus(data.status)

        # Update budget lines if provided
        if data.budget_lines is not None:
            # Delete existing lines
            db.query(BudgetLine).filter(BudgetLine.version_id == version_id).delete()
            
            # Add new lines
            for line_data in data.budget_lines:
                line = BudgetLine(
                    version_id=version_id,
                    name=line_data.name,
                    allocated_amount=line_data.allocated_amount,
                    display_order=line_data.display_order
                )
                db.add(line)

        db.commit()
        db.refresh(version)
        return version

    @staticmethod
    def copy_version(db: Session, source: BudgetVersion) -> BudgetVersion:
        """Create a copy of a budget version."""
        # Generate unique name
        base_name = f"Copy of {source.name}"
        name = base_name
        counter = 1
        while BudgetService.get_version_by_name(db, source.product_id, source.year, name):
            counter += 1
            name = f"{base_name} ({counter})"

        # Create new version
        new_version = BudgetVersion(
            product_id=source.product_id,
            year=source.year,
            name=name,
            notes=source.notes,
            status=BudgetStatus.DRAFT
        )
        db.add(new_version)
        db.flush()

        # Copy budget lines
        for source_line in source.budget_lines:
            line = BudgetLine(
                version_id=new_version.id,
                name=source_line.name,
                allocated_amount=source_line.allocated_amount,
                display_order=source_line.display_order
            )
            db.add(line)

        db.commit()
        db.refresh(new_version)
        return new_version

    @staticmethod
    def activate_version(db: Session, version_id: UUID) -> BudgetVersion:
        """Activate a budget version."""
        version = db.query(BudgetVersion).filter(BudgetVersion.id == version_id).first()
        version.status = BudgetStatus.ACTIVE
        db.commit()
        db.refresh(version)
        return version

    @staticmethod
    def lock_version(db: Session, version_id: UUID) -> BudgetVersion:
        """Lock a budget version."""
        version = db.query(BudgetVersion).filter(BudgetVersion.id == version_id).first()
        version.status = BudgetStatus.LOCKED
        db.commit()
        db.refresh(version)
        return version

    @staticmethod
    def deactivate_current_active(db: Session, product_id: UUID, year: int) -> None:
        """Deactivate the current active version (set to archived)."""
        active = BudgetService.get_active_version(db, product_id, year)
        if active:
            active.status = BudgetStatus.ARCHIVED
            db.commit()

    @staticmethod
    def delete_version(db: Session, version_id: UUID) -> None:
        """Delete a budget version."""
        version = db.query(BudgetVersion).filter(BudgetVersion.id == version_id).first()
        db.delete(version)
        db.commit()

    @staticmethod
    def get_line_consumption(db: Session, line_id: UUID) -> Decimal:
        """Calculate consumption for a budget line from features."""
        # TODO: Implement when Feature model exists
        # return db.query(func.sum(Feature.cost)).filter(
        #     Feature.budget_line_id == line_id
        # ).scalar() or Decimal("0")
        return Decimal("0")

    @staticmethod
    def build_version_response(db: Session, version: BudgetVersion) -> BudgetVersionResponse:
        """Build a complete version response with calculated fields."""
        budget_lines = []
        total_consumed = Decimal("0")

        for line in version.budget_lines:
            consumed = BudgetService.get_line_consumption(db, line.id)
            remaining = line.allocated_amount - consumed
            percentage = float(consumed / line.allocated_amount * 100) if line.allocated_amount > 0 else 0.0

            budget_lines.append(BudgetLineResponse(
                id=line.id,
                name=line.name,
                allocated_amount=line.allocated_amount,
                display_order=line.display_order,
                consumed_amount=consumed,
                remaining_amount=remaining,
                consumption_percentage=round(percentage, 1)
            ))
            total_consumed += consumed

        total_budget = sum(line.allocated_amount for line in version.budget_lines)
        total_remaining = total_budget - total_consumed

        return BudgetVersionResponse(
            id=version.id,
            product_id=version.product_id,
            year=version.year,
            name=version.name,
            notes=version.notes,
            status=version.status.value,
            total_budget=total_budget,
            total_consumed=total_consumed,
            total_remaining=total_remaining,
            budget_lines=budget_lines,
            created_at=version.created_at,
            updated_at=version.updated_at
        )
```

---

## 6. Database Migration

```python
# alembic/versions/002_create_budget_tables.py

"""create budget tables

Revision ID: 002
Revises: 001
Create Date: 2026-01-15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    # Budget versions table
    op.create_table(
        'budget_versions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id'), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
    )
    
    op.create_index('ix_budget_versions_product_year', 'budget_versions', ['product_id', 'year'])
    op.create_index('ix_budget_versions_status', 'budget_versions', ['status'])
    op.create_unique_constraint('uq_budget_version_name', 'budget_versions', ['product_id', 'year', 'name'])

    # Budget lines table
    op.create_table(
        'budget_lines',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('version_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('budget_versions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('allocated_amount', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    
    op.create_index('ix_budget_lines_version_id', 'budget_lines', ['version_id'])


def downgrade():
    op.drop_table('budget_lines')
    op.drop_table('budget_versions')
```

---

## 7. File Structure Update

```
backend/app/
├── models/
│   ├── __init__.py      # Add Budget imports
│   ├── product.py       # Add relationship
│   └── budget.py        # NEW
├── schemas/
│   ├── __init__.py      # Add Budget imports
│   ├── product.py
│   └── budget.py        # NEW
├── routes/
│   ├── __init__.py      # Add budgets router
│   ├── products.py
│   └── budgets.py       # NEW
├── services/
│   ├── __init__.py      # Add BudgetService
│   ├── product_service.py
│   └── budget_service.py # NEW
└── main.py              # Include budgets router
```
