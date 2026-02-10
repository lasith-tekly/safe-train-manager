# Frontend Architecture: Partial Spillover & Cascading History

**Version:** 1.0 | **Date:** Feb 10, 2026 | **Phase:** 3.1

---

## Component Architecture

```
ExecutionPlanningPanel (UPDATED)
├── SpilloverSummary (ENHANCED)
│   └── Display total spillover/completed effort + cascading count
├── JiraRecordsTable (ENHANCED)
│   └── Status Column: Add cascading badge (×2, ×3+)
├── SpilloverModal (ENHANCED)
│   ├── Effort Breakdown Section (NEW)
│   │   ├── Completed Effort InputNumber
│   │   └── Spillover Effort InputNumber
│   ├── Effort Summary Alert (validation)
│   └── Cascading Warning Alert (if spillover_count > 0)
└── JiraRecordModal (UPDATED)
    └── SpilloverHistory Timeline (NEW)
```

---

## TypeScript Interfaces

### Updated JiraRecord
```typescript
export interface JiraRecord {
  // ... existing fields
  spillover_effort?: number;
  completed_effort?: number;
  spillover_count?: number;
  original_pi_id?: string;
  original_pi_name?: string;
}
```

### New Spillover History
```typescript
export interface SpilloverHistoryItem {
  id: string;
  sequence: number;
  from_pi_name: string | null;
  to_pi_name: string | null;
  spillover_effort: number;
  completed_effort: number;
  reason: string;
  category: string | null;
  created_at: string;
}

export interface SpilloverHistoryResponse {
  data: SpilloverHistoryItem[];
  total: number;
}
```

### Updated Spillover Request
```typescript
export interface MarkSpilloverRequest {
  new_pi_id: string;
  spillover_from_pi_id: string;
  spillover_reason: string;
  spillover_category: string;
  spillover_effort?: number;      // NEW
  completed_effort?: number;      // NEW
}
```

---

## API Contracts

### New Endpoint
```typescript
// GET /api/jira-records/{record_id}/spillover-history
getSpilloverHistory(recordId: string): Promise<SpilloverHistoryResponse>
```

### Updated Endpoint
```typescript
// POST /api/jira-records/{record_id}/spillover
// NOW ACCEPTS: spillover_effort, completed_effort
markAsSpillover(recordId: string, data: MarkSpilloverRequest): Promise<JiraRecord>
```

---

## State Management

### SpilloverModal Form State
```typescript
interface SpilloverFormValues {
  spillover_from_pi_id: string;
  new_pi_id: string;
  spillover_reason: string;
  spillover_category: string;
  spillover_effort: number;      // Default: planned_effort
  completed_effort: number;      // Default: 0
}

// Validation
const totalEffort = spilloverEffort + completedEffort;
const isValid = totalEffort <= plannedEffort && spilloverEffort >= 0.5;
```

---

## Data Flow

### 1. Open SpilloverModal
```
Click "Mark as Spillover" → Initialize form:
  - spillover_effort = record.planned_effort
  - completed_effort = 0
  - Show cascading warning if spillover_count > 0
```

### 2. Effort Input & Validation
```
User changes effort → Calculate total → Validate → Update alert → Enable/disable submit
```

### 3. Submit Spillover
```
Submit → API call → Backend updates record + creates history → Refresh list → Success message
```

### 4. View History
```
Open edit modal → Fetch history → Render timeline (green → orange → blue)
```

---

## Component Specifications

### 1. SpilloverModal Enhancements

**New Section: Effort Breakdown**
```tsx
<Divider>Effort Breakdown</Divider>
<Row gutter={16}>
  <Col span={12}>
    <Form.Item name="completed_effort" label="Completed (eD)">
      <InputNumber min={0} step={0.5} />
    </Form.Item>
  </Col>
  <Col span={12}>
    <Form.Item name="spillover_effort" label="Spillover (eD)">
      <InputNumber min={0.5} step={0.5} />
    </Form.Item>
  </Col>
</Row>
<Alert type={isValid ? 'info' : 'error'} 
  message={`Total: ${total} / ${planned} ${isValid ? '✓' : '✗'}`} 
/>
```

**Cascading Warning (conditional)**
```tsx
{record.spillover_count > 0 && (
  <Alert type="warning" message={
    `Cascading Spillover: ${count} previous events. Originally: ${originalPI}`
  } />
)}
```

### 2. SpilloverHistory Component (NEW)

**File:** `frontend/src/pages/RoadmapV4/components/SpilloverHistory.tsx`

```tsx
interface Props {
  recordId: string;
  originalPiName?: string;
  currentPiName?: string;
  plannedEffort: number;
}

export const SpilloverHistory: React.FC<Props> = ({ recordId, ... }) => {
  const [history, setHistory] = useState<SpilloverHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [recordId]);

  return (
    <Timeline>
      <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
        Originally Planned: {originalPiName} - {plannedEffort} eD
      </Timeline.Item>
      
      {history.map(event => (
        <Timeline.Item key={event.id} color="orange" dot={<SwapOutlined />}>
          Spillover #{event.sequence}: {event.from_pi_name} → {event.to_pi_name}
          <Tag color="orange">{event.spillover_effort} eD</Tag>
          <Tag color="green">{event.completed_effort} eD done</Tag>
          <div>{event.reason}</div>
        </Timeline.Item>
      ))}
      
      <Timeline.Item color="blue" dot={<ClockCircleOutlined />}>
        Current: {currentPiName}
      </Timeline.Item>
    </Timeline>
  );
};
```

### 3. Table Cascading Badge

```tsx
// In Status column render
{record.status === 'SPILLOVER' && (
  <Space>
    <Tag color="orange">SPILLOVER</Tag>
    {record.spillover_count > 1 && (
      <Badge 
        count={`×${record.spillover_count}`}
        style={{ backgroundColor: record.spillover_count >= 3 ? '#f5222d' : '#fa8c16' }}
      />
    )}
  </Space>
)}
```

---

## Implementation Plan

### Files to Modify

1. **`frontend/src/services/jiraRecordApi.ts`**
   - Add new interfaces
   - Add `getSpilloverHistory()` function
   - Update `MarkSpilloverRequest` interface

2. **`frontend/src/pages/RoadmapV4/components/SpilloverModal.tsx`**
   - Add effort breakdown inputs
   - Add validation logic
   - Add cascading warning alert
   - Update form submission

3. **`frontend/src/pages/RoadmapV4/components/SpilloverHistory.tsx`** (NEW)
   - Create timeline component
   - Implement history fetching
   - Add loading/error states

4. **`frontend/src/pages/RoadmapV4/components/JiraRecordModal.tsx`**
   - Add SpilloverHistory component
   - Display effort breakdown in read-only mode
   - Show cascading count badge

5. **`frontend/src/pages/RoadmapV4/components/ExecutionPlanningPanel.tsx`**
   - Update table status column
   - Enhance spillover summary display
   - Add cascading count to summary

---

## Validation Rules

1. **Effort Sum:** `spillover_effort + completed_effort ≤ planned_effort`
2. **Minimum Spillover:** `spillover_effort ≥ 0.5 eD`
3. **Non-negative:** `completed_effort ≥ 0`
4. **Real-time feedback:** Alert updates as user types

---

## Color Palette

```css
--spillover-orange: #fa8c16
--completed-green: #52c41a
--cascading-red: #f5222d
--info-blue: #1890ff
```

---

**Status:** Ready for Implementation  
**Backend:** ✅ Complete  
**Next Step:** Implement frontend components
