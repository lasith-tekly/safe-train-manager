# Budget Dashboard - Requirements Specification

**Document Version:** 1.0  
**Date:** 2026-01-27  
**Author:** @product-manager  
**Status:** DRAFT

---

## 1. Overview

The Budget Dashboard provides visual analytics and planning views for budget management. It is a **separate feature** from Budget Configuration, accessible via the Dashboard side navigation.

### 1.1 Purpose
- Provide graphical visualization of budget allocation and utilization
- Enable PI-level budget planning and tracking
- Show budget status across products and budget lines
- Support decision-making with clear visual indicators

### 1.2 Location
- **Navigation:** Dashboard > Budget Dashboard (new menu item)
- **NOT** part of Settings > Budget Configuration

---

## 2. Dashboard Views

### 2.1 Product Budget Overview

When a **Product** is selected, display:

#### 2.1.1 Budget Allocation Visualization
- **Summary cards** showing key metrics for the product
- Budget line breakdown table
- Click budget line to drill down to detail view

#### 2.1.2 Key Metrics Cards
| Metric | Description |
|--------|-------------|
| Total Allocated | Sum of all budget lines (KEUR) |
| Total Planned | Sum of PI-level planned amounts |
| Total Used | Sum of amounts planned in PIs |
| Remaining | Allocated - Used |
| Utilization % | (Used / Allocated) × 100 |

#### 2.1.3 Budget Line Breakdown Table
| Column | Description |
|--------|-------------|
| Budget Line | Code and name |
| Allocated | Total allocation (KEUR) |
| Planned | Amount planned across PIs |
| Used | Amount committed to PIs |
| Remaining | Allocated - Used |
| % of Total | Line allocation / Product total |

---

### 2.2 Budget Line Detail View

When a **Budget Line** is selected, display:

#### 2.2.1 Allocation Summary
- Total allocated amount
- Breakdown by categories (if any)

#### 2.2.2 PI-Level Planning Line Chart

**Dual-line chart** showing budget planning and forecasting:

**Line 1 - Target Allocation (Blue):**
- Shows ideal budget distribution across PIs based on iteration count
- Formula: `PI Target = Total Allocation × (Iterations in PI / Total Iterations in FY)`

**Line 2 - Actual + Forecast (Orange):**
- Shows actual planned amounts for completed/current PIs
- Shows forecasted amounts for future PIs based on remaining budget
- Forecast Formula: `Future PI = Remaining Budget × (Iterations in PI / Total Remaining Iterations)`

**Example:**
- Budget Line: Bespoke Development = 1000 KEUR
- Fiscal Year: Q1(4 iter), Q2(3 iter), Q3(4 iter), Q4(3 iter) = 14 total iterations

| Quarter | Iterations | Target Allocation | Actual/Forecast | Notes |
|---------|-----------|-------------------|-----------------|-------|
| Q1 | 4 | 285.7 KEUR | 500 KEUR | Actual (over-planned) |
| Q2 | 3 | 214.3 KEUR | 166.7 KEUR | Forecast: 500 × (3/9) |
| Q3 | 4 | 285.7 KEUR | 222.2 KEUR | Forecast: 500 × (4/9) |
| Q4 | 3 | 214.3 KEUR | 166.7 KEUR | Forecast: 500 × (3/9) |

**Visual Indicators:**
- Green zone: Actual/Forecast ≤ Target
- Yellow zone: Actual/Forecast 100-120% of Target
- Red zone: Actual/Forecast > 120% of Target

---

## 3. Budget Planning Logic

### 3.1 Terminology

| Term | Definition |
|------|------------|
| **Allocated** | Budget amount assigned to a budget line (from Budget Configuration) |
| **Target** | Ideal budget distribution per PI based on iteration count |
| **Planned** | Actual budget amount planned/used in a PI (from PI Planning) |
| **Forecast** | Projected budget for future PIs based on remaining budget |

### 3.2 Budget Flow

```
Allocated → Target (calculated) → Planned (actual) → Forecast (projected)
```

