# React Component Structure - Implementation Guide

## Component Hierarchy

```
App
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── MainNavigation
│   │   └── UserMenu
│   └── Content
│       └── [Route Components]
│
├── Pages
│   ├── Dashboard
│   │   ├── BudgetHealthSection
│   │   │   └── BudgetCard (×4)
│   │   ├── CapacityUtilizationSection
│   │   │   └── CapacityGrid
│   │   └── QuickStatsSection
│   │       └── StatCard (×4)
│   │
│   ├── Setup
│   │   ├── ProductsTab
│   │   │   ├── ProductCard (×N)
│   │   │   └── ProductFormPanel
│   │   ├── BudgetsTab
│   │   │   ├── VersionHistory
│   │   │   ├── BudgetAllocationTable
│   │   │   └── BudgetVersionPanel
│   │   └── TeamsTab
│   │       ├── TeamsTable
│   │       ├── TeamDetailPanel
│   │       └── TeamFormPanel
│   │
│   ├── Features
│   │   ├── AllFeaturesTab
│   │   │   ├── FeatureFilters
│   │   │   ├── FeatureTable
│   │   │   └── FeatureDetailPanel
│   │   └── FromJiraTab
│   │       ├── JiraConnectStep
│   │       ├── JiraReviewStep
│   │       ├── MetadataFormStep
│   │       └── CalculationsReviewStep
│   │
│   ├── Planning (placeholder)
│   └── Reports (placeholder)
│
└── Common Components
    ├── SidePanel
    ├── ProgressBar
    ├── StatusBadge
    ├── EmptyState
    ├── LoadingSpinner
    └── ConfirmDialog
```

---

## Shared Components

### 1. SidePanel

**Purpose:** Reusable slide-in panel for details/forms

**Props:**
```typescript
interface SidePanelProps {
  visible: boolean;
  title: string;
  width?: number; // default 480px
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}
```

**Example Usage:**
```tsx
<SidePanel
  visible={showPanel}
  title="Team Details"
  onClose={() => setShowPanel(false)}
  footer={
    <>
      <Button onClick={() => setShowPanel(false)}>Cancel</Button>
      <Button type="primary" onClick={handleSave}>Save</Button>
    </>
  }
>
  <Form>
    {/* Form content */}
  </Form>
</SidePanel>
```

**Implementation with Ant Design:**
```tsx
import { Drawer } from 'antd';

const SidePanel: React.FC<SidePanelProps> = ({
  visible,
  title,
  width = 480,
  onClose,
  footer,
  children
}) => {
  return (
    <Drawer
      title={title}
      placement="right"
      width={width}
      onClose={onClose}
      open={visible}
      footer={footer}
      footerStyle={{
        textAlign: 'right',
        paddingTop: 16,
        borderTop: '1px solid #d9d9d9'
      }}
    >
      {children}
    </Drawer>
  );
};
```

---

### 2. ProgressBar

**Purpose:** Show consumption/utilization with color coding

**Props:**
```typescript
interface ProgressBarProps {
  percent: number; // 0-100
  showLabel?: boolean;
  size?: 'small' | 'default' | 'large';
  format?: (percent: number) => string;
}
```

**Color Logic:**
- 0-79%: Success (green)
- 80-89%: Warning (yellow)
- 90-100%: Error (red)

**Implementation:**
```tsx
import { Progress } from 'antd';

const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  showLabel = true,
  size = 'default',
  format
}) => {
  const getStatus = (percent: number) => {
    if (percent >= 90) return 'exception'; // red
    if (percent >= 80) return 'normal'; // yellow
    return 'success'; // green
  };

  const strokeColor = (percent: number) => {
    if (percent >= 90) return '#f5222d';
    if (percent >= 80) return '#faad14';
    return '#52c41a';
  };

  return (
    <Progress
      percent={percent}
      status={getStatus(percent)}
      strokeColor={strokeColor(percent)}
      showInfo={showLabel}
      format={format}
      size={size}
    />
  );
};
```

---

### 3. StatusBadge

**Purpose:** Display status with color coding

**Props:**
```typescript
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'draft' | 'in_progress' | 'done' | 'blocked';
  text?: string; // optional custom text
}
```

