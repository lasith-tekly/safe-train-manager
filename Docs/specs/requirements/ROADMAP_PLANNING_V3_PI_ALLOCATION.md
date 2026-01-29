# Roadmap Planning V3 - PI-Level Capacity Allocation

**Feature:** PI-Level Capacity Allocation within Multi-Year Roadmap  
**Date:** 2026-01-28  
**Author:** Product Manager  
**Status:** Requirements Definition  
**Priority:** High  
**Version:** 3.0 - Enhancement to V2 with PI-level granularity

---

## 1. Executive Summary

This enhancement adds **PI-level (quarterly) capacity allocation** to the existing year-based roadmap planning. While roadmaps remain year-focused at the top level, features can now be broken down into **PI-level effort allocations** (Q1, Q2, Q3, Q4) within each year. This enables:

1. **Detailed capacity planning** - Allocate effort across PIs within a year
2. **PI-level budget comparison** - Compare planned effort vs available capacity per PI
3. **Team capacity integration** - Link roadmap effort to actual team capacity per PI
4. **Realistic delivery planning** - Ensure features are planned within available PI capacity

### Key Principle: **Two-Level Planning**
- **Year Level:** Budget planning (KEUR) - remains as-is
- **PI Level:** Capacity planning (effort days) - NEW enhancement

---

## 2. Business Context

### 2.1 Current State (V2)
- Roadmap shows year-level budget allocations (e.g., 2026: 100 KEUR, 2027: 50 KEUR)
- Effort days calculated from budget but not broken down by PI
- No link to actual team capacity per PI

### 2.2 Desired State (V3)
- Year-level budget remains the same (200 KEUR in 2026)
- **Within each year**, effort is allocated across PIs (Q1: 20eD, Q2: 50eD, Q3: 20eD, Q4: 10eD)
- System compares planned effort vs available team capacity per PI
- Alerts when PI capacity is exceeded

### 2.3 Real-World Example

**Feature:** BRS Disruption Management  
**Total Budget:** 200 KEUR (100 KEUR in 2026, 100 KEUR in 2027)  
**Total Effort:** 197 eD (calculated from budget)

**Year-Level View (Current V2):**
```
2026: 100 KEUR (100 eD)
2027: 100 KEUR (97 eD)
```

**PI-Level View (New V3):**
```
2026 (100 eD total):
  - 2026 Q1: 20 eD
  - 2026 Q2: 50 eD
  - 2026 Q3: 20 eD
  - 2026 Q4: 10 eD

2027 (97 eD total):
  - 2027 Q1: 20 eD
  - 2027 Q2: 30 eD
  - 2027 Q3: 27 eD
  - 2027 Q4: 20 eD
```

**Capacity Comparison:**
```
2026 Q2:
  - Available Capacity: 45 eD (from team capacity)
  - Planned Effort: 50 eD (from roadmap)
  - Status: ⚠️ OVER CAPACITY by 5 eD
```

---

## 3. User Stories

### Epic: PI-Level Capacity Allocation

#### US-RM-PI-001: Allocate Effort by PI
**As a** Product Manager  
**I want to** break down feature effort across PIs within a year  
**So that** I can plan realistic delivery timelines

**Acceptance Criteria:**
- When adding/editing a feature, can allocate effort days per PI (Q1-Q4) for each year
- Sum of PI allocations must equal the year total effort
- Can leave some PIs empty (0 eD) if feature doesn't span all quarters
- System validates that PI allocations don't exceed year total
- UI shows both year-level budget and PI-level effort breakdown

**Example:**
```
Feature: BRS Disruption Management
Year: 2026
Total Budget: 100 KEUR → Total Effort: 100 eD

PI Allocation:
  Q1: 20 eD
  Q2: 50 eD
  Q3: 20 eD
  Q4: 10 eD
  ─────────
  Total: 100 eD ✅
```

#### US-RM-PI-002: View PI-Level Capacity Comparison
**As a** Product Manager  
**I want to** see planned effort vs available capacity per PI  
**So that** I know if my plan is realistic

