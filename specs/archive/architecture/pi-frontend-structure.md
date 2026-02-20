# PI Configuration - Frontend Architecture Specification

**Document Version:** 1.0  
**Created:** 2026-01-15  
**Author:** Frontend Architect Agent  
**Status:** Draft  
**Input:** specs/requirements/pi-configuration.md, specs/design/pi-calendar-mockups.md  

---

## 1. Overview

This document defines the frontend component architecture for PI Calendar, Holiday Management, and Iteration Capacity features.

### 1.1 New Modules
- **PICalendarTab** - PI and iteration management
- **HolidaysTab** - Holiday calendar management
- **Enhanced TeamsTab** - Iteration-based capacity view

---

## 2. File Structure

```
frontend/src/
├── pages/
│   └── Setup/
│       ├── PICalendarTab/
│       │   ├── index.tsx                    # Main tab component
│       │   ├── PICalendarTab.module.css
│       │   ├── PITimeline.tsx               # Timeline visualization
│       │   ├── PIBlock.tsx                  # Single PI block in timeline
│       │   ├── IterationChip.tsx            # Iteration indicator
│       │   ├── PIList.tsx                   # PI table list
│       │   ├── PIFormPanel.tsx              # Create/Edit PI side panel
│       │   ├── IterationForm.tsx            # Iteration edit form
│       │   ├── GeneratePIsModal.tsx         # PI generation wizard
│       │   └── WeekBadge.tsx                # Week number badge
│       │
│       ├── HolidaysTab/
│       │   ├── index.tsx                    # Main tab component
│       │   ├── HolidaysTab.module.css
│       │   ├── HolidayCalendar.tsx          # Calendar view
│       │   ├── HolidayList.tsx              # List view
│       │   ├── HolidayFormModal.tsx         # Add/Edit holiday
│       │   ├── ImportPresetModal.tsx        # Import from country
│       │   └── DayCell.tsx                  # Calendar day cell
│       │
│       ├── TeamsTab/
│       │   ├── ... (existing files)
│       │   ├── IterationCapacityView.tsx    # NEW: Capacity by iteration
│       │   ├── CapacityCell.tsx             # NEW: Single capacity cell
│       │   ├── MemberLeavesPanel.tsx        # NEW: Leave management
│       │   └── LeaveCalendar.tsx            # NEW: Leave calendar
│       │
│       └── index.tsx                        # Updated with new tabs
│
├── services/
│   └── api.ts                               # Add PI, Holiday, Capacity APIs
│
├── types/
│   └── index.ts                             # Add PI, Iteration, Holiday types
│
├── hooks/
│   ├── usePIs.ts                            # PI data hook
│   ├── useHolidays.ts                       # Holiday data hook
│   └── useIterationCapacity.ts              # Capacity data hook
│
└── utils/
    ├── calendar.ts                          # Calendar utilities
    └── weekNumber.ts                        # ISO week calculations
```

---

## 3. TypeScript Types

### 3.1 PI Types (`types/index.ts`)

```typescript
// PI Status
export type PIStatus = 'planning' | 'active' | 'completed';

// Iteration
export interface Iteration {
  id: string;
  pi_id: string;
  name: string;
  sequence: number;
  start_date: string;
  end_date: string;
  start_week: number;
  end_week: number;
  duration_weeks: number;
  is_ip_iteration: boolean;
  working_days: number;
  created_at: string;
}

export interface IterationCreate {
  name: string;
  sequence: number;
  start_date: string;
  end_date: string;
  duration_weeks?: number;
  is_ip_iteration?: boolean;
}

// PI (Program Increment)
export interface PI {
  id: string;
  name: string;
  year: number;
  sequence: number;
  start_date: string;
  end_date: string;
  start_week: number;
  end_week: number;
  duration_weeks: number;
  status: PIStatus;
  iterations: Iteration[];
  created_at: string;
  updated_at: string | null;
}

export interface PICreate {
  name: string;
  year: number;
  sequence: number;
  start_date: string;
  end_date: string;
  status?: PIStatus;
  iterations?: IterationCreate[];
}

export interface PIUpdate {
  name?: string;
  start_date?: string;
  end_date?: string;
  status?: PIStatus;
}

export interface PIListResponse {
  data: PI[];
  total: number;
}

export interface PIGenerateRequest {
  year: number;
  start_date: string;
  template: 'standard' | 'quarterly' | 'custom';
  iterations_per_pi?: number;
  iteration_weeks?: number;
  include_ip?: boolean;
  pi_count?: number;
}
```

