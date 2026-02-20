# Execution Planning - Component Architecture

**Version:** 1.0  
**Date:** February 6, 2026  
**For:** Frontend Developer  
**Based On:** UI Designer's Specifications

---

## Overview

This document defines the component architecture, state management, and data flow for the Execution Planning feature. It provides a clear blueprint for implementing the UI components that allow Product Managers to break down strategic features into executable JIRA records.

---

## 1. Component Hierarchy

```
ProductRoadmapPage.tsx (modified)
└── ExecutionPlanningDrawer (new)
    ├── StrategicAllocationSummary
    ├── ExecutionProgressBar
    ├── ValidationAlert
    ├── JiraRecordsTable
    │   └── JiraRecordRow (multiple)
    │       ├── StatusBadge
    │       └── ActionsMenu
    └── JiraRecordModal
        ├── BasicInfoSection
        ├── TeamPISection
        │   └── CapacityInfo
        ├── EffortSection
        │   └── CapacityWarning
        └── SpilloverSection
```

---

## 2. File Structure

```
frontend/src/
├── pages/RoadmapV4/
│   ├── ProductRoadmapPage.tsx                    # Modified - add execution trigger
│   └── ExecutionPlanning/
│       ├── index.ts                              # Barrel export
│       ├── ExecutionPlanningDrawer.tsx           # Main container
│       ├── components/
│       │   ├── StrategicAllocationSummary.tsx    # Strategic plan display
│       │   ├── ExecutionProgressBar.tsx          # Progress with validation
│       │   ├── ValidationAlert.tsx               # Execution gap warnings
│       │   ├── JiraRecordsTable.tsx              # Table container
│       │   ├── JiraRecordRow.tsx                 # Table row component
│       │   ├── StatusBadge.tsx                   # Status indicator
│       │   ├── ActionsMenu.tsx                   # Edit/Delete dropdown
│       │   └── JiraRecordModal/
│       │       ├── index.tsx                     # Modal container
│       │       ├── BasicInfoSection.tsx          # JIRA key, title, description
│       │       ├── TeamPISection.tsx             # Team and PI selection
│       │       ├── EffortSection.tsx             # Effort input with warnings
│       │       ├── SpilloverSection.tsx          # Spillover fields
│       │       ├── CapacityInfo.tsx              # Team capacity display
│       │       └── CapacityWarning.tsx           # Over-allocation warning
│       ├── hooks/
│       │   ├── useJiraRecords.ts                 # JIRA records CRUD
│       │   ├── useTeamCapacity.ts                # Capacity checking
│       │   ├── useExecutionValidation.ts         # Validation logic
│       │   └── useExecutionPlanning.ts           # Main orchestration hook
│       └── types.ts                              # Local type definitions
├── services/
│   └── jiraRecordApi.ts                          # API service layer
├── types/
│   └── jiraRecord.ts                             # Global type definitions
└── utils/
    └── executionHelpers.ts                       # Helper functions
```

---

## 3. Component Specifications

### 3.1 ProductRoadmapPage.tsx (Modified)

**Purpose:** Add execution planning trigger to existing page

**Changes:**
```tsx
// Add state for execution drawer
const [executionDrawerOpen, setExecutionDrawerOpen] = useState(false);
const [selectedFeatureForExecution, setSelectedFeatureForExecution] = useState<Feature | null>(null);

// Add handler for Execute button
const handleExecuteClick = (feature: Feature) => {
  setSelectedFeatureForExecution(feature);
  setExecutionDrawerOpen(true);
};

// Add ExecutionPlanningDrawer component
<ExecutionPlanningDrawer
  open={executionDrawerOpen}
  onClose={() => setExecutionDrawerOpen(false)}
  feature={selectedFeatureForExecution}
  onSuccess={() => {
    // Optionally refresh features list
    fetchFeatures();
  }}
/>
```

**Props to Pass Down:**
- `feature`: Current feature being planned
- `onClose`: Close drawer callback
- `onSuccess`: Success callback for refreshing parent

---

### 3.2 ExecutionPlanningDrawer.tsx

**Purpose:** Main container for execution planning UI

**Responsibilities:**
- Manage drawer state and lifecycle
- Orchestrate child components
- Handle data fetching and updates
- Coordinate between JIRA records and validation

**Props:**
```tsx
interface ExecutionPlanningDrawerProps {
  open: boolean;
  onClose: () => void;
  feature: Feature | null;
  onSuccess?: () => void;
}
```

**State:**
```tsx
const [jiraRecords, setJiraRecords] = useState<JiraRecord[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [modalOpen, setModalOpen] = useState(false);
const [selectedRecord, setSelectedRecord] = useState<JiraRecord | null>(null);
const [validationResult, setValidationResult] = useState<ExecutionValidationResponse | null>(null);
```

**Key Methods:**
```tsx
const loadJiraRecords = async () => {
  // Fetch JIRA records for feature
};

const validateExecution = async () => {
  // Validate execution vs strategic plan
};

const handleAddRecord = () => {
  // Open modal in create mode
};

const handleEditRecord = (record: JiraRecord) => {
  // Open modal in edit mode
};

const handleDeleteRecord = async (recordId: string) => {
  // Delete with confirmation
};

const handleModalSuccess = () => {
  // Refresh data after create/update
};
```

**Custom Hook Usage:**
```tsx
const {
  records,
  loading,
  error,
  createRecord,
  updateRecord,
  deleteRecord,
  refreshRecords
} = useJiraRecords(feature?.id);

const {
  validationResult,
  isValidating,
  validate
} = useExecutionValidation(feature?.id);
```

