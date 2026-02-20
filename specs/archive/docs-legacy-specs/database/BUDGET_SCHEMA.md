# Budget Configuration - Database Schema Design

**Status:** DRAFT  
**Version:** 1.0  
**Date:** 2026-01-27  
**Author:** @Database-Architect

---

## 1. Overview

This document defines the database schema for the Budget Configuration feature, supporting hierarchical budget structures with versioning and transversal budget lines.

---

## 2. Schema Design

### 2.1 Entity Relationship Diagram

```
FiscalYear (1) ──── (N) BudgetVersion
BudgetVersion (1) ──── (N) ProductBudget
Product (1) ──── (N) ProductBudget
ProductBudget (1) ──── (N) BudgetLine
BudgetLine (1) ──── (N) BudgetCategory
BudgetLine (N) ──── (N) Product (via BudgetLineProduct for transversal)
BudgetLine (1) ──── (N) BudgetLineAllocation (for transversal split)
```

---

## 3. Table Definitions

### 3.1 fiscal_years

Defines custom fiscal year periods.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| year | INTEGER | NOT NULL, UNIQUE | Fiscal year (e.g., 2026) |
| start_month | INTEGER | NOT NULL | Start month (1-12) |
| start_day | INTEGER | NOT NULL | Start day (1-31) |
| end_month | INTEGER | NOT NULL | End month (1-12) |
| end_day | INTEGER | NOT NULL | End day (1-31) |
| is_current | BOOLEAN | DEFAULT FALSE | Current active fiscal year |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |

**Indexes:**
- `idx_fiscal_years_year` on (year)
- `idx_fiscal_years_current` on (is_current)

**Notes:**
- Only one fiscal year can have `is_current = TRUE` at a time
- Default fiscal year is calendar year (Jan 1 - Dec 31)

---

### 3.2 budget_versions

Tracks budget versions for each fiscal year.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| fiscal_year_id | UUID | FK → fiscal_years, NOT NULL | Associated fiscal year |
| version_number | INTEGER | NOT NULL | Version number (1, 2, 3...) |
| effective_date | DATE | NOT NULL | Date version becomes effective |
| notes | TEXT | NULL | Version notes/description |
| is_active | BOOLEAN | DEFAULT TRUE | Active version flag |
| created_by | UUID | FK → users, NOT NULL | User who created version |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

**Indexes:**
- `idx_budget_versions_fiscal_year` on (fiscal_year_id)
- `idx_budget_versions_active` on (fiscal_year_id, is_active)

**Constraints:**
- UNIQUE (fiscal_year_id, version_number)
- Only one version per fiscal year can have `is_active = TRUE`

**Notes:**
- Latest version is the active version used for planning
- Previous versions retained for audit and comparison

---

### 3.3 product_budgets

Total budget allocated to each product per version.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| budget_version_id | UUID | FK → budget_versions, NOT NULL | Budget version |
| product_id | UUID | FK → products, NOT NULL | Product |
| allocated_amount | INTEGER | NOT NULL, CHECK >= 0 | Amount in KEUR (whole number) |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |

**Indexes:**
- `idx_product_budgets_version` on (budget_version_id)
- `idx_product_budgets_product` on (product_id)

**Constraints:**
- UNIQUE (budget_version_id, product_id)

---

### 3.4 budget_lines

Budget lines under products (e.g., MNT, PE, Services).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| product_budget_id | UUID | FK → product_budgets, NULL | Parent product budget (NULL if transversal) |
| code | VARCHAR(10) | NOT NULL | Budget line code (e.g., MNT, PE) |
| name | VARCHAR(100) | NOT NULL | Budget line name |
| allocated_amount | INTEGER | NOT NULL, CHECK >= 0 | Amount in KEUR (whole number) |
| is_transversal | BOOLEAN | DEFAULT FALSE | Transversal flag |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |
| created_by | UUID | FK → users, NOT NULL | User who created |
| updated_by | UUID | FK → users, NULL | User who last updated |

**Indexes:**
- `idx_budget_lines_product_budget` on (product_budget_id)
- `idx_budget_lines_code` on (code)
- `idx_budget_lines_transversal` on (is_transversal)

**Constraints:**
- If `is_transversal = FALSE`, `product_budget_id` must NOT be NULL
- If `is_transversal = TRUE`, `product_budget_id` must be NULL

**Notes:**
- Non-transversal budget lines belong to one product
- Transversal budget lines can be shared across multiple products

---

### 3.5 budget_line_products

Links transversal budget lines to multiple products.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| budget_line_id | UUID | FK → budget_lines, NOT NULL | Budget line |
| product_budget_id | UUID | FK → product_budgets, NOT NULL | Product budget |
| allocation_type | ENUM | NOT NULL | 'PERCENTAGE' or 'ABSOLUTE' |
| allocation_value | INTEGER | NOT NULL, CHECK >= 0 | Percentage (0-100) or absolute KEUR |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

**Indexes:**
- `idx_budget_line_products_line` on (budget_line_id)
- `idx_budget_line_products_product` on (product_budget_id)

**Constraints:**
- UNIQUE (budget_line_id, product_budget_id)
- If `allocation_type = 'PERCENTAGE'`, `allocation_value` must be 0-100
- Sum of percentage allocations for a budget line should = 100