### 3.2 Holiday Types

```typescript
// Holiday
export interface Holiday {
  id: string;
  name: string;
  date: string;
  year: number;
  is_half_day: boolean;
  is_recurring: boolean;
  team_id: string | null;
  country_code: string | null;
  created_at: string;
}

export interface HolidayCreate {
  name: string;
  date: string;
  is_half_day?: boolean;
  is_recurring?: boolean;
  team_id?: string;
}

export interface HolidayUpdate {
  name?: string;
  date?: string;
  is_half_day?: boolean;
  is_recurring?: boolean;
}

export interface HolidayListResponse {
  data: Holiday[];
  total: number;
}

export interface HolidayImportRequest {
  year: number;
  country_code: string;
  replace_existing?: boolean;
}

export interface HolidayPreset {
  code: string;
  name: string;
  holidays: { name: string; month: number; day: number }[];
}
```

### 3.3 Member Leave Types

```typescript
export type LeaveType = 'vacation' | 'sick' | 'training' | 'other';

export interface MemberLeave {
  id: string;
  member_id: string;
  start_date: string;
  end_date: string;
  leave_type: LeaveType;
  is_half_day: boolean;
  notes: string | null;
  days: number;
  created_at: string;
}

export interface MemberLeaveCreate {
  start_date: string;
  end_date: string;
  leave_type: LeaveType;
  is_half_day?: boolean;
  notes?: string;
}
```

### 3.4 Iteration Capacity Types

```typescript
export interface IterationCapacity {
  iteration_id: string;
  iteration_name: string;
  iteration_sequence: number;
  start_week: number;
  end_week: number;
  is_ip: boolean;
  calculated_capacity: number;
  manual_override: number | null;
  override_reason: string | null;
  final_capacity: number;
  allocated: number;
  available: number;
  utilization: number;
}

export interface TeamIterationCapacity {
  team_id: string;
  team_name: string;
  team_code: string;
  member_count: number;
  iterations: IterationCapacity[];
  pi_total_capacity: number;
  pi_total_allocated: number;
  pi_utilization: number;
}

export interface CapacityOverrideRequest {
  manual_override: number;
  override_reason: string;
}

export interface CapacitySummary {
  pi_id: string;
  pi_name: string;
  teams: TeamIterationCapacity[];
  total_capacity: number;
  total_allocated: number;
  overall_utilization: number;
}
```

---

## 4. API Service Functions

### 4.1 PI APIs (`services/api.ts`)

```typescript
// PI Management
export const getPIs = async (year: number, status?: PIStatus): Promise<PIListResponse> => {
  const params: Record<string, string | number> = { year };
  if (status) params.status = status;
  const response = await api.get<PIListResponse>('/pis', { params });
  return response.data;
};

export const getPI = async (id: string): Promise<PI> => {
  const response = await api.get<PI>(`/pis/${id}`);
  return response.data;
};

export const createPI = async (data: PICreate): Promise<PI> => {
  const response = await api.post<PI>('/pis', data);
  return response.data;
};

export const updatePI = async (id: string, data: PIUpdate): Promise<PI> => {
  const response = await api.put<PI>(`/pis/${id}`, data);
  return response.data;
};

export const deletePI = async (id: string): Promise<void> => {
  await api.delete(`/pis/${id}`);
};

export const generatePIs = async (data: PIGenerateRequest): Promise<PIListResponse> => {
  const response = await api.post<PIListResponse>('/pis/generate', data);
  return response.data;
};

// Iterations
export const addIteration = async (piId: string, data: IterationCreate): Promise<Iteration> => {
  const response = await api.post<Iteration>(`/pis/${piId}/iterations`, data);
  return response.data;
};

export const updateIteration = async (id: string, data: IterationCreate): Promise<Iteration> => {
  const response = await api.put<Iteration>(`/pis/iterations/${id}`, data);
  return response.data;
};

export const deleteIteration = async (id: string): Promise<void> => {
  await api.delete(`/pis/iterations/${id}`);
};
```

