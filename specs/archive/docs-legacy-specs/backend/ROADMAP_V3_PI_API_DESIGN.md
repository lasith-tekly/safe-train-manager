# Roadmap Planning V3 - PI Allocation API Design

**Feature:** PI-Level Budget Allocation API  
**Date:** 2026-01-28  
**Author:** Backend Architect  
**Status:** API Design Specification  
**Priority:** High  
**Version:** 3.0

---

## 1. Architecture Overview

### 1.1 Design Principles
- **RESTful API:** Follow REST conventions
- **Nested Resources:** PI allocations are nested under year allocations
- **Atomic Operations:** Save all PIs together (transaction)
- **Validation:** Backend validates sum = year total
- **Performance:** Efficient queries with eager loading

### 1.2 Technology Stack
- **Framework:** FastAPI
- **ORM:** SQLAlchemy
- **Database:** SQLite (with string UUIDs)
- **Validation:** Pydantic schemas
- **Serialization:** Pydantic models

---

## 2. Database Schema Design

### 2.1 New Table: feature_pi_allocations

```sql
CREATE TABLE feature_pi_allocations (
    id TEXT PRIMARY KEY,
    feature_year_allocation_id TEXT NOT NULL,
    quarter INTEGER NOT NULL,
    budget_amount REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (feature_year_allocation_id) 
        REFERENCES feature_year_allocations(id) 
        ON DELETE CASCADE,
    
    UNIQUE (feature_year_allocation_id, quarter),
    CHECK (quarter >= 1 AND quarter <= 4),
    CHECK (budget_amount >= 0)
);

CREATE INDEX idx_feature_pi_allocations_year_allocation 
    ON feature_pi_allocations(feature_year_allocation_id);
```

### 2.2 Existing Table: feature_year_allocations (No Changes)

```sql
-- Existing table, no schema changes needed
CREATE TABLE feature_year_allocations (
    id TEXT PRIMARY KEY,
    feature_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    budget_amount REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (feature_id) 
        REFERENCES roadmap_features(id) 
        ON DELETE CASCADE,
    
    UNIQUE (feature_id, year)
);
```

### 2.3 Relationships

```
roadmap_features (1) ──< feature_year_allocations (N)
                              │
                              └──< feature_pi_allocations (N)
```

**Cascade Behavior:**
- Delete feature → Delete year allocations → Delete PI allocations
- Delete year allocation → Delete PI allocations

---

## 3. API Endpoints

### 3.1 Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/roadmap/features/{feature_id}/year-allocations/{year_allocation_id}/pi-allocations` | Create/Update PI allocations for a year |
| GET | `/api/roadmap/features/{feature_id}/year-allocations/{year_allocation_id}/pi-allocations` | Get PI allocations for a year |
| DELETE | `/api/roadmap/features/{feature_id}/year-allocations/{year_allocation_id}/pi-allocations` | Delete all PI allocations for a year |
| GET | `/api/roadmap/roadmaps/{roadmap_id}/pi-summary` | Get PI-level budget summary for roadmap |

### 3.2 Detailed Endpoint Specifications

---

#### 3.2.1 Create/Update PI Allocations

**Endpoint:** `POST /api/roadmap/features/{feature_id}/year-allocations/{year_allocation_id}/pi-allocations`

**Description:** Create or update PI allocations for a year. Replaces all existing PI allocations.

**Path Parameters:**
- `feature_id` (UUID): Feature ID
- `year_allocation_id` (UUID): Year allocation ID

**Request Body:**
```json
{
  "pi_allocations": [
    {
      "quarter": 1,
      "budget_amount": 20.0
    },
    {
      "quarter": 2,
      "budget_amount": 50.0
    },
    {
      "quarter": 3,
      "budget_amount": 30.0
    },
    {
      "quarter": 4,
      "budget_amount": 0.0
    }
  ]
}
```

