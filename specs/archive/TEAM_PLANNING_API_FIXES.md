# Team Planning API Fixes - Complete

**Date:** February 18, 2026  
**Status:** ✅ **ALL ISSUES RESOLVED**

---

## Issues Fixed

### Issue 1: version_id Was Required (Now Optional) ✅

**Problem:** Frontend couldn't call planning endpoint without a version_id

**Solution:** Made version_id optional in route and service

**Files Modified:**
- `backend/app/routes/team_planning.py`
- `backend/app/services/team_planning_service.py`
- `backend/app/schemas/team_planning.py`

**Changes:**
```python
# Route - version_id is now optional
@router.get("/teams/{team_id}/planning")
def get_team_planning(
    team_id: str,
    pi_id: str = Query(...),
    version_id: Optional[str] = Query(None),  # ✅ Optional
    db: Session = Depends(get_db)
):
```

### Issue 2: Service Returns JIRA Records When No Version ✅

**Problem:** Service couldn't handle missing version_id

**Solution:** When version_id is None, return JIRA records assigned to team

**Logic:**
```python
def get_team_planning_items(self, team_id, pi_id, version_id=None):
    if version_id:
        # Return planning items for specific version
        return team_planning items
    else:
        # Return JIRA records assigned to team
        jira_records = query JiraRecord where team_id and pi_id
        # Convert to planning format with status="not_planned"
        return converted items
```

### Issue 3: Capacity Calculation Fixed ✅

**Problem:** `used_ed` showed 0.0 even with JIRA records

**Root Cause:** Service was querying `team_planning` table instead of `jira_records`

**Solution:** Changed capacity calculation to sum from `jira_records` table

**Before:**
```python
# Wrong - queried team_planning (empty table)
used = sum(TeamPlanning.planned_effort) where team_id and pi_id
```

**After:**
```python
# Correct - queries jira_records (has data)
used = sum(JiraRecord.planned_effort) where team_id and pi_id
```

### Issue 4: Type Mismatch in Capacity Calculation ✅

**Problem:** `TypeError: unsupported operand type(s) for /: 'float' and 'decimal.Decimal'`

**Solution:** Ensure consistent Decimal types in calculations

**Fix:**
```python
def get_capacity_status(self, used: Decimal, available: Decimal):
    # Ensure both are Decimal type
    used = Decimal(str(used)) if not isinstance(used, Decimal) else used
    available = Decimal(str(available)) if not isinstance(available, Decimal) else available
    
    percent = (used / available) * Decimal("100")  # All Decimal math
```

### Issue 5: Missing Timestamps on Temporary Objects ✅

**Problem:** Validation error - `created_at` and `updated_at` were None

**Solution:** Add timestamps when creating temporary planning objects from JIRA records

**Fix:**
```python
now = datetime.utcnow()
planning = TeamPlanning(
    # ... other fields ...
    created_at=now,
    updated_at=now
)
```

---

## Database Tables

### Correct Table Names ✅
- ✅ `pis` (not `program_increments`)
- ✅ `jira_records` (has team assignments)
- ✅ `team_planning` (for PO planning data)

### PI IDs in Database
```
4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27 | PI 2026.1
9f430f8a-1a07-45b6-9746-d5014879f5e3 | PI 2026.2
1cacae5a-9cde-4135-a41f-2793f46fb8db | PI 2026.3
933f386e-7317-4a8d-87e5-fecef0702d92 | PI 2026.4 ✅ (has JIRA records)
```

---

## Test Results

### ✅ Capacity Endpoint Working

**Request:**
```bash
curl "http://localhost:8000/api/teams/794e19cb-fb1f-4316-8e01-63d997ea451a/capacity?pi_id=933f386e-7317-4a8d-87e5-fecef0702d92"
```

**Response:**
```json
{
  "available_ed": 100.0,
  "used_ed": 3.0,
  "remaining_ed": 97.0,
  "utilization_percent": 3.0,
  "status": "green",
  "warning": null
}
```

**✅ Shows correct used effort (3.0 ED) from JIRA records**

### ✅ Planning Endpoint Working (Without version_id)

**Request:**
```bash
curl "http://localhost:8000/api/teams/794e19cb-fb1f-4316-8e01-63d997ea451a/planning?pi_id=933f386e-7317-4a8d-87e5-fecef0702d92"
```

