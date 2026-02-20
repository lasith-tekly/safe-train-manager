# Roadmap Planning - Backend API Design

**Feature:** Annual Roadmap Planning  
**Date:** 2026-01-27  
**Author:** Backend Architect  
**Status:** API Design Specification  
**Priority:** High

---

## 1. Architecture Overview

The Roadmap Planning API provides endpoints for creating and managing annual product roadmaps with quarterly feature planning. The API integrates with the Budget Configuration module for budget validation and uses Global Settings for effort-to-budget conversion calculations.

### 1.1 Key Components
- **API Router:** `/api/roadmaps` - RESTful endpoints
- **Service Layer:** `RoadmapService` - Business logic and calculations
- **Data Models:** `Roadmap`, `RoadmapFeature` - SQLAlchemy models
- **Schemas:** Pydantic models for request/response validation
- **Calculations:** Budget-effort conversion formulas

---

## 2. API Endpoints

### 2.1 Roadmap Management

#### GET /api/roadmaps
**Description:** List all roadmaps with filtering

**Query Parameters:**
```typescript
{
  product_id?: string;          // Filter by product
  fiscal_year_id?: string;      // Filter by fiscal year
  status?: 'draft' | 'active' | 'archived';  // Filter by status
  page?: number;                // Pagination (default: 1)
  page_size?: number;           // Page size (default: 20)
}
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "product_name": "BRS",
      "fiscal_year_id": "uuid",
      "fiscal_year_name": "2026",
      "budget_version_id": "uuid",
      "name": "BRS 2026 Roadmap",
      "description": "Annual roadmap for BRS product",
      "status": "active",
      "total_budget_keur": 10000.00,
      "planned_budget_keur": 2500.00,
      "remaining_budget_keur": 7500.00,
      "utilization_percent": 25.0,
      "feature_count": 15,
      "created_by": "uuid",
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-01-20T14:30:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 20
}
```

---

#### GET /api/roadmaps/{roadmap_id}
**Description:** Get roadmap details with all features

