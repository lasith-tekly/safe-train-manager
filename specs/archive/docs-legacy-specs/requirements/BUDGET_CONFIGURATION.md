# Budget Configuration - Requirements Specification

**Status:** DRAFT  
**Version:** 1.0  
**Date:** 2026-01-27  
**Author:** @Product-Manager

---

## 1. Overview

The Budget Configuration feature allows Train Product Managers to set up and manage budget allocations for products. These budget figures serve as guardrails during Roadmap planning, ensuring features are aligned with financial constraints.

---

## 2. Business Context

### 2.1 Budget Hierarchy

Budgets follow a hierarchical structure:

```
Product (e.g., FM - Flight Management)
└── Budget Line (e.g., MNT - Maintenance)
    └── Budget Category (e.g., Software Evolution, Maintenance)
```

### 2.2 Example Structure

```
Flight Management (FM) - 10,000 KEUR
├── MNT (Maintenance) - 5,000 KEUR
│   ├── Software Evolution - 1,000 KEUR
│   └── Maintenance - 4,000 KEUR
├── PE (Product Evolution) - 3,000 KEUR
└── Services - 2,000 KEUR
    ├── Bespoke - 1,000 KEUR
    └── LH CC - 1,000 KEUR
```

### 2.3 Transversal Budget Lines

Some budget lines can be **transversal**, meaning they can be shared across multiple products. This allows for cross-product budget allocation and tracking.

---

## 3. User Stories

### US-001: View Budget Structure

**As a** Train Product Manager  
**I want to** view the budget structure for all products  
**So that** I can understand the current budget allocation hierarchy

**Acceptance Criteria:**
- [ ] Display products with their total allocated budget
- [ ] Show budget lines under each product with allocated amounts
- [ ] Show budget categories under each budget line with allocated amounts
- [ ] Display budget amounts in KEUR format
- [ ] Show percentage of parent budget consumed by each child
- [ ] Indicate transversal budget lines with a visual marker

---

### US-002: Create Budget Line

**As a** Train Product Manager  
**I want to** create a new budget line under a product  
**So that** I can define budget allocation categories

**Acceptance Criteria:**
- [ ] Provide form to enter budget line details (name, code, amount)
- [ ] Allow marking budget line as transversal
- [ ] If transversal, allow selecting multiple products
- [ ] Validate that budget line code is unique within the product
- [ ] Validate that sum of budget lines does not exceed product budget
- [ ] Show warning if allocation exceeds 100% of product budget
- [ ] Save budget line and refresh hierarchy view

**Business Rules:**
- Budget line code must be 2-6 characters, uppercase
- Budget line name is required, max 100 characters
- Budget amount must be >= 0
- Transversal budget lines must be associated with at least 2 products

---

### US-003: Create Budget Category

**As a** Train Product Manager  
**I want to** create budget categories under a budget line  
**So that** I can further break down budget allocations

**Acceptance Criteria:**
- [ ] Provide form to enter category details (name, amount)
- [ ] Validate that sum of categories does not exceed budget line amount
- [ ] Show warning if allocation exceeds 100% of budget line
- [ ] Save category and refresh hierarchy view

**Business Rules:**
- Category name is required, max 100 characters
- Category amount must be >= 0
- Categories are optional (budget line can exist without categories)

---

### US-004: Edit Budget Amounts

**As a** Train Product Manager  
**I want to** edit budget amounts at any level of the hierarchy  
**So that** I can adjust allocations as business needs change

**Acceptance Criteria:**
- [ ] Allow inline editing of budget amounts
- [ ] Validate that child amounts don't exceed parent amount
- [ ] Show warning before saving if validation fails
- [ ] Recalculate percentages after edit
- [ ] Track edit history (who, when, old value, new value)

**Business Rules:**
- Editing parent amount does not automatically adjust child amounts
- System warns if children exceed parent after edit
- All edits are logged for audit purposes

---

### US-005: Delete Budget Item

**As a** Train Product Manager  
**I want to** delete a budget line or category  
**So that** I can remove obsolete budget items

**Acceptance Criteria:**
- [ ] Confirm deletion with user
- [ ] If budget line has categories, warn that all categories will be deleted
- [ ] If budget line has features allocated, prevent deletion and show error
- [ ] Remove item and refresh hierarchy view

**Business Rules:**
- Cannot delete budget line if features are allocated to it
- Deleting budget line deletes all its categories
- Deletion is logged for audit purposes

---

### US-006: Budget Year Management

**As a** Train Product Manager  
**I want to** manage budgets by fiscal year  
**So that** I can plan for different years

**Acceptance Criteria:**
- [ ] Select fiscal year from dropdown
- [ ] View budget structure for selected year
- [ ] Copy budget structure from previous year as starting point
- [ ] Create new year's budget from scratch

**Business Rules:**
- Default view shows current fiscal year
- Budget amounts are year-specific
- Copying from previous year copies structure and amounts

---

### US-007: Budget Summary Dashboard

**As a** Train Product Manager  
**I want to** see a summary of budget allocations  
**So that** I can quickly assess overall budget status