**Response:**
```json
{
  "team": {
    "id": "794e19cb-fb1f-4316-8e01-63d997ea451a",
    "name": "Big bang"
  },
  "pi": {
    "id": "933f386e-7317-4a8d-87e5-fecef0702d92",
    "name": "PI 2026.4",
    "year": 2026,
    "sequence": 4
  },
  "version": null,
  "capacity": {
    "available_ed": 100.0,
    "used_ed": 3.0,
    "remaining_ed": 97.0,
    "utilization_percent": 3.0,
    "status": "green"
  },
  "items": [
    {
      "id": "...",
      "jira_record_id": "d3291d21-9d4f-45d6-a1ee-2d7a6e637227",
      "team_id": "794e19cb-fb1f-4316-8e01-63d997ea451a",
      "pi_id": "933f386e-7317-4a8d-87e5-fecef0702d92",
      "version_id": "",
      "planned_effort": "3.0",
      "dev_effort": "0",
      "pd_effort": "0",
      "qa_effort": "0",
      "status": "not_planned",
      "original_pm_effort": "3.0",
      "is_descoped": false,
      "is_orphaned": false,
      "jira_key": null,
      "jira_title": null,
      "feature_name": null,
      "is_spillover": false
    }
  ],
  "summary": {
    "total": 1,
    "accepted": 0,
    "modified": 0,
    "descoped": 0,
    "not_planned": 1,
    "orphaned": 0
  }
}
```

**✅ Returns JIRA records assigned to team**  
**✅ Capacity shows correct utilization**  
**✅ version is null (optional)**

---

## Files Modified

### 1. backend/app/routes/team_planning.py
**Changes:**
- Added `Optional` import
- Made `version_id` parameter optional with default `None`
- Updated docstring to explain optional behavior
- Handle None version_id in response

### 2. backend/app/services/team_planning_service.py
**Changes:**
- Made `version_id` optional in `get_team_planning_items()`
- Added logic to return JIRA records when version_id is None
- Changed capacity calculation to query `jira_records` instead of `team_planning`
- Added debug logging for capacity calculation
- Fixed type handling in `get_capacity_status()` to ensure Decimal types
- Added timestamps to temporary planning objects
- Made `version_id` optional in `get_planning_summary()`

### 3. backend/app/schemas/team_planning.py
**Changes:**
- Made `version` field optional in `TeamPlanningListResponse`

---

## Debug Logging Added

The service now includes debug logging:

```python
print(f"DEBUG: get_team_capacity called with team_id={team_id}, pi_id={pi_id}")
print(f"DEBUG: Calculated used effort: {used} from JIRA records")
print(f"DEBUG: Available capacity: {available}")
print(f"DEBUG: Found {len(jira_records)} JIRA records for team {team_id}, PI {pi_id}")
```

Check backend console for these messages when testing.

---

## API Behavior

### With version_id (Future Use)
```
GET /api/teams/{id}/planning?pi_id={pi}&version_id={version}
→ Returns planning items from team_planning table for specific version
```

### Without version_id (Current Use)
```
GET /api/teams/{id}/planning?pi_id={pi}
→ Returns JIRA records assigned to team
→ Converts to planning format with status="not_planned"
→ version field is null
```

---

## Capacity Calculation Logic

### Source of Data
- **Available:** Default 100.0 ED (placeholder - will integrate with capacity management)
- **Used:** Sum of `planned_effort` from `jira_records` where `team_id` and `pi_id` match

### Thresholds (EXACT)
- **< 95%** = green (on track)
- **95-100%** = amber (near capacity)
- **> 100%** = red (over capacity)

### Example
```
Available: 100.0 ED
Used: 3.0 ED (from JIRA records)
Utilization: 3.0%
Status: green ✅
```

---

## Frontend Integration

### Current State
The frontend can now:
1. ✅ Call capacity endpoint and get correct utilization
2. ✅ Call planning endpoint without version_id
3. ✅ Receive JIRA records assigned to team
4. ✅ Display items with status "not_planned"

### Next Steps
1. Frontend displays JIRA records in Team Planning page
2. PO can add role breakdown (Dev/PD/QA)
3. When ready, create version and save planning data
4. Commit plan for PM review

---

## Verification Checklist

- [x] version_id is optional in planning endpoint
- [x] Planning endpoint returns JIRA records when no version
- [x] Capacity calculation uses jira_records table
- [x] Capacity shows correct used effort (3.0 ED)
- [x] Type mismatch fixed in capacity calculation
- [x] Timestamps added to temporary objects
- [x] Schema allows null version
- [x] Debug logging added
- [x] Both endpoints return 200 OK
- [x] Response format matches schema

---

## Backend Server

**Status:** Running on http://localhost:8000  
**API Docs:** http://localhost:8000/docs  
**Database:** `backend/safe_train.db`

**To restart:**
```bash
cd backend
python3 -m uvicorn app.main:app --reload
```

---

**Status:** ✅ All Team Planning API issues resolved  
**Ready for:** Frontend integration and testing
