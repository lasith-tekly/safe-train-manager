# JIRA Records API Design - Execution Planning

## Overview
Complete API specification for PI-level execution planning, enabling assignment of JIRA records to teams with capacity validation and spillover tracking.

**Base URL:** `/api`  
**Authentication:** Required (existing auth mechanism)  
**Content-Type:** `application/json`

---

## Table of Contents
1. [Schemas](#schemas)
2. [Endpoints](#endpoints)
3. [Service Layer](#service-layer)
4. [Business Logic](#business-logic)
5. [Error Handling](#error-handling)
6. [Examples](#examples)

---

## Schemas

### Request Schemas

#### JiraRecordCreate
```json
{
  "jira_key": "PROJ-123",           // Optional, unique
  "title": "Implement login API",   // Required
  "description": "...",              // Optional
  "team_id": "uuid",                 // Optional
  "pi_id": "uuid",                   // Optional
  "planned_effort": 10.5,            // Required, >= 0
  "status": "PLANNED"                // Default: PLANNED
}
```

#### JiraRecordUpdate
```json
{
  "jira_key": "PROJ-124",           // Optional
  "title": "Updated title",          // Optional
  "description": "...",              // Optional
  "team_id": "uuid",                 // Optional
  "pi_id": "uuid",                   // Optional
  "planned_effort": 12.0,            // Optional, >= 0
  "actual_effort": 11.5,             // Optional, >= 0
  "status": "IN_PROGRESS",           // Optional
  "spillover_from_pi_id": "uuid",    // Optional
  "spillover_reason": "Capacity"     // Optional
}
```

#### SpilloverRequest
```json
{
  "new_pi_id": "uuid",               // Required
  "reason": "Capacity"               // Required: Capacity, Scope Change, Dependencies, Other
}
```

### Response Schemas

#### JiraRecordResponse
```json
{
  "id": "uuid",
  "jira_key": "PROJ-123",
  "title": "Implement login API",
  "description": "...",
  "feature_id": "uuid",
  "feature_name": "User Authentication",
  "team_id": "uuid",
  "team_name": "Team Alpha",
  "pi_id": "uuid",
  "pi_name": "PI 2026.1",
  "planned_effort": 10.5,
  "actual_effort": null,
  "status": "PLANNED",
  "spillover_from_pi_id": null,
  "spillover_from_pi_name": null,
  "spillover_reason": null,
  "created_at": "2026-02-06T08:00:00Z",
  "updated_at": "2026-02-06T08:00:00Z"
}
```

#### TeamPIAllocationResponse
```json
{
  "team_id": "uuid",
  "team_name": "Team Alpha",
  "pi_id": "uuid",
  "pi_name": "PI 2026.1",
  "total_capacity_ed": 100.0,
  "allocated_effort_ed": 85.5,
  "available_effort_ed": 14.5,
  "utilization_percent": 85.5,
  "is_over_allocated": false,
  "jira_records": [...]
}
```

#### ExecutionValidationResponse
```json
{
  "feature_id": "uuid",
  "feature_name": "User Authentication",
  "is_valid": false,
  "warnings": [
    {
      "level": "warning",
      "message": "Q1 2026: Execution allocation (20 eD) is less than strategic allocation (45 eD)",
      "details": {
        "year": 2026,
        "quarter": 1,
        "strategic": 45.0,
        "execution": 20.0,
        "difference": -25.0
      }
    }
  ],
  "quarterly_comparisons": [
    {
      "year": 2026,
      "quarter": 1,
      "strategic_allocation_ed": 45.0,
      "execution_allocation_ed": 20.0,
      "difference_ed": -25.0,
      "is_matched": false
    }
  ],
  "total_strategic_ed": 75.0,
  "total_execution_ed": 45.0,
  "total_difference_ed": -30.0
}
```

---

## Endpoints

### 1. List JIRA Records for Feature

**GET** `/api/features/{feature_id}/jira-records`

**Description:** Get all JIRA records for a specific feature with summary statistics.

**Path Parameters:**
- `feature_id` (string, required) - Feature UUID

**Query Parameters:**
- `status` (string, optional) - Filter by status
- `team_id` (string, optional) - Filter by team
- `pi_id` (string, optional) - Filter by PI

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "uuid",
      "jira_key": "PROJ-123",
      "title": "Implement login API",
      ...
    }
  ],
  "total": 5,
  "summary": {
    "total_planned_effort": 52.5,
    "total_actual_effort": 10.0,
    "by_status": {
      "PLANNED": 3,
      "IN_PROGRESS": 1,
      "COMPLETED": 1
    },
    "by_pi": {
      "PI 2026.1": 30.0,
      "PI 2026.2": 22.5
    },
    "by_team": {
      "Team Alpha": 30.0,
      "Team Beta": 22.5
    }
  }
}
```

**Errors:**
- `404 Not Found` - Feature not found
- `403 Forbidden` - No access to feature

---

### 2. Create JIRA Record

**POST** `/api/features/{feature_id}/jira-records`

**Description:** Create a new JIRA record for a feature with capacity validation.

**Path Parameters:**
- `feature_id` (string, required) - Feature UUID

**Request Body:** `JiraRecordCreate`

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "jira_key": "PROJ-123",
  "title": "Implement login API",
  ...
}
```

**Response with Warning:** `201 Created`
```json
{
  "record": {...},
  "capacity_warning": {
    "team_id": "uuid",
    "team_name": "Team Alpha",
    "pi_id": "uuid",
    "pi_name": "PI 2026.1",
    "capacity_ed": 100.0,
    "current_allocation_ed": 95.0,
    "new_allocation_ed": 10.0,
    "total_allocation_ed": 105.0,
    "over_allocation_ed": 5.0,
    "message": "Team Alpha will be over-allocated by 5.0 eD in PI 2026.1"
  }
}
```

**Errors:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Feature not found
- `409 Conflict` - Duplicate jira_key

---

### 3. Get JIRA Record

**GET** `/api/jira-records/{id}`

**Description:** Get a specific JIRA record by ID.

**Path Parameters:**
- `id` (string, required) - JIRA record UUID

**Response:** `200 OK` - `JiraRecordResponse`

**Errors:**
- `404 Not Found` - Record not found

---

### 4. Update JIRA Record

**PUT** `/api/jira-records/{id}`

**Description:** Update an existing JIRA record.

**Path Parameters:**
- `id` (string, required) - JIRA record UUID

**Request Body:** `JiraRecordUpdate`

**Response:** `200 OK` - `JiraRecordResponse`

**Errors:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Record not found
- `409 Conflict` - Duplicate jira_key

---

### 5. Delete JIRA Record

**DELETE** `/api/jira-records/{id}`

**Description:** Delete a JIRA record.

**Path Parameters:**
- `id` (string, required) - JIRA record UUID

**Response:** `204 No Content`

**Errors:**
- `404 Not Found` - Record not found

---

### 6. Mark as Spillover

**POST** `/api/jira-records/{id}/spillover`

**Description:** Mark a JIRA record as spillover and move to a new PI.

**Path Parameters:**
- `id` (string, required) - JIRA record UUID

**Request Body:** `SpilloverRequest`

**Response:** `200 OK` - `JiraRecordResponse`

**Business Logic:**
1. Set `spillover_from_pi_id` to current `pi_id`
2. Set `pi_id` to `new_pi_id`
3. Set `status` to `SPILLOVER`
4. Set `spillover_reason`
5. Validate capacity in new PI

**Errors:**
- `400 Bad Request` - Invalid PI or reason
- `404 Not Found` - Record not found

---

### 7. Get Team PI Allocation

**GET** `/api/teams/{team_id}/pi-allocation/{pi_id}`

**Description:** Get team's allocation summary for a specific PI.

**Path Parameters:**
- `team_id` (string, required) - Team UUID
- `pi_id` (string, required) - PI UUID

**Response:** `200 OK` - `TeamPIAllocationResponse`

**Calculation Logic:**
```python
total_capacity_ed = get_team_capacity_for_pi(team_id, pi_id)
allocated_effort_ed = sum(jira_record.planned_effort 
                          for jira_record in team.jira_records 
                          if jira_record.pi_id == pi_id)
available_effort_ed = total_capacity_ed - allocated_effort_ed
utilization_percent = (allocated_effort_ed / total_capacity_ed) * 100
is_over_allocated = allocated_effort_ed > total_capacity_ed
```

**Errors:**
- `404 Not Found` - Team or PI not found

---

### 8. Get Team PI Allocations

**GET** `/api/teams/{team_id}/pi-allocations`

**Description:** Get all PI allocations for a team.

**Path Parameters:**
- `team_id` (string, required) - Team UUID

**Query Parameters:**
- `year` (integer, optional) - Filter by year
- `status` (string, optional) - Filter by PI status (planning, active, completed)

**Response:** `200 OK` - `TeamPIAllocationsResponse`

**Errors:**
- `404 Not Found` - Team not found

---

### 9. Validate Execution Plan

**POST** `/api/features/{feature_id}/validate-execution`

**Description:** Validate execution plan against strategic roadmap allocations.

**Path Parameters:**
- `feature_id` (string, required) - Feature UUID

**Response:** `200 OK` - `ExecutionValidationResponse`

**Validation Logic:**
1. Get feature's quarterly allocations (strategic plan)
2. Get feature's JIRA records
3. Map JIRA records to quarters via PI → Quarter mapping
4. Compare strategic vs execution for each quarter
5. Generate warnings for mismatches
6. Check team capacity constraints

**Warnings Generated:**
- Strategic > Execution: "Under-allocated"
- Execution > Strategic: "Over-allocated"
- Team over capacity: "Team capacity exceeded"
- No JIRA records: "No execution plan"

**Errors:**
- `404 Not Found` - Feature not found

---

### 10. Get PI List with Quarter Mapping

**GET** `/api/pis`

**Description:** Get list of PIs with quarter mappings.

**Query Parameters:**
- `year` (integer, optional) - Filter by year
- `status` (string, optional) - Filter by status

**Response:** `200 OK` - `PIListResponse`

**PI to Quarter Mapping:**
```
PI 2026.1 → Q1 2026
PI 2026.2 → Q2 2026
PI 2026.3 → Q3 2026
PI 2026.4 → Q4 2026
```

---

### 11. Bulk Create JIRA Records

**POST** `/api/features/{feature_id}/jira-records/bulk`

**Description:** Create multiple JIRA records at once.

**Path Parameters:**
- `feature_id` (string, required) - Feature UUID

**Request Body:** `JiraRecordBulkCreateRequest`

**Response:** `201 Created` - `JiraRecordBulkCreateResponse`

**Errors:**
- `400 Bad Request` - Validation errors
- `404 Not Found` - Feature not found

---

## Service Layer

### JiraRecordService

**File:** `backend/app/services/jira_record_service.py`

```python
class JiraRecordService:
    """Service for JIRA record operations."""
    
    @staticmethod
    def create_jira_record(
        db: Session, 
        feature_id: str, 
        data: JiraRecordCreate
    ) -> Tuple[JiraRecord, Optional[CapacityWarning]]:
        """
        Create a new JIRA record.
        
        Returns:
            Tuple of (created_record, capacity_warning)
        """
        # 1. Validate feature exists
        # 2. Validate team exists (if provided)
        # 3. Validate PI exists (if provided)
        # 4. Check for duplicate jira_key
        # 5. Create record
        # 6. Check capacity and generate warning if needed
        # 7. Return record and warning
        pass
    
    @staticmethod
    def update_jira_record(
        db: Session, 
        record_id: str, 
        data: JiraRecordUpdate
    ) -> JiraRecord:
        """Update an existing JIRA record."""
        pass
    
    @staticmethod
    def delete_jira_record(db: Session, record_id: str) -> bool:
        """Delete a JIRA record."""
        pass
    
    @staticmethod
    def get_feature_jira_records(
        db: Session, 
        feature_id: str,
        status: Optional[str] = None,
        team_id: Optional[str] = None,
        pi_id: Optional[str] = None
    ) -> JiraRecordListResponse:
        """Get all JIRA records for a feature with filters."""
        pass
    
    @staticmethod
    def mark_as_spillover(
        db: Session, 
        record_id: str, 
        new_pi_id: str, 
        reason: str
    ) -> JiraRecord:
        """Mark a JIRA record as spillover and move to new PI."""
        pass
    
    @staticmethod
    def get_team_pi_allocation(
        db: Session, 
        team_id: str, 
        pi_id: str
    ) -> TeamPIAllocationResponse:
        """Get team's allocation for a specific PI."""
        pass
    
    @staticmethod
    def validate_execution_plan(
        db: Session, 
        feature_id: str
    ) -> ExecutionValidationResponse:
        """Validate execution plan against strategic allocations."""
        pass
    
    @staticmethod
    def calculate_capacity_warning(
        db: Session, 
        team_id: str, 
        pi_id: str, 
        new_effort: float
    ) -> Optional[CapacityWarning]:
        """Calculate if adding new effort will exceed capacity."""
        pass
```

### PIService

**File:** `backend/app/services/pi_service.py`

```python
class PIService:
    """Service for PI operations and mappings."""
    
    @staticmethod
    def pi_to_quarter(pi_name: str) -> Tuple[int, int]:
        """
        Convert PI name to (year, quarter).
        
        Examples:
            "PI 2026.1" → (2026, 1)
            "PI 2026.2" → (2026, 2)
        """
        parts = pi_name.replace("PI ", "").split(".")
        return (int(parts[0]), int(parts[1]))
    
    @staticmethod
    def quarter_to_pi(year: int, quarter: int) -> str:
        """
        Convert quarter to PI name.
        
        Examples:
            (2026, 1) → "PI 2026.1"
            (2026, 2) → "PI 2026.2"
        """
        return f"PI {year}.{quarter}"
    
    @staticmethod
    def get_pis_for_quarter(
        db: Session, 
        year: int, 
        quarter: int
    ) -> List[PI]:
        """Get all PIs that fall within a quarter."""
        pass
    
    @staticmethod
    def get_quarter_for_pi(db: Session, pi_id: str) -> Tuple[int, int]:
        """Get the quarter that a PI belongs to."""
        pass
```

### CapacityService

**File:** `backend/app/services/capacity_service.py`

```python
class CapacityService:
    """Service for capacity calculations."""
    
    @staticmethod
    def get_team_pi_capacity(
        db: Session, 
        team_id: str, 
        pi_id: str
    ) -> float:
        """
        Calculate team's total capacity for a PI in eD.
        
        Logic:
        1. Get PI dates
        2. Determine quarter from PI
        3. Get team's quarterly capacity
        4. Return capacity in eD
        """
        pass
    
    @staticmethod
    def get_team_pi_allocation(
        db: Session, 
        team_id: str, 
        pi_id: str
    ) -> float:
        """
        Calculate team's current allocation for a PI.
        
        Logic:
        Sum of planned_effort for all JIRA records where:
        - team_id matches
        - pi_id matches
        - status != COMPLETED
        """
        pass
    
    @staticmethod
    def is_team_over_allocated(
        db: Session, 
        team_id: str, 
        pi_id: str
    ) -> bool:
        """Check if team is over-allocated for a PI."""
        capacity = CapacityService.get_team_pi_capacity(db, team_id, pi_id)
        allocation = CapacityService.get_team_pi_allocation(db, team_id, pi_id)
        return allocation > capacity
```

---

## Business Logic

### Capacity Validation

**When to validate:**
- Creating new JIRA record
- Updating JIRA record (if team or PI changes)
- Marking as spillover (new PI)

**Validation logic:**
```python
def validate_capacity(db, team_id, pi_id, new_effort):
    capacity = get_team_pi_capacity(db, team_id, pi_id)
    current_allocation = get_team_pi_allocation(db, team_id, pi_id)
    new_total = current_allocation + new_effort
    
    if new_total > capacity:
        return CapacityWarning(
            team_id=team_id,
            pi_id=pi_id,
            capacity_ed=capacity,
            current_allocation_ed=current_allocation,
            new_allocation_ed=new_effort,
            total_allocation_ed=new_total,
            over_allocation_ed=new_total - capacity,
            message=f"Team will be over-allocated by {new_total - capacity} eD"
        )
    return None
```

**Warning vs Error:**
- **Warning:** Show to user but allow creation (PM can override)
- **Error:** Block operation (e.g., duplicate jira_key)

### Execution Validation

**Comparison logic:**
```python
def validate_execution(db, feature_id):
    # Get strategic allocations
    strategic = get_feature_quarterly_allocations(db, feature_id)
    # {(2026, 1): 45.0, (2026, 2): 30.0}
    
    # Get JIRA records
    jira_records = get_feature_jira_records(db, feature_id)
    
    # Map JIRA records to quarters
    execution = {}
    for record in jira_records:
        pi = get_pi(db, record.pi_id)
        year, quarter = pi_to_quarter(pi.name)
        execution[(year, quarter)] = execution.get((year, quarter), 0) + record.planned_effort
    
    # Compare
    warnings = []
    for (year, quarter), strategic_ed in strategic.items():
        execution_ed = execution.get((year, quarter), 0)
        difference = strategic_ed - execution_ed
        
        if abs(difference) > 0.1:  # Tolerance
            warnings.append({
                "level": "warning",
                "message": f"Q{quarter} {year}: Execution ({execution_ed} eD) vs Strategic ({strategic_ed} eD)",
                "details": {
                    "year": year,
                    "quarter": quarter,
                    "strategic": strategic_ed,
                    "execution": execution_ed,
                    "difference": difference
                }
            })
    
    return warnings
```

### Spillover Logic

**Steps:**
1. Get current JIRA record
2. Validate new PI exists
3. Set `spillover_from_pi_id` = current `pi_id`
4. Set `pi_id` = `new_pi_id`
5. Set `status` = `SPILLOVER`
6. Set `spillover_reason`
7. Validate capacity in new PI
8. Save and return

---

## Error Handling

### HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Deleted successfully
- `400 Bad Request` - Validation error
- `403 Forbidden` - No access
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `500 Internal Server Error` - Server error

### Error Response Format

```json
{
  "detail": "Error message",
  "error_code": "DUPLICATE_JIRA_KEY",
  "field": "jira_key",
  "value": "PROJ-123"
}
```

### Common Errors

**Validation Errors:**
```json
{
  "detail": "Validation error",
  "errors": [
    {
      "field": "planned_effort",
      "message": "Must be greater than or equal to 0"
    }
  ]
}
```

**Duplicate JIRA Key:**
```json
{
  "detail": "JIRA key already exists",
  "error_code": "DUPLICATE_JIRA_KEY",
  "jira_key": "PROJ-123",
  "existing_record_id": "uuid"
}
```

**Feature Not Found:**
```json
{
  "detail": "Feature not found",
  "feature_id": "uuid"
}
```

---

## Examples

### Example 1: Create JIRA Record

**Request:**
```bash
POST /api/features/abc-123/jira-records
Content-Type: application/json

{
  "jira_key": "PROJ-123",
  "title": "Implement user login",
  "description": "Add JWT authentication",
  "team_id": "team-alpha-id",
  "pi_id": "pi-2026-1-id",
  "planned_effort": 15.0,
  "status": "PLANNED"
}
```

**Response:**
```json
{
  "record": {
    "id": "new-record-id",
    "jira_key": "PROJ-123",
    "title": "Implement user login",
    "description": "Add JWT authentication",
    "feature_id": "abc-123",
    "feature_name": "User Authentication",
    "team_id": "team-alpha-id",
    "team_name": "Team Alpha",
    "pi_id": "pi-2026-1-id",
    "pi_name": "PI 2026.1",
    "planned_effort": 15.0,
    "actual_effort": null,
    "status": "PLANNED",
    "spillover_from_pi_id": null,
    "spillover_reason": null,
    "created_at": "2026-02-06T08:30:00Z",
    "updated_at": "2026-02-06T08:30:00Z"
  },
  "capacity_warning": null
}
```

### Example 2: Mark as Spillover

**Request:**
```bash
POST /api/jira-records/record-123/spillover
Content-Type: application/json

{
  "new_pi_id": "pi-2026-2-id",
  "reason": "Capacity"
}
```

**Response:**
```json
{
  "id": "record-123",
  "jira_key": "PROJ-123",
  "title": "Implement user login",
  "pi_id": "pi-2026-2-id",
  "pi_name": "PI 2026.2",
  "status": "SPILLOVER",
  "spillover_from_pi_id": "pi-2026-1-id",
  "spillover_from_pi_name": "PI 2026.1",
  "spillover_reason": "Capacity",
  ...
}
```

### Example 3: Get Team PI Allocation

**Request:**
```bash
GET /api/teams/team-alpha-id/pi-allocation/pi-2026-1-id
```

**Response:**
```json
{
  "team_id": "team-alpha-id",
  "team_name": "Team Alpha",
  "pi_id": "pi-2026-1-id",
  "pi_name": "PI 2026.1",
  "total_capacity_ed": 100.0,
  "allocated_effort_ed": 95.0,
  "available_effort_ed": 5.0,
  "utilization_percent": 95.0,
  "is_over_allocated": false,
  "jira_records": [
    {
      "id": "record-1",
      "jira_key": "PROJ-123",
      "title": "Implement login",
      "planned_effort": 15.0,
      ...
    },
    {
      "id": "record-2",
      "jira_key": "PROJ-124",
      "title": "Add OAuth",
      "planned_effort": 20.0,
      ...
    }
  ]
}
```

### Example 4: Validate Execution Plan

**Request:**
```bash
POST /api/features/abc-123/validate-execution
```

**Response:**
```json
{
  "feature_id": "abc-123",
  "feature_name": "User Authentication",
  "is_valid": false,
  "warnings": [
    {
      "level": "warning",
      "message": "Q1 2026: Execution (20 eD) is less than strategic (45 eD)",
      "details": {
        "year": 2026,
        "quarter": 1,
        "strategic": 45.0,
        "execution": 20.0,
        "difference": -25.0
      }
    },
    {
      "level": "warning",
      "message": "Team Alpha over-allocated in PI 2026.1",
      "details": {
        "team_id": "team-alpha-id",
        "pi_id": "pi-2026-1-id",
        "capacity": 100.0,
        "allocated": 105.0,
        "over_allocation": 5.0
      }
    }
  ],
  "quarterly_comparisons": [
    {
      "year": 2026,
      "quarter": 1,
      "strategic_allocation_ed": 45.0,
      "execution_allocation_ed": 20.0,
      "difference_ed": -25.0,
      "is_matched": false
    },
    {
      "year": 2026,
      "quarter": 2,
      "strategic_allocation_ed": 30.0,
      "execution_allocation_ed": 30.0,
      "difference_ed": 0.0,
      "is_matched": true
    }
  ],
  "total_strategic_ed": 75.0,
  "total_execution_ed": 50.0,
  "total_difference_ed": -25.0
}
```

---

## Implementation Checklist

### Phase 1: Core CRUD
- [ ] Create schemas file
- [ ] Create service layer
- [ ] Implement create endpoint
- [ ] Implement list endpoint
- [ ] Implement update endpoint
- [ ] Implement delete endpoint
- [ ] Add unit tests

### Phase 2: Capacity & Validation
- [ ] Implement capacity service
- [ ] Implement PI service
- [ ] Add capacity warnings to create/update
- [ ] Implement team PI allocation endpoint
- [ ] Implement execution validation endpoint
- [ ] Add integration tests

### Phase 3: Advanced Features
- [ ] Implement spillover endpoint
- [ ] Implement bulk create endpoint
- [ ] Add PI list endpoint
- [ ] Add filtering and pagination
- [ ] Add performance optimizations
- [ ] Add end-to-end tests

---

## Performance Considerations

### Database Queries

**Optimize with:**
- Eager loading: `joinedload(JiraRecord.team, JiraRecord.pi)`
- Indexes: Already created on foreign keys
- Aggregation: Use SQL `SUM()` for effort calculations
- Caching: Cache team capacities and PI mappings

**Example optimized query:**
```python
from sqlalchemy.orm import joinedload

records = db.query(JiraRecord)\
    .options(
        joinedload(JiraRecord.team),
        joinedload(JiraRecord.pi),
        joinedload(JiraRecord.feature)
    )\
    .filter(JiraRecord.feature_id == feature_id)\
    .all()
```

### Caching Strategy

**Cache:**
- Team capacities (rarely change)
- PI to quarter mappings (static)
- Feature quarterly allocations (change infrequently)

**Don't cache:**
- JIRA records (change frequently)
- Team allocations (derived from JIRA records)

---

## Security Considerations

### Authorization

**Check permissions:**
- User can access feature's product
- User can assign to team (if team member or PM)
- User can modify JIRA records (if PM or team lead)

### Input Validation

**Validate:**
- UUIDs are valid format
- Effort values are positive
- Status values are from enum
- JIRA keys match pattern (optional)

### Rate Limiting

**Apply limits:**
- Bulk create: Max 50 records per request
- List queries: Max 100 results per page
- Validation: Max 10 requests per minute per user

---

**Status:** Ready for Implementation  
**Created:** February 6, 2026  
**Last Updated:** February 6, 2026  
**Next Action:** Backend Developer to implement endpoints
