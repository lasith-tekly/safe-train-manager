# JIRA Record Service - LIST Endpoint PI Serialization Fix

**Date:** February 6, 2026  
**Status:** ✅ FIXED

---

## Problem

**Error:** GET `/api/features/{id}/jira-records` returns 500 error due to PI serialization

**Root Cause:** Service methods in `jira_record_service.py` were returning Pydantic `JiraRecordResponse` objects which contained SQLAlchemy relationships (PI, Team) that couldn't be serialized properly.

---

## Fixes Applied

### Fix 1: _build_jira_record_response ✅
**File:** `backend/app/services/jira_record_service.py` (lines 490-511)

**Changed return type from `JiraRecordResponse` to `dict`:**
```python
def _build_jira_record_response(self, record: JiraRecord) -> dict:
    """Build JIRA record response with related data"""
    return {
        "id": record.id,
        "jira_key": record.jira_key,
        "title": record.title or "Untitled",
        "description": record.description,
        "feature_id": record.feature_id,
        "feature_name": record.feature.name if record.feature else None,
        "team_id": record.team_id,
        "team_name": record.team.name if record.team else None,
        "pi_id": record.pi_id,
        "pi_name": record.pi.name if record.pi else None,
        "planned_effort": float(record.planned_effort) if record.planned_effort else 0.0,
        "actual_effort": float(record.actual_effort) if record.actual_effort else None,
        "status": record.status or "PLANNED",
        "spillover_from_pi_id": record.spillover_from_pi_id,
        "spillover_from_pi_name": record.spillover_from_pi.name if record.spillover_from_pi else None,
        "spillover_reason": record.spillover_reason,
        "created_at": record.created_at,
        "updated_at": record.updated_at
    }
```

### Fix 2: get_feature_jira_records ✅
**File:** `backend/app/services/jira_record_service.py` (lines 36-91)

**Changed return type from `JiraRecordListResponse` to `dict`:**
```python
def get_feature_jira_records(...) -> dict:
    # ... query logic ...
    
    items = [self._build_jira_record_response(r) for r in records]
    
    return {
        "items": items,
        "total": len(records),
        "summary": summary
    }
```

### Fix 3: get_jira_record ✅
**Changed return type from `Optional[JiraRecordResponse]` to `Optional[dict]`**

### Fix 4: update_jira_record ✅
**Changed return type from `JiraRecordResponse` to `dict`**

### Fix 5: mark_as_spillover ✅
**Changed return type from `JiraRecordResponse` to `dict`**

---

## Schema Used

This service uses the **flat schema** from `jira_record.py`:
- `pi_name` (string) - NOT `pi` (dict or object)
- `team_name` (string) - NOT `team` (object)
- `feature_name` (string)
- `spillover_from_pi_name` (string)

**Note:** This is different from the `roadmap_v4.py` schema which expects `pi: dict` and `team: dict`.

---

## Testing

```bash
cd backend
python3 -m uvicorn app.main:app --reload
```

Test LIST:
```bash
curl http://localhost:8000/api/features/{feature_id}/jira-records
```

Expected: 200 OK with properly serialized response:
```json
{
  "items": [
    {
      "id": "...",
      "title": "My Record",
      "team_name": "Team A",
      "pi_name": "PI 2026.1",
      "feature_name": "My Feature",
      "planned_effort": 10.0,
      "status": "PLANNED"
    }
  ],
  "total": 1,
  "summary": {
    "total_planned_effort": 10.0,
    "total_actual_effort": 0.0,
    "by_status": {"PLANNED": 1},
    "by_pi": {"PI 2026.1": 10.0},
    "by_team": {"Team A": 10.0}
  }
}
```

---

## Impact

**All JIRA record service methods now return dicts instead of Pydantic objects:**
- ✅ `get_feature_jira_records()` - LIST endpoint
- ✅ `get_jira_record()` - GET single endpoint
- ✅ `create_jira_record()` - POST endpoint (returns tuple)
- ✅ `update_jira_record()` - PUT endpoint
- ✅ `mark_as_spillover()` - POST spillover endpoint
- ✅ `_build_jira_record_response()` - Helper method

**This ensures:**
- No SQLAlchemy object serialization issues
- Consistent response format across all endpoints
- FastAPI can serialize responses without validation errors

---

**Status:** ✅ FIXED
**Files Modified:** 1 file (jira_record_service.py)
**Methods Updated:** 6 methods
