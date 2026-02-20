# Roadmap Planning V3 - PI-Level Budget Allocation Requirements

**Feature:** PI-Level Budget Allocation within Multi-Year Roadmap  
**Date:** 2026-01-28  
**Author:** Product Manager  
**Status:** Requirements Definition  
**Priority:** High  
**Version:** 3.0 - Enhancement to V2 with PI-level budget granularity

---

## 1. Executive Summary

This enhancement adds **PI-level (quarterly) budget allocation** to the existing year-based roadmap planning. While roadmaps remain year-focused at the top level, features can now be broken down into **PI-level budget allocations** (Q1, Q2, Q3, Q4) within each year.

### Key Principle: **Budget Planning Only (No Capacity)**
- **Year Level:** Total budget per year (e.g., 2026: 100 KEUR) - remains as-is
- **PI Level:** Budget breakdown per quarter (e.g., Q1: 20 KEUR, Q2: 50 KEUR) - NEW
- **Capacity Planning:** Separate module (not part of roadmap planning)

---

## 2. Business Context

### 2.1 Current State (V2)
- ✅ Roadmap shows year-level budget allocations (e.g., 2026: 100 KEUR, 2027: 50 KEUR)
- ✅ Budget alerts when year-level budget is exceeded
- ✅ Dynamic integration with Budget Configuration
- ❌ No quarterly breakdown of budget
- ❌ Cannot plan budget spending across quarters

### 2.2 Desired State (V3)
- ✅ Year-level budget remains the same (100 KEUR in 2026)
- ✅ **Within each year**, budget is allocated across PIs (Q1: 20 KEUR, Q2: 50 KEUR, Q3: 30 KEUR, Q4: 0 KEUR)
- ✅ System compares planned budget vs allocated budget per PI
- ✅ Alerts when PI budget allocation is exceeded
- ✅ Grid view shows quarterly budget distribution

### 2.3 Real-World Example

**Feature:** BRS Disruption Management  
**Budget Line:** Product Evolution  
**Total Budget:** 200 KEUR (100 KEUR in 2026, 100 KEUR in 2027)

**Year-Level View (Current V2):**
```
2026: 100 KEUR
2027: 100 KEUR
```

**PI-Level View (New V3):**
```
2026 (100 KEUR total):
  - 2026 Q1: 20 KEUR
  - 2026 Q2: 50 KEUR
  - 2026 Q3: 30 KEUR
  - 2026 Q4: 0 KEUR
  ─────────────
  Total: 100 KEUR ✅

2027 (100 KEUR total):
  - 2027 Q1: 30 KEUR
  - 2027 Q2: 40 KEUR
  - 2027 Q3: 20 KEUR
  - 2027 Q4: 10 KEUR
  ─────────────
  Total: 100 KEUR ✅
```

**Budget Comparison (per PI):**
```
2026 Q2:
  - Allocated Budget: 80 KEUR (from Budget Configuration for 2026)
  - Planned Budget: 50 KEUR (from this feature)
  - Other Features: 20 KEUR
  - Total Planned: 70 KEUR
  - Status: ✅ Under budget by 10 KEUR
```

---

## 3. User Stories

### Epic: PI-Level Budget Allocation

#### US-RM-V3-001: Allocate Budget by PI
**As a** Product Manager  
**I want to** break down feature budget across PIs within a year  
**So that** I can plan quarterly budget spending

**Acceptance Criteria:**
- When adding/editing a feature, can allocate budget (KEUR) per PI (Q1-Q4) for each year
- Sum of PI allocations must equal the year total budget
- Can leave some PIs empty (0 KEUR) if feature doesn't span all quarters
- System validates that PI allocations don't exceed year total
- UI shows both year-level budget and PI-level budget breakdown
- Changes are saved and persisted

**Example:**
```
Feature: BRS Disruption Management
Year: 2026
Total Budget: 100 KEUR

PI Allocation:
  Q1: 20 KEUR
  Q2: 50 KEUR
  Q3: 30 KEUR
  Q4: 0 KEUR
  ─────────
  Total: 100 KEUR ✅
```

**Validation Rules:**
- Sum of Q1 + Q2 + Q3 + Q4 must equal year total
- Each PI value must be >= 0
- Each PI value must be a valid number

---

#### US-RM-V3-002: View PI-Level Budget Comparison
**As a** Product Manager  
**I want to** see planned budget vs allocated budget per PI  
**So that** I know if my quarterly plan fits within the budget

**Acceptance Criteria:**
- Display allocated budget per PI (from Budget Configuration)
- Display total planned budget per PI (sum of all features in roadmap)
- Show budget utilization percentage per PI
- Visual indicators:
  - 🟢 **Under Budget:** Planned < Allocated (< 90%)
  - 🟡 **At Budget:** Planned ≈ Allocated (90-100%)
  - 🔴 **Over Budget:** Planned > Allocated (> 100%)
- Show remaining budget per PI