1. **Allocated**: Set in Budget Configuration
2. **Target**: Calculated per PI based on iteration distribution
3. **Planned**: Actual amounts from PI Planning feature assignments
4. **Forecast**: Projected for future PIs based on remaining budget

### 3.3 PI-Level Budget Calculation Logic

#### 3.3.1 Target Allocation Calculation
**Formula:**
```
PI Target = Total Budget Allocation × (Iterations in PI / Total Iterations in FY)
```

**Example:**
- Budget Line Allocation: 1000 KEUR
- Fiscal Year: Q1(4), Q2(3), Q3(4), Q4(3) = 14 total iterations
- Q1 Target = 1000 × (4/14) = 285.7 KEUR
- Q2 Target = 1000 × (3/14) = 214.3 KEUR
- Q3 Target = 1000 × (4/14) = 285.7 KEUR
- Q4 Target = 1000 × (3/14) = 214.3 KEUR

#### 3.3.2 Forecast Calculation for Future PIs
**Formula:**
```
Future PI Forecast = Remaining Budget × (Iterations in Future PI / Total Remaining Iterations)
```

**Example (after Q1 with 500 KEUR planned):**
- Remaining Budget = 1000 - 500 = 500 KEUR
- Remaining Iterations = 3 + 4 + 3 = 10 iterations
- Q2 Forecast = 500 × (3/10) = 150 KEUR
- Q3 Forecast = 500 × (4/10) = 200 KEUR
- Q4 Forecast = 500 × (3/10) = 150 KEUR

#### 3.3.3 Data Source for Planned Amounts
**Planned amounts come from PI Planning:**
- When features are assigned to a PI in the PI Planning module
- Each feature has an estimated budget/cost
- Sum of all feature budgets in a PI = Planned amount for that PI
- This data is retrieved from the PI Planning feature (to be implemented)

**Note:** Until PI Planning is implemented, planned amounts will be 0 and only Target line will be shown.

---

## 4. Data Model Extensions

### 4.1 New Entity: PIBudgetPlan

```
PIBudgetPlan
├── id: UUID
├── budget_line_id: UUID (FK → BudgetLine)
├── pi_id: UUID (FK → PI)
├── planned_amount: Float
├── used_amount: Float
├── source: Enum ['ROADMAP', 'AUTO_SPLIT', 'MANUAL']
├── created_at: DateTime
├── updated_at: DateTime
└── created_by: UUID
```

### 4.2 Relationships
```
BudgetLine (1) ←→ (N) PIBudgetPlan
PI (1) ←→ (N) PIBudgetPlan
```

---

## 5. API Endpoints

### 5.1 Dashboard Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budget/dashboard/product/{product_id}` | Get product budget overview |
| GET | `/api/budget/dashboard/line/{line_id}` | Get budget line detail with PI breakdown |
| GET | `/api/budget/dashboard/pi/{pi_id}` | Get PI budget summary |

### 5.2 PI Budget Planning Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budget/pi-plans?budget_line_id={id}` | Get PI plans for a budget line |
| POST | `/api/budget/pi-plans` | Create/update PI budget plan |
| POST | `/api/budget/pi-plans/auto-split` | Auto-generate PI split for budget line |

---

## 6. UI Components

### 6.1 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Budget Dashboard                                    FY: 2026 ▼ │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐  │
│  │  PRODUCT SELECTOR   │  │  BUDGET OVERVIEW                │  │
│  │  ○ Flight Mgmt      │  │  ┌─────┐ ┌─────┐ ┌─────┐       │  │
│  │  ○ BRS              │  │  │14000│ │ 300 │ │13700│       │  │
│  │  ○ ARO              │  │  │Alloc│ │Used │ │Rem  │       │  │
│  │                     │  │  └─────┘ └─────┘ └─────┘       │  │
│  │                     │  │                                 │  │
│  │                     │  │  ┌───────────────────────────┐ │  │
│  │                     │  │  │      PIE CHART            │ │  │
│  │                     │  │  │   Budget Line Split       │ │  │
│  │                     │  │  │                           │ │  │
│  │                     │  │  └───────────────────────────┘ │  │
│  └─────────────────────┘  └─────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  PI BUDGET PLANNING                                      │   │
│  │  ┌─────────┬─────────┬─────────┬─────────┬─────────┐   │   │
│  │  │         │ PI 26.1 │ PI 26.2 │ PI 26.3 │ PI 26.4 │   │   │
│  │  ├─────────┼─────────┼─────────┼─────────┼─────────┤   │   │
│  │  │ MNT     │   500   │   500   │   500   │   500   │   │   │
│  │  │ PE      │  1500   │  1500   │  1500   │  1500   │   │   │
│  │  │ SER     │   750   │   750   │   750   │   750   │   │   │
│  │  ├─────────┼─────────┼─────────┼─────────┼─────────┤   │   │
│  │  │ TOTAL   │  2750   │  2750   │  2750   │  2750   │   │   │
│  │  └─────────┴─────────┴─────────┴─────────┴─────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Visualization Components

