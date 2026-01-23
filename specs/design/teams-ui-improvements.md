# UI Design: Teams Section Improvements

## Design Overview
Streamline the Teams section for better usability and visual consistency.

## Navigation Changes

### Before
```
Teams ▼
  └── Team List
```

### After
```
Teams (single item, no submenu)
```

## Page Layout

### Header Section
```
┌─────────────────────────────────────────────────────────────────┐
│  Team Capacity Management                                        │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  [≡ List] [📊 Dashboard]                                        │
└─────────────────────────────────────────────────────────────────┘
```

- **Title**: "Team Capacity Management" - 20px, font-weight 600
- **Subtitle line**: 1px solid #f0f0f0
- **View toggle**: Segmented control (List/Dashboard) - left aligned

### Removed Elements
- ~~Setup Wizard button~~
- ~~Quick Add button~~

## Table Design

### Column Layout
| Column | Width | Align | Content |
|--------|-------|-------|---------|
| Team | flex | left | Name + Code |
| Status | 90px | center | Tag |
| Members | 80px | center | Number |
| Capacity | 90px | right | Days |
| Actions | 100px | center | Icon buttons |

### Action Buttons (Standardized)
```
┌─────────────────────────────────────┐
│  [👥]  [✏️]  [🗑️]                   │
│   ↑      ↑      ↑                   │
│ Manage  Edit  Delete                │
└─────────────────────────────────────┘
```

- **Style**: `type="link"` with icons only
- **Size**: Default (not small)
- **Tooltips**: Show on hover
- **Colors**:
  - Manage: Primary blue (#1890ff)
  - Edit: Primary blue (#1890ff)
  - Delete: Danger red (#ff4d4f)

### Icons Used
- Manage Team: `TeamOutlined`
- Edit: `EditOutlined`
- Delete: `DeleteOutlined`

## Visual Specifications

### Colors
- Page header text: #262626
- Table header: #fafafa background
- Row hover: #f5f5f5
- Selected row: #e6f7ff
- Action icons: #1890ff (primary), #ff4d4f (danger)

### Spacing
- Page padding: 24px
- Header margin-bottom: 24px
- Table row height: 54px
- Action button gap: 8px

## Responsive Behavior
- On smaller screens, maintain table with horizontal scroll
- Action buttons remain icon-only for space efficiency

## Interaction States

### Row Selection
- Click row → Show capacity panel on right
- Hover → Light background highlight
- Selected → Blue tint background

### Action Buttons
- Hover → Show tooltip
- Click → Execute action
- Delete → Show confirmation popover

## Accessibility
- All buttons have aria-labels
- Tooltips provide context
- Keyboard navigation supported
