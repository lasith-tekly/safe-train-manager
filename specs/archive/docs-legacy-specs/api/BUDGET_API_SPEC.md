# Budget Configuration - API Specification

**Status:** DRAFT  
**Version:** 1.0  
**Date:** 2026-01-27  
**Author:** @Backend-Architect

---

## 1. Overview

This document defines the REST API endpoints for the Budget Configuration feature, supporting CRUD operations for fiscal years, budget versions, product budgets, budget lines, and categories.

---

## 2. Base URL

```
/api/budget
```

---

## 3. API Endpoints

### 3.1 Fiscal Years

#### GET /api/budget/fiscal-years

Get all fiscal years.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "year": 2026,
      "start_month": 1,
      "start_day": 1,
      "end_month": 12,
      "end_day": 31,
      "is_current": true,
      "created_at": "2026-01-27T10:00:00Z"
    }
  ]
}
```

---

#### POST /api/budget/fiscal-years

Create a new fiscal year.

**Request:**
```json
{
  "year": 2027,
  "start_month": 4,
  "start_day": 1,
  "end_month": 3,
  "end_day": 31,
  "is_current": false
}
```

**Response:** 201 Created
```json
{
  "data": {
    "id": "uuid",
    "year": 2027,
    "start_month": 4,
    "start_day": 1,
    "end_month": 3,
    "end_day": 31,
    "is_current": false,
    "created_at": "2026-01-27T10:00:00Z"
  }
}
```

**Validation:**
- Year must be unique
- Only one fiscal year can have `is_current = true`
- Month values: 1-12
- Day values: 1-31

---

#### PUT /api/budget/fiscal-years/{id}

Update fiscal year.

**Request:**
```json
{
  "is_current": true
}
```

**Response:** 200 OK

---

### 3.2 Budget Versions

#### GET /api/budget/versions

Get all budget versions for a fiscal year.

**Query Parameters:**
- `fiscal_year_id` (required): UUID

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "fiscal_year_id": "uuid",
      "version_number": 1,
      "effective_date": "2026-01-01",
      "notes": "Initial budget",
      "is_active": true,
      "created_by": {
        "id": "uuid",
        "name": "John Doe"
      },
      "created_at": "2026-01-27T10:00:00Z"
    }
  ]
}
```

---

#### POST /api/budget/versions

Create a new budget version.

**Request:**
```json
{
  "fiscal_year_id": "uuid",
  "effective_date": "2026-02-01",
  "notes": "Updated budget allocations",
  "copy_from_version_id": "uuid"  // Optional: copy from existing version
}
```

**Response:** 201 Created
```json
{
  "data": {
    "id": "uuid",
    "fiscal_year_id": "uuid",
    "version_number": 2,
    "effective_date": "2026-02-01",
    "notes": "Updated budget allocations",
    "is_active": true,
    "created_by": {
      "id": "uuid",
      "name": "John Doe"
    },
    "created_at": "2026-01-27T10:00:00Z"
  }
}
```

**Business Logic:**
- Automatically increments version number
- Sets new version as active, deactivates previous version
- If `copy_from_version_id` provided, copies all budget data from that version

---

#### GET /api/budget/versions/{id}

Get detailed budget version with full hierarchy.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "fiscal_year_id": "uuid",
    "version_number": 1,
    "effective_date": "2026-01-01",
    "notes": "Initial budget",
    "is_active": true,
    "created_by": {
      "id": "uuid",
      "name": "John Doe"
    },
    "created_at": "2026-01-27T10:00:00Z",
    "product_budgets": [
      {
        "id": "uuid",
        "product": {
          "id": "uuid",
          "name": "Flight Management",
          "short_code": "FM"
        },
        "allocated_amount": 10000,
        "consumed_amount": 2500,
        "remaining_amount": 7500,
        "budget_lines": [...]
      }
    ],
    "summary": {
      "total_budget": 25000,
      "total_consumed": 8000,
      "total_remaining": 17000,
      "utilization_percentage": 32
    }
  }
}
```

---

### 3.3 Product Budgets

#### GET /api/budget/products

Get product budgets for active version.

**Query Parameters:**
- `fiscal_year_id` (optional): UUID - defaults to current fiscal year
- `version_id` (optional): UUID - defaults to active version

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "product": {
        "id": "uuid",
        "name": "Flight Management",
        "short_code": "FM"
      },
      "allocated_amount": 10000,
      "consumed_amount": 2500,
      "remaining_amount": 7500,
      "utilization_percentage": 25,
      "budget_lines_count": 3
    }
  ]
}
```

