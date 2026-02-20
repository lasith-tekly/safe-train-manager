# UI Design Spec: Holiday Management

## Document Info
- **Version**: 1.0
- **Status**: Draft - Pending Review
- **Created**: 2026-01-19
- **Author**: UI Designer Agent
- **Based on**: `specs/requirements/holiday-management.md` (PM Approved)

---

## 1. Page Layout

### Location
`Settings → Site Management → Holidays` (`/settings/sites/holidays`)

### Overall Structure
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Holidays                                                                        │
│  Manage country-specific holiday calendars                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ ℹ️ Holiday Management                                                        ││
│  │ Configure public holidays for each country. These holidays are applied to   ││
│  │ all sites within the country and affect capacity calculations.              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐              ┌───────────────────┐  │
│  │ 🇬🇧 United Kingdom▼│  │ 2026           ▼│              │ + Import Holidays │  │
│  └──────────────────┘  └──────────────────┘              └───────────────────┘  │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ Date        │ Holiday Name              │ Type      │ Actions              ││
│  ├─────────────┼───────────────────────────┼───────────┼──────────────────────┤│
│  │ Jan 1, 2026 │ New Year's Day            │ Full Day  │ [✎] [🗑]             ││
│  │ Apr 3, 2026 │ Good Friday               │ Full Day  │ [✎] [🗑]             ││
│  │ Apr 6, 2026 │ Easter Monday             │ Full Day  │ [✎] [🗑]             ││
│  │ May 4, 2026 │ Early May Bank Holiday    │ Full Day  │ [✎] [🗑]             ││
│  │ May 25, 2026│ Spring Bank Holiday       │ Full Day  │ [✎] [🗑]             ││
│  │ Aug 31, 2026│ Summer Bank Holiday       │ Full Day  │ [✎] [🗑]             ││
│  │ Dec 25, 2026│ Christmas Day             │ Full Day  │ [✎] [🗑]             ││
│  │ Dec 28, 2026│ Boxing Day (substitute)   │ Full Day  │ [✎] [🗑]             ││
│  └─────────────┴───────────────────────────┴───────────┴──────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ Summary: 8 holidays in 2026 for United Kingdom                              ││
│  │ [+ Add Holiday]                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Specifications

### 2.1 Filter Bar

| Component | Type | Width | Description |
|-----------|------|-------|-------------|
| Country Selector | Select | 200px | Dropdown with flag + country name |
| Year Selector | Select | 120px | Years: current ± 2 |
| Import Button | Button (Primary) | auto | "Import Holidays" with icon |

**Country Selector Options:**
```
🇬🇧 United Kingdom
🇮🇳 India
🇨🇴 Colombia
🇱🇰 Sri Lanka
```

### 2.2 Holiday Table

| Column | Width | Alignment | Content |
|--------|-------|-----------|---------|
| Date | 120px | Left | Formatted date (e.g., "Jan 1, 2026") |
| Holiday Name | flex | Left | Text |
| Type | 100px | Center | Tag: "Full Day" (green) or "Half Day" (orange) |
| Actions | 100px | Center | Edit + Delete buttons |

### 2.3 Summary Footer
- Shows total count: "8 holidays in 2026 for United Kingdom"
- "Add Holiday" button (secondary)

---

## 3. Modal Designs

### 3.1 Add/Edit Holiday Modal

```
┌─────────────────────────────────────────────────────┐
│ Add Holiday                                    [X]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Country                                            │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🇬🇧 United Kingdom                      ▼   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Date *                                             │
│  ┌─────────────────────────────────────────────┐   │
│  │ 📅 Select date                               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Holiday Name *                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ e.g., New Year's Day                        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ☐ Half Day                                         │
│                                                     │
├─────────────────────────────────────────────────────┤
│                          [Cancel]  [Add Holiday]    │
└─────────────────────────────────────────────────────┘
```

### 3.2 Import Holidays Modal

```
┌─────────────────────────────────────────────────────┐
│ Import Holidays                                [X]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Country                                            │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🇬🇧 United Kingdom                      ▼   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Year                                               │
│  ┌─────────────────────────────────────────────┐   │
│  │ 2026                                    ▼   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ℹ️ Preview: 8 holidays will be imported      │   │
│  │                                              │   │
│  │ ☑ Jan 1 - New Year's Day                    │   │
│  │ ☑ Apr 3 - Good Friday                       │   │
│  │ ☑ Apr 6 - Easter Monday                     │   │
│  │ ☑ May 4 - Early May Bank Holiday            │   │
│  │ ☑ May 25 - Spring Bank Holiday              │   │
│  │ ☑ Aug 31 - Summer Bank Holiday              │   │
│  │ ☑ Dec 25 - Christmas Day                    │   │
│  │ ☑ Dec 28 - Boxing Day                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ○ Replace existing holidays                        │
│  ● Merge with existing (skip duplicates)           │
│                                                     │
├─────────────────────────────────────────────────────┤
│                          [Cancel]  [Import]         │
└─────────────────────────────────────────────────────┘
```

---

## 4. Empty States

### No Country Selected
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              📅                                     │
│                                                     │
│        Select a country to view holidays            │
│                                                     │
│        Choose a country from the dropdown above     │
│        to manage its holiday calendar.              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### No Holidays for Country/Year
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              📅                                     │
│                                                     │
│     No holidays configured for United Kingdom       │
│                  in 2026                            │
│                                                     │
│     [Import Holidays]  or  [Add Holiday]            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 5. Color Scheme

| Element | Color | Hex |
|---------|-------|-----|
| Full Day Tag | Green | #52c41a |
| Half Day Tag | Orange | #faad14 |
| Import Button | Primary Blue | #1890ff |
| Delete Button | Red | #ff4d4f |

---

## 6. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>1024px) | Full table layout |
| Tablet (768-1024px) | Condensed table, smaller buttons |
| Mobile (<768px) | Card layout instead of table |

---

## 7. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| UI Designer | Cascade | ✅ Complete | 2026-01-19 |
| Frontend Architect | | Pending | |
| Product Manager | | Pending | |