**Request Schema:**
```python
class PIAllocationCreate(BaseModel):
    quarter: int = Field(..., ge=1, le=4)
    budget_amount: float = Field(..., ge=0)

class PIAllocationsRequest(BaseModel):
    pi_allocations: List[PIAllocationCreate]
    
    @validator('pi_allocations')
    def validate_quarters(cls, v):
        quarters = [pi.quarter for pi in v]
        if len(quarters) != len(set(quarters)):
            raise ValueError('Duplicate quarters not allowed')
        return v
```

**Response:** `200 OK`
```json
{
  "year_allocation_id": "uuid",
  "year": 2026,
  "year_budget": 100.0,
  "pi_allocations": [
    {
      "id": "uuid",
      "quarter": 1,
      "budget_amount": 20.0,
      "created_at": "2026-01-28T12:00:00Z",
      "updated_at": "2026-01-28T12:00:00Z"
    },
    {
      "id": "uuid",
      "quarter": 2,
      "budget_amount": 50.0,
      "created_at": "2026-01-28T12:00:00Z",
      "updated_at": "2026-01-28T12:00:00Z"
    },
    {
      "id": "uuid",
      "quarter": 3,
      "budget_amount": 30.0,
      "created_at": "2026-01-28T12:00:00Z",
      "updated_at": "2026-01-28T12:00:00Z"
    },
    {
      "id": "uuid",
      "quarter": 4,
      "budget_amount": 0.0,
      "created_at": "2026-01-28T12:00:00Z",
      "updated_at": "2026-01-28T12:00:00Z"
    }
  ],
  "pi_sum": 100.0,
  "is_valid": true
}
```

**Response Schema:**
```python
class PIAllocationResponse(BaseModel):
    id: UUID
    quarter: int
    budget_amount: float
    created_at: datetime
    updated_at: datetime

class PIAllocationsResponse(BaseModel):
    year_allocation_id: UUID
    year: int
    year_budget: float
    pi_allocations: List[PIAllocationResponse]
    pi_sum: float
    is_valid: bool
```

**Validation Rules:**
1. Sum of PI budgets must equal year budget
2. Each quarter must be 1-4
3. No duplicate quarters
4. Budget amounts must be >= 0

**Error Responses:**

`400 Bad Request` - Invalid sum:
```json
{
  "detail": "PI allocations sum (110.0 KEUR) must equal year budget (100.0 KEUR). Difference: +10.0 KEUR"
}
```

`400 Bad Request` - Duplicate quarters:
```json
{
  "detail": "Duplicate quarters not allowed"
}
```

`404 Not Found` - Year allocation not found:
```json
{
  "detail": "Year allocation not found"
}
```

**Business Logic:**
1. Validate year allocation exists
2. Validate sum of PI budgets = year budget
3. Delete existing PI allocations (if any)
4. Create new PI allocations
5. Use database transaction (all or nothing)

---

#### 3.2.2 Get PI Allocations

**Endpoint:** `GET /api/roadmap/features/{feature_id}/year-allocations/{year_allocation_id}/pi-allocations`

**Description:** Get PI allocations for a specific year allocation

**Path Parameters:**
- `feature_id` (UUID): Feature ID
- `year_allocation_id` (UUID): Year allocation ID

**Response:** `200 OK`
```json
{
  "year_allocation_id": "uuid",
  "year": 2026,
  "year_budget": 100.0,
  "pi_allocations": [
    {
      "id": "uuid",
      "quarter": 1,
      "budget_amount": 20.0,
      "created_at": "2026-01-28T12:00:00Z",
      "updated_at": "2026-01-28T12:00:00Z"
    },
    {
      "id": "uuid",
      "quarter": 2,
      "budget_amount": 50.0,
      "created_at": "2026-01-28T12:00:00Z",
      "updated_at": "2026-01-28T12:00:00Z"
    },
    {
      "id": "uuid",
      "quarter": 3,
      "budget_amount": 30.0,
      "created_at": "2026-01-28T12:00:00Z",
      "updated_at": "2026-01-28T12:00:00Z"
    },
    {
      "id": "uuid",
      "quarter": 4,
      "budget_amount": 0.0,
      "created_at": "2026-01-28T12:00:00Z",
      "updated_at": "2026-01-28T12:00:00Z"
    }
  ],
  "pi_sum": 100.0,
  "is_valid": true
}
```