**Acceptance Criteria:**
- Display available team capacity per PI (from Team Capacity module)
- Display total planned effort per PI (sum of all features in roadmap)
- Show capacity utilization percentage per PI
- Visual indicators:
  - 🟢 **Under Capacity:** Planned < Available (< 90%)
  - 🟡 **At Capacity:** Planned ≈ Available (90-100%)
  - 🔴 **Over Capacity:** Planned > Available (> 100%)
- Show remaining capacity per PI

**Example:**
```
2026 Q2 Capacity Status:
  Available: 45 eD (from team capacity)
  Planned: 50 eD (Feature A: 30eD + Feature B: 20eD)
  Utilization: 111% 🔴
  Variance: -5 eD (OVER by 5 eD)
```

#### US-RM-PI-003: PI-Level Grid View
**As a** Product Manager  
**I want to** see features in a PI-level grid  
**So that** I can visualize quarterly delivery

**Acceptance Criteria:**
- Grid shows PI columns (2026 Q1, 2026 Q2, 2026 Q3, 2026 Q4, 2027 Q1...)
- Each cell shows effort days (eD) for that feature in that PI
- Empty cells show "—" if no effort allocated
- Row totals show year-level budget (KEUR) and effort (eD)
- Column totals show PI-level effort totals
- Color-coded cells based on capacity status

**Grid Layout:**
```
Feature              | 2026 Q1 | 2026 Q2 | 2026 Q3 | 2026 Q4 | 2027 Q1 | Total
─────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼──────
BRS: Disruption Mgmt | 20 eD   | 50 eD   | 20 eD   | 10 eD   | 20 eD   | 200 KEUR
                     |         |         |         |         |         | 197 eD
─────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼──────
Test Feature         | —       | 30 eD   | —       | —       | —       | 50 KEUR
                     |         |         |         |         |         | 50 eD
─────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼──────
TOTALS               | 20 eD   | 80 eD   | 20 eD   | 10 eD   | 20 eD   | 250 KEUR
                     |         |         |         |         |         | 247 eD
─────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼──────
Available Capacity   | 45 eD   | 45 eD   | 45 eD   | 45 eD   | 45 eD   |
Utilization          | 44% 🟢  | 178% 🔴 | 44% 🟢  | 22% 🟢  | 44% 🟢  |
```

#### US-RM-PI-004: Capacity Alerts per PI
**As a** Product Manager  
**I want to** be alerted when PI capacity is exceeded  
**So that** I can rebalance my roadmap

**Acceptance Criteria:**
- Alert when planned effort > available capacity for any PI
- Show which PIs are over capacity
- Suggest rebalancing (move effort to other PIs)
- Display capacity variance (over/under) per PI
- Alert threshold configurable (default: 100%)

**Alert Example:**
```
⚠️ Capacity Alert: 2026 Q2
Planned: 80 eD
Available: 45 eD
OVER CAPACITY by 35 eD (178% utilization)

Suggestions:
- Move 15 eD to 2026 Q1 (currently at 44%)
- Move 20 eD to 2026 Q3 (currently at 44%)
```

#### US-RM-PI-005: Edit PI Allocations
**As a** Product Manager  
**I want to** easily adjust PI allocations for a feature  
**So that** I can rebalance when capacity is exceeded

**Acceptance Criteria:**
- Can edit PI allocations in feature form
- Can drag/drop effort between PIs (optional enhancement)
- System validates that sum of PIs = year total
- Real-time capacity status updates as allocations change
- Can copy allocations from one year to another

---

## 4. Business Rules

### BR-PI-001: Two-Level Planning Model
- **Year Level:** Budget planning in KEUR (remains unchanged from V2)
- **PI Level:** Capacity planning in effort days (NEW)
- Year-level budget determines total effort days
- PI-level allocations break down the effort within the year

### BR-PI-002: PI Allocation Constraints
- Sum of PI allocations for a year **must equal** the year's total effort days
- PI allocations are **optional** - can be added after feature creation
- If no PI allocations specified, effort is distributed evenly across PIs
- PI allocations can be **0 eD** if feature doesn't span that quarter

