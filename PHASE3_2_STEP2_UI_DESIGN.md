# UI Design: Phase 3.2 - Spillover UX Improvements & Record Lifecycle

**Version:** 1.0  
**Date:** February 10, 2026  
**Status:** 🎨 UI Design Complete

---

## Color Palette

### Status Colors
- PLANNED: `#1890ff` (blue)
- IMPLEMENTING: `#722ed1` (purple)
- INTERNAL_TESTING: `#faad14` (orange)
- LOAD_TO_UAT: `#13c2c2` (cyan)
- CUSTOMER_TESTING: `#52c41a` (green)
- LOAD_TO_PRD: `#eb2f96` (magenta)
- COMPLETED: `#52c41a` (green)
- SPILLOVER: `#fa8c16` (orange)

### Event Colors
- Created: `#52c41a` (green)
- Status Change: `#1890ff` (blue)
- Spillover: `#fa8c16` (orange)
- Field Edit: `#722ed1` (purple)

---

## Component 1: Status Dropdown (NO SPILLOVER)

### Dropdown Options
```tsx
<Select>
  <Option value="PLANNED">📋 Planned</Option>
  <Option value="IMPLEMENTING">🔧 Implementing</Option>
  <Option value="INTERNAL_TESTING">🧪 Internal Testing</Option>
  <Option value="LOAD_TO_UAT">📤 Load to UAT</Option>
  <Option value="CUSTOMER_TESTING">👥 Customer Testing</Option>
  <Option value="LOAD_TO_PRD">🚀 Load to PRD</Option>
  <Option value="COMPLETED">✅ Completed</Option>
  {/* NO SPILLOVER */}
</Select>

<Alert 
  message="To mark as spillover, use the ↔️ button in Actions column"
  type="info"
/>
```

---

## Component 2: Editable Spillover Details

### Layout
```
Spillover Details
├── Spillover Count: [×2] (badge, read-only)
├── Originally From: PI 2026.1 (read-only)
├── Spilled From PI: PI 2026.2 (read-only)
├── Category: [Dependencies ▼] (editable dropdown)
├── Reason: [TextArea 500 chars] (editable)
├── Spillover Effort: [5.0 eD] (editable)
├── Completed Effort: [2.0 eD] (editable)
├── Validation Alert: "Planned: 10 | Completed: 2 | Spillover: 5 ✓"
└── [Save Spillover Changes] button
```

### Validation
- `spillover_effort + completed_effort ≤ planned_effort`
- `spillover_effort ≥ 0.5 eD`
- `completed_effort ≥ 0`
- Reason: 10-500 chars

---

## Component 3: Record History Timeline

### Timeline Events
```tsx
<Timeline>
  {/* Created - Green */}
  <Timeline.Item color="green" dot={<PlusCircleOutlined />}>
    Created - Jan 10, 2026
    [PLANNED] [PI 2026.1] [10 eD]
  </Timeline.Item>

  {/* Status Change - Blue */}
  <Timeline.Item color="blue" dot={<SwapRightOutlined />}>
    Status Changed - Jan 20, 2026
    PLANNED → IMPLEMENTING
  </Timeline.Item>

  {/* Spillover - Orange */}
  <Timeline.Item color="orange" dot={<SwapOutlined />}>
    Spillover #1 - Feb 01, 2026
    PI 2026.1 → PI 2026.2
    [5.0 eD spilled] [5.0 eD completed]
    Category: Dependencies
    "Waiting for API integration..."
  </Timeline.Item>

  {/* Field Edit - Purple */}
  <Timeline.Item color="purple" dot={<EditOutlined />}>
    Field Edited - Feb 08, 2026
    Spillover Reason updated
  </Timeline.Item>

  {/* Current - Gray */}
  <Timeline.Item color="gray" dot={<ClockCircleOutlined />}>
    Current State
    PI 2026.3 | INTERNAL_TESTING | SPILLOVER (×2)
  </Timeline.Item>
</Timeline>
```

---

## Component 4: Table Status Column

### Display Format
```tsx
<Space>
  {/* Primary Status */}
  <Tag color="purple">IMPLEMENTING</Tag>
  
  {/* Spillover Indicator (if applicable) */}
  {status === 'SPILLOVER' && (
    <>
      <Tag color="orange">↔️ SPILLOVER</Tag>
      {spillover_count > 1 && (
        <Tag color={spillover_count >= 3 ? 'red' : 'orange'}>
          ×{spillover_count}
        </Tag>
      )}
    </>
  )}
</Space>
```

---

## Component 5: Spillover Button Visibility

### Rules
```tsx
{record.status !== 'COMPLETED' && record.status !== 'LOAD_TO_PRD' && (
  <Button 
    icon={<SwapOutlined />}
    onClick={handleMarkSpillover}
  >
    {record.status === 'SPILLOVER' ? 'Cascading Spillover' : 'Mark as Spillover'}
  </Button>
)}
```

### Visibility Matrix
| Status | Show Button | Label |
|--------|-------------|-------|
| PLANNED | ✅ | Mark as Spillover |
| IMPLEMENTING | ✅ | Mark as Spillover |
| INTERNAL_TESTING | ✅ | Mark as Spillover |
| LOAD_TO_UAT | ✅ | Mark as Spillover |
| CUSTOMER_TESTING | ✅ | Mark as Spillover |
| SPILLOVER | ✅ | Cascading Spillover |
| LOAD_TO_PRD | ❌ | - |
| COMPLETED | ❌ | - |

---

## Interaction Flows

### Flow 1: Mark as Spillover
1. User clicks ↔️ button
2. SpilloverModal opens
3. User fills: target PI, reason, category, effort
4. Validation runs real-time
5. Submit → Record status = SPILLOVER
6. History entry created

### Flow 2: Edit Spillover Details
1. User opens Edit modal on SPILLOVER record
2. Spillover Details section shows (editable)
3. User modifies reason/category/effort
4. Validation runs
5. Click "Save Spillover Changes"
6. Both record AND history updated
7. Audit log created

### Flow 3: Cascading Spillover
1. Record already has status = SPILLOVER
2. ↔️ button still visible
3. User clicks → SpilloverModal opens
4. Warning shows: "Already spilled 1 time(s)"
5. User selects new target PI
6. Submit → spillover_count increments
7. New history entry created
8. original_pi_id preserved

---

## Specifications

### Typography
- Headings: 16px bold
- Body: 14px regular
- Secondary: 12px gray
- Timestamps: 12px gray

### Spacing
- Section padding: 16px
- Field margin: 8px
- Button padding: 8px 16px

### Components
- Input height: 32px
- Button height: 32px
- Tag height: 22px
- Timeline dot: 16px

---

**Design Complete**  
**Next:** Frontend Implementation
