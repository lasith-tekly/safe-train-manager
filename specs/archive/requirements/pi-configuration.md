# PI Configuration & Capacity Calculation - Requirements Specification

**Document Version:** 2.0  
**Created:** 2026-01-15  
**Updated:** 2026-01-16  
**Author:** Product Manager Agent  
**Status:** Approved  
**Feature Priority:** Critical  

---

## 1. Executive Summary

This specification defines the PI (Program Increment) Configuration system, Holiday Calendar, and Auto-Calculated Capacity features. These foundational features replace the current manual capacity entry with a structured, calendar-based approach aligned with SAFe methodology.

### 1.1 Business Drivers
- **Accuracy**: Auto-calculated capacity based on actual team composition
- **Consistency**: Standardized PI structure across the ART
- **Visibility**: Clear timeline view with week numbers
- **Efficiency**: Reduce manual data entry errors

### 1.2 Scope
- PI structure configuration (iterations, weeks)
- Holiday calendar management
- Capacity auto-calculation from team members
- Migration from manual capacity entry

---

## 2. Current State vs Target State

| Aspect | Current State | Target State |
|--------|---------------|--------------|
| Capacity Entry | Manual per quarter | Auto-calculated per iteration |
| PI Structure | None | Configurable PIs with iterations |
| Holidays | None | Global + team-specific calendar |
| Time Reference | Quarters only | Week numbers + iterations |
| Planning Granularity | Quarterly | Per iteration |

---

## 3. User Stories

### Epic: PI Configuration

#### US-PI-001: Configure PI Structure
**As an** RTE  
**I want to** define the PI structure for the year  
**So that** all planning is aligned to consistent time boundaries

**Acceptance Criteria:**
- [ ] Define number of PIs per year (typically 4-5)
- [ ] Each PI has:
  - Name (e.g., "PI 2026-Q1", "PI 26.1")
  - Start date (auto-calculates start week)
  - End date (auto-calculates end week)
  - Number of iterations (typically 4-6)
  - Status: planning, active, completed
- [ ] Each iteration has:
  - Name (e.g., "Sprint 1", "Iteration 1")
  - Duration in weeks (typically 2)
  - Start/end dates (auto-calculated)
  - Start/end week numbers (ISO week)
  - IP iteration flag (Innovation & Planning)
- [ ] Validation: iterations must fit within PI dates
- [ ] Validation: no overlapping PIs

**Business Rules:**
- BR-PI-001: PI dates cannot overlap
- BR-PI-002: Iteration dates must be within PI dates
- BR-PI-003: At least one iteration per PI
- BR-PI-004: Maximum 10 iterations per PI
- BR-PI-005: Iteration duration: 1-4 weeks

**Priority:** Critical

---

#### US-PI-002: Generate PIs from Template
**As an** RTE  
**I want to** quickly generate a year's PIs using a template  
**So that** I don't have to manually configure each PI

**Acceptance Criteria:**
- [ ] Template options:
  - **Standard SAFe**: 4 PIs, 5 iterations each (4 dev + 1 IP), 2-week sprints
  - **Quarterly**: 4 PIs aligned to calendar quarters
  - **Custom**: Define your own structure
- [ ] Input: Year and start date
- [ ] Auto-generate all PIs and iterations
- [ ] Preview before saving
- [ ] Adjust individual dates after generation
- [ ] Copy from previous year option

**Priority:** High

---

#### US-PI-003: Visual PI Calendar
**As a** Train Product Manager  
**I want to** see a visual calendar of all PIs and iterations  
**So that** I can understand the planning timeline at a glance

**Acceptance Criteria:**
- [ ] Year timeline view (Jan-Dec)
- [ ] Each PI shown as a colored block
- [ ] Iterations shown within PI blocks
- [ ] Week numbers displayed (W1, W2, ... W52/53)
- [ ] Month labels for reference
- [ ] Holidays marked with indicators
- [ ] Current week highlighted
- [ ] Click PI/iteration to view/edit details
- [ ] Zoom: Year view / Quarter view
- [ ] Print-friendly layout

**Priority:** High

---

