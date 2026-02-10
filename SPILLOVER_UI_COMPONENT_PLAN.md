# Spillover Tracking UI - Component Architecture Plan

**Created:** February 9, 2026  
**Status:** Ready for Implementation  
**Design Reference:** SPILLOVER_TRACKING_UI_DESIGN.md

---

## 1. Component Structure Overview

### New Components
```
frontend/src/pages/RoadmapV4/components/
├── SpilloverModal.tsx          (NEW - 300 lines)
└── SpilloverSummary.tsx        (NEW - 150 lines)
```

### Modified Components
```
frontend/src/pages/RoadmapV4/components/
└── ExecutionPlanningPanel.tsx  (MODIFY - add spillover integration)
```

### Updated Services
```
frontend/src/services/
└── jiraRecordApi.ts            (UPDATE - fix markAsSpillover signature)
```

---

## 2. SpilloverModal Component

### File: `frontend/src/pages/RoadmapV4/components/SpilloverModal.tsx`

### Props Interface
```typescript
interface SpilloverModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record: JiraRecord | null;
}
```

### Component Structure
```tsx
export const SpilloverModal: React.FC<SpilloverModalProps> = ({
  open,
  onClose,
  onSuccess,
  record
}) => {
  // State
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pis, setPis] = useState<PI[]>([]);
  const [characterCount, setCharacterCount] = useState(0);

  // Hooks
  useEffect(() => {
    if (open && record) {
      fetchPIs();
      form.resetFields();
    }
  }, [open, record]);

  // Handlers
  const fetchPIs = async () => { /* Fetch available PIs */ };
  const handleSubmit = async (values: FormValues) => { /* Submit spillover */ };
  const handleReasonChange = (e: ChangeEvent) => { /* Update character count */ };

  // Render
  return (
    <Modal
      title={<SpilloverModalTitle />}
      open={open}
      onCancel={onClose}
      width={600}
      footer={<SpilloverModalFooter />}
      destroyOnClose
      zIndex={1100}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Current Record Info Alert */}
        <Alert type="info" showIcon message="Current JIRA Record" />
        
        {/* Form */}
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Original PI Dropdown */}
          <Form.Item name="spillover_from_pi_id" label="Original PI" rules={[...]}>
            <Select placeholder="Select the PI where work was originally planned">
              {pis.map(pi => <Option key={pi.id} value={pi.id}>{pi.name}</Option>)}
            </Select>
          </Form.Item>

          {/* Spillover Reason Textarea */}
          <Form.Item name="spillover_reason" label="Spillover Reason" rules={[...]}>
            <Input.TextArea 
              rows={4} 
              maxLength={500}
              onChange={handleReasonChange}
              placeholder="Explain why this work is spilling over..."
            />
          </Form.Item>
          <div style={{ textAlign: 'right', color: '#8c8c8c' }}>
            {characterCount}/500 characters
          </div>

          {/* Category Dropdown */}
          <Form.Item name="spillover_category" label="Spillover Category" rules={[...]}>
            <Select placeholder="Select spillover category">
              <Option value="technical_debt">
                <Space><ToolOutlined /> Technical Debt</Space>
              </Option>
              <Option value="dependencies">
                <Space><LinkOutlined /> Dependencies</Space>
              </Option>
              <Option value="scope_creep">
                <Space><ExpandOutlined /> Scope Creep</Space>
              </Option>
              <Option value="resource_constraints">
                <Space><TeamOutlined /> Resource Constraints</Space>
              </Option>
              <Option value="external_factors">
                <Space><GlobalOutlined /> External Factors</Space>
              </Option>
              <Option value="other">
                <Space><QuestionCircleOutlined /> Other</Space>
              </Option>
            </Select>
          </Form.Item>

          {/* Helper Text */}
          <Alert
            type="warning"
            message="Examples of good spillover reasons:"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>Waiting for API integration from Team X (ETA: Q2)</li>
                <li>Technical complexity higher than estimated, needs 2 more sprints</li>
                <li>Customer requested scope change mid-development</li>
              </ul>
            }
            showIcon
          />
        </Form>
      </Space>
    </Modal>
  );
};
```

