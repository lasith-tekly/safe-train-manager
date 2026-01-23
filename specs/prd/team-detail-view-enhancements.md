# PRD: Team Detail View Enhancements

## Overview
Enhance the Team Detail View (right panel in Team Capacity Management) to provide comprehensive, PI-specific capacity information including role breakdowns, allocation categories, iteration-level details, and team member views.

## Problem Statement
The current Team Detail View shows basic capacity information but lacks:
- PI-specific filtering and data updates
- Detailed role-based capacity breakdown (Dev, PD, QA)
- Allocation category breakdown by role
- Iteration-level capacity view
- Team member-level capacity view

## Goals
1. Provide complete visibility into team capacity for a selected PI
2. Enable drill-down from summary to iteration to member level
3. Show capacity allocation by category and role
4. Support capacity planning decisions with actionable data

---

## User Stories

### Epic: Team Detail View Enhancements

---

### US-1: PI Selection Updates Content
**As a** Release Train Engineer  
**I want** the team detail view to update when I select a different PI  
**So that** I can see capacity information specific to that planning increment

**Acceptance Criteria:**
- [ ] PI dropdown selector is prominently displayed
- [ ] Selecting a PI refreshes all capacity data in the detail view
- [ ] Current/active PI is selected by default
- [ ] Loading indicator shows while data is being fetched
- [ ] Error handling if PI data is unavailable

---

### US-2: Total Effort Days Display
**As a** Release Train Engineer  
**I want** to see the total effort days available for the team in the selected PI  
**So that** I can understand the team's overall capacity

**Acceptance Criteria:**
- [ ] Total effort days displayed prominently as a summary card
- [ ] Value is calculated based on PI duration and team availability
- [ ] Accounts for holidays and leave
- [ ] Shows unit (days) clearly

---

### US-3: Total Members Count
**As a** Release Train Engineer  
**I want** to see the total number of team members  
**So that** I can understand team size

**Acceptance Criteria:**
- [ ] Total member count displayed as a summary card
- [ ] Shows active members only
- [ ] Updates when team composition changes

---

### US-4: Role Headcount Display
**As a** Release Train Engineer  
**I want** to see how many Developers, PDs, and QAs are on the team  
**So that** I can understand the team composition by role

**Acceptance Criteria:**
- [ ] Headcount displayed for each role: Developer, PD (Product Designer/BA), QA
- [ ] Visual representation (cards or badges)
- [ ] Clear labeling of each role

---

### US-5: Capacity by Role (Effort Days)
**As a** Release Train Engineer  
**I want** to see the capacity in effort days for each role  
**So that** I can understand how much work each role can deliver

**Acceptance Criteria:**
- [ ] Effort days shown for: Developer, PD, QA
- [ ] Values calculated based on member availability and working days
- [ ] Displayed in a clear, comparable format
- [ ] Subtotals match the total effort days

---

### US-6: Capacity Allocation by Category
**As a** Release Train Engineer  
**I want** to see how capacity is allocated across categories (Features, IT Excellence, Component Work, etc.)  
**So that** I can ensure proper balance of work types

**Acceptance Criteria:**
- [ ] Shows allocation for each configured category
- [ ] Displays both percentage and effort days
- [ ] Visual representation (progress bars or pie chart)
- [ ] Categories are configurable in settings

---

### US-7: Role-Based Allocation Breakdown
**As a** Release Train Engineer  
**I want** to see how much each role (Dev, PD, QA) contributes to each allocation category  
**So that** I can understand detailed capacity distribution

**Acceptance Criteria:**
- [ ] Matrix view showing: Role × Category
- [ ] For each combination, show effort days
- [ ] Example: Dev for Features: 45d, Dev for IT Excellence: 5d, etc.
- [ ] Totals by row (role) and column (category) displayed
- [ ] Sortable/filterable if needed

---

### US-8: Iteration-Level Capacity View
**As a** Release Train Engineer  
**I want** to see capacity breakdown for each iteration within the PI  
**So that** I can plan work distribution across iterations

**Acceptance Criteria:**
- [ ] List/table of all iterations in the selected PI
- [ ] For each iteration, show:
  - Total capacity (days)
  - Developer capacity (days)
  - PD capacity (days)
  - QA capacity (days)
- [ ] Expandable rows for more detail
- [ ] Visual indicators for capacity utilization

---

### US-9: Team Member-Level Capacity View
**As a** Release Train Engineer  
**I want** to see individual team member capacity  
**So that** I can understand individual contributions and availability

