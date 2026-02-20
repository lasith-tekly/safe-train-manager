# UI Design Spec: Countries & Sites Page Alignment Fix

## Document Info
- **Version**: 1.0
- **Status**: Draft - Pending Review
- **Created**: 2026-01-19
- **Author**: UI Designer Agent
- **Issue**: Multiple alignment issues on Countries & Sites page

---

## 1. Current Issues Identified

### 1.1 Country Header Row
- "Add Site", "Edit", "Delete" buttons not vertically aligned with header content
- Badges (Sites, Teams) not aligned with country name

### 1.2 Sites Table
- **Address** column: Text not aligned consistently (some show "-", some empty)
- **Unit Cost** column: Values not right-aligned
- **Teams** column: Badge not centered
- **Actions** column: Buttons not centered

---

## 2. Design Specifications

### 2.1 Country Collapse Header

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 🇬🇧 United Kingdom [GB]          ○ Sites [2]  ○ Teams [0]  [+ Add Site] [✎] [🗑] │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Header height: 56px
- All elements vertically centered (align-items: center)
- Left section: Flag (24px) + Name (bold) + Code tag
- Right section: Badges + Buttons (all in a row, 8px gap)
- Buttons: All same size (small), consistent spacing

### 2.2 Sites Table Column Alignment

| Column | Width | Alignment | Content |
|--------|-------|-----------|---------|
| Site Code | 100px | Left | Tag (blue) |
| Site Name | flex | Left | Text |
| Address | 200px | Left | Text or "-" (secondary) |
| Unit Cost | 100px | Right | "XX.X KEUR" (bold) |
| Teams | 80px | Center | Badge |
| Actions | 100px | Center | Edit + Delete buttons |

### 2.3 Table Styling

```css
/* Column widths and alignment */
.siteCode { width: 100px; text-align: left; }
.siteName { flex: 1; text-align: left; }
.address { width: 200px; text-align: left; }
.unitCost { width: 100px; text-align: right; }
.teams { width: 80px; text-align: center; }
.actions { width: 100px; text-align: center; }

/* Consistent row height */
.tableRow { height: 48px; }

/* Vertical alignment */
.tableCell { 
  display: flex; 
  align-items: center; 
  justify-content: inherit; /* respects text-align */
}
```

---

## 3. Visual Mockup

### Country Header (Expanded)
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ▼  🇬🇧 United Kingdom  [GB]                    ○2 Sites  ○0 Teams  [+Add Site][✎][🗑]│
├─────────────────────────────────────────────────────────────────────────────────┤
│ Site Code │ Site Name   │ Address              │ Unit Cost │ Teams │ Actions   │
├───────────┼─────────────┼──────────────────────┼───────────┼───────┼───────────┤
│ [LON]     │ London      │ -                    │  85.0 KEUR│   ●   │  [✎] [🗑] │
│ [MAN]     │ Manchester  │ -                    │  85.0 KEUR│   ●   │  [✎] [🗑] │
└───────────┴─────────────┴──────────────────────┴───────────┴───────┴───────────┘
```

---

## 4. Implementation Notes

### 4.1 Ant Design Table Column Config
```typescript
columns = [
  { title: 'Site Code', dataIndex: 'code', width: 100 },
  { title: 'Site Name', dataIndex: 'name' },
  { title: 'Address', dataIndex: 'address', width: 200 },
  { title: 'Unit Cost', dataIndex: 'unit_cost_keur', width: 100, align: 'right' },
  { title: 'Teams', dataIndex: 'team_count', width: 80, align: 'center' },
  { title: 'Actions', key: 'actions', width: 100, align: 'center' }
]
```

### 4.2 Collapse Header Extra Alignment
```css
.collapse :global(.ant-collapse-extra) {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse :global(.ant-collapse-header) {
  display: flex;
  align-items: center;
}
```

---

## 5. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| UI Designer | Cascade | ✅ Complete | 2026-01-19 |
| Frontend Architect | | Pending | |
| Product Manager | | Pending | |
