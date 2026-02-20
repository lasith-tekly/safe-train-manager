# Feature Service V4 - PI Serialization Fix

**Date:** February 6, 2026  
**Status:** ✅ FIXED

---

## Problem

**Error:** `ResponseValidationError: 'pi': 'Input should be a valid dictionary', 'input': <PI PI 2026.1 (2026)>`

**Location:** POST `/api/features/{feature_id}/jira-records`

**Root Cause:** Service methods in `feature_service_v4.py` were returning SQLAlchemy `JiraRecord` objects directly. When FastAPI tried to serialize using `JiraRecordResponse` schema, the `pi` and `team` relationships were SQLAlchemy objects instead of dicts.

---

## Fixes Applied

### Fix 1: create_jira_record ✅
**File:** `backend/app/services/feature_service_v4.py` (lines 256-311)

**Changed return type from `JiraRecord` to `dict`:**
```python
def create_jira_record(self, feature_id: str, request: CreateJiraRecordRequest) -> dict:
    # ... create logic ...
    
    # Convert to dict with proper serialization
    return {
        "id": jira_record.id,
        "title": jira_record.title or "Untitled",
        "team": {"id": jira_record.team.id, "name": jira_record.team.name} if jira_record.team else None,
        "pi": {"id": str(jira_record.pi.id), "name": jira_record.pi.name, "year": jira_record.pi.year} if jira_record.pi else None,
        # ... all other fields
    }
```

### Fix 2: update_jira_record ✅
**File:** `backend/app/services/feature_service_v4.py` (lines 313-387)

**Same fix - return dict instead of SQLAlchemy object**

---

## Testing

```bash
cd backend
python3 -m uvicorn app.main:app --reload
```

Test create:
```bash
curl -X POST http://localhost:8000/api/features/{id}/jira-records \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "team_id": "...", "pi_id": "...", "planned_effort": 10, "status": "PLANNED"}'
```

Expected: 201 Created with properly serialized response

---

**Status:** ✅ FIXED
**Files Modified:** 1 file (feature_service_v4.py)
