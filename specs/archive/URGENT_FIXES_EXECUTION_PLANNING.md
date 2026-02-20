# URGENT: Execution Planning Fixes

**Date:** February 6, 2026  
**Status:** ✅ FIXED

---

## Issue 1: Backend - Missing Service Method ✅

### Problem
```
AttributeError: 'JiraRecordService' object has no attribute 'list_jira_records_for_feature'
Location: backend/app/routes/jira_v4.py line 28
```

### Root Cause
Route was calling `service.list_jira_records_for_feature(feature_id)` but the service method is named `get_feature_jira_records`.

### Fix Applied
**File:** `backend/app/routes/jira_v4.py`

**Changed:**
```python
# BEFORE (line 28)
jira_records = service.list_jira_records_for_feature(feature_id)
return JiraRecordListResponse(
    data=jira_records,
    total=len(jira_records)
)

# AFTER
response = service.get_feature_jira_records(feature_id)
return response
```

**Why this works:**
- `get_feature_jira_records` already returns a `JiraRecordListResponse` object
- No need to manually construct the response
- Method signature matches: `def get_feature_jira_records(self, feature_id: str, status=None, team_id=None, pi_id=None)`

---

## Issue 2: Frontend - teams.map is not a function ✅

### Problem
```
TypeError: teams.map is not a function
Location: JiraRecordModal.tsx line 220, 235, 301
```

### Root Cause
API returns `{data: [...], total: 7}` but code expected array directly.
When response structure doesn't match, `teams` becomes an object instead of array.

### Fixes Applied
**File:** `frontend/src/pages/RoadmapV4/components/JiraRecordModal.tsx`

#### Fix 1: Safe Data Extraction in fetchTeams
```typescript
// BEFORE
const response = await axios.get(`${API_BASE_URL}/teams`);
setTeams(response.data.items || response.data || []);

// AFTER
const response = await axios.get(`${API_BASE_URL}/teams`);
const teamsData = response.data.data || response.data.items || response.data || [];
setTeams(Array.isArray(teamsData) ? teamsData : []);
```

**Added:**
- Checks `response.data.data` first (new format)
- Falls back to `response.data.items` (old format)
- Falls back to `response.data` (direct array)
- Validates with `Array.isArray()` before setting
- Sets empty array `[]` on error

#### Fix 2: Safe Data Extraction in fetchPIs
```typescript
// BEFORE
const response = await axios.get(`${API_BASE_URL}/pis?year=${currentYear}`);
setPIs(response.data.data || response.data.items || []);

// AFTER
const response = await axios.get(`${API_BASE_URL}/pis?year=${currentYear}`);
const pisData = response.data.data || response.data.items || response.data || [];
setPIs(Array.isArray(pisData) ? pisData : []);
```

**Added:**
- Same safe extraction pattern as teams
- Sets empty array `[]` on error

#### Fix 3: Null-Safe Rendering (3 locations)
```typescript
// BEFORE (line 220)
{teams.map(t => (
  <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
))}

// AFTER
{(teams || []).map(t => (
  <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
))}
```

**Applied to:**
- Line 224: Teams dropdown
- Line 239: PIs dropdown  
- Line 301: Spillover PIs dropdown

**Why this works:**
- `(teams || [])` ensures we always have an array
- If `teams` is null/undefined, uses empty array
- `.map()` on empty array returns empty list (no error)

---

## Testing Instructions

### Backend Test
```bash
# 1. Restart backend
cd backend
python3 -m uvicorn app.main:app --reload

# 2. Test endpoint in browser or curl
curl http://localhost:8000/api/features/{feature_id}/jira-records

# Expected: 200 OK with JiraRecordListResponse
# {
#   "items": [...],
#   "total": 0,
#   "summary": {...}
# }
```

### Frontend Test
```bash
# 1. Restart frontend
cd frontend
npm run dev

# 2. Open browser DevTools → Console
# 3. Navigate to: Products → Select product → Click "Execute" on feature
# 4. Click "Add JIRA Record"

# Expected:
# - No "teams.map is not a function" error
# - Teams dropdown populates
# - PIs dropdown populates
# - No console errors
```