**Component Structure:**
```tsx
<Drawer
  title={`Execution Planning: ${feature?.name}`}
  width={700}
  open={open}
  onClose={onClose}
  destroyOnClose
>
  <Space direction="vertical" size="large" style={{ width: '100%' }}>
    {/* Strategic allocation summary */}
    <StrategicAllocationSummary 
      allocations={feature?.quarterly_allocations || []} 
    />
    
    {/* Execution progress and validation */}
    <ExecutionProgressBar
      records={records}
      strategicAllocations={feature?.quarterly_allocations || []}
    />
    
    {/* Validation warnings */}
    {validationResult && !validationResult.is_valid && (
      <ValidationAlert validationResult={validationResult} />
    )}
    
    {/* Add button */}
    <Button 
      type="primary" 
      icon={<PlusOutlined />}
      onClick={handleAddRecord}
      block
    >
      Add JIRA Record
    </Button>
    
    {/* JIRA records table */}
    <JiraRecordsTable
      records={records}
      loading={loading}
      onEdit={handleEditRecord}
      onDelete={handleDeleteRecord}
      onRefresh={refreshRecords}
    />
  </Space>
</Drawer>

{/* JIRA Record Modal */}
<JiraRecordModal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  onSuccess={handleModalSuccess}
  featureId={feature?.id}
  record={selectedRecord}
/>
```

---

### 3.3 StrategicAllocationSummary.tsx

**Purpose:** Display strategic quarterly allocations (read-only)

**Props:**
```tsx
interface StrategicAllocationSummaryProps {
  allocations: QuarterlyAllocation[];
}

interface QuarterlyAllocation {
  year: number;
  quarter: number;
  allocated_ed: number;
}
```

**Component:**
```tsx
const StrategicAllocationSummary: React.FC<StrategicAllocationSummaryProps> = ({
  allocations
}) => {
  return (
    <Card 
      title="Strategic Allocation" 
      size="small"
      style={{ backgroundColor: '#e6f7ff' }}
    >
      <Row gutter={16}>
        {allocations.map((alloc) => (
          <Col span={6} key={`${alloc.year}-${alloc.quarter}`}>
            <Statistic
              title={`Q${alloc.quarter} ${alloc.year}`}
              value={alloc.allocated_ed}
              suffix="eD"
              valueStyle={{ fontSize: '18px', fontWeight: 600 }}
            />
          </Col>
        ))}
      </Row>
    </Card>
  );
};
```

**Styling:**
- Light blue background (#e6f7ff)
- Horizontal layout with equal spacing
- Bold numbers for emphasis

---

### 3.4 ExecutionProgressBar.tsx

**Purpose:** Show execution vs strategic comparison with visual progress

**Props:**
```tsx
interface ExecutionProgressBarProps {
  records: JiraRecord[];
  strategicAllocations: QuarterlyAllocation[];
}
```

**State:**
```tsx
const [progress, setProgress] = useState({
  totalStrategic: 0,
  totalExecution: 0,
  difference: 0,
  percentage: 0,
  status: 'normal' as 'success' | 'normal' | 'exception'
});
```

**Calculation Logic:**
```tsx
useEffect(() => {
  const totalStrategic = strategicAllocations.reduce(
    (sum, a) => sum + a.allocated_ed, 
    0
  );
  
  const totalExecution = records.reduce(
    (sum, r) => sum + r.planned_effort, 
    0
  );
  
  const difference = totalStrategic - totalExecution;
  const percentage = totalStrategic > 0 
    ? (totalExecution / totalStrategic) * 100 
    : 0;
  
  // Determine status based on percentage
  let status: 'success' | 'normal' | 'exception' = 'normal';
  if (percentage >= 95 && percentage <= 105) {
    status = 'success';
  } else if (percentage < 85 || percentage > 115) {
    status = 'exception';
  }
  
  setProgress({ totalStrategic, totalExecution, difference, percentage, status });
}, [records, strategicAllocations]);
```

**Component:**
```tsx
<Card title="Execution Allocation" size="small">
  <Space direction="vertical" style={{ width: '100%' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Text strong>
        Total: {progress.totalExecution}/{progress.totalStrategic} eD
      </Text>
      {progress.difference !== 0 && (
        <Text type={progress.difference > 0 ? 'warning' : 'success'}>
          {progress.difference > 0 ? '⚠️' : '✅'} 
          {Math.abs(progress.difference).toFixed(1)} eD 
          {progress.difference > 0 ? ' gap' : ' excess'}
        </Text>
      )}
    </div>
    
    <Progress
      percent={Math.round(progress.percentage)}
      status={progress.status}
      strokeColor={
        progress.status === 'success' ? '#52c41a' :
        progress.status === 'exception' ? '#ff4d4f' :
        '#1890ff'
      }
    />
  </Space>
</Card>
```

---

### 3.5 ValidationAlert.tsx

**Purpose:** Display execution validation warnings

**Props:**
```tsx
interface ValidationAlertProps {
  validationResult: ExecutionValidationResponse;
}

interface ExecutionValidationResponse {
  feature_id: string;
  feature_name: string;
  is_valid: boolean;
  warnings: ExecutionValidationWarning[];
  quarterly_comparisons: QuarterAllocationComparison[];
  total_strategic_ed: number;
  total_execution_ed: number;
  total_difference_ed: number;
}
```

**Component:**
```tsx
const ValidationAlert: React.FC<ValidationAlertProps> = ({ validationResult }) => {
  return (
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
          <Text strong>
            Total difference: {Math.abs(validationResult.total_difference_ed).toFixed(1)} eD
          </Text>
        </div>
      }
      type="warning"
      showIcon
      closable
      style={{ marginBottom: 16 }}
    />
  );
};
```

---

### 3.6 JiraRecordsTable.tsx

**Purpose:** Display JIRA records in a table with actions

**Props:**
```tsx
interface JiraRecordsTableProps {
  records: JiraRecord[];
  loading: boolean;
  onEdit: (record: JiraRecord) => void;
  onDelete: (recordId: string) => void;
  onRefresh: () => void;
}
```

**Columns Configuration:**
```tsx
const columns: ColumnsType<JiraRecord> = [
  {
    title: 'JIRA Key',
    dataIndex: 'jira_key',
    key: 'jira_key',
    width: 100,
    render: (key: string) => key ? (
      <a href={`https://jira.company.com/browse/${key}`} target="_blank" rel="noopener noreferrer">
        {key}
      </a>
    ) : '-'
  },
  {
    title: 'Title',
    dataIndex: 'title',
    key: 'title',
    width: 200,
    ellipsis: { showTitle: true },
    render: (title: string) => (
      <Tooltip title={title}>
        {title}
      </Tooltip>
    )
  },
  {
    title: 'Team',
    dataIndex: 'team_name',
    key: 'team_name',
    width: 120,
    render: (name: string) => name || '-'
  },
  {
    title: 'PI',
    dataIndex: 'pi_name',
    key: 'pi_name',
    width: 100,
    render: (name: string) => name ? name.replace('PI ', '') : '-'
  },
  {
    title: 'Effort',
    dataIndex: 'planned_effort',
    key: 'planned_effort',
    width: 80,
    align: 'right',
    render: (effort: number) => (
      <Text strong>{effort.toFixed(1)} eD</Text>
    )
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    align: 'center',
    render: (status: string) => <StatusBadge status={status} />
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 60,
    align: 'center',
    render: (_, record) => (
      <ActionsMenu
        record={record}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
  }
];
```

**Component:**
```tsx
<Table
  columns={columns}
  dataSource={records}
  loading={loading}
  rowKey="id"
  pagination={{
    pageSize: 10,
    showSizeChanger: false,
    showTotal: (total) => `Total ${total} records`
  }}
  locale={{
    emptyText: (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No JIRA records yet"
      >
        <Button type="primary" onClick={onRefresh}>
          Add First JIRA Record
        </Button>
      </Empty>
    )
  }}
