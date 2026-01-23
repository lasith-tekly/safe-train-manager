# Technical Architecture: Teams Section UI Improvements

## Overview
This document outlines the technical changes needed to implement the Teams UI improvements.

## Files to Modify

### 1. Navigation - Remove Teams Submenu
**File**: `frontend/src/components/Layout/SideNavLayout.tsx`

**Change**: Convert Teams from submenu to single menu item
```tsx
// Before
getItem('Teams', '/teams', <TeamOutlined />, [
  getItem('Team List', '/teams/list'),
]),

// After
getItem('Teams', '/teams', <TeamOutlined />),
```

**Also update**:
- Route in `App.tsx`: Change `/teams/list` to `/teams`
- `getSelectedKeys()`: Update to handle `/teams` directly

### 2. Page Header
**File**: `frontend/src/pages/Setup/TeamsTab/index.tsx`

**Change**: Add page header component
```tsx
<div className={styles.pageHeader}>
  <Typography.Title level={3}>Team Capacity Management</Typography.Title>
</div>
```

### 3. Remove Setup Wizard and Quick Add Buttons
**File**: `frontend/src/pages/Setup/TeamsTab/index.tsx`

**Change**: Remove lines 238-245 (Setup Wizard and Quick Add buttons)

### 4. Standardize Action Buttons
**File**: `frontend/src/pages/Setup/TeamsTab/index.tsx`

**Change**: Update Actions column (lines 181-218)
```tsx
{
  title: 'Actions',
  key: 'actions',
  width: 100,
  align: 'center',
  render: (_: unknown, record: Team) => (
    <Space size="small">
      <Tooltip title="Manage Team">
        <Button
          type="link"
          icon={<TeamOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTeamForManage(record);
            setShowManagePanel(true);
          }}
        />
      </Tooltip>
      <Tooltip title="Edit">
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(record);
          }}
        />
      </Tooltip>
      <Popconfirm
        title="Delete team?"
        description="This action cannot be undone."
        onConfirm={() => handleDelete(record)}
        okText="Delete"
        cancelText="Cancel"
      >
        <Tooltip title="Delete">
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Tooltip>
      </Popconfirm>
    </Space>
  ),
}
```

### 5. Fix Content Alignment
**File**: `frontend/src/pages/Setup/TeamsTab/index.tsx`

**Change**: Add `align: 'left'` to text columns, ensure table is left-aligned

### 6. CSS Updates
**File**: `frontend/src/pages/Setup/TeamsTab/TeamsTab.module.css`

**Add**:
```css
.pageHeader {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.pageHeader h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
```

## Impact Analysis

| Change | Risk | Impact |
|--------|------|--------|
| Remove submenu | Low | Navigation simplification |
| Add page header | Low | Visual improvement |
| Remove buttons | Low | UI cleanup |
| Standardize actions | Low | Consistency improvement |
| Fix alignment | Low | Visual improvement |

## Testing Checklist
- [ ] Teams menu item navigates correctly
- [ ] Page header displays "Team Capacity Management"
- [ ] No Setup Wizard or Quick Add buttons visible
- [ ] Action buttons are consistent (icons only, tooltips on hover)
- [ ] Table content is left-aligned
- [ ] All existing functionality still works