**Implementation:**
```tsx
import { Tag } from 'antd';

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text }) => {
  const config = {
    active: { color: 'success', label: 'Active' },
    inactive: { color: 'default', label: 'Inactive' },
    draft: { color: 'default', label: 'Draft' },
    in_progress: { color: 'processing', label: 'In Progress' },
    done: { color: 'success', label: 'Done' },
    blocked: { color: 'error', label: 'Blocked' }
  };

  const { color, label } = config[status];
  
  return <Tag color={color}>{text || label}</Tag>;
};
```

---

### 4. EmptyState

**Purpose:** Show when no data exists

**Props:**
```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    text: string;
    onClick: () => void;
  };
}
```

**Implementation:**
```tsx
import { Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center' }}>
      <Empty
        image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
              {title}
            </div>
            {description && (
              <div style={{ color: '#8c8c8c' }}>
                {description}
              </div>
            )}
          </>
        }
      >
        {action && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={action.onClick}
          >
            {action.text}
          </Button>
        )}
      </Empty>
    </div>
  );
};
```

---

## Page Components

### Setup > Products Tab

**File:** `src/pages/Setup/ProductsTab.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Space } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { SidePanel } from '@/components/SidePanel';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { ProductForm } from './ProductForm';
import { getProducts, createProduct, updateProduct } from '@/services/api';

interface Product {
  id: string;
  name: string;
  shortCode: string;
  description: string;
  status: 'active' | 'inactive';
  teamCount: number;
}

export const ProductsTab: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setShowPanel(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowPanel(true);
  };

  const handleSave = async (values: Partial<Product>) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, values);
    } else {
      await createProduct(values);
    }
    setShowPanel(false);
    loadProducts();
  };

  if (!loading && products.length === 0) {
    return (
      <EmptyState
        title="No products yet"
        description="Get started by adding your first product"
        action={{
          text: 'Add Product',
          onClick: handleAdd
        }}
      />
    );
  }

  return (
    <>
      <div style={{ marginBottom: 24, textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Add Product
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {products.map(product => (
          <Col xs={24} sm={12} lg={8} key={product.id}>
            <Card
              hoverable
              actions={[
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(product)}
                >
                  Edit
                </Button>,
                <Button type="text">Budget</Button>
              ]}
            >
              <Card.Meta
                title={
                  <Space>
                    {product.name}
                    <StatusBadge status={product.status} />
                  </Space>
                }
                description={
                  <>
                    <div style={{ marginBottom: 8 }}>
                      {product.description}
                    </div>
                    <div style={{ color: '#8c8c8c' }}>
                      {product.teamCount} Teams
                    </div>
                  </>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      <SidePanel
        visible={showPanel}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        onClose={() => setShowPanel(false)}
      >
        <ProductForm
          initialValues={editingProduct}
          onSave={handleSave}
          onCancel={() => setShowPanel(false)}
        />
      </SidePanel>
    </>
  );
};
```

---

### Setup > Budgets Tab