---

#### POST /api/budget/products

Create or update product budget.

**Request:**
```json
{
  "budget_version_id": "uuid",
  "product_id": "uuid",
  "allocated_amount": 10000
}
```

**Response:** 201 Created or 200 OK (if updating)

**Validation:**
- Amount must be >= 0
- Unique per (budget_version_id, product_id)

---

#### GET /api/budget/products/{id}

Get product budget details with budget lines.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "product": {
      "id": "uuid",
      "name": "Flight Management",
      "short_code": "FM"
    },
    "allocated_amount": 10000,
    "consumed_amount": 2500,
    "remaining_amount": 7500,
    "budget_lines": [
      {
        "id": "uuid",
        "code": "MNT",
        "name": "Maintenance",
        "allocated_amount": 5000,
        "consumed_amount": 1200,
        "remaining_amount": 3800,
        "is_transversal": false,
        "categories": [
          {
            "id": "uuid",
            "name": "Software Evolution",
            "allocated_amount": 1000,
            "consumed_amount": 300,
            "remaining_amount": 700
          }
        ]
      }
    ]
  }
}
```

---

### 3.4 Budget Lines

#### POST /api/budget/lines

Create a budget line.

**Request (Non-transversal):**
```json
{
  "product_budget_id": "uuid",
  "code": "MNT",
  "name": "Maintenance",
  "allocated_amount": 5000,
  "is_transversal": false
}
```

**Request (Transversal):**
```json
{
  "code": "SHARED",
  "name": "Shared Services",
  "allocated_amount": 3000,
  "is_transversal": true,
  "product_allocations": [
    {
      "product_budget_id": "uuid",
      "allocation_type": "PERCENTAGE",
      "allocation_value": 60
    },
    {
      "product_budget_id": "uuid",
      "allocation_type": "PERCENTAGE",
      "allocation_value": 40
    }
  ]
}
```

**Response:** 201 Created

**Validation:**
- Code must be 2-10 characters, uppercase
- If transversal, must have at least 2 product allocations
- If allocation_type is PERCENTAGE, sum must equal 100

---

#### PUT /api/budget/lines/{id}

Update budget line.

**Request:**
```json
{
  "name": "Maintenance & Support",
  "allocated_amount": 5500
}
```

**Response:** 200 OK

**Business Logic:**
- Logs change in audit table
- Validates sum of categories doesn't exceed new amount (warning only)

---

#### DELETE /api/budget/lines/{id}

Delete budget line.

**Response:** 204 No Content

**Validation:**
- Cannot delete if features are allocated to this budget line
- Cascades delete to all categories

---

### 3.5 Budget Categories

#### POST /api/budget/categories

Create a budget category.

**Request:**
```json
{
  "budget_line_id": "uuid",
  "name": "Software Evolution",
  "allocated_amount": 1000
}
```

**Response:** 201 Created

**Validation:**
- Sum of categories should not exceed budget line amount (warning)

---

#### PUT /api/budget/categories/{id}

Update budget category.

**Request:**
```json
{
  "name": "Software Evolution & Innovation",
  "allocated_amount": 1200
}
```

**Response:** 200 OK

---

#### DELETE /api/budget/categories/{id}

Delete budget category.

**Response:** 204 No Content

**Validation:**
- Cannot delete if features are allocated to this category

---

### 3.6 Budget Summary & Reports

#### GET /api/budget/summary

Get budget summary for active version.

**Query Parameters:**
- `fiscal_year_id` (optional): UUID - defaults to current fiscal year
- `version_id` (optional): UUID - defaults to active version

**Response:**
```json
{
  "data": {
    "fiscal_year": {
      "id": "uuid",
      "year": 2026
    },
    "version": {
      "id": "uuid",
      "version_number": 1,
      "effective_date": "2026-01-01"
    },
    "total_budget": 25000,
    "total_consumed": 8000,
    "total_remaining": 17000,
    "utilization_percentage": 32,
    "products": [
      {
        "product_id": "uuid",
        "product_name": "Flight Management",
        "allocated": 10000,
        "consumed": 2500,
        "remaining": 7500,
        "utilization": 25
      }
    ],
    "budget_lines": [
      {
        "code": "MNT",
        "name": "Maintenance",
        "allocated": 8000,
        "consumed": 3000,
        "remaining": 5000,
        "utilization": 37.5
      }
    ]
  }
}
```

---

#### GET /api/budget/comparison

Compare two budget versions.

**Query Parameters:**
- `version_id_1` (required): UUID
- `version_id_2` (required): UUID

**Response:**
```json
{
  "data": {
    "version_1": {
      "version_number": 1,
      "effective_date": "2026-01-01"
    },
    "version_2": {
      "version_number": 2,
      "effective_date": "2026-02-01"
    },
    "changes": [
      {
        "entity_type": "PRODUCT_BUDGET",
        "entity_name": "Flight Management",
        "field": "allocated_amount",
        "old_value": 10000,
        "new_value": 12000,
        "change": 2000,
        "change_percentage": 20
      }
    ]
  }
}
```

---

#### GET /api/budget/audit-log

Get audit log for budget changes.

**Query Parameters:**
- `entity_type` (optional): PRODUCT_BUDGET | BUDGET_LINE | CATEGORY
- `entity_id` (optional): UUID
- `start_date` (optional): ISO date
- `end_date` (optional): ISO date
- `changed_by` (optional): User UUID
- `page` (optional): integer, default 1
- `page_size` (optional): integer, default 50

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "entity_type": "BUDGET_LINE",
      "entity_id": "uuid",
      "action": "UPDATE",
      "field_changed": "allocated_amount",
      "old_value": "5000",
      "new_value": "5500",
      "changed_by": {
        "id": "uuid",
        "name": "John Doe"
      },
      "changed_at": "2026-01-27T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total_pages": 3,
    "total_items": 125
  }
}
```

