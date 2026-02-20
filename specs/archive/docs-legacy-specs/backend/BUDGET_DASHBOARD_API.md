# Budget Dashboard - API Design Specification

**Document Version:** 1.0  
**Date:** 2026-01-27  
**Author:** @backend-architect  
**Status:** DRAFT

---

## Overview

This document defines the API endpoints, schemas, and business logic for the Budget Dashboard feature.

---

## API Endpoints

### 1. Get Product Budget Overview

**Endpoint:** `GET /api/budget/dashboard/products`

**Description:** Get all products with budget summaries for a fiscal year

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fiscal_year_id | UUID | Yes | Fiscal year ID |

**Response Schema:**
```json
{
  "fiscal_year": {
    "id": "uuid",
    "year": 2026,
    "is_current": true
  },
  "products": [
    {
      "id": "uuid",
      "name": "Flight Management",
      "short_code": "FM",
      "total_allocated": 14000.0,
      "total_planned": 0.0,
      "total_remaining": 14000.0,
      "utilization_percentage": 0.0,
      "budget_lines_count": 4
    }
  ]
}
```

**Status Codes:**
- 200: Success
- 404: Fiscal year not found

---

### 2. Get Product Budget Detail

**Endpoint:** `GET /api/budget/dashboard/product/{product_id}`

**Description:** Get detailed budget information for a specific product

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| product_id | UUID | Product ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| budget_version_id | UUID | No | Specific budget version (defaults to active) |

**Response Schema:**
```json
{
  "product": {
    "id": "uuid",
    "name": "Flight Management",
    "short_code": "FM"
  },
  "budget_version": {
    "id": "uuid",
    "version_number": 1,
    "is_active": true
  },
  "summary": {
    "total_allocated": 14000.0,
    "total_planned": 0.0,
    "total_remaining": 14000.0,
    "utilization_percentage": 0.0
  },
  "budget_lines": [
    {
      "id": "uuid",
      "code": "MNT",
      "name": "Maintenance",
      "allocated_amount": 2000.0,
      "planned_amount": 0.0,
      "percentage_of_total": 14.3,
      "is_transversal": false
    }
  ]
}
```

**Status Codes:**
- 200: Success
- 404: Product not found

---

### 3. Get Budget Line Detail

**Endpoint:** `GET /api/budget/dashboard/line/{line_id}`

**Description:** Get detailed information for a specific budget line

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| line_id | UUID | Budget line ID |

**Response Schema:**
```json
{
  "budget_line": {
    "id": "uuid",
    "code": "MNT",
    "name": "Maintenance",
    "allocated_amount": 2000.0,
    "is_transversal": false
  },
  "product": {
    "id": "uuid",
    "name": "Flight Management",
    "short_code": "FM"
  },
  "summary": {
    "allocated": 2000.0,
    "planned": 0.0,
    "remaining": 2000.0,
    "utilization_percentage": 0.0
  },
  "categories": [
    {
      "id": "uuid",
      "name": "Onshore",
      "allocated_amount": 1200.0,
      "percentage_of_line": 60.0
    }
  ]
}
```

**Status Codes:**
- 200: Success
- 404: Budget line not found

---

### 4. Get Budget Line Chart Data

**Endpoint:** `GET /api/budget/dashboard/line/{line_id}/chart-data`

**Description:** Get PI-level chart data for target vs actual/forecast

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| line_id | UUID | Budget line ID |

**Response Schema:**
```json
{
  "budget_line": {
    "id": "uuid",
    "code": "MNT",
    "name": "Maintenance",
    "allocated_amount": 2000.0
  },
  "fiscal_year": {
    "id": "uuid",
    "year": 2026,
    "total_iterations": 14
  },
  "chart_data": [
    {
      "pi_id": "uuid",
      "pi_name": "Q1 2026",
      "pi_order": 1,
      "iterations": 4,
      "target_amount": 571.4,
      "planned_amount": 0.0,
      "forecast_amount": 571.4,
      "is_actual": false,
      "variance": -571.4,
      "status": "NOT_STARTED"
    },
    {
      "pi_id": "uuid",
      "pi_name": "Q2 2026",
      "pi_order": 2,
      "iterations": 3,
      "target_amount": 428.6,
      "planned_amount": 0.0,
      "forecast_amount": 428.6,
      "is_actual": false,
      "variance": -428.6,
      "status": "NOT_STARTED"
    }
  ],
  "totals": {
    "total_target": 2000.0,
    "total_planned": 0.0,
    "total_forecast": 2000.0,
    "remaining_budget": 2000.0
  }
}
```

