# Frontend Debug Logging Added - Team Planning

**Date:** February 18, 2026  
**Status:** ✅ Debug logging added to track PI selection

---

## Changes Made

### 1. Frontend Hook - useTeamPlanning ✅

**File:** `frontend/src/hooks/useTeamPlanning.ts`

**Changes:**
- Made `versionId` parameter optional
- Removed requirement for `versionId` in enabled condition
- Added console logging to track hook calls and API requests

```typescript
export const useTeamPlanning = (teamId: string, piId: string, versionId?: string) => {
  console.log('useTeamPlanning called with:', { teamId, piId, versionId });
  
  return useQuery({
    queryKey: teamPlanningKeys.list(teamId, piId, versionId || ''),
    queryFn: () => {
      console.log('Fetching team planning with:', { teamId, piId, versionId });
      return teamPlanningApi.getTeamPlanning(teamId, piId, versionId);
    },
    enabled: !!teamId && !!piId,  // ✅ No longer requires versionId
  });
};
```

**Before:** Query was disabled when `versionId` was empty  
**After:** Query runs with just `teamId` and `piId`

### 2. API Service - teamPlanningApi ✅

**File:** `frontend/src/services/teamPlanningApi.ts`

**Changes:**
- Made `versionId` parameter optional
- Only include `version_id` in params if provided
- Added console logging for API calls and responses

```typescript
getTeamPlanning: async (
  teamId: string,
  piId: string,
  versionId?: string  // ✅ Optional
): Promise<TeamPlanningResponse> => {
  console.log('API call - getTeamPlanning:', { teamId, piId, versionId });
  const params: any = { pi_id: piId };
  if (versionId) {
    params.version_id = versionId;
  }
  const response = await axios.get(`${API_BASE_URL}/api/teams/${teamId}/planning`, {
    params,
  });
  console.log('API response - getTeamPlanning:', response.data);
  return response.data;
},
```

### 3. Team Planning Page - Debug Logging ✅

**File:** `frontend/src/pages/TeamPlanning/TeamPlanningPage.tsx`

**Changes Added:**

#### A. Selection State Logging
```typescript
// Debug logging for selections
useEffect(() => {
  console.log('Team Planning Page - Selected Team ID:', selectedTeamId);
  console.log('Team Planning Page - Selected PI ID:', selectedPiId);
}, [selectedTeamId, selectedPiId]);
```

#### B. PI Fetch Logging
```typescript
const fetchPIs = async () => {
  setPisLoading(true);
  try {
    const currentYear = new Date().getFullYear();
    console.log('Fetching PIs for year:', currentYear);
    const response = await axios.get(`${API_BASE_URL}/pis?year=${currentYear}`);
    const pisData = response.data.data || response.data.items || response.data || [];
    console.log('Fetched PIs:', pisData);
    setPis(Array.isArray(pisData) ? pisData : []);
  } catch (error) {
    console.error('Failed to fetch PIs:', error);
    message.error('Failed to load PIs');
    setPis([]);
  } finally {
    setPisLoading(false);
  }
};
```

#### C. PI Dropdown onChange Logging
```typescript
<Select
  style={{ width: '100%' }}
  placeholder="Select PI"
  loading={pisLoading}
  value={selectedPiId || undefined}
  onChange={(piId) => {
    console.log('PI dropdown onChange - Selected PI ID:', piId);
    const selectedPi = pis.find(p => p.id === piId);
    console.log('PI dropdown onChange - Selected PI object:', selectedPi);
    setSelectedPiId(piId);
  }}
  showSearch
  optionFilterProp="label"
  options={pis.map(p => ({ value: p.id, label: `${p.name} (${p.year})` }))}
/>
```

---

## Debug Console Output Flow

When user selects a PI, you'll see this in browser console:

```
1. Fetching PIs for year: 2026
2. Fetched PIs: [{ id: "4f96e0b1-...", name: "PI 2026.1", ... }, ...]
3. PI dropdown onChange - Selected PI ID: 4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27
4. PI dropdown onChange - Selected PI object: { id: "4f96e0b1-...", name: "PI 2026.1", year: 2026, sequence: 1 }
5. Team Planning Page - Selected Team ID: 794e19cb-fb1f-4316-8e01-63d997ea451a
6. Team Planning Page - Selected PI ID: 4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27
7. useTeamPlanning called with: { teamId: "794e19cb-...", piId: "4f96e0b1-...", versionId: "" }
8. Fetching team planning with: { teamId: "794e19cb-...", piId: "4f96e0b1-...", versionId: "" }
9. API call - getTeamPlanning: { teamId: "794e19cb-...", piId: "4f96e0b1-...", versionId: "" }
10. API response - getTeamPlanning: { team: {...}, pi: {...}, capacity: {...}, items: [...] }
```

