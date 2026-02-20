# Features from JIRA - Requirements Specification

**Document Version:** 1.0  
**Created:** 2026-01-15  
**Author:** Product Manager Agent  
**Status:** Draft  

---

## 1. Overview

### 1.1 Purpose
The Features from JIRA module enables Train Product Managers to import features (epics) from JIRA, map them to products, budget lines, and teams, and track their cost and capacity allocation within the SAFe Train Manager.

### 1.2 Scope
- JIRA connection configuration
- Feature import wizard (multi-step)
- Feature listing and filtering
- Feature-to-budget/team mapping
- Cost and story point tracking
- Sync status management

### 1.3 Key Personas
- **Train Product Manager** (primary) - Imports and maps features
- **Epic Owners** - View their features and assignments
- **Scrum Masters** - View team feature assignments

---

## 2. User Stories

### US-FJ-001: Configure JIRA Connection
**As a** Train Product Manager  
**I want to** configure the JIRA connection settings  
**So that** I can import features from our JIRA instance

**Acceptance Criteria:**
- [ ] Settings page for JIRA configuration
- [ ] Fields: JIRA URL, API Token, Project Key(s)
- [ ] Test connection button with success/failure feedback
- [ ] Save configuration securely
- [ ] Show connection status indicator

**Priority:** High

---

### US-FJ-002: View Features List
**As a** Train Product Manager  
**I want to** view all imported features in a table  
**So that** I can see feature status and assignments at a glance

**Acceptance Criteria:**
- [ ] Table columns: Feature Key, Title, Product, Budget Line, Team, Quarter, Cost, Status
- [ ] Filter by: Product, Budget Line, Team, Quarter, Status
- [ ] Search by feature key or title
- [ ] Sort by any column
- [ ] Pagination for large datasets
- [ ] Color-coded status badges
- [ ] Empty state when no features imported

**Priority:** High

---

### US-FJ-003: Import Features Wizard - Step 1 (Select Source)
**As a** Train Product Manager  
**I want to** select which JIRA project and filters to import from  
**So that** I can import relevant features only

**Acceptance Criteria:**
- [ ] "Import from JIRA" button opens wizard modal
- [ ] Step 1: Select JIRA project from dropdown
- [ ] Optional JQL filter input
- [ ] Issue type filter (default: Epic)
- [ ] Date range filter (optional)
- [ ] Preview count of matching issues
- [ ] Next button to proceed

**Priority:** High

---

### US-FJ-004: Import Features Wizard - Step 2 (Preview & Select)
**As a** Train Product Manager  
**I want to** preview and select which features to import  
**So that** I can control what gets imported

**Acceptance Criteria:**
- [ ] Table showing fetched JIRA issues
- [ ] Columns: Key, Summary, Status, Story Points, Labels
- [ ] Checkbox selection (select all / individual)
- [ ] Already imported features marked and disabled
- [ ] Count of selected features shown
- [ ] Back and Next buttons

**Priority:** High

---

### US-FJ-005: Import Features Wizard - Step 3 (Map Fields)
**As a** Train Product Manager  
**I want to** map imported features to products, budget lines, and teams  
**So that** they are properly categorized for tracking

**Acceptance Criteria:**
- [ ] Bulk mapping section at top
- [ ] Individual mapping table below
- [ ] For each feature: Product dropdown, Budget Line dropdown, Team dropdown, Quarter dropdown
- [ ] Cost field (auto-populated from JIRA or manual)
- [ ] Story Points field (from JIRA)
- [ ] Validation: Product and Budget Line required
- [ ] Back and Import buttons

**Priority:** High

---

### US-FJ-006: Import Features Wizard - Step 4 (Confirmation)
**As a** Train Product Manager  
**I want to** see import results  
**So that** I know what was successfully imported

**Acceptance Criteria:**
- [ ] Summary: X features imported successfully
- [ ] List of any failures with reasons
- [ ] "View Features" button to go to list
- [ ] "Import More" button to restart wizard
- [ ] Close button

**Priority:** Medium

---

### US-FJ-007: Edit Feature Mapping
**As a** Train Product Manager  
**I want to** edit an imported feature's mapping  
**So that** I can correct or update assignments

**Acceptance Criteria:**
- [ ] Edit action opens side panel
- [ ] Can change: Product, Budget Line, Team, Quarter, Cost
- [ ] Cannot change: JIRA Key, Title (read-only)
- [ ] Save updates feature and recalculates budgets
- [ ] Cancel discards changes

**Priority:** High

---

### US-FJ-008: Sync Feature from JIRA
**As a** Train Product Manager  
**I want to** sync a feature's data from JIRA  
**So that** I have the latest status and story points