#### US-PI-004: Edit PI and Iterations
**As an** RTE  
**I want to** modify PI and iteration dates  
**So that** I can adjust for schedule changes

**Acceptance Criteria:**
- [x] Edit PI name, dates, status
- [x] Edit iteration dates (with validation)
- [x] Add/remove iterations
- [ ] Drag-and-drop to adjust dates (optional)
- [x] Cascade changes option (shift subsequent iterations)
- [ ] Warning if changes affect allocated features

**Priority:** Medium

---

#### US-PI-005: Inline Iteration Duration Editing
**As an** RTE  
**I want to** change iteration duration directly in the Edit PI modal  
**So that** I can quickly adjust sprint lengths

**Acceptance Criteria:**
- [x] Dropdown selector for iteration weeks (1-4 weeks)
- [x] Changing duration triggers cascade preview
- [x] Preview shows impact on following iterations within PI
- [x] Preview shows impact on following PIs in the year
- [x] Option to cascade to following PIs (default) or apply to current PI only
- [x] All following PIs auto-selected in cascade preview

**Priority:** High

---

#### US-PI-006: Add Sprint Before IP
**As an** RTE  
**I want to** add new sprints that are automatically positioned before the IP iteration  
**So that** the IP always remains at the end of the PI

**Acceptance Criteria:**
- [x] "Add Sprint" button inserts sprint before IP iteration
- [x] "Add IP Iteration" button only appears when no IP exists
- [x] Following iterations (including IP) shift forward automatically
- [x] Adding sprint cascades to following PIs automatically
- [x] Sprint numbering is sequential (Sprint 1, Sprint 2, etc.)

**Priority:** High

---

#### US-PI-007: Year-Level Calendar Lock
**As an** RTE  
**I want to** lock the entire year's PI calendar  
**So that** accidental changes are prevented after planning is complete

**Acceptance Criteria:**
- [x] "Lock Calendar" toggle at year level (not per-PI)
- [x] When locked, editing shows confirmation dialog
- [x] "Unlock & Edit" option in confirmation dialog
- [x] No separate commit/uncommit workflow per PI
- [x] Visual indicator showing lock status
- [x] Lock state persists across sessions

**Business Rules:**
- BR-PI-006: Lock applies to all PIs in the year
- BR-PI-007: Locked calendar can still be edited with confirmation
- BR-PI-008: Lock is advisory, not enforced at API level

**Priority:** Medium

---

### Epic: Holiday Calendar

#### US-HOL-001: Configure Public Holidays
**As an** RTE  
**I want to** configure public holidays for the year  
**So that** capacity calculations exclude non-working days

**Acceptance Criteria:**
- [ ] Add holiday with:
  - Date
  - Name
  - Half-day flag (optional)
  - Recurring yearly flag (optional)
- [ ] Calendar view showing holidays
- [ ] List view with edit/delete
- [ ] Year selector for multi-year management
- [ ] Bulk delete option
- [ ] Holidays affect all teams by default

**Priority:** High

---

#### US-HOL-002: Import Holiday Presets
**As an** RTE  
**I want to** import holidays from country presets  
**So that** I don't have to manually enter common holidays

**Acceptance Criteria:**
- [ ] Preset options:
  - United States (Federal holidays)
  - United Kingdom
  - India
  - Australia
  - Custom (upload CSV)
- [ ] Preview before import
- [ ] Merge or replace existing
- [ ] Select which holidays to import

**Priority:** Medium

---

#### US-HOL-003: Team-Specific Holidays
**As a** Scrum Master  
**I want to** add team-specific holidays  
**So that** distributed teams can have different holiday calendars

**Acceptance Criteria:**
- [ ] Add holidays specific to a team
- [ ] Team holidays override global for that team
- [ ] Visual indicator for team-specific vs global
- [ ] View combined calendar for a team

**Priority:** Low (v2)

---

### Epic: Capacity Auto-Calculation

#### US-CAP-001: Auto-Calculate Team Capacity per Iteration
**As a** Scrum Master  
**I want** capacity to be auto-calculated from team members  
**So that** I get accurate capacity without manual entry

