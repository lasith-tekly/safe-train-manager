# Budget Dashboard - UI Design Specification

**Document Version:** 1.0  
**Date:** 2026-01-27  
**Author:** @ui-designer  
**Status:** DRAFT

---

## Overview

The Budget Dashboard provides visual analytics for budget planning and forecasting. It displays target allocations vs actual/forecasted spending across PIs using line chart visualization.

**Design Principles:**
- Clean, data-focused interface
- Emphasis on the line chart visualization
- Clear metric cards for quick insights
- Consistent with existing Budget Configuration UI

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Dashboard > Budget Dashboard                          FY: 2026 ▼   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  SELECT PRODUCT                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ Flight Management (FM)                              ▼  │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  BUDGET OVERVIEW                                             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │ 14,000   │  │    0     │  │  14,000  │  │   0.0%   │   │  │
│  │  │ KEUR     │  │  KEUR    │  │  KEUR    │  │          │   │  │
│  │  │ Allocated│  │  Planned │  │ Remaining│  │Utilization│  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  BUDGET LINES                                                │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ Budget Line                    Allocated    % of Total │ │  │
│  │  ├────────────────────────────────────────────────────────┤ │  │
│  │  │ ○ MNT - Maintenance            2,000 KEUR      14.3%   │ │  │
│  │  │ ○ PE - Product Evolution       6,000 KEUR      42.9%   │ │  │
│  │  │ ○ IMP - FM-Implementation      3,000 KEUR      21.4%   │ │  │
│  │  │ ○ SER - Services               3,000 KEUR      21.4%   │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │  [Click a budget line to view PI planning chart]           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Budget Line Detail View (After Selection)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Dashboard > Budget Dashboard > MNT - Maintenance                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  BUDGET LINE: MNT - Maintenance                              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │  2,000   │  │    0     │  │  2,000   │  │   0.0%   │   │  │
│  │  │  KEUR    │  │  KEUR    │  │  KEUR    │  │          │   │  │
│  │  │ Allocated│  │  Planned │  │ Remaining│  │Utilization│  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  PI PLANNING & FORECAST                                      │  │
│  │                                                              │  │
│  │  2500 ┤                                                      │  │
│  │       │                                                      │  │
│  │  2000 ┤━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │       │                                                      │  │
│  │  1500 ┤                                                      │  │
│  │       │        ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │  1000 ┤                                                      │  │
│  │       │                                                      │  │
│  │   500 ┤    ●                                                 │  │
│  │       │                                                      │  │
│  │     0 └────┬────────┬────────┬────────┬─────────            │  │
│  │          Q1 26    Q2 26    Q3 26    Q4 26                   │  │
│  │                                                              │  │
│  │  ━━━ Target Allocation (Blue)                               │  │
│  │  ━━━ Actual + Forecast (Orange)                             │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  PI BREAKDOWN                                                │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ PI      Iterations  Target    Planned   Variance  Status│ │  │
│  │  ├────────────────────────────────────────────────────────┤ │  │
│  │  │ Q1 2026    4       285.7      0.0       -285.7    ⚪   │ │  │
│  │  │ Q2 2026    3       214.3      0.0       -214.3    ⚪   │ │  │
│  │  │ Q3 2026    4       285.7      0.0       -285.7    ⚪   │ │  │
│  │  │ Q4 2026    3       214.3      0.0       -214.3    ⚪   │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Dashboard Header

**Component:** `DashboardHeader`

```tsx
<DashboardHeader>
  <Breadcrumb>
    <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
    <Breadcrumb.Item>Budget Dashboard</Breadcrumb.Item>
  </Breadcrumb>
  <FiscalYearSelector />
</DashboardHeader>
```

**Styling:**
- Height: 64px
- Background: #fff
- Border-bottom: 1px solid #f0f0f0
- Padding: 16px 24px

---

### 2. Product Selector

**Component:** `ProductSelector`

