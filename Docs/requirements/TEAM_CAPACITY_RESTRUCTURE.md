# Team Capacity Management - Requirements Document

## Overview
Restructure the Team and Capacity management to align with SAFe roles and responsibilities.

---

## User Roles

### RTE (Release Train Engineer) - Admin Level
- Creates and manages Teams at the Train level
- Configures global settings (Sites, Capacity Allocations, etc.)
- One-time setup that persists across PIs

### Scrum Master (SM) - Team Level
- Manages their team's members
- Updates PI-level data (leaves, productivity)
- Views and manages team capacity

---

## Requirements

### REQ-1: Move Team Creation to Settings Section

**User Story:**
As an RTE, I want to create teams in the Settings section so that team setup is treated as a Train-level configuration.

**Acceptance Criteria:**
- [ ] Team creation form is in Settings > Teams (new sub-section)
- [ ] Team requires: Name, Short Code, Product (single), Site
- [ ] Site can be "Global" for distributed teams
- [ ] Teams persist until RTE removes them
- [ ] Remove team creation from main Teams navigation

**Business Rules:**
- One team can only be assigned to one Product
- Team-Product assignment is set at creation and rarely changes
- Site determines unit cost for budget calculations

---

### REQ-2: Team Members Management (SM Workflow)

**User Story:**
As a Scrum Master, I want to select my team and manage team members so that I can maintain accurate capacity data.

**Acceptance Criteria:**
- [ ] SM selects their team from a dropdown/list
- [ ] SM can add/remove team members
- [ ] Team members persist across all PIs unless explicitly removed
- [ ] Member data includes: Name, Role, Site, Train Allocation %

**Business Rules:**
- Members are not PI-specific by default
- SM can remove a member from specific PIs (not delete entirely)
- New members inherit default productivity from global settings

---

### REQ-3: PI-Level Member Data Updates

**User Story:**
As a Scrum Master, I want to update PI-specific data for my team members so that capacity calculations are accurate for each PI.

**Acceptance Criteria:**
- [ ] SM can update individual member leaves per PI
- [ ] SM can update individual member productivity per PI
- [ ] SM can update train allocation % per PI
- [ ] Changes only affect the selected PI

**Data Model:**
- MemberPIAllocation: member_id, pi_id, train_allocation_percent, productivity_percent, leaves

---

### REQ-4: Team Capacity View

**User Story:**
As a Scrum Master, I want to see my team's capacity breakdown for a specific PI so that I can plan effectively.

**Acceptance Criteria:**
- [ ] Show capacity by Role (Dev, QA, BA/PD)
- [ ] Show capacity by Allocation Category (Feature, Component, IT Excellence, etc.)
- [ ] Categories come from Settings > Capacity Allocation
- [ ] View updates when different PI is selected

**Display:**
```
Team: Nova | PI: 2026.1

Total Capacity: 120 days

By Role:
- Developer: 80 days (4 members)
- QA: 25 days (2 members)
- BA/PD: 15 days (1 member)

By Allocation:
- Feature Work: 84 days (70%)
- Component Work: 24 days (20%)
- IT Excellence: 12 days (10%)
```

---

### REQ-5: Train Capacity Aggregation

**User Story:**
As an RTE, I want to see the total Train capacity aggregated from all teams so that I can plan at the Train level.

**Acceptance Criteria:**
- [ ] Sum capacity from all active teams
- [ ] Apply global parameters from Settings
- [ ] Show breakdown by team
- [ ] Show breakdown by role across Train

---

### REQ-6: Site Unit Cost in Settings

**User Story:**
As an RTE, I want to configure unit cost per site so that budget calculations reflect actual costs.

**Acceptance Criteria:**
- [ ] Each Site has a unit_cost_keur field
- [ ] Default value from global settings if not set
- [ ] Used in budget calculations based on team/member site

**Data Model:**
- Site.unit_cost_keur (Numeric, default 85.0 KEUR/year)

---

### REQ-7: Remove PI Generation Defaults

**User Story:**
As an RTE, I don't need PI generation defaults in Settings as they are not useful.

**Acceptance Criteria:**
- [ ] Remove "PI Generation Defaults" card from Settings
- [ ] Keep the data in backend for backward compatibility
- [ ] PI configuration is done in PI Calendar section

---

## Data Model Changes

### Site (Update)
```python
unit_cost_keur = Column(Numeric(10, 2), default=85.0)  # KEUR/year per FTE
```

### Team (Update)
```python
product_id = Column(String(36), ForeignKey("products.id"))  # Single product assignment
# Remove many-to-many team_products table usage for new teams
```

---

## UI Changes

### Settings Tab
1. Add "Sites" section with unit cost management
2. Add "Teams" section for RTE team creation
3. Remove "PI Generation Defaults" section

### Teams Navigation
1. Team selector at top (SM selects their team)
2. Team Members management panel
3. PI-level data editing
4. Capacity view with role and allocation breakdown

---

## API Changes

### New/Updated Endpoints
- `PUT /sites/{id}` - Update site including unit_cost_keur
- `GET /teams/{id}/capacity/summary?pi_id=xxx` - Already exists, ensure role/allocation breakdown
- `PUT /team-members/{id}/pi-allocation` - Update PI-specific member data

---

## Priority
1. Site unit cost (backend + Settings UI)
2. Remove PI defaults from Settings
3. Team creation in Settings
4. Teams page restructure for SM workflow
5. Capacity view enhancements

---

*Document Version: 1.0*
*Created: 2026-01-17*
*Author: Product Manager Agent*