---

## 4. Error Responses

### 4.1 Standard Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Sum of budget line allocations exceeds product budget",
    "details": {
      "product_budget": 10000,
      "budget_lines_sum": 11000,
      "excess": 1000
    }
  }
}
```

### 4.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| NOT_FOUND | 404 | Entity not found |
| CONFLICT | 409 | Duplicate or constraint violation |
| CANNOT_DELETE | 400 | Cannot delete due to dependencies |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |

---

## 5. Validation Rules

### 5.1 Budget Hierarchy Validation

**Warning (non-blocking):**
- Sum of budget lines > product budget
- Sum of categories > budget line amount

**Error (blocking):**
- Transversal budget line without 2+ products
- Percentage allocations not summing to 100
- Negative amounts
- Duplicate codes within scope

### 5.2 Deletion Validation

**Cannot delete if:**
- Budget line has features allocated
- Category has features allocated
- Budget version is not the active version (historical versions are read-only)

---

## 6. Business Logic

### 6.1 Consumed Amount Calculation

Consumed amount is calculated from features allocated to the budget line/category:

```
consumed_amount = SUM(feature.estimated_cost WHERE feature.budget_line_id = budget_line.id)
```

### 6.2 Version Activation

When a new version is created:
1. Previous active version is set to `is_active = false`
2. New version is set to `is_active = true`
3. Version number is auto-incremented

### 6.3 Transversal Budget Split

For transversal budget lines:
- If allocation_type = PERCENTAGE: `product_share = budget_line.amount * (allocation_value / 100)`
- If allocation_type = ABSOLUTE: `product_share = allocation_value`

---

## 7. Performance Considerations

### 7.1 Caching
- Cache active budget version per fiscal year
- Cache product budget summaries
- Invalidate cache on budget updates

### 7.2 Optimization
- Use database views for summary calculations
- Batch load budget hierarchy with joins
- Paginate audit log queries

---

## 8. Security

### 8.1 Authentication
- All endpoints require authentication
- Use JWT tokens for API access

### 8.2 Authorization
- Only Train Product Managers can create/update/delete budgets
- All users can view budgets
- Audit log tracks all changes with user ID

---

*Created: 2026-01-27*
