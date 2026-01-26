# PI Allocations UX Improvement - Requirements Document

## Agent Workflow
```
@QA → @Product-Manager → @UI-Designer → @Frontend-Architect → @Backend-Developer → @Frontend-Developer → @QA
```

---

## Issues Identified by @QA

### Issue 1: Iteration Productivity Not Deleting
**Problem:** When user deletes/clears iteration-level productivity values (e.g., changes "5" to empty), the value is not removed from the database.

**Current Behavior:**
- User clears productivity value in Iteration 4
- Clicks "Save Productivity"
- Value still shows "5" after refresh

**Expected Behavior:**
- Clearing a productivity value should delete the iteration productivity override
- Field should remain empty after save/refresh
- Member should fall back to PI-level or global productivity

**Impact:** High - Users cannot remove iteration overrides once set

---

### Issue 2: Poor User Experience - Too Many Clicks
**Problem:** Current flow requires too many clicks and has confusing multiple save buttons.

**Current Flow:**
1. User clicks "Edit" button for a member
2. Member details expand
3. User updates Leave/Training/Other → Click "Save Leave/Training" button
4. User updates Productivity % → Click "Save Productivity" button  
5. User updates PI-level fields (roles, specializations, etc.) → Click "Save Changes" button at bottom
6. User clicks "Close" button to collapse
7. Repeat for next member

**Problems:**
- 3 different save buttons (confusing)
- Multiple clicks required per member
- "Edit" and "Close" buttons add unnecessary steps
- Not clear which save button saves what
- Poor workflow efficiency

**Impact:** High - Poor user experience, confusing, time-consuming

---

## @Product-Manager: New UX Requirements

### Proposed New Flow

**Simplified Workflow:**
1. User clicks on any team member row (entire row is clickable)
2. Member details panel opens automatically (no "Edit" button needed)
3. User updates ANY fields:
   - PI-level: Productivity %, Team Roles, Transversal Role, Specializations, Component Hats, Notes
   - Iteration-level: Leave, Training, Other, Productivity %
   - IP Deduction
4. User clicks **ONE "Save All Changes"** button at bottom
5. All changes save in one operation
6. User can click another member row to edit next member (panel switches automatically)
7. No "Close" button needed - clicking outside or another member closes/switches

**Key Improvements:**
- ✅ Single save button for all changes
- ✅ No "Edit" button - click member to edit
- ✅ No "Close" button - click elsewhere to close
- ✅ Seamless switching between members
- ✅ Clear visual feedback on unsaved changes
- ✅ Reduced clicks: 7 clicks → 2 clicks per member

### User Stories

**As a Product Owner/Scrum Master, I want to:**
1. Quickly update multiple members' allocations without excessive clicking
2. See all editable fields for a member in one place
3. Save all my changes with one button click
4. Easily switch between team members without closing/reopening
5. Remove iteration productivity overrides when needed

**Acceptance Criteria:**
1. Clicking a member row opens their detail panel
2. All fields (PI-level and iteration-level) are editable in the panel
3. One "Save All Changes" button saves everything
4. Clearing iteration productivity removes the override
5. Clicking another member auto-saves current changes (with confirmation if unsaved)
6. Visual indicator shows which member is currently selected
7. Unsaved changes are clearly indicated

---

