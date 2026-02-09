# Version Selector UI Design Specification

## Overview

Complete UI/UX design for the roadmap version selector component in the Strategic Planning page. This component enables users to view, create, and manage different versions of their roadmap plans.

---

## 1. Component Hierarchy

```
ProductRoadmapPage
├── Page Header
│   ├── Back Button + Title
│   └── Version Control Section (NEW)
│       ├── Version Selector Dropdown
│       ├── Status Badge
│       ├── Create Version Button
│       ├── Publish Button (conditional)
│       └── Status Alert Banner
├── Feature Table
└── Modals
    ├── Create Version Modal (NEW)
    └── Publish Confirmation Modal (NEW)
```

---

## 2. Version Control Section

### Layout Specifications

**Location:** Below page header, above feature table  
**Spacing:** 16px margin bottom  
**Background:** White (#FFFFFF)  
**Border:** 1px solid #f0f0f0 (bottom only)  
**Padding:** 16px 24px  

### Visual Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Back to Products  │  Baggage Reconciliation System - Roadmap Planning│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Version: [2026-02-05 ▾] [DRAFT]   [Create New Version] [Publish]      │
│           ↑              ↑          ↑                    ↑              │
│           Dropdown       Badge      Primary Btn          Success Btn    │
│                                                                         │
│  ⚠️ You are editing a draft version. Publish when ready.               │
│  ↑                                                                      │
│  Alert Banner (warning style)                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Measurements

**Version Selector Row:**
- Height: 40px
- Gap between elements: 12px
- Alignment: Flex row, align-items: center

**Elements:**
1. Label "Version:" - Font: 14px, Weight: 500, Color: #262626
2. Dropdown - Width: 200px, Height: 32px
3. Status Badge - Height: 22px, Padding: 0 8px
4. Create Button - Height: 32px, Padding: 0 16px
5. Publish Button - Height: 32px, Padding: 0 16px

---

## 3. Version Dropdown

### Default State (Closed)

```
┌──────────────────────────────────┐
│ 2026-02-05  [DRAFT]           ▾ │
└──────────────────────────────────┘
```

**Specifications:**
- Width: 200px
- Height: 32px
- Border: 1px solid #d9d9d9
- Border Radius: 2px
- Padding: 4px 11px
- Font Size: 14px
- Background: #FFFFFF

**Content Layout:**
- Version name: Left-aligned, flex-grow: 1
- Status badge: Inline, margin-left: 8px
- Dropdown icon: Right-aligned, color: #00000073

### Hover State

- Border: 1px solid #40a9ff
- Cursor: pointer

### Focus State

- Border: 1px solid #40a9ff
- Box Shadow: 0 0 0 2px rgba(24, 144, 255, 0.2)

### Open State (Dropdown Menu)

```
┌──────────────────────────────────────────────────┐
│ 2026-02-05  [DRAFT]  (15 features)   ← Selected │
│ 2026-01-15  [PUBLISHED]  (12 features)          │
│ 2026-01-01  [PUBLISHED]  (10 features)          │
│ ──────────────────────────────────────────────── │
│ + Create New Version                             │
└──────────────────────────────────────────────────┘
```

**Specifications:**
- Width: 320px (wider than closed state)
- Max Height: 300px (scroll if more)
- Border: 1px solid #d9d9d9
- Border Radius: 2px
- Box Shadow: 0 2px 8px rgba(0, 0, 0, 0.15)
- Background: #FFFFFF
- Z-index: 1050

**Menu Item:**
- Height: 40px
- Padding: 8px 12px
- Display: Flex, align-items: center

**Menu Item Hover:**
- Background: #f5f5f5
- Cursor: pointer

**Menu Item Selected:**
- Background: #e6f7ff
- Font Weight: 500

**Divider:**
- Height: 1px
- Background: #f0f0f0
- Margin: 4px 0

**Create New Option:**
- Color: #1890ff
- Font Weight: 500
- Icon: PlusOutlined (Ant Design)

---

## 4. Status Badges

### DRAFT Badge

**Visual:**
```
┌─────────┐
│  DRAFT  │
└─────────┘
```

**Specifications:**
- Background: #fff7e6
- Border: 1px solid #ffd591
- Color: #d46b08
- Font Size: 12px
- Font Weight: 500
- Padding: 0 8px
- Height: 22px
- Border Radius: 2px
- Text Transform: uppercase

### PUBLISHED Badge

**Visual:**
```
┌─────────────┐
│  PUBLISHED  │
└─────────────┘
```

**Specifications:**
- Background: #f6ffed
- Border: 1px solid #b7eb8f
- Color: #52c41a
- Font Size: 12px
- Font Weight: 500
- Padding: 0 8px
- Height: 22px
- Border Radius: 2px
- Text Transform: uppercase

---

## 5. Action Buttons

### Create New Version Button

**Default State:**
```
┌──────────────────────┐
│ Create New Version   │
└──────────────────────┘
```

**Specifications:**
- Type: Primary button (Ant Design)
- Background: #1890ff
- Color: #FFFFFF
- Height: 32px
- Padding: 0 16px
- Font Size: 14px
- Border Radius: 2px
- Icon: PlusOutlined (optional, left side)

**Hover State:**
- Background: #40a9ff
- Cursor: pointer

**Disabled State:**
- Background: #f5f5f5
- Color: rgba(0, 0, 0, 0.25)
- Border: 1px solid #d9d9d9
- Cursor: not-allowed
- Tooltip: "A draft version already exists. Publish or delete it first."

### Publish Button

**Default State:**
```
┌──────────┐
│ Publish  │
└──────────┘
```

**Specifications:**
- Type: Success button
- Background: #52c41a
- Color: #FFFFFF
- Height: 32px
- Padding: 0 16px
- Font Size: 14px
- Border Radius: 2px
- Icon: CheckOutlined (optional, left side)

**Hover State:**
- Background: #73d13d
- Cursor: pointer

**Visibility:**
- Only shown when current version status is DRAFT
- Hidden when viewing PUBLISHED version

---

## 6. Alert Banners

### Draft Version Alert (Warning)

**Visual:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ ⚠️ You are editing a draft version. Publish when ready.                │
└─────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Type: Ant Design Alert (warning)
- Background: #fffbe6
- Border: 1px solid #ffe58f
- Color: #000000d9
- Icon: ExclamationCircleOutlined, Color: #faad14
- Padding: 8px 15px
- Border Radius: 2px
- Font Size: 14px
- Margin Top: 12px
- Closable: false

### Published Version Alert (Info)

**Visual:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🔒 This version is published and cannot be edited.                      │
│    [Create New Version from This]                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Type: Ant Design Alert (info)
- Background: #e6f7ff
- Border: 1px solid #91d5ff
- Color: #000000d9
- Icon: LockOutlined, Color: #1890ff
- Padding: 12px 15px
- Border Radius: 2px
- Font Size: 14px
- Margin Top: 12px
- Closable: false

**Action Button in Alert:**
- Type: Link button
- Color: #1890ff
- Font Size: 14px
- Margin Top: 8px
- Display: block

---

## 7. Create Version Modal

### Modal Structure

**Dimensions:**
- Width: 520px
- Max Height: 80vh
- Border Radius: 2px
- Box Shadow: 0 4px 12px rgba(0, 0, 0, 0.15)

**Header:**
- Height: 55px
- Padding: 16px 24px
- Border Bottom: 1px solid #f0f0f0
- Title: "Create New Version"
- Font Size: 16px
- Font Weight: 500

**Body:**
- Padding: 24px
- Background: #FFFFFF

**Footer:**
- Height: 56px
- Padding: 10px 16px
- Border Top: 1px solid #f0f0f0
- Text Align: right
- Button Gap: 8px

### Form Fields

**1. Version Name Field:**

```
Version Name: [2026-02-05                    ]
              (auto-filled with today's date)
```

- Label: "Version Name"
- Font Size: 14px
- Font Weight: 500
- Margin Bottom: 8px
- Input Width: 100%
- Input Height: 32px
- Placeholder: "YYYY-MM-DD"
- Default Value: Current date (auto-filled)
- Validation: Required, unique per product

**2. Copy From Field:**

```
Copy from:    [2026-01-15 (PUBLISHED) ▾]
```

- Label: "Copy from"
- Font Size: 14px
- Font Weight: 500
- Margin Bottom: 8px
- Dropdown Width: 100%
- Dropdown Height: 32px
- Options: List of existing versions
- Default: Most recent PUBLISHED version
- Optional: Can be left empty for blank version

**3. Description Field:**

```
Description:  [Optional notes about this version...    ]
              [                                         ]
```

- Label: "Description"
- Font Size: 14px
- Font Weight: 500
- Margin Bottom: 8px
- Textarea Width: 100%
- Textarea Height: 80px
- Placeholder: "Optional notes about this version..."
- Max Length: 500 characters
- Optional field

**4. Info Message:**

```
ℹ️ All features from the selected version will be copied.
```

- Type: Ant Design Alert (info, no border)
- Background: #f0f9ff
- Color: #000000d9
- Icon: InfoCircleOutlined, Color: #1890ff
- Padding: 8px 12px
- Border Radius: 2px
- Font Size: 13px
- Margin Top: 16px

### Modal Actions

**Cancel Button:**
- Type: Default button
- Background: #FFFFFF
- Border: 1px solid #d9d9d9
- Color: #000000d9
- Height: 32px
- Padding: 0 15px

**Create Version Button:**
- Type: Primary button
- Background: #1890ff
- Color: #FFFFFF
- Height: 32px
- Padding: 0 15px
- Loading State: Shows spinner when creating

---

## 8. Publish Confirmation Modal

### Modal Structure

**Dimensions:**
- Width: 480px
- Border Radius: 2px
- Box Shadow: 0 4px 12px rgba(0, 0, 0, 0.15)

**Header:**
- Height: 55px
- Padding: 16px 24px
- Border Bottom: 1px solid #f0f0f0
- Title: "Publish Version"
- Font Size: 16px
- Font Weight: 500

**Body:**
- Padding: 24px
- Background: #FFFFFF

**Footer:**
- Height: 56px
- Padding: 10px 16px
- Border Top: 1px solid #f0f0f0
- Text Align: right
- Button Gap: 8px

### Content

**Warning Message:**

```
⚠️ Are you sure you want to publish version "2026-02-05"?
```

- Icon: ExclamationCircleOutlined
- Icon Color: #faad14
- Font Size: 16px
- Font Weight: 500
- Margin Bottom: 16px

**Consequences List:**

```
Once published:
• This version will be locked and cannot be edited
• You can create a new version based on this one
• Features in this version become the baseline for execution
```

- Title: "Once published:"
- Font Size: 14px
- Font Weight: 500
- Margin Bottom: 8px
- List Items:
  - Font Size: 14px
  - Line Height: 1.8
  - Bullet: • (unicode bullet)
  - Padding Left: 20px

### Modal Actions

**Cancel Button:**
- Type: Default button
- Background: #FFFFFF
- Border: 1px solid #d9d9d9
- Color: #000000d9
- Height: 32px
- Padding: 0 15px

**Publish Button:**
- Type: Primary button (success color)
- Background: #52c41a
- Color: #FFFFFF
- Height: 32px
- Padding: 0 15px
- Loading State: Shows spinner when publishing

---

## 9. Interaction States

### Version Selector Interactions

**1. Dropdown Click:**
- Opens dropdown menu
- Shows list of versions
- Highlights current version
- Shows "Create New Version" option at bottom

**2. Version Selection:**
- Closes dropdown
- Updates page to show selected version
- Updates status badge
- Shows/hides publish button based on status
- Updates alert banner
- Reloads feature table with version's features

**3. Create Button Click:**
- Opens Create Version Modal
- Pre-fills version name with current date
- Pre-selects most recent published version in "Copy from"

**4. Publish Button Click:**
- Opens Publish Confirmation Modal
- Shows version name in warning message

### Modal Interactions

**Create Version Modal:**

**Success Flow:**
1. User fills form
2. Clicks "Create Version"
3. Button shows loading spinner
4. API call to create version
5. Success: Modal closes, page updates to new version
6. Success message: "Version created successfully"

**Error Flow:**
1. API call fails
2. Error message shown in modal
3. User can retry or cancel

**Publish Confirmation Modal:**

**Success Flow:**
1. User clicks "Publish"
2. Button shows loading spinner
3. API call to publish version
4. Success: Modal closes, page updates
5. Status badge changes to PUBLISHED
6. Publish button disappears
7. Alert banner changes to read-only message
8. Success message: "Version published successfully"

---

## 10. Loading States

### Initial Page Load

**Skeleton:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Version: [████████████] [████]   [████████████] [████████]              │
└─────────────────────────────────────────────────────────────────────────┘
```

- Show skeleton loaders for dropdown and buttons
- Duration: Until versions API call completes

### Version Switch

**Loading Indicator:**
- Show loading spinner overlay on feature table
- Keep version selector enabled
- Duration: Until features API call completes

### Create Version

**Button Loading:**
- "Create Version" button shows spinner
- Button text: "Creating..."
- Button disabled during creation
- Duration: Until create API call completes

### Publish Version

**Button Loading:**
- "Publish" button shows spinner
- Button text: "Publishing..."
- Button disabled during publish
- Duration: Until publish API call completes

---

## 11. Error States

### API Error Messages

**Create Version Failed:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ ❌ Failed to create version: A draft version already exists             │
└─────────────────────────────────────────────────────────────────────────┘
```

- Type: Ant Design Message (error)
- Duration: 5 seconds
- Position: Top center

**Publish Version Failed:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ ❌ Failed to publish version: Version not found                         │
└─────────────────────────────────────────────────────────────────────────┘
```

- Type: Ant Design Message (error)
- Duration: 5 seconds
- Position: Top center

### Validation Errors

**Version Name Required:**
- Show error message below input
- Border color: #ff4d4f
- Error text: "Version name is required"
- Font Size: 12px
- Color: #ff4d4f

**Version Name Duplicate:**
- Show error message below input
- Error text: "A version with this name already exists"

---

## 12. Success Messages

### Create Version Success

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ✅ Version "2026-02-05" created successfully                            │
└─────────────────────────────────────────────────────────────────────────┘
```

- Type: Ant Design Message (success)
- Duration: 3 seconds
- Position: Top center

### Publish Version Success

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ✅ Version "2026-02-05" published successfully                          │
└─────────────────────────────────────────────────────────────────────────┘
```

- Type: Ant Design Message (success)
- Duration: 3 seconds
- Position: Top center

---

## 13. Responsive Behavior

### Desktop (≥1200px)

- Full layout as specified
- All elements in single row
- Dropdown width: 200px
- Modal width: 520px

### Tablet (768px - 1199px)

- Version selector wraps to 2 rows if needed
- Row 1: Label + Dropdown + Badge
- Row 2: Buttons (if wrapped)
- Dropdown width: 180px
- Modal width: 90% max 520px

### Mobile (<768px)

- Version selector stacks vertically
- Each element full width
- Dropdown width: 100%
- Buttons stack vertically
- Modal width: 95%
- Modal padding reduced to 16px

---

## 14. Accessibility

### Keyboard Navigation

**Tab Order:**
1. Version dropdown
2. Create Version button
3. Publish button (if visible)
4. Alert banner action button (if present)

**Keyboard Shortcuts:**
- Enter: Open dropdown / Select option
- Escape: Close dropdown / Close modal
- Arrow Up/Down: Navigate dropdown options
- Space: Toggle dropdown

### Screen Reader Support

**ARIA Labels:**
- Dropdown: `aria-label="Select roadmap version"`
- Create Button: `aria-label="Create new version"`
- Publish Button: `aria-label="Publish current version"`
- Status Badge: `aria-label="Version status: Draft"` or `"Version status: Published"`

**ARIA States:**
- Dropdown: `aria-expanded="true/false"`
- Buttons: `aria-disabled="true/false"`
- Alert: `role="alert"`

### Focus Indicators

- All interactive elements have visible focus outline
- Focus outline: 2px solid #40a9ff
- Focus outline offset: 2px

---

## 15. Animation & Transitions

### Dropdown Animation

**Open:**
- Duration: 150ms
- Easing: ease-out
- Transform: scaleY(0) to scaleY(1)
- Transform Origin: top
- Opacity: 0 to 1

**Close:**
- Duration: 100ms
- Easing: ease-in
- Transform: scaleY(1) to scaleY(0)
- Opacity: 1 to 0

### Modal Animation

**Open:**
- Duration: 200ms
- Easing: ease-out
- Transform: scale(0.95) to scale(1)
- Opacity: 0 to 1

**Close:**
- Duration: 150ms
- Easing: ease-in
- Transform: scale(1) to scale(0.95)
- Opacity: 1 to 0

### Button Hover

- Duration: 200ms
- Easing: ease-in-out
- Property: background-color

### Alert Banner

**Appear:**
- Duration: 300ms
- Easing: ease-out
- Transform: translateY(-10px) to translateY(0)
- Opacity: 0 to 1

---

## 16. Color Palette

### Primary Colors
- Primary Blue: #1890ff
- Primary Blue Hover: #40a9ff
- Primary Blue Active: #096dd9

### Status Colors
- Draft Orange: #d46b08
- Draft Background: #fff7e6
- Draft Border: #ffd591
- Published Green: #52c41a
- Published Background: #f6ffed
- Published Border: #b7eb8f

### Alert Colors
- Warning Background: #fffbe6
- Warning Border: #ffe58f
- Warning Icon: #faad14
- Info Background: #e6f7ff
- Info Border: #91d5ff
- Info Icon: #1890ff

### Neutral Colors
- Text Primary: #000000d9
- Text Secondary: #00000073
- Border: #d9d9d9
- Background: #FFFFFF
- Hover Background: #f5f5f5
- Selected Background: #e6f7ff

---

## 17. Typography

### Font Family
- Primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial

### Font Sizes
- Page Title: 20px
- Modal Title: 16px
- Body Text: 14px
- Small Text: 13px
- Badge Text: 12px

### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600

### Line Heights
- Tight: 1.2
- Normal: 1.5
- Relaxed: 1.8

---

## 18. Spacing System

### Margins
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px

### Padding
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px

### Gaps
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px

---

## 19. Implementation Notes for Frontend Developer

### Component Structure

```tsx
<VersionControlSection>
  <Space direction="horizontal" size="middle">
    <Text strong>Version:</Text>
    <VersionDropdown 
      versions={versions}
      currentVersion={currentVersion}
      onChange={handleVersionChange}
    />
    <StatusBadge status={currentVersion.status} />
    <CreateVersionButton 
      disabled={hasDraft}
      onClick={handleCreateClick}
    />
    {isDraft && (
      <PublishButton onClick={handlePublishClick} />
    )}
  </Space>
  
  {isDraft && (
    <Alert 
      type="warning"
      message="You are editing a draft version. Publish when ready."
      style={{ marginTop: 12 }}
    />
  )}
  
  {isPublished && (
    <Alert 
      type="info"
      message="This version is published and cannot be edited."
      action={
        <Button type="link" onClick={handleCreateFromThis}>
          Create New Version from This
        </Button>
      }
      style={{ marginTop: 12 }}
    />
  )}
</VersionControlSection>

<CreateVersionModal 
  visible={createModalVisible}
  versions={versions}
  onClose={handleCreateModalClose}
  onSuccess={handleCreateSuccess}
/>

<PublishConfirmModal
  visible={publishModalVisible}
  version={currentVersion}
  onClose={handlePublishModalClose}
  onConfirm={handlePublishConfirm}
/>
```

### Ant Design Components Used

- `Select` - Version dropdown
- `Tag` - Status badges
- `Button` - Action buttons
- `Alert` - Status banners
- `Modal` - Create and publish modals
- `Form` - Create version form
- `Input` - Version name input
- `Input.TextArea` - Description input
- `Space` - Layout spacing
- `Typography.Text` - Text elements
- `message` - Toast notifications

### State Management

```tsx
const [versions, setVersions] = useState([]);
const [currentVersion, setCurrentVersion] = useState(null);
const [createModalVisible, setCreateModalVisible] = useState(false);
const [publishModalVisible, setPublishModalVisible] = useState(false);
const [loading, setLoading] = useState(false);

const isDraft = currentVersion?.status === 'DRAFT';
const isPublished = currentVersion?.status === 'PUBLISHED';
const hasDraft = versions.some(v => v.status === 'DRAFT');
```

---

## 20. Testing Checklist

### Visual Testing
- [ ] Version dropdown displays correctly
- [ ] Status badges show correct colors
- [ ] Buttons are properly styled
- [ ] Alert banners display correctly
- [ ] Modals are centered and sized correctly
- [ ] Responsive behavior works on all screen sizes

### Functional Testing
- [ ] Can select different versions
- [ ] Create version modal opens and closes
- [ ] Can create version with copied features
- [ ] Can create empty version
- [ ] Publish confirmation modal works
- [ ] Can publish draft version
- [ ] Cannot create multiple drafts
- [ ] Published versions show read-only banner
- [ ] Error messages display correctly
- [ ] Success messages display correctly

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader announces changes
- [ ] Focus indicators are visible
- [ ] ARIA labels are correct
- [ ] Color contrast meets WCAG AA standards

---

## Summary

This design specification provides complete UI/UX details for implementing the version selector component in the Roadmap Planning page. All measurements, colors, interactions, and states are defined for consistent implementation.

**Key Features:**
- Version dropdown with status badges
- Create version with feature copying
- Publish version with confirmation
- Read-only enforcement for published versions
- Responsive design for all screen sizes
- Full accessibility support

**Design System:** Ant Design (antd)  
**Designed by:** @UI-Designer  
**Date:** February 5, 2026  
**Status:** Ready for implementation