**Example:**
```
2026 Q2 Budget Status:
  Allocated: 80 KEUR (from Budget Configuration)
  Planned: 70 KEUR (Feature A: 50 KEUR + Feature B: 20 KEUR)
  Utilization: 88% 🟢
  Remaining: 10 KEUR
```

---

#### US-RM-V3-003: PI-Level Grid View
**As a** Product Manager  
**I want to** see features in a PI-level grid  
**So that** I can visualize quarterly budget distribution

**Acceptance Criteria:**
- Grid shows PI columns (2026 Q1, 2026 Q2, 2026 Q3, 2026 Q4, 2027 Q1...)
- Each cell shows budget (KEUR) for that feature in that PI
- Empty cells show "—" if no budget allocated
- Row totals show year-level budget totals
- Column totals show PI-level budget totals
- Color-coded cells based on budget status

**Grid Layout:**
```
Feature              | 2026 Q1 | 2026 Q2 | 2026 Q3 | 2026 Q4 | 2027 Q1 | Total
─────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼──────
BRS: Disruption Mgmt | 20 KEUR | 50 KEUR | 30 KEUR | 0 KEUR  | 30 KEUR | 200 KEUR
Test Feature         | —       | 30 KEUR | —       | —       | —       | 30 KEUR
─────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼──────
TOTALS (Planned)     | 20 KEUR | 80 KEUR | 30 KEUR | 0 KEUR  | 30 KEUR | 230 KEUR
Allocated Budget     | 50 KEUR | 80 KEUR | 50 KEUR | 50 KEUR | 50 KEUR | 
Utilization          | 40% 🟢  | 100% 🟡 | 60% 🟢  | 0% 🟢   | 60% 🟢  |
```

---

#### US-RM-V3-004: Budget Alerts per PI
**As a** Product Manager  
**I want to** be alerted when PI budget is exceeded  
**So that** I can rebalance my roadmap

**Acceptance Criteria:**
- Alert when planned budget > allocated budget for any PI
- Show which PIs are over budget
- Display budget variance (over/under) per PI
- Alert appears in feature form when editing
- Alert appears in grid view for affected PIs

**Alert Example:**
```
⚠️ Budget Alert: 2026 Q2
Planned: 90 KEUR
Allocated: 80 KEUR
OVER BUDGET by 10 KEUR (113% utilization)

Action Required:
- Reduce budget allocation for this PI
- Move budget to other quarters
- Request additional budget allocation
```

---

#### US-RM-V3-005: Edit PI Allocations
**As a** Product Manager  
**I want to** easily adjust PI allocations for a feature  
**So that** I can rebalance when budget is exceeded

**Acceptance Criteria:**
- Can edit PI allocations in feature form
- System validates that sum of PIs = year total in real-time
- Real-time budget status updates as allocations change
- Can clear all PI allocations and re-enter
- Can copy allocations from one year to another (optional)

---

#### US-RM-V3-006: Toggle Between Year and PI Views
**As a** Product Manager  
**I want to** switch between year-level and PI-level views  
**So that** I can see both high-level and detailed budget planning

**Acceptance Criteria:**
- Toggle button to switch between "Year View" and "PI View"
- Year View shows current V2 layout (year columns)
- PI View shows new V3 layout (quarter columns)
- Toggle state is remembered per user session
- Both views show same data, just different granularity

---

## 4. Business Rules

### BR-V3-001: PI Budget Sum Validation
**Rule:** Sum of PI budgets (Q1 + Q2 + Q3 + Q4) must equal year total budget  
**Enforcement:** Real-time validation in UI, backend validation on save  
**Error Message:** "PI allocations must sum to {year_total} KEUR. Current sum: {pi_sum} KEUR"

### BR-V3-002: Non-Negative Budget
**Rule:** PI budget values must be >= 0  
**Enforcement:** Input validation in UI  
**Error Message:** "Budget cannot be negative"

### BR-V3-003: Budget Comparison
**Rule:** Compare planned PI budget vs allocated PI budget from Budget Configuration  
**Calculation:** 
- Allocated = Budget Line allocation for that year / 4 (equal distribution across quarters)
- OR: Use actual PI allocation from Budget Configuration if available
- Planned = Sum of all feature PI allocations for that PI
- Utilization = (Planned / Allocated) * 100

### BR-V3-004: Budget Alert Threshold
**Rule:** Show warning when PI utilization >= 90%, error when > 100%  
**Visual Indicators:**
- 🟢 Green: < 90%
- 🟡 Yellow: 90-100%
- 🔴 Red: > 100%

### BR-V3-005: Optional PI Allocation
**Rule:** PI allocation is optional - can remain at year level only  
**Behavior:** If no PI allocations exist, feature shows only year-level budget

---

## 5. Data Model Requirements

### 5.1 New Entity: FeaturePIAllocation

**Attributes:**
- `id` (UUID, PK)
- `feature_year_allocation_id` (UUID, FK to feature_year_allocations)
- `quarter` (Integer: 1-4)
- `budget_amount` (Decimal: KEUR)
- `created_at` (DateTime)
- `updated_at` (DateTime)

