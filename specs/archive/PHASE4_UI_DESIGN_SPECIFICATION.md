# Phase 4 UI Design Specification - Deviation Display & Alignment

**Version:** 1.0  
**Date:** February 11, 2026  
**Designer:** UI/UX Team  
**Status:** Ready for Development

---

## Design System Foundation

### Colors
```typescript
// Status Colors
ALIGNED: '#52c41a'      // Green
MINOR: '#faad14'        // Yellow/Orange
SIGNIFICANT: '#ff4d4f'  // Red
UNDER: '#1890ff'        // Blue

// Semantic Colors
SUCCESS: '#52c41a'
WARNING: '#faad14'
ERROR: '#ff4d4f'
INFO: '#1890ff'
NEUTRAL: '#8c8c8c'
```

### Typography
- **Headings:** 16px bold (component titles)
- **Body:** 14px regular
- **Small:** 12px regular (metadata, tooltips)
- **Font:** -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto

### Spacing
- **xs:** 4px
- **sm:** 8px
- **md:** 16px
- **lg:** 24px
- **xl:** 32px

---

## Component 1: Deviation Alert Banner

### Layout Specifications

**Dimensions:**
- Width: 100% (full page width)
- Height: Auto (min 60px)
- Margin: 0 0 16px 0
- Padding: 16px 24px
- Border-radius: 8px

**States:**

#### ALIGNED State (Green)
```tsx
<Alert
  type="success"
  icon={<CheckCircleOutlined />}
  message="All features aligned"
  description="Strategic plan matches execution across all features"
  showIcon
  closable
/>
```

#### MINOR State (Yellow)
```tsx
<Alert
  type="warning"
  icon={<InfoCircleOutlined />}
  message="5 features have minor deviations"
  description={
    <Space direction="vertical" size={4}>
      <Text>Total deviation: +12.5 eD (Budget impact: +4.3 KEUR)</Text>
      <Space>
        <Button type="primary" size="small">Review & Align Deviations →</Button>
        <Button size="small">Dismiss for now</Button>
      </Space>
    </Space>
  }
  showIcon
/>
```

#### SIGNIFICANT State (Red)
```tsx
<Alert
  type="error"
  icon={<ExclamationCircleOutlined />}
  message="8 features have significant deviations"
  description={
    <Space direction="vertical" size={4}>
      <Text>Total deviation: +45.2 eD (Budget impact: +15.6 KEUR)</Text>
      <Text type="danger">Action required to prevent budget overrun</Text>
      <Space>
        <Button type="primary" danger size="small">Review & Align Now →</Button>
        <Button size="small">Dismiss for now</Button>
      </Space>
    </Space>
  }
  showIcon
/>
```

---

## Component 2: Budget Validation Tree

### Structure
```tsx
<Card title="Budget Validation" size="small">
  <Tree
    showLine
    defaultExpandAll
    treeData={[
      {
        title: <ProductNode />,
        key: 'product',
        children: [
          {
            title: <BudgetLineNode />,
            key: 'line-1',
            children: [
              { title: <CategoryNode />, key: 'cat-1' }
            ]
          }
        ]
      }
    ]}
  />
</Card>
```

### Node Components

**Product Node:**
```tsx
<Space direction="vertical" size={0} style={{ width: '100%' }}>
  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
    <Text strong>Product Total</Text>
    <Tag color={statusColor}>1,250 / 1,500 KEUR</Tag>
  </Space>
  <Progress percent={83} strokeColor="#52c41a" size="small" />
  <Text type="secondary" style={{ fontSize: 12 }}>
    Remaining: 250 KEUR (567 eD)
  </Text>
</Space>
```

**Budget Line Node:**
```tsx
<Space style={{ justifyContent: 'space-between', width: '100%' }}>
  <Space>
    <Tag color="blue">Product Evolution</Tag>
    <Text>450 / 600 KEUR</Text>
  </Space>
  <Progress percent={75} strokeColor="#52c41a" style={{ width: 200 }} size="small" />
</Space>
```

---

## Component 3: Feature Deviation Table

