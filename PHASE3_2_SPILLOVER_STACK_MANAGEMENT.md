# Phase 3.2 - Spillover Stack Management UI

**Date:** February 10, 2026  
**Feature:** Spillover History Stack Management  
**Status:** ✅ **FRONTEND COMPLETE - BACKEND PENDING**

---

## Executive Summary

Implemented a comprehensive spillover stack management UI that treats spillovers as a stack data structure. Only the latest (top of stack) spillover can be edited or deleted, with older spillovers locked until newer ones are removed.

**Key Features:**
- ✅ Visual stack representation with latest spillover highlighted
- ✅ Lock/unlock mechanism - only latest is editable
- ✅ Delete latest spillover to revert to previous state
- ✅ Clear visual indicators (Current, Locked tags)
- ✅ Confirmation dialogs with context-aware messaging

---

## Implementation Summary

### Files Created

1. **`frontend/src/pages/RoadmapV4/components/SpilloverHistoryManager.tsx`** ✅
   - Complete stack management component
   - 220+ lines of code
   - Handles display, editing, and deletion

### Files Modified

2. **`frontend/src/services/jiraRecordApi.ts`** ✅
   - Added `deleteSpilloverEvent()` method
   - Added `updateSpilloverEvent()` method
   - Uses existing `getSpilloverHistory()` method

---

## Component: SpilloverHistoryManager

### Props Interface

```typescript
interface Props {
  recordId: string;              // JIRA record ID
  spilloverCount: number;        // Total spillover count
  onUpdate: () => void;          // Callback after changes
  onEditSpillover: (event: SpilloverHistoryItem) => void;  // Edit handler
}
```

### Features

#### 1. Stack Visualization

**Latest Spillover (Top of Stack):**
- Blue left border (4px)
- "Current" tag (green)
- Full opacity
- Edit and Delete buttons enabled

**Older Spillovers (Locked):**
- Gray left border (4px)
- "Locked" tag with lock icon
- 70% opacity
- Lock icon button (disabled)

#### 2. Event Display

Each spillover event shows:
- **Sequence Number:** "Spillover #1", "#2", "#3"
- **PI Transition:** "PI 2026.1 → PI 2026.2"
- **Effort Split:** "Spilled: 5.0 eD | Completed: 5.0 eD"
- **Category:** Color-coded tag
- **Reason:** Full text description
- **Timestamp:** Formatted date/time

#### 3. Actions

**Latest Spillover:**
- ✏️ **Edit Button** - Opens edit modal
- 🗑️ **Delete Button** - Shows confirmation, then deletes

**Locked Spillovers:**
- 🔒 **Lock Icon** - Disabled button with tooltip

#### 4. Info Alert

Shows at top:
```
ℹ️ Stack Management
Only the latest spillover can be edited or deleted. 
Delete newer spillovers to unlock older ones.
```

---

## API Methods

### 1. Get Spillover History

```typescript
getSpilloverHistory: async (recordId: string): Promise<SpilloverHistoryItem[]>
```

**Endpoint:** `GET /api/jira-records/{recordId}/spillover-history`

**Response:**
```typescript
[
  {
    id: "event-id-3",
    sequence: 3,
    from_pi_id: "pi-2",
    from_pi_name: "PI 2026.2",
    to_pi_id: "pi-3",
    to_pi_name: "PI 2026.3",
    spillover_effort: 4.0,
    completed_effort: 2.0,
    reason: "Continued delays...",
    category: "dependencies",
    created_at: "2026-02-10T13:00:00"
  },
  // ... more events
]
```

### 2. Delete Spillover Event

```typescript
deleteSpilloverEvent: async (recordId: string, eventId: string): Promise<any>
```

**Endpoint:** `DELETE /api/jira-records/{recordId}/spillover-history/{eventId}`

**What it does:**
- Validates event is the latest one
- Reverts record to previous PI
- Decrements spillover_count
- If count reaches 0, clears spillover status
- Deletes the event from history
- Creates SPILLOVER_DELETED history entry

### 3. Update Spillover Event

```typescript
updateSpilloverEvent: async (recordId: string, eventId: string, data: any): Promise<any>
```

**Endpoint:** `PUT /api/jira-records/{recordId}/spillover-history/{eventId}`

**What it does:**
- Updates spillover event details
- Only allows editing latest event
- Creates SPILLOVER_EDIT history entry

---

## User Experience Flow

### Viewing Spillover History

1. User opens Edit modal on spillover record
2. Clicks "Spillover History" tab (or section)
3. Sees SpilloverHistoryManager component

