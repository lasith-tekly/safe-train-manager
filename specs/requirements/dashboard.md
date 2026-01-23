# Dashboard - Requirements Specification

**Document Version:** 1.0  
**Created:** 2026-01-15  
**Author:** Product Manager Agent  
**Status:** Draft  

---

## 1. Overview

### 1.1 Purpose
The Dashboard provides Train Product Managers with an at-a-glance view of budget health, team capacity utilization, and feature status across all products. It serves as the primary landing page for monitoring the overall health of the SAFe train.

### 1.2 Scope
- Budget health summary across products
- Team capacity heatmap by quarter
- Feature status distribution
- Key metrics and KPIs
- Quick navigation to problem areas

### 1.3 Key Personas
- **Train Product Manager** (primary) - Monitors overall health
- **Leadership** - Reviews high-level metrics
- **Scrum Masters** - Check team capacity status

---

## 2. User Stories

### US-DB-001: View Budget Health Summary
**As a** Train Product Manager  
**I want to** see budget health for all products at a glance  
**So that** I can identify products that are over or under budget

**Acceptance Criteria:**
- [ ] Card for each product showing budget utilization
- [ ] Progress bar with color coding (green/yellow/red)
- [ ] Shows: Product name, Allocated/Total budget, Percentage
- [ ] Click card navigates to product's budget details
- [ ] Products sorted by utilization (highest first)

**Priority:** High

---

### US-DB-002: View Capacity Heatmap
**As a** Train Product Manager  
**I want to** see team capacity utilization in a heatmap  
**So that** I can identify over/under-utilized teams

**Acceptance Criteria:**
- [ ] Grid showing Teams (rows) vs Quarters (columns)
- [ ] Cell color indicates utilization level
- [ ] Hover shows exact numbers (allocated/total)
- [ ] Click cell navigates to team's capacity details
- [ ] Legend explaining color coding

**Priority:** High

---

### US-DB-003: View Feature Status Summary
**As a** Train Product Manager  
**I want to** see feature status distribution  
**So that** I can track overall progress

**Acceptance Criteria:**
- [ ] Donut/pie chart showing status breakdown
- [ ] Counts: Not Started, In Progress, Completed
- [ ] Percentage labels on chart
- [ ] Click segment filters feature list
- [ ] Total feature count displayed

**Priority:** Medium

---

### US-DB-004: View Key Metrics
**As a** Train Product Manager  
**I want to** see key metrics at the top of the dashboard  
**So that** I can quickly assess overall health

**Acceptance Criteria:**
- [ ] Total Budget: Sum of all active budgets
- [ ] Budget Consumed: Sum of all feature costs
- [ ] Total Features: Count of imported features
- [ ] Teams Active: Count of active teams
- [ ] Metrics displayed as stat cards with icons

**Priority:** High

---

### US-DB-005: Filter Dashboard by Year
**As a** Train Product Manager  
**I want to** filter dashboard data by fiscal year  
**So that** I can view historical or future planning data

**Acceptance Criteria:**
- [ ] Year selector dropdown
- [ ] Default to current year
- [ ] All dashboard components update on change
- [ ] Persists selection during session

**Priority:** Medium

---

### US-DB-006: View Alerts/Warnings
**As a** Train Product Manager  
**I want to** see alerts for items needing attention  
**So that** I can proactively address issues

**Acceptance Criteria:**
- [ ] Alert section showing warnings
- [ ] Types: Over-budget products, Over-capacity teams, Stale features
- [ ] Click alert navigates to relevant item
- [ ] Dismissible alerts (optional)

**Priority:** Low

---

## 3. Business Rules

### BR-DB-001: Budget Health Thresholds
- Green (Healthy): 0-79% utilized
- Yellow (Warning): 80-89% utilized
- Red (Critical): 90%+ utilized

### BR-DB-002: Capacity Health Thresholds
- Green: 0-79% allocated
- Yellow: 80-89% allocated
- Red: 90%+ allocated

### BR-DB-003: Data Freshness
Dashboard data should reflect real-time state of the system.

### BR-DB-004: Default Year
Dashboard defaults to current fiscal year on load.

### BR-DB-005: Empty States
Show appropriate messages when no data exists for a section.

---

## 4. Data Requirements

### 4.1 Budget Summary Data

| Field | Calculation |
|-------|-------------|
| Product Name | From Product entity |
| Total Budget | Sum of active budget version lines |
| Consumed Budget | Sum of feature costs for product |
| Utilization % | (Consumed / Total) * 100 |

### 4.2 Capacity Summary Data

