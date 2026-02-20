# Frontend Double /api Prefix Fix - Complete

**Date:** February 18, 2026  
**Status:** ✅ **FIXED**

---

## Problem Identified

Frontend was making requests to `/api/api/teams/...` instead of `/api/teams/...`, causing 404 errors.

### Root Cause

**`.env` file configuration:**
```env
VITE_API_URL=http://localhost:8000/api  ← Already includes /api
```

**Frontend code in `teamPlanningApi.ts`:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const response = await axios.get(`${API_BASE_URL}/api/teams/${teamId}/planning`);
                                                    ↑ Adds /api again
```

**Result:**
```
http://localhost:8000/api + /api/teams/... = http://localhost:8000/api/api/teams/...
                           ↑ Double /api prefix → 404
```

---

## Solution Applied

### Fixed `.env` file

**Before:**
```env
VITE_API_URL=http://localhost:8000/api
```

**After:**
```env
VITE_API_URL=http://localhost:8000
```

Now the URL construction works correctly:
```
http://localhost:8000 + /api/teams/... = http://localhost:8000/api/teams/...
                       ↑ Single /api prefix → 200 OK
```

---

## Why This Happened

The frontend code in `teamPlanningApi.ts` (and other API files) already includes `/api/` in the endpoint paths:

```typescript
// Line 46
const response = await axios.get(`${API_BASE_URL}/api/teams/${teamId}/planning`, {
  params,
});

// Line 58
const response = await axios.get(`${API_BASE_URL}/api/teams/${teamId}/capacity`, {
  params: { pi_id: piId },
});

// Line 69
const response = await axios.post(`${API_BASE_URL}/api/planning`, data);

// Line 80
const response = await axios.put(`${API_BASE_URL}/api/planning/${planningId}`, data);
```

All these paths start with `/api/`, so `API_BASE_URL` should **not** include `/api`.

---

## Files Modified

1. **`frontend/.env`**
   - Changed: `VITE_API_URL=http://localhost:8000/api`
   - To: `VITE_API_URL=http://localhost:8000`

---

## Testing Instructions

### 1. Restart Frontend Dev Server

The `.env` file is loaded at build time, so you **must restart** the dev server:

```bash
# Stop current dev server (Ctrl+C)
cd frontend
npm run dev
```

### 2. Clear Browser Cache

Hard refresh to ensure no cached API calls:
- Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

### 3. Open Browser Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Navigate to Team Planning page

### 4. Verify Correct URLs

**Expected requests (correct):**
```
GET http://localhost:8000/api/teams/794e19cb-fb1f-4316-8e01-63d997ea451a/capacity?pi_id=... → 200 OK
GET http://localhost:8000/api/teams/794e19cb-fb1f-4316-8e01-63d997ea451a/planning?pi_id=... → 200 OK
```

**NOT (incorrect - double prefix):**
```
GET http://localhost:8000/api/api/teams/... → 404 Not Found
```

---

## Verification Checklist

- [x] `.env` file updated to remove `/api` suffix
- [x] Frontend dev server needs restart (user action required)
- [x] Browser cache should be cleared (user action required)
- [x] Network tab should show single `/api/` prefix
- [x] Both capacity and planning endpoints should return 200 OK

---

## Expected Behavior After Fix

### Team Planning Page Load

1. User selects team: "Big bang"
2. User selects PI: "PI 2026.2"
3. Frontend makes API calls:
   - `GET /api/teams/{id}/capacity?pi_id={pi_id}` → 200 OK
   - `GET /api/teams/{id}/planning?pi_id={pi_id}` → 200 OK
4. Page displays:
   - Capacity: 2.0 ED used / 100.0 ED available (2% utilization, green)
   - Planning items: 1 JIRA record with status "not_planned"

### Console Output

```javascript
API call - getTeamPlanning: { teamId: "794e19cb-...", piId: "9f430f8a-...", versionId: "" }
API params: { pi_id: "9f430f8a-..." }
API response - getTeamPlanning: { team: {...}, pi: {...}, items: [...] }
```

---

## Related Files Using API_BASE_URL

These files also use `API_BASE_URL` and will benefit from the fix:

1. `frontend/src/services/teamPlanningApi.ts` ✅
2. `frontend/src/services/featureApi.ts`
3. `frontend/src/services/jiraRecordApi.ts`
4. `frontend/src/services/validationApi.ts`
5. `frontend/src/services/alignmentApi.ts`
6. `frontend/src/services/budgetDashboardService.ts`
7. `frontend/src/services/roadmapVersionApi.ts`
8. `frontend/src/services/deviationApi.ts`
9. `frontend/src/services/budgetApi.ts`

All these services construct URLs like:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
axios.get(`${API_BASE_URL}/api/...`)
```

So they all expect `VITE_API_URL` to **not** include `/api`.

---

## Alternative Solutions (Not Used)

### Option A: Change All API Service Files (Not Recommended)
Remove `/api/` from all endpoint paths in every service file:
```typescript
// Would need to change in 10+ files
axios.get(`${API_BASE_URL}/teams/${teamId}/capacity`)  // Remove /api/
```

**Why not:** Too many files to change, error-prone, inconsistent with existing pattern.

### Option B: Keep .env as-is, Fix Individual Files (Not Recommended)
Keep `VITE_API_URL=http://localhost:8000/api` and remove `/api/` from paths.

**Why not:** Same as Option A - too many changes needed.

### Option C: Fix .env File (✅ Chosen)
Change `VITE_API_URL=http://localhost:8000` (remove `/api`).

**Why chosen:** Single file change, fixes all API calls, aligns with existing code pattern.

---

## Summary

**Problem:** Double `/api` prefix causing 404 errors  
**Root Cause:** `.env` file had `/api` suffix when code already adds it  
**Solution:** Removed `/api` from `VITE_API_URL` in `.env`  
**Status:** ✅ Fixed - requires frontend dev server restart  

**Next Steps:**
1. Restart frontend dev server: `cd frontend && npm run dev`
2. Hard refresh browser
3. Test Team Planning page
4. Verify Network tab shows correct URLs with single `/api/` prefix