**Acceptance Criteria:**
- [ ] List of all team members
- [ ] For each member, show:
  - Name and role
  - Total available days in PI
  - Availability percentage
  - Leave/holidays impact
- [ ] Sortable by name, role, or capacity
- [ ] Expandable for iteration-level member detail

---

## Data Requirements

### Summary Data
| Field | Description | Source |
|-------|-------------|--------|
| total_effort_days | Sum of all member capacity | Calculated |
| total_members | Count of active members | Team.members |
| dev_count | Number of developers | Team.members where role=developer |
| pd_count | Number of PDs/BAs | Team.members where role=ba |
| qa_count | Number of QAs | Team.members where role=qa |

### Role Capacity Data
| Field | Description |
|-------|-------------|
| role | developer, ba, qa |
| headcount | Number of members |
| effort_days | Total capacity for role |

### Allocation Data
| Field | Description |
|-------|-------------|
| category | Feature Capacity, IT Excellence, etc. |
| percentage | Allocation percentage |
| total_days | Total days for category |
| dev_days | Developer days for category |
| pd_days | PD days for category |
| qa_days | QA days for category |

### Iteration Data
| Field | Description |
|-------|-------------|
| iteration_name | e.g., "PI 25.1 - Iteration 1" |
| start_date | Iteration start |
| end_date | Iteration end |
| total_capacity | Total days |
| dev_capacity | Developer days |
| pd_capacity | PD days |
| qa_capacity | QA days |

### Member Data
| Field | Description |
|-------|-------------|
| member_name | Full name |
| role | developer, ba, qa |
| availability_pct | Availability percentage |
| total_days | Available days in PI |
| leave_days | Days on leave |

---

## UI Layout (High-Level)

```
┌─────────────────────────────────────────────────────────────┐
│ Team Name                                          [PI: ▼] │
│ Team Code • Team Capacity Overview                    [✕]  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │  120d   │ │   8     │ │   5     │ │   2     │ │   1     ││
│ │ Total   │ │ Members │ │  Devs   │ │  PDs    │ │  QAs    ││
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
├─────────────────────────────────────────────────────────────┤
│ Capacity by Role                                            │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │   80d       │ │   25d       │ │   15d       │            │
│ │ DEVELOPER   │ │ PD          │ │ QA          │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│ Capacity Allocation                                         │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Features (80%)        ████████████████████░░░░  96d   │  │
│ │ IT Excellence (12%)   ████░░░░░░░░░░░░░░░░░░░░  14.4d │  │
│ │ Component Work (8%)   ███░░░░░░░░░░░░░░░░░░░░░  9.6d  │  │
│ └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ Allocation by Role                                          │
│ ┌─────────────┬──────────┬──────────┬──────────┬─────────┐ │
│ │ Category    │ Dev      │ PD       │ QA       │ Total   │ │
│ ├─────────────┼──────────┼──────────┼──────────┼─────────┤ │
│ │ Features    │ 64d      │ 20d      │ 12d      │ 96d     │ │
│ │ IT Excell.  │ 9.6d     │ 3d       │ 1.8d     │ 14.4d   │ │
│ │ Component   │ 6.4d     │ 2d       │ 1.2d     │ 9.6d    │ │
│ └─────────────┴──────────┴──────────┴──────────┴─────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [📅 Iterations] [👥 Members]                    (Tab View)  │
├─────────────────────────────────────────────────────────────┤
│ Iteration 1 (Jan 6 - Jan 19)                               │
│   Total: 30d │ Dev: 20d │ PD: 6.25d │ QA: 3.75d            │
│ Iteration 2 (Jan 20 - Feb 2)                               │
│   Total: 30d │ Dev: 20d │ PD: 6.25d │ QA: 3.75d            │
│ ...                                                         │
├─────────────────────────────────────────────────────────────┤
│ [Manage Members] [PI Allocations] [Edit Team] [Delete]     │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Metrics
- Users can view complete capacity breakdown in < 3 seconds
- All data is accurate and matches source calculations
- Users can drill down from summary to iteration to member level
- Reduced time to answer capacity questions by 50%

## Out of Scope
- Editing capacity directly from this view (use dedicated panels)
- Historical PI comparison
- Forecasting/predictions

## Dependencies
- Existing team capacity calculation service
- PI and Iteration data models
- Capacity allocation categories configuration

## Timeline
- Estimated effort: 1-2 days
- Priority: High