**Acceptance Criteria:**
- [ ] "Sync" action on individual feature
- [ ] "Sync All" button for bulk sync
- [ ] Updates: Status, Story Points, Summary
- [ ] Preserves: Product, Budget Line, Team mappings
- [ ] Shows last synced timestamp
- [ ] Error handling for sync failures

**Priority:** Medium

---

### US-FJ-009: Delete Feature
**As a** Train Product Manager  
**I want to** delete an imported feature  
**So that** I can remove incorrectly imported items

**Acceptance Criteria:**
- [ ] Delete action with confirmation
- [ ] Removes feature from system
- [ ] Recalculates budget consumption
- [ ] Does not affect JIRA issue
- [ ] Success notification

**Priority:** Low

---

### US-FJ-010: View Feature Details
**As a** Train Product Manager  
**I want to** view detailed information about a feature  
**So that** I can see all mappings and JIRA data

**Acceptance Criteria:**
- [ ] Click feature row opens detail panel
- [ ] Shows all feature fields
- [ ] Link to JIRA issue
- [ ] Edit and Sync buttons in panel
- [ ] History of changes (optional)

**Priority:** Low

---

## 3. Business Rules

### BR-FJ-001: Unique Feature Import
Each JIRA issue can only be imported once. Re-importing updates existing record.

### BR-FJ-002: Required Mappings
Features must have Product and Budget Line assigned before saving.

### BR-FJ-003: Cost Calculation
Feature cost contributes to Budget Line consumption. Cost is in KEUR.

### BR-FJ-004: Story Points Allocation
Story points contribute to Team quarterly capacity consumption.

### BR-FJ-005: Quarter Assignment
Features must be assigned to a quarter (Q1-Q4) for capacity tracking.

### BR-FJ-006: Status Mapping
JIRA statuses map to internal statuses:
- To Do, Open, Backlog → "Not Started"
- In Progress, In Development → "In Progress"
- Done, Closed, Resolved → "Completed"

### BR-FJ-007: Sync Behavior
Sync updates JIRA-sourced fields only. User mappings are preserved.

---

## 4. Data Model Requirements

### 4.1 Feature Entity

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Unique identifier |
| `jira_key` | String | Required, unique, max 20 | JIRA issue key (e.g., PROJ-123) |
| `jira_id` | String | Required, unique | JIRA issue ID |
| `title` | String | Required, max 500 | Feature title/summary |
| `description` | Text | Optional | Feature description |
| `jira_status` | String | Max 50 | Status from JIRA |
| `internal_status` | Enum | Required | Values: 'not_started', 'in_progress', 'completed' |
| `product_id` | UUID | FK to Product | Associated product |
| `budget_line_id` | UUID | FK to BudgetLine | Associated budget line |
| `team_id` | UUID | FK to Team | Assigned team |
| `quarter` | Integer | 1-4 | Target quarter |
| `year` | Integer | 2020-2100 | Target year |
| `story_points` | Integer | ≥ 0 | Story points from JIRA |
| `cost` | Decimal | ≥ 0 | Cost in KEUR |
| `jira_url` | String | Max 500 | Link to JIRA issue |
| `last_synced_at` | Timestamp | Nullable | Last sync timestamp |
| `created_at` | Timestamp | Auto-generated | Import timestamp |
| `updated_at` | Timestamp | Auto-updated | Last modification |

### 4.2 JiraConfig Entity

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Unique identifier |
| `jira_url` | String | Required, max 200 | JIRA instance URL |
| `api_token` | String | Required, encrypted | API token |
| `username` | String | Required, max 100 | JIRA username/email |
| `project_keys` | JSON | Array of strings | Configured project keys |
| `is_active` | Boolean | Default true | Connection active |
| `created_at` | Timestamp | Auto-generated | Creation timestamp |
| `updated_at` | Timestamp | Auto-updated | Last modification |

### 4.3 Relationships

| Relationship | Type | Description |
|--------------|------|-------------|
| Feature → Product | Many-to-One | Features belong to a product |
| Feature → BudgetLine | Many-to-One | Features consume from budget line |
| Feature → Team | Many-to-One | Features assigned to team |

### 4.4 Indexes
- Unique index on `jira_key`
- Unique index on `jira_id`
- Index on `product_id`
- Index on `budget_line_id`
- Index on `team_id`
- Index on `year` + `quarter`

---

## 5. Validation Rules

### 5.1 JIRA Key
| Rule | Validation | Error Message |
|------|------------|---------------|
| Required | Not empty | "JIRA key is required" |
| Format | PROJECT-NUMBER | "Invalid JIRA key format" |
| Unique | No duplicates | "This feature has already been imported" |