### Form Validation Rules
```typescript
const validationRules = {
  spillover_from_pi_id: [
    { required: true, message: 'Please select the original PI' }
  ],
  spillover_reason: [
    { required: true, message: 'Please provide a spillover reason' },
    { min: 10, message: 'Reason must be at least 10 characters' },
    { max: 500, message: 'Reason cannot exceed 500 characters' },
    {
      validator: (_, value) => {
        const meaningless = ['n/a', 'tbd', 'delayed', 'late', 'na'];
        if (meaningless.includes(value?.toLowerCase()?.trim())) {
          return Promise.reject('Please provide a meaningful reason');
        }
        return Promise.resolve();
      }
    }
  ],
  spillover_category: [
    { required: true, message: 'Please select a category' }
  ]
};
```

### API Integration
```typescript
const handleSubmit = async (values: FormValues) => {
  if (!record) return;
  
  setLoading(true);
  try {
    await jiraRecordApi.markAsSpillover(record.id, {
      new_pi_id: record.pi_id!, // Current PI becomes new PI
      spillover_from_pi_id: values.spillover_from_pi_id,
      spillover_reason: values.spillover_reason,
      spillover_category: values.spillover_category
    });
    
    message.success('JIRA record marked as spillover');
    onSuccess();
    onClose();
  } catch (error: any) {
    const errorMsg = error.response?.data?.detail || 'Failed to mark as spillover';
    message.error(errorMsg);
  } finally {
    setLoading(false);
  }
};
```

---

## 3. SpilloverSummary Component

### File: `frontend/src/pages/RoadmapV4/components/SpilloverSummary.tsx`

### Props Interface
```typescript
interface SpilloverSummaryProps {
  spilloverSummary: {
    count: number;
    total_effort: number;
    by_source_pi: Array<{
      pi_id: string;
      pi_name: string;
      count: number;
      effort: number;
    }>;
  } | null;
}
```

### Component Structure
```tsx
export const SpilloverSummary: React.FC<SpilloverSummaryProps> = ({ spilloverSummary }) => {
  const [expanded, setExpanded] = useState(false);

  if (!spilloverSummary || spilloverSummary.count === 0) {
    return null;
  }

  return (
    <Alert
      message={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <SwapOutlined style={{ color: '#faad14' }} />
            <Text strong>Spillover Summary</Text>
          </Space>
          <Button
            type="text"
            size="small"
            icon={expanded ? <UpOutlined /> : <DownOutlined />}
            onClick={() => setExpanded(!expanded)}
          />
        </Space>
      }
      description={
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            <strong>{spilloverSummary.count}</strong> record{spilloverSummary.count !== 1 ? 's' : ''} 
            ({spilloverSummary.total_effort.toFixed(1)} eD) spilled from previous PIs
          </Text>
          
          {expanded && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <Text strong>Breakdown by Source PI:</Text>
              {spilloverSummary.by_source_pi.map((item) => (
                <Text key={item.pi_id}>
                  • {item.pi_name}: {item.count} record{item.count !== 1 ? 's' : ''} 
                  ({item.effort.toFixed(1)} eD)
                </Text>
              ))}
            </>
          )}
        </Space>
      }
      type="warning"
      showIcon
      style={{
        borderColor: '#faad14',
        backgroundColor: '#fff7e6'
      }}
    />
  );
};
```

---

## 4. ExecutionPlanningPanel Modifications

### New State Variables
```typescript
// Add to existing state
const [spilloverModalOpen, setSpilloverModalOpen] = useState(false);
const [selectedRecord, setSelectedRecord] = useState<JiraRecord | null>(null);
const [spilloverSummary, setSpilloverSummary] = useState<SpilloverSummary | null>(null);
```

### Updated fetchJiraRecords
```typescript
const fetchJiraRecords = async () => {
  if (!feature) return;
  setLoading(true);
  try {
    const response = await jiraRecordApi.list(feature.id);
    setJiraRecords(response.data || []);
    
    // NEW: Extract spillover summary
    setSpilloverSummary(response.spillover_summary || null);
  } catch (error) {
    console.error('Failed to fetch JIRA records:', error);
    message.error('Failed to fetch JIRA records');
  } finally {
    setLoading(false);
  }
};
```

