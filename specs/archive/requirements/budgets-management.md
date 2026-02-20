# Budgets Management - Requirements Specification

**Document Version:** 1.0  
**Created:** 2026-01-15  
**Author:** Product Manager Agent  
**Status:** Draft  

---

## 1. Overview

### 1.1 Purpose
The Budgets Management feature enables Train Product Managers to configure and manage budget versions for each product, including budget lines (Product Evolution, Maintenance, Implementation, Bespoke) that track financial allocations and consumption throughout the fiscal year.

### 1.2 Scope
- Budget version management (create, view, copy, activate)
- Budget line configuration with allocations
- Budget consumption tracking
- Version history and comparison

### 1.3 Key Personas
- **Train Product Manager** (primary) - Creates and manages budget versions
- **Epic Owners** - View budget consumption for their features
- **Finance** - Review budget allocations and reports

---

## 2. User Stories

### US-BM-001: View Budget Versions
**As a** Train Product Manager  
**I want to** view all budget versions for a product and year  
**So that** I can track budget history and see the active version

**Acceptance Criteria:**
- [ ] Filter by Product dropdown (required)
- [ ] Filter by Year dropdown (default: current year)
- [ ] Version history table shows: Version name, Created date, Status, Total Budget, Actions
- [ ] Active version highlighted with indicator (●)
- [ ] Archived versions shown in gray
- [ ] Empty state when no versions exist

**Priority:** High

---

### US-BM-002: View Budget Allocation
**As a** Train Product Manager  
**I want to** view the budget allocation breakdown for the active version  
**So that** I can see how budget is distributed across budget lines

**Acceptance Criteria:**
- [ ] Shows only when an active version exists
- [ ] Displays each budget line with: Name, Allocated amount, Consumed amount, Remaining amount
- [ ] Progress bar for each line showing consumption percentage
- [ ] Color coding: Green (<80%), Yellow (80-89%), Red (≥90%)
- [ ] Warning icon (⚠️) for lines approaching/exceeding budget
- [ ] Total row at bottom with aggregated values
- [ ] Edit and Lock buttons in section header

**Priority:** High

---

### US-BM-003: Create New Budget Version
**As a** Train Product Manager  
**I want to** create a new budget version  
**So that** I can define budget allocations for a new planning cycle

**Acceptance Criteria:**
- [ ] "New Version" button opens side panel
- [ ] Form fields: Version Name*, Notes, Status (Draft/Active)
- [ ] Budget Lines section with editable amounts
- [ ] Default budget lines: Product Evolution, Maintenance, Implementation, Bespoke
- [ ] Ability to add custom budget lines
- [ ] Total calculated automatically
- [ ] Save creates version and refreshes list
- [ ] Only one version can be Active at a time

**Priority:** High

---

### US-BM-004: Copy Existing Version
**As a** Train Product Manager  
**I want to** copy an existing budget version  
**So that** I can create a new version based on previous allocations

**Acceptance Criteria:**
- [ ] "Copy" action available on archived versions
- [ ] Opens side panel pre-populated with copied data
- [ ] Version name auto-generated (e.g., "Copy of 2026 v2")
- [ ] Status defaults to Draft
- [ ] All budget line amounts copied
- [ ] User can modify before saving

**Priority:** Medium

---

### US-BM-005: Edit Budget Version
**As a** Train Product Manager  
**I want to** edit an existing budget version  
**So that** I can adjust allocations as planning evolves

**Acceptance Criteria:**
- [ ] Edit available for Draft and Active versions
- [ ] Cannot edit Locked versions
- [ ] Side panel shows current values
- [ ] Can modify: Version name, Notes, Budget line amounts, Status
- [ ] Changing status to Active deactivates current active version
- [ ] Save updates version and refreshes display

**Priority:** High

---

### US-BM-006: Lock Budget Version
**As a** Train Product Manager  
**I want to** lock a budget version  
**So that** it cannot be accidentally modified

**Acceptance Criteria:**
- [ ] Lock action available on Active versions
- [ ] Confirmation dialog before locking
- [ ] Locked versions cannot be edited
- [ ] Locked status shown with lock icon
- [ ] Can still view locked version details

**Priority:** Medium

---

### US-BM-007: Activate Budget Version
**As a** Train Product Manager  
**I want to** activate a draft budget version  
**So that** it becomes the official budget for tracking

