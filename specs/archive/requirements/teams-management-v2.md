# Teams Management - Requirements Specification v2.0

**Document Version:** 2.0  
**Created:** 2026-01-15  
**Author:** Product Manager Agent  
**Status:** Draft  

---

## 1. Overview

### 1.1 Purpose
The Teams Management feature enables comprehensive capacity planning by allowing Scrum Masters to configure their teams with individual team members, accounting for holidays, leaves, working days, and productivity percentages. RTEs can define global productivity factors while Scrum Masters manage individual-level adjustments.

### 1.2 Scope
- Team CRUD operations
- Team member management with individual capacity
- Holiday and leave tracking per member
- Working days calculation per quarter
- Productivity percentage configuration (global + individual)
- Multi-year support (scalable beyond 2026)
- Product-team associations

### 1.3 Key Personas
- **RTE (Release Train Engineer)** - Defines global productivity percentages, oversees all teams
- **Scrum Master** - Sets up team, adds members, manages leaves/holidays, sets individual productivity
- **Train Product Manager** - Views team capacity for planning
- **Team Members** - View their allocation

### 1.4 Key Workflow
```
RTE defines global productivity % (e.g., 70%)
    ↓
SM creates team and adds team members
    ↓
SM enters each member's:
  - Working days per quarter
  - Planned holidays/leaves
  - Individual productivity % (optional override)
    ↓
System calculates effective capacity per quarter
    ↓
Capacity available for feature assignment
```

---

## 2. User Stories

### US-TM-001: Define Global Productivity Settings (RTE)
**As an** RTE  
**I want to** define global productivity percentages  
**So that** all teams use consistent baseline productivity factors

**Acceptance Criteria:**
- [ ] Settings page accessible to RTE role
- [ ] Global productivity percentage (default 70%)
- [ ] Can define per-year settings
- [ ] Changes apply to all teams unless overridden
- [ ] Audit log of changes

**Priority:** High

---

### US-TM-002: Create Team with Product Association
**As a** Scrum Master  
**I want to** create a team and associate it with products  
**So that** the team can work on specific product features

**Acceptance Criteria:**
- [ ] Form fields: Team Name*, Short Code*, Description, Status
- [ ] Multi-select for associated products
- [ ] Team can be associated with multiple products
- [ ] Team can also work on cross-product features
- [ ] Default status: Active

**Priority:** High

---

### US-TM-003: Add Team Members
**As a** Scrum Master  
**I want to** add individual team members to my team  
**So that** I can calculate accurate capacity based on real people

**Acceptance Criteria:**
- [ ] Add member with: Name*, Email, Role (Developer/QA/Designer/Other)
- [ ] Set member's standard working hours per day (default: 8)
- [ ] Set member's allocation percentage to this team (0-100%)
- [ ] Member can be part of multiple teams with split allocation
- [ ] Active/Inactive status per member
- [ ] Start date and optional end date

**Priority:** High

---

### US-TM-004: Configure Member Quarterly Availability
**As a** Scrum Master  
**I want to** configure each member's availability per quarter  
**So that** I can account for holidays, leaves, and actual working days

**Acceptance Criteria:**
- [ ] For each quarter (Q1-Q4) and year:
  - Total working days in quarter (auto-calculated from calendar)
  - Planned holidays (public holidays)
  - Planned leaves (vacation, sick leave buffer)
  - Available working days = Total - Holidays - Leaves
- [ ] Can copy configuration from previous quarter/year
- [ ] Bulk update for common holidays across team

**Priority:** High

---

### US-TM-005: Set Individual Productivity Override
**As a** Scrum Master  
**I want to** set individual productivity percentages for team members  
**So that** I can account for varying productivity levels (junior vs senior, part-time, etc.)

**Acceptance Criteria:**
- [ ] Default: Use global productivity % from RTE settings
- [ ] Override: Set individual productivity % (0-100%)
- [ ] Reason field for override (optional)
- [ ] Visual indicator when override is active
- [ ] Can reset to global default

**Priority:** High

---

### US-TM-006: View Calculated Team Capacity
**As a** Scrum Master or RTE  
**I want to** view the calculated effective capacity for my team  
**So that** I can see realistic capacity for planning

**Acceptance Criteria:**
- [ ] Shows per-quarter breakdown:
  - Raw capacity (total working days × members)
  - After holidays/leaves
  - After productivity % applied
  - Final effective capacity (in story points or days)
- [ ] Drill-down to see per-member contribution
- [ ] Compare across quarters
- [ ] Year selector for multi-year view