### New Handler Functions
```typescript
const handleMarkSpillover = (record: JiraRecord) => {
  // Validation: Only allow PLANNED or IN_PROGRESS records
  if (record.status === 'SPILLOVER') {
    message.warning('This record is already marked as spillover');
    return;
  }
  
  if (record.status === 'COMPLETED') {
    message.warning('Cannot mark completed records as spillover');
    return;
  }
  
  if (!record.pi_id) {
    message.warning('Record must have a PI assigned before marking as spillover');
    return;
  }
  
  setSelectedRecord(record);
  setSpilloverModalOpen(true);
};

const handleSpilloverSuccess = () => {
  setSpilloverModalOpen(false);
  setSelectedRecord(null);
  fetchJiraRecords(); // Refresh table and summary
};
```

### Updated Table Columns

#### Actions Column (Modified)
```typescript
{
  title: 'Actions',
  width: 120, // Increased from 100
  align: 'center' as const,
  render: (_: any, record: JiraRecord) => (
    <Space size="small">
      <Tooltip title="Edit">
        <Button 
          size="small" 
          icon={<EditOutlined />} 
          onClick={() => handleEdit(record)}
        />
      </Tooltip>
      
      {/* NEW: Spillover Button - Only show if not already spillover */}
      {record.status !== 'SPILLOVER' && (
        <Tooltip title="Mark as Spillover">
          <Button
            size="small"
            icon={<SwapOutlined />}
            onClick={() => handleMarkSpillover(record)}
            style={{ color: '#faad14' }}
          />
        </Tooltip>
      )}
      
      <Tooltip title="Delete">
        <Button 
          size="small" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => handleDelete(record.id)}
        />
      </Tooltip>
    </Space>
  ),
}
```

#### Status Column (Modified)
```typescript
{
  title: 'Status',
  dataIndex: 'status',
  width: 160, // Increased from 130
  align: 'center' as const,
  render: (status: string, record: JiraRecord) => {
    if (status === 'SPILLOVER') {
      return (
        <Space size={8}>
          <SwapOutlined style={{ color: '#faad14', fontSize: 16 }} />
          <Tag 
            color="orange" 
            style={{ 
              borderColor: '#faad14', 
              backgroundColor: '#fff7e6' 
            }}
          >
            SPILLOVER
          </Tag>
          {record.spillover_from_pi_name && (
            <Tooltip 
              title={
                <div>
                  <div><strong>Spillover from:</strong> {record.spillover_from_pi_name}</div>
                  <div><strong>Reason:</strong> {record.spillover_reason}</div>
                </div>
              }
            >
              <InfoCircleOutlined style={{ color: '#faad14' }} />
            </Tooltip>
          )}
        </Space>
      );
    }
    
    return (
      <Space>
        <Tag color={statusColors[status]}>{status}</Tag>
        {record.spillover_reason && (
          <Tooltip title={`Spillover: ${record.spillover_reason}`}>
            <WarningOutlined style={{ color: '#ff4d4f' }} />
          </Tooltip>
        )}
      </Space>
    );
  },
}
```

### Table Row Styling
```typescript
<Table
  dataSource={jiraRecords}
  columns={columns}
  rowKey="id"
  loading={loading}
  pagination={{ pageSize: 10, showSizeChanger: false }}
  size="small"
  // NEW: Add row className for spillover styling
  rowClassName={(record) => 
    record.status === 'SPILLOVER' ? 'spillover-row' : ''
  }
  locale={{
    emptyText: 'No JIRA records yet. Click "Add JIRA Record" to start.'
  }}
/>
```

### Updated Layout (Inside Drawer)
```tsx
<Space direction="vertical" size="large" style={{ width: '100%' }}>
  {/* Strategic Allocation Summary */}
  <div>...</div>

  {/* Execution Progress */}
  <div>...</div>

  {/* Deviation Alert */}
  {Math.abs(gap) > 0.5 && <Alert ... />}

  {/* NEW: Spillover Summary - Add after Deviation Alert */}
  <SpilloverSummary spilloverSummary={spilloverSummary} />

  {/* Add Button */}
  <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} block>
    Add JIRA Record
  </Button>

  {/* JIRA Records Table */}
  <Table ... />
</Space>
```

### New Imports
```typescript
import { SwapOutlined, InfoCircleOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import { SpilloverModal } from './SpilloverModal';
import { SpilloverSummary } from './SpilloverSummary';
```

