# Features from JIRA - UI Design Specification

**Document Version:** 1.0  
**Created:** 2026-01-15  
**Author:** UI Designer Agent  
**Status:** Draft  

---

## 1. Overview

The Features page allows users to view, import, and manage features from JIRA. It includes a feature list with filtering, an import wizard, and feature editing capabilities.

---

## 2. Page Layout

### 2.1 Features List Page

```
┌─────────────────────────────────────────────────────────────────┐
│ Features                                           [Import from JIRA] │
├─────────────────────────────────────────────────────────────────┤
│ Filters:                                                        │
│ [Product ▼] [Budget Line ▼] [Team ▼] [Quarter ▼] [Status ▼]    │
│ [🔍 Search features...]                                         │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Key      │ Title          │ Product │ Team │ Q │ Cost │ ⋮  │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ BRS-123  │ User Auth...   │ BRS     │ PLAT │ 1 │ 45K  │ ⋮  │ │
│ │ BRS-124  │ Payment...     │ BRS     │ MOB  │ 2 │ 75K  │ ⋮  │ │
│ │ FM-101   │ Dashboard...   │ FM      │ PLAT │ 1 │ 30K  │ ⋮  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Showing 1-20 of 45 features                    [< 1 2 3 ... >] │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Import Wizard Modal

```
┌─────────────────────────────────────────────────────────────────┐
│ Import from JIRA                                          [×]   │
├─────────────────────────────────────────────────────────────────┤
│ Step: ● ○ ○ ○  (1. Select Source)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ JIRA Project *                                                  │
│ [Select project ▼]                                              │
│                                                                 │
│ Issue Type                                                      │
│ [Epic ▼]                                                        │
│                                                                 │
│ Additional JQL Filter (optional)                                │
│ [status != Done                                            ]    │
│                                                                 │
│ Preview: 23 issues match your criteria                          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                        [Cancel]  [Next →]       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Specifications

### 3.1 Feature Table

| Column | Width | Content |
|--------|-------|---------|
| Key | 100px | JIRA key with link icon |
| Title | flex | Feature title (truncated) |
| Product | 80px | Product short code |
| Budget Line | 120px | Budget line name |
| Team | 80px | Team short code |
| Quarter | 60px | Q1-Q4 badge |
| Cost | 80px | Cost in KEUR |
| Status | 100px | Status badge |
| Actions | 80px | Edit, Sync, Delete |

### 3.2 Status Badges

| Status | Color | Background |
|--------|-------|------------|
| Not Started | #8c8c8c | #f5f5f5 |
| In Progress | #1890ff | #e6f7ff |
| Completed | #52c41a | #f6ffed |

### 3.3 Quarter Badges

| Quarter | Color |
|---------|-------|
| Q1 | Blue |
| Q2 | Green |
| Q3 | Orange |
| Q4 | Purple |

---

## 4. Import Wizard Steps

### Step 1: Select Source
- Project dropdown (required)
- Issue type dropdown (default: Epic)
- JQL filter input (optional)
- Preview count display

### Step 2: Select Features
- Table with checkboxes
- Select all checkbox
- Already imported items disabled
- Selected count display

### Step 3: Map Fields
- Bulk mapping section
- Individual feature mapping table
- Product, Budget Line, Team, Quarter dropdowns
- Cost input field

### Step 4: Confirmation
- Success/failure summary
- Error list if any
- Action buttons

---

## 5. Feature Edit Panel

```
┌──────────────────────────────────────┐
│ Edit Feature                    [×]  │
├──────────────────────────────────────┤
│ JIRA Key: BRS-123                    │
│ Title: Implement user authentication │
│ Status: In Progress                  │
│                                      │
│ ─────────────────────────────────    │
│                                      │
│ Product *                            │
│ [BRS - Business Risk Solutions ▼]    │
│                                      │
│ Budget Line *                        │
│ [Product Evolution ▼]                │
│                                      │
│ Team                                 │
│ [Platform Team ▼]                    │
│                                      │
│ Quarter *                            │
│ [Q1 ▼]  Year: [2026 ▼]              │
│                                      │
│ Cost (KEUR) *                        │
│ [45.5                           ]    │
│                                      │
│ Story Points: 13 (from JIRA)         │
│                                      │
├──────────────────────────────────────┤
│ Last synced: Jan 15, 2026 10:00 AM   │
│                        [Sync] [Save] │
└──────────────────────────────────────┘
```

---

## 6. Empty States

### No Features
```
┌─────────────────────────────────────┐
│         📋                          │
│   No features imported yet          │
│                                     │
│   Import features from JIRA to      │
│   start tracking budget and         │
│   capacity allocation.              │
│                                     │
│      [Import from JIRA]             │
└─────────────────────────────────────┘
```

### No Search Results
```
┌─────────────────────────────────────┐
│         🔍                          │
│   No features found                 │
│                                     │
│   Try adjusting your filters        │
│   or search terms.                  │
│                                     │
│      [Clear Filters]                │
└─────────────────────────────────────┘
```

---

## 7. Responsive Behavior

### Desktop (≥1200px)
- Full table with all columns
- Side panel 480px width

### Tablet (768px-1199px)
- Hide Budget Line column
- Compact row actions

### Mobile (<768px)
- Card view instead of table
- Full-width modals

---

## 8. Interactions

### Feature Row Click
- Opens edit panel

### Import Button
- Opens wizard modal

### Sync Button
- Shows loading spinner
- Success/error toast

### Delete Button
- Confirmation popover
- Success toast on delete

---

## 9. Loading States

### Table Loading
- Skeleton rows (5 rows)

### Import Loading
- Progress bar in wizard
- Disabled buttons during import

### Sync Loading
- Spinning icon on sync button
- Disabled row during sync
