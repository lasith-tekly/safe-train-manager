# Roadmap Planning - Backend API Design (V2)

**Feature:** Multi-Year Product Roadmap Planning API  
**Date:** 2026-01-28  
**Author:** Backend Architect  
**Status:** API Design Specification (Revised)  
**Priority:** High  
**Version:** 2.0 - Multi-year planning with dynamic budget integration

---

## 1. Overview

The Roadmap Planning API provides endpoints for creating and managing multi-year product roadmaps with year-based feature allocation. The API integrates dynamically with Budget Configuration to provide real-time budget comparison and alerts only for years with allocated budgets.

### Key Changes from V1:
- ❌ ~~Roadmap tied to fiscal_year_id and budget_version_id~~ → ✅ **Roadmap per product only**
- ❌ ~~Quarterly allocation (Q1-Q4)~~ → ✅ **Year-based allocation (2026, 2027, 2028...)**
- ❌ ~~Static budget version~~ → ✅ **Dynamic comparison to LATEST ACTIVE version**
- ✅ **Budget alerts only for years with allocated budget**
- ✅ **Real-time budget configuration integration**

---

## 2. Data Models (Updated)

### 2.1 Roadmap Model (Updated)

```python
class Roadmap(Base):
    """
    Product roadmap (not tied to fiscal year).
    
    A roadmap contains features planned across multiple years.
    Budget comparison uses latest active budget version per year.
    """
    __tablename__ = "roadmaps"
    
    # Primary Key
    id = Column(String(36), primary_key=True)
    
    # Foreign Keys
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    # REMOVED: fiscal_year_id, budget_version_id
    
    # Roadmap Details
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum("draft", "active", "archived"), default="draft")
    
    # Audit Fields
    created_by = Column(String(36), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="roadmaps")
    features = relationship("RoadmapFeature", back_populates="roadmap", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        Index("idx_roadmap_product", "product_id"),
        Index("idx_roadmap_status", "status"),
        # Only one active roadmap per product
        UniqueConstraint("product_id", "status", name="uq_product_active_roadmap", 
                        postgresql_where=text("status = 'active'"))
    )
```

### 2.2 RoadmapFeature Model (Updated)

```python
class RoadmapFeature(Base):
    """
    Feature in a roadmap with budget line/category.
    
    Year-based allocations stored in separate FeatureYearAllocation table.
    """
    __tablename__ = "roadmap_features"
    
    # Primary Key
    id = Column(String(36), primary_key=True)
    
    # Foreign Keys
    roadmap_id = Column(String(36), ForeignKey("roadmaps.id"), nullable=False)
    budget_line_id = Column(String(36), ForeignKey("budget_lines.id"), nullable=False)
    budget_category_id = Column(String(36), ForeignKey("budget_categories.id"), nullable=True)
    
    # Feature Details
    name = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Integer, default=0)
    status = Column(Enum("planned", "in_progress", "completed", "cancelled"), default="planned")
    
    # Totals (Calculated from year allocations)
    total_budget_keur = Column(Numeric(12, 2), default=0)
    total_effort_days = Column(Numeric(10, 2), default=0)
    
    # REMOVED: q1_effort_days, q2_effort_days, etc.
    
    # Audit Fields
    created_by = Column(String(36), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Relationships
    roadmap = relationship("Roadmap", back_populates="features")
    budget_line = relationship("BudgetLine")
    budget_category = relationship("BudgetCategory")
    year_allocations = relationship("FeatureYearAllocation", back_populates="feature", cascade="all, delete-orphan")
    # Future: jira_epics = relationship("JiraEpic", back_populates="feature")
    
    # Indexes
    __table_args__ = (
        Index("idx_feature_roadmap", "roadmap_id"),
        Index("idx_feature_budget_line", "budget_line_id"),
        Index("idx_feature_budget_category", "budget_category_id"),
        Index("idx_feature_priority", "roadmap_id", "priority"),
    )
```

### 2.3 FeatureYearAllocation Model (NEW)