**Notes:**
- Only used for transversal budget lines
- Defines how budget is split across products

---

### 3.6 budget_categories

Sub-categories under budget lines (e.g., Software Evolution, Maintenance).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| budget_line_id | UUID | FK → budget_lines, NOT NULL | Parent budget line |
| name | VARCHAR(100) | NOT NULL | Category name |
| allocated_amount | INTEGER | NOT NULL, CHECK >= 0 | Amount in KEUR (whole number) |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |
| created_by | UUID | FK → users, NOT NULL | User who created |
| updated_by | UUID | FK → users, NULL | User who last updated |

**Indexes:**
- `idx_budget_categories_line` on (budget_line_id)

**Notes:**
- Categories are optional (budget line can exist without categories)
- Sum of category amounts should not exceed budget line amount (warning, not enforced)

---

### 3.7 budget_audit_log

Audit trail for all budget changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| entity_type | ENUM | NOT NULL | 'PRODUCT_BUDGET', 'BUDGET_LINE', 'CATEGORY' |
| entity_id | UUID | NOT NULL | ID of changed entity |
| action | ENUM | NOT NULL | 'CREATE', 'UPDATE', 'DELETE' |
| field_changed | VARCHAR(50) | NULL | Field name (for UPDATE) |
| old_value | TEXT | NULL | Old value (for UPDATE) |
| new_value | TEXT | NULL | New value (for UPDATE/CREATE) |
| changed_by | UUID | FK → users, NOT NULL | User who made change |
| changed_at | TIMESTAMP | NOT NULL | Change timestamp |

**Indexes:**
- `idx_budget_audit_entity` on (entity_type, entity_id)
- `idx_budget_audit_user` on (changed_by)
- `idx_budget_audit_date` on (changed_at)

---

## 4. Data Integrity Rules

### 4.1 Budget Hierarchy Validation

1. **Product Budget Sum**: Sum of non-transversal budget lines should not exceed product budget (warning)
2. **Category Sum**: Sum of categories should not exceed budget line amount (warning)
3. **Transversal Allocation**: Sum of percentage allocations for transversal budget line should = 100%

### 4.2 Deletion Rules

1. **Cascade Delete**: Deleting budget line deletes all its categories
2. **Prevent Delete**: Cannot delete budget line if features are allocated to it
3. **Soft Delete**: Consider soft delete for audit purposes (add `deleted_at` column)

### 4.3 Version Management

1. **Active Version**: Only one active version per fiscal year
2. **Version Immutability**: Previous versions should be read-only
3. **Version Copy**: New version can be created by copying previous version

---

## 5. Migration Strategy

### 5.1 Initial Setup

1. Create `fiscal_years` table with default calendar year
2. Create `budget_versions` table
3. Create `product_budgets`, `budget_lines`, `budget_categories` tables
4. Create `budget_line_products` for transversal support
5. Create `budget_audit_log` table

### 5.2 Seed Data

```sql
-- Default fiscal year (calendar year)
INSERT INTO fiscal_years (id, year, start_month, start_day, end_month, end_day, is_current)
VALUES (gen_random_uuid(), 2026, 1, 1, 12, 31, TRUE);

-- Initial budget version
INSERT INTO budget_versions (id, fiscal_year_id, version_number, effective_date, notes, is_active, created_by)
VALUES (gen_random_uuid(), <fiscal_year_id>, 1, '2026-01-01', 'Initial budget', TRUE, <user_id>);
```

---

## 6. Example Data Structure

### 6.1 Flight Management (FM) Budget

```
fiscal_years
├── id: fy-2026
├── year: 2026
└── is_current: TRUE

budget_versions
├── id: bv-v1
├── fiscal_year_id: fy-2026
├── version_number: 1
└── is_active: TRUE

product_budgets
├── id: pb-fm
├── budget_version_id: bv-v1
├── product_id: prod-fm
└── allocated_amount: 10000 (KEUR)

budget_lines (non-transversal)
├── id: bl-mnt
├── product_budget_id: pb-fm
├── code: MNT
├── name: Maintenance
├── allocated_amount: 5000
└── is_transversal: FALSE

budget_categories
├── id: bc-se
├── budget_line_id: bl-mnt
├── name: Software Evolution
└── allocated_amount: 1000

├── id: bc-maint
├── budget_line_id: bl-mnt
├── name: Maintenance
└── allocated_amount: 4000
```

---

## 7. Performance Considerations

### 7.1 Indexes
- Add indexes on foreign keys for join performance
- Add composite index on (fiscal_year_id, is_active) for active version lookup
- Add index on (entity_type, entity_id) for audit log queries

### 7.2 Queries
- Use CTEs for hierarchical budget queries
- Cache active budget version to reduce lookups
- Use materialized views for budget summary reports (optional)

---

## 8. Security Considerations

1. **Row-Level Security**: Consider RLS for multi-tenant scenarios
2. **Audit Logging**: All changes logged with user and timestamp
3. **Soft Delete**: Use soft delete to preserve audit trail
4. **Version Control**: Previous versions are read-only

---

*Created: 2026-01-27*