**File:** `src/pages/Setup/BudgetsTab.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { Select, Button, Table, Space, Card } from 'antd';
import { PlusOutlined, EditOutlined, LockOutlined } from '@ant-design/icons';
import { ProgressBar } from '@/components/ProgressBar';
import { SidePanel } from '@/components/SidePanel';
import { BudgetVersionForm } from './BudgetVersionForm';
import { getBudgetVersions, getBudgetAllocation } from '@/services/api';

interface BudgetLine {
  id: string;
  name: string;
  allocated: number;
  consumed: number;
  remaining: number;
  percentage: number;
}

export const BudgetsTab: React.FC = () => {
  const [product, setProduct] = useState('BRS');
  const [year, setYear] = useState(2026);
  const [versions, setVersions] = useState([]);
  const [activeVersion, setActiveVersion] = useState(null);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    loadData();
  }, [product, year]);

  const loadData = async () => {
    const versionsData = await getBudgetVersions(product, year);
    setVersions(versionsData);
    
    const active = versionsData.find(v => v.status === 'active');
    if (active) {
      const allocation = await getBudgetAllocation(active.id);
      setBudgetLines(allocation);
      setActiveVersion(active);
    }
  };

  const budgetColumns = [
    {
      title: 'Budget Line',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: BudgetLine) => (
        <>
          <div style={{ marginBottom: 8 }}>{text}</div>
          <ProgressBar percent={record.percentage} />
        </>
      ),
    },
    {
      title: 'Allocated',
      dataIndex: 'allocated',
      key: 'allocated',
      render: (value: number) => `${value.toLocaleString()} KEUR`,
    },
    {
      title: 'Consumed',
      dataIndex: 'consumed',
      key: 'consumed',
      render: (value: number) => `${value.toLocaleString()} KEUR`,
    },
    {
      title: 'Remaining',
      dataIndex: 'remaining',
      key: 'remaining',
      render: (value: number) => `${value.toLocaleString()} KEUR`,
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 24 }}>
        <span>Product:</span>
        <Select
          value={product}
          onChange={setProduct}
          style={{ width: 120 }}
          options={[
            { label: 'BRS', value: 'BRS' },
            { label: 'FM', value: 'FM' },
          ]}
        />
        <span>Budget Year:</span>
        <Select
          value={year}
          onChange={setYear}
          style={{ width: 120 }}
          options={[
            { label: '2026', value: 2026 },
            { label: '2027', value: 2027 },
          ]}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setShowPanel(true)}
        >
          New Version
        </Button>
      </Space>

      <Card
        title="Version History"
        style={{ marginBottom: 24 }}
      >
        <Table
          dataSource={versions}
          columns={[
            {
              title: 'Version',
              dataIndex: 'name',
              key: 'name',
              render: (text, record) => (
                <>
                  {record.status === 'active' && '● '}
                  {text}
                </>
              ),
            },
            {
              title: 'Created',
              dataIndex: 'created_at',
              key: 'created_at',
              render: (date) => new Date(date).toLocaleDateString(),
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status) => (
                <StatusBadge status={status} />
              ),
            },
            {
              title: 'Total Budget',
              dataIndex: 'total_budget',
              key: 'total_budget',
              render: (value) => `${value.toLocaleString()} KEUR`,
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button size="small">View</Button>
                  {record.status !== 'active' && (
                    <Button size="small">Copy</Button>
                  )}
                </Space>
              ),
            },
          ]}
          pagination={false}
        />
      </Card>

      {activeVersion && (
        <Card
          title={
            <Space>
              Budget Allocation - {activeVersion.name} (Active)
              <Button
                size="small"
                icon={<EditOutlined />}
              >
                Edit
              </Button>
              <Button
                size="small"
                icon={<LockOutlined />}
              >
                Lock
              </Button>
            </Space>
          }
        >
          <Table
            dataSource={budgetLines}
            columns={budgetColumns}
            pagination={false}
            summary={(pageData) => {
              const totalAllocated = pageData.reduce(
                (sum, record) => sum + record.allocated,
                0
              );
              const totalConsumed = pageData.reduce(
                (sum, record) => sum + record.consumed,
                0
              );
              const totalRemaining = pageData.reduce(
                (sum, record) => sum + record.remaining,
                0
              );

              return (
                <Table.Summary.Row style={{ fontWeight: 'bold' }}>
                  <Table.Summary.Cell index={0}>TOTAL</Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    {totalAllocated.toLocaleString()} KEUR
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    {totalConsumed.toLocaleString()} KEUR
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    {totalRemaining.toLocaleString()} KEUR
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </Card>
      )}

      <SidePanel
        visible={showPanel}
        title="Budget Version"
        onClose={() => setShowPanel(false)}
      >
        <BudgetVersionForm
          product={product}
          year={year}
          onSave={() => {
            setShowPanel(false);
            loadData();
          }}
          onCancel={() => setShowPanel(false)}
        />
      </SidePanel>
    </>
  );
};
```

---

### Features > From JIRA Tab

**File:** `src/pages/Features/FromJiraTab.tsx`