**Error Responses:**

`404 Not Found`:
```json
{
  "detail": "Year allocation not found"
}
```

---

#### 3.2.3 Delete PI Allocations

**Endpoint:** `DELETE /api/roadmap/features/{feature_id}/year-allocations/{year_allocation_id}/pi-allocations`

**Description:** Delete all PI allocations for a year (revert to year-level only)

**Path Parameters:**
- `feature_id` (UUID): Feature ID
- `year_allocation_id` (UUID): Year allocation ID

**Response:** `204 No Content`

**Error Responses:**

`404 Not Found`:
```json
{
  "detail": "Year allocation not found"
}
```

---

#### 3.2.4 Get PI Summary for Roadmap

**Endpoint:** `GET /api/roadmap/roadmaps/{roadmap_id}/pi-summary`

**Description:** Get PI-level budget summary for entire roadmap (for grid view)

**Path Parameters:**
- `roadmap_id` (UUID): Roadmap ID

**Query Parameters:**
- `budget_line_id` (UUID, optional): Filter by budget line

**Response:** `200 OK`
```json
{
  "roadmap_id": "uuid",
  "budget_line_id": "uuid",
  "budget_line_name": "Product Evolution",
  "quarters": [
    {
      "year": 2026,
      "quarter": 1,
      "allocated_budget": 50.0,
      "planned_budget": 20.0,
      "utilization_percentage": 40.0,
      "remaining_budget": 30.0,
      "status": "under_budget",
      "features": [
        {
          "feature_id": "uuid",
          "feature_name": "BRS Disruption Management",
          "budget_amount": 20.0
        }
      ]
    },
    {
      "year": 2026,
      "quarter": 2,
      "allocated_budget": 80.0,
      "planned_budget": 80.0,
      "utilization_percentage": 100.0,
      "remaining_budget": 0.0,
      "status": "at_capacity",
      "features": [
        {
          "feature_id": "uuid",
          "feature_name": "BRS Disruption Management",
          "budget_amount": 50.0
        },
        {
          "feature_id": "uuid",
          "feature_name": "Test Feature",
          "budget_amount": 30.0
        }
      ]
    }
  ],
  "totals": {
    "total_allocated": 280.0,
    "total_planned": 230.0,
    "total_remaining": 50.0,
    "overall_utilization": 82.1
  }
}
```

**Response Schema:**
```python
class FeaturePISummary(BaseModel):
    feature_id: UUID
    feature_name: str
    budget_amount: float

class QuarterSummary(BaseModel):
    year: int
    quarter: int
    allocated_budget: float
    planned_budget: float
    utilization_percentage: float
    remaining_budget: float
    status: str  # "under_budget", "at_capacity", "over_budget"
    features: List[FeaturePISummary]

class PIRoadmapSummary(BaseModel):
    roadmap_id: UUID
    budget_line_id: Optional[UUID]
    budget_line_name: Optional[str]
    quarters: List[QuarterSummary]
    totals: dict
```

**Status Calculation:**
- `under_budget`: utilization < 90%
- `at_capacity`: utilization >= 90% and <= 100%
- `over_budget`: utilization > 100%

---

## 4. Service Layer Design

### 4.1 PIAllocationService