### 4.2 Holiday APIs

```typescript
// Holidays
export const getHolidays = async (year: number, teamId?: string): Promise<HolidayListResponse> => {
  const params: Record<string, string | number> = { year };
  if (teamId) params.team_id = teamId;
  const response = await api.get<HolidayListResponse>('/holidays', { params });
  return response.data;
};

export const createHoliday = async (data: HolidayCreate): Promise<Holiday> => {
  const response = await api.post<Holiday>('/holidays', data);
  return response.data;
};

export const updateHoliday = async (id: string, data: HolidayUpdate): Promise<Holiday> => {
  const response = await api.put<Holiday>(`/holidays/${id}`, data);
  return response.data;
};

export const deleteHoliday = async (id: string): Promise<void> => {
  await api.delete(`/holidays/${id}`);
};

export const importHolidays = async (data: HolidayImportRequest): Promise<HolidayListResponse> => {
  const response = await api.post<HolidayListResponse>('/holidays/import', data);
  return response.data;
};

export const getHolidayPresets = async (): Promise<{ presets: string[] }> => {
  const response = await api.get<{ presets: string[] }>('/holidays/presets');
  return response.data;
};
```

### 4.3 Member Leave APIs

```typescript
// Member Leaves
export const getMemberLeaves = async (memberId: string, year?: number): Promise<MemberLeave[]> => {
  const params: Record<string, number> = {};
  if (year) params.year = year;
  const response = await api.get<MemberLeave[]>(`/members/${memberId}/leaves`, { params });
  return response.data;
};

export const createMemberLeave = async (memberId: string, data: MemberLeaveCreate): Promise<MemberLeave> => {
  const response = await api.post<MemberLeave>(`/members/${memberId}/leaves`, data);
  return response.data;
};

export const updateMemberLeave = async (memberId: string, leaveId: string, data: MemberLeaveCreate): Promise<MemberLeave> => {
  const response = await api.put<MemberLeave>(`/members/${memberId}/leaves/${leaveId}`, data);
  return response.data;
};

export const deleteMemberLeave = async (memberId: string, leaveId: string): Promise<void> => {
  await api.delete(`/members/${memberId}/leaves/${leaveId}`);
};
```

### 4.4 Capacity APIs

```typescript
// Iteration Capacity
export const getCapacitySummary = async (year: number, piId?: string): Promise<CapacitySummary> => {
  const params: Record<string, string | number> = { year };
  if (piId) params.pi_id = piId;
  const response = await api.get<CapacitySummary>('/capacity/summary', { params });
  return response.data;
};

export const getTeamIterationCapacity = async (teamId: string, piId: string): Promise<TeamIterationCapacity> => {
  const response = await api.get<TeamIterationCapacity>(
    `/capacity/teams/${teamId}/iterations`,
    { params: { pi_id: piId } }
  );
  return response.data;
};

export const calculateTeamCapacity = async (teamId: string, piId?: string): Promise<void> => {
  const params: Record<string, string> = {};
  if (piId) params.pi_id = piId;
  await api.post(`/capacity/teams/${teamId}/calculate`, null, { params });
};

export const overrideIterationCapacity = async (
  teamId: string,
  iterationId: string,
  data: CapacityOverrideRequest
): Promise<IterationCapacity> => {
  const response = await api.put<IterationCapacity>(
    `/capacity/teams/${teamId}/iterations/${iterationId}`,
    data
  );
  return response.data;
};

export const resetCapacityOverride = async (teamId: string, iterationId: string): Promise<void> => {
  await api.delete(`/capacity/teams/${teamId}/iterations/${iterationId}/override`);
};
```