**Path Parameters:**
- `roadmap_id`: UUID

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "product_id": "uuid",
  "product_name": "BRS",
  "product_code": "BRS",
  "fiscal_year_id": "uuid",
  "fiscal_year_name": "2026",
  "budget_version_id": "uuid",
  "name": "BRS 2026 Roadmap",
  "description": "Annual roadmap for BRS product",
  "status": "active",
  "created_by": "uuid",
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-20T14:30:00Z",
  "summary": {
    "total_budget_keur": 10000.00,
    "planned_budget_keur": 2500.00,
    "remaining_budget_keur": 7500.00,
    "utilization_percent": 25.0,
    "feature_count": 15,
    "quarterly_totals": {
      "q1": { "effort_days": 80.0, "budget_keur": 80.0 },
      "q2": { "effort_days": 60.0, "budget_keur": 60.0 },
      "q3": { "effort_days": 110.0, "budget_keur": 110.0 },
      "q4": { "effort_days": 50.0, "budget_keur": 50.0 }
    }
  },
  "budget_lines": [
    {
      "budget_line_id": "uuid",
      "budget_line_name": "Product Evolution",
      "allocated_budget_keur": 6000.00,
      "planned_budget_keur": 1200.00,
      "remaining_budget_keur": 4800.00,
      "utilization_percent": 20.0,
      "feature_count": 8,
      "categories": [
        {
          "budget_category_id": "uuid",
          "category_name": "Core Features",
          "allocated_budget_keur": 3000.00,
          "planned_budget_keur": 600.00,
          "remaining_budget_keur": 2400.00,
          "utilization_percent": 20.0,
          "feature_count": 4
        }
      ]
    }
  ],
  "features": [
    {
      "id": "uuid",
      "roadmap_id": "uuid",
      "budget_line_id": "uuid",
      "budget_line_name": "Product Evolution",
      "budget_category_id": "uuid",
      "budget_category_name": "Core Features",
      "name": "Feature A",
      "description": "Enhance product capabilities",
      "priority": 1,
      "status": "planned",
      "total_effort_days": 200.0,
      "total_budget_keur": 200.0,
      "q1_effort_days": 50.0,
      "q1_budget_keur": 50.0,
      "q2_effort_days": 20.0,
      "q2_budget_keur": 20.0,
      "q3_effort_days": 80.0,
      "q3_budget_keur": 80.0,
      "q4_effort_days": 50.0,
      "q4_budget_keur": 50.0,
      "created_by": "uuid",
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-01-20T14:30:00Z"
    }
  ]
}
```

**Error Responses:**
- `404 Not Found` - Roadmap not found
- `403 Forbidden` - User doesn't have access to this roadmap

---

#### POST /api/roadmaps
**Description:** Create a new roadmap

**Request Body:**
```json
{
  "product_id": "uuid",
  "fiscal_year_id": "uuid",
  "budget_version_id": "uuid",
  "name": "BRS 2026 Roadmap",
  "description": "Annual roadmap for BRS product"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "product_id": "uuid",
  "fiscal_year_id": "uuid",
  "budget_version_id": "uuid",
  "name": "BRS 2026 Roadmap",
  "description": "Annual roadmap for BRS product",
  "status": "draft",
  "created_by": "uuid",
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T10:00:00Z"
}
```

**Validation Rules:**
- `product_id` must exist and be active
- `fiscal_year_id` must exist
- `budget_version_id` must exist and be active
- `name` is required (max 200 chars)
- Only one active roadmap per product per fiscal year

**Error Responses:**
- `400 Bad Request` - Validation errors
- `409 Conflict` - Active roadmap already exists for this product/year

---

#### PUT /api/roadmaps/{roadmap_id}
**Description:** Update roadmap details

**Path Parameters:**
- `roadmap_id`: UUID

**Request Body:**
```json
{
  "name": "BRS 2026 Roadmap - Updated",
  "description": "Updated description"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "BRS 2026 Roadmap - Updated",
  "description": "Updated description",
  "updated_at": "2026-01-20T14:30:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Roadmap not found
- `403 Forbidden` - Cannot edit archived roadmap

---

#### PATCH /api/roadmaps/{roadmap_id}/status
**Description:** Change roadmap status

**Path Parameters:**
- `roadmap_id`: UUID

**Request Body:**
```json
{
  "status": "active"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "active",
  "updated_at": "2026-01-20T14:30:00Z"
}
```

**Business Rules:**
- Draft → Active: Validates no over-budget features
- Active → Archived: Archives current active roadmap
- Archived → (any): Not allowed
- Only one active roadmap per product per fiscal year

**Error Responses:**
- `400 Bad Request` - Invalid status transition
- `409 Conflict` - Another active roadmap exists

---

#### DELETE /api/roadmaps/{roadmap_id}
**Description:** Delete a roadmap (soft delete)

**Path Parameters:**
- `roadmap_id`: UUID

**Response:** `204 No Content`

**Business Rules:**
- Can only delete draft roadmaps
- Deletes all associated features
- Creates audit log entry

**Error Responses:**
- `404 Not Found` - Roadmap not found
- `403 Forbidden` - Cannot delete active/archived roadmap

---

### 2.2 Feature Management

#### POST /api/roadmaps/{roadmap_id}/features
**Description:** Add a feature to roadmap

**Path Parameters:**
- `roadmap_id`: UUID

**Request Body:**
```json
{
  "budget_line_id": "uuid",
  "budget_category_id": "uuid",  // Optional
  "name": "Feature A",
  "description": "Enhance product capabilities",
  "priority": 1,
  "q1_effort_days": 50.0,
  "q2_effort_days": 20.0,
  "q3_effort_days": 80.0,
  "q4_effort_days": 50.0
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "roadmap_id": "uuid",
  "budget_line_id": "uuid",
  "budget_line_name": "Product Evolution",
  "budget_category_id": "uuid",
  "budget_category_name": "Core Features",
  "name": "Feature A",
  "description": "Enhance product capabilities",
  "priority": 1,
  "status": "planned",
  "total_effort_days": 200.0,
  "total_budget_keur": 200.0,
  "q1_effort_days": 50.0,
  "q1_budget_keur": 50.0,
  "q2_effort_days": 20.0,
  "q2_budget_keur": 20.0,
  "q3_effort_days": 80.0,
  "q3_budget_keur": 80.0,
  "q4_effort_days": 50.0,
  "q4_budget_keur": 50.0,
  "created_by": "uuid",
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T10:00:00Z"
}
```

**Calculation Logic:**
- `total_effort_days` = q1 + q2 + q3 + q4
- Budget calculated using formula: `Budget = (eD × Structural_Cost_Ratio × Unit_Cost) / eD_per_Year`
- Uses global settings from fiscal year

**Validation Rules:**
- `budget_line_id` must exist and belong to roadmap's budget version
- `budget_category_id` (if provided) must belong to the budget line
- `name` is required (max 300 chars)
- At least one quarter must have effort_days > 0
- All effort_days must be >= 0
- Warns if total budget exceeds available budget

**Error Responses:**
- `400 Bad Request` - Validation errors
- `404 Not Found` - Budget line/category not found
- `409 Conflict` - Budget exceeded (if strict validation enabled)

---

#### PUT /api/roadmaps/{roadmap_id}/features/{feature_id}
**Description:** Update a feature

**Path Parameters:**
- `roadmap_id`: UUID
- `feature_id`: UUID

**Request Body:**
```json
{
  "name": "Feature A - Updated",
  "description": "Updated description",
  "priority": 2,
  "q1_effort_days": 60.0,
  "q2_effort_days": 30.0,
  "q3_effort_days": 70.0,
  "q4_effort_days": 40.0
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Feature A - Updated",
  "total_effort_days": 200.0,
  "total_budget_keur": 200.0,
  "q1_effort_days": 60.0,
  "q1_budget_keur": 60.0,
  // ... other fields
  "updated_at": "2026-01-20T14:30:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Feature not found
- `400 Bad Request` - Validation errors

---

#### PATCH /api/roadmaps/{roadmap_id}/features/{feature_id}/status
**Description:** Update feature status

**Path Parameters:**
- `roadmap_id`: UUID
- `feature_id`: UUID

**Request Body:**
```json
{
  "status": "in_progress"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "in_progress",
  "updated_at": "2026-01-20T14:30:00Z"
}
```

**Valid Status Transitions:**
- Planned → In Progress
- Planned → Cancelled
- In Progress → Completed
- In Progress → Cancelled

---

#### DELETE /api/roadmaps/{roadmap_id}/features/{feature_id}
**Description:** Delete a feature

**Path Parameters:**
- `roadmap_id`: UUID
- `feature_id`: UUID

**Response:** `204 No Content`

**Business Rules:**
- Creates audit log entry
- Updates roadmap summary calculations

**Error Responses:**
- `404 Not Found` - Feature not found

---

#### POST /api/roadmaps/{roadmap_id}/features/reorder
**Description:** Reorder features by priority

**Path Parameters:**
- `roadmap_id`: UUID

**Request Body:**
```json
{
  "feature_ids": ["uuid1", "uuid2", "uuid3"]  // Ordered list
}
```

**Response:** `200 OK`
```json
{
  "message": "Features reordered successfully",
  "updated_count": 3
}
```

**Business Logic:**
- Sets priority based on array index (1, 2, 3, ...)
- Only updates features in the provided list

---

### 2.3 Budget Summary & Calculations

#### GET /api/roadmaps/{roadmap_id}/budget-summary
**Description:** Get detailed budget summary by budget line and category

**Path Parameters:**
- `roadmap_id`: UUID

**Response:** `200 OK`
```json
{
  "roadmap_id": "uuid",
  "total_allocated_budget_keur": 10000.00,
  "total_planned_budget_keur": 2500.00,
  "total_remaining_budget_keur": 7500.00,
  "total_utilization_percent": 25.0,
  "budget_lines": [
    {
      "budget_line_id": "uuid",
      "budget_line_name": "Product Evolution",
      "allocated_budget_keur": 6000.00,
      "planned_budget_keur": 1200.00,
      "remaining_budget_keur": 4800.00,
      "utilization_percent": 20.0,
      "status": "healthy",  // healthy | warning | over_budget
      "feature_count": 8,
      "categories": [
        {
          "budget_category_id": "uuid",
          "category_name": "Core Features",
          "allocated_budget_keur": 3000.00,
          "planned_budget_keur": 600.00,
          "remaining_budget_keur": 2400.00,
          "utilization_percent": 20.0,
          "status": "healthy",
          "feature_count": 4
        }
      ]
    }
  ]
}
```

**Status Calculation:**
- `healthy`: utilization < 80%
- `warning`: 80% <= utilization <= 100%
- `over_budget`: utilization > 100%

---

#### GET /api/roadmaps/{roadmap_id}/quarterly-summary
**Description:** Get quarterly breakdown across all features

**Path Parameters:**
- `roadmap_id`: UUID

**Response:** `200 OK`
```json
{
  "roadmap_id": "uuid",
  "quarters": [
    {
      "quarter": "Q1",
      "total_effort_days": 80.0,
      "total_budget_keur": 80.0,
      "feature_count": 12,
      "budget_lines": [
        {
          "budget_line_id": "uuid",
          "budget_line_name": "Product Evolution",
          "effort_days": 50.0,
          "budget_keur": 50.0,
          "feature_count": 8
        }
      ]
    },
    {
      "quarter": "Q2",
      "total_effort_days": 60.0,
      "total_budget_keur": 60.0,
      "feature_count": 10,
      "budget_lines": [...]
    },
    {
      "quarter": "Q3",
      "total_effort_days": 110.0,
      "total_budget_keur": 110.0,
      "feature_count": 15,
      "budget_lines": [...]
    },
    {
      "quarter": "Q4",
      "total_effort_days": 50.0,
      "total_budget_keur": 50.0,
      "feature_count": 8,
      "budget_lines": [...]
    }
  ]
}
```

---

#### POST /api/roadmaps/calculate-budget
**Description:** Calculate budget from effort days (utility endpoint)

**Request Body:**
```json
{
  "effort_days": 50.0,
  "fiscal_year_id": "uuid"
}
```

**Response:** `200 OK`
```json
{
  "effort_days": 50.0,
  "budget_keur": 49.64,
  "calculation": {
    "unit_cost_keur": 78.0,
    "ed_per_year": 220,
    "structural_cost_ratio": 2.8,
    "formula": "(eD × Structural_Cost_Ratio × Unit_Cost) / eD_per_Year"
  }
}
```

---

#### POST /api/roadmaps/calculate-effort-days
**Description:** Calculate effort days from budget (utility endpoint)

**Request Body:**
```json
{
  "budget_keur": 50.0,
  "fiscal_year_id": "uuid"
}
```

**Response:** `200 OK`
```json
{
  "budget_keur": 50.0,
  "effort_days": 50.37,
  "calculation": {
    "unit_cost_keur": 78.0,
    "ed_per_year": 220,
    "structural_cost_ratio": 2.8,
    "formula": "((Budget / Unit_Cost) × eD_per_Year) / Structural_Cost_Ratio"
  }
}
```

---

## 3. Data Models (SQLAlchemy)

### 3.1 Roadmap Model

```python
class Roadmap(Base):
    __tablename__ = "roadmaps"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    fiscal_year_id = Column(String(36), ForeignKey("fiscal_years.id"), nullable=False)
    budget_version_id = Column(String(36), ForeignKey("budget_versions.id"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum("draft", "active", "archived", name="roadmap_status"), 
                   default="draft", nullable=False)
    created_by = Column(String(36), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    product = relationship("Product", back_populates="roadmaps")
    fiscal_year = relationship("FiscalYear")
    budget_version = relationship("BudgetVersion")
    features = relationship("RoadmapFeature", back_populates="roadmap", 
                          cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index("idx_roadmap_product_year", "product_id", "fiscal_year_id"),
        Index("idx_roadmap_status", "status"),
        UniqueConstraint("product_id", "fiscal_year_id", "status", 
                        name="uq_active_roadmap_per_product_year",
                        postgresql_where=text("status = 'active'")),
    )
```

### 3.2 RoadmapFeature Model

```python
class RoadmapFeature(Base):
    __tablename__ = "roadmap_features"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    roadmap_id = Column(String(36), ForeignKey("roadmaps.id"), nullable=False)
    budget_line_id = Column(String(36), ForeignKey("budget_lines.id"), nullable=False)
    budget_category_id = Column(String(36), ForeignKey("budget_categories.id"), nullable=True)
    name = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Integer, default=0, nullable=False)
    status = Column(Enum("planned", "in_progress", "completed", "cancelled", 
                        name="feature_status"), default="planned", nullable=False)
    
    # Totals (calculated)
    total_effort_days = Column(Numeric(10, 2), default=0, nullable=False)
    total_budget_keur = Column(Numeric(12, 2), default=0, nullable=False)
    
    # Q1
    q1_effort_days = Column(Numeric(10, 2), default=0, nullable=False)
    q1_budget_keur = Column(Numeric(12, 2), default=0, nullable=False)
    
    # Q2
    q2_effort_days = Column(Numeric(10, 2), default=0, nullable=False)
    q2_budget_keur = Column(Numeric(12, 2), default=0, nullable=False)
    
    # Q3
    q3_effort_days = Column(Numeric(10, 2), default=0, nullable=False)
    q3_budget_keur = Column(Numeric(12, 2), default=0, nullable=False)
    
    # Q4
    q4_effort_days = Column(Numeric(10, 2), default=0, nullable=False)
    q4_budget_keur = Column(Numeric(12, 2), default=0, nullable=False)
    
    created_by = Column(String(36), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    roadmap = relationship("Roadmap", back_populates="features")
    budget_line = relationship("BudgetLine")
    budget_category = relationship("BudgetCategory")
    
    # Indexes
    __table_args__ = (
        Index("idx_feature_roadmap", "roadmap_id"),
        Index("idx_feature_budget_line", "budget_line_id"),
        Index("idx_feature_priority", "roadmap_id", "priority"),
    )
```

---

## 4. Pydantic Schemas

### 4.1 Request Schemas

```python
class RoadmapCreate(BaseModel):
    product_id: UUID
    fiscal_year_id: UUID
    budget_version_id: UUID
    name: str = Field(..., max_length=200)
    description: Optional[str] = None

class RoadmapUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None

class RoadmapStatusUpdate(BaseModel):
    status: Literal["draft", "active", "archived"]

class RoadmapFeatureCreate(BaseModel):
    budget_line_id: UUID
    budget_category_id: Optional[UUID] = None
    name: str = Field(..., max_length=300)
    description: Optional[str] = None
    priority: Optional[int] = 0
    q1_effort_days: Decimal = Field(default=0, ge=0)
    q2_effort_days: Decimal = Field(default=0, ge=0)
    q3_effort_days: Decimal = Field(default=0, ge=0)
    q4_effort_days: Decimal = Field(default=0, ge=0)
    
    @validator("q1_effort_days", "q2_effort_days", "q3_effort_days", "q4_effort_days")
    def validate_total_not_zero(cls, v, values):
        # At least one quarter must have effort > 0
        totals = sum([
            values.get("q1_effort_days", 0),
            values.get("q2_effort_days", 0),
            values.get("q3_effort_days", 0),
            values.get("q4_effort_days", 0),
            v
        ])
        if totals == 0:
            raise ValueError("At least one quarter must have effort days > 0")
        return v

class RoadmapFeatureUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=300)
    description: Optional[str] = None
    priority: Optional[int] = None
    q1_effort_days: Optional[Decimal] = Field(None, ge=0)
    q2_effort_days: Optional[Decimal] = Field(None, ge=0)
    q3_effort_days: Optional[Decimal] = Field(None, ge=0)
    q4_effort_days: Optional[Decimal] = Field(None, ge=0)

class FeatureStatusUpdate(BaseModel):
    status: Literal["planned", "in_progress", "completed", "cancelled"]

class FeatureReorderRequest(BaseModel):
    feature_ids: List[UUID]

class BudgetCalculationRequest(BaseModel):
    effort_days: Decimal = Field(..., gt=0)
    fiscal_year_id: UUID

class EffortDaysCalculationRequest(BaseModel):
    budget_keur: Decimal = Field(..., gt=0)
    fiscal_year_id: UUID
```

### 4.2 Response Schemas

```python
class RoadmapSummary(BaseModel):
    total_budget_keur: Decimal
    planned_budget_keur: Decimal
    remaining_budget_keur: Decimal
    utilization_percent: Decimal
    feature_count: int
    quarterly_totals: Dict[str, Dict[str, Decimal]]

class RoadmapFeatureResponse(BaseModel):
    id: UUID
    roadmap_id: UUID
    budget_line_id: UUID
    budget_line_name: str
    budget_category_id: Optional[UUID]
    budget_category_name: Optional[str]
    name: str
    description: Optional[str]
    priority: int
    status: str
    total_effort_days: Decimal
    total_budget_keur: Decimal
    q1_effort_days: Decimal
    q1_budget_keur: Decimal
    q2_effort_days: Decimal
    q2_budget_keur: Decimal
    q3_effort_days: Decimal
    q3_budget_keur: Decimal
    q4_effort_days: Decimal
    q4_budget_keur: Decimal
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class RoadmapResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_name: str
    product_code: str
    fiscal_year_id: UUID
    fiscal_year_name: str
    budget_version_id: UUID
    name: str
    description: Optional[str]
    status: str
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    summary: RoadmapSummary
    budget_lines: List[BudgetLineSummary]
    features: List[RoadmapFeatureResponse]
    
    class Config:
        orm_mode = True
```

---

## 5. Service Layer

### 5.1 RoadmapService

```python
class RoadmapService:
    """Business logic for roadmap management"""
    
    @staticmethod
    def calculate_budget_from_effort(
        effort_days: Decimal,
        fiscal_year_id: str,
        db: Session
    ) -> Decimal:
        """
        Calculate budget from effort days using formula:
        Budget (KEUR) = (eD × Structural_Cost_Ratio × Unit_Cost) / eD_per_Year
        """
        settings = db.query(GlobalSettings).filter(
            GlobalSettings.year == fiscal_year.year
        ).first()
        
        if not settings:
            raise ValueError("Global settings not found for fiscal year")
        
        unit_cost = settings.train_unit_cost_keur
        ed_per_year = settings.effort_days_per_year
        structural_ratio = settings.train_structural_cost_ratio
        
        budget = (effort_days * structural_ratio * unit_cost) / ed_per_year
        return round(budget, 2)
    
    @staticmethod
    def calculate_effort_from_budget(
        budget_keur: Decimal,
        fiscal_year_id: str,
        db: Session
    ) -> Decimal:
        """
        Calculate effort days from budget using inverse formula:
        eD = ((Budget / Unit_Cost) × eD_per_Year) / Structural_Cost_Ratio
        """
        settings = db.query(GlobalSettings).filter(
            GlobalSettings.year == fiscal_year.year
        ).first()
        
        if not settings:
            raise ValueError("Global settings not found for fiscal year")
        
        unit_cost = settings.train_unit_cost_keur
        ed_per_year = settings.effort_days_per_year
        structural_ratio = settings.train_structural_cost_ratio
        
        effort_days = ((budget_keur / unit_cost) * ed_per_year) / structural_ratio
        return round(effort_days, 2)
    
    @staticmethod
    def calculate_feature_totals(
        feature_data: RoadmapFeatureCreate,
        fiscal_year_id: str,
        db: Session
    ) -> Dict[str, Decimal]:
        """Calculate totals and budget for all quarters"""
        total_effort = (
            feature_data.q1_effort_days +
            feature_data.q2_effort_days +
            feature_data.q3_effort_days +
            feature_data.q4_effort_days
        )
        
        q1_budget = RoadmapService.calculate_budget_from_effort(
            feature_data.q1_effort_days, fiscal_year_id, db
        )
        q2_budget = RoadmapService.calculate_budget_from_effort(
            feature_data.q2_effort_days, fiscal_year_id, db
        )
        q3_budget = RoadmapService.calculate_budget_from_effort(
            feature_data.q3_effort_days, fiscal_year_id, db
        )
        q4_budget = RoadmapService.calculate_budget_from_effort(
            feature_data.q4_effort_days, fiscal_year_id, db
        )
        
        total_budget = q1_budget + q2_budget + q3_budget + q4_budget
        
        return {
            "total_effort_days": total_effort,
            "total_budget_keur": total_budget,
            "q1_budget_keur": q1_budget,
            "q2_budget_keur": q2_budget,
            "q3_budget_keur": q3_budget,
            "q4_budget_keur": q4_budget,
        }
    
    @staticmethod
    def get_budget_summary(roadmap_id: str, db: Session) -> Dict:
        """Calculate budget summary for roadmap"""
        roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
        if not roadmap:
            raise ValueError("Roadmap not found")
        
        # Get all budget lines for this budget version
        budget_lines = db.query(BudgetLine).filter(
            BudgetLine.product_budget_id.in_(
                db.query(ProductBudget.id).filter(
                    ProductBudget.budget_version_id == roadmap.budget_version_id,
                    ProductBudget.product_id == roadmap.product_id
                )
            )
        ).all()
        
        # Calculate planned budget per line
        summary = {
            "total_allocated_budget_keur": 0,
            "total_planned_budget_keur": 0,
            "budget_lines": []
        }
        
        for line in budget_lines:
            planned = db.query(func.sum(RoadmapFeature.total_budget_keur)).filter(
                RoadmapFeature.roadmap_id == roadmap_id,
                RoadmapFeature.budget_line_id == line.id
            ).scalar() or 0
            
            line_summary = {
                "budget_line_id": line.id,
                "budget_line_name": line.name,
                "allocated_budget_keur": line.allocated_amount,
                "planned_budget_keur": planned,
                "remaining_budget_keur": line.allocated_amount - planned,
                "utilization_percent": (planned / line.allocated_amount * 100) if line.allocated_amount > 0 else 0,
                "status": RoadmapService._get_budget_status(planned, line.allocated_amount)
            }
            
            summary["budget_lines"].append(line_summary)
            summary["total_allocated_budget_keur"] += line.allocated_amount
            summary["total_planned_budget_keur"] += planned
        
        summary["total_remaining_budget_keur"] = (
            summary["total_allocated_budget_keur"] - summary["total_planned_budget_keur"]
        )
        summary["total_utilization_percent"] = (
            (summary["total_planned_budget_keur"] / summary["total_allocated_budget_keur"] * 100)
            if summary["total_allocated_budget_keur"] > 0 else 0
        )
        
        return summary
    
    @staticmethod
    def _get_budget_status(planned: Decimal, allocated: Decimal) -> str:
        """Determine budget status based on utilization"""
        if allocated == 0:
            return "healthy"
        
        utilization = (planned / allocated) * 100
        
        if utilization > 100:
            return "over_budget"
        elif utilization >= 80:
            return "warning"
        else:
            return "healthy"
    
    @staticmethod
    def validate_budget_allocation(
        roadmap_id: str,
        budget_line_id: str,
        budget_category_id: Optional[str],
        additional_budget: Decimal,
        db: Session
    ) -> Dict[str, Any]:
        """Validate if adding this budget would exceed limits"""
        # Get current planned budget
        query = db.query(func.sum(RoadmapFeature.total_budget_keur)).filter(
            RoadmapFeature.roadmap_id == roadmap_id,
            RoadmapFeature.budget_line_id == budget_line_id
        )
        
        if budget_category_id:
            query = query.filter(RoadmapFeature.budget_category_id == budget_category_id)
        
        current_planned = query.scalar() or 0
        new_planned = current_planned + additional_budget
        
        # Get allocated budget
        if budget_category_id:
            category = db.query(BudgetCategory).filter(
                BudgetCategory.id == budget_category_id
            ).first()
            allocated = category.allocated_amount if category else 0
            entity_name = category.name if category else "Unknown"
        else:
            line = db.query(BudgetLine).filter(BudgetLine.id == budget_line_id).first()
            allocated = line.allocated_amount if line else 0
            entity_name = line.name if line else "Unknown"
        
        remaining = allocated - new_planned
        utilization = (new_planned / allocated * 100) if allocated > 0 else 0
        
        return {
            "valid": remaining >= 0,
            "allocated_budget_keur": allocated,
            "current_planned_keur": current_planned,
            "new_planned_keur": new_planned,
            "remaining_budget_keur": remaining,
            "utilization_percent": utilization,
            "status": RoadmapService._get_budget_status(new_planned, allocated),
            "entity_name": entity_name,
            "warning_message": f"This exceeds available budget by {abs(remaining)} KEUR" if remaining < 0 else None
        }
```

---

## 6. Error Handling

### 6.1 Error Response Format

```json
{
  "detail": "Error message",
  "error_code": "BUDGET_EXCEEDED",
  "field": "q1_effort_days",
  "context": {
    "allocated": 6000.00,
    "planned": 6200.00,
    "exceeded_by": 200.00
  }
}
```

### 6.2 Error Codes

- `ROADMAP_NOT_FOUND` - Roadmap doesn't exist
- `FEATURE_NOT_FOUND` - Feature doesn't exist
- `BUDGET_LINE_NOT_FOUND` - Budget line doesn't exist
- `BUDGET_EXCEEDED` - Planned budget exceeds allocated
- `INVALID_STATUS_TRANSITION` - Cannot change to requested status
- `ACTIVE_ROADMAP_EXISTS` - Another active roadmap exists
- `CANNOT_EDIT_ARCHIVED` - Cannot modify archived roadmap
- `VALIDATION_ERROR` - Input validation failed
- `SETTINGS_NOT_FOUND` - Global settings missing for fiscal year

---

## 7. Performance Considerations

### 7.1 Database Optimization
- Index on `(product_id, fiscal_year_id, status)`
- Index on `(roadmap_id, budget_line_id)` for features
- Use database-level calculations for aggregations
- Implement pagination for large roadmap lists

### 7.2 Caching Strategy
- Cache global settings per fiscal year (1 hour TTL)
- Cache budget line allocations (invalidate on budget update)
- Cache roadmap summaries (invalidate on feature changes)

### 7.3 Query Optimization
- Use `joinedload` for related entities
- Batch calculate budgets for multiple features
- Use database views for complex summaries

---

## 8. Security & Authorization

### 8.1 Access Control
- **Product Managers:** Full access to their product roadmaps
- **Finance Teams:** Read-only access to all roadmaps
- **Leadership:** Read-only access to all roadmaps
- **Developers:** No direct access (view through PI Planning)

### 8.2 Audit Logging
Log all changes:
- Roadmap creation/update/deletion
- Feature creation/update/deletion
- Status changes
- Budget allocations

---

## 9. Integration Points

### 9.1 Budget Configuration Module
- Read budget lines and categories
- Validate budget allocations
- Check budget version status

### 9.2 Global Settings
- Read conversion factors (Unit Cost, eD per Year, Structural Cost Ratio)
- Use fiscal year-specific settings

### 9.3 Products Module
- Link roadmap to product
- Validate product exists and is active

### 9.4 PI Planning Module (Future)
- Export roadmap features to PI planning
- Map quarterly allocations to PI iterations

---

## 10. Testing Requirements

### 10.1 Unit Tests
- Budget calculation formulas
- Effort days calculation formulas
- Budget summary calculations
- Status validation logic

### 10.2 Integration Tests
- Create roadmap with features
- Update feature allocations
- Validate budget constraints
- Status transitions

### 10.3 Performance Tests
- Load roadmap with 100+ features
- Concurrent feature updates
- Budget summary calculation speed

---

**API Design Status:** ✅ Ready for Implementation  
**Next Phase:** Database Architecture  
**Estimated API Effort:** 2 weeks

---

*API design completed: 2026-01-27*  
*Author: Backend Architect*  
*Reviewers: [To be assigned]*