```python
class PIAllocationService:
    """Service for managing PI-level budget allocations"""
    
    @staticmethod
    def create_or_update_pi_allocations(
        db: Session,
        year_allocation_id: UUID,
        pi_allocations: List[PIAllocationCreate]
    ) -> PIAllocationsResponse:
        """
        Create or update PI allocations for a year allocation.
        Replaces all existing PI allocations.
        """
        pass
    
    @staticmethod
    def get_pi_allocations(
        db: Session,
        year_allocation_id: UUID
    ) -> PIAllocationsResponse:
        """Get PI allocations for a year allocation"""
        pass
    
    @staticmethod
    def delete_pi_allocations(
        db: Session,
        year_allocation_id: UUID
    ) -> bool:
        """Delete all PI allocations for a year allocation"""
        pass
    
    @staticmethod
    def validate_pi_sum(
        pi_allocations: List[PIAllocationCreate],
        year_budget: float
    ) -> Tuple[bool, str]:
        """
        Validate that sum of PI allocations equals year budget.
        Returns (is_valid, error_message)
        """
        pass
    
    @staticmethod
    def get_roadmap_pi_summary(
        db: Session,
        roadmap_id: UUID,
        budget_line_id: Optional[UUID] = None
    ) -> PIRoadmapSummary:
        """Get PI-level budget summary for roadmap"""
        pass
    
    @staticmethod
    def calculate_pi_allocated_budget(
        db: Session,
        year: int,
        quarter: int,
        budget_line_id: UUID
    ) -> float:
        """
        Calculate allocated budget for a PI from Budget Configuration.
        For now, distribute year budget equally across quarters.
        """
        pass
```

### 4.2 Service Implementation Logic

#### create_or_update_pi_allocations

```python
def create_or_update_pi_allocations(
    db: Session,
    year_allocation_id: UUID,
    pi_allocations: List[PIAllocationCreate]
) -> PIAllocationsResponse:
    # 1. Get year allocation
    year_allocation = db.query(FeatureYearAllocation).filter(
        FeatureYearAllocation.id == str(year_allocation_id)
    ).first()
    
    if not year_allocation:
        raise HTTPException(404, "Year allocation not found")
    
    # 2. Validate sum
    pi_sum = sum(pi.budget_amount for pi in pi_allocations)
    is_valid, error_msg = validate_pi_sum(pi_allocations, year_allocation.budget_amount)
    
    if not is_valid:
        raise HTTPException(400, error_msg)
    
    # 3. Delete existing PI allocations
    db.query(FeaturePIAllocation).filter(
        FeaturePIAllocation.feature_year_allocation_id == str(year_allocation_id)
    ).delete()
    
    # 4. Create new PI allocations
    new_pi_allocations = []
    for pi in pi_allocations:
        pi_allocation = FeaturePIAllocation(
            id=str(uuid.uuid4()),
            feature_year_allocation_id=str(year_allocation_id),
            quarter=pi.quarter,
            budget_amount=pi.budget_amount
        )
        db.add(pi_allocation)
        new_pi_allocations.append(pi_allocation)
    
    # 5. Commit transaction
    db.commit()
    
    # 6. Return response
    return PIAllocationsResponse(
        year_allocation_id=year_allocation.id,
        year=year_allocation.year,
        year_budget=year_allocation.budget_amount,
        pi_allocations=[...],
        pi_sum=pi_sum,
        is_valid=True
    )
```

#### get_roadmap_pi_summary