## @UI-Designer: Design Specifications

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ PI Allocations - Team Name                                  │
├─────────────────────────────────────────────────────────────┤
│ [Select PI: PI 2026.1 ▼]                                   │
│                                                             │
│ [Members: 6] [Avg Productivity: 58%] [Holidays: 3] [Days: 72] │
├─────────────────────────────────────────────────────────────┤
│ Member List (Left Side - 40%)                              │
│ ┌───────────────────────────────┐                          │
│ │ ☑ Aditya        [PO][PO]  45% │ ← Selected (highlighted) │
│ │ □ Mateusz       [DEV]     80% │                          │
│ │ □ Usha          [QA]      40% │                          │
│ │ □ Yuli          [DEV]     80% │                          │
│ │ □ Ethan         [DEV]     40% │                          │
│ │ □ Alex          [PO]      20% │                          │
│ └───────────────────────────────┘                          │
│                                                             │
│ Member Details Panel (Right Side - 60%)                    │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 👤 Aditya - Product Owner                              ││
│ │                                                         ││
│ │ PI-Level Settings                                       ││
│ │ ├─ Productivity %: [50] %                              ││
│ │ ├─ Team Roles: ☑ SM ☑ PO                              ││
│ │ ├─ Transversal Role: [Select ▼]                       ││
│ │ ├─ Specializations: [Android, Backend]                ││
│ │ ├─ Component Hats: [FM Departure Plan]                ││
│ │ └─ Notes: [Shared with other team]                    ││
│ │                                                         ││
│ │ Iteration Capacity Deductions                          ││
│ │ ┌─────────────────────────────────────────────────────┐││
│ │ │        Iter1  Iter2  Iter3  Iter4   IP             │││
│ │ │ Leave   [0]   [0]    [2]    [0]    [3]            │││
│ │ │ Train   [0]   [0]    [0]    [0]    [0]            │││
│ │ │ Other   [0]   [0]    [0]    [0]    [0]            │││
│ │ │ Prod%   [50]  [50]   [50]   [  ]   -              │││
│ │ │ IP Ded  -     -      -      -      [5.0]          │││
│ │ └─────────────────────────────────────────────────────┘││
│ │                                                         ││
│ │ ⚠️ Unsaved changes                                     ││
│ │                                                         ││
│ │              [💾 Save All Changes]                     ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Visual Design Elements

**Member List (Left Panel):**
- Each member row is a clickable card
- Selected member: Blue background, bold text
- Unselected: White background, normal text
- Hover: Light gray background
- Shows: Name, Role badges, Effective productivity %
- No "Edit" button - entire row is clickable

**Member Details Panel (Right Panel):**
- Fixed position, always visible when member selected
- Sections clearly separated with headers
- All fields inline-editable
- Unsaved changes indicator at bottom
- Single prominent "Save All Changes" button
- Auto-scrolls to show all content

**Unsaved Changes Indicator:**
- Yellow warning banner: "⚠️ Unsaved changes"
- Appears when any field is modified
- Disappears after successful save

**Save Button:**
- Primary blue button
- Full width or centered
- Icon: 💾 Save All Changes
- Disabled when no changes
- Loading state during save

---

## @Frontend-Architect: Technical Architecture

### Component Structure

**Current:**
```
PIAllocationsPanel
├─ Table (with expandable rows)
└─ Each row expands to show edit form
```

**New:**
```
PIAllocationsPanel
├─ MemberList (Left Panel)
│  └─ MemberListItem[] (clickable cards)
└─ MemberDetailPanel (Right Panel)
   ├─ PILevelSettings
   ├─ IterationDeductions
   └─ SaveButton
```

### State Management

```typescript
// Single state object for all changes
interface MemberChanges {
  // PI-level
  productivity_percent?: number | null;
  is_scrum_master?: boolean;
  is_product_owner?: boolean;
  transversal_role?: string | null;
  specializations?: string[];
  component_hat_ids?: string[];
  notes?: string | null;
  ip_week_deduction?: number;
  
  // Iteration-level
  leaves?: Record<string, number>; // iterationId -> days
  training?: Record<string, number>;
  other?: Record<string, number>;
  productivity?: Record<string, number | null>; // null = delete
}

const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
const [memberChanges, setMemberChanges] = useState<Record<string, MemberChanges>>({});
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
```

### Save Logic

**Single Save Operation:**
1. Collect all changes for selected member
2. Save PI allocation (if changed)
3. Save/update/delete iteration leaves (if changed)
4. Save/update/delete iteration productivity (if changed)
5. Show success message
6. Reload data
7. Clear unsaved changes flag

**Delete Iteration Productivity:**
- If user clears productivity field (sets to null/empty)
- Send DELETE request or update with null value
- Backend removes the override record

---

## @Backend-Developer: Backend Requirements

### Issue 1 Fix: Iteration Productivity Deletion

**Current Problem:**
- Clearing productivity value doesn't delete the record
- Backend doesn't handle null/empty values properly

**Required Changes:**

1. **Update API endpoint to accept null:**
```python
# Allow null to indicate deletion
productivity_percent: Optional[int] = None  # null = delete override
```

