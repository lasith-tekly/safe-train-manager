# Backend Architecture - Products Module

**Document Version:** 1.0  
**Created:** 2026-01-15  
**Author:** Backend Architect Agent  
**Status:** Draft  

---

## 1. Overview

This document defines the backend architecture for the Products Management feature, following FastAPI + SQLAlchemy patterns established in the backend-architect.md guidelines.

---

## 2. Database Schema

### 2.1 Product Model

```python
# app/models/product.py

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class ProductStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True, index=True)
    short_code = Column(String(6), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    status = Column(
        SQLEnum(ProductStatus), 
        nullable=False, 
        default=ProductStatus.ACTIVE,
        index=True
    )
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), nullable=True)  # FK to users table

    # Relationships
    budget_versions = relationship(
        "BudgetVersion", 
        back_populates="product",
        cascade="all, delete-orphan"
    )
    features = relationship(
        "Feature",
        back_populates="product"
    )

    def __repr__(self):
        return f"<Product {self.short_code}: {self.name}>"
```

### 2.2 Database Migration

```python
# alembic/versions/001_create_products_table.py

"""create products table

Revision ID: 001
Revises: 
Create Date: 2026-01-15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'products',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('short_code', sa.String(6), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
    )
    
    # Indexes
    op.create_index('ix_products_name', 'products', ['name'], unique=True)
    op.create_index('ix_products_short_code', 'products', ['short_code'], unique=True)
    op.create_index('ix_products_status', 'products', ['status'])


def downgrade():
    op.drop_index('ix_products_status')
    op.drop_index('ix_products_short_code')
    op.drop_index('ix_products_name')
    op.drop_table('products')
```

---

## 3. Pydantic Schemas

```python
# app/schemas/product.py

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
import re


class ProductBase(BaseModel):
    """Base schema with shared fields"""
    name: str = Field(..., min_length=1, max_length=100, description="Product name")
    short_code: str = Field(..., min_length=2, max_length=6, description="Short code (2-6 chars)")
    description: Optional[str] = Field(None, max_length=500, description="Product description")
    status: str = Field(default="active", description="Product status")

    @field_validator('short_code')
    @classmethod
    def validate_short_code(cls, v: str) -> str:
        v = v.upper().strip()
        if not re.match(r'^[A-Z0-9]{2,6}$', v):
            raise ValueError('Short code must be 2-6 alphanumeric characters')
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


class ProductCreate(ProductBase):
    """Schema for creating a product"""
    pass


class ProductUpdate(BaseModel):
    """Schema for updating a product (all fields optional)"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    short_code: Optional[str] = Field(None, min_length=2, max_length=6)
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = None

    @field_validator('short_code')
    @classmethod
    def validate_short_code(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.upper().strip()
        if not re.match(r'^[A-Z0-9]{2,6}$', v):
            raise ValueError('Short code must be 2-6 alphanumeric characters')
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if v not in ['active', 'inactive']:
            raise ValueError('Status must be active or inactive')
        return v


class ProductResponse(ProductBase):
    """Schema for product response"""
    id: UUID
    team_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    """Schema for list response with pagination"""
    data: list[ProductResponse]
    total: int
```

---

## 4. API Routes

```python
# app/routes/products.py

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.product import Product, ProductStatus
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse
)
from app.services.product_service import ProductService

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=ProductListResponse)
async def list_products(
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by name or code"),
    db: Session = Depends(get_db)
):
    """
    List all products with optional filtering.
    
    - **status**: Filter by 'active' or 'inactive'
    - **search**: Search in name or short_code
    """
    products, total = await ProductService.get_all(db, status=status, search=search)
    return ProductListResponse(data=products, total=total)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a single product by ID."""
    product = await ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new product.
    
    - **name**: Unique product name (required)
    - **short_code**: Unique 2-6 char code (required, auto-uppercased)
    - **description**: Optional description
    - **status**: 'active' (default) or 'inactive'
    """
    # Check for duplicate name
    existing = await ProductService.get_by_name(db, product_data.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A product with this name already exists"
        )
    
    # Check for duplicate short_code
    existing = await ProductService.get_by_short_code(db, product_data.short_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A product with this short code already exists"
        )
    
    product = await ProductService.create(db, product_data)
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    product_data: ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing product."""
    product = await ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check uniqueness if name is being changed
    if product_data.name and product_data.name != product.name:
        existing = await ProductService.get_by_name(db, product_data.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A product with this name already exists"
            )
    
    # Check uniqueness if short_code is being changed
    if product_data.short_code and product_data.short_code != product.short_code:
        existing = await ProductService.get_by_short_code(db, product_data.short_code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A product with this short code already exists"
            )
    
    # Check deactivation constraints
    if product_data.status == "inactive" and product.status == ProductStatus.ACTIVE:
        can_deactivate, reason = await ProductService.can_deactivate(db, product_id)
        if not can_deactivate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot deactivate: {reason}"
            )
    
    updated = await ProductService.update(db, product_id, product_data)
    return updated


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Delete a product.
    
    Note: Products with associated budgets or features cannot be deleted.
    """
    product = await ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    can_delete, reason = await ProductService.can_delete(db, product_id)
    if not can_delete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete: {reason}"
        )
    
    await ProductService.delete(db, product_id)
    return None
```

---

## 5. Service Layer