```tsx
<Card size="small">
  <Text type="secondary">SELECT PRODUCT</Text>
  <Select
    size="large"
    placeholder="Select a product"
    style={{ width: '100%', marginTop: 8 }}
  >
    {products.map(p => (
      <Select.Option key={p.id} value={p.id}>
        {p.name} ({p.short_code})
      </Select.Option>
    ))}
  </Select>
</Card>
```

**Styling:**
- Full width
- Margin-bottom: 16px

---

### 3. Metric Cards

**Component:** `DashboardMetrics`

**Layout:** 4 cards in a row (responsive: 2x2 on mobile)

```tsx
<Row gutter={16}>
  <Col span={6}>
    <StatCard title="Allocated" value={14000} color="primary" />
  </Col>
  <Col span={6}>
    <StatCard title="Planned" value={0} color="warning" />
  </Col>
  <Col span={6}>
    <StatCard title="Remaining" value={14000} color="success" />
  </Col>
  <Col span={6}>
    <StatCard title="Utilization" value="0.0%" color="default" />
  </Col>
</Row>
```

**Reuse existing StatCard component** from Budget Configuration

---

### 4. Budget Lines Table

**Component:** `BudgetLinesTable`

```tsx
<Card size="small">
  <Text type="secondary">BUDGET LINES</Text>
  <Table
    dataSource={budgetLines}
    columns={[
      { title: 'Budget Line', dataIndex: 'name', render: (text, record) => (
        <Radio.Group value={selectedLine}>
          <Radio value={record.id}>{record.code} - {text}</Radio>
        </Radio.Group>
      )},
      { title: 'Allocated', dataIndex: 'allocated_amount', render: (val) => `${val} KEUR` },
      { title: '% of Total', dataIndex: 'percentage', render: (val) => `${val.toFixed(1)}%` }
    ]}
    pagination={false}
    onRow={(record) => ({
      onClick: () => handleSelectLine(record.id)
    })}
  />
  <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
    Click a budget line to view PI planning chart
  </Text>
</Card>
```

**Styling:**
- Rows are clickable/hoverable
- Selected row highlighted with radio button
- Clean table design, no borders

---

### 5. Line Chart

**Component:** `BudgetLineChart`

**Library:** `recharts` (already used in project)

```tsx
<Card size="small">
  <Text type="secondary">PI PLANNING & FORECAST</Text>
  <ResponsiveContainer width="100%" height={400}>
    <LineChart data={chartData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="pi" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line 
        type="monotone" 
        dataKey="target" 
        stroke="#1890ff" 
        strokeWidth={2}
        name="Target Allocation"
      />
      <Line 
        type="monotone" 
        dataKey="actualForecast" 
        stroke="#fa8c16" 
        strokeWidth={2}
        strokeDasharray="5 5"
        name="Actual + Forecast"
      />
    </LineChart>
  </ResponsiveContainer>
</Card>
```

**Chart Data Format:**
```typescript
interface ChartDataPoint {
  pi: string;           // "Q1 2026"
  target: number;       // 285.7
  actualForecast: number; // 0 or calculated
  isActual: boolean;    // true if from PI Planning, false if forecast
}
```