**Priority:** High

---

### US-TM-007: Capacity Calculation Formula
**As a** system  
**I want to** calculate team capacity accurately  
**So that** planning is based on realistic numbers

**Calculation Formula:**
```
For each team member:
  available_days = working_days - holidays - leaves
  member_capacity = available_days × allocation_% × productivity_%
  
Team quarterly capacity = SUM(member_capacity for all active members)

Where:
  productivity_% = individual_override OR global_productivity_%
  allocation_% = member's allocation to this team (for shared members)
```

**Priority:** High

---

### US-TM-008: Multi-Year Support
**As a** Train Product Manager  
**I want to** manage capacity for multiple years  
**So that** I can plan beyond the current year

**Acceptance Criteria:**
- [ ] Year selector in all team views
- [ ] Copy capacity configuration to next year
- [ ] Historical data preserved
- [ ] Default view shows current year
- [ ] Can configure future years in advance

**Priority:** Medium

---

## 3. Business Rules

### BR-TM-001: Productivity Percentage Hierarchy
1. Global productivity % is set by RTE (applies to all)
2. Individual productivity % can override global (set by SM)
3. If no individual override, global applies

### BR-TM-002: Allocation Percentage
- Team member can be allocated 0-100% to a team
- Total allocation across all teams should not exceed 100%
- System warns if over-allocated

### BR-TM-003: Working Days Calculation
- Standard working days per quarter (excluding weekends)
- Q1 (Jan-Mar): ~63 days
- Q2 (Apr-Jun): ~63 days
- Q3 (Jul-Sep): ~65 days
- Q4 (Oct-Dec): ~62 days
- Actual varies by year and locale

### BR-TM-004: Capacity Units
- Primary unit: Effort Days
- Can convert to Story Points using team velocity factor
- Velocity factor configurable per team

### BR-TM-005: Product Association
- Teams can work on multiple products
- Some teams are product-specific
- Some teams are shared/platform teams

---

## 4. Data Model Requirements

### 4.1 Team Entity

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `name` | String | Required, max 100, unique | Team name |
| `short_code` | String | Required, 2-10 chars, unique | Short identifier |
| `description` | Text | Optional | Team description |
| `status` | Enum | Required | 'active', 'inactive' |
| `velocity_factor` | Decimal | Default 1.0 | Days to story points conversion |
| `created_at` | Timestamp | Auto | Creation timestamp |
| `updated_at` | Timestamp | Auto | Last modification |

### 4.2 TeamMember Entity

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `team_id` | UUID | FK to Team | Associated team |
| `name` | String | Required, max 100 | Member name |
| `email` | String | Optional, max 100 | Email address |
| `role` | Enum | Required | 'developer', 'qa', 'designer', 'scrum_master', 'other' |
| `allocation_percentage` | Integer | 0-100, default 100 | % allocated to this team |
| `hours_per_day` | Decimal | Default 8.0 | Standard working hours |
| `individual_productivity` | Integer | Nullable, 0-100 | Override productivity % |
| `start_date` | Date | Required | When member joined team |
| `end_date` | Date | Nullable | When member left (if applicable) |
| `status` | Enum | Required | 'active', 'inactive' |
| `created_at` | Timestamp | Auto | Creation timestamp |

### 4.3 MemberQuarterlyAvailability Entity

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `member_id` | UUID | FK to TeamMember | Associated member |
| `year` | Integer | Required | Fiscal year |
| `quarter` | Integer | 1-4 | Quarter number |
| `working_days` | Integer | ≥ 0 | Total working days in quarter |
| `holidays` | Integer | ≥ 0 | Public holidays |
| `leaves` | Integer | ≥ 0 | Planned leaves |
| `notes` | Text | Optional | Any notes |

### 4.4 GlobalSettings Entity

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `year` | Integer | Required, unique | Fiscal year |
| `global_productivity_percentage` | Integer | 0-100, default 70 | Default productivity |
| `default_hours_per_day` | Decimal | Default 8.0 | Standard hours |
| `created_by` | UUID | FK to User | RTE who set it |
| `updated_at` | Timestamp | Auto | Last modification |

### 4.5 TeamProduct Association

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `team_id` | UUID | FK to Team | Team |
| `product_id` | UUID | FK to Product | Product |
| Primary Key: (team_id, product_id) |

### 4.6 Relationships

```
Team (1) ←→ (M) TeamMember
TeamMember (1) ←→ (M) MemberQuarterlyAvailability
Team (M) ←→ (M) Product (via TeamProduct)
GlobalSettings - standalone per year
```

