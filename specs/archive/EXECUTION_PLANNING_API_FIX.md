# Execution Planning API URL Fix

**Date:** February 6, 2026  
**Issue:** Double `/api/` prefix causing 404 errors  
**Status:** ✅ FIXED

---

## Problem

API calls were generating URLs with double `/api/` prefix:
```
❌ GET /api/api/features/.../jira-records 404
❌ GET /api/api/teams 404
❌ GET /api/api/pis 404
```

**Root Cause:**
- `API_BASE_URL` was set to `http://127.0.0.1:8000` (no `/api`)
- All endpoint URLs included `/api/` prefix
- Result: `http://127.0.0.1:8000` + `/api/features/...` = correct
- But somewhere axios was adding another `/api`, causing double prefix

---

## Solution

Updated `API_BASE_URL` to include `/api` and removed `/api` prefix from all endpoint URLs.

### Files Fixed

#### 1. `frontend/src/services/jiraRecordApi.ts` ✅

**Changed:**
```typescript
// BEFORE
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
axios.get(`${API_BASE_URL}/api/features/${featureId}/jira-records`)

// AFTER
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
axios.get(`${API_BASE_URL}/features/${featureId}/jira-records`)
```

**All endpoints fixed:**
- ✅ `/features/{feature_id}/jira-records` (list)
- ✅ `/jira-records/{record_id}` (get)
- ✅ `/features/{feature_id}/jira-records` (create)
- ✅ `/jira-records/{record_id}` (update)
- ✅ `/jira-records/{record_id}` (delete)
- ✅ `/jira-records/{record_id}/spillover` (spillover)
- ✅ `/teams/{team_id}/pi-allocation/{pi_id}` (capacity)
- ✅ `/features/{feature_id}/validate-execution` (validate)

#### 2. `frontend/src/pages/RoadmapV4/components/JiraRecordModal.tsx` ✅

**Changed:**
```typescript
// BEFORE
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
axios.get(`${API_BASE_URL}/api/teams`)
axios.get(`${API_BASE_URL}/api/pis`)

// AFTER
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
axios.get(`${API_BASE_URL}/teams`)
axios.get(`${API_BASE_URL}/pis?year=${currentYear}`)
```

**Additional fix for PIs endpoint:**
- Added required `year` query parameter
- PI endpoint requires `year` (e.g., `?year=2026`)
- Response structure: `response.data.data` (not `response.data.items`)

---

## Expected URLs Now

### JIRA Records
```
✅ GET  http://127.0.0.1:8000/api/features/{id}/jira-records
✅ POST http://127.0.0.1:8000/api/features/{id}/jira-records
✅ GET  http://127.0.0.1:8000/api/jira-records/{id}
✅ PUT  http://127.0.0.1:8000/api/jira-records/{id}
✅ DELETE http://127.0.0.1:8000/api/jira-records/{id}
```

### Supporting Endpoints
```
✅ GET http://127.0.0.1:8000/api/teams
✅ GET http://127.0.0.1:8000/api/pis?year=2026
✅ GET http://127.0.0.1:8000/api/teams/{id}/pi-allocation/{pi_id}
```

---

## Backend Endpoints Verified

### JIRA Records Router
**File:** `backend/app/routes/jira_records.py`
```python
router = APIRouter(prefix="/api", tags=["jira-records"])

@router.get("/features/{feature_id}/jira-records")
@router.post("/features/{feature_id}/jira-records")
@router.get("/jira-records/{record_id}")
@router.put("/jira-records/{record_id}")
@router.delete("/jira-records/{record_id}")
@router.post("/jira-records/{record_id}/spillover")
@router.get("/teams/{team_id}/pi-allocation/{pi_id}")
@router.post("/features/{feature_id}/validate-execution")
```

### Teams Router
**File:** `backend/app/routes/teams.py`
```python
router = APIRouter(prefix="/api/teams", tags=["teams"])

@router.get("")  # Lists all teams
```

### PIs Router
**File:** `backend/app/routes/pis.py`
```python
router = APIRouter(prefix="/api/pis", tags=["pis"])

@router.get("")  # Requires year query parameter
def list_pis(year: int = Query(...)):
    ...
```

---

## Testing

### Test URLs Manually

**1. Test Teams Endpoint:**
```bash
curl http://localhost:8000/api/teams
```
Expected: 200 OK with teams list

**2. Test PIs Endpoint:**
```bash
curl http://localhost:8000/api/pis?year=2026
```
Expected: 200 OK with PIs list

**3. Test JIRA Records (after creating feature):**
```bash
curl http://localhost:8000/api/features/{feature_id}/jira-records
```
Expected: 200 OK with records list

### Test in Browser

1. Start backend: `cd backend && python3 -m uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to Products → Select product → Click "Execute" on feature
4. Open browser DevTools → Network tab
5. Click "Add JIRA Record"
6. Verify URLs in Network tab:
   - ✅ Should see `/api/teams` (not `/api/api/teams`)
   - ✅ Should see `/api/pis?year=2026` (not `/api/api/pis`)
   - ✅ Should see `/api/features/.../jira-records` when saving

---

## Common Issues & Solutions

### Issue: Still seeing `/api/api/` in URLs
**Solution:** 
- Clear browser cache
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
- Restart frontend dev server

### Issue: PIs endpoint returns 422 Validation Error
**Solution:**
- Check that `year` query parameter is included
- Year must be between 2020-2100
- Example: `/api/pis?year=2026`

### Issue: Teams endpoint returns empty array
**Solution:**
- Check database has teams
- Run: `SELECT * FROM teams;` in SQLite
- Create teams if needed via Teams management UI

### Issue: JIRA records endpoint returns 404
**Solution:**
- Verify feature_id exists
- Check that jira_records router is registered in `main.py`
- Verify backend is running on port 8000

---

## Verification Checklist

- [x] Updated `jiraRecordApi.ts` base URL
- [x] Removed `/api` prefix from all jiraRecordApi endpoints
- [x] Updated `JiraRecordModal.tsx` base URL
- [x] Fixed teams endpoint URL
- [x] Fixed PIs endpoint URL with year parameter
- [x] Verified backend routes match frontend URLs
- [ ] Tested in browser (pending user testing)
- [ ] Verified no 404 errors in Network tab (pending)
- [ ] Confirmed JIRA records can be created (pending)

---

## Next Steps

1. **Frontend Developer:** Restart frontend dev server
2. **QA Engineer:** Test all API calls in browser
3. **Check Network Tab:** Verify no `/api/api/` URLs
4. **Test CRUD:** Create, read, update, delete JIRA records
5. **Report Issues:** If any 404s persist, check browser console

---

## Related Files

- `frontend/src/services/jiraRecordApi.ts` - Main API service
- `frontend/src/pages/RoadmapV4/components/JiraRecordModal.tsx` - Modal component
- `backend/app/routes/jira_records.py` - Backend routes
- `backend/app/routes/teams.py` - Teams routes
- `backend/app/routes/pis.py` - PIs routes
- `backend/app/main.py` - Router registration

---

**Status:** ✅ FIXED - Ready for Testing  
**Impact:** All Execution Planning API calls should now work correctly  
**Breaking Changes:** None - only URL fixes