```python
# app/services/product_service.py

from typing import Optional, Tuple, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.models.product import Product, ProductStatus
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse


class ProductService:
    """Service layer for Product business logic."""

    @staticmethod
    async def get_all(
        db: Session,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[ProductResponse], int]:
        """Get all products with optional filtering."""
        query = db.query(Product)
        
        if status:
            query = query.filter(Product.status == status)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_term),
                    Product.short_code.ilike(search_term)
                )
            )
        
        total = query.count()
        products = query.order_by(Product.name).all()
        
        # Add team_count to each product
        result = []
        for product in products:
            team_count = await ProductService._get_team_count(db, product.id)
            product_dict = ProductResponse(
                id=product.id,
                name=product.name,
                short_code=product.short_code,
                description=product.description,
                status=product.status.value,
                team_count=team_count,
                created_at=product.created_at,
                updated_at=product.updated_at
            )
            result.append(product_dict)
        
        return result, total

    @staticmethod
    async def get_by_id(db: Session, product_id: UUID) -> Optional[Product]:
        """Get product by ID."""
        return db.query(Product).filter(Product.id == product_id).first()

    @staticmethod
    async def get_by_name(db: Session, name: str) -> Optional[Product]:
        """Get product by name (case-insensitive)."""
        return db.query(Product).filter(
            func.lower(Product.name) == func.lower(name)
        ).first()

    @staticmethod
    async def get_by_short_code(db: Session, short_code: str) -> Optional[Product]:
        """Get product by short code (case-insensitive)."""
        return db.query(Product).filter(
            func.lower(Product.short_code) == func.lower(short_code)
        ).first()

    @staticmethod
    async def create(db: Session, data: ProductCreate) -> Product:
        """Create a new product."""
        product = Product(
            name=data.name.strip(),
            short_code=data.short_code.upper().strip(),
            description=data.description,
            status=ProductStatus(data.status)
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    async def update(db: Session, product_id: UUID, data: ProductUpdate) -> Product:
        """Update an existing product."""
        product = db.query(Product).filter(Product.id == product_id).first()
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == 'short_code' and value:
                value = value.upper().strip()
            if field == 'status' and value:
                value = ProductStatus(value)
            setattr(product, field, value)
        
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    async def delete(db: Session, product_id: UUID) -> None:
        """Delete a product."""
        product = db.query(Product).filter(Product.id == product_id).first()
        db.delete(product)
        db.commit()

    @staticmethod
    async def can_deactivate(db: Session, product_id: UUID) -> Tuple[bool, str]:
        """Check if product can be deactivated."""
        # Check for active budget versions
        # This will be implemented when BudgetVersion model exists
        # active_budgets = db.query(BudgetVersion).filter(
        #     BudgetVersion.product_id == product_id,
        #     BudgetVersion.status == 'active'
        # ).count()
        # if active_budgets > 0:
        #     return False, "Product has active budget versions"
        
        # Check for in-progress features
        # in_progress = db.query(Feature).filter(
        #     Feature.product_id == product_id,
        #     Feature.status == 'in_progress'
        # ).count()
        # if in_progress > 0:
        #     return False, "Product has features in progress"
        
        return True, ""

    @staticmethod
    async def can_delete(db: Session, product_id: UUID) -> Tuple[bool, str]:
        """Check if product can be deleted."""
        # Check for any associated budgets
        # budget_count = db.query(BudgetVersion).filter(
        #     BudgetVersion.product_id == product_id
        # ).count()
        # if budget_count > 0:
        #     return False, "Product has associated budget versions"
        
        # Check for any associated features
        # feature_count = db.query(Feature).filter(
        #     Feature.product_id == product_id
        # ).count()
        # if feature_count > 0:
        #     return False, "Product has associated features"
        
        return True, ""

    @staticmethod
    async def _get_team_count(db: Session, product_id: UUID) -> int:
        """Get count of teams working on this product's features."""
        # This will be implemented when Feature and Team models exist
        # return db.query(func.count(func.distinct(Feature.team_id))).filter(
        #     Feature.product_id == product_id
        # ).scalar() or 0
        return 0
```

---

## 6. Database Configuration

```python
# app/database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

```python
# app/config.py

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./safe_train.db"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"


settings = Settings()
```

---

## 7. Main Application

```python
# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import products
from app.database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SAFe Train Manager API",
    description="API for managing SAFe train budgets, capacity, and features",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(products.router)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

---

## 8. File Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── database.py
│   ├── config.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── product.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── product.py
│   ├── routes/
│   │   ├── __init__.py
│   │   └── products.py
│   └── services/
│       ├── __init__.py
│       └── product_service.py
├── alembic/
│   ├── versions/
│   │   └── 001_create_products_table.py
│   └── env.py
├── tests/
│   └── test_products.py
├── requirements.txt
├── .env.example
└── README.md
```

---

## 9. Dependencies

```
# requirements.txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
pydantic==2.5.3
pydantic-settings==2.1.0
alembic==1.13.1
python-dotenv==1.0.0
python-multipart==0.0.6
```

---

## 10. Next Steps

1. **Backend Developer**: Implement the actual files based on this architecture
2. **Add authentication**: Integrate JWT auth when user model is ready
3. **Add tests**: Unit and integration tests for all endpoints
4. **Add logging**: Structured logging for debugging and monitoring