### Add Modals at Bottom
```tsx
{/* Add/Edit Modal */}
<JiraRecordModal
  open={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={handleModalSuccess}
  feature={feature}
  record={editingRecord}
/>

{/* NEW: Spillover Modal */}
<SpilloverModal
  open={spilloverModalOpen}
  onClose={() => setSpilloverModalOpen(false)}
  onSuccess={handleSpilloverSuccess}
  record={selectedRecord}
/>
```

---

## 5. API Service Updates

### File: `frontend/src/services/jiraRecordApi.ts`

### Update JiraRecord Interface
```typescript
export interface JiraRecord {
  id: string;
  jira_key?: string;
  title: string;
  description?: string;
  feature_id: string;
  feature_name?: string;
  team_id?: string;
  team_name?: string;
  pi_id?: string;
  pi_name?: string;
  planned_effort: number;
  actual_effort?: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SPILLOVER';
  spillover_from_pi_id?: string;
  spillover_from_pi_name?: string;
  spillover_reason?: string;
  spillover_category?: string; // NEW
  created_at: string;
  updated_at: string;
}
```

### Update JiraRecordListResponse Interface
```typescript
export interface JiraRecordListResponse {
  data: JiraRecord[];
  total: number;
  summary?: {
    total_planned_effort: number;
    total_actual_effort: number;
    by_status: Record<string, number>;
    by_pi: Record<string, number>;
    by_team: Record<string, number>;
  };
  // NEW: Add spillover_summary
  spillover_summary?: {
    count: number;
    total_effort: number;
    by_source_pi: Array<{
      pi_id: string;
      pi_name: string;
      count: number;
      effort: number;
    }>;
  };
}
```

### Update markAsSpillover Method
```typescript
/**
 * Mark JIRA record as spillover
 */
markAsSpillover: async (recordId: string, data: {
  new_pi_id: string;
  spillover_from_pi_id: string;
  spillover_reason: string;
  spillover_category: string; // NEW
}): Promise<JiraRecord> => {
  const response = await axios.post(
    `${API_BASE_URL}/jira-records/${recordId}/spillover`,
    data
  );
  return response.data;
},
```

---

## 6. CSS Styling

### File: `frontend/src/pages/RoadmapV4/components/ExecutionPlanningPanel.module.css` (NEW)

```css
.spilloverRow {
  background-color: rgba(250, 173, 20, 0.05);
  border-left: 3px solid #faad14;
}

.spilloverRow:hover {
  background-color: rgba(250, 173, 20, 0.1);
}

.spilloverButton {
  color: #faad14;
}

.spilloverButton:hover {
  color: #fa8c16;
  background-color: #fff7e6;
}
```

### Import in ExecutionPlanningPanel.tsx
```typescript
import styles from './ExecutionPlanningPanel.module.css';

// Use in Table
rowClassName={(record) => 
  record.status === 'SPILLOVER' ? styles.spilloverRow : ''
}
```

---

## 7. TypeScript Interfaces Summary

### New Interfaces
```typescript
// SpilloverModal
interface SpilloverModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record: JiraRecord | null;
}

interface SpilloverFormValues {
  spillover_from_pi_id: string;
  spillover_reason: string;
  spillover_category: string;
}

// SpilloverSummary
interface SpilloverSummaryProps {
  spilloverSummary: {
    count: number;
    total_effort: number;
    by_source_pi: Array<{
      pi_id: string;
      pi_name: string;
      count: number;
      effort: number;
    }>;
  } | null;
}

// PI Interface (for dropdown)
interface PI {
  id: string;
  name: string;
  year: number;
  sequence: number;
  start_date: string;
  end_date: string;
  status: string;
}
```

---

## 8. State Management

### ExecutionPlanningPanel State
```typescript
// Existing state
const [jiraRecords, setJiraRecords] = useState<JiraRecord[]>([]);
const [loading, setLoading] = useState(false);
const [showModal, setShowModal] = useState(false);
const [editingRecord, setEditingRecord] = useState<JiraRecord | null>(null);

// NEW state for spillover
const [spilloverModalOpen, setSpilloverModalOpen] = useState(false);
const [selectedRecord, setSelectedRecord] = useState<JiraRecord | null>(null);
const [spilloverSummary, setSpilloverSummary] = useState<SpilloverSummary | null>(null);
```

### SpilloverModal State
```typescript
const [form] = Form.useForm();
const [loading, setLoading] = useState(false);
const [pis, setPis] = useState<PI[]>([]);
const [characterCount, setCharacterCount] = useState(0);
```

