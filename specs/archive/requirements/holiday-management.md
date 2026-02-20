# Holiday Management Requirements

## Document Info
- **Version**: 1.0
- **Status**: Draft - Pending PM Review
- **Created**: 2026-01-19
- **Author**: Product Manager Agent

---

## 1. Overview

Enable country-specific holiday calendar management with import capabilities. Holidays should be editable per country and automatically factored into capacity calculations.

---

## 2. User Stories

### US-1: Import Country Holiday Calendar
```
As a Train PM / RTE
I want to import a country's public holiday calendar
So that I don't have to manually enter each holiday

Acceptance Criteria:
- [ ] Can select a country from the configured countries list
- [ ] Can select a year to import holidays for
- [ ] System provides pre-defined holiday data for common countries (UK, India, Colombia, Sri Lanka, etc.)
- [ ] Import shows preview of holidays before confirming
- [ ] Duplicate holidays are detected and skipped
- [ ] Success message shows count of imported holidays

Business Rules:
- Only countries configured in Site Management can have holidays imported
- Import replaces or merges with existing holidays (user choice)
- Holidays are stored per country, not per site
```

### US-2: View Holidays by Country
```
As a Train PM / RTE
I want to view holidays grouped by country
So that I can see and manage each country's holiday calendar

Acceptance Criteria:
- [ ] Country selector/filter at top of page
- [ ] When country selected, shows list of holidays for that country
- [ ] Holidays displayed in chronological order
- [ ] Shows: Date, Holiday Name, Type (Public/Optional), Year
- [ ] Can filter by year
- [ ] Empty state when no holidays configured

Business Rules:
- Default view shows current year
- Can view past and future years (current year ± 2)
```

### US-3: Edit Country Holidays
```
As a Train PM / RTE
I want to add, edit, and delete holidays for a country
So that I can customize the holiday calendar

Acceptance Criteria:
- [ ] Can add a new holiday (date, name, is_half_day)
- [ ] Can edit existing holiday details
- [ ] Can delete a holiday with confirmation
- [ ] Validation prevents duplicate dates within same country/year
- [ ] Changes take effect immediately

Business Rules:
- Holidays are tied to country, not individual sites
- All sites in a country inherit the country's holidays
- Half-day holidays count as 0.5 days in capacity calculations
```

### US-4: Holidays in Capacity Calculation
```
As a Train PM / RTE
I want holidays to be automatically deducted from team capacity
So that capacity planning is accurate

Acceptance Criteria:
- [ ] Team capacity calculation considers holidays from team's site's country
- [ ] Holidays within a PI/Sprint reduce available working days
- [ ] Half-day holidays reduce by 0.5 days
- [ ] Capacity summary shows holiday deductions
- [ ] PI Calendar shows holidays as non-working days

Business Rules:
- Holiday deduction = Number of holidays × team members affected
- If team spans multiple sites/countries, each member's holidays apply individually
- Holidays only affect capacity for dates within the calculation period
```

---

## 3. Data Model Requirements

### Holiday Entity
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| country_id | UUID | Yes | FK to Country |
| year | Integer | Yes | Year (2024-2030) |
| date | Date | Yes | Holiday date |
| name | String(100) | Yes | Holiday name |
| is_half_day | Boolean | No | Default: false |
| is_recurring | Boolean | No | Repeats annually |
| created_at | DateTime | Yes | Auto-generated |

### Constraints
- Unique: (country_id, date) - No duplicate holidays on same date
- Index: (country_id, year) - For efficient filtering

---

## 4. Pre-defined Holiday Data

### Countries to Support Initially
1. **United Kingdom (GB)** - Bank holidays
2. **India (IND)** - National holidays
3. **Colombia (COL)** - Public holidays
4. **Sri Lanka (LKA)** - Public holidays
5. **France (FRA)** - Public holidays
6. **Germany (DEU)** - Public holidays

### Sample UK 2026 Holidays
| Date | Name |
|------|------|
| 2026-01-01 | New Year's Day |
| 2026-04-03 | Good Friday |
| 2026-04-06 | Easter Monday |
| 2026-05-04 | Early May Bank Holiday |
| 2026-05-25 | Spring Bank Holiday |
| 2026-08-31 | Summer Bank Holiday |
| 2026-12-25 | Christmas Day |
| 2026-12-28 | Boxing Day (substitute) |

---

## 5. UI Flow

```
Settings → Site Management → Holidays
    │
    ├── [Country Selector] [Year Selector] [+ Import Holidays]
    │
    ├── Holiday List (filtered by country/year)
    │   ├── Date | Name | Type | Actions
    │   ├── 2026-01-01 | New Year's Day | Full | [Edit] [Delete]
    │   └── ...
    │
    └── [+ Add Holiday] button
```

---

## 6. Integration Points

### Capacity Calculator
- Query holidays for team's country within date range
- Deduct holiday days from gross working days
- Formula: `Net Working Days = Gross Days - Holidays - Leaves`

### PI Calendar
- Display holidays as markers on calendar view
- Different color/style for holidays vs working days

---

## 7. Out of Scope (Future)
- Individual team member leave management
- Regional/state-specific holidays within a country
- Automatic holiday API integration (e.g., Calendarific)
- Holiday approval workflows

---

## 8. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Product Manager | | Pending | |
| UI Designer | | Pending | |
| Frontend Architect | | Pending | |