/>
```

---

### 3.7 StatusBadge.tsx

**Purpose:** Display status with appropriate color and icon

**Props:**
```tsx
interface StatusBadgeProps {
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SPILLOVER';
}
```

**Component:**
```tsx
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

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];
  
  return (
    <Tag color={config.color} icon={config.icon}>
      {config.text}
    </Tag>
  );
};
```

---

### 3.8 ActionsMenu.tsx

**Purpose:** Dropdown menu for record actions

**Props:**
```tsx
interface ActionsMenuProps {
  record: JiraRecord;
  onEdit: (record: JiraRecord) => void;
  onDelete: (recordId: string) => void;
}
```

**Component:**
```tsx
const ActionsMenu: React.FC<ActionsMenuProps> = ({ record, onEdit, onDelete }) => {
  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete JIRA Record',
      content: `Are you sure you want to delete "${record.title}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => onDelete(record.id)
    });
  };

  const menuItems = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onClick: () => onEdit(record)
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      danger: true,
      onClick: handleDelete
    }
  ];

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
      <Button type="text" icon={<MoreOutlined />} />
    </Dropdown>
  );
};
```

---

### 3.9 JiraRecordModal/index.tsx

**Purpose:** Modal for creating/editing JIRA records

**Props:**
```tsx
interface JiraRecordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  featureId: string;
  record?: JiraRecord | null;
}
```

**State:**
```tsx
const [form] = Form.useForm();
const [saving, setSaving] = useState(false);
const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
const [selectedPIId, setSelectedPIId] = useState<string | null>(null);
const [capacityInfo, setCapacityInfo] = useState<TeamPIAllocation | null>(null);
const [capacityWarning, setCapacityWarning] = useState<CapacityWarning | null>(null);
```

**Key Methods:**
```tsx
const handleTeamChange = (teamId: string) => {
  setSelectedTeamId(teamId);
  if (selectedPIId) {
    loadCapacityInfo(teamId, selectedPIId);
  }
};

const handlePIChange = (piId: string) => {
  setSelectedPIId(piId);
  if (selectedTeamId) {
    loadCapacityInfo(selectedTeamId, piId);
  }
};

const handleEffortChange = (effort: number) => {
  if (selectedTeamId && selectedPIId) {
    checkCapacity(selectedTeamId, selectedPIId, effort);
  }
};

const loadCapacityInfo = async (teamId: string, piId: string) => {
  const info = await jiraRecordApi.getTeamPIAllocation(teamId, piId);
  setCapacityInfo(info);
};

const checkCapacity = (teamId: string, piId: string, effort: number) => {
  // Calculate if this effort will exceed capacity
  if (capacityInfo) {
    const newTotal = capacityInfo.allocated_effort + effort;
    if (newTotal > capacityInfo.total_capacity) {
      setCapacityWarning({
        message: `Team will be over-allocated by ${(newTotal - capacityInfo.total_capacity).toFixed(1)} eD`,
        over_allocation_ed: newTotal - capacityInfo.total_capacity
      });
    } else {
      setCapacityWarning(null);
    }
  }
};

const handleSave = async () => {
  try {
    const values = await form.validateFields();
    setSaving(true);
    
    if (record) {
      await jiraRecordApi.update(record.id, values);
      message.success('JIRA record updated');
    } else {
      const response = await jiraRecordApi.create(featureId, values);
      if (response.capacity_warning) {
        // Show warning but allow save
        Modal.warning({
          title: 'Capacity Warning',
          content: response.capacity_warning.message,
        });
      }
      message.success('JIRA record created');
    }
    
    onSuccess();
    onClose();
  } catch (error) {
    message.error('Failed to save JIRA record');
  } finally {
    setSaving(false);
  }
};
```

**Component Structure:**
```tsx
<Modal
  title={record ? 'Edit JIRA Record' : 'Add JIRA Record'}
  open={open}
  onCancel={onClose}
  width={600}
  footer={[
    <Button key="cancel" onClick={onClose}>
      Cancel
    </Button>,
    <Button key="save" type="primary" loading={saving} onClick={handleSave}>
      {record ? 'Update' : 'Save'} JIRA Record
    </Button>
  ]}
>
  <Form form={form} layout="vertical" initialValues={record || {}}>
    <BasicInfoSection />
    <TeamPISection
      onTeamChange={handleTeamChange}
      onPIChange={handlePIChange}
      capacityInfo={capacityInfo}
    />
    <EffortSection
      onEffortChange={handleEffortChange}
      capacityWarning={capacityWarning}
    />
    <SpilloverSection />
  </Form>
</Modal>
```

---

### 3.10 Modal Sub-Components

#### BasicInfoSection.tsx
```tsx
const BasicInfoSection: React.FC = () => (
  <>
    <Form.Item 
      label="JIRA Key" 
      name="jira_key"
      help="Optional - Link to actual JIRA ticket"
    >
      <Input placeholder="PROJ-123" maxLength={50} />
    </Form.Item>
    
    <Form.Item 
      label="Title" 
      name="title"
      rules={[{ required: true, message: 'Title is required' }]}
    >
      <Input placeholder="e.g., Implement user authentication" maxLength={255} />
    </Form.Item>
    
    <Form.Item label="Description" name="description">
      <Input.TextArea 
        placeholder="Additional details about this work item"
        rows={3}
        maxLength={1000}
      />
    </Form.Item>
  </>
);
```

#### TeamPISection.tsx
```tsx
interface TeamPISectionProps {
  onTeamChange: (teamId: string) => void;
  onPIChange: (piId: string) => void;
  capacityInfo: TeamPIAllocation | null;
}

const TeamPISection: React.FC<TeamPISectionProps> = ({
  onTeamChange,
  onPIChange,
  capacityInfo
}) => {
  const { data: teams } = useTeams();
  const { data: pis } = usePIs();

  return (
    <>
      <Form.Item 
        label="Team" 
        name="team_id"
        rules={[{ required: true, message: 'Team is required' }]}
      >
        <Select 
          placeholder="Select Team"
          showSearch
          onChange={onTeamChange}
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          {teams?.map(team => (
            <Select.Option key={team.id} value={team.id}>
              {team.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      
      <Form.Item 
        label="PI" 
        name="pi_id"
        rules={[{ required: true, message: 'PI is required' }]}
      >
        <Select placeholder="Select PI" onChange={onPIChange}>
          {pis?.map(pi => (
            <Select.Option key={pi.id} value={pi.id}>
              {pi.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      
      {capacityInfo && <CapacityInfo info={capacityInfo} />}
    </>
  );
};
```

#### EffortSection.tsx
```tsx
interface EffortSectionProps {
  onEffortChange: (effort: number) => void;
  capacityWarning: CapacityWarning | null;
}

const EffortSection: React.FC<EffortSectionProps> = ({
  onEffortChange,
  capacityWarning
}) => (
  <>
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
        onChange={onEffortChange}
      />
    </Form.Item>
    
    {capacityWarning && <CapacityWarning warning={capacityWarning} />}
    
    <Form.Item label="Status" name="status" initialValue="PLANNED">
      <Select>
        <Select.Option value="PLANNED">Planned</Select.Option>
        <Select.Option value="IN_PROGRESS">In Progress</Select.Option>
        <Select.Option value="COMPLETED">Completed</Select.Option>
        <Select.Option value="SPILLOVER">Spillover</Select.Option>
      </Select>
    </Form.Item>
  </>
);
```

#### SpilloverSection.tsx
```tsx
const SpilloverSection: React.FC = () => {
  const form = Form.useFormInstance();
  const status = Form.useWatch('status', form);
  const { data: pis } = usePIs();

  if (status !== 'SPILLOVER') return null;

  return (
    <>
      <Divider>Spillover Details</Divider>
      
      <Form.Item label="Spilled From PI" name="spillover_from_pi_id">
        <Select placeholder="Select original PI">
          {pis?.map(pi => (
            <Select.Option key={pi.id} value={pi.id}>
              {pi.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      
      <Form.Item label="Spillover Reason" name="spillover_reason">
        <Select placeholder="Select reason">
          <Select.Option value="Capacity">Capacity Constraints</Select.Option>
          <Select.Option value="Scope Change">Scope Change</Select.Option>
          <Select.Option value="Dependencies">Dependencies</Select.Option>
          <Select.Option value="Other">Other</Select.Option>
        </Select>
      </Form.Item>
    </>
  );
};
```

#### CapacityInfo.tsx
```tsx
interface CapacityInfoProps {
  info: TeamPIAllocation;
}

const CapacityInfo: React.FC<CapacityInfoProps> = ({ info }) => (
  <Alert
    message={
      <span>
        <InfoCircleOutlined /> Team {info.team_name}: {info.available_effort.toFixed(1)} eD available 
        ({info.total_capacity.toFixed(1)} total, {info.allocated_effort.toFixed(1)} allocated)
      </span>
    }
    type="info"
    showIcon={false}
    style={{ marginBottom: 16 }}
  />
);
```

#### CapacityWarning.tsx
```tsx
interface CapacityWarningProps {
  warning: CapacityWarning;
}

const CapacityWarning: React.FC<CapacityWarningProps> = ({ warning }) => (
  <Alert
    message="Capacity Warning"
    description={warning.message}
    type="warning"
    showIcon
    style={{ marginBottom: 16 }}
  />
);
```

---

## 4. Custom Hooks

### 4.1 useJiraRecords.ts

**Purpose:** Manage JIRA records CRUD operations

```tsx
import { useState, useEffect } from 'react';
import { jiraRecordApi } from '@/services/jiraRecordApi';
import { JiraRecord, JiraRecordCreate, JiraRecordUpdate } from '@/types/jiraRecord';

export const useJiraRecords = (featureId: string | undefined) => {
  const [records, setRecords] = useState<JiraRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    if (!featureId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await jiraRecordApi.list(featureId);
      setRecords(response.items || []);
    } catch (err) {
      setError('Failed to load JIRA records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createRecord = async (data: JiraRecordCreate) => {
    if (!featureId) return;
    
    const response = await jiraRecordApi.create(featureId, data);
    await fetchRecords();
    return response;
  };

  const updateRecord = async (recordId: string, data: JiraRecordUpdate) => {
    await jiraRecordApi.update(recordId, data);
    await fetchRecords();
  };

  const deleteRecord = async (recordId: string) => {
    await jiraRecordApi.delete(recordId);
    await fetchRecords();
  };

  useEffect(() => {
    fetchRecords();
  }, [featureId]);

  return {
    records,
    loading,
    error,
    createRecord,
    updateRecord,
    deleteRecord,
    refreshRecords: fetchRecords
  };
};
```

### 4.2 useTeamCapacity.ts

**Purpose:** Manage team capacity checking

```tsx
import { useState } from 'react';
import { jiraRecordApi } from '@/services/jiraRecordApi';
import { TeamPIAllocation } from '@/types/jiraRecord';

export const useTeamCapacity = () => {
  const [capacityInfo, setCapacityInfo] = useState<TeamPIAllocation | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCapacity = async (teamId: string, piId: string) => {
    setLoading(true);
    try {
      const info = await jiraRecordApi.getTeamPIAllocation(teamId, piId);
      setCapacityInfo(info);
      return info;
    } catch (error) {
      console.error('Failed to load capacity info:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkCapacity = (plannedEffort: number): CapacityWarning | null => {
    if (!capacityInfo) return null;

    const newTotal = capacityInfo.allocated_effort + plannedEffort;
    
    if (newTotal > capacityInfo.total_capacity) {
      const overAllocation = newTotal - capacityInfo.total_capacity;
      return {
        team_id: capacityInfo.team_id,
        team_name: capacityInfo.team_name,
        pi_id: capacityInfo.pi_id,
        pi_name: capacityInfo.pi_name,
        capacity_ed: capacityInfo.total_capacity,
        current_allocation_ed: capacityInfo.allocated_effort,
        new_allocation_ed: plannedEffort,
        total_allocation_ed: newTotal,
        over_allocation_ed: overAllocation,
        message: `Team ${capacityInfo.team_name} will be over-allocated by ${overAllocation.toFixed(1)} eD in ${capacityInfo.pi_name}`
      };
    }

    return null;
  };

  return {
    capacityInfo,
    loading,
    loadCapacity,
    checkCapacity
  };
};
```

### 4.3 useExecutionValidation.ts

**Purpose:** Validate execution vs strategic plan

```tsx
import { useState, useEffect } from 'react';
import { jiraRecordApi } from '@/services/jiraRecordApi';
import { ExecutionValidationResponse } from '@/types/jiraRecord';

export const useExecutionValidation = (featureId: string | undefined) => {
  const [validationResult, setValidationResult] = useState<ExecutionValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validate = async () => {
    if (!featureId) return;

    setIsValidating(true);
    try {
      const result = await jiraRecordApi.validateExecution(featureId);
      setValidationResult(result);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    validate();
  }, [featureId]);

  return {
    validationResult,
    isValidating,
    validate
  };
};
```

### 4.4 useExecutionPlanning.ts

**Purpose:** Main orchestration hook combining all functionality

```tsx
import { useJiraRecords } from './useJiraRecords';
import { useTeamCapacity } from './useTeamCapacity';
import { useExecutionValidation } from './useExecutionValidation';

export const useExecutionPlanning = (featureId: string | undefined) => {
  const jiraRecords = useJiraRecords(featureId);
  const teamCapacity = useTeamCapacity();
  const validation = useExecutionValidation(featureId);

  const handleRecordCreated = async () => {
    await jiraRecords.refreshRecords();
    await validation.validate();
  };

  const handleRecordUpdated = async () => {
    await jiraRecords.refreshRecords();
    await validation.validate();
  };

  const handleRecordDeleted = async () => {
    await jiraRecords.refreshRecords();
    await validation.validate();
  };

  return {
    // JIRA records
    records: jiraRecords.records,
    recordsLoading: jiraRecords.loading,
    recordsError: jiraRecords.error,
    createRecord: jiraRecords.createRecord,
    updateRecord: jiraRecords.updateRecord,
    deleteRecord: jiraRecords.deleteRecord,
    refreshRecords: jiraRecords.refreshRecords,
    
    // Team capacity
    capacityInfo: teamCapacity.capacityInfo,
    capacityLoading: teamCapacity.loading,
    loadCapacity: teamCapacity.loadCapacity,
    checkCapacity: teamCapacity.checkCapacity,
    
    // Validation
    validationResult: validation.validationResult,
    isValidating: validation.isValidating,
    validateExecution: validation.validate,
    
    // Orchestration
    handleRecordCreated,
    handleRecordUpdated,
    handleRecordDeleted
  };
};
```

---

## 5. API Service Layer

### jiraRecordApi.ts

```tsx
import axios from 'axios';
import { 
  JiraRecord, 
  JiraRecordCreate, 
  JiraRecordUpdate,
  JiraRecordListResponse,
  TeamPIAllocation,
  ExecutionValidationResponse,
  SpilloverRequest
} from '@/types/jiraRecord';

const API_BASE = '/api';

export const jiraRecordApi = {
  /**
   * List JIRA records for a feature
   */
  list: async (
    featureId: string, 
    filters?: {
      status?: string;
      team_id?: string;
      pi_id?: string;
    }
  ): Promise<JiraRecordListResponse> => {
    const params = new URLSearchParams(filters as any);
    const response = await axios.get(
      `${API_BASE}/features/${featureId}/jira-records?${params}`
    );
    return response.data;
  },

  /**
   * Get single JIRA record
   */
  get: async (recordId: string): Promise<JiraRecord> => {
    const response = await axios.get(`${API_BASE}/jira-records/${recordId}`);
    return response.data;
  },

  /**
   * Create JIRA record
   */
  create: async (
    featureId: string, 
    data: JiraRecordCreate
  ): Promise<{ record: JiraRecord; capacity_warning?: any }> => {
    const response = await axios.post(
      `${API_BASE}/features/${featureId}/jira-records`,
      data
    );
    return response.data;
  },

  /**
   * Update JIRA record
   */
  update: async (
    recordId: string, 
    data: JiraRecordUpdate
  ): Promise<JiraRecord> => {
    const response = await axios.put(
      `${API_BASE}/jira-records/${recordId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete JIRA record
   */
  delete: async (recordId: string): Promise<void> => {
    await axios.delete(`${API_BASE}/jira-records/${recordId}`);
  },

  /**
   * Mark as spillover
   */
  markAsSpillover: async (
    recordId: string, 
    data: SpilloverRequest
  ): Promise<JiraRecord> => {
    const response = await axios.post(
      `${API_BASE}/jira-records/${recordId}/spillover`,
      data
    );
    return response.data;
  },

  /**
   * Get team PI allocation
   */
  getTeamPIAllocation: async (
    teamId: string, 
    piId: string
  ): Promise<TeamPIAllocation> => {
    const response = await axios.get(
      `${API_BASE}/teams/${teamId}/pi-allocation/${piId}`
    );
    return response.data;
  },

  /**
   * Validate execution plan
   */
  validateExecution: async (
    featureId: string
  ): Promise<ExecutionValidationResponse> => {
    const response = await axios.post(
      `${API_BASE}/features/${featureId}/validate-execution`
    );
    return response.data;
  }
};
```

---

## 6. TypeScript Types

### types/jiraRecord.ts

```tsx
// ============================================
// Core Types
// ============================================

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
  status: JiraRecordStatus;
  spillover_from_pi_id?: string;
  spillover_from_pi_name?: string;
  spillover_reason?: string;
  created_at: string;
  updated_at: string;
}