### SpilloverSummary State
```typescript
const [expanded, setExpanded] = useState(false);
```

---

## 9. Data Flow

### Spillover Marking Flow
```
1. User clicks spillover button on JIRA record
   ↓
2. handleMarkSpillover() validates record
   ↓
3. SpilloverModal opens with record data
   ↓
4. Modal fetches available PIs from API
   ↓
5. User fills form (original PI, reason, category)
   ↓
6. Form validation runs on submit
   ↓
7. API call: POST /jira-records/{id}/spillover
   ↓
8. Success: Modal closes, table refreshes
   ↓
9. fetchJiraRecords() updates records + spillover summary
   ↓
10. UI shows updated record with spillover styling
```

### Data Refresh Flow
```
fetchJiraRecords()
  ↓
API: GET /features/{id}/jira-records
  ↓
Response: { data: [...], total: N, spillover_summary: {...} }
  ↓
setJiraRecords(response.data)
setSpilloverSummary(response.spillover_summary)
  ↓
Table re-renders with spillover styling
SpilloverSummary component shows/hides based on data
```

---

## 10. File Structure

```
frontend/src/
├── pages/
│   └── RoadmapV4/
│       ├── components/
│       │   ├── ExecutionPlanningPanel.tsx       (MODIFY - 320 lines)
│       │   ├── ExecutionPlanningPanel.module.css (NEW - 15 lines)
│       │   ├── SpilloverModal.tsx               (NEW - 300 lines)
│       │   ├── SpilloverSummary.tsx             (NEW - 80 lines)
│       │   └── JiraRecordModal.tsx              (EXISTING - no changes)
│       └── ProductRoadmapPage.tsx               (EXISTING - no changes)
└── services/
    └── jiraRecordApi.ts                         (MODIFY - update interfaces)
```

---

## 11. Implementation Checklist

### Phase 1: API Service Updates
- [ ] Update `JiraRecord` interface to include `spillover_category`
- [ ] Update `JiraRecordListResponse` to include `spillover_summary`
- [ ] Update `markAsSpillover` method signature
- [ ] Test API service changes

### Phase 2: SpilloverSummary Component
- [ ] Create `SpilloverSummary.tsx`
- [ ] Implement collapsible summary with breakdown
- [ ] Add proper styling (warning colors)
- [ ] Test with mock data

### Phase 3: SpilloverModal Component
- [ ] Create `SpilloverModal.tsx`
- [ ] Implement form with 3 fields (PI, reason, category)
- [ ] Add validation rules
- [ ] Implement character counter
- [ ] Add category icons
- [ ] Implement API integration
- [ ] Add loading states and error handling
- [ ] Test form validation

### Phase 4: ExecutionPlanningPanel Updates
- [ ] Add new state variables
- [ ] Update `fetchJiraRecords` to extract spillover summary
- [ ] Add `handleMarkSpillover` handler
- [ ] Update Actions column to include spillover button
- [ ] Update Status column to show spillover indicators
- [ ] Add `SpilloverSummary` component to layout
- [ ] Add `SpilloverModal` component
- [ ] Create CSS module for spillover row styling
- [ ] Update imports

### Phase 5: Testing
- [ ] Test spillover button visibility logic
- [ ] Test modal open/close
- [ ] Test form validation (all rules)
- [ ] Test API error handling
- [ ] Test table refresh after spillover
- [ ] Test spillover summary display
- [ ] Test spillover row styling
- [ ] Test responsive layout
- [ ] Test keyboard navigation
- [ ] Test with real backend API

---

## 12. Dependencies

### New Ant Design Icons
```typescript
import {
  SwapOutlined,        // Spillover icon
  InfoCircleOutlined,  // Info tooltip
  UpOutlined,          // Collapse
  DownOutlined,        // Expand
  ToolOutlined,        // Technical debt icon
  LinkOutlined,        // Dependencies icon
  ExpandOutlined,      // Scope creep icon
  TeamOutlined,        // Resource constraints icon
  GlobalOutlined,      // External factors icon
  QuestionCircleOutlined // Other icon
} from '@ant-design/icons';
```

### Existing Dependencies (No Changes)
- React 18+
- Ant Design 5.x
- Axios
- TypeScript 5.x

---

## 13. Accessibility Considerations

