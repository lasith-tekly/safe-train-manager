# Phase 5+6: UI Design Specification
**PO Team Planning & PM Review Workflow**

---

## Design Tokens

### Colors
**Status:**
- Gray (Not Planned): #8C8C8C
- Green (Accepted): #52C41A
- Blue (Modified): #1890FF
- Orange (Descoped): #FA8C16
- Yellow (Orphaned): #FAAD14

**Capacity:**
- Green (<95%): #52C41A
- Amber (95-100%): #FAAD14
- Red (>100%): #FF4D4F

---

## 1. Team Planning Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Team Planning                          Version: v2.1 ▾      │
├─────────────────────────────────────────────────────────────┤
│ [Outdated Banner - if applicable]                           │
│                                                             │
│ Team: [Alpha ▾]  PI: [2026.1 ▾]                            │
│                                                             │
│ ┌─ Summary ────────────────────────────────────────────────┐│
│ │ Total: 12 │ ✓5 │ ⚡3 │ 🚫2 │ ⏳2                         ││
│ │ Capacity: ████████████░░░░ 78% (GREEN)                  ││
│ │                                    [Commit Plan]         ││
│ └──────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─ Planning Table ─────────────────────────────────────────┐│
│ │ [Bulk Actions: Accept Selected (3)]                     ││
│ │ ☐│Feature│JIRA│Title│PM│Your Effort│Status│Actions│     ││
│ │ ☐│Search│101│API│10│10(6/2/2)│✓Accepted│⋮│            ││
│ │ ☐│Dash│102│UI│8│10(7/2/1)│⚡Modified +2│⋮│             ││
│ └──────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─ Descoped (2) ───────────────────────────────────────────┐│
│ │ Reports│103│15eD│Reason: Capacity│[Restore]             ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Capacity Bar Component

**Green (<95%):**
```
78.0 / 100.0 eD (78%)
████████████████░░░░░░░░  Remaining: 22.0 eD
```

**Amber (95-100%):**
```
97.0 / 100.0 eD (97%) ⚠️
████████████████████████░░  Near capacity: 3.0 eD
```

**Red (>100%):**
```
112.0 / 100.0 eD (112%) ⚠️
████████████████████████████  Over by: 12.0 eD
```

---

## 3. Inline Role Breakdown Editor

**Collapsed:** `10.0 eD (Dev:6 | PD:2 | QA:2)`

**Expanded:**
```
┌─ Edit Effort ──────────────┐
│ Dev:  [6.0] eD ▲▼          │
│ PD:   [2.0] eD ▲▼          │
│ QA:   [2.0] eD ▲▼          │
│ Total: 10.0 eD ✓           │
│ [Save] [Cancel]            │
└────────────────────────────┘
```
- Auto-save: 500ms debounce
- Validation: Real-time, Dev+PD+QA = Total

---

## 4. Status Badges

```
⏳ Not Planned  (Gray bg, #F5F5F5)
✓ Accepted      (Green bg, #F6FFED)
⚡ Modified +2.0 (Blue bg, #E6F7FF)
🚫 Descoped     (Orange bg, #FFF7E6)
⚠️ ORPHANED     (Yellow bg, #FFFBE6)
```

---

## 5. Descope Modal

```
┌─────────────────────────────────────────────┐
│ Descope: FEAT-102                   [✕]    │
├─────────────────────────────────────────────┤
│ Reason (min 10 chars):                      │
│ ┌─────────────────────────────────────────┐ │
│ │ Not enough capacity, defer to 2026.2   │ │
│ └─────────────────────────────────────────┘ │
│ 58/500 chars                                │
│                                             │
│ What happens:                               │
│ • Moves to descoped section                 │
│ • 0 eD to capacity                          │
│ • PM reviews                                │
│                                             │
│                   [Cancel] [Descope]        │
└─────────────────────────────────────────────┘
```

---

## 6. Commit Modal

