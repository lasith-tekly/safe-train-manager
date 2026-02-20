# UI Design Spec: Holidays Page Cleanup

## Document Info
- **Version**: 1.0
- **Status**: Draft
- **Created**: 2026-01-19
- **Author**: UI Designer Agent

---

## 1. Issues Identified

1. **Redundant Alert Banner** - Remove the info Alert at the top (page context is clear from navigation)
2. **Redundant Country Column** - Remove country_code column from table (already filtering by country)
3. **Cleaner Layout** - Simplify the header and content structure

---

## 2. Proposed Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐                     │
│  │ 🇬🇧 United Kingdom▼│  │ 2026           ▼│  │ List View ▼│   [Import] [+ Add] │
│  └──────────────────┘  └──────────────────┘  └────────────┘                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Date        │ Day       │ Holiday Name              │ Type      │ Actions   │ │
│ ├─────────────┼───────────┼───────────────────────────┼───────────┼───────────┤ │
│ │ Jan 1, 2026 │ Thursday  │ New Year's Day            │ Full Day  │ [✎] [🗑]  │ │
│ │ Apr 3, 2026 │ Friday    │ Good Friday               │ Full Day  │ [✎] [🗑]  │ │
│ │ ...         │ ...       │ ...                       │ ...       │ ...       │ │
│ └─────────────┴───────────┴───────────────────────────┴───────────┴───────────┘ │
│                                                                                  │
│  8 holidays in 2026 for United Kingdom                                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Changes Required

### 3.1 Remove Alert Banner
- Delete the `<Alert>` component at the top of the page

### 3.2 Update Table Columns
Remove "Country" column, update columns to:
| Column | Width | Alignment | Content |
|--------|-------|-----------|---------|
| Date | 130px | Left | Formatted date |
| Day | 100px | Left | Day of week |
| Holiday | flex | Left | Name + tags |
| Type | 100px | Center | "Full Day" or "Half Day" tag |
| Actions | 100px | Center | Edit + Delete buttons |

### 3.3 Type Column
- Show "Full Day" (green tag) or "Half Day" (orange tag)
- Remove "Recurring" tag (not essential for display)

---

## 4. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| UI Designer | Cascade | ✅ Complete | 2026-01-19 |
| Frontend Developer | | Pending | |