---

## 5. Calculated Fields

### 5.1 Member Effective Capacity (per quarter)
```python
def calculate_member_capacity(member, year, quarter, global_settings):
    availability = get_availability(member, year, quarter)
    available_days = availability.working_days - availability.holidays - availability.leaves
    
    productivity = member.individual_productivity or global_settings.global_productivity_percentage
    
    effective_days = available_days * (member.allocation_percentage / 100) * (productivity / 100)
    
    return effective_days
```

### 5.2 Team Quarterly Capacity
```python
def calculate_team_capacity(team, year, quarter):
    total_capacity = 0
    for member in team.active_members:
        if member.is_active_in_quarter(year, quarter):
            total_capacity += calculate_member_capacity(member, year, quarter)
    
    # Convert to story points if needed
    story_points = total_capacity * team.velocity_factor
    return {
        'effort_days': total_capacity,
        'story_points': story_points
    }
```

---

## 6. API Endpoints

### 6.1 Global Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings/global/{year}` | Get global settings for year |
| PUT | `/api/settings/global/{year}` | Update global settings (RTE only) |

### 6.2 Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams` | List all teams |
| POST | `/api/teams` | Create team |
| GET | `/api/teams/{id}` | Get team with members |
| PUT | `/api/teams/{id}` | Update team |
| DELETE | `/api/teams/{id}` | Delete team |
| GET | `/api/teams/{id}/capacity/{year}` | Get calculated capacity |

### 6.3 Team Members
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams/{id}/members` | List team members |
| POST | `/api/teams/{id}/members` | Add member |
| PUT | `/api/teams/{id}/members/{member_id}` | Update member |
| DELETE | `/api/teams/{id}/members/{member_id}` | Remove member |

### 6.4 Member Availability
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/members/{id}/availability/{year}` | Get member's yearly availability |
| PUT | `/api/members/{id}/availability/{year}/{quarter}` | Update quarterly availability |
| POST | `/api/members/{id}/availability/copy` | Copy from previous period |

---

## 7. UI/UX Notes

### 7.1 Team Setup Wizard (for Scrum Masters)
**Step 1: Team Details**
- Team name, code, description
- Product associations

**Step 2: Add Members**
- Add each team member
- Set role and allocation %

**Step 3: Configure Availability**
- For each member, set quarterly availability
- Holidays and leaves

**Step 4: Review Capacity**
- See calculated capacity
- Adjust if needed

### 7.2 Capacity Dashboard View
- Heatmap showing all teams × quarters
- Color coding by utilization
- Drill-down to team details
- Year selector

### 7.3 Member Availability Grid
- Rows: Team members
- Columns: Q1, Q2, Q3, Q4
- Cells: Working days / Holidays / Leaves / Effective days
- Inline editing

---

## 8. Migration from v1.0

### 8.1 Data Migration
- Existing TeamCapacity data maps to team-level totals
- Need to create TeamMember records
- Need to create MemberQuarterlyAvailability records

### 8.2 Backward Compatibility
- Keep simple capacity input as "quick mode"
- Detailed member-level as "advanced mode"
- Teams can use either mode

---

## 9. Acceptance Testing Scenarios

### AT-TM-001: RTE Sets Global Productivity
1. Login as RTE
2. Go to Settings > Global
3. Set 2026 productivity to 70%
4. Save
5. **Expected:** All teams use 70% unless overridden

### AT-TM-002: SM Creates Team with Members
1. Login as Scrum Master
2. Create team "Platform Team"
3. Add 5 members with varying allocations
4. Set Q1 availability for each
5. **Expected:** Team capacity calculated correctly

### AT-TM-003: Individual Productivity Override
1. Set member's individual productivity to 80%
2. View team capacity
3. **Expected:** That member's contribution uses 80%, others use global

### AT-TM-004: Multi-Year Planning
1. Configure 2026 capacity
2. Copy to 2027
3. Adjust 2027 holidays
4. **Expected:** Both years have independent configurations

---

## 10. Dependencies

### 10.1 Upstream
- Products module (for team-product association)
- User/Role management (for RTE vs SM permissions)

### 10.2 Downstream
- Features module (team assignment)
- Dashboard (capacity heatmap)
- PI Planning (capacity allocation)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-15 | PM Agent | Initial draft |
| 2.0 | 2026-01-15 | PM Agent | Complete rewrite with member-level capacity, productivity %, holidays/leaves |