```
┌─────────────────────────────────────────────┐
│ Commit Plan                         [✕]    │
├─────────────────────────────────────────────┤
│ Summary:                                    │
│ • Accepted: 5 (50 eD)                       │
│ • Modified: 3 (+5 eD)                       │
│ • Descoped: 2 (-30 eD)                      │
│ Net: -25 eD, Capacity: 78%                  │
│                                             │
│ ⚠️ 2 items need role breakdown              │
│                                             │
│                   [Cancel] [Commit]         │
└─────────────────────────────────────────────┘
```

---

## 7. PM Review Panel (Drawer)

```
┌─────────────────────────────────────────────┐
│ Review: Alpha Team - PI 2026.1      [✕]    │
├─────────────────────────────────────────────┤
│ Submitted: Feb 13, 10:30 AM                 │
│ Items: 10 │ Modified: 3 │ Descoped: 2       │
│                                             │
│ [Approve All] [Reject All]                  │
│                                             │
│ ┌─ FEAT-102: Dashboard UI ────────────────┐ │
│ │ PM: 8 eD → PO: 10 eD (+2 eD)            │ │
│ │ Dev:7 | PD:2 | QA:1                     │ │
│ │ [Approve] [Reject]                      │ │
│ │ ℹ️ No lock after approval                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─ FEAT-103: Reports (DESCOPED) ──────────┐ │
│ │ PM: 15 eD → PO: Descope                 │ │
│ │ Reason: "Not enough capacity"           │ │
│ │ [Approve Descope] [Reject]              │ │
│ │ ℹ️ Removes from PI, flags for future     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Progress: 2 of 5 reviewed                   │
└─────────────────────────────────────────────┘
```

---

## 8. Notification Badge

**Menu:** `Products (3)` - Red badge, count = products with pending reviews

**Banner:**
```
┌─────────────────────────────────────────────┐
│ 📢 3 teams submitted plans                  │
│ • Alpha (PI 2026.1) - 10 items, +5 eD      │
│ • Beta (PI 2026.1) - 8 items, -3 eD        │
│ [Review Now] [Dismiss]                      │
└─────────────────────────────────────────────┘
```

---

## 9. Outdated Plan Banner

```
┌─────────────────────────────────────────────┐
│ ⚠️ New Strategic Plan v2.2 published        │
│    Your draft (v2.1) is outdated            │
│ [View Changes] [Start New] [Keep Draft]     │
└─────────────────────────────────────────────┘
```
Background: #FFF7E6 (warning yellow)

---

## 10. Orphaned JIRA State

**Table Row:**
- Background: #FFFBE6 (light yellow)
- JIRA Key: Strikethrough with ⚠️ icon
- Badge: "ORPHANED" in yellow
- Tooltip: "PM deleted this JIRA. Data preserved."
- Actions: [Acknowledge & Remove]

---

## Component Props

```typescript
// Capacity Bar
interface CapacityBarProps {
  total: number;
  planned: number;
}

// Role Breakdown Editor
interface RoleBreakdownProps {
  devEffort: number;
  pdEffort: number;
  qaEffort: number;
  onSave: (dev, pd, qa) => void;
}

// Status Badge
interface StatusBadgeProps {
  status: 'not_planned' | 'accepted' | 'modified' | 'descope_proposed';
  delta?: number;
}
```

---

## Interaction Notes

1. **Auto-save:** 500ms debounce, show "Saving..." indicator
2. **Validation:** Real-time on blur, block save if errors
3. **Bulk Accept:** Confirmation modal, no auto-fill roles
4. **Commit:** Disabled if all "not_planned" or validation errors
5. **PM Approval:** No locking, PO can modify in next iteration
6. **Orphaned Items:** Block commit until acknowledged

---

**Design System:** Ant Design components  
**Responsive:** Desktop-first (1280px+)  
**Accessibility:** WCAG 2.1 AA compliant