2. **Update service logic:**
```python
if productivity_percent is None:
    # Delete existing override
    db.query(MemberIterationProductivity).filter(
        MemberIterationProductivity.member_id == member_id,
        MemberIterationProductivity.iteration_id == iteration_id
    ).delete()
else:
    # Create or update
    # ... existing logic
```

### New Endpoint: Bulk Save All Changes

**Endpoint:** `POST /api/teams/{team_id}/pi/{pi_id}/members/{member_id}/bulk-save`

**Request Body:**
```json
{
  "pi_allocation": {
    "productivity_percent": 50,
    "is_scrum_master": false,
    "is_product_owner": true,
    "transversal_role": null,
    "specializations": ["Android", "Backend"],
    "component_hat_ids": ["uuid-1"],
    "notes": "Shared with team",
    "ip_week_deduction": 5.0
  },
  "iteration_leaves": [
    {"iteration_id": "uuid", "leave_days": 2, "leave_type": "vacation"},
    {"iteration_id": "uuid", "leave_days": 0, "leave_type": "training"}
  ],
  "iteration_productivity": [
    {"iteration_id": "uuid", "productivity_percent": 50},
    {"iteration_id": "uuid", "productivity_percent": null}  // Delete this one
  ]
}
```

**Response:** Updated member allocation with all data

---

## @Frontend-Developer: Implementation Tasks

### Task 1: Fix Iteration Productivity Deletion
- [ ] Update productivity save logic to send null for empty values
- [ ] Handle DELETE or null update in API call
- [ ] Clear field after successful deletion
- [ ] Test: Set productivity → Save → Clear → Save → Verify deleted

### Task 2: Implement New UX Layout
- [ ] Create MemberList component (left panel)
- [ ] Create MemberDetailPanel component (right panel)
- [ ] Implement split-panel layout (40/60)
- [ ] Make member rows clickable
- [ ] Add selected state styling
- [ ] Remove Edit/Close buttons

### Task 3: Unified State Management
- [ ] Create single memberChanges state object
- [ ] Track all field changes in one place
- [ ] Implement hasUnsavedChanges flag
- [ ] Add unsaved changes indicator

### Task 4: Single Save Button
- [ ] Remove individual save buttons
- [ ] Add single "Save All Changes" button
- [ ] Implement bulk save logic
- [ ] Handle all field types in one operation
- [ ] Show loading state during save
- [ ] Clear changes after successful save

### Task 5: Member Switching
- [ ] Detect when user clicks different member
- [ ] Prompt if unsaved changes exist
- [ ] Auto-switch to new member
- [ ] Load new member's data into panel

---

## @QA: Test Plan

### Test Case 1: Iteration Productivity Deletion
1. Open PI Allocations for a team
2. Select a member
3. Set iteration productivity to a value (e.g., 50%)
4. Save
5. Verify value persists after refresh
6. Clear the productivity value (delete text)
7. Save
8. Refresh page
9. **Expected:** Field should be empty, member uses PI/global productivity

### Test Case 2: New UX Flow
1. Open PI Allocations
2. Click on a member row (no Edit button)
3. **Expected:** Detail panel opens on right
4. Update multiple fields (productivity, leave, notes, etc.)
5. **Expected:** "Unsaved changes" indicator appears
6. Click "Save All Changes" button
7. **Expected:** All changes save, indicator disappears
8. Click another member row
9. **Expected:** Panel switches to new member
10. Verify all previous changes persisted

### Test Case 3: Unsaved Changes Warning
1. Select a member
2. Make changes
3. Click another member without saving
4. **Expected:** Warning prompt appears
5. Choose "Save" → changes save, switch to new member
6. Choose "Discard" → changes lost, switch to new member
7. Choose "Cancel" → stay on current member

---

## Success Metrics

**Before:**
- Average clicks per member: 7 (Edit → Update → Save Leave → Save Prod → Save Changes → Close)
- User confusion: High (3 save buttons)
- Time per member: ~30 seconds

**After:**
- Average clicks per member: 2 (Click member → Save All)
- User confusion: Low (1 save button)
- Time per member: ~15 seconds
- **50% reduction in clicks**
- **50% faster workflow**

---

*Document created: January 26, 2026*
*Agent Workflow: @QA → @Product-Manager → @UI-Designer → @Frontend-Architect → @Backend-Developer → @Frontend-Developer → @QA*