### 5.2 Cost
| Rule | Validation | Error Message |
|------|------------|---------------|
| Non-negative | ≥ 0 | "Cost cannot be negative" |
| Format | Decimal with max 2 places | "Invalid cost format" |

### 5.3 Mappings
| Rule | Validation | Error Message |
|------|------------|---------------|
| Product required | Not null | "Product is required" |
| Budget Line required | Not null | "Budget line is required" |
| Quarter valid | 1-4 | "Quarter must be between 1 and 4" |

---

## 6. API Endpoints

### 6.1 Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/features` | List features with filters |
| GET | `/api/features/{id}` | Get single feature |
| POST | `/api/features` | Create/import features |
| PUT | `/api/features/{id}` | Update feature mapping |
| DELETE | `/api/features/{id}` | Delete feature |
| POST | `/api/features/{id}/sync` | Sync feature from JIRA |
| POST | `/api/features/sync-all` | Sync all features |
| GET | `/api/jira/config` | Get JIRA configuration |
| PUT | `/api/jira/config` | Update JIRA configuration |
| POST | `/api/jira/test` | Test JIRA connection |
| GET | `/api/jira/projects` | List JIRA projects |
| POST | `/api/jira/search` | Search JIRA issues |

### 6.2 Request/Response Examples

**GET /api/features?product_id=uuid&year=2026&quarter=1**
```json
{
  "data": [
    {
      "id": "uuid-1",
      "jira_key": "BRS-123",
      "title": "Implement user authentication",
      "jira_status": "In Progress",
      "internal_status": "in_progress",
      "product": { "id": "uuid", "name": "BRS", "short_code": "BRS" },
      "budget_line": { "id": "uuid", "name": "Product Evolution" },
      "team": { "id": "uuid", "name": "Platform Team", "short_code": "PLAT" },
      "quarter": 1,
      "year": 2026,
      "story_points": 13,
      "cost": 45.5,
      "jira_url": "https://jira.example.com/browse/BRS-123",
      "last_synced_at": "2026-01-15T10:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "page_size": 20
}
```

**POST /api/features** (bulk import)
```json
{
  "features": [
    {
      "jira_key": "BRS-124",
      "jira_id": "10124",
      "title": "Add payment processing",
      "jira_status": "To Do",
      "story_points": 21,
      "product_id": "product-uuid",
      "budget_line_id": "line-uuid",
      "team_id": "team-uuid",
      "quarter": 2,
      "year": 2026,
      "cost": 75.0
    }
  ]
}
```

**POST /api/jira/search**
```json
{
  "project_key": "BRS",
  "jql": "issuetype = Epic AND status != Done",
  "max_results": 50
}
```

---

## 7. UI/UX Notes

### 7.1 Features List Page
- Toolbar with filters and Import button
- Table with sortable columns
- Inline status badges
- Row actions: Edit, Sync, Delete

### 7.2 Import Wizard
- Modal with step indicator (1-2-3-4)
- Progress bar during fetch/import
- Clear navigation (Back/Next/Cancel)
- Responsive table in step 2-3

### 7.3 Status Colors
- Not Started: Gray
- In Progress: Blue
- Completed: Green

### 7.4 Cost Display
- Format: "45.5 KEUR"
- Warning icon if over budget

---

## 8. Acceptance Testing Scenarios

### AT-FJ-001: Configure JIRA
1. Navigate to Features > Settings
2. Enter JIRA URL, username, API token
3. Click Test Connection
4. **Expected:** Success message, Save enabled

### AT-FJ-002: Import Features
1. Click "Import from JIRA"
2. Select project, apply filters
3. Select 5 features
4. Map to Product "BRS", Budget Line "Product Evolution"
5. Complete import
6. **Expected:** 5 features appear in list

### AT-FJ-003: Edit Feature Mapping
1. Find imported feature
2. Click Edit
3. Change Team to "Mobile Team"
4. Save
5. **Expected:** Team updated, capacity recalculated

### AT-FJ-004: Sync Feature
1. Find feature with outdated status
2. Click Sync
3. **Expected:** Status and story points updated from JIRA

---

## 9. Dependencies

### 9.1 Upstream Dependencies
- Products module (product selection)
- Budgets module (budget line selection)
- Teams module (team selection)
- JIRA API access

### 9.2 Downstream Dependencies
- Dashboard (feature counts, budget consumption)
- Reports (feature status reports)

---

## 10. Security Considerations

- API tokens stored encrypted
- JIRA credentials not exposed in responses
- Rate limiting on JIRA API calls
- Audit logging for imports

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-15 | PM Agent | Initial draft |