**Acceptance Criteria:**
- [ ] Show total budget across all products
- [ ] Show allocated vs unallocated amounts
- [ ] Show consumption (from features) vs remaining
- [ ] Display visual indicators (progress bars, charts)
- [ ] Filter by product, budget line, or category

---

## 4. Data Model Requirements

### 4.1 Entities

#### Product (existing)
- id (UUID)
- name (string)
- short_code (string)
- status (enum)

#### BudgetLine (new)
- id (UUID)
- product_id (FK to Product) - nullable for transversal
- code (string, 2-6 chars)
- name (string, max 100)
- allocated_amount (decimal, KEUR)
- is_transversal (boolean)
- year (integer)
- created_at, updated_at
- created_by, updated_by

#### BudgetLineProduct (new, for transversal)
- id (UUID)
- budget_line_id (FK)
- product_id (FK)

#### BudgetCategory (new)
- id (UUID)
- budget_line_id (FK)
- name (string, max 100)
- allocated_amount (decimal, KEUR)
- created_at, updated_at
- created_by, updated_by

#### BudgetHistory (new, for audit)
- id (UUID)
- entity_type (enum: PRODUCT, BUDGET_LINE, CATEGORY)
- entity_id (UUID)
- field_changed (string)
- old_value (string)
- new_value (string)
- changed_by (FK to User)
- changed_at (datetime)

### 4.2 Relationships

```
Product (1) ──── (N) BudgetLine (non-transversal)
Product (N) ──── (N) BudgetLine (transversal, via BudgetLineProduct)
BudgetLine (1) ──── (N) BudgetCategory
```

---

## 5. UI Requirements

### 5.1 Location
- Under **Settings** navigation
- New tab: **Budget Configuration**

### 5.2 Layout
- Left panel: Product/Budget hierarchy tree view
- Right panel: Details and edit form for selected item
- Top: Year selector and summary stats

### 5.3 Interactions
- Expand/collapse tree nodes
- Click to select and view details
- Inline edit for amounts
- Context menu for add/delete actions
- Drag-drop for reordering (optional)

### 5.4 Visual Design
- Follow existing design system (Ant Design)
- Use Tree component for hierarchy
- Use InputNumber for amounts with KEUR suffix
- Use Tag for transversal indicator
- Use Progress bar for allocation percentages

---

## 6. API Requirements

### 6.1 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/budget/products | List products with budget summary |
| GET | /api/budget/products/{id}/lines | Get budget lines for product |
| POST | /api/budget/lines | Create budget line |
| PUT | /api/budget/lines/{id} | Update budget line |
| DELETE | /api/budget/lines/{id} | Delete budget line |
| GET | /api/budget/lines/{id}/categories | Get categories for budget line |
| POST | /api/budget/categories | Create category |
| PUT | /api/budget/categories/{id} | Update category |
| DELETE | /api/budget/categories/{id} | Delete category |
| GET | /api/budget/summary | Get budget summary for year |
| POST | /api/budget/copy-year | Copy budget from one year to another |

---

## 7. Validation Rules

1. **Budget Line Code**: Unique within product (or globally for transversal)
2. **Amount Validation**: Sum of children <= parent amount (warning, not blocking)
3. **Transversal Validation**: Must be linked to 2+ products
4. **Delete Validation**: Cannot delete if features are allocated
5. **Year Validation**: Budget year must be valid fiscal year

---

## 8. Integration Points

### 8.1 Roadmap Planning
- Budget lines appear as guardrails in feature planning
- Features consume budget from their assigned budget line
- Warnings when feature allocation exceeds budget

### 8.2 Feature Management
- Features link to budget line and optionally category
- Feature cost calculated and tracked against budget

### 8.3 Reporting
- Budget vs actual reports
- Consumption tracking over time

---

## 9. Out of Scope (v1)

- Automatic budget forecasting
- Multi-currency support (all in KEUR)
- Budget approval workflows
- Integration with external financial systems

---

## 10. Clarifications (Confirmed 2026-01-27)

1. **Budget Amounts**: Whole numbers only (no decimals) - stored as integers in KEUR
2. **Fiscal Year**: Custom fiscal year support (configurable start/end months)
3. **Budget Versioning**: 
   - Multiple approved versions (V1, V2, V3, etc.)
   - New versions created when budget is updated (e.g., V1 in Jan, V2 in Feb)
   - No draft versions in v1 (reserved for future forecasting feature)
4. **Transversal Budget Split**: By percentage or absolute number (user configurable per product)

---

## 11. Version Management Details

### 11.1 Version Creation
- Budget versions are created when significant changes are made
- Each version has: version number, effective date, created by, notes
- Latest version is the active version used for planning

### 11.2 Version History
- All previous versions are retained for audit and comparison
- Users can view historical versions (read-only)
- Users can compare versions to see changes

### 11.3 Version Workflow
```
V1 (Jan 2026) → Budget created
V2 (Feb 2026) → Budget updated with new allocations
V3 (Mar 2026) → Budget adjusted based on actuals
```

---

*Created: 2026-01-27*  
*Updated: 2026-01-27 - Added clarifications and version management*