### Layout
```tsx
<Table
  dataSource={quarterlyData}
  columns={[
    { title: 'Quarter', dataIndex: 'quarter', width: 120 },
    { title: 'Strategic (eD)', dataIndex: 'strategic', align: 'right' },
    { title: 'Execution (eD)', dataIndex: 'execution', align: 'right' },
    { 
      title: 'Deviation', 
      dataIndex: 'deviation',
      render: (val) => (
        <Text type={val > 0 ? 'danger' : val < 0 ? 'warning' : 'success'}>
          {val > 0 ? '+' : ''}{val} eD
        </Text>
      )
    },
    { 
      title: 'Status',
      render: (record) => <Tag color={getStatusColor(record)}>{record.status}</Tag>
    }
  ]}
  footer={() => (
    <Space style={{ justifyContent: 'space-between', width: '100%' }}>
      <Text strong>TOTAL</Text>
      <Button type="primary">Align This Feature</Button>
    </Space>
  )}
  size="small"
  pagination={false}
/>
```

---

## Component 4: Review & Align Panel

### Drawer Specifications
- **Width:** 720px
- **Placement:** right
- **Mask:** true (overlay background)

```tsx
<Drawer
  title="Review & Align Deviations"
  width={720}
  open={open}
  onClose={onClose}
>
  {/* Summary Card */}
  <Card size="small" style={{ marginBottom: 16 }}>
    <Statistic.Group>
      <Statistic title="Features with Deviations" value={8} />
      <Statistic title="Total Deviation" value="+45.2 eD" valueStyle={{ color: '#ff4d4f' }} />
      <Statistic title="Budget Impact" value="+15.6 KEUR" />
    </Statistic.Group>
  </Card>

  {/* Features Table */}
  <Table columns={...} dataSource={...} />

  {/* Pending Changes */}
  <Card title="Pending Changes (3)" size="small">
    <List dataSource={changes} renderItem={...} />
  </Card>

  {/* Version Form */}
  <Form layout="vertical">
    <Form.Item label="Version Name">
      <Input placeholder="Alignment - 2026-02-11 - 5 Features" />
    </Form.Item>
    <Form.Item label="Notes">
      <TextArea rows={3} />
    </Form.Item>
  </Form>

  {/* Actions */}
  <Space style={{ marginTop: 16 }}>
    <Button onClick={onClose}>Cancel</Button>
    <Button>Save as Draft</Button>
    <Button type="primary">Publish New Version</Button>
  </Space>
</Drawer>
```

---

## Component 5: Alignment Action Modal

```tsx
<Modal
  title={`Align Feature: ${featureName}`}
  width={600}
  open={open}
  footer={[
    <Button key="cancel">Cancel</Button>,
    <Button key="submit" type="primary">Add to Draft</Button>
  ]}
>
  <Radio.Group style={{ width: '100%' }}>
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Radio value="auto">
        <Space direction="vertical" size={4}>
          <Text strong>Auto-Align Strategic to Execution</Text>
          <Text type="secondary">Copy execution values to strategic plan</Text>
          <Tag>Q1: 10 → 12 eD | Q2: 5 → 3 eD</Tag>
        </Space>
      </Radio>
      
      <Radio value="manual">
        <Text strong>Manual Update Strategic Plan</Text>
        {/* Expandable table for quarterly inputs */}
      </Radio>
      
      <Radio value="adjust">
        <Space direction="vertical">
          <Text strong>Adjust Execution to Strategic</Text>
          <Button size="small">Configure JIRA Changes →</Button>
        </Space>
      </Radio>
      
      <Radio value="acknowledge">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>Acknowledge Deviation</Text>
          <TextArea placeholder="Reason for accepting deviation..." rows={3} />
        </Space>
      </Radio>
    </Space>
  </Radio.Group>
</Modal>
```

---

## Responsive Design

### Breakpoints
- **Desktop:** > 1200px (full layout)
- **Tablet:** 768px - 1200px (drawer 60% width)
- **Mobile:** < 768px (drawer 90% width, stack components)

### Mobile Adaptations
- Alert banner: Stack buttons vertically
- Tables: Horizontal scroll
- Drawer: Full width (100%)
- Tree: Collapse by default

---

## Accessibility

- **ARIA labels** on all interactive elements
- **Keyboard navigation** support (Tab, Enter, Esc)
- **Focus indicators** visible on all focusable elements
- **Color contrast** WCAG AA compliant (4.5:1 minimum)
- **Screen reader** announcements for status changes

---

## Implementation Notes

1. Use Ant Design components as base
2. Follow existing card/table styling patterns
3. Maintain consistent spacing (16px grid)
4. Test with real data (100+ features)
5. Add loading states for all async operations
6. Implement optimistic UI updates

**Status:** ✅ Ready for Frontend Development
