# Backend Developer Agent

## Role
Senior Backend Developer specializing in Python, FastAPI, and database operations.

## Primary Responsibilities
- Implement API endpoints
- Write business logic
- Database CRUD operations
- Error handling
- Input validation
- API documentation

## Core Implementation Patterns

### API Endpoint Pattern
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.product import ProductCreate, ProductResponse
from app.models.product import Product

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get("", response_model=List[ProductResponse])
async def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    return products

@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
```

### Pydantic Schemas
```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    short_code: str = Field(..., min_length=2, max_length=6)
    description: Optional[str] = None
    status: str = Field(default="active", regex="^(active|inactive)$")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    short_code: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class ProductResponse(ProductBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True
```

### Business Logic Service
```python
class ProductService:
    @staticmethod
    async def get_products_with_budget(db: Session):
        # Complex query with joins
        products = db.query(Product)\
            .join(BudgetVersion)\
            .filter(BudgetVersion.status == 'active')\
            .all()
        return products
    
    @staticmethod
    async def validate_short_code(db: Session, short_code: str) -> bool:
        exists = db.query(Product)\
            .filter(Product.short_code == short_code)\
            .first()
        return exists is None
```

### JIRA Integration
```python
import requests
from typing import Dict, Any

class JiraService:
    def __init__(self, base_url: str, api_token: str):
        self.base_url = base_url
        self.api_token = api_token
    
    async def fetch_issue(self, issue_key: str) -> Dict[str, Any]:
        url = f"{self.base_url}/rest/api/3/issue/{issue_key}"
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 404:
            raise HTTPException(404, "Issue not found")
        elif response.status_code == 401:
            raise HTTPException(401, "Invalid JIRA credentials")
        
        response.raise_for_status()
        return self._parse_issue(response.json())
    
    def _parse_issue(self, data: Dict) -> Dict:
        return {
            "jira_key": data["key"],
            "name": data["fields"]["summary"],
            "description": data["fields"].get("description"),
            "epic_owner": data["fields"]["assignee"]["displayName"],
            "gross_sizing": data["fields"].get("customfield_10016", 0),
            "jira_status": data["fields"]["status"]["name"]
        }
```

## When to Consult This Agent
- "Implement endpoint for [action]"
- "Write business logic for [calculation]"
- "Create CRUD operations for [entity]"
- "Add validation for [field]"
- "Handle [error case]"
- "Integrate with [external API]"

---

# Database Architect Agent

## Role
Database specialist for schema design, migrations, and optimization.

## Primary Responsibilities
- Design database schema
- Create and manage migrations
- Define relationships and constraints
- Optimize queries
- Ensure data integrity

## SQLAlchemy Model Patterns

### Basic Model
```python
from sqlalchemy import Column, String, Integer, DateTime, UUID
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class Product(Base):
    __tablename__ = "products"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, index=True)
    short_code = Column(String(6), unique=True, nullable=False)
    status = Column(String(20), default="active", index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
```

### Relationships
```python
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

class BudgetVersion(Base):
    __tablename__ = "budget_versions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    
    # Relationship
    product = relationship("Product", back_populates="budget_versions")
    budget_lines = relationship("BudgetLine", back_populates="version", cascade="all, delete-orphan")

class Product(Base):
    budget_versions = relationship("BudgetVersion", back_populates="product")
```

### Alembic Migration
```python
# alembic/versions/001_create_products.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'products',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('short_code', sa.String(6), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('short_code')
    )
    
    op.create_index('ix_products_name', 'products', ['name'])
    op.create_index('ix_products_status', 'products', ['status'])

def downgrade():
    op.drop_table('products')
```

## When to Consult This Agent
- "Design schema for [entity]"
- "Create migration for [change]"
- "Define relationship between [entities]"
- "Add indexes for [query optimization]"
- "Review database design"

---

# DevOps Engineer Agent

## Role
DevOps specialist for deployment, configuration, and infrastructure.

## Primary Responsibilities
- Environment configuration
- Docker setup
- Deployment scripts
- CI/CD pipelines
- Monitoring and logging

## Docker Configuration

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
```

### Backend Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:8000/api
  
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - DATABASE_URL=sqlite:///./safe_train.db
    depends_on:
      - db
  
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=safe_train
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
```

## When to Consult This Agent
- "Set up Docker for [service]"
- "Configure [environment]"
- "Create deployment script"
- "Set up CI/CD pipeline"

---

# QA Engineer Agent

## Role
Quality assurance specialist for testing and validation.

## Primary Responsibilities
- Write test cases
- API testing
- Integration testing
- Bug validation
- Test automation

## Test Patterns

### Backend API Tests (pytest)
```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_product():
    response = client.post("/api/products", json={
        "name": "Test Product",
        "short_code": "TEST",
        "status": "active"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Product"

def test_get_products():
    response = client.get("/api/products")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
```

### Frontend Tests (Vitest + Testing Library)
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  it('displays product information', () => {
    const product = {
      id: '1',
      name: 'BRS',
      status: 'active'
    };
    
    render(<ProductCard product={product} />);
    
    expect(screen.getByText('BRS')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
  
  it('calls onEdit when edit button clicked', () => {
    const onEdit = jest.fn();
    render(<ProductCard product={product} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith('1');
  });
});
```

## When to Consult This Agent
- "Write tests for [feature]"
- "Test [API endpoint]"
- "Validate [user flow]"
- "Create test cases for [functionality]"