```python
class FeatureYearAllocation(Base):
    """
    Year-based budget allocation for a roadmap feature.
    
    Each feature can have allocations across multiple years (2026, 2027, 2028...).
    Budget and effort days are stored per year.
    """
    __tablename__ = "feature_year_allocations"
    
    # Primary Key
    id = Column(String(36), primary_key=True)
    
    # Foreign Keys
    feature_id = Column(String(36), ForeignKey("roadmap_features.id"), nullable=False)
    
    # Year Allocation
    year = Column(Integer, nullable=False)  # e.g., 2026, 2027
    budget_keur = Column(Numeric(12, 2), default=0, nullable=False)
    effort_days = Column(Numeric(10, 2), default=0, nullable=False)
    
    # Audit Fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Relationships
    feature = relationship("RoadmapFeature", back_populates="year_allocations")
    
    # Constraints
    __table_args__ = (
        # One allocation per feature per year
        UniqueConstraint("feature_id", "year", name="uq_feature_year"),
        Index("idx_allocation_feature", "feature_id"),
        Index("idx_allocation_year", "year"),
    )
```

---

## 3. API Endpoints

### 3.1 Roadmap Endpoints

#### GET /api/roadmaps
**Description:** List all roadmaps with optional filters

**Query Parameters:**
- `product_id` (optional): Filter by product
- `status` (optional): Filter by status (draft, active, archived)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "product_name": "BRS",
      "name": "BRS Roadmap",
      "description": "Multi-year roadmap for BRS",
      "status": "active",
      "feature_count": 15,
      "total_budget_keur": 500.0,
      "years_covered": [2026, 2027, 2028],
      "created_at": "2026-01-28T10:00:00Z",
      "updated_at": "2026-01-28T10:00:00Z"
    }
  ],
  "total": 1
}
```

#### GET /api/roadmaps/{roadmap_id}
**Description:** Get roadmap details with features and year allocations

**Response:**
```json
{
  "id": "uuid",
  "product_id": "uuid",
  "product_name": "BRS",
  "name": "BRS Roadmap",
  "description": "Multi-year roadmap",
  "status": "active",
  "features": [
    {
      "id": "uuid",
      "name": "Feature A",
      "description": "Feature description",
      "budget_line_id": "uuid",
      "budget_line_name": "Product Evolution",
      "budget_category_id": "uuid",
      "budget_category_name": "New Features",
      "priority": 1,
      "status": "planned",
      "total_budget_keur": 100.0,
      "total_effort_days": 112.0,
      "year_allocations": [
        {
          "year": 2026,
          "budget_keur": 50.0,
          "effort_days": 56.0
        },
        {
          "year": 2027,
          "budget_keur": 50.0,
          "effort_days": 56.0
        }
      ]
    }
  ],
  "budget_summary": {
    "2026": {
      "has_budget": true,
      "budget_lines": [
        {
          "budget_line_id": "uuid",
          "budget_line_name": "Product Evolution",
          "allocated_keur": 100.0,
          "planned_keur": 80.0,
          "variance_keur": 20.0,
          "utilization_percent": 80.0,
          "status": "balanced",
          "categories": [
            {
              "budget_category_id": "uuid",
              "budget_category_name": "New Features",
              "allocated_keur": 60.0,
              "planned_keur": 50.0,
              "variance_keur": 10.0,
              "utilization_percent": 83.3,
              "status": "balanced"
            }
          ]
        }
      ]
    },
    "2027": {
      "has_budget": false,
      "planned_keur": 50.0,
      "note": "No budget allocated for this year"
    }
  },
  "created_at": "2026-01-28T10:00:00Z",
  "updated_at": "2026-01-28T10:00:00Z"
}
```

#### POST /api/roadmaps
**Description:** Create a new roadmap

**Request Body:**
```json
{
  "product_id": "uuid",
  "name": "BRS Roadmap",
  "description": "Multi-year roadmap for BRS"
}
```

**Response:** 201 Created
```json
{
  "id": "uuid",
  "product_id": "uuid",
  "name": "BRS Roadmap",
  "status": "draft",
  "created_at": "2026-01-28T10:00:00Z"
}
```

#### PUT /api/roadmaps/{roadmap_id}
**Description:** Update roadmap details

**Request Body:**
```json
{
  "name": "Updated Roadmap Name",
  "description": "Updated description"
}
```

#### POST /api/roadmaps/{roadmap_id}/activate
**Description:** Activate roadmap (sets status to active, archives previous active roadmap for same product)

**Response:** 200 OK

#### POST /api/roadmaps/{roadmap_id}/archive
**Description:** Archive roadmap

**Response:** 200 OK

#### DELETE /api/roadmaps/{roadmap_id}
**Description:** Delete roadmap (only if status is draft)

**Response:** 204 No Content

---

### 3.2 Feature Endpoints

#### POST /api/roadmaps/{roadmap_id}/features
**Description:** Add feature to roadmap with year-based allocations

**Request Body:**
```json
{
  "name": "Feature A",
  "description": "Feature description",
  "budget_line_id": "uuid",
  "budget_category_id": "uuid",
  "priority": 1,
  "year_allocations": [
    {
      "year": 2026,
      "budget_keur": 50.0
    },
    {
      "year": 2027,
      "budget_keur": 50.0
    }
  ]
}
```

**Response:** 201 Created
```json
{
  "id": "uuid",
  "name": "Feature A",
  "total_budget_keur": 100.0,
  "total_effort_days": 112.0,
  "year_allocations": [
    {
      "year": 2026,
      "budget_keur": 50.0,
      "effort_days": 56.0
    },
    {
      "year": 2027,
      "budget_keur": 50.0,
      "effort_days": 56.0
    }
  ],
  "budget_alerts": [
    {
      "year": 2026,
      "budget_line": "Product Evolution",
      "category": "New Features",
      "status": "over_budget",
      "message": "Over budget by 5 KEUR",
      "allocated_keur": 60.0,
      "planned_keur": 65.0
    }
  ]
}
```

#### PUT /api/roadmaps/{roadmap_id}/features/{feature_id}
**Description:** Update feature and year allocations

**Request Body:**
```json
{
  "name": "Updated Feature Name",
  "description": "Updated description",
  "budget_line_id": "uuid",
  "budget_category_id": "uuid",
  "priority": 2,
  "status": "in_progress",
  "year_allocations": [
    {
      "year": 2026,
      "budget_keur": 70.0
    },
    {
      "year": 2027,
      "budget_keur": 30.0
    }
  ]
}
```

**Response:** 200 OK (same structure as POST response)

#### DELETE /api/roadmaps/{roadmap_id}/features/{feature_id}
**Description:** Delete feature

**Response:** 204 No Content

---

### 3.3 Budget Integration Endpoints

#### GET /api/roadmaps/budget-lines
**Description:** Get available budget lines and categories from Budget Configuration (for dropdown selection)

**Query Parameters:**
- `year` (optional): Filter by year to show only budget lines with allocation for that year

**Response:**
```json
{
  "data": [
    {
      "budget_line_id": "uuid",
      "budget_line_name": "Product Evolution",
      "budget_line_code": "product_evolution",
      "categories": [
        {
          "budget_category_id": "uuid",
          "budget_category_name": "New Features",
          "budget_category_code": "new_features"
        }
      ],
      "allocations_by_year": {
        "2026": {
          "fiscal_year_id": "uuid",
          "budget_version_id": "uuid",
          "budget_version_name": "v2",
          "is_active": true,
          "allocated_keur": 100.0
        }
      }
    }
  ]
}
```

#### GET /api/roadmaps/{roadmap_id}/budget-status
**Description:** Get real-time budget status for roadmap (compares to latest active budget versions)

**Response:**
```json
{
  "roadmap_id": "uuid",
  "product_id": "uuid",
  "years": {
    "2026": {
      "has_budget": true,
      "fiscal_year_id": "uuid",
      "budget_version_id": "uuid",
      "budget_version_name": "v2",
      "budget_lines": [
        {
          "budget_line_id": "uuid",
          "budget_line_name": "Product Evolution",
          "allocated_keur": 100.0,
          "planned_keur": 80.0,
          "variance_keur": 20.0,
          "utilization_percent": 80.0,
          "status": "balanced",
          "categories": [
            {
              "budget_category_id": "uuid",
              "budget_category_name": "New Features",
              "allocated_keur": 60.0,
              "planned_keur": 50.0,
              "variance_keur": 10.0,
              "utilization_percent": 83.3,
              "status": "balanced"
            }
          ]
        }
      ],
      "total_allocated_keur": 180.0,
      "total_planned_keur": 150.0,
      "overall_status": "balanced"
    },
    "2027": {
      "has_budget": false,
      "planned_keur": 100.0,
      "note": "No budget allocated for this year"
    }
  }
}
```

---

## 4. Business Logic

### 4.1 Budget Calculation

**Formula (from Global Settings):**
```python
# Budget → Effort Days
effort_days = ((budget_keur / unit_cost) * ed_per_year) / structural_cost_ratio