export type JiraRecordStatus = 
  | 'PLANNED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'SPILLOVER';

// ============================================
// Request Types
// ============================================

export interface JiraRecordCreate {
  jira_key?: string;
  title: string;
  description?: string;
  team_id: string;
  pi_id: string;
  planned_effort: number;
  status: JiraRecordStatus;
  spillover_from_pi_id?: string;
  spillover_reason?: string;
}

export interface JiraRecordUpdate {
  jira_key?: string;
  title?: string;
  description?: string;
  team_id?: string;
  pi_id?: string;
  planned_effort?: number;
  actual_effort?: number;
  status?: JiraRecordStatus;
  spillover_from_pi_id?: string;
  spillover_reason?: string;
}

export interface SpilloverRequest {
  new_pi_id: string;
  reason: string;
}

// ============================================
// Response Types
// ============================================

export interface JiraRecordListResponse {
  items: JiraRecord[];
  total: number;
  summary: {
    total_planned_effort: number;
    total_actual_effort: number;
    by_status: Record<string, number>;
    by_pi: Record<string, number>;
    by_team: Record<string, number>;
  };
}

export interface TeamPIAllocation {
  team_id: string;
  team_name: string;
  pi_id: string;
  pi_name: string;
  total_capacity_ed: number;
  allocated_effort_ed: number;
  available_effort_ed: number;
  utilization_percent: number;
  is_over_allocated: boolean;
  jira_records: JiraRecord[];
}