**Acceptance Criteria:**
- [ ] Activate action available on Draft versions
- [ ] Confirmation if another version is currently active
- [ ] Previous active version automatically archived
- [ ] New version becomes active immediately
- [ ] Budget allocation section updates to show new active version

**Priority:** High

---

### US-BM-008: View Version Details
**As a** Train Product Manager  
**I want to** view detailed information about any budget version  
**So that** I can review historical allocations

**Acceptance Criteria:**
- [ ] "View" action opens read-only side panel
- [ ] Shows all version details and budget lines
- [ ] Shows consumption data if version was ever active
- [ ] Close button returns to main view

**Priority:** Low

---

## 3. Business Rules

### BR-BM-001: Single Active Version
Only one budget version can be Active per product per year. Activating a new version automatically archives the current active version.

### BR-BM-002: Version Status Flow
- Draft → Active → Locked
- Draft → Archived (manual)
- Active → Archived (when new version activated)
- Active → Locked (manual)
- Locked versions cannot be modified or reactivated

### BR-BM-003: Budget Line Requirements
Every budget version must have at least one budget line with amount > 0.

### BR-BM-004: Consumption Tracking
Consumption is calculated from features assigned to each budget line. Consumption cannot exceed allocated amount (warning only, not blocked).

### BR-BM-005: Version Naming
Version names must be unique within a product and year combination.

### BR-BM-006: Default Budget Lines
New versions include four default budget lines:
- Product Evolution
- Maintenance
- Implementation
- Bespoke

### BR-BM-007: Locked Version Protection
Locked versions cannot be edited, deleted, or have their status changed.

### BR-BM-008: Year Constraint
Budget versions are associated with a fiscal year. A product can have multiple versions per year.

---

## 4. Data Model Requirements

### 4.1 BudgetVersion Entity

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Unique identifier |
| `product_id` | UUID | FK to Product, required | Associated product |
| `year` | Integer | Required, 2020-2100 | Fiscal year |
| `name` | String | Required, max 100 chars | Version name |
| `notes` | Text | Optional, max 1000 chars | Version notes |
| `status` | Enum | Required | Values: 'draft', 'active', 'archived', 'locked' |
| `total_budget` | Decimal | Calculated | Sum of budget line amounts |
| `created_at` | Timestamp | Auto-generated | Creation timestamp |
| `updated_at` | Timestamp | Auto-updated | Last modification |
| `created_by` | UUID | FK to User | User who created |

### 4.2 BudgetLine Entity

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Unique identifier |
| `version_id` | UUID | FK to BudgetVersion, required | Parent version |
| `name` | String | Required, max 100 chars | Budget line name |
| `allocated_amount` | Decimal | Required, ≥ 0 | Allocated budget (KEUR) |
| `display_order` | Integer | Default 0 | Sort order |
| `created_at` | Timestamp | Auto-generated | Creation timestamp |

### 4.3 Relationships

| Relationship | Type | Description |
|--------------|------|-------------|
| Product → BudgetVersion | One-to-Many | A product has multiple budget versions |
| BudgetVersion → BudgetLine | One-to-Many | A version has multiple budget lines |
| BudgetLine → Feature | One-to-Many | Features consume from budget lines |

### 4.4 Indexes
- Index on `product_id` + `year` for filtering
- Index on `status` for active version lookup
- Unique index on `product_id` + `year` + `name`

---

## 5. Validation Rules

### 5.1 Version Name
| Rule | Validation | Error Message |
|------|------------|---------------|
| Required | Not empty | "Version name is required" |
| Length | 1-100 characters | "Version name must be between 1 and 100 characters" |
| Unique | Unique per product+year | "A version with this name already exists for this product and year" |

### 5.2 Year
| Rule | Validation | Error Message |
|------|------------|---------------|
| Required | Not empty | "Year is required" |
| Range | 2020-2100 | "Year must be between 2020 and 2100" |

### 5.3 Budget Line Amount
| Rule | Validation | Error Message |
|------|------------|---------------|
| Required | Not empty | "Amount is required" |
| Non-negative | ≥ 0 | "Amount cannot be negative" |
| Format | Decimal with max 2 places | "Amount must be a valid number" |