**Styling:**
- Height: 400px
- Target line: Solid blue (#1890ff)
- Actual/Forecast line: Dashed orange (#fa8c16)
- Grid: Light gray
- Tooltip shows values with KEUR suffix

---

### 6. PI Breakdown Table

**Component:** `PIBreakdownTable`

```tsx
<Card size="small">
  <Text type="secondary">PI BREAKDOWN</Text>
  <Table
    dataSource={piData}
    columns={[
      { title: 'PI', dataIndex: 'pi_name' },
      { title: 'Iterations', dataIndex: 'iterations' },
      { title: 'Target', dataIndex: 'target', render: (val) => `${val.toFixed(1)}` },
      { title: 'Planned', dataIndex: 'planned', render: (val) => `${val.toFixed(1)}` },
      { title: 'Variance', dataIndex: 'variance', render: (val) => (
        <Text type={val < 0 ? 'danger' : 'success'}>
          {val > 0 ? '+' : ''}{val.toFixed(1)}
        </Text>
      )},
      { title: 'Status', dataIndex: 'status', render: (status) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      )}
    ]}
    pagination={false}
    size="small"
  />
</Card>
```

**Status Colors:**
- ⚪ Not Started (Gray): planned = 0
- 🟢 On Track (Green): planned ≤ target
- 🟡 Warning (Yellow): planned 100-120% of target
- 🔴 Over Budget (Red): planned > 120% of target

---

## Color Palette

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Target Line | Blue | #1890ff | Primary data line |
| Actual/Forecast Line | Orange | #fa8c16 | Secondary data line |
| Success | Green | #52c41a | On track status |
| Warning | Yellow | #faad14 | Warning status |
| Danger | Red | #f5222d | Over budget status |
| Neutral | Gray | #8c8c8c | Not started status |

---

## Responsive Design

### Desktop (>1200px)
- Full layout as shown
- 4 metric cards in a row
- Chart full width

### Tablet (768px - 1200px)
- 2 metric cards per row
- Chart full width
- Table scrollable horizontally

### Mobile (<768px)
- 1 metric card per row
- Chart full width with touch gestures
- Table in card format (stacked)

---

## Interaction States

### Product Selection
1. User selects fiscal year (if not already selected)
2. User selects product from dropdown
3. Dashboard loads product budget overview
4. Budget lines table displays

### Budget Line Selection
1. User clicks on a budget line row
2. Radio button selects the line
3. Chart and PI breakdown appear below
4. Smooth scroll to chart

### Chart Interaction
- Hover over data points shows tooltip
- Tooltip displays: PI name, Target, Actual/Forecast, Variance
- Legend is clickable to toggle lines

---

## Loading States

### Initial Load
```tsx
<Spin size="large" tip="Loading budget data...">
  <div style={{ minHeight: 400 }} />
</Spin>
```

### Chart Load
```tsx
<Card>
  <Skeleton active paragraph={{ rows: 8 }} />
</Card>
```

---

## Empty States

### No Products
```tsx
<Empty
  description="No products found for this fiscal year"
  image={Empty.PRESENTED_IMAGE_SIMPLE}
/>
```

### No Budget Lines
```tsx
<Empty
  description="No budget lines configured for this product"
  image={Empty.PRESENTED_IMAGE_SIMPLE}
>
  <Button type="primary" onClick={goToBudgetConfig}>
    Configure Budget
  </Button>
</Empty>
```

### No PI Data
```tsx
<Alert
  message="PI Planning Not Available"
  description="PI Planning data will be available once the PI Planning module is implemented. Currently showing target allocation only."
  type="info"
  showIcon
/>
```

---

## Navigation

### Breadcrumb
```
Dashboard > Budget Dashboard
Dashboard > Budget Dashboard > [Product Name]
Dashboard > Budget Dashboard > [Product Name] > [Budget Line]
```

### Back Navigation
- Clicking product name in breadcrumb returns to product overview
- Clicking "Budget Dashboard" returns to product selection

---

## Component File Structure

```
frontend/src/pages/Dashboard/
├── BudgetDashboard/
│   ├── index.tsx                    # Main dashboard page
│   ├── components/
│   │   ├── DashboardHeader.tsx      # Header with breadcrumb
│   │   ├── ProductSelector.tsx      # Product dropdown
│   │   ├── DashboardMetrics.tsx     # Metric cards row
│   │   ├── BudgetLinesTable.tsx     # Budget lines selection
│   │   ├── BudgetLineChart.tsx      # Line chart visualization
│   │   └── PIBreakdownTable.tsx     # PI breakdown table
│   └── hooks/
│       ├── useBudgetDashboard.ts    # Dashboard data logic
│       └── useChartData.ts          # Chart data transformation
```

---

## Accessibility

- All interactive elements keyboard accessible
- Chart has aria-labels
- Color is not the only indicator (use icons + text)
- Screen reader friendly table structure
- Focus indicators visible

---

## Performance Considerations

- Lazy load chart library
- Memoize chart data calculations
- Debounce product/line selection
- Cache API responses
- Virtual scrolling for large budget line lists

---

*UI Design Specification Created: 2026-01-27*