**Acceptance Criteria:**
- [ ] Capacity calculated per iteration (not just quarter)
- [ ] Formula:
  ```
  For each team member:
    iteration_working_days = (iteration_weeks × 5) - holidays_in_iteration
    member_available_days = iteration_working_days - member_leaves
    member_capacity = member_available_days × (allocation% / 100) × (productivity% / 100)
  
  Team Iteration Capacity = Σ member_capacity (for all active members)
  ```
- [ ] Show breakdown:
  - By iteration within PI
  - By quarter (sum of iterations in quarter)
  - By member contribution
- [ ] Recalculate button to refresh
- [ ] Auto-recalculate when:
  - Team member added/removed
  - Member availability changes
  - Holiday added/removed

**Priority:** Critical

---

#### US-CAP-002: Manual Capacity Override
**As a** Scrum Master  
**I want to** manually override calculated capacity  
**So that** I can account for special circumstances

**Acceptance Criteria:**
- [ ] Override calculated value with manual entry
- [ ] Reason field required for override
- [ ] Visual indicator when override is active
- [ ] Reset to calculated value option
- [ ] Audit log of overrides

**Priority:** High

---

#### US-CAP-003: Capacity by Iteration View
**As a** Train Product Manager  
**I want to** see capacity broken down by iteration  
**So that** I can plan features at iteration level

**Acceptance Criteria:**
- [ ] Table view:
  | Team | Iter 1 | Iter 2 | Iter 3 | Iter 4 | IP | PI Total |
  |------|--------|--------|--------|--------|----| ---------|
  | Team A | 45/50 | 40/50 | 48/50 | 45/50 | 10/20 | 188/220 |
- [ ] Each cell shows: Allocated / Available
- [ ] Color coding:
  - Green: < 80% utilized
  - Orange: 80-90% utilized
  - Red: > 90% utilized
- [ ] Filter by PI
- [ ] Drill-down to team details
- [ ] Export to CSV

**Priority:** High

---

#### US-CAP-004: Member Leave Management
**As a** Scrum Master  
**I want to** record planned leaves for team members  
**So that** capacity calculations are accurate

**Acceptance Criteria:**
- [ ] Add leave for member:
  - Start date, end date
  - Type: Vacation, Sick, Training, Other
  - Full-day or half-day
- [ ] Calendar view of team leaves
- [ ] Leaves automatically reduce capacity
- [ ] Conflict warning if leave overlaps with holidays

**Priority:** High

---

## 4. Data Model

### 4.1 PI (Program Increment)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `name` | String(50) | Required, unique per year | PI name |
| `year` | Integer | Required, indexed | Fiscal year |
| `sequence` | Integer | Required | Order within year (1, 2, 3...) |
| `start_date` | Date | Required | PI start date |
| `end_date` | Date | Required | PI end date |
| `start_week` | Integer | Calculated | ISO week number of start |
| `end_week` | Integer | Calculated | ISO week number of end |
| `status` | Enum | Required | 'planning', 'active', 'completed' |
| `created_at` | Timestamp | Auto | Creation timestamp |
| `updated_at` | Timestamp | Auto | Last update |

**Indexes:** year, status, (year + sequence)

---

### 4.2 Iteration

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `pi_id` | UUID | FK to PI, indexed | Parent PI |
| `name` | String(50) | Required | Iteration name |
| `sequence` | Integer | Required | Order within PI (1, 2, 3...) |
| `start_date` | Date | Required | Iteration start date |
| `end_date` | Date | Required | Iteration end date |
| `start_week` | Integer | Calculated | ISO week number |
| `end_week` | Integer | Calculated | ISO week number |
| `duration_weeks` | Integer | Required, 1-4 | Length in weeks |
| `is_ip_iteration` | Boolean | Default false | Innovation & Planning |
| `working_days` | Integer | Calculated | Excluding weekends & holidays |
| `created_at` | Timestamp | Auto | Creation timestamp |

**Indexes:** pi_id, (pi_id + sequence)

---