### 5.4 Status Transitions
| Rule | Validation | Error Message |
|------|------------|---------------|
| Lock only active | Status must be 'active' | "Only active versions can be locked" |
| Edit not locked | Status must not be 'locked' | "Locked versions cannot be edited" |

---

## 6. API Endpoints

### 6.1 Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets/versions` | List versions (filter by product, year) |
| GET | `/api/budgets/versions/{id}` | Get single version with lines |
| POST | `/api/budgets/versions` | Create new version |
| PUT | `/api/budgets/versions/{id}` | Update version |
| POST | `/api/budgets/versions/{id}/copy` | Copy version |
| POST | `/api/budgets/versions/{id}/activate` | Activate version |
| POST | `/api/budgets/versions/{id}/lock` | Lock version |
| DELETE | `/api/budgets/versions/{id}` | Delete draft version |

### 6.2 Request/Response Examples

**GET /api/budgets/versions?product_id=uuid&year=2026**
```json
{
  "data": [
    {
      "id": "uuid-1",
      "product_id": "product-uuid",
      "year": 2026,
      "name": "2026 v3",
      "status": "active",
      "total_budget": 4500.00,
      "created_at": "2026-01-10T00:00:00Z",
      "budget_lines": [
        {
          "id": "line-uuid-1",
          "name": "Product Evolution",
          "allocated_amount": 1500.00,
          "consumed_amount": 780.00,
          "remaining_amount": 720.00,
          "consumption_percentage": 52.0
        }
      ]
    }
  ],
  "total": 3
}
```

**POST /api/budgets/versions**
```json
{
  "product_id": "product-uuid",
  "year": 2026,
  "name": "2026 v4",
  "notes": "Q2 revision",
  "status": "draft",
  "budget_lines": [
    { "name": "Product Evolution", "allocated_amount": 1600.00 },
    { "name": "Maintenance", "allocated_amount": 1000.00 },
    { "name": "Implementation", "allocated_amount": 1000.00 },
    { "name": "Bespoke", "allocated_amount": 900.00 }
  ]
}
```

---

## 7. Calculated Fields

### 7.1 Consumption Calculation
```
consumed_amount = SUM(feature.cost) WHERE feature.budget_line_id = budget_line.id
remaining_amount = allocated_amount - consumed_amount
consumption_percentage = (consumed_amount / allocated_amount) * 100
```

### 7.2 Total Budget
```
total_budget = SUM(budget_line.allocated_amount) for all lines in version
```

### 7.3 Health Status
```
if consumption_percentage >= 90: status = 'critical' (red)
elif consumption_percentage >= 80: status = 'warning' (yellow)
else: status = 'healthy' (green)
```

---

## 8. UI/UX Notes

### 8.1 Page Layout
- Filters at top (Product, Year dropdowns)
- Version History table below filters
- Budget Allocation section below table (shows active version)

### 8.2 Progress Bar Colors
- Green (#52c41a): 0-79%
- Yellow (#faad14): 80-89%
- Red (#f5222d): 90-100%

### 8.3 Status Badges
- Draft: Gray
- Active: Green
- Archived: Gray (lighter)
- Locked: Blue with lock icon

---

## 9. Acceptance Testing Scenarios

### AT-BM-001: Create Budget Version
1. Navigate to Setup > Budgets
2. Select Product "BRS" and Year "2026"
3. Click "New Version"
4. Enter name "2026 Q2 Budget", add budget lines
5. Save as Draft
6. **Expected:** Version appears in table with Draft status

### AT-BM-002: Activate Version
1. Create a Draft version
2. Click Activate on the draft version
3. **Expected:** Version status changes to Active, previous active becomes Archived

### AT-BM-003: Lock Version
1. Have an Active version
2. Click Lock
3. Confirm in dialog
4. **Expected:** Version shows Locked status, Edit disabled

### AT-BM-004: Copy Version
1. Have an Archived version
2. Click Copy
3. **Expected:** Side panel opens with copied data, name prefixed with "Copy of"

---

## 10. Dependencies

### 10.1 Upstream Dependencies
- Products module (product selection)
- User authentication

### 10.2 Downstream Dependencies
- Features module (budget line assignment)
- Dashboard (budget health display)
- Reports (budget consumption reports)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-15 | PM Agent | Initial draft |