**Status Codes:**
- 200: Success
- 404: Budget line not found

---

## Business Logic Services

### 1. BudgetDashboardService

**Location:** `backend/app/services/budget_dashboard_service.py`

**Methods:**

#### `get_products_overview(db: Session, fiscal_year_id: UUID) -> dict`
- Fetch all products with budget versions for fiscal year
- Calculate total allocated, planned, remaining for each product
- Return product list with summaries

#### `get_product_detail(db: Session, product_id: UUID, budget_version_id: Optional[UUID]) -> dict`
- Fetch product with budget lines
- If no version specified, use active version
- Calculate totals and percentages
- Return detailed product budget info

#### `get_budget_line_detail(db: Session, line_id: UUID) -> dict`
- Fetch budget line with categories
- Calculate summary metrics
- Return detailed line info

#### `get_chart_data(db: Session, line_id: UUID) -> dict`
- Fetch budget line and fiscal year
- Get all PIs for the fiscal year
- Calculate target for each PI
- Fetch planned amounts from PI Planning (if available)
- Calculate forecast for future PIs
- Return chart data array

---

### 2. BudgetCalculationService

**Location:** `backend/app/services/budget_calculation_service.py`

**Methods:**

#### `calculate_pi_target(total_allocation: float, pi_iterations: int, total_iterations: int) -> float`
```python
def calculate_pi_target(total_allocation: float, pi_iterations: int, total_iterations: int) -> float:
    """
    Calculate target budget allocation for a PI based on iteration distribution.
    
    Formula: PI Target = Total Allocation × (PI Iterations / Total Iterations)
    """
    if total_iterations == 0:
        return 0.0
    return total_allocation * (pi_iterations / total_iterations)
```

#### `calculate_pi_forecast(remaining_budget: float, pi_iterations: int, remaining_iterations: int) -> float`
```python
def calculate_pi_forecast(remaining_budget: float, pi_iterations: int, remaining_iterations: int) -> float:
    """
    Calculate forecasted budget for a future PI based on remaining budget.
    
    Formula: PI Forecast = Remaining Budget × (PI Iterations / Remaining Iterations)
    """
    if remaining_iterations == 0:
        return 0.0
    return remaining_budget * (pi_iterations / remaining_iterations)
```

#### `get_pi_status(planned: float, target: float) -> str`
```python
def get_pi_status(planned: float, target: float) -> str:
    """
    Determine PI status based on planned vs target.
    
    Returns:
    - NOT_STARTED: planned = 0
    - ON_TRACK: planned <= target
    - WARNING: planned 100-120% of target
    - OVER_BUDGET: planned > 120% of target
    """
    if planned == 0:
        return "NOT_STARTED"
    
    percentage = (planned / target) * 100 if target > 0 else 0
    
    if percentage <= 100:
        return "ON_TRACK"
    elif percentage <= 120:
        return "WARNING"
    else:
        return "OVER_BUDGET"
```

---

## Data Models (Pydantic Schemas)

### Request Schemas

None required (all GET endpoints with query/path params)

---

### Response Schemas

**Location:** `backend/app/schemas/budget_dashboard.py`

```python
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

class FiscalYearSummary(BaseModel):
    id: UUID
    year: int
    is_current: bool

class ProductSummary(BaseModel):
    id: UUID
    name: str
    short_code: str
    total_allocated: float
    total_planned: float
    total_remaining: float
    utilization_percentage: float
    budget_lines_count: int

class ProductsOverviewResponse(BaseModel):
    fiscal_year: FiscalYearSummary
    products: List[ProductSummary]

class BudgetLineSummary(BaseModel):
    id: UUID
    code: str
    name: str
    allocated_amount: float
    planned_amount: float
    percentage_of_total: float
    is_transversal: bool

class ProductDetailResponse(BaseModel):
    product: dict
    budget_version: dict
    summary: dict
    budget_lines: List[BudgetLineSummary]

class CategorySummary(BaseModel):
    id: UUID
    name: str
    allocated_amount: float
    percentage_of_line: float

class BudgetLineDetailResponse(BaseModel):
    budget_line: dict
    product: dict
    summary: dict
    categories: List[CategorySummary]

class ChartDataPoint(BaseModel):
    pi_id: UUID
    pi_name: str
    pi_order: int
    iterations: int
    target_amount: float
    planned_amount: float
    forecast_amount: float
    is_actual: bool
    variance: float
    status: str

class ChartDataResponse(BaseModel):
    budget_line: dict
    fiscal_year: dict
    chart_data: List[ChartDataPoint]
    totals: dict
```

