# Two Remaining Fixes - Execution Planning

**Date:** February 6, 2026  
**Status:** ✅ BOTH FIXED

---

## Fix 1: Backend - PI Serialization Error ✅

### Problem
```
ValidationError: 'pi': 'Input should be a valid dictionary', 'input': <PI PI 2026.1 (2026)>
```

**Root Cause:** The service was passing SQLAlchemy PI and Team objects directly to the Pydantic response schema, but the schema expects:
- `pi`: dict (not SQLAlchemy object)
- `team`: TeamSummary schema (not SQLAlchemy object)

Additionally, the service was passing fields like `pi_name`, `feature_name`, `team_name`, and `spillover_from_pi_name` that don't exist in the schema.

### Fix Applied
**File:** `backend/app/services/jira_record_service.py` (lines 490-515)

**Changed:**
```python
# BEFORE
def _build_jira_record_response(self, record: JiraRecord) -> JiraRecordResponse:
    return JiraRecordResponse(
        id=record.id,
        jira_key=record.jira_key,
        title=record.title or "Untitled",
        description=record.description,
        feature_id=record.feature_id,
        feature_name=record.feature.name if record.feature else None,  # ❌ Field doesn't exist
        team_id=record.team_id,
        team_name=record.team.name if record.team else None,  # ❌ Field doesn't exist
        pi_id=record.pi_id,
        pi_name=record.pi.name if record.pi else None,  # ❌ Field doesn't exist
        planned_effort=record.planned_effort,
        actual_effort=record.actual_effort,
        status=record.status,
        spillover_from_pi_id=record.spillover_from_pi_id,
        spillover_from_pi_name=record.spillover_from_pi.name if record.spillover_from_pi else None,  # ❌ Field doesn't exist
        spillover_reason=record.spillover_reason,
        created_at=record.created_at,
        updated_at=record.updated_at
    )

# AFTER
def _build_jira_record_response(self, record: JiraRecord) -> JiraRecordResponse:
    from app.schemas.jira import TeamSummary
    
    return JiraRecordResponse(
        id=record.id,
        jira_key=record.jira_key,
        title=record.title or "Untitled",
        description=record.description,
        feature_id=record.feature_id,
        team_id=record.team_id,
        team=TeamSummary(  # ✅ Convert to TeamSummary schema
            id=record.team.id,
            name=record.team.name,
            short_code=getattr(record.team, 'short_code', None)
        ) if record.team else None,
        pi_id=record.pi_id,
        pi={"id": str(record.pi.id), "name": record.pi.name} if record.pi else None,  # ✅ Convert to dict
        planned_effort=record.planned_effort or 0,
        actual_effort=record.actual_effort,
        status=record.status or "PLANNED",
        spillover_from_pi_id=record.spillover_from_pi_id,
        spillover_reason=record.spillover_reason,
        created_at=record.created_at,
        updated_at=record.updated_at
    )
```

**Key Changes:**
1. ✅ Removed non-existent fields: `feature_name`, `team_name`, `pi_name`, `spillover_from_pi_name`
2. ✅ Convert `team` to `TeamSummary` schema object
3. ✅ Convert `pi` to dict: `{"id": str(record.pi.id), "name": record.pi.name}`
4. ✅ Added default values: `planned_effort or 0`, `status or "PLANNED"`
5. ✅ Removed `spillover_from_pi_name` (not in schema)

**Why this works:**
- Pydantic can serialize TeamSummary schema objects
- Dict is JSON-serializable (no SQLAlchemy object issues)
- All fields match the JiraRecordResponse schema exactly
- No extra fields that would cause validation errors

---

## Fix 2: Frontend - Drawer Header Hidden Behind Navbar ✅

### Problem
Drawer opens but its header is hidden behind the fixed top navigation bar.

**Root Cause:** The application has a fixed navbar at the top (typically 64px height), and the Ant Design Drawer by default renders from top:0, causing the drawer header to be obscured by the navbar.

### Fix Applied
**File:** `frontend/src/pages/RoadmapV4/components/ExecutionPlanningPanel.tsx` (line 186)

**Changed:**
```tsx
// BEFORE
<Drawer
  title={`Execution Planning: ${feature?.name || 'Loading...'}`}
  placement="right"
  width={700}
  open={open}
  onClose={onClose}
  destroyOnClose
>

// AFTER
<Drawer
  title={`Execution Planning: ${feature?.name || 'Loading...'}`}
  placement="right"
  width={700}
  open={open}
  onClose={onClose}
  destroyOnClose
  rootStyle={{ top: 64, height: 'calc(100% - 64px)' }}  // ✅ ADDED
>
```