| Field | Calculation |
|-------|-------------|
| Team Name | From Team entity |
| Q1-Q4 Total | From TeamCapacity entity |
| Q1-Q4 Allocated | Sum of feature story points per quarter |
| Q1-Q4 Utilization | (Allocated / Total) * 100 |

### 4.3 Feature Summary Data

| Field | Calculation |
|-------|-------------|
| Not Started Count | Features with status = 'not_started' |
| In Progress Count | Features with status = 'in_progress' |
| Completed Count | Features with status = 'completed' |
| Total Count | Sum of all features |

### 4.4 Key Metrics

| Metric | Calculation |
|--------|-------------|
| Total Budget | Sum of all active budget totals |
| Budget Consumed | Sum of all feature costs |
| Total Features | Count of all features |
| Active Teams | Count of teams with status = 'active' |

---

## 5. API Endpoints

### 5.1 Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Get all dashboard data |
| GET | `/api/dashboard/budget-health` | Get budget health by product |
| GET | `/api/dashboard/capacity-heatmap` | Get capacity heatmap data |
| GET | `/api/dashboard/feature-stats` | Get feature status stats |

### 5.2 Response Example

**GET /api/dashboard/summary?year=2026**
```json
{
  "metrics": {
    "total_budget": 5000,
    "budget_consumed": 3250,
    "total_features": 45,
    "active_teams": 8
  },
  "budget_health": [
    {
      "product_id": "uuid",
      "product_name": "BRS",
      "total_budget": 1500,
      "consumed_budget": 1200,
      "utilization": 80.0,
      "status": "warning"
    }
  ],
  "capacity_heatmap": [
    {
      "team_id": "uuid",
      "team_name": "Platform Team",
      "team_code": "PLAT",
      "quarters": {
        "q1": { "total": 120, "allocated": 95, "utilization": 79.2 },
        "q2": { "total": 120, "allocated": 110, "utilization": 91.7 },
        "q3": { "total": 100, "allocated": 50, "utilization": 50.0 },
        "q4": { "total": 100, "allocated": 0, "utilization": 0.0 }
      }
    }
  ],
  "feature_stats": {
    "not_started": 15,
    "in_progress": 20,
    "completed": 10,
    "total": 45
  }
}
```

---

## 6. UI/UX Notes

### 6.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard                              Year: [2026 ▼]       │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ Total    │ │ Budget   │ │ Total    │ │ Active   │        │
│ │ Budget   │ │ Consumed │ │ Features │ │ Teams    │        │
│ │ 5,000K   │ │ 3,250K   │ │ 45       │ │ 8        │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────────────────┤
│ Budget Health                    │ Feature Status           │
│ ┌─────────────────────────────┐ │ ┌─────────────────────┐  │
│ │ BRS     ████████░░ 80%     │ │ │      ◐              │  │
│ │ FM      ██████░░░░ 60%     │ │ │   Not Started: 15   │  │
│ │ CRM     █████████░ 92%     │ │ │   In Progress: 20   │  │
│ └─────────────────────────────┘ │ │   Completed: 10     │  │
│                                  │ └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ Team Capacity Heatmap                                       │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Team      │  Q1   │  Q2   │  Q3   │  Q4   │            ││
│ │ PLAT      │  🟢   │  🔴   │  🟢   │  ⚪   │            ││
│ │ MOB       │  🟡   │  🟢   │  🟢   │  ⚪   │            ││
│ │ API       │  🟢   │  🟡   │  🟢   │  ⚪   │            ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Color Coding
- Green (#52c41a): Healthy (0-79%)
- Yellow (#faad14): Warning (80-89%)
- Red (#f5222d): Critical (90%+)
- Gray (#d9d9d9): No data/Zero capacity

### 6.3 Responsive Behavior
- Desktop: 4 metric cards in row, 2-column layout below
- Tablet: 2 metric cards per row, single column below
- Mobile: Single column, stacked layout

---

## 7. Acceptance Testing Scenarios

### AT-DB-001: View Dashboard
1. Navigate to Dashboard (home)
2. **Expected:** See metrics, budget health, capacity heatmap, feature stats

### AT-DB-002: Budget Health Colors
1. Have products with varying budget utilization
2. View dashboard
3. **Expected:** Products show correct color based on utilization

### AT-DB-003: Capacity Heatmap
1. Have teams with capacity and features assigned
2. View heatmap
3. **Expected:** Cells colored based on utilization

### AT-DB-004: Year Filter
1. Change year selector to previous year
2. **Expected:** All dashboard data updates to show that year's data

---

## 8. Dependencies

### 8.1 Upstream Dependencies
- Products module
- Budgets module
- Teams module
- Features module

### 8.2 Downstream Dependencies
- None (Dashboard is a consumer)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-15 | PM Agent | Initial draft |
