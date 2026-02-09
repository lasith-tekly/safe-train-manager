# JIRA Record Save Fix - PI Serialization Error

**Date:** February 6, 2026  
**Status:** ✅ FIXED

---

## Problem

**Error on POST `/api/features/{feature_id}/jira-records`:**
```
500 Internal Server Error
ValidationError: 'pi': 'Input should be a valid dictionary', 'input': <PI PI 2026.1 (2026)>
```

**Root Cause:** Multiple issues causing PI serialization failure:
1. Route in `jira_v4.py` not handling tuple return from service
2. Service method `_build_jira_record_response` was using wrong schema format
3. Mismatch between two schema files (`jira.py` vs `jira_record.py`)

---

## Fixes Applied

### Fix 1: Handle Tuple Return in jira_v4.py ✅

**File:** `backend/app/routes/jira_v4.py` (line 43)

**Problem:** Service returns `(record, capacity_warning)` tuple, but route was trying to return it directly.

**Changed:**
```python
# BEFORE
jira_record = service.create_jira_record(feature_id, request)
return jira_record

# AFTER
jira_record, capacity_warning = service.create_jira_record(feature_id, request)
# TODO: Handle capacity_warning (maybe add to response headers or separate field)
return jira_record
```

**Note:** The main route being used by frontend is in `jira_records.py` which already handles this correctly (line 69).

---

### Fix 2: Match Schema Format in _build_jira_record_response ✅

**File:** `backend/app/services/jira_record_service.py` (lines 490-511)

**Problem:** Service was building response with wrong field names. The actual schema (`jira_record.py`) expects:
- `pi_name` (string) - NOT `pi` (dict)
- `team_name` (string) - NOT `team` (TeamSummary object)
- `feature_name` (string)
- `spillover_from_pi_name` (string)

**Changed:**
```python
# BEFORE (WRONG - tried to use nested objects)
def _build_jira_record_response(self, record: JiraRecord) -> JiraRecordResponse:
    from app.schemas.jira import TeamSummary
    
    return JiraRecordResponse(
        id=record.id,
        jira_key=record.jira_key,
        title=record.title or "Untitled",
        description=record.description,
        feature_id=record.feature_id,
        team_id=record.team_id,
        team=TeamSummary(  # ❌ Schema expects team_name, not team object
            id=record.team.id,
            name=record.team.name,
            short_code=getattr(record.team, 'short_code', None)
        ) if record.team else None,
        pi_id=record.pi_id,
        pi={"id": str(record.pi.id), "name": record.pi.name} if record.pi else None,  # ❌ Schema expects pi_name, not pi dict
        planned_effort=record.planned_effort or 0,
        actual_effort=record.actual_effort,
        status=record.status or "PLANNED",
        spillover_from_pi_id=record.spillover_from_pi_id,
        spillover_reason=record.spillover_reason,
        created_at=record.created_at,
        updated_at=record.updated_at
    )

# AFTER (CORRECT - uses name fields)
def _build_jira_record_response(self, record: JiraRecord) -> JiraRecordResponse:
    return JiraRecordResponse(
        id=record.id,
        jira_key=record.jira_key,
        title=record.title or "Untitled",
        description=record.description,
        feature_id=record.feature_id,
        feature_name=record.feature.name if record.feature else None,  # ✅ String field
        team_id=record.team_id,
        team_name=record.team.name if record.team else None,  # ✅ String field
        pi_id=record.pi_id,
        pi_name=record.pi.name if record.pi else None,  # ✅ String field
        planned_effort=record.planned_effort or 0,
        actual_effort=record.actual_effort,
        status=record.status or "PLANNED",
        spillover_from_pi_id=record.spillover_from_pi_id,
        spillover_from_pi_name=record.spillover_from_pi.name if record.spillover_from_pi else None,  # ✅ String field
        spillover_reason=record.spillover_reason,
        created_at=record.created_at,
        updated_at=record.updated_at
    )
```

---

## Schema Reference

### Actual Schema (jira_record.py)
```python
class JiraRecordResponse(BaseModel):
    """Schema for JIRA record response."""
    id: str
    jira_key: Optional[str]
    title: str
    description: Optional[str]
    feature_id: str
    feature_name: Optional[str] = None        # ← String, not object
    team_id: Optional[str]
    team_name: Optional[str] = None           # ← String, not object
    pi_id: Optional[str]
    pi_name: Optional[str] = None             # ← String, not dict
    planned_effort: float
    actual_effort: Optional[float]
    status: str
    spillover_from_pi_id: Optional[str]
    spillover_from_pi_name: Optional[str] = None  # ← String, not object
    spillover_reason: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True
```

**Key Points:**
- Uses flat structure with name fields
- No nested objects or dicts
- Simple string fields for related entity names
- Pydantic can serialize this directly

---

## Testing Instructions