### Keyboard Navigation
- Modal: ESC to close, Tab to navigate fields, Enter to submit
- Buttons: Tab to focus, Enter/Space to activate
- Dropdowns: Arrow keys to navigate options

### ARIA Labels
```typescript
<Button 
  aria-label="Mark JIRA record as spillover"
  icon={<SwapOutlined />}
/>

<Modal 
  role="dialog"
  aria-labelledby="spillover-modal-title"
/>

<Form.Item 
  name="spillover_reason"
  aria-required="true"
/>
```

### Screen Reader Announcements
- Modal open: "Mark as spillover dialog opened"
- Form error: Error messages read automatically
- Success: "JIRA record marked as spillover from [PI Name]"

---

## 14. Error Handling

### Validation Errors
```typescript
// Client-side validation
- Empty fields → "Please provide [field name]"
- Short reason → "Reason must be at least 10 characters"
- Meaningless reason → "Please provide a meaningful reason"

// Server-side validation (from API)
- 404 → "JIRA record not found"
- 400 → Display specific validation error from backend
- 500 → "Failed to mark as spillover. Please try again."
```

### Network Errors
```typescript
try {
  await jiraRecordApi.markAsSpillover(...);
} catch (error: any) {
  if (error.response) {
    // Server responded with error
    message.error(error.response.data.detail || 'Server error');
  } else if (error.request) {
    // No response received
    message.error('Network error. Please check your connection.');
  } else {
    // Other errors
    message.error('An unexpected error occurred');
  }
}
```

---

## 15. Performance Considerations

### Optimization Strategies
1. **Memoization**: Use `useMemo` for filtered PI lists
2. **Debouncing**: Character counter updates (already handled by React)
3. **Lazy Loading**: Load PIs only when modal opens
4. **Conditional Rendering**: SpilloverSummary only renders if data exists
5. **destroyOnClose**: Modal form resets on close

### Example Memoization
```typescript
const eligiblePIs = useMemo(() => {
  if (!record || !pis.length) return [];
  
  // Filter PIs that are before current PI
  return pis.filter(pi => {
    const currentPIValue = record.pi_year * 10 + record.pi_sequence;
    const piValue = pi.year * 10 + pi.sequence;
    return piValue < currentPIValue;
  });
}, [record, pis]);
```

---

## 16. Testing Strategy

### Unit Tests (Jest + React Testing Library)
```typescript
// SpilloverModal.test.tsx
- Renders with correct title
- Shows record information
- Validates form fields
- Calls API on submit
- Handles errors correctly
- Closes on cancel

// SpilloverSummary.test.tsx
- Renders when data exists
- Hides when no spillover records
- Expands/collapses on button click
- Shows correct counts and effort

// ExecutionPlanningPanel.test.tsx
- Shows spillover button for eligible records
- Hides spillover button for SPILLOVER status
- Opens modal on button click
- Refreshes data after spillover
```

### Integration Tests
- Full spillover flow from button click to table update
- API error handling
- Form validation with backend

### Manual Testing Checklist
- [ ] Spillover button appears for PLANNED/IN_PROGRESS records
- [ ] Modal opens with correct record data
- [ ] PI dropdown shows only earlier PIs
- [ ] Form validation works for all fields
- [ ] Character counter updates correctly
- [ ] Category dropdown shows icons
- [ ] Submit button disabled during loading
- [ ] Success message appears
- [ ] Table refreshes with new data
- [ ] Spillover row has orange styling
- [ ] Status column shows spillover icon and tooltip
- [ ] Spillover summary appears/updates
- [ ] Summary expands/collapses correctly

---

## 17. Migration Notes

### No Breaking Changes
- All changes are additive
- Existing functionality remains unchanged
- Backward compatible with current API

### Deployment Steps
1. Deploy backend changes first (already complete)
2. Deploy frontend changes
3. Test spillover flow end-to-end
4. Monitor for errors in production

---

## Status: ✅ Ready for Implementation

All components are planned with:
- ✅ Complete component structure
- ✅ TypeScript interfaces defined
- ✅ State management planned
- ✅ Data flow documented
- ✅ API integration specified
- ✅ Styling guidelines provided
- ✅ Accessibility considered
- ✅ Error handling defined
- ✅ Testing strategy outlined

**Next Step:** Begin implementation with Phase 1 (API Service Updates)