```tsx
import React, { useState } from 'react';
import { Steps, Form, Input, Button, Alert, Space, Radio, Select, Rate } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { ProgressBar } from '@/components/ProgressBar';
import { fetchFromJira, createFeature } from '@/services/api';

const { Step } = Steps;

export const FromJiraTab: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [jiraData, setJiraData] = useState(null);
  const [calculations, setCalculations] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetchJira = async (values: { jiraUrl: string; apiToken: string }) => {
    setLoading(true);
    try {
      const data = await fetchFromJira(values.jiraUrl, values.apiToken);
      setJiraData(data);
      setCurrentStep(1);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleMetadataNext = (values: any) => {
    // Calculate impacts
    const netSizing = jiraData.gross_sizing / 2.8;
    const cost = (jiraData.gross_sizing / 220) * 78;
    
    setCalculations({
      netSizing,
      cost,
      budgetImpact: {
        // Calculate budget impact
      },
      capacityImpact: {
        // Calculate capacity impact
      }
    });
    
    setCurrentStep(2);
  };

  const handleSave = async () => {
    const featureData = {
      ...jiraData,
      ...form.getFieldsValue(),
      ...calculations
    };
    
    await createFeature(featureData);
    // Navigate to features list
  };

  const steps = [
    {
      title: 'Connect to JIRA',
      content: (
        <Form form={form} onFinish={handleFetchJira} layout="vertical">
          <Form.Item
            name="jiraUrl"
            label="JIRA URL"
            rules={[{ required: true, message: 'Please enter JIRA URL' }]}
          >
            <Input
              prefix={<LinkOutlined />}
              placeholder="https://company.atlassian.net/browse/PROJ-123"
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="apiToken"
            label="API Token"
            extra="Your token is stored securely"
          >
            <Input.Password size="large" />
          </Form.Item>
          
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
          >
            Fetch from JIRA →
          </Button>
        </Form>
      ),
    },
    {
      title: 'Review JIRA Data',
      content: jiraData && (
        <>
          <Alert
            message="Successfully fetched from JIRA"
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <strong>JIRA Key:</strong> {jiraData.jira_key}
            </div>
            <div>
              <strong>Feature Name:</strong> {jiraData.name}
            </div>
            <div>
              <strong>Epic Owner:</strong> {jiraData.epic_owner}
            </div>
            <div>
              <strong>Team:</strong> {jiraData.assigned_team}
            </div>
            <div>
              <strong>Size:</strong> {jiraData.gross_sizing} days
            </div>
            <div>
              <strong>Status:</strong> {jiraData.jira_status}
            </div>
          </Space>
          
          <Button
            type="primary"
            onClick={() => setCurrentStep(1)}
            style={{ marginTop: 24 }}
          >
            Continue →
          </Button>
        </>
      ),
    },
    {
      title: 'Add Metadata',
      content: (
        <Form form={form} onFinish={handleMetadataNext} layout="vertical">
          <Form.Item
            name="budget_line"
            label="Budget Line"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="product_evolution">Product Evolution</Radio>
                <Radio value="maintenance">Maintenance</Radio>
                <Radio value="implementation">Implementation</Radio>
                <Radio value="bespoke">Bespoke</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
          
          <Space size="large" style={{ width: '100%' }}>
            <Form.Item
              name="product"
              label="Product"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select
                placeholder="Select product"
                options={[
                  { label: 'BRS', value: 'BRS' },
                  { label: 'FM', value: 'FM' },
                ]}
              />
            </Form.Item>
            
            <Form.Item
              name="customer"
              label="Customer"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Customer name" />
            </Form.Item>
          </Space>
          
          <Space size="large" style={{ width: '100%' }}>
            <Form.Item
              name="priority"
              label="Priority"
              rules={[{ required: true }]}
            >
              <Rate />
            </Form.Item>
            
            <Form.Item
              name="allocated_quarter"
              label="Allocated Quarter"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select quarter"
                options={[
                  { label: '2026-Q1', value: '2026-Q1' },
                  { label: '2026-Q2', value: '2026-Q2' },
                  { label: '2026-Q3', value: '2026-Q3' },
                  { label: '2026-Q4', value: '2026-Q4' },
                ]}
              />
            </Form.Item>
          </Space>
          
          <Button type="primary" htmlType="submit">
            Continue →
          </Button>
        </Form>
      ),
    },
    {
      title: 'Review Calculations',
      content: calculations && (
        <>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <strong>Net Sizing:</strong> {calculations.netSizing.toFixed(1)} days
              <br />
              <small>({jiraData.gross_sizing} days ÷ 2.8 tax rate)</small>
            </div>
            
            <div>
              <strong>Cost:</strong> {calculations.cost.toFixed(1)} KEUR
              <br />
              <small>({jiraData.gross_sizing} days ÷ 220 × 78 KEUR)</small>
            </div>
            
            <div>
              <strong>Budget Impact:</strong> Product Evolution
              <div style={{ marginTop: 8 }}>
                Current: 745 KEUR → New: {(745 + calculations.cost).toFixed(1)} KEUR
                <ProgressBar
                  percent={((745 + calculations.cost) / 1500) * 100}
                  showLabel
                />
              </div>
            </div>
            
            <div>
              <strong>Capacity Impact:</strong> Team A (Q1 2026)
              <div style={{ marginTop: 8 }}>
                Current: 134.3d → New: {(134.3 + calculations.netSizing).toFixed(1)}d
                <ProgressBar
                  percent={((134.3 + calculations.netSizing) / 200) * 100}
                  showLabel
                />
              </div>
            </div>
          </Space>
          
          <Space style={{ marginTop: 24 }}>
            <Button onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button type="primary" onClick={handleSave}>
              Save Feature
            </Button>
          </Space>
        </>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 0' }}>
      <Steps current={currentStep} style={{ marginBottom: 32 }}>
        {steps.map(step => (
          <Step key={step.title} title={step.title} />
        ))}
      </Steps>
      
      <div style={{
        padding: 32,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {steps[currentStep].content}
      </div>
    </div>
  );
};
```