**Display:**
```
Spillover History (3 events)                    ×3

ℹ️ Stack Management
Only the latest spillover can be edited or deleted...

┌─────────────────────────────────────────────┐
│ Spillover #3  [Current]                     │ ← Blue border
│ PI 2026.2 → PI 2026.3                       │
│ Spilled: 4.0 eD | Completed: 2.0 eD        │
│ [dependencies]                              │
│ "Continued delays in API integration"       │
│ Feb 10, 2026, 1:00 PM                       │
│                                    [✏️] [🗑️] │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Spillover #2  [Locked 🔒]                   │ ← Gray border, faded
│ PI 2026.1 → PI 2026.2                       │
│ Spilled: 5.0 eD | Completed: 5.0 eD        │
│ [dependencies]                              │
│ "Waiting for external dependencies"         │
│ Jan 15, 2026, 10:00 AM                      │
│                                        [🔒] │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Spillover #1  [Locked 🔒]                   │ ← Gray border, faded
│ PI 2025.4 → PI 2026.1                       │
│ Spilled: 10.0 eD | Completed: 0.0 eD       │
│ [resource_constraints]                      │
│ "Initial spillover due to resource..."      │
│ Dec 1, 2025, 3:45 PM                        │
│                                        [🔒] │
└─────────────────────────────────────────────┘
```

### Deleting Latest Spillover

1. User clicks Delete (🗑️) button on Spillover #3
2. Confirmation dialog appears:

```
┌─────────────────────────────────────┐
│ Delete this spillover?              │
├─────────────────────────────────────┤
│ This will move the record back to   │
│ PI 2026.2.                          │
│                                     │
│         [Cancel]  [Yes, Delete]     │
└─────────────────────────────────────┘
```

3. User confirms
4. Success message: "Spillover reverted successfully"
5. Component refreshes
6. Now shows:

```
Spillover History (2 events)                    ×2

┌─────────────────────────────────────────────┐
│ Spillover #2  [Current]                     │ ← Now unlocked!
│ PI 2026.1 → PI 2026.2                       │
│                                    [✏️] [🗑️] │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Spillover #1  [Locked 🔒]                   │
│                                        [🔒] │
└─────────────────────────────────────────────┘
```

### Deleting Last Spillover

When deleting the only remaining spillover:

```
┌─────────────────────────────────────┐
│ Delete this spillover?              │
├─────────────────────────────────────┤
│ This will move the record back to   │
│ PI 2025.4.                          │
│                                     │
│ ⚠️ This is the only spillover.      │
│ The record will no longer be        │
│ marked as spillover.                │
│                                     │
│         [Cancel]  [Yes, Delete]     │
└─────────────────────────────────────┘
```

After deletion:
- Record moves to original PI
- `is_spillover = false`
- `spillover_count = 0`
- All spillover fields cleared
- No longer shows SPILLOVER badge

---

## Category Colors

```typescript
const CATEGORY_COLORS = {
  dependencies: 'blue',
  capacity: 'orange',
  scope_creep: 'red',
  technical_debt: 'purple',
  external_factors: 'cyan',
  resource_constraints: 'magenta',
  other: 'default',
};
```

---

## Backend Requirements

### Endpoint to Implement

**File:** `backend/app/routes/jira_v4.py`

```python
@router.delete("/jira-records/{record_id}/spillover-history/{event_id}")
async def delete_spillover_event(
    record_id: str, 
    event_id: str, 
    db: Session = Depends(get_db)
):
    """
    Delete a spillover event (must be the latest one).
    This reverts the record to the previous PI.
    """
    # 1. Get the record
    record = db.query(JiraRecord).filter(JiraRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    # 2. Get the spillover event
    event = db.query(SpilloverHistory).filter(
        SpilloverHistory.id == event_id
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Spillover event not found")
    
    # 3. Verify it's the latest event
    latest = db.query(SpilloverHistory).filter(
        SpilloverHistory.jira_record_id == record_id
    ).order_by(SpilloverHistory.sequence.desc()).first()
    
    if event.id != latest.id:
        raise HTTPException(
            status_code=400, 
            detail="Can only delete the latest spillover event"
        )
    
    # 4. Revert record to previous PI
    record.pi_id = event.from_pi_id
    record.spillover_count = max(0, (record.spillover_count or 1) - 1)
    
    # 5. If this was the only spillover, clear spillover status
    if record.spillover_count == 0:
        record.is_spillover = False
        record.spillover_from_pi_id = None
        record.spillover_reason = None
        record.spillover_category = None
        record.spillover_effort = None
        record.completed_effort = None
        record.original_pi_id = None
    else:
        # Get previous spillover to restore its values
        previous = db.query(SpilloverHistory).filter(
            SpilloverHistory.jira_record_id == record_id,
            SpilloverHistory.sequence == event.sequence - 1
        ).first()
        if previous:
            record.spillover_from_pi_id = previous.from_pi_id
            record.spillover_reason = previous.reason
            record.spillover_category = previous.category
            record.spillover_effort = previous.spillover_effort
            record.completed_effort = previous.completed_effort
    
    # 6. Delete the event
    db.delete(event)
    
    # 7. Add history entry
    history = RecordHistory(
        id=str(uuid.uuid4()),
        jira_record_id=record_id,
        event_type="SPILLOVER_DELETED",
        from_value=f"Spillover #{event.sequence}",
        to_value=f"Reverted to {event.from_pi_name}",
        created_at=datetime.utcnow()
    )
    db.add(history)
    
    db.commit()
    db.refresh(record)
    
    return {"message": "Spillover deleted", "record": record.to_dict()}
```