export interface ExecutionValidationResponse {
  feature_id: string;
  feature_name: string;
  is_valid: boolean;
  warnings: ExecutionValidationWarning[];
  quarterly_comparisons: QuarterAllocationComparison[];
  total_strategic_ed: number;
  total_execution_ed: number;
  total_difference_ed: number;
}

export interface ExecutionValidationWarning {
  level: 'warning' | 'error';
  message: string;
  details: {
    year: number;
    quarter: number;
    strategic: number;
    execution: number;
    difference: number;
  };
}

export interface QuarterAllocationComparison {
  year: number;
  quarter: number;
  strategic_allocation_ed: number;
  execution_allocation_ed: number;
  difference_ed: number;
  is_matched: boolean;
}

export interface CapacityWarning {
  team_id: string;
  team_name: string;
  pi_id: string;
  pi_name: string;
  capacity_ed: number;
  current_allocation_ed: number;
  new_allocation_ed: number;
  total_allocation_ed: number;
  over_allocation_ed: number;
  message: string;
}

// ============================================
// Supporting Types
// ============================================

export interface QuarterlyAllocation {
  year: number;
  quarter: number;
  allocated_ed: number;
}
```

---

## 7. State Management Strategy

### 7.1 Local State (Component-Level)

**Use for:**
- UI state (modal open/close, form values)
- Temporary selections
- Loading/error states

**Example:**
```tsx
const [modalOpen, setModalOpen] = useState(false);
const [selectedRecord, setSelectedRecord] = useState<JiraRecord | null>(null);
```

### 7.2 Custom Hooks (Feature-Level)

**Use for:**
- Data fetching and caching
- Business logic
- Side effects coordination

**Example:**
```tsx
const { records, loading, createRecord } = useJiraRecords(featureId);
```

### 7.3 Context (Optional, for Global State)

**Use for:**
- Shared data across multiple components
- User preferences
- Theme settings

**Not needed for this feature** - local state and custom hooks are sufficient.

---

## 8. Data Flow

### 8.1 Create JIRA Record Flow

```
User clicks "Add JIRA Record"
  ↓
