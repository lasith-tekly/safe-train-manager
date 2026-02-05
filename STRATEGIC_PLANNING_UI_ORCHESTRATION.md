# Strategic Planning UI Improvement - Orchestration Plan

## 📊 Project Overview

**Project:** Strategic Planning UI Enhancement  
**Module:** Roadmap Planning V4  
**Type:** Frontend-only (with optional backend for customer tags)  
**Priority:** High  
**Estimated Duration:** 4 phases, ~3-4 days  

---

## 🎯 Business Objectives

### Problem Statement
Product Managers need better UX for managing multi-year roadmaps:
- Current table doesn't clearly show which year quarters belong to
- No visual distinction between 2026 Q1 and 2027 Q1
- Priority and customer fields lack structure
- No quick way to view feature details without opening edit modal

### Success Criteria
✅ Clear year-grouped column headers (2026 Q1-Q4, 2027 Q1-Q4)  
✅ Structured priority selection (0-Critical to 3-Low)  
✅ Reusable customer tag system  
✅ Quick feature detail view via right-side panel  
✅ Improved table navigation with sticky columns  

---

## 🏗️ Architecture Analysis

### Current State
```
ProductsOverviewPage.tsx
  ↓
ProductRoadmapPage.tsx (Table with Q1-Q4 columns)
  ↓
FeatureForm.tsx (Modal for create/edit)
  ↓
QuarterlyPlanningGrid.tsx (Year + Q1-Q4 input grid)
```

### Proposed Changes
```
ProductsOverviewPage.tsx (no changes)
  ↓
ProductRoadmapPage.tsx
  ├─ Enhanced table (year-grouped headers, sticky columns)
  ├─ Year filter dropdown
  ├─ Priority column with tags
  ├─ Budget Line column
  └─ FeatureDetailPanel.tsx (NEW - right-side drawer)
       ├─ Details tab (read mode)
       └─ Execution tab (placeholder)
  ↓
FeatureForm.tsx
  ├─ Priority dropdown (0-3 with labels)
  ├─ Customer tag selector
  └─ Collapsible remarks section
  ↓
QuarterlyPlanningGrid.tsx (no changes needed)
```

### Data Flow
```
API: GET /api/features?product_id=xxx
  ↓
RoadmapFeature[] with:
  - priority: number (0-3)
  - customer: string (comma-separated)
  - budget_allocations: BudgetLineAllocation[]
  - quarterly_allocations: QuarterlyAllocation[]
  - remarks: string
  ↓
Transform for display:
  - Group quarters by year
  - Parse customer tags
  - Map budget lines to names
  - Format priority with labels
```

---

## 📋 Phase Breakdown

### Phase 1: Quick Wins (Day 1, 2-3 hours)
**Goal:** Immediate UX improvements with minimal complexity

#### Tasks