---

## 5. Component Specifications

### 5.1 PICalendarTab (`pages/Setup/PICalendarTab/index.tsx`)

```typescript
interface PICalendarTabState {
  pis: PI[];
  loading: boolean;
  selectedYear: number;
  viewMode: 'timeline' | 'list';
  showFormPanel: boolean;
  editingPI: PI | null;
  showGenerateModal: boolean;
}

// Component responsibilities:
// - Load PIs for selected year
// - Toggle between timeline and list views
// - Open form panel for create/edit
// - Open generate modal
// - Handle PI CRUD operations
```

### 5.2 PITimeline (`PITimeline.tsx`)

```typescript
interface PITimelineProps {
  pis: PI[];
  year: number;
  holidays: Holiday[];
  onPIClick: (pi: PI) => void;
}

// Component responsibilities:
// - Render month/week header row
// - Render PI blocks positioned by date
// - Highlight current week
// - Show holiday indicators
// - Handle PI block click
```

### 5.3 PIBlock (`PIBlock.tsx`)

```typescript
interface PIBlockProps {
  pi: PI;
  isSelected: boolean;
  onClick: () => void;
}

// Component responsibilities:
// - Render PI container with status border
// - Render iteration chips inside
// - Show PI name and week range
// - Handle hover/click states
```

### 5.4 GeneratePIsModal (`GeneratePIsModal.tsx`)

```typescript
interface GeneratePIsModalProps {
  visible: boolean;
  year: number;
  onGenerate: (data: PIGenerateRequest) => Promise<void>;
  onClose: () => void;
}

// Component responsibilities:
// - Template selection (Standard, Quarterly, Custom)
// - Configuration form
// - Preview generated PIs
// - Submit generation request
```

### 5.5 HolidaysTab (`pages/Setup/HolidaysTab/index.tsx`)

```typescript
interface HolidaysTabState {
  holidays: Holiday[];
  loading: boolean;
  selectedYear: number;
  selectedMonth: number;
  viewMode: 'calendar' | 'list';
  showFormModal: boolean;
  editingHoliday: Holiday | null;
  showImportModal: boolean;
}

// Component responsibilities:
// - Load holidays for selected year
// - Toggle between calendar and list views
// - Handle holiday CRUD
// - Handle import from presets
```

### 5.6 HolidayCalendar (`HolidayCalendar.tsx`)

```typescript
interface HolidayCalendarProps {
  year: number;
  month: number;
  holidays: Holiday[];
  onDayClick: (date: Date) => void;
  onMonthChange: (month: number) => void;
}

// Component responsibilities:
// - Render month calendar grid
// - Highlight holidays with indicators
// - Handle day click for add/edit
// - Navigate between months
```

### 5.7 IterationCapacityView (`TeamsTab/IterationCapacityView.tsx`)

```typescript
interface IterationCapacityViewProps {
  piId: string;
  year: number;
  onRecalculate: () => void;
}

// Component responsibilities:
// - Load capacity summary for PI
// - Render capacity table with teams × iterations
// - Handle capacity override
// - Export to CSV
```

### 5.8 CapacityCell (`TeamsTab/CapacityCell.tsx`)

```typescript
interface CapacityCellProps {
  capacity: IterationCapacity;
  onOverride: () => void;
}

// Component responsibilities:
// - Render progress bar
// - Show allocated/total
// - Show utilization percentage
// - Color code by utilization level
// - Handle click for override
```

---

## 6. Utility Functions

### 6.1 Week Number Utilities (`utils/weekNumber.ts`)