Modal opens (setModalOpen(true))
  ↓
User fills form
  ↓
User selects Team → loadCapacity(teamId, piId)
  ↓
User selects PI → loadCapacity(teamId, piId)
  ↓
User enters Effort → checkCapacity(effort)
  ↓
Capacity warning shown (if over-allocated)
  ↓
User clicks "Save"
  ↓
createRecord(data) → API POST
  ↓
Success:
  - Modal closes
  - refreshRecords()
  - validateExecution()
  - Success message
  ↓
UI updates:
  - Table refreshes
  - Progress bar updates
  - Validation alerts update
```

### 8.2 Edit JIRA Record Flow

```
User clicks "Edit" in actions menu
  ↓
Modal opens with record data
  ↓
User modifies fields
  ↓
Capacity checks run on changes
  ↓
User clicks "Update"
  ↓
updateRecord(recordId, data) → API PUT
  ↓
Success:
  - Modal closes
  - refreshRecords()
  - validateExecution()
  - Success message
  ↓
UI updates
```

### 8.3 Delete JIRA Record Flow

```
User clicks "Delete" in actions menu
  ↓
Confirmation modal appears
  ↓
User confirms
  ↓
deleteRecord(recordId) → API DELETE
  ↓
Success:
  - refreshRecords()
  - validateExecution()
  - Success message
  ↓