**Why this works:**
- `top: 64` offsets drawer from top by navbar height (64px)
- `height: calc(100% - 64px)` ensures drawer fills remaining viewport height
- Drawer header now visible below navbar
- Drawer content properly scrollable within available space

---

## Testing Instructions

### Backend Test (Fix 1)
```bash
# 1. Restart backend
cd backend
python3 -m uvicorn app.main:app --reload

# 2. Test endpoint
curl http://localhost:8000/api/features/{feature_id}/jira-records

# Expected Response:
{
  "data": [
    {
      "id": "...",
      "title": "My JIRA Record",
      "team": {                    // ✅ TeamSummary object
        "id": "...",
        "name": "Team A",
        "short_code": "TA"
      },
      "pi": {                      // ✅ Dict, not SQLAlchemy object
        "id": "...",
        "name": "PI 2026.1"
      },
      "planned_effort": 10.0,
      "status": "PLANNED",
      // ... other fields
    }
  ],
  "total": 1
}

# Should NOT see:
# ❌ ValidationError about 'pi' input
# ❌ Fields like 'pi_name', 'team_name', 'feature_name'
```

### Frontend Test (Fix 2)
```bash
# 1. Restart frontend
cd frontend
npm run dev

# 2. Test in browser
# - Navigate to: Products → Select product → Click "Execute" on feature
# - Drawer should open from right side

# Expected:
# ✅ Drawer header fully visible (not hidden behind navbar)
# ✅ Title shows: "Execution Planning: {feature_name}"
# ✅ Close button (X) visible in header
# ✅ Drawer content scrollable
# ✅ Drawer positioned correctly below navbar

# Should NOT see:
# ❌ Drawer header hidden behind navbar
# ❌ Close button not clickable
# ❌ Title cut off at top
```

---

## Verification Checklist

### Fix 1: PI Serialization
- [x] Removed non-existent fields from response
- [x] Convert team to TeamSummary schema
- [x] Convert pi to dict with id and name
- [x] Added default values for planned_effort and status
- [x] Removed spillover_from_pi_name field
- [ ] Tested endpoint returns 200 OK (pending)
- [ ] Verified response structure matches schema (pending)
- [ ] Confirmed no validation errors (pending)

### Fix 2: Drawer Positioning
- [x] Added rootStyle with top offset
- [x] Set height to calc(100% - 64px)
- [x] Offset matches navbar height (64px)
- [ ] Tested drawer header visible (pending)
- [ ] Verified close button clickable (pending)
- [ ] Confirmed content scrollable (pending)

---

## Expected Behavior After Fixes

### Fix 1: PI Serialization
**Before:**
```
❌ ValidationError: 'pi': 'Input should be a valid dictionary'
❌ 500 Internal Server Error
❌ Response includes non-existent fields
```

**After:**
```
✅ 200 OK
✅ Response structure matches schema exactly
✅ pi is dict: {"id": "...", "name": "PI 2026.1"}
✅ team is TeamSummary: {"id": "...", "name": "Team A", "short_code": "TA"}
✅ No validation errors
```

### Fix 2: Drawer Positioning
**Before:**
```
❌ Drawer header hidden behind navbar
❌ Title not visible
❌ Close button not accessible
❌ Poor UX
```

**After:**
```
✅ Drawer header fully visible
✅ Title clearly readable
✅ Close button accessible
✅ Professional appearance
✅ Proper spacing from navbar
```

---

## Schema Reference

### JiraRecordResponse Schema
```python
class JiraRecordResponse(BaseModel):
    id: str
    feature_id: str
    jira_key: Optional[str] = None
    
    # New PI-based fields
    title: Optional[str] = None
    description: Optional[str] = None
    pi_id: Optional[str] = None
    pi: Optional[dict] = None              # ← Must be dict, not SQLAlchemy object
    planned_effort: float = 0
    actual_effort: Optional[float] = None
    spillover_from_pi_id: Optional[str] = None
    spillover_reason: Optional[str] = None
    
    # Common fields
    team_id: Optional[str] = None
    team: Optional[TeamSummary] = None     # ← Must be TeamSummary, not SQLAlchemy object
    status: str = "PLANNED"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
```