| Component | Library | Purpose |
|-----------|---------|---------|
| Pie Chart | @ant-design/charts or recharts | Budget line distribution |
| Bar Chart | @ant-design/charts or recharts | PI comparison |
| Data Table | Ant Design Table | Detailed breakdowns |
| Stat Cards | Custom (already created) | Key metrics |

---

## 7. Business Rules

### 7.1 Budget Constraints
1. **Sum of PI Plans ≤ Budget Line Allocation**
   - Cannot plan more than allocated
2. **Used ≤ Planned**
   - Cannot use more than planned for a PI
3. **Auto-split respects allocation**
   - Equal distribution across PIs

### 7.2 Status Indicators

| Status | Condition | Color |
|--------|-----------|-------|
| On Track | Used ≤ 70% of Planned | 🟢 Green |
| Warning | 70% < Used ≤ 90% of Planned | 🟡 Yellow |
| Critical | Used > 90% of Planned | 🔴 Red |
| Not Started | Used = 0 | ⚪ Gray |

---

## 8. Integration Points

### 8.1 Roadmap Integration
- When roadmap features are defined, budget is distributed based on feature allocations
- Feature → PI assignment drives budget "Used" calculation

### 8.2 PI Planning Integration
- When features are planned in a PI, budget is marked as "Used"
- Budget availability shown during PI planning

### 8.3 Budget Configuration Integration
- Dashboard reads from Budget Configuration data
- Changes in allocation automatically reflected in dashboard

---

## 9. Implementation Phases

### Phase 1: Basic Dashboard
- [ ] Product budget overview with pie chart
- [ ] Budget line breakdown table
- [ ] Key metrics cards

### Phase 2: PI Planning Grid
- [ ] PI budget plan entity and API
- [ ] Auto-split functionality
- [ ] PI planning grid UI

### Phase 3: Roadmap Integration
- [ ] Connect to roadmap data
- [ ] Feature-based budget distribution
- [ ] Used calculation from PI planning

---

## 10. Acceptance Criteria

### 10.1 Product Budget Overview
- [ ] User can see pie chart of budget line distribution
- [ ] User can see total allocated, used, remaining
- [ ] User can click budget line to see details

### 10.2 Budget Line Detail
- [ ] User can see PI-level budget breakdown
- [ ] User can see planned vs used per PI
- [ ] User can trigger auto-split if no roadmap

### 10.3 PI Planning
- [ ] System auto-calculates PI budget from roadmap
- [ ] System falls back to equal split if no roadmap
- [ ] User can manually adjust PI allocations

---

## 11. Decisions Made

1. ~~**Manual Override:**~~ Not needed - budget planning happens in PI Planning module
2. **Data Source:** Planned amounts come from PI Planning feature assignments
3. ~~**Alerts:**~~ Not needed at this stage
4. ~~**Export:**~~ Not needed at this stage

---

## 12. References

- Budget Configuration Requirements: `Docs/specs/requirements/BUDGET_CONFIGURATION.md`
- Budget Detail Panel UX: `Docs/specs/design/BUDGET_DETAIL_PANEL_UX.md`
- Capacity Calculation Logic: `Docs/CAPACITY_CALCULATION_LOGIC.md`

---

*Requirements Specification Created: 2026-01-27*
*Last Updated: 2026-01-27*