---

## API Service Layer

**File:** `src/services/api.ts`

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Products
export const getProducts = () => api.get('/products').then(res => res.data);
export const createProduct = (data: any) => api.post('/products', data).then(res => res.data);
export const updateProduct = (id: string, data: any) => api.put(`/products/${id}`, data).then(res => res.data);
export const deleteProduct = (id: string) => api.delete(`/products/${id}`);

// Budgets
export const getBudgetVersions = (product: string, year: number) =>
  api.get(`/budgets/versions`, { params: { product, year } }).then(res => res.data);
export const getBudgetAllocation = (versionId: string) =>
  api.get(`/budgets/${versionId}/allocation`).then(res => res.data);
export const createBudgetVersion = (data: any) =>
  api.post('/budgets/versions', data).then(res => res.data);

// Teams
export const getTeams = () => api.get('/teams').then(res => res.data);
export const createTeam = (data: any) => api.post('/teams', data).then(res => res.data);
export const updateTeam = (id: string, data: any) => api.put(`/teams/${id}`, data).then(res => res.data);
export const getTeamDetails = (id: string) => api.get(`/teams/${id}`).then(res => res.data);

// JIRA
export const fetchFromJira = (jiraUrl: string, apiToken: string) =>
  api.post('/jira/fetch', { jira_url: jiraUrl, api_token: apiToken }).then(res => res.data);

// Features
export const getFeatures = (filters?: any) =>
  api.get('/features', { params: filters }).then(res => res.data);
export const createFeature = (data: any) =>
  api.post('/features', data).then(res => res.data);
export const updateFeature = (id: string, data: any) =>
  api.put(`/features/${id}`, data).then(res => res.data);
export const deleteFeature = (id: string) =>
  api.delete(`/features/${id}`);

// Dashboard
export const getBudgetSummary = (product?: string, year?: number) =>
  api.get('/dashboard/budget', { params: { product, year } }).then(res => res.data);
export const getCapacitySummary = (year?: number) =>
  api.get('/dashboard/capacity', { params: { year } }).then(res => res.data);

export default api;
```

---

## Next Steps

1. **Review these designs** - Make sure they match your vision
2. **Adjust as needed** - Let me know what changes you want
3. **I'll create the actual Windsurf prompts** - To build each component
4. **Start with Setup screens** - Get configuration working first
5. **Then JIRA integration** - Your key feature
6. **Then Dashboard** - Visual overview

What would you like me to adjust or clarify in these designs?
