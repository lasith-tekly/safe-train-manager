# Frontend Architecture: Holiday Management

## Document Info
- **Version**: 1.0
- **Status**: Draft - Pending Review
- **Created**: 2026-01-19
- **Based on**: 
  - `specs/requirements/holiday-management.md` (PM Approved)
  - `specs/design/holiday-management-ui.md` (UI Design)

---

## 1. Component Structure

```
src/pages/Settings/HolidaysPage.tsx (existing - needs update)
├── HolidayFilters (Country + Year selectors)
├── HolidayTable (List of holidays)
├── HolidaySummary (Count + Add button)
├── AddEditHolidayModal
└── ImportHolidaysModal
```

---

## 2. State Management

```typescript
interface HolidaysPageState {
  // Filters
  selectedCountryId: string | null;
  selectedYear: number;
  
  // Data
  countries: Country[];
  holidays: Holiday[];
  
  // Loading states
  loading: boolean;
  importing: boolean;
  saving: boolean;
  
  // Modals
  showAddModal: boolean;
  showImportModal: boolean;
  editingHoliday: Holiday | null;
  
  // Import preview
  importPreview: Holiday[];
  importMode: 'replace' | 'merge';
}
```

---

## 3. API Integration

### Endpoints Required

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/holidays?country_id={id}&year={year}` | List holidays |
| POST | `/api/holidays` | Create holiday |
| PUT | `/api/holidays/{id}` | Update holiday |
| DELETE | `/api/holidays/{id}` | Delete holiday |
| GET | `/api/holidays/templates?country_code={code}&year={year}` | Get import template |
| POST | `/api/holidays/import` | Bulk import holidays |

### TypeScript Types

```typescript
interface Holiday {
  id: string;
  country_id: string;
  year: number;
  date: string; // ISO date
  name: string;
  is_half_day: boolean;
  is_recurring: boolean;
  created_at: string;
}

interface HolidayCreate {
  country_id: string;
  date: string;
  name: string;
  is_half_day?: boolean;
}

interface HolidayImport {
  country_id: string;
  year: number;
  mode: 'replace' | 'merge';
  holidays: HolidayCreate[];
}

interface HolidayTemplate {
  country_code: string;
  year: number;
  holidays: Array<{
    date: string;
    name: string;
    is_half_day: boolean;
  }>;
}
```

---

## 4. File Structure

```
frontend/src/
├── pages/Settings/
│   └── HolidaysPage.tsx (update existing)
├── components/holidays/
│   ├── HolidayFilters.tsx
│   ├── HolidayTable.tsx
│   ├── AddEditHolidayModal.tsx
│   └── ImportHolidaysModal.tsx
├── services/
│   └── api.ts (add holiday endpoints)
└── types/
    └── index.ts (add Holiday types)
```

---

## 5. Data Flow

```
1. Page Load
   └── Load countries from API
   └── Set default country (first in list) and year (current)
   └── Fetch holidays for selected country/year

2. Country/Year Change
   └── Update filter state
   └── Fetch holidays for new selection

3. Add Holiday
   └── Open modal with empty form
   └── On submit: POST to API
   └── Refresh holiday list

4. Edit Holiday
   └── Open modal with holiday data
   └── On submit: PUT to API
   └── Refresh holiday list

5. Delete Holiday
   └── Confirm dialog
   └── DELETE to API
   └── Refresh holiday list

6. Import Holidays
   └── Open import modal
   └── Select country/year
   └── Fetch template from API (preview)
   └── User selects merge/replace
   └── POST bulk import
   └── Refresh holiday list
```

---

## 6. Existing Code Analysis

The current `HolidaysTab` component exists but needs to be updated to match the new design. Key changes:
- Add country filter (currently may show all holidays)
- Add import functionality
- Update table layout per UI spec
- Add proper empty states

---

## 7. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Frontend Architect | Cascade | ✅ Approved | 2026-01-19 |
| Backend Architect | | Pending | |