**Relationships:**
- Belongs to: FeatureYearAllocation (many-to-one)

**Constraints:**
- Unique constraint on (feature_year_allocation_id, quarter)
- Check constraint: quarter IN (1, 2, 3, 4)
- Check constraint: budget_amount >= 0

### 5.2 Validation Logic

**On Save:**
1. Validate sum of PI budgets = year total
2. Validate each PI budget >= 0
3. Validate quarter values (1-4)
4. Check for duplicate quarters

**On Load:**
1. Load PI allocations with year allocations
2. Calculate PI budget totals
3. Compare with allocated budget from Budget Configuration

---

## 6. Integration Points

### 6.1 Budget Configuration Integration
- Read allocated budget per year from Budget Configuration
- Distribute year budget across PIs (equal distribution or custom)
- Compare planned PI budget vs allocated PI budget

### 6.2 Roadmap Planning Integration
- Extend existing feature form to include PI allocation inputs
- Add PI-level grid view as alternative to year view
- Update budget summary cards to show PI-level status

---

## 7. Non-Functional Requirements

### 7.1 Performance
- PI allocation calculations must be real-time (< 100ms)
- Grid view must render smoothly with 50+ features
- Budget comparisons must update instantly on input change

### 7.2 Usability
- PI allocation inputs must be intuitive and easy to use
- Validation errors must be clear and actionable
- Grid view must be readable and not cluttered

### 7.3 Data Integrity
- PI allocations must always sum to year total
- No orphaned PI allocations (cascade delete with year allocation)
- Atomic updates (all PIs saved together)

---

## 8. Out of Scope (V3)

❌ **Capacity Planning** - Separate module  
❌ **Team Capacity Integration** - Future enhancement  
❌ **Effort Days Calculation** - Budget only, not effort  
❌ **Drag-and-Drop PI Allocation** - Future enhancement  
❌ **PI-Level Budget Configuration** - Budget Config remains year-level  

---

## 9. Success Criteria

✅ Users can allocate feature budget across quarters (Q1-Q4)  
✅ System validates PI allocations sum to year total  
✅ PI-level grid view shows quarterly budget distribution  
✅ Budget alerts appear when PI budget is exceeded  
✅ Toggle between year view and PI view works smoothly  
✅ All existing V2 functionality remains intact  

---

## 10. Implementation Priority

**Phase 1 (Must Have):**
- US-RM-V3-001: Allocate Budget by PI
- US-RM-V3-002: View PI-Level Budget Comparison
- US-RM-V3-005: Edit PI Allocations

**Phase 2 (Should Have):**
- US-RM-V3-003: PI-Level Grid View
- US-RM-V3-004: Budget Alerts per PI

**Phase 3 (Nice to Have):**
- US-RM-V3-006: Toggle Between Year and PI Views

---

## 11. Acceptance Testing Scenarios

### Scenario 1: Create Feature with PI Allocation
1. Navigate to Roadmap Planning
2. Click "Add Feature"
3. Fill in feature details
4. Allocate budget for 2026: 100 KEUR
5. Break down into PIs: Q1: 20, Q2: 50, Q3: 30, Q4: 0
6. Save feature
7. **Expected:** Feature saved with PI allocations, sum validated

### Scenario 2: Edit PI Allocation
1. Open existing feature
2. Change Q2 from 50 to 60 KEUR
3. System shows validation error (sum exceeds year total)
4. Adjust Q3 from 30 to 20 KEUR
5. Save feature
6. **Expected:** PI allocations updated, validation passed

### Scenario 3: View PI Grid
1. Navigate to Roadmap Planning
2. Toggle to "PI View"
3. **Expected:** Grid shows Q1-Q4 columns with budget values
4. **Expected:** Column totals show planned vs allocated budget
5. **Expected:** Color indicators show budget status

### Scenario 4: Budget Alert
1. Create feature with PI allocation that exceeds allocated budget
2. **Expected:** Warning appears in feature form
3. **Expected:** Grid cell shows red indicator
4. **Expected:** Budget summary card shows alert

---

## 12. Dependencies

**Backend:**
- Existing FeatureYearAllocation model
- Existing Budget Configuration module
- SQLAlchemy ORM
- FastAPI framework

**Frontend:**
- Existing Roadmap Planning V2 components
- Ant Design component library
- React hooks for state management

---

## 13. Risks and Mitigation

**Risk 1:** Complex validation logic  
**Mitigation:** Implement validation in both frontend (real-time) and backend (on save)

**Risk 2:** Performance with large datasets  
**Mitigation:** Optimize queries, use pagination, lazy loading

**Risk 3:** User confusion with two levels of planning  
**Mitigation:** Clear UI labels, tooltips, help text

**Risk 4:** Data migration for existing features  
**Mitigation:** PI allocations are optional, existing features work without them

---

## 14. Documentation Requirements

- Update Roadmap Planning user guide
- Add PI allocation tutorial
- Update API documentation
- Add database schema documentation

---

**End of Requirements Document**