### 4.3 Holiday

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `name` | String(100) | Required | Holiday name |
| `date` | Date | Required | Holiday date |
| `year` | Integer | Required, indexed | Year for filtering |
| `is_half_day` | Boolean | Default false | Half-day holiday |
| `is_recurring` | Boolean | Default false | Repeats yearly |
| `team_id` | UUID | FK, nullable | NULL = global |
| `country_code` | String(2) | Optional | Country code (US, UK, IN) |
| `created_at` | Timestamp | Auto | Creation timestamp |

**Indexes:** year, date, team_id
**Unique:** (date, team_id) - no duplicate holidays per team/global

---

### 4.4 MemberLeave

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `member_id` | UUID | FK to TeamMember | Team member |
| `start_date` | Date | Required | Leave start |
| `end_date` | Date | Required | Leave end |
| `leave_type` | Enum | Required | 'vacation', 'sick', 'training', 'other' |
| `is_half_day` | Boolean | Default false | Half-day leave |
| `notes` | Text | Optional | Notes |
| `created_at` | Timestamp | Auto | Creation timestamp |

**Indexes:** member_id, (start_date, end_date)

---

### 4.5 TeamIterationCapacity

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `team_id` | UUID | FK to Team | Team |
| `iteration_id` | UUID | FK to Iteration | Iteration |
| `calculated_capacity` | Decimal(6,2) | Auto | System calculated |
| `manual_override` | Decimal(6,2) | Nullable | Manual override |
| `override_reason` | Text | Nullable | Reason for override |
| `allocated` | Decimal(6,2) | Default 0 | Allocated to features |
| `created_at` | Timestamp | Auto | Creation timestamp |
| `updated_at` | Timestamp | Auto | Last update |

**Computed:** `final_capacity` = manual_override ?? calculated_capacity
**Indexes:** team_id, iteration_id
**Unique:** (team_id, iteration_id)

---

### 4.6 Entity Relationships

```
Year
  └── PI (1:M)
        └── Iteration (1:M)
              └── TeamIterationCapacity (1:M per team)

Holiday
  ├── Global (team_id = NULL)
  └── Team-specific (team_id = FK)

Team
  └── TeamMember (1:M)
        └── MemberLeave (1:M)
        └── MemberQuarterlyAvailability (existing, to be deprecated)

Feature
  └── iteration_id (new FK, optional)
```

---

## 5. API Endpoints

### 5.1 PI Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pis?year={year}` | List PIs for year with iterations |
| POST | `/api/pis` | Create PI with iterations |
| GET | `/api/pis/{id}` | Get PI with iterations |
| PUT | `/api/pis/{id}` | Update PI |
| DELETE | `/api/pis/{id}` | Delete PI (cascade iterations) |
| POST | `/api/pis/generate` | Generate PIs from template |
| POST | `/api/pis/{id}/copy` | Copy PI to new dates |

### 5.2 Iterations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pis/{pi_id}/iterations` | List iterations for PI |
| POST | `/api/pis/{pi_id}/iterations` | Add iteration to PI |
| PUT | `/api/iterations/{id}` | Update iteration |
| DELETE | `/api/iterations/{id}` | Delete iteration |

### 5.3 Holidays

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/holidays?year={year}&team_id={id}` | List holidays |
| POST | `/api/holidays` | Add holiday |
| PUT | `/api/holidays/{id}` | Update holiday |
| DELETE | `/api/holidays/{id}` | Delete holiday |
| POST | `/api/holidays/import` | Import from preset |
| GET | `/api/holidays/presets` | List available presets |

### 5.4 Member Leaves

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/members/{id}/leaves?year={year}` | Get member leaves |
| POST | `/api/members/{id}/leaves` | Add leave |
| PUT | `/api/leaves/{id}` | Update leave |
| DELETE | `/api/leaves/{id}` | Delete leave |

