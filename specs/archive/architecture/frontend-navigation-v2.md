# Frontend Architecture: Navigation Restructure v2.0

## Document Info
- **Version**: 1.0
- **Status**: ✅ Approved by Frontend Architect
- **Created**: 2026-01-19
- **Based on**: 
  - `specs/requirements/navigation-restructure.md` (PM Approved)
  - `specs/design/navigation-ui.md` (UI Design Spec)

### Frontend Architect Review Notes:
- Architecture follows React Router v6 patterns ✅
- Component structure aligns with project conventions ✅
- State management approach is appropriate ✅
- Legacy redirect strategy is sound ✅
- Ready for implementation

---

## 1. Overview

This document specifies the technical implementation for the navigation restructure approved by the Product Manager.

---

## 2. Route Configuration

### 2.1 New Route Structure

```typescript
// src/routes/index.tsx

const routes = [
  // Dashboard
  { path: '/', element: <DashboardPage /> },
  
  // Products (with sub-routes)
  { path: '/products', element: <Navigate to="/products/list" replace /> },
  { path: '/products/list', element: <ProductsPage /> },
  { path: '/products/features', element: <FeaturesPage /> },
  
  // PI Calendar (top-level)
  { path: '/pi-calendar', element: <PICalendarPage /> },
  
  // Teams (with sub-routes)
  { path: '/teams', element: <Navigate to="/teams/list" replace /> },
  { path: '/teams/list', element: <TeamsPage /> },
  
  // Reports
  { path: '/reports', element: <ReportsPage /> },
  
  // Settings (with sub-routes)
  { path: '/settings', element: <SettingsOverviewPage /> },
  { path: '/settings/working-days', element: <WorkingDaysPage /> },
  { path: '/settings/capacity', element: <CapacityManagementPage /> },
  { path: '/settings/components', element: <ComponentsPage /> },
  { path: '/settings/budgets', element: <BudgetManagementPage /> },
  { path: '/settings/train-teams', element: <TrainTeamsPage /> },
  { path: '/settings/sites', element: <Navigate to="/settings/sites/locations" replace /> },
  { path: '/settings/sites/locations', element: <SiteLocationsPage /> },
  { path: '/settings/sites/holidays', element: <HolidaysPage /> },
];
```

### 2.2 Legacy Route Redirects

```typescript
// src/routes/redirects.tsx
// Maintain for 6 months (until 2026-07-19)

const legacyRedirects = [
  { from: '/features', to: '/products/features' },
  { from: '/setup/pi-calendar', to: '/pi-calendar' },
  { from: '/setup/teams', to: '/teams/list' },
  { from: '/setup/teams/list', to: '/teams/list' },
  { from: '/setup/teams/holidays', to: '/settings/sites/holidays' },
  { from: '/setup/organization', to: '/settings/sites/locations' },
  { from: '/setup/budgets', to: '/settings/budgets' },
  { from: '/setup/settings', to: '/settings' },
  { from: '/setup', to: '/settings' },
];
```

---

## 3. Navigation Menu Configuration

### 3.1 Menu Items Structure

```typescript
// src/components/Layout/SideNavLayout.tsx

const menuItems: MenuItem[] = [
  getItem('Dashboard', '/', <DashboardOutlined />),
  
  getItem('Products', '/products', <ProductOutlined />, [
    getItem('Product List', '/products/list'),
    getItem('Features', '/products/features', <AppstoreOutlined />),
  ]),
  
  getItem('PI Calendar', '/pi-calendar', <CalendarOutlined />),
  
  getItem('Teams', '/teams', <TeamOutlined />, [
    getItem('Team List', '/teams/list'),
  ]),
  
  getItem('Reports', '/reports', <BarChartOutlined />),
  
  getItem('Settings', '/settings', <SettingOutlined />, [
    getItem('Working Days', '/settings/working-days', <ScheduleOutlined />),
    getItem('Capacity Management', '/settings/capacity', <PieChartOutlined />),
    getItem('Components', '/settings/components', <BuildOutlined />),
    getItem('Budget Management', '/settings/budgets', <DollarOutlined />),
    getItem('Train Teams', '/settings/train-teams', <TeamOutlined />),
    getItem('Site Management', '/settings/sites', <GlobalOutlined />, [
      getItem('Countries & Sites', '/settings/sites/locations'),
      getItem('Holidays', '/settings/sites/holidays'),
    ]),
  ]),
];
```

### 3.2 Menu Selection Logic