UI updates
```

---

## 9. Error Handling

### 9.1 API Errors

```tsx
try {
  await jiraRecordApi.create(featureId, data);
  message.success('JIRA record created');
} catch (error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;
    
    if (status === 409) {
      message.error(`Duplicate JIRA key: ${detail}`);
    } else if (status === 404) {
      message.error(`Resource not found: ${detail}`);
    } else {
      message.error('Failed to create JIRA record');
    }
  } else {
    message.error('An unexpected error occurred');
  }
}
```

### 9.2 Validation Errors

```tsx
try {
  await form.validateFields();
  // Proceed with save
} catch (error) {
  // Form validation failed
  // Ant Design will show field-level errors automatically
  message.warning('Please fix validation errors');
}
```

### 9.3 Network Errors

```tsx
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setError(null);
      const data = await jiraRecordApi.list(featureId);
      setRecords(data.items);
    } catch (err) {
      setError('Failed to load JIRA records. Please try again.');
    }
  };
  
  fetchData();
}, [featureId]);

// In component
{error && (
  <Alert
    message="Error"
    description={error}
    type="error"
    closable
    onClose={() => setError(null)}
  />
)}
```

---

## 10. Performance Optimization

### 10.1 Lazy Loading

```tsx
// Lazy load the drawer component
const ExecutionPlanningDrawer = lazy(() => 
  import('./ExecutionPlanning/ExecutionPlanningDrawer')
);

// In ProductRoadmapPage
<Suspense fallback={<Spin />}>
  <ExecutionPlanningDrawer ... />
</Suspense>
```

### 10.2 Memoization

```tsx
// Memoize expensive calculations
const executionProgress = useMemo(() => {
  const totalStrategic = strategicAllocations.reduce((sum, a) => sum + a.allocated_ed, 0);
  const totalExecution = records.reduce((sum, r) => sum + r.planned_effort, 0);
  const percentage = (totalExecution / totalStrategic) * 100;
  
  return { totalStrategic, totalExecution, percentage };
}, [records, strategicAllocations]);

// Memoize callbacks
const handleEdit = useCallback((record: JiraRecord) => {
  setSelectedRecord(record);
  setModalOpen(true);
}, []);
```

### 10.3 Debouncing

```tsx
// Debounce capacity checks
const debouncedCapacityCheck = useMemo(
  () => debounce((teamId, piId, effort) => {
    checkCapacity(teamId, piId, effort);
  }, 500),
  []
);

// Use in form
<InputNumber onChange={(value) => debouncedCapacityCheck(teamId, piId, value)} />
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

**Test custom hooks:**
```tsx
// useJiraRecords.test.ts
describe('useJiraRecords', () => {
  it('should fetch records on mount', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useJiraRecords('feature-123')
    );
    
    await waitForNextUpdate();
    
    expect(result.current.records).toHaveLength(3);
    expect(result.current.loading).toBe(false);
  });
  
  it('should create record successfully', async () => {
    const { result } = renderHook(() => useJiraRecords('feature-123'));
    
    await act(async () => {
      await result.current.createRecord(mockData);
    });
    
    expect(result.current.records).toHaveLength(4);
  });
});
```