### 5.5 Capacity

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams/{id}/capacity/iterations?pi_id={pi}` | Get iteration capacity |
| POST | `/api/teams/{id}/capacity/calculate` | Recalculate all capacity |
| PUT | `/api/teams/{id}/capacity/iterations/{iter_id}` | Override capacity |
| GET | `/api/capacity/summary?year={year}&pi_id={pi}` | All teams capacity summary |

---

## 6. UI Requirements

### 6.1 New Setup Tab: "PI Calendar"

**Location:** Setup > PI Calendar (new tab)

**Components:**
1. **PI Timeline View** - Visual calendar showing all PIs
2. **PI Form Panel** - Create/edit PI with iterations
3. **Iteration List** - Manage iterations within PI
4. **Generate Wizard** - Template-based PI generation

### 6.2 New Setup Tab: "Holidays"

**Location:** Setup > Holidays (new tab)

**Components:**
1. **Holiday Calendar View** - Calendar with holidays marked
2. **Holiday List View** - Table of all holidays
3. **Holiday Form** - Add/edit holiday
4. **Import Modal** - Import from presets

### 6.3 Enhanced Teams Tab

**Changes:**
1. Replace quarterly capacity with iteration capacity
2. Add "Leaves" button to member management
3. Show capacity breakdown by iteration
4. Add capacity recalculate action

---

## 7. Migration Strategy

### Phase 1: Database
1. Create new tables: PI, Iteration, Holiday, MemberLeave, TeamIterationCapacity
2. Keep existing: TeamCapacity, MemberQuarterlyAvailability

### Phase 2: Backend
1. Implement new API endpoints
2. Implement capacity calculation service
3. Keep existing endpoints working

### Phase 3: Frontend
1. Add PI Calendar tab
2. Add Holidays tab
3. Update Teams tab with new capacity view
4. Keep old capacity view as fallback

### Phase 4: Data Migration
1. Generate default PIs from existing quarters
2. Migrate MemberQuarterlyAvailability to MemberLeave
3. Calculate initial TeamIterationCapacity

### Phase 5: Deprecation
1. Remove old capacity entry UI
2. Mark old endpoints as deprecated
3. Remove old tables in future release

---

## 8. Acceptance Testing Scenarios

### AT-PI-001: Generate Standard PIs
1. Go to Setup > PI Calendar
2. Click "Generate PIs"
3. Select "Standard SAFe" template
4. Enter year 2026, start date Jan 6
5. **Expected:** 4 PIs generated with 5 iterations each

### AT-PI-002: Add Holiday
1. Go to Setup > Holidays
2. Click "Add Holiday"
3. Enter "New Year's Day", Jan 1, 2026
4. **Expected:** Holiday appears on calendar

### AT-CAP-001: Auto-Calculate Capacity
1. Create team with 3 members
2. Set member availability
3. View team capacity for PI
4. **Expected:** Capacity calculated per iteration

### AT-CAP-002: Override Capacity
1. View team iteration capacity
2. Click override for Iteration 1
3. Enter manual value with reason
4. **Expected:** Override shown with indicator

---

## 9. Dependencies

### Upstream
- Team Members module (existing)
- Global Settings (productivity %)

### Downstream
- Features module (iteration assignment)
- Dashboard (capacity heatmap by iteration)
- Reporting (PI-based reports)

---

## 10. Out of Scope (v1)

- Drag-and-drop calendar editing
- Team-specific holidays
- Recurring leave patterns
- Integration with external calendars (Google, Outlook)
- PI objectives and features planning board

---

## 11. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-15 | PM Agent | Initial specification |
| 2.0 | 2026-01-16 | PM Agent | Added US-PI-005 (Inline iteration editing), US-PI-006 (Add sprint before IP), US-PI-007 (Year-level calendar lock). Updated US-PI-004 with cascade implementation. Replaced per-PI commit with year-level lock. |

---

## 12. Agent Handoff

### Next Steps:

1. **@Backend-Architect**: Review data model, design detailed API schemas
2. **@UI-Designer**: Create visual mockups for PI Calendar and Holiday views
3. **@Frontend-Architect**: Plan component structure and state management
4. **@Backend-Developer**: Implement models, migrations, and routes
5. **@Frontend-Developer**: Implement UI components

### Artifacts to Create:
- `specs/architecture/pi-configuration-api.md` (Backend Architect)
- `specs/design/pi-calendar-mockups.md` (UI Designer)
- `specs/architecture/pi-frontend-structure.md` (Frontend Architect)
