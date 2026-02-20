# Teams Management - Requirements Specification

**Document Version:** 1.0  
**Created:** 2026-01-15  
**Author:** Product Manager Agent  
**Status:** Draft  

---

## 1. Overview

### 1.1 Purpose
The Teams Management feature enables Train Product Managers to configure development teams and their quarterly capacity allocations. Teams are the fundamental resource unit for capacity planning and feature assignment.

### 1.2 Scope
- Team CRUD operations
- Quarterly capacity configuration
- Capacity utilization tracking
- Team-product associations

### 1.3 Key Personas
- **Train Product Manager** (primary) - Creates and manages teams
- **Scrum Masters** - View team capacity and assignments
- **Epic Owners** - Assign features to teams

---

## 2. User Stories

### US-TM-001: View All Teams
**As a** Train Product Manager  
**I want to** view all teams in a table with their quarterly capacity  
**So that** I can see team availability at a glance

**Acceptance Criteria:**
- [ ] Table displays: Team Name, Members count, Q1-Q4 capacity columns
- [ ] Each quarter shows: Allocated/Total capacity with progress bar
- [ ] Color coding: Green (<80%), Yellow (80-89%), Red (≥90%)
- [ ] Filter by status (Active/Inactive)
- [ ] Search by team name
- [ ] Sort by any column
- [ ] Empty state when no teams exist

**Priority:** High

---

### US-TM-002: Create New Team
**As a** Train Product Manager  
**I want to** create a new team with capacity allocations  
**So that** I can add new teams to the capacity planning

**Acceptance Criteria:**
- [ ] "Add Team" button opens side panel
- [ ] Form fields: Team Name*, Short Code*, Description, Status
- [ ] Quarterly capacity section with Q1-Q4 inputs (in story points)
- [ ] Default capacity: 0 for all quarters
- [ ] Validation on required fields
- [ ] Save creates team and refreshes table
- [ ] Success toast notification

**Priority:** High

---

### US-TM-003: Edit Team
**As a** Train Product Manager  
**I want to** edit an existing team's details and capacity  
**So that** I can update team information as it changes

**Acceptance Criteria:**
- [ ] "Edit" action opens side panel with current values
- [ ] Can modify all fields
- [ ] Cannot change short code if team has assigned features
- [ ] Save updates team and refreshes table
- [ ] Cancel discards changes

**Priority:** High

---

### US-TM-004: Delete Team
**As a** Train Product Manager  
**I want to** delete a team that is no longer needed  
**So that** I can keep the team list clean

**Acceptance Criteria:**
- [ ] "Delete" action shows confirmation dialog
- [ ] Cannot delete teams with assigned features
- [ ] Successful deletion removes team from table
- [ ] Error message if deletion fails

**Priority:** Medium

---

### US-TM-005: View Team Details
**As a** Train Product Manager  
**I want to** view detailed information about a team  
**So that** I can see their full capacity and assignments

**Acceptance Criteria:**
- [ ] Click team name or "View" opens detail panel
- [ ] Shows all team information
- [ ] Shows quarterly capacity breakdown
- [ ] Shows list of assigned features (if any)
- [ ] Shows capacity utilization per quarter

**Priority:** Medium

---

### US-TM-006: Bulk Import Teams
**As a** Train Product Manager  
**I want to** import multiple teams from a CSV file  
**So that** I can quickly set up teams from existing data

**Acceptance Criteria:**
- [ ] "Import" button opens file upload dialog
- [ ] CSV format: Name, Short Code, Description, Q1, Q2, Q3, Q4
- [ ] Validation of CSV format and data
- [ ] Preview before import
- [ ] Error report for invalid rows
- [ ] Success count after import

**Priority:** Low

---

## 3. Business Rules

### BR-TM-001: Unique Team Identification
Team names and short codes must be unique across the system.

### BR-TM-002: Short Code Format
Short codes must be 2-10 uppercase alphanumeric characters.

### BR-TM-003: Capacity Constraints
- Quarterly capacity must be non-negative integers
- Capacity represents story points available per quarter
- Allocated capacity cannot exceed total capacity

### BR-TM-004: Team Status
- Active teams can be assigned features
- Inactive teams cannot receive new feature assignments
- Existing assignments remain when team is deactivated

### BR-TM-005: Deletion Protection
Teams with assigned features cannot be deleted. Features must be reassigned first.

### BR-TM-006: Fiscal Year Alignment
Quarters align with fiscal year (Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec).

---

## 4. Data Model Requirements

### 4.1 Team Entity

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Unique identifier |
| `name` | String | Required, max 100, unique | Team name |
| `short_code` | String | Required, 2-10 chars, unique | Short identifier |
| `description` | Text | Optional, max 500 | Team description |
| `status` | Enum | Required | Values: 'active', 'inactive' |
| `created_at` | Timestamp | Auto-generated | Creation timestamp |
| `updated_at` | Timestamp | Auto-updated | Last modification |

### 4.2 TeamCapacity Entity

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Unique identifier |
| `team_id` | UUID | FK to Team, required | Associated team |
| `year` | Integer | Required, 2020-2100 | Fiscal year |
| `q1_capacity` | Integer | Default 0, ≥ 0 | Q1 story points |
| `q2_capacity` | Integer | Default 0, ≥ 0 | Q2 story points |
| `q3_capacity` | Integer | Default 0, ≥ 0 | Q3 story points |
| `q4_capacity` | Integer | Default 0, ≥ 0 | Q4 story points |