---

## Database Queries

### Get Products with Budget Summaries

```python
def get_products_with_budgets(db: Session, fiscal_year_id: UUID):
    # Get active budget version for fiscal year
    budget_version = db.query(BudgetVersion).filter(
        BudgetVersion.fiscal_year_id == str(fiscal_year_id),
        BudgetVersion.is_active == True
    ).first()
    
    if not budget_version:
        return []
    
    # Get all product budgets with aggregated data
    products = db.query(
        Product,
        func.sum(BudgetLine.allocated_amount).label('total_allocated'),
        func.count(BudgetLine.id).label('budget_lines_count')
    ).join(
        ProductBudget, Product.id == ProductBudget.product_id
    ).join(
        BudgetLine, ProductBudget.id == BudgetLine.product_budget_id
    ).filter(
        ProductBudget.budget_version_id == str(budget_version.id)
    ).group_by(Product.id).all()
    
    return products
```

### Get Budget Line with PIs

```python
def get_budget_line_with_pis(db: Session, line_id: UUID):
    budget_line = db.query(BudgetLine).filter(
        BudgetLine.id == str(line_id)
    ).first()
    
    if not budget_line:
        return None
    
    # Get fiscal year through budget version
    fiscal_year = db.query(FiscalYear).join(
        BudgetVersion, FiscalYear.id == BudgetVersion.fiscal_year_id
    ).filter(
        BudgetVersion.id == budget_line.budget_version_id
    ).first()
    
    # Get all PIs for fiscal year
    pis = db.query(PI).filter(
        PI.fiscal_year_id == str(fiscal_year.id)
    ).order_by(PI.start_date).all()
    
    return budget_line, fiscal_year, pis
```

---

## Integration Points

### 1. PI Planning Integration (Future)

When PI Planning module is implemented:

```python
def get_planned_amount_for_pi(db: Session, budget_line_id: UUID, pi_id: UUID) -> float:
    """
    Get actual planned amount from PI Planning.
    Sum of all feature budgets assigned to this PI for this budget line.
    """
    # TODO: Implement when PI Planning module is ready
    # Query PIBudgetPlan table or aggregate from feature assignments
    return 0.0
```

### 2. Fiscal Year Configuration

Requires fiscal year to have PIs configured with iteration counts:

```python
def get_pi_iterations(db: Session, pi_id: UUID) -> int:
    """
    Get number of iterations for a PI.
    """
    pi = db.query(PI).filter(PI.id == str(pi_id)).first()
    return pi.iteration_count if pi else 0
```

---

## Error Handling

### Standard Error Response

```json
{
  "detail": "Error message",
  "error_code": "ERROR_CODE",
  "status_code": 400
}
```

### Error Codes

| Code | Description |
|------|-------------|
| FISCAL_YEAR_NOT_FOUND | Fiscal year does not exist |
| PRODUCT_NOT_FOUND | Product does not exist |
| BUDGET_LINE_NOT_FOUND | Budget line does not exist |
| NO_ACTIVE_VERSION | No active budget version for fiscal year |
| NO_PIS_CONFIGURED | No PIs configured for fiscal year |

---

## Performance Considerations

1. **Caching:** Cache fiscal year and PI data (changes infrequently)
2. **Aggregations:** Use database aggregations instead of Python loops
3. **Pagination:** Not needed for MVP (limited data), add if needed
4. **Indexes:** Ensure indexes on foreign keys and filter columns

---

## Testing Requirements

### Unit Tests
- Test calculation functions with various inputs
- Test edge cases (0 iterations, 0 budget, etc.)
- Test status determination logic

### Integration Tests
- Test each endpoint with sample data
- Test with missing data scenarios
- Test with multiple products/lines

---

*API Design Specification Created: 2026-01-27*
