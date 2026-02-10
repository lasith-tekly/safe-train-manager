# UI Design: Partial Spillover & Cascading History

**Version:** 1.0 | **Date:** Feb 10, 2026 | **Phase:** 3.1

---

## Color Palette

```css
--spillover-orange: #fa8c16;
--completed-green: #52c41a;
--cascading-red: #f5222d;
--info-blue: #1890ff;
```

---

## 1. SpilloverModal - Effort Breakdown

**Location:** After "Spillover Category", before submit buttons

### Layout
```tsx
<Divider orientation="left">
  <Space>
    Effort Breakdown
    <Tooltip title="Split effort between completed and spillover">
      <InfoCircleOutlined />
    </Tooltip>
  </Space>
</Divider>

<Row gutter={16}>
  <Col span={12}>
    <Form.Item name="completed_effort" label="Completed Effort (eD)">
      <InputNumber min={0} step={0.5} addonAfter="eD" />
    </Form.Item>
  </Col>
  <Col span={12}>
    <Form.Item name="spillover_effort" label="Spillover Effort (eD)">
      <InputNumber min={0.5} step={0.5} addonAfter="eD" />
    </Form.Item>
  </Col>
</Row>

<Alert type={isValid ? 'info' : 'error'} message={
  `Planned: ${planned} | Completed: ${completed} | Spillover: ${spillover}
   Total: ${total} ${isValid ? '✓' : '✗ Exceeds planned'}`
} />
```

### Validation
- `completed + spillover ≤ planned`
- `spillover ≥ 0.5`
- Real-time feedback in alert

---

## 2. SpilloverModal - Cascading Warning

**Condition:** Show when `spillover_count > 0`

```tsx
<Alert type="warning" icon={<WarningOutlined />}
  message="Cascading Spillover Warning"
  description={
    <>
      This record has spilled {count} time(s)
      Originally planned in: <Tag color="blue">{originalPI}</Tag>
      This will be event #{count + 1}
    </>
  }
/>
```

---

## 3. Edit Modal - Spillover History Timeline

```tsx
<Timeline>
  <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
    Originally Planned
    <Tag color="blue">{originalPI}</Tag>
    Planned: {effort} eD
  </Timeline.Item>

  {history.map(event => (
    <Timeline.Item color="orange" dot={<SwapOutlined />}>
      Spillover #{event.sequence} - {event.date}
      {event.fromPI} → {event.toPI}
      <Tag color="orange">{event.spillover} eD spilled</Tag>
      <Tag color="green">{event.completed} eD done</Tag>
      <Tag>{event.category}</Tag>
      "{event.reason}"
    </Timeline.Item>
  ))}

  <Timeline.Item color="blue" dot={<ClockCircleOutlined />}>
    Current Status
    In <Tag>{currentPI}</Tag>
  </Timeline.Item>
</Timeline>
```

**Colors:**
- Green dot: Originally planned
- Orange dot: Each spillover
- Blue dot: Current status

---

## 4. Table Row - Cascading Indicator

```tsx
<Space size={4}>
  <SwapOutlined style={{ color: '#fa8c16' }} />
  <Tag color="orange">SPILLOVER</Tag>
  <Tooltip title={`From: ${fromPI}\nReason: ${reason}`}>
    <InfoCircleOutlined style={{ color: '#fa8c16' }} />
  </Tooltip>
  {count > 1 && (
    <Badge count={`×${count}`} 
      style={{ backgroundColor: count >= 3 ? '#f5222d' : '#fa8c16' }} 
    />
  )}
</Space>
```

**Badge Colors:**
- Orange: ×2 spillovers
- Red: ×3+ spillovers

---

## 5. Summary Section Enhancement

```tsx
<Alert type="warning" message={
  <>
    Spillover: {count} records | {spilloverEffort} eD spilling | {completedEffort} eD done
    {cascadingCount > 0 && `🔄 ${cascadingCount} records spilled multiple times`}
  </>
} />

{breakdown.map(pi => (
  <div>
    From {pi.name}: {pi.spillover} eD ({pi.count} records) - {pi.completed} eD completed
  </div>
))}
```

---

## Responsive Design

**Mobile (<576px):**
- Stack effort inputs vertically
- Reduce timeline dot size to 12px
- Hide cascading badge, show in tooltip

**Tablet (≥576px):**
- Side-by-side effort inputs
- Full timeline display

**Desktop (≥768px):**
- Full layout as designed

---

## Accessibility

- ARIA labels on all inputs
- Keyboard navigation support
- Color + icon for status (not color alone)
- Screen reader text for badges
- Focus indicators on interactive elements

---

## Implementation Notes

**Ant Design Components:**
- InputNumber, Alert, Timeline, Badge, Tag, Tooltip
- Row/Col for layout
- Space for inline grouping

**Validation:**
- Real-time with Form.Item rules
- Custom validator for sum check
- Visual feedback in alert component

**Data Flow:**
- Form values update state
- State calculates totals
- Alert reflects validation status
- Submit disabled when invalid

---

**Status:** Ready for Development