# Effort Days → Budget
budget_keur = (effort_days * structural_cost_ratio * unit_cost) / ed_per_year
```

**Example:**
- Unit Cost: 78.0 KEUR
- eD per Year: 220
- Structural Cost Ratio: 2.8

```python
# 50 KEUR → eD
effort_days = ((50 / 78) * 220) / 2.8 = 56.41 eD ≈ 56 eD
```

### 4.2 Budget Status Calculation

**Per Year, Per Budget Line/Category:**

```python
def calculate_budget_status(allocated_keur, planned_keur):
    """
    Calculate budget status for a year with allocated budget.
    
    Returns:
        status: "balanced" | "under_planned" | "over_budget"
        variance_keur: allocated - planned
        utilization_percent: (planned / allocated) * 100
    """
    if allocated_keur == 0:
        return {"status": "no_budget", "has_budget": False}
    
    variance = allocated_keur - planned_keur
    utilization = (planned_keur / allocated_keur) * 100
    
    if utilization > 100:
        status = "over_budget"
    elif utilization < 90:  # Configurable threshold
        status = "under_planned"
    else:
        status = "balanced"
    
    return {
        "status": status,
        "variance_keur": variance,
        "utilization_percent": utilization,
        "has_budget": True
    }
```

### 4.3 Latest Active Budget Version Lookup

```python
def get_latest_active_budget_version(db: Session, product_id: str, year: int):
    """
    Get the latest active budget version for a product and year.
    
    Returns:
        BudgetVersion or None if no budget exists for that year
    """
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.year == year).first()
    if not fiscal_year:
        return None
    
    budget_version = db.query(BudgetVersion).filter(
        BudgetVersion.fiscal_year_id == fiscal_year.id,
        BudgetVersion.is_active == True
    ).first()
    
    return budget_version
