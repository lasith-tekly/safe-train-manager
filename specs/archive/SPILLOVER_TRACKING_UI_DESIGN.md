# Spillover Tracking - UI Design Specification

**Feature:** Spillover Tracking (Phase 3 - Execution Planning)  
**Created:** February 9, 2026  
**Design System:** Ant Design v5

---

## Design Principles

1. **Consistency:** Match existing ExecutionPlanningPanel patterns
2. **Clarity:** Clear visual distinction for spillover records
3. **Efficiency:** Minimal clicks to mark spillover
4. **Accessibility:** WCAG 2.1 AA compliant

---

## Color Palette

```
Primary Spillover: #faad14 (Warning Orange)
Spillover Tag: #fa8c16 (Orange-6)
Background Tint: rgba(250, 173, 20, 0.05)
Border: #ffd591 (Orange-3)
```

---

## Component 1: Spillover Action Button

### Specifications

**Location:** JIRA Records Table → Actions Column (third button)

**Component:**
```tsx
<Button
  size="small"
  icon={<SwapOutlined />}
  onClick={() => handleMarkSpillover(record)}
  style={{ color: '#faad14' }}
/>
```

**States:**
- Default: White background, #faad14 icon
- Hover: #fff7e6 background, #fa8c16 icon
- Hidden when: status === 'SPILLOVER'

**Tooltip:** "Mark as Spillover"

**Accessibility:**
- ARIA: `aria-label="Mark JIRA record as spillover"`
- Keyboard: Tab to focus, Enter/Space to activate

---

## Component 2: Spillover Modal

### Modal Structure

**Dimensions:**
- Width: 600px
- Padding: 24px
- zIndex: 1100

**Header:**
```tsx
<Space>
  <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />
  <span>Mark as Spillover</span>
</Space>
```

### Form Fields

**1. Current Record Info (Alert)**
```tsx
<Alert
  message="Current JIRA Record"
  description={
    <Space direction="vertical">
      <Text><strong>JIRA Key:</strong> {record.jira_key}</Text>
      <Text><strong>Title:</strong> {record.title}</Text>
      <Text><strong>Current PI:</strong> {record.pi_name}</Text>
    </Space>
  }
  type="info"
  showIcon
/>
```

**2. Original PI Dropdown**
- Label: "Original PI (where work was planned)"
- Required: Yes
- Validation: Must be before current PI
- Disabled: Current PI and future PIs

**3. Spillover Reason Textarea**
- Label: "Spillover Reason"
- Required: Yes
- Min length: 10 characters
- Max length: 500 characters
- Rows: 4
- Show character count
- Helper text: Examples of good reasons

**4. Category Dropdown**
- Options: Technical Debt, Dependencies, Scope Creep, Resource Constraints, External Factors, Other
- Icons for each option
- Required: Yes

### Footer Buttons

- Cancel: Default button
- Submit: Primary button, #faad14 background, text "Mark as Spillover"

---

## Component 3: Visual Indicators

### Table Row Styling

```css
.spillover-row {
  background-color: rgba(250, 173, 20, 0.05);
  border-left: 3px solid #faad14;
}
```

### Status Column

```tsx
<Space size={8}>
  <SwapOutlined style={{ color: '#faad14', fontSize: 16 }} />
  <Tag color="orange" style={{ borderColor: '#faad14', backgroundColor: '#fff7e6' }}>
    SPILLOVER
  </Tag>
  <Tooltip title={`Spillover from: ${pi_name}\nReason: ${reason}`}>
    <InfoCircleOutlined style={{ color: '#faad14' }} />
  </Tooltip>
</Space>
```

---

## Component 4: Spillover Summary

### Layout

```tsx
<Alert
  message={
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Space>
        <SwapOutlined />
        <Text strong>Spillover Summary</Text>
      </Space>
      <Button 
        type="text" 
        icon={expanded ? <UpOutlined /> : <DownOutlined />}
        onClick={() => setExpanded(!expanded)}
      />
    </Space>
  }
  description={
    <Space direction="vertical">
      <Text>
        <strong>{count}</strong> records ({effort} eD) spilled from previous PIs
      </Text>
      {expanded && (
        <>
          <Divider />
          <Text strong>Breakdown by Source PI:</Text>
          {spilloverByPI.map(item => (
            <Text>• {item.pi_name}: {item.count} records ({item.effort} eD)</Text>
          ))}
        </>
      )}
    </Space>
  }
  type="warning"
  showIcon
  style={{ borderColor: '#faad14', backgroundColor: '#fff7e6' }}
/>
```

**Visibility:** Only when spillover records exist

---

## Interaction Flows

### Mark as Spillover Flow

1. User clicks spillover button → Modal opens
2. User selects original PI → Validation runs
3. User enters reason (min 10 chars) → Character count updates
4. User selects category → Form complete
5. User clicks submit → Loading state
6. Success → Modal closes, toast message, table refreshes
7. Record shows orange styling and spillover tag

### View Details Flow

1. User hovers over spillover record → Row highlights
2. User hovers over info icon → Tooltip shows PI and reason

---

## Accessibility

**Keyboard Navigation:**
- Tab: Move between fields
- Enter: Submit form
- Escape: Close modal

**ARIA Labels:**
- Modal: `role="dialog"`
- Form fields: `aria-required="true"`
- Errors: `aria-describedby="error-id"`

**Screen Reader:**
- Modal open: "Mark as spillover dialog opened"
- Success: "JIRA record marked as spillover from [PI Name]"

---

## Implementation Notes

### Required Components
```tsx
import { Modal, Form, Input, Select, Button, Space, Alert, Tag, Tooltip } from 'antd';
import { SwapOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
```

### State Management
```typescript
const [spilloverModalOpen, setSpilloverModalOpen] = useState(false);
const [selectedRecord, setSelectedRecord] = useState<JiraRecord | null>(null);
const [summaryExpanded, setSummaryExpanded] = useState(false);
```

### API Call
```typescript
await jiraRecordApi.markAsSpillover(recordId, {
  spillover_from_pi_id: values.spillover_from_pi_id,
  spillover_reason: values.spillover_reason,
  category: values.category
});
```

---

**Status:** Ready for Frontend Implementation