### BR-PI-003: Capacity Comparison
- Available capacity comes from **Team Capacity module** (per PI)
- Planned effort is **sum of all features** in roadmap for that PI
- Comparison is **per product** (only features for that product)
- Capacity alerts are **informational** - don't block feature creation

### BR-PI-004: Capacity Calculation
- Available capacity = Sum of team capacity for all teams assigned to product
- Teams can be allocated to multiple products (split capacity)
- Capacity includes only **productive capacity** (excludes IP weeks, leave, etc.)

### BR-PI-005: PI Naming Convention
- PIs are identified by **Year + Quarter** (e.g., "2026 Q1", "2027 Q3")
- Quarters map to calendar quarters (Q1 = Jan-Mar, Q2 = Apr-Jun, etc.)
- PIs are **independent of fiscal year** (roadmap is calendar-year based)

---

## 5. Data Model Requirements

### 5.1 New Table: `feature_pi_allocations`
```sql
CREATE TABLE feature_pi_allocations (
    id VARCHAR(36) PRIMARY KEY,
    feature_id VARCHAR(36) NOT NULL,  -- FK to roadmap_features
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL,  -- 1, 2, 3, or 4
    effort_days DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feature_id) REFERENCES roadmap_features(id) ON DELETE CASCADE,
    UNIQUE (feature_id, year, quarter)
);
```

### 5.2 Relationship to Existing Tables
- `roadmap_features` → has many `feature_pi_allocations`
- `feature_year_allocations` → remains for year-level budget
- PI allocations are **derived from** year allocations (effort days)

### 5.3 Validation Rules
- Sum of PI allocations for a year must equal `feature_year_allocations.effort_days` for that year
- Quarter must be 1, 2, 3, or 4
- Effort days must be >= 0

---

## 6. API Requirements

### 6.1 New Endpoints

#### GET `/api/roadmaps/{roadmap_id}/pi-capacity`
**Purpose:** Get PI-level capacity comparison for roadmap

**Response:**
```json
{
  "roadmap_id": "uuid",
  "product_id": "uuid",
  "pi_capacity": {
    "2026_Q1": {
      "year": 2026,
      "quarter": 1,
      "available_capacity_ed": 45.0,
      "planned_effort_ed": 20.0,
      "utilization_percent": 44.4,
      "variance_ed": 25.0,
      "status": "under_capacity",
      "features": [
        {
          "feature_id": "uuid",
          "feature_name": "BRS: Disruption Management",
          "effort_days": 20.0
        }
      ]
    },
    "2026_Q2": {
      "year": 2026,
      "quarter": 2,
      "available_capacity_ed": 45.0,
      "planned_effort_ed": 80.0,
      "utilization_percent": 177.8,
      "variance_ed": -35.0,
      "status": "over_capacity",
      "features": [...]
    }
  }
}
```

#### POST `/api/roadmaps/{roadmap_id}/features/{feature_id}/pi-allocations`
**Purpose:** Set PI allocations for a feature

**Request:**
```json
{
  "pi_allocations": [
    {"year": 2026, "quarter": 1, "effort_days": 20.0},
    {"year": 2026, "quarter": 2, "effort_days": 50.0},
    {"year": 2026, "quarter": 3, "effort_days": 20.0},
    {"year": 2026, "quarter": 4, "effort_days": 10.0}
  ]
}
```

**Validation:**
- Sum of effort days per year must equal year allocation
- Returns 400 if validation fails

#### PUT `/api/roadmaps/{roadmap_id}/features/{feature_id}/pi-allocations`
**Purpose:** Update PI allocations for a feature

**Request:** Same as POST

#### GET `/api/roadmaps/{roadmap_id}/features/{feature_id}/pi-allocations`
**Purpose:** Get PI allocations for a feature

