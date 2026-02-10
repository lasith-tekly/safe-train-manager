# Frontend Architecture: Phase 3.2 - Spillover UX Improvements & Record Lifecycle

**Version:** 1.0  
**Date:** February 10, 2026  
**Status:** 🏗️ Architecture Design Complete

---

## Executive Summary

Phase 3.2 frontend focuses on:
1. Remove SPILLOVER from status dropdown
2. Make spillover details editable
3. Display complete record history
4. Enhanced status display with workflow + spillover overlay

**Scope:** Execution Planning components only  
**No Changes:** Capacity, Budget, PI Planning, Team modules

---

## Component Hierarchy

```
ExecutionPlanningPanel (UPDATE)
├── JiraRecordTable
│   ├── Status Column (UPDATE) - Workflow tag + Spillover badge
│   └── Actions - Spillover button visibility updated
│
├── JiraRecordModal (UPDATE)
│   ├── Workflow Status Dropdown (NO SPILLOVER option)
│   ├── Spillover Badge (read-only)
│   ├── SpilloverDetailsEditor (NEW - conditional)
│   └── RecordHistory (NEW - tab)
│
├── SpilloverDetailsEditor (NEW)
│   ├── Read-only: count, original PI, from PI
│   ├── Editable: category, reason, efforts
│   └── Validation + Save
│
└── RecordHistory (NEW)
    └── Timeline with color-coded events
```

---

## Files to Modify/Create

### 1. **frontend/src/types/jiraRecord.ts** (CREATE)

```typescript
export enum WorkflowStatus {
  PLANNED = 'PLANNED',
  IMPLEMENTING = 'IMPLEMENTING',
  INTERNAL_TESTING = 'INTERNAL_TESTING',
  LOAD_TO_UAT = 'LOAD_TO_UAT',
  CUSTOMER_TESTING = 'CUSTOMER_TESTING',
  LOAD_TO_PRD = 'LOAD_TO_PRD',
  COMPLETED = 'COMPLETED'
}

export enum SpilloverCategory {
  TECHNICAL_DEBT = 'technical_debt',
  DEPENDENCIES = 'dependencies',
  SCOPE_CREEP = 'scope_creep',
  RESOURCE_CONSTRAINTS = 'resource_constraints',
  EXTERNAL_FACTORS = 'external_factors'
}

export enum RecordEventType {
  CREATED = 'CREATED',
  STATUS_CHANGE = 'STATUS_CHANGE',
  SPILLOVER = 'SPILLOVER',
  SPILLOVER_EDIT = 'SPILLOVER_EDIT',
  FIELD_EDIT = 'FIELD_EDIT'
}

export interface JiraRecord {
  // Existing fields...
  workflow_status: WorkflowStatus;
  is_spillover: boolean;
  spillover_category?: SpilloverCategory;
  // ... other spillover fields
}

export interface RecordHistoryItem {
  id: string;
  jira_record_id: string;
  event_type: RecordEventType;
  from_value?: string;
  to_value?: string;
  from_pi_name?: string;
  to_pi_name?: string;
  spillover_effort?: number;
  completed_effort?: number;
  spillover_reason?: string;
  created_at: string;
}

export interface UpdateSpilloverDetailsRequest {
  spillover_reason: string;
  spillover_category: SpilloverCategory;
  spillover_effort: number;
  completed_effort: number;
  edit_reason?: string;
}
```

---

### 2. **frontend/src/services/jiraRecordApi.ts** (UPDATE)

Add new API methods:

```typescript
// NEW: Update spillover details
export const updateSpilloverDetails = async (
  recordId: string,
  data: UpdateSpilloverDetailsRequest
): Promise<JiraRecord> => {
  const response = await axios.put(
    `${API_BASE_URL}/jira-records/${recordId}/spillover`,
    data
  );
  return response.data;
};

// NEW: Get record history
export const getRecordHistory = async (
  recordId: string,
  limit: number = 50
): Promise<RecordHistoryResponse> => {
  const response = await axios.get(
    `${API_BASE_URL}/jira-records/${recordId}/history?limit=${limit}`
  );
  return response.data;
};
```

---

### 3. **frontend/src/pages/RoadmapV4/components/RecordHistory.tsx** (CREATE)

```typescript
interface RecordHistoryProps {
  recordId: string;
}

export const RecordHistory: React.FC<RecordHistoryProps> = ({ recordId }) => {
  const [history, setHistory] = useState<RecordHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [recordId]);

  const loadHistory = async () => {
    try {
      const response = await getRecordHistory(recordId);
      setHistory(response.data);
    } catch (error) {
      message.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <Timeline mode="left">
        {history.map(event => (
          <Timeline.Item
            key={event.id}
            color={getEventColor(event.event_type)}
            dot={getEventIcon(event.event_type)}
          >
            <EventDetails event={event} />
          </Timeline.Item>
        ))}
      </Timeline>
    </Spin>
  );
};

// Event colors: CREATED=green, STATUS_CHANGE=blue, SPILLOVER=orange, EDIT=purple
```

---

### 4. **frontend/src/pages/RoadmapV4/components/SpilloverDetailsEditor.tsx** (CREATE)