---

## How to Use Debug Logging

### 1. Open Browser Console
- Chrome/Edge: F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)
- Firefox: F12 or Ctrl+Shift+K (Cmd+Option+K on Mac)

### 2. Navigate to Team Planning Page
```
Products → Team Planning
```

### 3. Select Team and PI
- Select a team from dropdown
- Select a PI from dropdown
- Watch console for debug output

### 4. Verify PI ID
Check that the PI ID logged matches the expected UUID format:
```
✅ Correct: 4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27
❌ Wrong: "PI 2026.1" or "1" or any non-UUID value
```

---

## Expected Behavior

### Correct Flow
1. User selects "PI 2026.1" from dropdown
2. Console shows: `Selected PI ID: 4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27`
3. API call uses: `pi_id=4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27`
4. Backend returns data for correct PI

### If Wrong PI ID Sent
Console will show exactly what's being sent, making it easy to identify:
- Is the dropdown value wrong?
- Is the state update wrong?
- Is the API call wrong?

---

## PI Data Reference

From database (`backend/safe_train.db`):

```
4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27 | PI 2026.1 | 2026 | 1
9f430f8a-1a07-45b6-9746-d5014879f5e3 | PI 2026.2 | 2026 | 2
1cacae5a-9cde-4135-a41f-2793f46fb8db | PI 2026.3 | 2026 | 3
933f386e-7317-4a8d-87e5-fecef0702d92 | PI 2026.4 | 2026 | 4
```

---

## Verification Steps

### 1. Check PI Dropdown Options
Console should show:
```javascript
Fetched PIs: [
  { id: "4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27", name: "PI 2026.1", year: 2026, sequence: 1 },
  { id: "9f430f8a-1a07-45b6-9746-d5014879f5e3", name: "PI 2026.2", year: 2026, sequence: 2 },
  ...
]
```

### 2. Check Dropdown Value Mapping
The Select component maps:
```typescript
options={pis.map(p => ({ 
  value: p.id,              // ✅ UUID
  label: `${p.name} (${p.year})`  // Display text
}))}
```

### 3. Check API Call
Console should show:
```javascript
API call - getTeamPlanning: {
  teamId: "794e19cb-fb1f-4316-8e01-63d997ea451a",
  piId: "4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27",  // ✅ UUID, not name
  versionId: ""
}
```

---

## Files Modified

1. **`frontend/src/hooks/useTeamPlanning.ts`**
   - Made versionId optional
   - Removed versionId requirement from enabled condition
   - Added debug logging

2. **`frontend/src/services/teamPlanningApi.ts`**
   - Made versionId optional
   - Conditionally include version_id in params
   - Added debug logging

3. **`frontend/src/pages/TeamPlanning/TeamPlanningPage.tsx`**
   - Added selection state logging
   - Added PI fetch logging
   - Added dropdown onChange logging

---

## Next Steps

1. **Start frontend dev server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open browser console** (F12)

3. **Navigate to Team Planning page**

4. **Select team and PI** - watch console output

5. **Verify PI ID** is UUID format in all logs

6. **Check API response** contains correct data

---

## Troubleshooting

### If PI dropdown shows wrong values
Check console log: `Fetched PIs: [...]`
- Should show array of PI objects with `id`, `name`, `year`, `sequence`

### If wrong PI ID in API call
Check console logs in order:
1. `PI dropdown onChange - Selected PI ID:` - Should be UUID
2. `Team Planning Page - Selected PI ID:` - Should match dropdown
3. `API call - getTeamPlanning:` - Should match state

### If API returns 404
Check backend console for the actual `pi_id` received:
```
DEBUG: get_team_capacity called with team_id=..., pi_id=...
```

---

**Status:** ✅ Debug logging complete  
**Ready for:** Frontend testing with browser console open