**Response:**
```json
{
  "feature_id": "uuid",
  "pi_allocations": [
    {"year": 2026, "quarter": 1, "effort_days": 20.0},
    {"year": 2026, "quarter": 2, "effort_days": 50.0}
  ]
}
```

---

## 7. UI Requirements

### 7.1 Feature Form Enhancement
- Add **PI Allocation section** below year allocations
- For each year with effort > 0, show 4 input fields (Q1, Q2, Q3, Q4)
- Display running total and validation status
- Show capacity status per PI (available vs planned)

### 7.2 Roadmap Detail View Enhancement
- Add **toggle** to switch between Year View and PI View
- **Year View:** Current grid (year columns)
- **PI View:** Expanded grid (PI columns: 2026 Q1, 2026 Q2, etc.)
- Show capacity status bar per PI column
- Color-code cells based on capacity status

### 7.3 PI Capacity Dashboard
- Add **PI Capacity Summary** section above feature grid
- Show cards per PI with:
  - Available capacity
  - Planned effort
  - Utilization percentage
  - Status indicator
- Click card to filter features for that PI

---

## 8. Integration Requirements

### 8.1 Team Capacity Integration
- Query team capacity per PI from Team Capacity module
- Filter by product (only teams assigned to product)
- Use **productive capacity** (exclude IP weeks, leave)
- Cache capacity data to avoid repeated queries

### 8.2 Budget Configuration Integration (V2 Fix)
- Fix existing budget integration service
- Link budget lines to roadmap features
- Compare planned budget vs allocated budget per year
- This is **separate from** PI capacity comparison

---

## 9. Success Criteria

1. ✅ PMs can allocate feature effort across PIs within a year
2. ✅ System shows available capacity per PI from team capacity
3. ✅ System alerts when PI capacity is exceeded
4. ✅ PMs can rebalance effort across PIs to match capacity
5. ✅ PI-level grid view shows quarterly delivery plan
6. ✅ Budget integration works (V2 fix)

---

## 10. Implementation Phases

### Phase 1: Budget Integration Fix (V2 Completion)
- Fix `BudgetIntegrationService` to query correct tables
- Enable budget alerts and comparison
- **Estimated:** 4-6 hours

### Phase 2: PI Allocation Data Model
- Create `feature_pi_allocations` table
- Add migration script
- Update models and schemas
- **Estimated:** 2-3 hours

### Phase 3: PI Allocation API
- Implement PI allocation endpoints
- Add validation logic
- Integrate with team capacity
- **Estimated:** 4-6 hours

### Phase 4: PI Allocation UI
- Enhance feature form with PI inputs
- Add PI view toggle to roadmap detail
- Implement PI capacity dashboard
- **Estimated:** 6-8 hours

### Phase 5: Testing & Refinement
- Test budget integration
- Test PI allocations
- Test capacity comparison
- **Estimated:** 3-4 hours

**Total Estimated Effort:** 19-27 hours

---

## 11. Out of Scope (Future Enhancements)

- Drag-and-drop PI allocation
- Automatic PI balancing suggestions
- Historical capacity trends
- Capacity forecasting
- Multi-product capacity optimization

---

## 12. Dependencies

- Team Capacity module must be functional
- Budget Configuration must have data for comparison
- Products must have teams assigned
- PIs must be defined in system

---

## 13. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Team capacity data unavailable | High | Provide manual capacity input option |
| PI allocations don't sum to year total | Medium | Strong validation and clear error messages |
| Performance with many features | Medium | Optimize queries, add caching |
| Complex UI with too many inputs | Medium | Progressive disclosure, default to year view |

---

## Appendix A: Terminology

- **PI (Program Increment):** Quarter (Q1, Q2, Q3, Q4)
- **Year Allocation:** Budget (KEUR) allocated to a feature for a year
- **PI Allocation:** Effort days (eD) allocated to a feature for a quarter
- **Available Capacity:** Team capacity available for a PI (from Team Capacity module)
- **Planned Effort:** Sum of feature effort allocated to a PI (from Roadmap)
- **Capacity Utilization:** Planned / Available × 100%