```typescript
interface SpilloverDetailsEditorProps {
  record: JiraRecord;
  onSave: (data: UpdateSpilloverDetailsRequest) => Promise<void>;
}

export const SpilloverDetailsEditor: React.FC<SpilloverDetailsEditorProps> = ({
  record,
  onSave
}) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    spillover_reason: record.spillover_reason || '',
    spillover_category: record.spillover_category || 'dependencies',
    spillover_effort: record.spillover_effort || 0,
    completed_effort: record.completed_effort || 0
  });

  const validate = () => {
    const total = formData.spillover_effort + formData.completed_effort;
    if (total > record.planned_effort) {
      return `Total (${total}) exceeds planned (${record.planned_effort})`;
    }
    if (formData.spillover_effort < 0.5) {
      return 'Spillover must be ≥ 0.5 eD';
    }
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      message.error(error);
      return;
    }
    await onSave(formData);
    setEditing(false);
  };

  return (
    <Card title="Spillover Details">
      {/* Read-only info */}
      <Descriptions size="small">
        <Item label="Count"><Badge count={record.spillover_count} /></Item>
        <Item label="Original PI">{record.original_pi_name}</Item>
      </Descriptions>

      {editing ? (
        <Form>
          <Form.Item label="Category">
            <Select value={formData.spillover_category} onChange={...}>
              <Option value="dependencies">Dependencies</Option>
              <Option value="scope_creep">Scope Creep</Option>
              {/* ... other options */}
            </Select>
          </Form.Item>
          <Form.Item label="Reason">
            <TextArea value={formData.spillover_reason} maxLength={500} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <InputNumber label="Spillover (eD)" value={formData.spillover_effort} />
            </Col>
            <Col span={12}>
              <InputNumber label="Completed (eD)" value={formData.completed_effort} />
            </Col>
          </Row>
          <Button type="primary" onClick={handleSave}>Save</Button>
        </Form>
      ) : (
        <>
          <Descriptions>
            <Item label="Category">{record.spillover_category}</Item>
            <Item label="Reason">{record.spillover_reason}</Item>
          </Descriptions>
          <Button onClick={() => setEditing(true)}>Edit</Button>
        </>
      )}
    </Card>
  );
};
```

---

### 5. **frontend/src/pages/RoadmapV4/components/JiraRecordModal.tsx** (UPDATE)

**Changes:**

1. **Remove SPILLOVER from dropdown:**
```tsx
<Select value={record.workflow_status}>
  <Option value="PLANNED">📋 Planned</Option>
  <Option value="IMPLEMENTING">🔧 Implementing</Option>
  <Option value="INTERNAL_TESTING">🧪 Internal Testing</Option>
  <Option value="LOAD_TO_UAT">📤 Load to UAT</Option>
  <Option value="CUSTOMER_TESTING">👥 Customer Testing</Option>
  <Option value="LOAD_TO_PRD">🚀 Load to PRD</Option>
  <Option value="COMPLETED">✅ Completed</Option>
  {/* NO SPILLOVER */}
</Select>
```

2. **Add spillover badge:**
```tsx
{record.is_spillover && (
  <Alert type="warning">
    <Tag color="orange">↔️ SPILLOVER ×{record.spillover_count}</Tag>
  </Alert>
)}
```

3. **Add tabs:**
```tsx
<Tabs>
  <TabPane tab="Details" key="details">
    {/* Form fields */}
    {record.is_spillover && (
      <SpilloverDetailsEditor record={record} onSave={handleSpilloverUpdate} />
    )}
  </TabPane>
  <TabPane tab="History" key="history">
    <RecordHistory recordId={record.id} />
  </TabPane>
</Tabs>
```

---

### 6. **frontend/src/pages/RoadmapV4/components/ExecutionPlanningPanel.tsx** (UPDATE)

**Status Column:**
```tsx
<Space direction="vertical">
  <Tag color={getWorkflowColor(record.workflow_status)}>
    {record.workflow_status}
  </Tag>
  {record.is_spillover && (
    <Tag color="orange">↔️ SPILLOVER ×{record.spillover_count}</Tag>
  )}
</Space>
```

**Spillover Button:**
```tsx
{record.workflow_status !== 'COMPLETED' && 
 record.workflow_status !== 'LOAD_TO_PRD' && (
  <Button icon={<SwapOutlined />}>
    {record.is_spillover ? 'Cascading' : 'Mark as Spillover'}
  </Button>
)}
```

---

## Color Palette

```typescript
const COLORS = {
  PLANNED: '#1890ff',
  IMPLEMENTING: '#722ed1',
  INTERNAL_TESTING: '#faad14',
  LOAD_TO_UAT: '#13c2c2',
  CUSTOMER_TESTING: '#52c41a',
  LOAD_TO_PRD: '#eb2f96',
  COMPLETED: '#52c41a',
  SPILLOVER: '#fa8c16'
};
```

---

## Validation Rules

```typescript
// Spillover effort validation
spillover_effort + completed_effort ≤ planned_effort
spillover_effort ≥ 0.5
completed_effort ≥ 0
reason: 10-500 chars
```

---

## Implementation Order

1. Create types file
2. Update API service
3. Create RecordHistory component
4. Create SpilloverDetailsEditor component
5. Update JiraRecordModal
6. Update ExecutionPlanningPanel
7. Test integration

---

**Architecture Complete**  
**Ready For:** Frontend Implementation  
**Estimated Effort:** 8-12 hours
