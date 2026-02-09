# Execution Planning UI Specifications

**Version:** 1.0  
**Date:** February 6, 2026  
**For:** Frontend Developer  
**Feature:** PI-Level Execution Planning

---

## Overview

The Execution Planning UI allows Product Managers to break down strategic roadmap features into executable JIRA records, assign them to teams and PIs, and validate that execution plans align with strategic allocations.

**Key Concepts:**
- **Strategic Allocation:** High-level quarterly effort planning (from roadmap)
- **Execution Allocation:** Detailed PI-level JIRA records with team assignments
- **Validation:** Real-time comparison between strategic and execution plans
- **Capacity Checking:** Warn when teams are over-allocated (but allow override)

---

## 1. Entry Point

### Execute Button
**Location:** Strategic Roadmap table, Actions column (already exists)

**Behavior:**
- Click opens Execution Planning Drawer for that feature
- Button label: "Execute" or "📋 Execute"
- Tooltip: "Plan execution with JIRA records"

---

## 2. Execution Planning Drawer

### Layout
**Component:** `<ExecutionPlanningDrawer />`  
**Type:** Right-side drawer (Ant Design Drawer)  
**Width:** 700px  
**Placement:** right  
**Closable:** Yes (X button)  
**Mask:** Yes (click outside to close)

### Header
```
┌────────────────────────────────────────────────────────────────────────────┐
│ Execution Planning: [Feature Name]                              [X]       │
└────────────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- Title: "Execution Planning: {feature.name}"
- Close button (X) - top right
- Optional: Feature ID badge (small, gray)

---

## 3. Drawer Content Sections

### Section 1: Strategic Allocation Summary

**Purpose:** Show the strategic plan from roadmap (read-only)

**Layout:**
```
Strategic Allocation
┌──────────────────────────────────────────────────────────────────────────┐
│ Q1 2026: 2 eD  │ Q2 2026: 3 eD  │ Q3 2026: 2 eD  │ Q4 2026: 3 eD       │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component:** `<StrategicAllocationSummary />`

**Props:**
```typescript
interface StrategicAllocationSummaryProps {
  allocations: Array<{
    year: number;
    quarter: number;
    allocated_ed: number;
  }>;
}
```