```python
def get_roadmap_pi_summary(
    db: Session,
    roadmap_id: UUID,
    budget_line_id: Optional[UUID] = None
) -> PIRoadmapSummary:
    # 1. Get all features in roadmap
    query = db.query(RoadmapFeature).filter(
        RoadmapFeature.roadmap_id == str(roadmap_id)
    )
    
    if budget_line_id:
        query = query.filter(
            RoadmapFeature.budget_line_id == str(budget_line_id)
        )
    
    features = query.all()
    
    # 2. Get all year allocations with PI allocations
    year_allocations = []
    for feature in features:
        year_allocs = db.query(FeatureYearAllocation).filter(
            FeatureYearAllocation.feature_id == feature.id
        ).options(
            joinedload(FeatureYearAllocation.pi_allocations)
        ).all()
        year_allocations.extend(year_allocs)
    
    # 3. Group by year and quarter
    quarters_dict = {}
    for year_alloc in year_allocations:
        if year_alloc.pi_allocations:
            for pi in year_alloc.pi_allocations:
                key = (year_alloc.year, pi.quarter)
                if key not in quarters_dict:
                    quarters_dict[key] = {
                        'year': year_alloc.year,
                        'quarter': pi.quarter,
                        'features': [],
                        'planned_budget': 0
                    }
                quarters_dict[key]['features'].append({
                    'feature_id': year_alloc.feature.id,
                    'feature_name': year_alloc.feature.name,
                    'budget_amount': pi.budget_amount
                })
                quarters_dict[key]['planned_budget'] += pi.budget_amount
    
    # 4. Calculate allocated budget and utilization for each quarter
    quarters = []
    for (year, quarter), data in sorted(quarters_dict.items()):
        allocated = calculate_pi_allocated_budget(db, year, quarter, budget_line_id)
        planned = data['planned_budget']
        utilization = (planned / allocated * 100) if allocated > 0 else 0
        
        status = 'under_budget'
        if utilization >= 90 and utilization <= 100:
            status = 'at_capacity'
        elif utilization > 100:
            status = 'over_budget'
        
        quarters.append(QuarterSummary(
            year=year,
            quarter=quarter,
            allocated_budget=allocated,
            planned_budget=planned,
            utilization_percentage=utilization,
            remaining_budget=allocated - planned,
            status=status,
            features=data['features']
        ))
    
    # 5. Calculate totals
    total_allocated = sum(q.allocated_budget for q in quarters)
    total_planned = sum(q.planned_budget for q in quarters)
    
    return PIRoadmapSummary(
        roadmap_id=roadmap_id,
        budget_line_id=budget_line_id,
        quarters=quarters,
        totals={
            'total_allocated': total_allocated,
            'total_planned': total_planned,
            'total_remaining': total_allocated - total_planned,
            'overall_utilization': (total_planned / total_allocated * 100) if total_allocated > 0 else 0
        }
    )
```

---

## 5. Data Validation

### 5.1 Backend Validation Rules

**Rule 1: Sum Validation**
```python
def validate_pi_sum(
    pi_allocations: List[PIAllocationCreate],
    year_budget: float
) -> Tuple[bool, str]:
    pi_sum = sum(pi.budget_amount for pi in pi_allocations)
    
    if abs(pi_sum - year_budget) > 0.01:  # Allow 0.01 tolerance for floating point
        diff = pi_sum - year_budget
        sign = '+' if diff > 0 else ''
        return False, f"PI allocations sum ({pi_sum} KEUR) must equal year budget ({year_budget} KEUR). Difference: {sign}{diff} KEUR"
    
    return True, ""
```

**Rule 2: Quarter Validation**
```python
@validator('quarter')
def validate_quarter(cls, v):
    if v < 1 or v > 4:
        raise ValueError('Quarter must be between 1 and 4')
    return v
```

**Rule 3: Budget Amount Validation**
```python
@validator('budget_amount')
def validate_budget_amount(cls, v):
    if v < 0:
        raise ValueError('Budget amount cannot be negative')
    return v
```

**Rule 4: Duplicate Quarter Validation**
```python
@validator('pi_allocations')
def validate_no_duplicate_quarters(cls, v):
    quarters = [pi.quarter for pi in v]
    if len(quarters) != len(set(quarters)):
        raise ValueError('Duplicate quarters not allowed')
    return v
```

---

## 6. Error Handling

### 6.1 Error Response Format

```python
class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
    validation_errors: Optional[List[dict]] = None
```

### 6.2 Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_PI_SUM` | PI allocations don't sum to year budget | 400 |
| `DUPLICATE_QUARTERS` | Duplicate quarters in request | 400 |
| `INVALID_QUARTER` | Quarter not in range 1-4 | 400 |
| `NEGATIVE_BUDGET` | Budget amount is negative | 400 |
| `YEAR_ALLOCATION_NOT_FOUND` | Year allocation doesn't exist | 404 |
| `FEATURE_NOT_FOUND` | Feature doesn't exist | 404 |
| `ROADMAP_NOT_FOUND` | Roadmap doesn't exist | 404 |

---

## 7. Performance Considerations

### 7.1 Database Queries

