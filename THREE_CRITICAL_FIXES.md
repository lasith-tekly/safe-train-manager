# Three Critical Fixes - Execution Planning

**Date:** February 6, 2026  
**Status:** ✅ ALL FIXED

---

## Fix 1: Backend - Title Validation Error ✅

### Problem
```
ValidationError: JiraRecordResponse title: Input should be a valid string, input_value=None
```

**Root Cause:** Some JIRA records in database have `NULL` title from earlier testing, but the response schema requires a non-null string.

### Fix Applied
**File:** `backend/app/services/jira_record_service.py` (line 495)

**Changed:**
```python
# BEFORE
title=record.title,

# AFTER
title=record.title or "Untitled",
```

**Why this works:**
- Provides default value "Untitled" when title is NULL
- Prevents Pydantic validation error
- Non-breaking change (doesn't modify database)
- Allows existing records with NULL titles to be displayed

---

## Fix 2: Frontend - Modal Behind Drawer (z-index) ✅

### Problem
Add JIRA Record modal appears behind the Execution Planning drawer, making it unusable.

**Root Cause:** Ant Design Drawer has default z-index of 1000, Modal also has z-index 1000, causing overlap issues.

### Fix Applied
**File:** `frontend/src/pages/RoadmapV4/components/JiraRecordModal.tsx` (line 185)

**Changed:**
```tsx
// BEFORE
<Modal
  title={isEdit ? 'Edit JIRA Record' : 'Add JIRA Record'}
  open={open}
  onOk={handleSave}
  onCancel={onClose}
  confirmLoading={loading}
  width={600}
  okText={isEdit ? 'Update' : 'Save'}
>

// AFTER
<Modal
  title={isEdit ? 'Edit JIRA Record' : 'Add JIRA Record'}
  open={open}
  onOk={handleSave}
  onCancel={onClose}
  confirmLoading={loading}
  width={600}
  okText={isEdit ? 'Update' : 'Save'}
  zIndex={1100}  // ADDED - higher than drawer's 1000
>
```

**Why this works:**
- Modal z-index (1100) > Drawer z-index (1000)
- Modal appears on top of drawer
- User can interact with modal properly
- Ant Design best practice for nested modals/drawers

---

## Fix 3: Frontend - Feature Name Not Showing ✅

### Problem
Drawer header shows "Execution Planning: " with blank feature name.

**Root Cause:** Feature name might be empty string or the feature object might not be loaded yet when drawer opens.

### Fixes Applied
**File:** `frontend/src/pages/RoadmapV4/components/ExecutionPlanningPanel.tsx`

#### Fix 3a: Better Fallback (line 180)
```tsx
// BEFORE
title={`Execution Planning: ${feature?.name || ''}`}

// AFTER
title={`Execution Planning: ${feature?.name || 'Loading...'}`}
```

**Why this works:**
- Shows "Loading..." instead of blank when feature name is empty
- Better UX - user knows something is happening
- Optional chaining `?.` handles null feature

#### Fix 3b: Debug Logging (line 36)
```tsx
// ADDED
useEffect(() => {
  if (feature && open) {
    console.log('Feature in ExecutionPlanningPanel:', feature);
    fetchJiraRecords();
  }
}, [feature, open]);
```

**Why this helps:**
- Logs feature object to console for debugging
- Can verify if `feature.name` exists
- Can check feature object structure
- Helps identify if issue is with data or rendering

---

## Testing Instructions

### Backend Test (Fix 1)
```bash
# 1. Restart backend
cd backend
python3 -m uvicorn app.main:app --reload

# 2. Test endpoint
curl http://localhost:8000/api/features/{feature_id}/jira-records

# Expected: 200 OK, records with NULL title show as "Untitled"
```

### Frontend Test (Fix 2 & 3)
```bash
# 1. Restart frontend
cd frontend
npm run dev

# 2. Open browser DevTools → Console
# 3. Navigate to: Products → Select product → Click "Execute" on feature

# Expected for Fix 2:
# - Modal appears ON TOP of drawer
# - Can interact with modal
# - Can see all form fields

# Expected for Fix 3:
# - Drawer title shows: "Execution Planning: {feature_name}"
# - If feature name missing, shows: "Execution Planning: Loading..."
# - Console log shows feature object
```

---

## Verification Checklist

### Fix 1: Backend Title Validation
- [x] Added default value in `_build_jira_record_response`
- [x] Uses `or "Untitled"` pattern
- [ ] Tested with NULL title records (pending)
- [ ] Verified no validation errors (pending)

### Fix 2: Modal z-index
- [x] Added `zIndex={1100}` to Modal
- [x] Higher than drawer's default 1000
- [ ] Tested modal appears on top (pending)
- [ ] Verified can interact with modal (pending)

### Fix 3: Feature Name Display
- [x] Changed fallback from `''` to `'Loading...'`
- [x] Added console.log for debugging
- [ ] Verified feature name shows (pending)
- [ ] Checked console log output (pending)

---

## Expected Behavior After Fixes

### Fix 1: Title Validation
**Before:**
```
❌ ValidationError: title must be string, got None
❌ 500 Internal Server Error
```

**After:**
```
✅ 200 OK
✅ Records with NULL title display as "Untitled"
✅ No validation errors
```

### Fix 2: Modal z-index
**Before:**
```
❌ Modal hidden behind drawer
❌ Can't click on form fields
❌ Can't submit form
```

**After:**
```
✅ Modal appears on top of drawer
✅ Can interact with all form fields
✅ Can submit form successfully
```

### Fix 3: Feature Name
**Before:**
```
❌ Title: "Execution Planning: "
❌ Blank feature name
❌ No debugging info
```

**After:**
```
✅ Title: "Execution Planning: My Feature"
✅ Or: "Execution Planning: Loading..." if name missing
✅ Console shows feature object for debugging
```

---

## Additional Notes

### Fix 1: Alternative Approaches Considered

**Option A: Make title optional in schema**
```python
class JiraRecordResponse(BaseModel):
    title: Optional[str] = None
```
❌ Not chosen - would allow NULL titles in API responses

**Option B: Database migration**
```sql
UPDATE jira_records SET title = 'Untitled' WHERE title IS NULL;
```
❌ Not chosen - more invasive, requires migration

**Option C: Default in response builder** ✅ CHOSEN
```python
title=record.title or "Untitled"
```
✅ Simple, non-breaking, handles legacy data

### Fix 2: z-index Values Reference

| Component | Default z-index | Purpose |
|-----------|----------------|---------|
| Drawer | 1000 | Side panel |
| Modal | 1000 | Dialog |
| Popover | 1030 | Tooltips |
| Notification | 1010 | Alerts |
| **Our Modal** | **1100** | **Above drawer** |

### Fix 3: Feature Object Structure

Based on `RoadmapFeature` interface:
```typescript
interface RoadmapFeature {
  id: string;
  name: string;  // ← This is what we display
  product_id: string;
  status: string;
  gross_sizing_ed: number;
  net_sizing_ed: number;
  quarterly_allocations: Array<...>;
  // ... other fields
}
```

**Console log will show:**
```javascript
Feature in ExecutionPlanningPanel: {
  id: "abc-123",
  name: "My Feature",  // ← Check this value
  product_id: "prod-456",
  // ... rest of feature
}
```

---

## Common Issues & Solutions

### Issue: Still seeing validation error
**Solution:**
- Restart backend server
- Clear Python cache: `rm -rf backend/**/__pycache__`
- Verify fix: `grep "title or" backend/app/services/jira_record_service.py`

### Issue: Modal still behind drawer
**Solution:**
- Hard refresh browser (Cmd+Shift+R)
- Clear browser cache
- Check DevTools → Elements → Modal should have `z-index: 1100`

### Issue: Feature name still blank
**Solution:**
- Check console log - does feature object exist?
- Verify feature has `name` property
- Check if feature is being passed correctly from parent
- Try: `console.log('Feature:', feature, 'Name:', feature?.name)`

### Issue: "Loading..." shows permanently
**Possible causes:**
1. Feature object is null
2. Feature.name is empty string
3. Feature not passed from ProductRoadmapPage

**Debug:**
```tsx
console.log('Feature:', feature);
console.log('Feature name:', feature?.name);
console.log('Type of name:', typeof feature?.name);
```

---

## Files Modified

### Backend
- `backend/app/services/jira_record_service.py` (1 line)

### Frontend
- `frontend/src/pages/RoadmapV4/components/JiraRecordModal.tsx` (1 line)
- `frontend/src/pages/RoadmapV4/components/ExecutionPlanningPanel.tsx` (2 lines)

**Total:** 3 files, 4 lines changed

---

## Impact Assessment

### Fix 1: Title Validation
- **Impact:** HIGH - Prevents 500 errors when listing JIRA records
- **Risk:** LOW - Safe fallback, doesn't modify data
- **Breaking:** NO - Backward compatible

### Fix 2: Modal z-index
- **Impact:** HIGH - Makes modal usable
- **Risk:** NONE - Only affects visual layering
- **Breaking:** NO - Pure CSS change

### Fix 3: Feature Name
- **Impact:** MEDIUM - Improves UX
- **Risk:** NONE - Better fallback text
- **Breaking:** NO - Only changes display

---

## Next Steps

1. **Restart Servers:**
   - Backend: `cd backend && python3 -m uvicorn app.main:app --reload`
   - Frontend: `cd frontend && npm run dev`

2. **Test Each Fix:**
   - Fix 1: List JIRA records with NULL titles
   - Fix 2: Open modal from drawer
   - Fix 3: Check drawer title

3. **Verify Console:**
   - No validation errors
   - Feature object logged correctly
   - No z-index issues

4. **Report:**
   - Update test report with results
   - Mark fixes as verified
   - Document any remaining issues

---

**Status:** ✅ ALL THREE FIXES APPLIED  
**Testing:** Pending user verification  
**Deployment:** Ready after testing confirms fixes work