**Design:**
- Use Ant Design `Statistic` or custom cards
- Display quarters horizontally
- Format: "Q{quarter} {year}: {effort} eD"
- Style: Light blue background (#e6f7ff)
- Font: 14px, semi-bold for numbers

**Data Source:** `feature.quarterly_allocations` from API

---

### Section 2: Execution Allocation Progress

**Purpose:** Show execution vs strategic comparison with visual progress

**Layout:**
```
Execution Allocation                    Total: 8/10 eD  ⚠️ -2 eD gap
┌──────────────────────────────────────────────────────────────────────────┐
│ ████████████████████████████████░░░░░░░░░░ 80%                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component:** `<ExecutionProgress />`

**Props:**
```typescript
interface ExecutionProgressProps {
  totalStrategic: number;    // Sum of strategic allocations
  totalExecution: number;    // Sum of JIRA planned_effort
  difference: number;        // strategic - execution
  percentage: number;        // (execution / strategic) * 100
}
```

**Design:**
- Use Ant Design `Progress` component
- Color logic:
  - Green: 95-105% (within tolerance)
  - Orange: 85-95% or 105-115% (warning)
  - Red: <85% or >115% (critical)
- Show text: "{execution}/{strategic} eD"
- Show difference: "⚠️ -{gap} eD gap" or "✅ +{excess} eD excess"
- Font: 14px

**Calculation:**
```typescript
const totalStrategic = feature.quarterly_allocations.reduce((sum, a) => sum + a.allocated_ed, 0);
const totalExecution = jiraRecords.reduce((sum, r) => sum + r.planned_effort, 0);
const difference = totalStrategic - totalExecution;
const percentage = (totalExecution / totalStrategic) * 100;
```

---

### Section 3: Add JIRA Record Button

**Layout:**
```
[+ Add JIRA Record]
```

**Component:** Ant Design `Button`

**Props:**
```typescript
<Button 
  type="primary" 
  icon={<PlusOutlined />}
  onClick={handleAddJiraRecord}
>
  Add JIRA Record
</Button>
```

**Behavior:**
- Click opens `<JiraRecordModal />` in create mode
- Positioned above the JIRA records table
- Full width or left-aligned

---

### Section 4: JIRA Records Table

**Purpose:** Display all JIRA records for this feature

**Layout:**
```
┌────────────────────────────────────────────────────────────────────────────┐
│ JIRA Records                                                              │
├───────────┬─────────────┬──────────┬────────┬──────────┬─────────────────┤
│ JIRA Key  │ Title       │ Team     │ PI     │ Effort   │ Status          │
├───────────┼─────────────┼──────────┼────────┼──────────┼─────────────────┤
│ PROJ-123  │ Backend API │ Nova     │ 2026.1 │ 3 eD     │ [PLANNED]   ⋮  │
│ PROJ-124  │ Frontend UI │ Black H. │ 2026.1 │ 2 eD     │ [PLANNED]   ⋮  │
│ PROJ-125  │ Testing     │ Nova     │ 2026.2 │ 3 eD     │ [SPILLOVER] ⋮  │
└───────────┴─────────────┴──────────┴────────┴──────────┴─────────────────┘
```

**Component:** `<JiraRecordsTable />`

**Props:**
```typescript
interface JiraRecordsTableProps {
  featureId: string;
  records: JiraRecord[];
  onEdit: (record: JiraRecord) => void;
  onDelete: (recordId: string) => void;
  onRefresh: () => void;
}

interface JiraRecord {
  id: string;
  jira_key?: string;
  title: string;
  description?: string;
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
  created_at: string;
  updated_at: string;
}
```

**Columns:**

1. **JIRA Key** (100px)
   - Display: `record.jira_key` or "-"
   - If exists: Link to JIRA (external)
   - Format: `<a href="https://jira.company.com/browse/{key}" target="_blank">{key}</a>`

2. **Title** (200px, ellipsis)
   - Display: `record.title`
   - Tooltip: Full title on hover
   - Font: 14px

3. **Team** (120px)
   - Display: `record.team_name` or "-"
   - Font: 14px

4. **PI** (100px)
   - Display: `record.pi_name` or "-"
   - Format: "PI 2026.1" → "2026.1"
   - Font: 14px

5. **Effort** (80px, right-aligned)
   - Display: `{record.planned_effort} eD`
   - Font: 14px, semi-bold

6. **Status** (120px)
   - Display: Status badge (see Status Badges section)
   - Center-aligned

7. **Actions** (60px)
   - Dropdown menu (⋮ icon)
   - Options:
     - Edit
     - Mark as Spillover (if not already)
     - Delete (with confirmation)

**Table Features:**
- Use Ant Design `Table` component
- Pagination: 10 records per page
- Sorting: By PI, Team, Status
- Empty state: "No JIRA records yet. Click 'Add JIRA Record' to start."
- Loading state: Skeleton rows

**API Endpoint:**
```
GET /api/features/{feature_id}/jira-records
```

---

## 4. JIRA Record Modal

### Modal Layout

**Component:** `<JiraRecordModal />`  
**Type:** Ant Design Modal  
**Width:** 600px  
**Centered:** Yes  
**Closable:** Yes

**Modes:**
- Create: "Add JIRA Record"
- Edit: "Edit JIRA Record"

### Form Fields

**Component:** Ant Design `Form` with `Form.Item`

**Layout:**
```
┌────────────────────────────────────────────────────────────────────────────┐
│ Add JIRA Record                                                   [X]      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  JIRA Key:     [PROJ-        ]  (optional, link to actual JIRA)           │
│                                                                            │
│  Title:        [                                               ] *         │
│                                                                            │
│  Description:  [                                               ]           │
│                [                                               ]           │
│                                                                            │
│  Team:         [Select Team ▾                                  ] *         │
│                                                                            │
│  PI:           [PI 2026.1 ▾                                    ] *         │
│                ℹ️ Team Nova: 85.3 eD available (120 total, 34.7 allocated) │
│                                                                            │
│  Planned Effort: [    ] eD *                                               │
│                  ⚠️ Warning: This will exceed team capacity by 2 eD       │
│                                                                            │
│  Status:       [PLANNED ▾]                                                 │
│                                                                            │
│  ── Spillover (if applicable) ──────────────────────────────────────────  │
│                                                                            │
│  Spilled From: [PI 2025.4 ▾]                                              │
│  Reason:       [Capacity ▾]  (Capacity | Scope Change | Dependencies | Other)
│                                                                            │
│                                           [Cancel]  [Save JIRA Record]     │
└────────────────────────────────────────────────────────────────────────────┘
```

### Field Specifications

#### 1. JIRA Key
```typescript
<Form.Item 
  label="JIRA Key" 
  name="jira_key"
  help="Optional - Link to actual JIRA ticket"
>
  <Input 
    placeholder="PROJ-123" 
    maxLength={50}
  />
</Form.Item>
```
- Optional
- Format: Uppercase, alphanumeric + hyphen
- Validation: Unique across all JIRA records

#### 2. Title
```typescript
<Form.Item 
  label="Title" 
  name="title"
  rules={[{ required: true, message: 'Title is required' }]}
>
  <Input 
    placeholder="e.g., Implement user authentication" 
    maxLength={255}
  />
</Form.Item>
```
- Required
- Max length: 255 characters

#### 3. Description
```typescript
<Form.Item 
  label="Description" 
  name="description"
>
  <Input.TextArea 
    placeholder="Additional details about this work item"
    rows={3}
    maxLength={1000}
  />
</Form.Item>
```
- Optional
- Multi-line text area

#### 4. Team
```typescript
<Form.Item 
  label="Team" 
  name="team_id"
  rules={[{ required: true, message: 'Team is required' }]}
>
  <Select 
    placeholder="Select Team"
    showSearch
    filterOption={(input, option) =>
      option.children.toLowerCase().includes(input.toLowerCase())
    }
  >
    {teams.map(team => (
      <Select.Option key={team.id} value={team.id}>
        {team.name}
      </Select.Option>
    ))}
  </Select>
</Form.Item>
```
- Required
- Dropdown with search
- Data source: `GET /api/teams`

#### 5. PI (Program Increment)
```typescript
<Form.Item 
  label="PI" 
  name="pi_id"
  rules={[{ required: true, message: 'PI is required' }]}
>
  <Select 
    placeholder="Select PI"
    onChange={handlePIChange}
  >
    {pis.map(pi => (
      <Select.Option key={pi.id} value={pi.id}>
        {pi.name}
      </Select.Option>
    ))}
  </Select>
</Form.Item>

{/* Capacity Info - shown when both team and PI are selected */}
{teamId && piId && (
  <Alert
    message={
      <span>
        <InfoCircleOutlined /> Team {teamName}: {availableCapacity} eD available 
        ({totalCapacity} total, {allocatedCapacity} allocated)
      </span>
    }
    type="info"
    showIcon={false}
    style={{ marginTop: 8 }}
  />
)}
```
- Required
- Dropdown
- Data source: `GET /api/pis`
- Format: "PI 2026.1", "PI 2026.2", etc.
- **Trigger capacity check** when changed

**Capacity Info Display:**
- Show when both team and PI are selected
- API: `GET /api/teams/{team_id}/pi-allocation/{pi_id}`
- Response:
  ```typescript
  {
    total_capacity_ed: 120,
    allocated_effort_ed: 34.7,
    available_effort_ed: 85.3,
    utilization_percent: 28.9,
    is_over_allocated: false
  }
  ```

#### 6. Planned Effort
```typescript
<Form.Item 
  label="Planned Effort" 
  name="planned_effort"
  rules={[
    { required: true, message: 'Planned effort is required' },
    { type: 'number', min: 0, message: 'Must be >= 0' }
  ]}
>
  <InputNumber 
    placeholder="0.0"
    min={0}
    step={0.5}
    precision={1}
    addonAfter="eD"
    style={{ width: '200px' }}
    onChange={handleEffortChange}
  />
</Form.Item>

{/* Capacity Warning - shown when over-allocated */}
{capacityWarning && (
  <Alert
    message={capacityWarning.message}
    description={`This will result in ${capacityWarning.over_allocation_ed} eD over-allocation for ${capacityWarning.team_name} in ${capacityWarning.pi_name}`}
    type="warning"
    showIcon
    style={{ marginTop: 8 }}
  />
)}
```
- Required
- Number input with 1 decimal place
- Min: 0, Step: 0.5
- Unit: "eD" (effort days)
- **Trigger capacity check** when changed

**Capacity Warning:**
- Show when `planned_effort` would exceed team capacity
- API: Called automatically during create/update
- Response includes `capacity_warning` object
- Allow user to save anyway (warning, not error)

#### 7. Status
```typescript
<Form.Item 
  label="Status" 
  name="status"
  initialValue="PLANNED"
>
  <Select>
    <Select.Option value="PLANNED">Planned</Select.Option>
    <Select.Option value="IN_PROGRESS">In Progress</Select.Option>
    <Select.Option value="COMPLETED">Completed</Select.Option>
    <Select.Option value="SPILLOVER">Spillover</Select.Option>
  </Select>
</Form.Item>
```
- Default: "PLANNED"
- Options: PLANNED, IN_PROGRESS, COMPLETED, SPILLOVER

#### 8. Spillover Section (Conditional)

**Show when:** `status === 'SPILLOVER'` OR editing a spillover record

```typescript
{(status === 'SPILLOVER' || record?.spillover_from_pi_id) && (
  <>
    <Divider>Spillover Details</Divider>
    
    <Form.Item 
      label="Spilled From PI" 
      name="spillover_from_pi_id"
    >
      <Select placeholder="Select original PI">
        {pis.map(pi => (
          <Select.Option key={pi.id} value={pi.id}>
            {pi.name}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
    
    <Form.Item 
      label="Spillover Reason" 
      name="spillover_reason"
    >
      <Select placeholder="Select reason">
        <Select.Option value="Capacity">Capacity Constraints</Select.Option>
        <Select.Option value="Scope Change">Scope Change</Select.Option>
        <Select.Option value="Dependencies">Dependencies</Select.Option>
        <Select.Option value="Other">Other</Select.Option>
      </Select>
    </Form.Item>
  </>
)}
```

### Modal Actions

**Footer Buttons:**
```typescript
<Space>
  <Button onClick={handleCancel}>
    Cancel
  </Button>
  <Button 
    type="primary" 
    onClick={handleSave}
    loading={saving}
  >
    {mode === 'create' ? 'Save JIRA Record' : 'Update JIRA Record'}
  </Button>
</Space>
```

**Save Behavior:**
- Validate all required fields
- If capacity warning exists, show confirmation:
  ```
  ⚠️ Team Nova will be over-allocated by 2 eD for PI 2026.1
  Do you want to continue?
  [Cancel] [Save Anyway]
  ```
- On success:
  - Close modal
  - Refresh JIRA records table
  - Show success message
  - Update execution progress bar

**API Endpoints:**
- Create: `POST /api/features/{feature_id}/jira-records`
- Update: `PUT /api/jira-records/{record_id}`

---

## 5. Status Badges

**Component:** `<StatusBadge />`

**Props:**
```typescript
interface StatusBadgeProps {
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SPILLOVER';
}
```

**Design:**

```typescript
const statusConfig = {
  PLANNED: {
    color: 'blue',
    text: 'Planned',
    icon: null
  },
  IN_PROGRESS: {
    color: 'orange',
    text: 'In Progress',
    icon: <SyncOutlined spin />
  },
  COMPLETED: {
    color: 'green',
    text: 'Completed',
    icon: <CheckCircleOutlined />
  },
  SPILLOVER: {
    color: 'red',
    text: 'Spillover',
    icon: <WarningOutlined />
  }
};

<Tag 
  color={statusConfig[status].color}
  icon={statusConfig[status].icon}
>
  {statusConfig[status].text}
</Tag>
```

**Usage:**
```typescript
<StatusBadge status={record.status} />
```

---

## 6. Validation & Alerts

### Execution Gap Alert

**Show when:** Execution allocation doesn't match strategic allocation

**Location:** Below execution progress bar

**Component:**
```typescript
{validationResult && !validationResult.is_valid && (
  <Alert
    message="Execution Plan Mismatch"
    description={
      <div>
        <p>Your execution plan doesn't match the strategic allocation:</p>
        <ul>
          {validationResult.warnings.map((warning, idx) => (
            <li key={idx}>{warning.message}</li>
          ))}
        </ul>
        <p>Total difference: {validationResult.total_difference_ed} eD</p>
      </div>
    }
    type="warning"
    showIcon
    closable
    style={{ marginBottom: 16 }}
  />
)}
```

**API Endpoint:**
```
POST /api/features/{feature_id}/validate-execution
```

**Response:**
```typescript
{
  feature_id: string;
  feature_name: string;
  is_valid: boolean;
  warnings: Array<{
    level: 'warning' | 'error';
    message: string;
    details: {
      year: number;
      quarter: number;
      strategic: number;
      execution: number;
      difference: number;
    };
  }>;
  quarterly_comparisons: Array<{
    year: number;
    quarter: number;
    strategic_allocation_ed: number;
    execution_allocation_ed: number;
    difference_ed: number;
    is_matched: boolean;
  }>;
  total_strategic_ed: number;
  total_execution_ed: number;
  total_difference_ed: number;
}
```

**Trigger:** 
- On drawer open
- After creating/updating/deleting JIRA record
- Manual refresh button

---

## 7. Component Structure

### File Organization

```
src/pages/RoadmapV4/
├── ExecutionPlanning/
│   ├── ExecutionPlanningDrawer.tsx       # Main drawer component
│   ├── StrategicAllocationSummary.tsx    # Strategic allocation cards
│   ├── ExecutionProgress.tsx             # Progress bar with stats
│   ├── JiraRecordsTable.tsx              # JIRA records table
│   ├── JiraRecordModal.tsx               # Add/Edit modal
│   ├── StatusBadge.tsx                   # Status badge component
│   ├── CapacityInfo.tsx                  # Team capacity display
│   └── types.ts                          # TypeScript interfaces
```

### Main Component Props

```typescript
// ExecutionPlanningDrawer.tsx
interface ExecutionPlanningDrawerProps {
  open: boolean;
  onClose: () => void;
  feature: RoadmapFeature;
  onSuccess?: () => void;
}

// Usage in ProductRoadmapPage.tsx
const [executionDrawerOpen, setExecutionDrawerOpen] = useState(false);
const [selectedFeature, setSelectedFeature] = useState<RoadmapFeature | null>(null);

const handleExecuteClick = (feature: RoadmapFeature) => {
  setSelectedFeature(feature);
  setExecutionDrawerOpen(true);
};

<ExecutionPlanningDrawer
  open={executionDrawerOpen}
  onClose={() => setExecutionDrawerOpen(false)}
  feature={selectedFeature}
  onSuccess={() => {
    // Refresh features list if needed
    fetchFeatures();
  }}
/>
```

---

## 8. API Integration

### API Service Layer

**File:** `src/services/jiraRecordApi.ts`

```typescript
import axios from 'axios';

const API_BASE = '/api';

export interface JiraRecordCreate {
  jira_key?: string;
  title: string;
  description?: string;
  team_id: string;
  pi_id: string;
  planned_effort: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SPILLOVER';
  spillover_from_pi_id?: string;
  spillover_reason?: string;
}

export interface JiraRecordUpdate extends Partial<JiraRecordCreate> {
  actual_effort?: number;
}

export const jiraRecordApi = {
  // List JIRA records for a feature
  list: async (featureId: string, filters?: {
    status?: string;
    team_id?: string;
    pi_id?: string;
  }) => {
    const params = new URLSearchParams(filters as any);
    const response = await axios.get(
      `${API_BASE}/features/${featureId}/jira-records?${params}`
    );
    return response.data;
  },

  // Get single JIRA record
  get: async (recordId: string) => {
    const response = await axios.get(`${API_BASE}/jira-records/${recordId}`);
    return response.data;
  },

  // Create JIRA record
  create: async (featureId: string, data: JiraRecordCreate) => {
    const response = await axios.post(
      `${API_BASE}/features/${featureId}/jira-records`,
      data
    );
    return response.data;
  },

  // Update JIRA record
  update: async (recordId: string, data: JiraRecordUpdate) => {
    const response = await axios.put(
      `${API_BASE}/jira-records/${recordId}`,
      data
    );
    return response.data;
  },

  // Delete JIRA record
  delete: async (recordId: string) => {
    await axios.delete(`${API_BASE}/jira-records/${recordId}`);
  },

  // Mark as spillover
  markAsSpillover: async (recordId: string, data: {
    new_pi_id: string;
    reason: string;
  }) => {
    const response = await axios.post(
      `${API_BASE}/jira-records/${recordId}/spillover`,
      data
    );
    return response.data;
  },

  // Get team PI allocation
  getTeamPIAllocation: async (teamId: string, piId: string) => {
    const response = await axios.get(
      `${API_BASE}/teams/${teamId}/pi-allocation/${piId}`
    );
    return response.data;
  },

  // Validate execution plan
  validateExecution: async (featureId: string) => {
    const response = await axios.post(
      `${API_BASE}/features/${featureId}/validate-execution`
    );
    return response.data;
  }
};
```

---

## 9. User Interactions & Workflows

### Workflow 1: Create JIRA Record

1. User clicks "Execute" button on a feature
2. Execution Planning Drawer opens
3. User clicks "+ Add JIRA Record"
4. JIRA Record Modal opens
5. User fills in:
   - JIRA Key (optional)
   - Title (required)
   - Description (optional)
   - Team (required) → triggers capacity info load
   - PI (required) → triggers capacity info load
   - Planned Effort (required) → triggers capacity warning check
   - Status (default: PLANNED)
6. If capacity warning appears:
   - User can choose to continue or cancel
7. User clicks "Save JIRA Record"
8. API creates record
9. If successful:
   - Modal closes
   - Table refreshes
   - Progress bar updates
   - Success message shows
10. If error:
    - Error message shows in modal
    - User can correct and retry

### Workflow 2: Edit JIRA Record

1. User clicks "⋮" menu on a record
2. User selects "Edit"
3. JIRA Record Modal opens with existing data
4. User modifies fields
5. Capacity checks run on changes
6. User clicks "Update JIRA Record"
7. API updates record
8. Table and progress bar refresh

### Workflow 3: Mark as Spillover

1. User clicks "⋮" menu on a record
2. User selects "Mark as Spillover"
3. Modal opens with spillover fields:
   - New PI (required)
   - Reason (required)
4. User fills fields and saves
5. API moves record to new PI
6. Record status changes to SPILLOVER
7. Table refreshes

### Workflow 4: Delete JIRA Record

1. User clicks "⋮" menu on a record
2. User selects "Delete"
3. Confirmation modal appears:
   ```
   Are you sure you want to delete this JIRA record?
   PROJ-123: Backend API
   This action cannot be undone.
   [Cancel] [Delete]
   ```
4. User confirms
5. API deletes record
6. Table and progress bar refresh

### Workflow 5: View Validation Warnings

1. Drawer opens with validation check
2. If mismatches exist, alert shows:
   - List of quarterly mismatches
   - Total difference
3. User can:
   - Add/edit JIRA records to fix
   - Ignore warnings (informational only)
4. Validation updates automatically after changes

---

## 10. Responsive Design

### Desktop (>1200px)
- Drawer width: 700px
- Table: All columns visible
- Modal: 600px width

### Tablet (768px - 1200px)
- Drawer width: 600px
- Table: Hide description column
- Modal: 500px width

### Mobile (<768px)
- Drawer: Full screen
- Table: Card view instead of table
- Modal: Full screen

---

## 11. Loading & Error States

### Loading States

**Drawer Loading:**
```typescript
{loading ? (
  <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
) : (
  // Drawer content
)}
```

**Table Loading:**
```typescript
<Table
  loading={loading}
  dataSource={records}
  // ... other props
/>
```

**Modal Loading:**
```typescript
<Button 
  type="primary" 
  loading={saving}
  onClick={handleSave}
>
  Save JIRA Record
</Button>
```

### Error States

**API Error:**
```typescript
{error && (
  <Alert
    message="Error Loading Data"
    description={error.message}
    type="error"
    showIcon
    closable
    onClose={() => setError(null)}
  />
)}
```

**Empty State:**
```typescript
<Empty
  image={Empty.PRESENTED_IMAGE_SIMPLE}
  description="No JIRA records yet"
>
  <Button type="primary" onClick={handleAddJiraRecord}>
    Add First JIRA Record
  </Button>
</Empty>
```

---

## 12. Accessibility

### Keyboard Navigation
- Tab through form fields
- Enter to submit forms
- Escape to close modals/drawer
- Arrow keys in dropdowns

### ARIA Labels
```typescript
<Button 
  aria-label="Add JIRA record"
  onClick={handleAdd}
>
  + Add JIRA Record
</Button>

<Select 
  aria-label="Select team"
  placeholder="Select Team"
>
  {/* options */}
</Select>
```

### Screen Reader Support
- All form fields have labels
- Error messages announced
- Success messages announced
- Table has proper headers

---

## 13. Performance Considerations

### Optimization Strategies

1. **Lazy Loading:**
   ```typescript
   const ExecutionPlanningDrawer = lazy(() => 
     import('./ExecutionPlanning/ExecutionPlanningDrawer')
   );
   ```

2. **Memoization:**
   ```typescript
   const executionProgress = useMemo(() => 
     calculateProgress(records, allocations),
     [records, allocations]
   );
   ```

3. **Debounced Capacity Checks:**
   ```typescript
   const debouncedCapacityCheck = useMemo(
     () => debounce(checkCapacity, 500),
     []
   );
   ```

4. **Pagination:**
   - Table: 10 records per page
   - Load more on scroll for large datasets

---

## 14. Testing Checklist

### Unit Tests
- [ ] StatusBadge renders correctly for each status
- [ ] ExecutionProgress calculates percentage correctly
- [ ] Capacity warning logic works
- [ ] Form validation rules work

### Integration Tests
- [ ] Create JIRA record flow
- [ ] Edit JIRA record flow
- [ ] Delete JIRA record flow
- [ ] Mark as spillover flow
- [ ] Capacity warning appears when over-allocated
- [ ] Validation warnings appear when mismatched

### E2E Tests
- [ ] Open drawer from feature table
- [ ] Add JIRA record with all fields
- [ ] Edit existing JIRA record
- [ ] Delete JIRA record with confirmation
- [ ] Capacity warning prevents accidental over-allocation
- [ ] Execution progress updates after changes

---

## 15. Implementation Checklist

### Phase 1: Basic Structure
- [ ] Create ExecutionPlanningDrawer component
- [ ] Add Execute button to feature table
- [ ] Implement drawer open/close logic
- [ ] Add strategic allocation summary section

### Phase 2: JIRA Records Table
- [ ] Create JiraRecordsTable component
- [ ] Implement API integration for listing records
- [ ] Add status badges
- [ ] Add actions menu (edit, delete)
- [ ] Add empty state

### Phase 3: JIRA Record Modal
- [ ] Create JiraRecordModal component
- [ ] Implement form with all fields
- [ ] Add form validation
- [ ] Integrate team and PI dropdowns
- [ ] Add capacity info display

### Phase 4: Capacity Validation
- [ ] Implement capacity check on effort change
- [ ] Show capacity warning in modal
- [ ] Add confirmation for over-allocation
- [ ] Integrate with team PI allocation API

### Phase 5: Execution Progress
- [ ] Create ExecutionProgress component
- [ ] Calculate execution vs strategic
- [ ] Add progress bar with color logic
- [ ] Show gap/excess indicators

### Phase 6: Validation Alerts
- [ ] Integrate validation API
- [ ] Show execution gap alerts
- [ ] Add quarterly comparison details
- [ ] Auto-refresh after changes

### Phase 7: Polish
- [ ] Add loading states
- [ ] Add error handling
- [ ] Implement responsive design
- [ ] Add accessibility features
- [ ] Write tests

---

## 16. Dependencies

### Required Ant Design Components
```typescript
import {
  Drawer,
  Button,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  Alert,
  Progress,
  Statistic,
  Space,
  Divider,
  Empty,
  Spin,
  Dropdown,
  Menu,
  message
} from 'antd';

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  MoreOutlined
} from '@ant-design/icons';
```

### Additional Libraries
```json
{
  "axios": "^1.6.0",
  "lodash": "^4.17.21",
  "dayjs": "^1.11.10"
}
```

---

## 17. Example Code Snippets

### ExecutionPlanningDrawer.tsx (Skeleton)

```typescript
import React, { useState, useEffect } from 'react';
import { Drawer, Button, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { jiraRecordApi } from '@/services/jiraRecordApi';
import StrategicAllocationSummary from './StrategicAllocationSummary';
import ExecutionProgress from './ExecutionProgress';
import JiraRecordsTable from './JiraRecordsTable';
import JiraRecordModal from './JiraRecordModal';

interface ExecutionPlanningDrawerProps {
  open: boolean;
  onClose: () => void;
  feature: RoadmapFeature;
  onSuccess?: () => void;
}

const ExecutionPlanningDrawer: React.FC<ExecutionPlanningDrawerProps> = ({
  open,
  onClose,
  feature,
  onSuccess
}) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    if (open && feature) {
      loadRecords();
      validateExecution();
    }
  }, [open, feature]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await jiraRecordApi.list(feature.id);
      setRecords(response.items);
    } catch (error) {
      message.error('Failed to load JIRA records');
    } finally {
      setLoading(false);
    }
  };

  const validateExecution = async () => {
    try {
      const result = await jiraRecordApi.validateExecution(feature.id);
      setValidationResult(result);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleAddRecord = () => {
    setSelectedRecord(null);
    setModalOpen(true);
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const handleDeleteRecord = async (recordId) => {
    try {
      await jiraRecordApi.delete(recordId);
      message.success('JIRA record deleted');
      loadRecords();
      validateExecution();
    } catch (error) {
      message.error('Failed to delete JIRA record');
    }
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    loadRecords();
    validateExecution();
    onSuccess?.();
  };

  return (
    <>
      <Drawer
        title={`Execution Planning: ${feature.name}`}
        width={700}
        open={open}
        onClose={onClose}
        destroyOnClose
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <StrategicAllocationSummary 
            allocations={feature.quarterly_allocations} 
          />
          
          <ExecutionProgress
            records={records}
            strategicAllocations={feature.quarterly_allocations}
            validationResult={validationResult}
          />
          
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAddRecord}
            block
          >
            Add JIRA Record
          </Button>
          
          <JiraRecordsTable
            records={records}
            loading={loading}
            onEdit={handleEditRecord}
            onDelete={handleDeleteRecord}
            onRefresh={loadRecords}
          />
        </Space>
      </Drawer>

      <JiraRecordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        featureId={feature.id}
        record={selectedRecord}
      />
    </>
  );
};

export default ExecutionPlanningDrawer;
```

---

## Summary

This specification provides everything the Frontend Developer needs to implement the Execution Planning UI:

✅ **Complete component structure**  
✅ **Detailed field specifications**  
✅ **API integration points**  
✅ **User workflows**  
✅ **Design specifications**  
✅ **Error handling**  
✅ **Accessibility guidelines**  
✅ **Testing checklist**  
✅ **Example code**

**Next Steps:**
1. Frontend Developer implements components following this spec
2. QA Engineer tests against workflows and checklist
3. Product Manager reviews UI/UX
4. Iterate based on feedback

**Estimated Implementation Time:** 3-5 days for experienced React developer

---

**Document Version:** 1.0  
**Last Updated:** February 6, 2026  
**Status:** Ready for Implementation