```

### 4.4 Budget Line Validation

```python
def validate_budget_line(db: Session, budget_line_id: str, budget_category_id: str = None):
    """
    Validate that budget line and category exist and are active.
    
    Raises:
        ValueError if budget line or category is invalid
    """
    budget_line = db.query(BudgetLine).filter(BudgetLine.id == budget_line_id).first()
    if not budget_line:
        raise ValueError(f"Budget line {budget_line_id} not found")
    
    if budget_category_id:
        category = db.query(BudgetCategory).filter(
            BudgetCategory.id == budget_category_id,
            BudgetCategory.budget_line_id == budget_line_id
        ).first()
        if not category:
            raise ValueError(f"Budget category {budget_category_id} not found or not in budget line")
```

---

## 5. Service Layer

### 5.1 RoadmapService

```python
class RoadmapService:
    """Service for roadmap operations."""
    
    @staticmethod
    def create_roadmap(db: Session, product_id: str, name: str, description: str, created_by: str):
        """Create a new roadmap for a product."""
        roadmap = Roadmap(
            product_id=product_id,
            name=name,
            description=description,
            created_by=created_by
        )
        db.add(roadmap)
        db.commit()
        db.refresh(roadmap)
        return roadmap
    
    @staticmethod
    def get_roadmap_with_budget_status(db: Session, roadmap_id: str):
        """
        Get roadmap with features and real-time budget status.
        
        Compares to latest active budget versions per year.
        """
        roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
        if not roadmap:
            raise ValueError("Roadmap not found")
        
        # Get all years covered by features
        years = set()
        for feature in roadmap.features:
            for allocation in feature.year_allocations:
                years.add(allocation.year)
        
        # Calculate budget status per year
        budget_summary = {}
        for year in sorted(years):
            budget_version = get_latest_active_budget_version(db, roadmap.product_id, year)
            
            if budget_version:
                # Year has budget - calculate status
                budget_summary[year] = calculate_year_budget_status(
                    db, roadmap, year, budget_version
                )
            else:
                # Year has no budget - planning only
                planned_total = sum(
                    allocation.budget_keur
                    for feature in roadmap.features
                    for allocation in feature.year_allocations
                    if allocation.year == year
                )
                budget_summary[year] = {
                    "has_budget": False,
                    "planned_keur": planned_total,
                    "note": "No budget allocated for this year"
                }
        
        return {
            "roadmap": roadmap,
            "budget_summary": budget_summary
        }
    
    @staticmethod
    def activate_roadmap(db: Session, roadmap_id: str):
        """
        Activate roadmap.
        
        Archives any existing active roadmap for the same product.
        """
        roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
        if not roadmap:
            raise ValueError("Roadmap not found")
        
        # Archive existing active roadmap for this product
        existing_active = db.query(Roadmap).filter(
            Roadmap.product_id == roadmap.product_id,
            Roadmap.status == "active",
            Roadmap.id != roadmap_id
        ).first()
        
        if existing_active:
            existing_active.status = "archived"
        
        roadmap.status = "active"
        db.commit()
        return roadmap