### Backend Test
```bash
# 1. Restart backend
cd backend
python3 -m uvicorn app.main:app --reload

# 2. Test create JIRA record
curl -X POST http://localhost:8000/api/features/{feature_id}/jira-records \
  -H "Content-Type: application/json" \
  -d '{
    "jira_key": "TEST-123",
    "title": "Test Record",
    "team_id": "{team_id}",
    "pi_id": "{pi_id}",
    "planned_effort": 10,
    "status": "PLANNED"
  }'

# Expected: 201 Created
{
  "record": {
    "id": "...",
    "title": "Test Record",
    "team_name": "Team A",      // ✅ String, not object
    "pi_name": "PI 2026.1",     // ✅ String, not dict
    "feature_name": "My Feature",
    "planned_effort": 10.0,
    "status": "PLANNED",
    // ... other fields
  },
  "capacity_warning": null  // or warning object if over-allocated
}
```

### Frontend Test
```bash
# 1. Restart frontend
cd frontend
npm run dev

# 2. Test in browser
# - Navigate to: Products → Select product → Click "Execute" on feature
# - Click "Add JIRA Record"
# - Fill form and save

# Expected:
# ✅ Record saves successfully
# ✅ No 500 error
# ✅ Record appears in table
# ✅ Console shows no errors
```

---

## Verification Checklist

- [x] Fixed tuple handling in jira_v4.py route
- [x] Updated _build_jira_record_response to use name fields
- [x] Removed nested object/dict serialization
- [x] Matched actual schema in jira_record.py
- [ ] Tested create endpoint returns 201 (pending)
- [ ] Verified response structure correct (pending)
- [ ] Confirmed frontend can save records (pending)

---

## Expected Behavior After Fix

### Before (❌ Error)
```
POST /api/features/{id}/jira-records
→ 500 Internal Server Error
→ ValidationError: 'pi': 'Input should be a valid dictionary'
→ Frontend shows error message
→ Record not saved
```

### After (✅ Working)
```
POST /api/features/{id}/jira-records
→ 201 Created
→ Response:
{
  "record": {
    "id": "abc-123",
    "title": "My JIRA Record",
    "team_name": "Team A",
    "pi_name": "PI 2026.1",
    "feature_name": "My Feature",
    "planned_effort": 10.0,
    "status": "PLANNED"
  },
  "capacity_warning": null
}
→ Frontend shows success message
→ Record appears in table
```

---

## Root Cause Analysis

### Why This Happened

**Schema Confusion:**
There are TWO schema files with similar but different structures:

1. **`backend/app/schemas/jira.py`** (OLD)
   - Uses nested objects: `pi: Optional[dict]`, `team: Optional[TeamSummary]`
   - Used by some older routes

2. **`backend/app/schemas/jira_record.py`** (CURRENT)
   - Uses flat structure: `pi_name: Optional[str]`, `team_name: Optional[str]`
   - Used by current execution planning routes

**The service was trying to use the OLD schema format, but the routes were expecting the CURRENT schema format.**

### Lesson Learned
- Always check which schema file is being imported
- Verify response structure matches the actual schema
- Use flat structures for simpler serialization
- Avoid mixing nested objects with Pydantic when possible

---

## Related Files

### Backend
- `backend/app/routes/jira_v4.py` - Alternative route (fixed tuple handling)
- `backend/app/routes/jira_records.py` - Main route (already correct)
- `backend/app/services/jira_record_service.py` - Service (fixed response builder)
- `backend/app/schemas/jira_record.py` - Current schema (flat structure)
- `backend/app/schemas/jira.py` - Old schema (nested structure)

### Frontend
- `frontend/src/services/jiraRecordApi.ts` - API calls
- `frontend/src/pages/RoadmapV4/components/JiraRecordModal.tsx` - Form

---

## Common Issues & Solutions

### Issue: Still getting validation error
**Solution:**
- Restart backend server
- Clear Python cache: `rm -rf backend/**/__pycache__`
- Verify correct schema is imported: `grep "from app.schemas" backend/app/services/jira_record_service.py`
- Check response in browser DevTools → Network tab

### Issue: Response has wrong structure
**Solution:**
- Verify service uses `jira_record.py` schema, not `jira.py`
- Check `_build_jira_record_response` uses name fields
- Ensure no nested objects or dicts

### Issue: Frontend shows different error
**Solution:**
- Check browser console for actual error
- Verify API endpoint is correct: `/api/features/{id}/jira-records`
- Check request payload matches schema

---

## Impact Assessment

- **Impact:** CRITICAL - Prevents saving JIRA records
- **Risk:** LOW - Only affects response serialization
- **Breaking:** NO - Fixes existing broken functionality
- **Performance:** NONE - Same data, correct format

---

## Next Steps

1. **Restart Backend:**
   ```bash
   cd backend
   python3 -m uvicorn app.main:app --reload
   ```

2. **Test Create Endpoint:**
   - Use curl or Postman
   - Verify 201 response
   - Check response structure

3. **Test Frontend:**
   - Open Execution Planning drawer
   - Add new JIRA record
   - Verify save succeeds

4. **Verify:**
   - No 500 errors
   - Records save successfully
   - Table updates correctly

---

**Status:** ✅ FIXED - Ready for Testing  
**Files Modified:** 2 files (jira_v4.py, jira_record_service.py)  
**Next Action:** Restart backend and test in browser