```typescript
const getSelectedKeys = (): string[] => {
  const path = location.pathname;
  
  // Exact matches
  if (path === '/') return ['/'];
  
  // Products section
  if (path === '/products/list') return ['/products/list'];
  if (path === '/products/features') return ['/products/features'];
  
  // PI Calendar
  if (path === '/pi-calendar') return ['/pi-calendar'];
  
  // Teams section
  if (path.startsWith('/teams')) return ['/teams/list'];
  
  // Reports
  if (path === '/reports') return ['/reports'];
  
  // Settings section
  if (path === '/settings') return ['/settings'];
  if (path === '/settings/working-days') return ['/settings/working-days'];
  if (path === '/settings/capacity') return ['/settings/capacity'];
  if (path === '/settings/components') return ['/settings/components'];
  if (path === '/settings/budgets') return ['/settings/budgets'];
  if (path === '/settings/train-teams') return ['/settings/train-teams'];
  if (path === '/settings/sites/locations') return ['/settings/sites/locations'];
  if (path === '/settings/sites/holidays') return ['/settings/sites/holidays'];
  
  return [path];
};

const getOpenKeys = (): string[] => {
  const path = location.pathname;
  const openKeys: string[] = [];
  
  if (path.startsWith('/products')) {
    openKeys.push('/products');
  }
  if (path.startsWith('/teams')) {
    openKeys.push('/teams');
  }
  if (path.startsWith('/settings')) {
    openKeys.push('/settings');
    if (path.startsWith('/settings/sites')) {
      openKeys.push('/settings/sites');
    }
  }
  
  return openKeys;
};
```

---

## 4. Page Components

### 4.1 New Pages to Create

| Page | Path | Description |
|------|------|-------------|
| `SettingsOverviewPage` | `/settings` | Dashboard with quick links to all settings sections |
| `WorkingDaysPage` | `/settings/working-days` | Extracted from SettingsTab |
| `CapacityManagementPage` | `/settings/capacity` | Extracted from SettingsTab |
| `ComponentsPage` | `/settings/components` | Extracted from SettingsTab |
| `BudgetManagementPage` | `/settings/budgets` | Renamed from BudgetsTab |
| `TrainTeamsPage` | `/settings/train-teams` | Extracted from SettingsTab |
| `SiteLocationsPage` | `/settings/sites/locations` | Renamed from OrganizationTab |
| `HolidaysPage` | `/settings/sites/holidays` | Moved from TeamsTab |

### 4.2 Pages to Rename/Move

| Current | New Location | Notes |
|---------|--------------|-------|
| `pages/Setup/PICalendarTab` | `pages/PICalendar` | Promoted to top-level |
| `pages/Setup/TeamsTab` | `pages/Teams` | Promoted to top-level |
| `pages/Features` | `pages/Products/Features` | Moved under Products |
| `pages/Setup/OrganizationTab` | `pages/Settings/SiteLocations` | Renamed |
| `pages/Setup/HolidaysTab` | `pages/Settings/Holidays` | Moved to Settings |
| `pages/Setup/BudgetsTab` | `pages/Settings/BudgetManagement` | Moved to Settings |

### 4.3 Pages to Delete (after migration)

- `pages/Setup/index.tsx` - No longer needed
- `pages/Setup/SettingsTab/index.tsx` - Split into individual pages

---

## 5. File Structure

### 5.1 New Directory Structure

```
src/pages/
├── Dashboard/
│   └── index.tsx
├── Products/
│   ├── index.tsx (ProductsPage - list)
│   └── Features/
│       └── index.tsx (FeaturesPage)
├── PICalendar/
│   ├── index.tsx
│   └── PICalendar.module.css
├── Teams/
│   ├── index.tsx
│   ├── TeamsTab.module.css
│   └── components/
│       ├── ManageTeamPanel.tsx
│       ├── TeamCapacityDashboard.tsx
│       └── ...
├── Reports/
│   └── index.tsx
└── Settings/
    ├── index.tsx (SettingsOverviewPage)
    ├── WorkingDays/
    │   └── index.tsx
    ├── CapacityManagement/
    │   └── index.tsx
    ├── Components/
    │   └── index.tsx
    ├── BudgetManagement/
    │   └── index.tsx
    ├── TrainTeams/
    │   └── index.tsx
    └── Sites/
        ├── Locations/
        │   └── index.tsx
        └── Holidays/
            └── index.tsx
```

---

## 6. Settings Overview Page

### 6.1 Design

The Settings Overview page provides quick access to all settings sections:

```tsx
// src/pages/Settings/index.tsx

export const SettingsOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  
  const settingsSections = [
    {
      title: 'Working Days',
      description: 'Configure working days and hours',
      icon: <ScheduleOutlined />,
      path: '/settings/working-days',
      color: '#1890ff'
    },
    {
      title: 'Capacity Management',
      description: 'Productivity and allocation settings',
      icon: <PieChartOutlined />,
      path: '/settings/capacity',
      color: '#52c41a'
    },
    {
      title: 'Components',
      description: 'Component hats configuration',
      icon: <BuildOutlined />,
      path: '/settings/components',
      color: '#722ed1'
    },
    {
      title: 'Budget Management',
      description: 'Budget versions and cost configuration',
      icon: <DollarOutlined />,
      path: '/settings/budgets',
      color: '#faad14'
    },
    {
      title: 'Train Teams',
      description: 'Team setup at train level',
      icon: <TeamOutlined />,
      path: '/settings/train-teams',
      color: '#13c2c2'
    },
    {
      title: 'Site Management',
      description: 'Countries, sites, and holidays',
      icon: <GlobalOutlined />,
      path: '/settings/sites/locations',
      color: '#eb2f96'
    },
  ];
  
  return (
    <div className={styles.container}>
      <Typography.Title level={2}>Settings</Typography.Title>
      <Typography.Text type="secondary">
        Configure train-level settings for your organization
      </Typography.Text>
      
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {settingsSections.map(section => (
          <Col span={8} key={section.path}>
            <Card 
              hoverable 
              onClick={() => navigate(section.path)}
              className={styles.sectionCard}
            >
              <div style={{ color: section.color, fontSize: 32 }}>
                {section.icon}
              </div>
              <Typography.Title level={4}>{section.title}</Typography.Title>
              <Typography.Text type="secondary">
                {section.description}
              </Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};
```

---

## 7. Implementation Order

### Phase 1: Route Setup (Day 1) ✅ COMPLETED
1. ✅ Create new route configuration
2. ✅ Add legacy redirects
3. ✅ Update SideNavLayout menu items
4. ✅ Update menu selection logic

### Phase 2: Page Migration (Day 2-3) ✅ COMPLETED
1. ✅ Create new directory structure
2. ✅ Create PICalendarPage wrapper → PICalendar
3. ✅ Create TeamsPage wrapper → Teams
4. ✅ Features accessible via Products/Features
5. ✅ Create SettingsPage with sub-routing
6. ✅ OrganizationTab accessible via Settings/Sites/Locations
7. ✅ HolidaysTab accessible via Settings/Sites/Holidays
8. ✅ BudgetsTab accessible via Settings/BudgetManagement

### Phase 3: Settings Split (Day 4-5) 🔄 IN PROGRESS
1. ✅ Create SettingsOverviewPage
2. ⏳ Extract WorkingDaysPage from SettingsTab (currently uses SettingsTab)
3. ⏳ Extract CapacityManagementPage from SettingsTab (currently uses SettingsTab)
4. ⏳ Extract ComponentsPage from SettingsTab (currently uses SettingsTab)
5. ⏳ Extract TrainTeamsPage from SettingsTab (currently uses SettingsTab)

### Phase 4: Cleanup (Day 6)
1. Remove old Setup directory (after full migration)
2. Update any remaining hardcoded paths
3. Test all routes and redirects
4. Update breadcrumbs

---

## 8. Testing Checklist

- [ ] All new routes accessible
- [ ] All legacy routes redirect correctly
- [ ] Menu highlights correct item for each route
- [ ] Menu expands correct parent items
- [ ] No broken links in application
- [ ] Browser back/forward works correctly
- [ ] Direct URL access works for all routes

---

## 9. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Frontend Architect | Cascade | ✅ Approved | 2026-01-19 |
| Frontend Developer | Cascade | ✅ Implemented | 2026-01-19 |

---

## 10. Implementation Summary

### Files Created:
- `src/pages/PICalendar/index.tsx` - Wrapper for PICalendarTab
- `src/pages/Teams/index.tsx` - Wrapper for TeamsTab  
- `src/pages/Settings/index.tsx` - Settings overview + sub-routing

### Files Modified:
- `src/App.tsx` - Updated routes with new structure + legacy redirects
- `src/components/Layout/SideNavLayout.tsx` - Updated menu items and selection logic

### New Navigation Structure:
```
Dashboard → /
Products → /products
  Product List → /products/list
  Features → /products/features
PI Calendar → /pi-calendar
Teams → /teams
  Team List → /teams/list
Reports → /reports
Settings → /settings (Overview page)
  Working Days → /settings/working-days
  Capacity Management → /settings/capacity
  Components → /settings/components
  Budget Management → /settings/budgets
  Train Teams → /settings/train-teams
  Site Management → /settings/sites
    Countries & Sites → /settings/sites/locations
    Holidays → /settings/sites/holidays
```

### Legacy Redirects (maintained for 6 months):
- `/features` → `/products/features`
- `/setup/*` → appropriate new routes
