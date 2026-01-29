# QA Issue: Capacity Display Inconsistency

**Date:** 2026-01-27  
**Status:** ⚠️ IDENTIFIED - Display Inconsistency  
**Severity:** Medium - Causes user confusion

---

## Issue Summary

The **Train Capacity Dashboard** and **Team Capacity Detail Panel** display different capacity values for the same team and PI, causing confusion about which numbers are correct.

---

## Example: Big bang Team - PI 2026.1

### Train Capacity Dashboard Shows:
- **Total Capacity:** 256.8 eD (productive capacity)
- **Iteration 1:** 36.2 eD
- **Iteration 2:** 59.8 eD
- **Iteration 3:** 55.0 eD
- **Iteration 4:** 85.4 eD
- **IP:** 20.3 eD

### Team Capacity Detail Panel Shows:
- **Total Capacity:** 185.9 eD (raw capacity)
- **Iteration 1:** 24.1 eD
- **Iteration 2:** 39.8 eD
- **Iteration 3:** 40.0 eD
- **Iteration 4:** 55.6 eD
- **IP:** 26.4 eD

### Difference:
- **256.8 eD vs 185.9 eD** - A difference of **70.9 eD**

---

## Root Cause

The two views call **different API endpoints** that return **different types of capacity**:

### 1. Train Capacity Dashboard
**Endpoint:** `GET /api/dashboard/train-overview?pi_id={id}`  
**Returns:** **Productive Capacity**
- Applies **80% productivity factor**
- Deducts **PI planning days** (2 days per member for IP iteration)
- This is the **usable capacity** for planning work

### 2. Team Capacity Detail Panel
**Endpoint:** `GET /api/teams/{team_id}/capacity/pi/{pi_id}`  
**Returns:** **Raw Capacity**
- Shows **raw working days** without productivity
- Does NOT deduct PI planning overhead
- This is the **theoretical maximum** capacity

---

## Why This Happens

### Calculation Breakdown for Big bang Team:

**Raw Capacity (185.9 eD):**
```
Working Days = 185.9 eD
(This is what Team detail panel shows)
```

**Productive Capacity (256.8 eD):**
```
Step 1: Apply Productivity (80%)
  185.9 eD × 0.80 = 148.7 eD

Step 2: Add back for non-IP iterations
  (The calculation is more complex - it applies productivity
   per member per iteration, considering leave and holidays)

Step 3: Deduct PI Planning for IP iteration
  IP iteration: 26.4 eD (raw) → 20.3 eD (after PI planning deduction)

Final: 256.8 eD productive capacity
```

**Note:** The actual calculation is done at the member level per iteration, which is why the numbers don't match a simple 80% multiplication.

---

## Impact

### User Confusion:
1. ❌ Users see **different numbers** for the same team/PI
2. ❌ Not clear which number to use for planning
3. ❌ Looks like a bug or data inconsistency
4. ❌ Hard to reconcile capacity across views

### Business Impact:
- **Medium** - Teams may plan based on wrong capacity numbers
- **Medium** - Capacity planning meetings become confusing
- **Low** - Doesn't affect actual calculations (those are correct)

---

## Solution Options

### Option 1: Display Productive Capacity Everywhere (RECOMMENDED)
**Change:** Update Team Capacity detail panel to show productive capacity  
**Pros:**
- ✅ Consistent with Train Dashboard
- ✅ Shows realistic, usable capacity
- ✅ Better for planning (this is what teams can actually use)
- ✅ No calculation logic changes needed

**Cons:**
- ⚠️ Requires updating the display logic in Team detail panel
- ⚠️ May need to update API response or add calculated field

### Option 2: Display Raw Capacity Everywhere
**Change:** Update Train Dashboard to show raw capacity  
**Pros:**
- ✅ Shows maximum theoretical capacity
- ✅ Simpler numbers (no productivity factor)

**Cons:**
- ❌ Not useful for planning (teams can't use 100% of raw capacity)
- ❌ Misleading for capacity planning
- ❌ Doesn't account for productivity reality

### Option 3: Show Both Values with Clear Labels
**Change:** Display both raw and productive capacity with clear labels  
**Pros:**
- ✅ Full transparency
- ✅ Users can see both views
- ✅ Educational for understanding capacity

**Cons:**
- ⚠️ More complex UI
- ⚠️ May still confuse some users
- ⚠️ Takes more screen space

---

## Recommended Solution

**Implement Option 1: Display Productive Capacity Everywhere**

### Changes Needed:

1. **Team Capacity Detail Panel** (`TeamDetailView.tsx`):
   - Calculate productive capacity from raw capacity
   - Apply 80% productivity factor
   - Deduct PI planning days for IP iteration
   - Display productive capacity values

2. **Add Clear Labels**:
   - Label as "Productive Capacity" or "Usable Capacity"
   - Add tooltip explaining the calculation
   - Show productivity factor in settings/info

3. **Optional: Add Raw Capacity as Secondary Info**:
   - Show raw capacity in a collapsed section or tooltip
   - Label clearly as "Raw Capacity (before productivity)"

---

## Implementation Notes

### Without Changing Calculation Logic:

The calculation logic in `dashboard_service.py` is **locked and correct**. The fix is purely in the **display layer**:

1. **Frontend Calculation** (Option A):
   ```typescript
   // In TeamDetailView.tsx
   const productiveCapacity = rawCapacity * 0.80;
   const ipProductiveCapacity = ipRawCapacity - (piPlanningDays * memberCount);
   ```

2. **Backend Response Enhancement** (Option B):
   ```python
   # Add productive_capacity field to API response
   # Without changing core calculation logic
   response['productive_capacity'] = calculate_productive_from_raw(raw_capacity)
   ```

3. **Use Train Dashboard Endpoint** (Option C):
   ```typescript
   // Call /dashboard/train-overview instead
   // Filter for specific team
   const teamData = trainOverview.teams.find(t => t.team_id === teamId);
   ```

---

## Testing Checklist

After implementing the fix:

- [ ] Train Capacity Dashboard shows same values as before
- [ ] Team Capacity Detail Panel shows productive capacity
- [ ] Both views show consistent numbers for same team/PI
- [ ] Labels clearly indicate "Productive Capacity"
- [ ] Tooltips explain the calculation
- [ ] No changes to underlying calculation logic
- [ ] API responses remain unchanged (or enhanced with additional field)

---

## Related Files

### Backend:
- `backend/app/services/dashboard_service.py` - Train capacity calculation (LOCKED)
- `backend/app/routes/dashboard.py` - Train dashboard endpoint
- `backend/app/routes/teams.py` - Team capacity detail endpoint

### Frontend:
- `frontend/src/pages/Dashboard/TrainCapacity/index.tsx` - Train dashboard
- `frontend/src/pages/Setup/TeamsTab/TeamDetailView.tsx` - Team detail panel
- `frontend/src/services/api.ts` - API service layer

---

## Next Steps

1. ✅ Document the issue (this file)
2. ⏳ Get approval on solution approach
3. ⏳ Implement display layer changes
4. ⏳ Add clear labels and tooltips
5. ⏳ Test with real data
6. ⏳ Update user documentation

---

*Issue documented: 2026-01-27*  
*Calculation logic: LOCKED - No changes allowed*  
*Fix scope: Display layer only*