**@UI-Designer** (30 min)
- [ ] Design priority tag colors and labels
  - 0-Critical: Red (#ff4d4f)
  - 1-High: Orange (#ff7a45)
  - 2-Medium: Blue (#1890ff)
  - 3-Low: Gray (#d9d9d9)
- [ ] Design remarks info icon placement and tooltip style
- [ ] Create mockup for priority dropdown in form

**@Frontend-Architect** (30 min)
- [ ] Review FeatureForm.tsx structure
- [ ] Plan priority dropdown component integration
- [ ] Design helper function for priority label mapping
- [ ] Review ProductRoadmapPage.tsx column definitions

**@Frontend-Developer** (1.5 hours)
- [ ] Update FeatureForm.tsx:
  ```tsx
  // Replace InputNumber with Select
  <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
    <Select placeholder="Select priority">
      <Select.Option value={0}><Tag color="red">0 - Critical</Tag></Select.Option>
      <Select.Option value={1}><Tag color="orange">1 - High</Tag></Select.Option>
      <Select.Option value={2}><Tag color="blue">2 - Medium</Tag></Select.Option>
      <Select.Option value={3}><Tag color="default">3 - Low</Tag></Select.Option>
    </Select>
  </Form.Item>
  ```
- [ ] Add priority column to ProductRoadmapPage.tsx:
  ```tsx
  {
    title: 'Priority',
    dataIndex: 'priority',
    width: 120,
    render: (priority: number) => {
      const config = {
        0: { label: 'Critical', color: 'red' },
        1: { label: 'High', color: 'orange' },
        2: { label: 'Medium', color: 'blue' },
        3: { label: 'Low', color: 'default' },
      };
      const { label, color } = config[priority] || config[3];
      return <Tag color={color}>{priority} - {label}</Tag>;
    },
  }
  ```
- [ ] Add remarks icon to Name column:
  ```tsx
  import { InfoCircleOutlined } from '@ant-design/icons';
  
  {
    title: 'Name',
    dataIndex: 'name',
    width: 250,
    render: (name: string, record: RoadmapFeature) => (
      <Space>
        <span>{name}</span>
        {record.remarks && (
          <Tooltip title={record.remarks}>
            <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
          </Tooltip>
        )}
      </Space>
    ),
  }
  ```

**@QA** (30 min)
- [ ] Test priority dropdown shows all 4 options
- [ ] Verify priority displays correctly in table
- [ ] Verify remarks icon appears only when remarks exist
- [ ] Test tooltip shows correct remarks text
- [ ] Verify existing features display correctly

**Deliverable:** Priority dropdown, priority column, remarks tooltip icon

---

### Phase 2: Customer Tag System (Day 1-2, 3-4 hours)

**Goal:** Replace free-text customer field with reusable tag system

#### Decision Point: Customer Tag Storage
**Option A:** Extract from existing features (frontend-only)
- Pros: No backend changes, faster
- Cons: Tags only available after features exist

**Option B:** New backend endpoint `/api/customer-tags`
- Pros: Centralized management, can pre-populate
- Cons: Requires backend changes

**Recommendation:** Start with Option A, migrate to Option B if needed

#### Tasks

**@UI-Designer** (30 min)
- [ ] Design customer tag selector UI
- [ ] Review PI Allocations specialization tags for consistency
- [ ] Define tag display format (comma-separated vs chips)

**@Frontend-Architect** (1 hour)
- [ ] Design customer tag extraction logic
- [ ] Plan state management for customer options
- [ ] Design tag parsing/joining logic (comma-separated)
- [ ] Review form validation requirements

**@Frontend-Developer** (2 hours)
- [ ] Add customer tag state to FeatureForm.tsx:
  ```tsx
  const [customerOptions, setCustomerOptions] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await listFeatures({ page_size: 1000 });
        const uniqueCustomers = [...new Set(
          response.data
            .map((f: RoadmapFeature) => f.customer)
            .filter(Boolean)
            .flatMap((c: string) => c.split(',').map(s => s.trim()))
        )];
        setCustomerOptions(uniqueCustomers.sort());
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      }
    };
    fetchCustomers();
  }, []);
  ```
- [ ] Replace customer input with tag selector:
  ```tsx
  <Form.Item name="customer" label="Customer">
    <Select
      mode="tags"
      placeholder="Select or enter customer(s)"
      tokenSeparators={[',']}
      options={customerOptions.map(c => ({ label: c, value: c }))}
      style={{ width: '100%' }}
    />
  </Form.Item>
  ```
- [ ] Update form submission to join tags:
  ```tsx
  const customerValue = values.customer;
  const customerString = Array.isArray(customerValue) 
    ? customerValue.join(', ') 
    : customerValue;
  ```
- [ ] Update form initialization to split tags:
  ```tsx
  if (feature) {
    form.setFieldsValue({
      ...
      customer: feature.customer ? feature.customer.split(',').map(s => s.trim()) : [],
    });
  }
  ```

**@QA** (1 hour)
- [ ] Test creating feature with single customer
- [ ] Test creating feature with multiple customers
- [ ] Test creating new customer tag by typing
- [ ] Verify existing customers appear in dropdown
- [ ] Test editing feature preserves customer tags
- [ ] Verify customer display in table

**Deliverable:** Customer tag selector with reusable options

---

### Phase 3: Table Restructure (Day 2-3, 4-5 hours)

**Goal:** Year-grouped headers, sticky columns, horizontal scroll

#### Tasks

**@UI-Designer** (1 hour)
- [ ] Design year-grouped header layout
- [ ] Define sticky column behavior (left: 5 cols, right: 3 cols)
- [ ] Design year filter dropdown placement
- [ ] Create mockup for budget line column display

**@Frontend-Architect** (1.5 hours)
- [ ] Design year detection algorithm (from quarterly_allocations)
- [ ] Plan column generation logic for dynamic years
- [ ] Design sticky column configuration
- [ ] Plan budget line name resolution (join with budget data)
- [ ] Review Ant Design Table scroll and fixed column APIs

**@Frontend-Developer** (3 hours)
- [ ] Add year filter state:
  ```tsx
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  ```
- [ ] Create year detection helper:
  ```tsx
  const getYearsToDisplay = (features: RoadmapFeature[], selectedYear: number) => {
    const yearsWithData = new Set<number>();
    features.forEach(feature => {
      feature.quarterly_allocations?.forEach(qa => {
        yearsWithData.add(qa.year);
      });
    });
    yearsWithData.add(selectedYear);
    return Array.from(yearsWithData).sort();
  };
  ```
- [ ] Create year column generator:
  ```tsx
  const generateYearColumns = (years: number[]) => {
    return years.map(year => ({
      title: year.toString(),
      children: [1, 2, 3, 4].map(quarter => ({
        title: `Q${quarter}`,
        key: `${year}-Q${quarter}`,
        width: 70,
        align: 'center' as const,
        render: (_: any, record: RoadmapFeature) => {
          const allocation = record.quarterly_allocations?.find(
            qa => qa.year === year && qa.quarter === quarter
          );
          return allocation?.allocated_ed 
            ? <Tag color={getQuarterColor(quarter)}>{allocation.allocated_ed}</Tag>
            : '-';
        },
      })),
    }));
  };
  ```
- [ ] Add budget line column:
  ```tsx
  {
    title: 'Budget Line',
    key: 'budget_line',
    fixed: 'left',
    width: 150,
    render: (_: any, record: RoadmapFeature) => {
      const allocations = record.budget_allocations || [];
      if (allocations.length === 0) return '-';
      if (allocations.length === 1) {
        return <span>{getBudgetLineName(allocations[0].budget_line_id)}</span>;
      }
      return (
        <Tooltip title={allocations.map(a => 
          `${getBudgetLineName(a.budget_line_id)} (${a.allocation_percentage}%)`
        ).join(', ')}>
          <span>{getBudgetLineName(allocations[0].budget_line_id)} +{allocations.length - 1}</span>
        </Tooltip>
      );
    },
  }
  ```
- [ ] Restructure column array with sticky:
  ```tsx
  const columns = [
    { title: 'Name', dataIndex: 'name', fixed: 'left', width: 250, ... },
    { title: 'Budget Line', key: 'budget_line', fixed: 'left', width: 150, ... },
    { title: 'Customer', dataIndex: 'customer', fixed: 'left', width: 120, ... },
    { title: 'Priority', dataIndex: 'priority', fixed: 'left', width: 120, ... },
    { title: 'Net eD', dataIndex: 'net_sizing_ed', fixed: 'left', width: 80, ... },
    
    ...generateYearColumns(yearsToDisplay),
    
    { title: 'Cost (k€)', dataIndex: 'total_cost_keur', fixed: 'right', width: 100, ... },
    { title: 'Status', dataIndex: 'status', fixed: 'right', width: 100, ... },
    { title: 'Actions', key: 'actions', fixed: 'right', width: 180, ... },
  ];
  ```
- [ ] Add year filter UI:
  ```tsx
  <Space style={{ marginBottom: 16 }}>
    <span>Fiscal Year:</span>
    <Select value={selectedYear} onChange={setSelectedYear} style={{ width: 120 }}>
      {yearsToDisplay.map(year => (
        <Select.Option key={year} value={year}>{year}</Select.Option>
      ))}
    </Select>
  </Space>
  ```
- [ ] Update Table component:
  ```tsx
  <Table
    columns={columns}
    dataSource={features}
    scroll={{ x: 'max-content', y: 600 }}
    sticky
    rowKey="id"
  />
  ```

**@QA** (1.5 hours)
- [ ] Test year headers display correctly (2026, 2027, etc.)
- [ ] Verify Q1-Q4 columns under each year
- [ ] Test year filter changes visible columns
- [ ] Verify sticky left columns stay fixed while scrolling
- [ ] Verify sticky right columns stay fixed while scrolling
- [ ] Test budget line displays correctly (single and multiple)
- [ ] Test tooltip shows all budget lines for multi-allocation features
- [ ] Verify horizontal scroll works smoothly

**Deliverable:** Year-grouped table with sticky columns and year filter

---

### Phase 4: Feature Detail Panel (Day 3-4, 4-5 hours)

**Goal:** Right-side drawer for viewing feature details

#### Tasks

**@UI-Designer** (1 hour)
- [ ] Design detail panel layout (600px width)
- [ ] Design Details tab content structure
- [ ] Design quarterly allocation summary table
- [ ] Design Edit button placement
- [ ] Design placeholder for Execution tab

**@Frontend-Architect** (1 hour)
- [ ] Plan panel state management
- [ ] Design data transformation for quarterly summary table
- [ ] Plan integration with existing FeatureForm modal
- [ ] Review Ant Design Drawer API
- [ ] Plan tab structure (Details active, Execution disabled)

**@Frontend-Developer** (3 hours)
- [ ] Create FeatureDetailPanel.tsx:
  ```tsx
  import React from 'react';
  import { Drawer, Descriptions, Tag, Tabs, Button, Space, Table } from 'antd';
  import { EditOutlined } from '@ant-design/icons';
  import { RoadmapFeature } from '../../types/roadmap_v4';
  
  interface FeatureDetailPanelProps {
    feature: RoadmapFeature | null;
    visible: boolean;
    onClose: () => void;
    onEdit: (feature: RoadmapFeature) => void;
  }
  
  const FeatureDetailPanel: React.FC<FeatureDetailPanelProps> = ({
    feature,
    visible,
    onClose,
    onEdit,
  }) => {
    if (!feature) return null;
    
    const formatQuarterlyData = () => {
      const yearMap = new Map<number, any>();
      feature.quarterly_allocations?.forEach(qa => {
        if (!yearMap.has(qa.year)) {
          yearMap.set(qa.year, { year: qa.year, Q1: 0, Q2: 0, Q3: 0, Q4: 0, total: 0 });
        }
        const yearData = yearMap.get(qa.year);
        yearData[`Q${qa.quarter}`] = qa.allocated_ed;
        yearData.total += qa.allocated_ed;
      });
      return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
    };
    
    return (
      <Drawer
        title={feature.name}
        placement="right"
        width={600}
        open={visible}
        onClose={onClose}
        extra={
          <Button icon={<EditOutlined />} onClick={() => onEdit(feature)}>
            Edit
          </Button>
        }
      >
        <Tabs defaultActiveKey="details">
          <Tabs.TabPane tab="Details" key="details">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Status">
                <Tag>{feature.status?.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                {renderPriorityTag(feature.priority)}
              </Descriptions.Item>
              <Descriptions.Item label="Customer" span={2}>
                {feature.customer || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Gross Sizing">
                {feature.gross_sizing_ed} eD
              </Descriptions.Item>
              <Descriptions.Item label="Net Sizing">
                {feature.net_sizing_ed} eD
              </Descriptions.Item>
              <Descriptions.Item label="Total Cost" span={2}>
                {feature.total_cost_keur} k€
              </Descriptions.Item>
              <Descriptions.Item label="Budget Allocation" span={2}>
                {feature.budget_allocations?.map((a, i) => (
                  <div key={i}>
                    {a.budget_line_id}: {a.allocation_percentage}%
                  </div>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="Remarks" span={2}>
                {feature.remarks || 'No remarks'}
              </Descriptions.Item>
            </Descriptions>
            
            <h4 style={{ marginTop: 24, marginBottom: 12 }}>Quarterly Allocations</h4>
            <Table
              size="small"
              pagination={false}
              dataSource={formatQuarterlyData()}
              columns={[
                { title: 'Year', dataIndex: 'year', width: 80 },
                { title: 'Q1', dataIndex: 'Q1', width: 70, align: 'center' },
                { title: 'Q2', dataIndex: 'Q2', width: 70, align: 'center' },
                { title: 'Q3', dataIndex: 'Q3', width: 70, align: 'center' },
                { title: 'Q4', dataIndex: 'Q4', width: 70, align: 'center' },
                { title: 'Total', dataIndex: 'total', width: 80, align: 'center' },
              ]}
            />
          </Tabs.TabPane>
          
          <Tabs.TabPane tab="Execution" key="execution" disabled>
            <p>Execution planning (JIRA records) coming soon...</p>
          </Tabs.TabPane>
        </Tabs>
      </Drawer>
    );
  };
  
  export default FeatureDetailPanel;
  ```
- [ ] Add panel state to ProductRoadmapPage.tsx:
  ```tsx
  const [detailPanelVisible, setDetailPanelVisible] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<RoadmapFeature | null>(null);
  
  const openDetailPanel = (feature: RoadmapFeature) => {
    setSelectedFeature(feature);
    setDetailPanelVisible(true);
  };
  
  const closeDetailPanel = () => {
    setDetailPanelVisible(false);
    setSelectedFeature(null);
  };
  
  const handleEditFromPanel = (feature: RoadmapFeature) => {
    closeDetailPanel();
    handleEditFeature(feature);
  };
  ```
- [ ] Update Name column to be clickable:
  ```tsx
  {
    title: 'Name',
    dataIndex: 'name',
    fixed: 'left',
    width: 250,
    render: (name: string, record: RoadmapFeature) => (
      <Space>
        <a onClick={() => openDetailPanel(record)}>{name}</a>
        {record.remarks && (
          <Tooltip title={record.remarks}>
            <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
          </Tooltip>
        )}
      </Space>
    ),
  }
  ```
- [ ] Add FeatureDetailPanel to JSX:
  ```tsx
  <FeatureDetailPanel
    feature={selectedFeature}
    visible={detailPanelVisible}
    onClose={closeDetailPanel}
    onEdit={handleEditFromPanel}
  />
  ```

**@QA** (1 hour)
- [ ] Test clicking feature name opens panel
- [ ] Verify all feature details display correctly
- [ ] Test quarterly allocation summary table
- [ ] Verify Edit button opens edit modal
- [ ] Test panel closes properly
- [ ] Verify Execution tab is disabled
- [ ] Test panel with features having no quarterly allocations
- [ ] Test panel with features having multiple years

**Deliverable:** Feature detail panel with Details and Execution tabs

---

## 🔧 Technical Specifications

### Component Structure
```
ProductRoadmapPage.tsx (Enhanced)
├─ State Management
│  ├─ features: RoadmapFeature[]
│  ├─ selectedYear: number
│  ├─ detailPanelVisible: boolean
│  └─ selectedFeature: RoadmapFeature | null
├─ Helper Functions
│  ├─ getYearsToDisplay()
│  ├─ generateYearColumns()
│  ├─ getBudgetLineName()
│  └─ renderPriorityTag()
├─ Table Component (with sticky columns)
└─ FeatureDetailPanel Component

FeatureForm.tsx (Enhanced)
├─ Priority Select (0-3 dropdown)
├─ Customer Tag Selector (mode="tags")
└─ Collapsible Remarks Section

FeatureDetailPanel.tsx (New)
├─ Drawer Component
├─ Tabs (Details, Execution)
├─ Descriptions Component
└─ Quarterly Summary Table
```

### Data Transformations

#### Priority Mapping
```typescript
const PRIORITY_CONFIG = {
  0: { label: 'Critical', color: 'red' },
  1: { label: 'High', color: 'orange' },
  2: { label: 'Medium', color: 'blue' },
  3: { label: 'Low', color: 'default' },
};

const renderPriorityTag = (priority: number) => {
  const { label, color } = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG[3];
  return <Tag color={color}>{priority} - {label}</Tag>;
};
```

#### Customer Tag Parsing
```typescript
// Form → API: Join array to string
const customerString = Array.isArray(values.customer) 
  ? values.customer.join(', ') 
  : values.customer;

// API → Form: Split string to array
const customerArray = feature.customer 
  ? feature.customer.split(',').map(s => s.trim()) 
  : [];
```

#### Quarterly Data Grouping
```typescript
const formatQuarterlyData = (allocations: QuarterlyAllocation[]) => {
  const yearMap = new Map<number, any>();
  allocations?.forEach(qa => {
    if (!yearMap.has(qa.year)) {
      yearMap.set(qa.year, { year: qa.year, Q1: 0, Q2: 0, Q3: 0, Q4: 0, total: 0 });
    }
    const yearData = yearMap.get(qa.year);
    yearData[`Q${qa.quarter}`] = qa.allocated_ed;
    yearData.total += qa.allocated_ed;
  });
  return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
};
```

### Ant Design Components Used
- `Table` with `scroll`, `sticky`, `fixed` columns
- `Select` with `mode="tags"` for customer tags
- `Drawer` for detail panel
- `Tabs` for panel sections
- `Descriptions` for key-value display
- `Tag` for priority and status
- `Tooltip` for remarks and budget lines

---

## 🧪 Testing Strategy

### Unit Tests (Optional, if time permits)
- Priority mapping function
- Customer tag parsing/joining
- Quarterly data grouping
- Year detection logic

### Integration Tests
- Feature creation with new priority dropdown
- Feature editing preserves customer tags
- Table displays correctly with multi-year data
- Panel opens and displays all fields

### User Acceptance Tests
- Product Manager can select priority from dropdown
- Product Manager can add/reuse customer tags
- Product Manager can see year-grouped quarters
- Product Manager can view feature details quickly
- Table scrolls horizontally with sticky columns

---

## 📦 Deliverables Checklist

### Phase 1 ✓
- [ ] Priority dropdown in FeatureForm
- [ ] Priority column in table with colored tags
- [ ] Remarks info icon in Name column
- [ ] Tooltip displays remarks on hover

### Phase 2 ✓
- [ ] Customer tag selector in FeatureForm
- [ ] Customer options extracted from existing features
- [ ] Multiple customers can be selected
- [ ] Customer tags persist across create/edit

### Phase 3 ✓
- [ ] Year-grouped column headers (2026 Q1-Q4, 2027 Q1-Q4)
- [ ] Year filter dropdown
- [ ] Budget Line column with tooltip for multiple
- [ ] Sticky left columns (Name, Budget Line, Customer, Priority, Net eD)
- [ ] Sticky right columns (Cost, Status, Actions)
- [ ] Horizontal scroll for year columns

### Phase 4 ✓
- [ ] FeatureDetailPanel component created
- [ ] Clicking feature name opens panel
- [ ] Details tab shows all feature information
- [ ] Quarterly allocation summary table
- [ ] Edit button in panel works
- [ ] Execution tab placeholder (disabled)

---

## 🚀 Deployment Plan

### Pre-Deployment
1. Code review by Tech Lead
2. UAT testing by Product Manager
3. Performance testing with 100+ features
4. Cross-browser testing (Chrome, Firefox, Safari)

### Deployment Steps
1. Merge to `developer` branch
2. Deploy to staging environment
3. Smoke test all 4 phases
4. Deploy to production
5. Monitor for errors

### Rollback Plan
- Git revert to previous commit
- Redeploy previous version
- Investigate issues offline

---

## 📊 Success Metrics

### Performance
- Table renders < 500ms with 100 features
- Panel opens < 200ms
- No layout shifts during scroll

### User Experience
- 0 user-reported bugs in first week
- Positive feedback from Product Managers
- Reduced time to create features (priority/customer faster)

### Code Quality
- 0 TypeScript errors
- 0 console warnings
- All existing tests pass

---

## 🔄 Future Enhancements (Out of Scope)

### Phase 5: Advanced Features (Future)
- Bulk edit features
- Export table to Excel
- Feature dependencies visualization
- Gantt chart view
- Execution tab implementation (JIRA records)

### Phase 6: Backend Enhancements (Future)
- Dedicated `/api/customer-tags` endpoint
- Customer tag management UI
- Feature templates
- Auto-save drafts

---

## 📞 Communication Plan

### Daily Standups
- What was completed yesterday
- What's planned for today
- Any blockers

### Phase Reviews
- Demo completed phase to Product Manager
- Gather feedback
- Adjust plan if needed

### Final Review
- Full demo of all 4 phases
- Documentation handoff
- Training session for users

---

## 🎓 Knowledge Transfer

### Documentation
- Update user guide with new features
- Create video tutorial for priority/customer tags
- Document table navigation tips

### Training
- 30-min session with Product Managers
- Q&A session
- Feedback collection

---

## ⚠️ Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Budget line names not available | High | Low | Fetch budget data separately or show IDs |
| Performance with 1000+ features | Medium | Medium | Implement virtual scrolling if needed |
| Customer tag conflicts | Low | Low | Normalize tags (trim, lowercase) |
| Browser compatibility issues | Medium | Low | Test on all major browsers |
| User resistance to new UI | Medium | Low | Provide training and documentation |

---

## 📅 Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: Quick Wins | 3 hours | Day 1 AM | Day 1 PM |
| Phase 2: Customer Tags | 4 hours | Day 1 PM | Day 2 AM |
| Phase 3: Table Restructure | 5 hours | Day 2 AM | Day 3 AM |
| Phase 4: Detail Panel | 5 hours | Day 3 AM | Day 4 AM |
| **Total** | **17 hours** | **Day 1** | **Day 4** |

---

## ✅ Sign-Off

**Tech Lead:** _________________  
**Product Manager:** _________________  
**Frontend Architect:** _________________  
**Date:** _________________

---

*End of Orchestration Plan*