**Test components:**
```tsx
// StatusBadge.test.tsx
describe('StatusBadge', () => {
  it('should render PLANNED status correctly', () => {
    const { getByText } = render(<StatusBadge status="PLANNED" />);
    expect(getByText('Planned')).toBeInTheDocument();
  });
  
  it('should show correct color for SPILLOVER', () => {
    const { container } = render(<StatusBadge status="SPILLOVER" />);
    const tag = container.querySelector('.ant-tag-red');
    expect(tag).toBeInTheDocument();
  });
});
```

### 11.2 Integration Tests

```tsx
// ExecutionPlanningDrawer.test.tsx
describe('ExecutionPlanningDrawer', () => {
  it('should load and display JIRA records', async () => {
    const { getByText, findByText } = render(
      <ExecutionPlanningDrawer 
        open={true}
        feature={mockFeature}
        onClose={jest.fn()}
      />
    );
    
    expect(await findByText('PROJ-123')).toBeInTheDocument();
    expect(await findByText('Backend API')).toBeInTheDocument();
  });
  
  it('should open modal when Add button clicked', async () => {
    const { getByText, findByText } = render(
      <ExecutionPlanningDrawer ... />
    );
    
    fireEvent.click(getByText('Add JIRA Record'));
    
    expect(await findByText('Add JIRA Record')).toBeInTheDocument();
  });
});
```

### 11.3 E2E Tests (Playwright/Cypress)

```tsx
// execution-planning.spec.ts
describe('Execution Planning', () => {
  it('should create JIRA record successfully', () => {
    cy.visit('/roadmap/product-123');
    cy.contains('Execute').click();
    cy.contains('Add JIRA Record').click();
    
    cy.get('[name="jira_key"]').type('PROJ-456');
    cy.get('[name="title"]').type('New Feature');
    cy.get('[name="team_id"]').select('Team Nova');
    cy.get('[name="pi_id"]').select('PI 2026.1');
    cy.get('[name="planned_effort"]').type('15');
    
    cy.contains('Save JIRA Record').click();
    
    cy.contains('PROJ-456').should('be.visible');
    cy.contains('JIRA record created').should('be.visible');
  });
});
```

---

## 12. Implementation Checklist

### Phase 1: Setup & Types (Day 1)
- [ ] Create file structure
- [ ] Define TypeScript types in `types/jiraRecord.ts`
- [ ] Create API service in `services/jiraRecordApi.ts`
- [ ] Set up barrel exports

### Phase 2: Custom Hooks (Day 1-2)
- [ ] Implement `useJiraRecords` hook
- [ ] Implement `useTeamCapacity` hook
- [ ] Implement `useExecutionValidation` hook
- [ ] Implement `useExecutionPlanning` orchestration hook
- [ ] Write unit tests for hooks

### Phase 3: Basic Components (Day 2)
- [ ] Create `StatusBadge` component
- [ ] Create `StrategicAllocationSummary` component
- [ ] Create `ExecutionProgressBar` component
- [ ] Create `ValidationAlert` component
- [ ] Write unit tests for components

### Phase 4: Table Components (Day 2-3)
- [ ] Create `JiraRecordsTable` component
- [ ] Create `JiraRecordRow` component
- [ ] Create `ActionsMenu` component
- [ ] Add empty state
- [ ] Add loading state
- [ ] Write integration tests

### Phase 5: Modal Components (Day 3-4)
- [ ] Create `JiraRecordModal` container
- [ ] Create `BasicInfoSection`
- [ ] Create `TeamPISection`
- [ ] Create `EffortSection`
- [ ] Create `SpilloverSection`
- [ ] Create `CapacityInfo` component
- [ ] Create `CapacityWarning` component
- [ ] Wire up form validation
- [ ] Write integration tests

### Phase 6: Main Drawer (Day 4)
- [ ] Create `ExecutionPlanningDrawer` component
- [ ] Integrate all child components
- [ ] Wire up data flow
- [ ] Add error handling
- [ ] Write integration tests

### Phase 7: Integration (Day 5)
- [ ] Modify `ProductRoadmapPage` to add Execute button
- [ ] Connect drawer to page
- [ ] Test full user flows
- [ ] Fix bugs and edge cases

### Phase 8: Polish & Testing (Day 5)
- [ ] Add loading states everywhere
- [ ] Add error boundaries
- [ ] Implement responsive design
- [ ] Add accessibility features
- [ ] Write E2E tests
- [ ] Performance optimization
- [ ] Code review and refactoring

---

## 13. Dependencies

### Required Packages

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "antd": "^5.12.0",
    "@ant-design/icons": "^5.2.6",
    "axios": "^1.6.0",
    "lodash": "^4.17.21",
    "dayjs": "^1.11.10"
  },
  "devDependencies": {
    "@testing-library/react": "^14.1.2",
    "@testing-library/react-hooks": "^8.0.1",
    "@testing-library/user-event": "^14.5.1",
    "jest": "^29.7.0",
    "cypress": "^13.6.0"
  }
}
```

---

## 14. Summary

This architecture provides:

✅ **Clear component hierarchy** with single responsibility  
✅ **Reusable custom hooks** for data management  
✅ **Type-safe API layer** with TypeScript  
✅ **Efficient state management** without global state  
✅ **Comprehensive error handling**  
✅ **Performance optimizations** built-in  
✅ **Testable components** with clear boundaries  
✅ **Scalable structure** for future enhancements  

**Estimated Implementation Time:** 5 days for experienced React developer

**Next Steps:**
1. Frontend Developer implements following this architecture
2. Regular code reviews after each phase
3. QA testing after Phase 7
4. Final polish and deployment

---

**Document Version:** 1.0  
**Last Updated:** February 6, 2026  
**Status:** Ready for Implementation