```

### 5.2 FeatureService

```python
class FeatureService:
    """Service for roadmap feature operations."""
    
    @staticmethod
    def create_feature(db: Session, roadmap_id: str, feature_data: dict, created_by: str):
        """
        Create feature with year-based allocations.
        
        Returns feature with budget alerts.
        """
        # Validate budget line and category
        validate_budget_line(
            db,
            feature_data["budget_line_id"],
            feature_data.get("budget_category_id")
        )
        
        # Create feature
        feature = RoadmapFeature(
            roadmap_id=roadmap_id,
            name=feature_data["name"],
            description=feature_data.get("description"),
            budget_line_id=feature_data["budget_line_id"],
            budget_category_id=feature_data.get("budget_category_id"),
            priority=feature_data.get("priority", 0),
            created_by=created_by
        )
        db.add(feature)
        db.flush()
        
        # Create year allocations
        total_budget = 0
        total_effort = 0
        
        for year_data in feature_data["year_allocations"]:
            year = year_data["year"]
            budget_keur = year_data["budget_keur"]
            effort_days = calculate_effort_days(db, budget_keur)
            
            allocation = FeatureYearAllocation(
                feature_id=feature.id,
                year=year,
                budget_keur=budget_keur,
                effort_days=effort_days
            )
            db.add(allocation)
            
            total_budget += budget_keur
            total_effort += effort_days
        
        # Update feature totals
        feature.total_budget_keur = total_budget
        feature.total_effort_days = total_effort
        
        db.commit()
        db.refresh(feature)
        
        # Calculate budget alerts
        alerts = calculate_feature_budget_alerts(db, feature)
        
        return {
            "feature": feature,
            "budget_alerts": alerts
        }