```typescript
/**
 * Get ISO week number for a date
 */
export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get the Monday of a given ISO week
 */
export function getWeekStart(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - jan4.getDay() + 1);
  const result = new Date(startOfWeek1);
  result.setDate(startOfWeek1.getDate() + (week - 1) * 7);
  return result;
}

/**
 * Format week range string
 */
export function formatWeekRange(startWeek: number, endWeek: number): string {
  return `W${startWeek}-W${endWeek}`;
}

/**
 * Get all weeks in a year
 */
export function getWeeksInYear(year: number): number {
  const dec31 = new Date(year, 11, 31);
  return getISOWeek(dec31) === 1 ? 52 : getISOWeek(dec31);
}
```

### 6.2 Calendar Utilities (`utils/calendar.ts`)

```typescript
/**
 * Get all days in a month
 */
export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

/**
 * Check if date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Count working days between dates
 */
export function countWorkingDays(start: Date, end: Date, holidays: Date[] = []): number {
  let count = 0;
  const current = new Date(start);
  const holidaySet = new Set(holidays.map(d => d.toISOString().split('T')[0]));
  
  while (current <= end) {
    if (!isWeekend(current) && !holidaySet.has(current.toISOString().split('T')[0])) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
```

---

## 7. State Management

### 7.1 PI Context (Optional)

For complex state sharing, consider a PI context:

```typescript
interface PIContextValue {
  pis: PI[];
  selectedPI: PI | null;
  holidays: Holiday[];
  loading: boolean;
  selectPI: (pi: PI | null) => void;
  refreshPIs: () => Promise<void>;
  refreshHolidays: () => Promise<void>;
}

const PIContext = createContext<PIContextValue | null>(null);

export const usePIContext = () => {
  const context = useContext(PIContext);
  if (!context) throw new Error('usePIContext must be used within PIProvider');
  return context;
};
```

### 7.2 Local State Pattern

For simpler implementation, use local state with prop drilling:

```typescript
// In PICalendarTab
const [pis, setPIs] = useState<PI[]>([]);
const [selectedPI, setSelectedPI] = useState<PI | null>(null);

// Pass down to children
<PITimeline pis={pis} onPIClick={setSelectedPI} />
<PIFormPanel pi={selectedPI} onSave={handleSave} />
```

---

## 8. Setup Page Updates

### 8.1 Updated Tab Configuration

```typescript
// pages/Setup/index.tsx

const tabItems = [
  { key: 'products', label: 'Products' },
  { key: 'budgets', label: 'Budgets' },
  { key: 'teams', label: 'Teams' },
  { key: 'pi-calendar', label: 'PI Calendar' },  // NEW
  { key: 'holidays', label: 'Holidays' },        // NEW
  { key: 'settings', label: 'Settings' },
];

// Routes
<Route path="pi-calendar" element={<PICalendarTab />} />
<Route path="holidays" element={<HolidaysTab />} />
```

---

## 9. Implementation Order

### Phase 1: Foundation
1. Add types to `types/index.ts`
2. Add API functions to `services/api.ts`
3. Create utility functions

### Phase 2: PI Calendar
1. Create `PICalendarTab` structure
2. Implement `PITimeline` component
3. Implement `PIFormPanel`
4. Implement `GeneratePIsModal`

### Phase 3: Holidays
1. Create `HolidaysTab` structure
2. Implement `HolidayCalendar`
3. Implement `HolidayFormModal`
4. Implement `ImportPresetModal`

### Phase 4: Capacity
1. Implement `IterationCapacityView`
2. Implement `CapacityCell`
3. Update `TeamsTab` with new view toggle

### Phase 5: Member Leaves
1. Implement `MemberLeavesPanel`
2. Implement `LeaveCalendar`
3. Integrate with `TeamMembersPanel`

---

## 10. Agent Handoff

### Completed:
- ✅ Component structure defined
- ✅ TypeScript types specified
- ✅ API functions designed
- ✅ Utility functions planned
- ✅ State management approach

### Next Steps:

1. **@Backend-Developer**: Implement the backend models, routes, and services
2. **@Frontend-Developer**: Implement the UI components following this architecture

---

## 11. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-15 | Frontend Architect Agent | Initial architecture |