**Optimization 1: Eager Loading**
```python
# Load year allocations with PI allocations in one query
year_allocations = db.query(FeatureYearAllocation).options(
    joinedload(FeatureYearAllocation.pi_allocations)
).filter(...)
```

**Optimization 2: Batch Operations**
```python
# Delete and create PI allocations in single transaction
with db.begin():
    db.query(FeaturePIAllocation).filter(...).delete()
    db.bulk_save_objects(new_pi_allocations)
```

**Optimization 3: Indexes**
```sql
CREATE INDEX idx_feature_pi_allocations_year_allocation 
    ON feature_pi_allocations(feature_year_allocation_id);
```

### 7.2 Caching Strategy

**Cache PI Summary:**
- Cache key: `roadmap:{roadmap_id}:pi_summary:{budget_line_id}`
- TTL: 5 minutes
- Invalidate on: Feature update, PI allocation update

---

## 8. Security Considerations

### 8.1 Authorization

**Check user has access to roadmap:**
```python
def check_roadmap_access(db: Session, user_id: UUID, roadmap_id: UUID):
    roadmap = db.query(Roadmap).filter(
        Roadmap.id == str(roadmap_id)
    ).first()
    
    if not roadmap:
        raise HTTPException(404, "Roadmap not found")
    
    # Check user has access to product
    # (Implementation depends on auth system)
```

### 8.2 Input Validation

- Sanitize all inputs
- Validate UUIDs format
- Validate numeric ranges
- Prevent SQL injection (use ORM)

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Test Cases:**
1. Create PI allocations with valid sum
2. Create PI allocations with invalid sum (should fail)
3. Create PI allocations with duplicate quarters (should fail)
4. Create PI allocations with negative budget (should fail)
5. Update existing PI allocations
6. Delete PI allocations
7. Get PI allocations for year
8. Get PI summary for roadmap
9. Calculate allocated budget per PI

### 9.2 Integration Tests

**Test Scenarios:**
1. Create feature with year allocation, then add PI allocations
2. Update PI allocations multiple times
3. Delete year allocation (should cascade delete PIs)
4. Delete feature (should cascade delete year and PI allocations)
5. Get PI summary with multiple features
6. Get PI summary filtered by budget line

---

## 10. Migration Strategy

### 10.1 Database Migration

**Alembic Migration:**
```python
def upgrade():
    op.create_table(
        'feature_pi_allocations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('feature_year_allocation_id', sa.String(), nullable=False),
        sa.Column('quarter', sa.Integer(), nullable=False),
        sa.Column('budget_amount', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['feature_year_allocation_id'], ['feature_year_allocations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('feature_year_allocation_id', 'quarter'),
        sa.CheckConstraint('quarter >= 1 AND quarter <= 4'),
        sa.CheckConstraint('budget_amount >= 0')
    )
    op.create_index('idx_feature_pi_allocations_year_allocation', 'feature_pi_allocations', ['feature_year_allocation_id'])

def downgrade():
    op.drop_index('idx_feature_pi_allocations_year_allocation')
    op.drop_table('feature_pi_allocations')
```

### 10.2 Data Migration

**No data migration needed:**
- PI allocations are optional
- Existing features work without PI allocations
- Users can add PI allocations gradually

---

## 11. API Documentation

### 11.1 OpenAPI/Swagger

**Auto-generated from FastAPI:**
- Endpoint descriptions
- Request/response schemas
- Example requests/responses
- Error codes

**Access:** `http://localhost:8000/docs`

---

## 12. Monitoring and Logging

### 12.1 Logging

**Log Events:**
- PI allocations created
- PI allocations updated
- PI allocations deleted
- Validation errors
- Performance metrics

**Log Format:**
```python
logger.info(
    "PI allocations created",
    extra={
        "year_allocation_id": str(year_allocation_id),
        "pi_count": len(pi_allocations),
        "pi_sum": pi_sum,
        "year_budget": year_budget
    }
)
```

### 12.2 Metrics

**Track:**
- API response times
- Validation error rates
- PI allocation creation rate
- Database query performance

---

**End of API Design Document**