```

---

## 6. Error Handling

### 6.1 Error Responses

```json
{
  "detail": "Error message",
  "error_code": "BUDGET_LINE_NOT_FOUND",
  "context": {
    "budget_line_id": "uuid"
  }
}
```

### 6.2 Error Codes

- `ROADMAP_NOT_FOUND`: Roadmap does not exist
- `FEATURE_NOT_FOUND`: Feature does not exist
- `BUDGET_LINE_NOT_FOUND`: Budget line does not exist or has been deleted
- `BUDGET_CATEGORY_NOT_FOUND`: Budget category does not exist
- `BUDGET_CATEGORY_MISMATCH`: Category does not belong to selected budget line
- `ACTIVE_ROADMAP_EXISTS`: Cannot activate - another roadmap is already active for this product
- `CANNOT_DELETE_ACTIVE`: Cannot delete active roadmap
- `OVER_BUDGET`: Feature allocation exceeds available budget (warning, not blocking)

---

## 7. Performance Considerations

### 7.1 Caching
- Cache budget configuration data (budget lines, categories)
- Invalidate cache when budget configuration changes
- Cache global settings for conversion factors

### 7.2 Indexes
- Index on `roadmap_features.roadmap_id` for fast feature lookup
- Index on `feature_year_allocations.feature_id` for fast allocation lookup
- Index on `feature_year_allocations.year` for year-based queries
- Composite index on `(product_id, status)` for active roadmap lookup

### 7.3 Query Optimization
- Use eager loading for relationships (joinedload)
- Batch budget status calculations
- Minimize database round-trips

---

## 8. Future Enhancements (Out of Scope)

- ❌ JIRA Epic integration (provision in schema: `jira_epics` relationship)
- ❌ WebSocket notifications for budget configuration changes
- ❌ Budget forecasting API
- ❌ Roadmap comparison API
- ❌ Export API (Excel, PDF)
- ❌ Roadmap templates

---

## 9. Migration Strategy

### 9.1 Database Migration

```sql
-- Step 1: Add new FeatureYearAllocation table
CREATE TABLE feature_year_allocations (
    id VARCHAR(36) PRIMARY KEY,
    feature_id VARCHAR(36) NOT NULL REFERENCES roadmap_features(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    budget_keur NUMERIC(12, 2) NOT NULL DEFAULT 0,
    effort_days NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_feature_year UNIQUE (feature_id, year)
);

CREATE INDEX idx_allocation_feature ON feature_year_allocations(feature_id);
CREATE INDEX idx_allocation_year ON feature_year_allocations(year);

-- Step 2: Migrate existing quarterly data to year-based (if V1 was deployed)
-- This would convert Q1-Q4 allocations to single year allocation
-- (Skip if V1 was never deployed)

-- Step 3: Update Roadmap table
ALTER TABLE roadmaps DROP COLUMN fiscal_year_id;
ALTER TABLE roadmaps DROP COLUMN budget_version_id;

-- Step 4: Remove quarterly columns from RoadmapFeature
ALTER TABLE roadmap_features DROP COLUMN q1_effort_days;
ALTER TABLE roadmap_features DROP COLUMN q1_budget_keur;
ALTER TABLE roadmap_features DROP COLUMN q2_effort_days;
ALTER TABLE roadmap_features DROP COLUMN q2_budget_keur;
ALTER TABLE roadmap_features DROP COLUMN q3_effort_days;
ALTER TABLE roadmap_features DROP COLUMN q3_budget_keur;
ALTER TABLE roadmap_features DROP COLUMN q4_effort_days;
ALTER TABLE roadmap_features DROP COLUMN q4_budget_keur;
```

---

## 10. Testing Requirements

### 10.1 Unit Tests
- Budget calculation formulas
- Budget status calculation logic
- Latest active budget version lookup
- Feature validation

### 10.2 Integration Tests
- Create roadmap with features
- Update feature year allocations
- Activate/archive roadmap
- Budget status calculation with real budget data
- Handle deleted budget lines

### 10.3 Edge Cases
- Year with no budget allocation
- Budget line deleted after feature creation
- Multiple budget versions for same year
- Feature with allocations spanning 5+ years

---

**API Design Status:** ✅ Ready for Database Schema Design  
**Next Phase:** Database Schema Design (Phase 4)  
**Estimated Effort:** 2-3 days for backend implementation

---

*API design created: 2026-01-28*  
*Author: Backend Architect*  
*Version: 2.0 - Multi-year planning with dynamic budget integration*