### TeamSummary Schema
```python
class TeamSummary(BaseModel):
    id: str
    name: str
    short_code: Optional[str] = None
    
    class Config:
        from_attributes = True
```

---

## Common Issues & Solutions

### Issue: Still seeing PI serialization error
**Solution:**
- Restart backend server
- Clear Python cache: `rm -rf backend/**/__pycache__`
- Verify fix: `grep "pi={" backend/app/services/jira_record_service.py`
- Check response in browser DevTools → Network tab

### Issue: Drawer header still hidden
**Solution:**
- Hard refresh browser (Cmd+Shift+R)
- Check navbar height - might not be 64px
- Inspect drawer in DevTools → check `top` and `height` CSS
- Try different offset: `rootStyle={{ top: 56, height: 'calc(100% - 56px)' }}`

### Issue: Response includes extra fields
**Possible cause:** Old code still running, cache not cleared

**Solution:**
```bash
# Backend
cd backend
find . -type d -name __pycache__ -exec rm -rf {} +
python3 -m uvicorn app.main:app --reload

# Frontend
cd frontend
rm -rf node_modules/.vite
npm run dev
```

### Issue: Drawer content not scrollable
**Possible cause:** Height calculation incorrect

**Solution:**
- Check navbar actual height in DevTools
- Adjust offset accordingly
- Ensure drawer body has proper overflow settings

---

## Technical Details

### Fix 1: Serialization Pattern

**SQLAlchemy to Pydantic Conversion:**
```python
# Pattern 1: Simple dict
pi={"id": str(record.pi.id), "name": record.pi.name} if record.pi else None

# Pattern 2: Pydantic schema
team=TeamSummary(
    id=record.team.id,
    name=record.team.name,
    short_code=getattr(record.team, 'short_code', None)
) if record.team else None

# Pattern 3: Using from_attributes (if schema has Config.from_attributes = True)
team=TeamSummary.from_orm(record.team) if record.team else None
```

**Why dict for PI but schema for Team?**
- Schema defines `pi: Optional[dict]` - expects plain dict
- Schema defines `team: Optional[TeamSummary]` - expects schema object
- Both are valid Pydantic patterns

### Fix 2: CSS Positioning

**Drawer Positioning Options:**

**Option A: rootStyle (CHOSEN)**
```tsx
rootStyle={{ top: 64, height: 'calc(100% - 64px)' }}
```
✅ Simple, direct
✅ Works with Ant Design 5.x
✅ Doesn't affect other drawers

**Option B: style**
```tsx
style={{ top: 64 }}
```
❌ Doesn't adjust height
❌ May cause overflow issues

**Option C: getContainer**
```tsx
getContainer={() => document.getElementById('app-content')}
```
❌ More complex
❌ Requires container element
❌ May affect z-index

---

## Files Modified

### Backend
- `backend/app/services/jira_record_service.py` (lines 490-515)
  - Removed non-existent fields
  - Fixed team serialization
  - Fixed pi serialization

### Frontend
- `frontend/src/pages/RoadmapV4/components/ExecutionPlanningPanel.tsx` (line 186)
  - Added rootStyle for drawer positioning

**Total:** 2 files modified

---

## Impact Assessment

### Fix 1: PI Serialization
- **Impact:** CRITICAL - Prevents 500 errors when loading JIRA records
- **Risk:** LOW - Matches schema exactly
- **Breaking:** NO - Only fixes serialization
- **Performance:** NONE - Same data, different format

### Fix 2: Drawer Positioning
- **Impact:** HIGH - Makes drawer usable
- **Risk:** NONE - Pure CSS positioning
- **Breaking:** NO - Only affects visual layout
- **Performance:** NONE - CSS only

---

## Next Steps

1. **Restart Servers:**
   ```bash
   # Backend
   cd backend && python3 -m uvicorn app.main:app --reload
   
   # Frontend
   cd frontend && npm run dev
   ```

2. **Test Backend Fix:**
   - Open browser DevTools → Network tab
   - Navigate to Execution Planning
   - Check API response structure
   - Verify no validation errors

3. **Test Frontend Fix:**
   - Open Execution Planning drawer
   - Verify header visible
   - Check close button works
   - Test scrolling

4. **Verify:**
   - No console errors
   - No 500 errors
   - Drawer properly positioned
   - All fields display correctly

---

**Status:** ✅ BOTH FIXES APPLIED  
**Testing:** Pending user verification  
**Deployment:** Ready after testing confirms fixes work