---

## Verification Checklist

### Backend
- [x] Fixed method name in jira_v4.py route
- [x] Route now calls `get_feature_jira_records`
- [x] Returns response directly (already correct format)
- [ ] Tested endpoint returns 200 OK (pending)
- [ ] Verified response structure matches schema (pending)

### Frontend
- [x] Added safe data extraction in fetchTeams
- [x] Added safe data extraction in fetchPIs
- [x] Added Array.isArray() validation
- [x] Added error handling with empty array fallback
- [x] Added null-safe rendering with `(teams || [])`
- [x] Applied to all 3 .map() locations
- [ ] Tested dropdowns populate correctly (pending)
- [ ] Verified no console errors (pending)

---

## Expected Behavior After Fix

### Backend
1. ✅ GET `/api/features/{id}/jira-records` returns 200 OK
2. ✅ Response structure:
   ```json
   {
     "items": [],
     "total": 0,
     "summary": {
       "total_planned_effort": 0,
       "total_actual_effort": 0,
       "by_status": {},
       "by_pi": {},
       "by_team": {}
     }
   }
   ```

### Frontend
1. ✅ Modal opens without errors
2. ✅ Teams dropdown shows list of teams
3. ✅ PIs dropdown shows list of PIs for current year
4. ✅ No "teams.map is not a function" error
5. ✅ Spillover section shows PIs dropdown when status = SPILLOVER
6. ✅ All dropdowns handle empty data gracefully

---

## Common Issues & Solutions

### Issue: Backend still shows AttributeError
**Solution:**
- Restart backend server
- Clear Python cache: `find . -type d -name __pycache__ -exec rm -rf {} +`
- Verify fix was saved: `grep "get_feature_jira_records" backend/app/routes/jira_v4.py`

### Issue: Frontend still shows teams.map error
**Solution:**
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)
- Clear browser cache
- Restart frontend dev server
- Check console for actual error message

### Issue: Dropdowns are empty
**Solution:**
- Verify backend is running on port 8000
- Check Network tab for 200 OK responses
- Verify database has teams and PIs:
  ```sql
  SELECT * FROM teams;
  SELECT * FROM pis WHERE year = 2026;
  ```

### Issue: PIs endpoint returns 422 Validation Error
**Solution:**
- Verify year parameter is included: `/api/pis?year=2026`
- Check current year is being passed correctly
- Verify PIs exist for current year in database

---

## Related Files

### Backend
- `backend/app/routes/jira_v4.py` - Fixed route method call
- `backend/app/services/jira_record_service.py` - Service with correct method name
- `backend/app/schemas/jira.py` - Response schemas

### Frontend
- `frontend/src/pages/RoadmapV4/components/JiraRecordModal.tsx` - Fixed data extraction and rendering
- `frontend/src/services/jiraRecordApi.ts` - API service layer

---

## Next Steps

1. **Backend Developer:** Restart backend server
2. **Frontend Developer:** Restart frontend dev server  
3. **QA Engineer:** Test both fixes
4. **Verify:** No errors in console
5. **Test:** Create JIRA record end-to-end

---

## Code Changes Summary

### Backend Changes
- **1 file modified:** `backend/app/routes/jira_v4.py`
- **1 line changed:** Method call updated
- **Impact:** Fixes 500 error when listing JIRA records

### Frontend Changes
- **1 file modified:** `frontend/src/pages/RoadmapV4/components/JiraRecordModal.tsx`
- **6 changes:**
  - 2 fetch functions updated (teams, PIs)
  - 3 render locations updated (.map calls)
  - Error handling added
- **Impact:** Fixes TypeError and makes dropdowns robust

---

**Status:** ✅ BOTH ISSUES FIXED  
**Testing:** Pending user verification  
**Deployment:** Ready after testing confirms fixes work