### 4.3 Relationships

| Relationship | Type | Description |
|--------------|------|-------------|
| Team → TeamCapacity | One-to-Many | A team has capacity per year |
| Team → Feature | One-to-Many | Features assigned to teams |

### 4.4 Indexes
- Unique index on `name`
- Unique index on `short_code`
- Index on `status`
- Unique index on `team_id` + `year` for capacity

---

## 5. Validation Rules

### 5.1 Team Name
| Rule | Validation | Error Message |
|------|------------|---------------|
| Required | Not empty | "Team name is required" |
| Length | 1-100 characters | "Team name must be between 1 and 100 characters" |
| Unique | No duplicates | "A team with this name already exists" |
| Format | Letters, numbers, spaces, hyphens | "Team name contains invalid characters" |

### 5.2 Short Code
| Rule | Validation | Error Message |
|------|------------|---------------|
| Required | Not empty | "Short code is required" |
| Length | 2-10 characters | "Short code must be between 2 and 10 characters" |
| Format | Uppercase alphanumeric | "Short code must be uppercase letters and numbers only" |
| Unique | No duplicates | "A team with this short code already exists" |

### 5.3 Capacity
| Rule | Validation | Error Message |
|------|------------|---------------|
| Non-negative | ≥ 0 | "Capacity cannot be negative" |
| Integer | Whole number | "Capacity must be a whole number" |
| Max value | ≤ 9999 | "Capacity cannot exceed 9999" |

---

## 6. API Endpoints

### 6.1 Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams` | List all teams |
| GET | `/api/teams/{id}` | Get single team with capacity |
| POST | `/api/teams` | Create new team |
| PUT | `/api/teams/{id}` | Update team |
| DELETE | `/api/teams/{id}` | Delete team |
| GET | `/api/teams/{id}/capacity/{year}` | Get team capacity for year |
| PUT | `/api/teams/{id}/capacity/{year}` | Update team capacity |

### 6.2 Request/Response Examples

**GET /api/teams?status=active&year=2026**
```json
{
  "data": [
    {
      "id": "uuid-1",
      "name": "Platform Team",
      "short_code": "PLAT",
      "description": "Core platform development",
      "status": "active",
      "capacity": {
        "year": 2026,
        "q1": { "total": 120, "allocated": 95, "available": 25 },
        "q2": { "total": 120, "allocated": 80, "available": 40 },
        "q3": { "total": 100, "allocated": 0, "available": 100 },
        "q4": { "total": 100, "allocated": 0, "available": 100 }
      },
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 5
}
```

**POST /api/teams**
```json
{
  "name": "Mobile Team",
  "short_code": "MOB",
  "description": "Mobile app development",
  "status": "active",
  "capacity": {
    "year": 2026,
    "q1_capacity": 80,
    "q2_capacity": 80,
    "q3_capacity": 80,
    "q4_capacity": 80
  }
}
```

---

## 7. Calculated Fields

### 7.1 Allocated Capacity
```
allocated_capacity[quarter] = SUM(feature.story_points) 
  WHERE feature.team_id = team.id 
  AND feature.quarter = quarter
```

### 7.2 Available Capacity
```
available_capacity[quarter] = total_capacity[quarter] - allocated_capacity[quarter]
```

### 7.3 Utilization Percentage
```
utilization[quarter] = (allocated_capacity[quarter] / total_capacity[quarter]) * 100
```

### 7.4 Health Status
```
if utilization >= 90: status = 'critical' (red)
elif utilization >= 80: status = 'warning' (yellow)
else: status = 'healthy' (green)
```

---

## 8. UI/UX Notes

### 8.1 Table Layout
- Sticky header for scrolling
- Compact rows for more visibility
- Inline progress bars in quarter columns
- Hover to show exact numbers

### 8.2 Progress Bar Colors
- Green (#52c41a): 0-79% utilized
- Yellow (#faad14): 80-89% utilized
- Red (#f5222d): 90-100% utilized

### 8.3 Status Badges
- Active: Green tag
- Inactive: Gray tag

### 8.4 Side Panel
- 480px width
- Form with vertical layout
- Capacity inputs in 2x2 grid

---

## 9. Acceptance Testing Scenarios

### AT-TM-001: Create Team
1. Navigate to Setup > Teams
2. Click "Add Team"
3. Enter name "API Team", code "API", Q1-Q4 capacity: 100 each
4. Save
5. **Expected:** Team appears in table with capacity shown

### AT-TM-002: Edit Team Capacity
1. Find existing team in table
2. Click Edit
3. Change Q2 capacity from 100 to 120
4. Save
5. **Expected:** Q2 column shows updated capacity

### AT-TM-003: View Utilization
1. Have team with assigned features
2. View table
3. **Expected:** Progress bars show correct utilization percentages

### AT-TM-004: Delete Protection
1. Try to delete team with assigned features
2. **Expected:** Error message, team not deleted

---

## 10. Dependencies

### 10.1 Upstream Dependencies
- User authentication

### 10.2 Downstream Dependencies
- Features module (team assignment)
- Dashboard (capacity heatmap)
- Reports (team utilization)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-15 | PM Agent | Initial draft |