---

## Integration Guide

### Option 1: Replace SpilloverDetailsEditor

In `JiraRecordModal.tsx`:

```tsx
import { SpilloverHistoryManager } from './SpilloverHistoryManager';

// Inside modal, for spillover records:
{record?.is_spillover && (
  <Tabs.TabPane tab="Spillover Management" key="spillover">
    <SpilloverHistoryManager
      recordId={record.id}
      spilloverCount={record.spillover_count || 1}
      onUpdate={() => {
        fetchRecordDetails();
        onSuccess?.();
      }}
      onEditSpillover={(event) => {
        // Open edit modal for this specific event
        setEditingEvent(event);
        setEditModalVisible(true);
      }}
    />
  </Tabs.TabPane>
)}
```

### Option 2: Add as Separate Tab

```tsx
<Tabs defaultActiveKey="details">
  <Tabs.TabPane tab="Details" key="details">
    {/* Existing form */}
  </Tabs.TabPane>
  
  {record?.is_spillover && (
    <Tabs.TabPane tab="Spillover Stack" key="spillover-stack">
      <SpilloverHistoryManager
        recordId={record.id}
        spilloverCount={record.spillover_count || 1}
        onUpdate={handleUpdate}
        onEditSpillover={handleEditSpillover}
      />
    </Tabs.TabPane>
  )}
  
  <Tabs.TabPane tab="History" key="history">
    <RecordHistory recordId={record.id} />
  </Tabs.TabPane>
</Tabs>
```

---

## Testing Guide

### Test 1: View Spillover Stack

**Steps:**
1. Open record with spillover_count = 3
2. Navigate to Spillover Stack tab

**Expected:**
- ✅ Shows 3 spillover events
- ✅ Latest has blue border, "Current" tag
- ✅ Older two have gray border, "Locked" tags
- ✅ Latest shows Edit/Delete buttons
- ✅ Locked show lock icon only

### Test 2: Delete Latest Spillover

**Steps:**
1. Click Delete on Spillover #3
2. Confirm deletion

**Expected:**
- ✅ Confirmation dialog appears
- ✅ Shows correct PI name
- ✅ After confirm: success message
- ✅ Spillover #2 becomes "Current"
- ✅ Count decrements to 2
- ✅ Record moves to previous PI

### Test 3: Cannot Delete Locked Spillover

**Steps:**
1. Try to click lock icon on Spillover #1

**Expected:**
- ✅ Button is disabled
- ✅ Tooltip shows "Delete newer spillovers first"
- ✅ No action occurs

### Test 4: Delete Last Spillover

**Steps:**
1. Delete spillovers until only 1 remains
2. Delete the last one
3. Confirm

**Expected:**
- ✅ Warning in confirmation about removing spillover status
- ✅ After deletion: record no longer spillover
- ✅ is_spillover = false
- ✅ SPILLOVER badge disappears from table
- ✅ Spillover tab/section no longer shows

### Test 5: Edit Latest Spillover

**Steps:**
1. Click Edit on latest spillover
2. Modify details
3. Save

**Expected:**
- ✅ Edit modal/form opens
- ✅ Shows current values
- ✅ Can modify reason, category, effort
- ✅ Save updates the event
- ✅ Timeline refreshes

### Test 6: Empty State

**Steps:**
1. Open record with no spillover history

**Expected:**
- ✅ Shows Empty component
- ✅ Message: "No spillover history"

---

## Error Handling

### API Errors

**404 - Record Not Found:**
```
message.error('Record not found')
```

**404 - Event Not Found:**
```
message.error('Spillover event not found')
```

**400 - Cannot Delete Locked Event:**
```
message.error('Can only delete the latest spillover event')
```

**500 - Server Error:**
```
message.error('Failed to delete spillover')
```

### Loading States

- Shows `<Spin>` while fetching history
- Shows loading indicator on Delete button during deletion
- Disables buttons during operations

---

## Summary

| Component | Status | Notes |
|-----------|--------|-------|
| SpilloverHistoryManager | ✅ Complete | Full UI implementation |
| API Methods | ✅ Complete | delete/update methods added |
| Backend Endpoint | ⏳ Pending | DELETE endpoint needed |
| Integration | ⏳ Pending | Add to JiraRecordModal |
| Testing | ⏳ Pending | Needs backend endpoint |

**Frontend Status:** 🟢 **COMPLETE**  
**Backend Status:** 🟡 **ENDPOINT NEEDED**  
**Overall Status:** 🟡 **READY FOR BACKEND IMPLEMENTATION**

---

**Implementation Date:** February 10, 2026  
**Developer:** Frontend Team  
**Next:** Implement backend DELETE endpoint, integrate into modal, test end-to-end
