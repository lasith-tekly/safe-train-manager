# Navigation Restructure Requirements

## Document Info
- **Version**: 1.0
- **Status**: Draft - Pending Product Manager Review
- **Created**: 2026-01-19
- **Author**: UI Designer Agent

---

## 1. Executive Summary

This document proposes a restructure of the application's side navigation to improve organization, clarity, and user workflow alignment. The changes separate train-level configuration (managed by Amigos) from team-level operations (managed by individual teams).

---

## 2. Current Navigation Structure (Problems)

```
|- Dashboard
|- Products
|- Features
|- Reports
|- Setup
   |- PI Calendar
   |- Organization
   |- Teams
      |- Team List
      |- Holidays
   |- Budgets
   |- Settings (contains: Work Schedule, Capacity, Components, Budget Config, Train Teams)
```

### Issues Identified:
1. **Settings buried under Setup** - Important configuration is nested too deep
2. **Mixed responsibilities** - Train-level config mixed with team operations
3. **Features disconnected from Products** - Features are product-specific but shown separately
4. **Holidays misplaced** - Should be under Site Management (country-specific)
5. **PI Calendar hidden** - Primary planning tool buried in Setup
6. **Unclear naming** - "Organization" vs "Site Management", "Settings" is vague

---

## 3. Proposed Navigation Structure

```
|- Dashboard
|- Products
   |- Product List
   |- Features
|- PI Calendar
|- Teams
   |- Team List
|- Reports
|- Settings
   |- Working Days
   |- Capacity Management
   |- Components
   |- Train Configuration
   |- Train Teams
   |- Site Management
      |- Countries & Sites
      |- Holidays
```

---

## 4. Detailed Changes

### 4.1 Products Section
| Change | From | To |
|--------|------|-----|
| Features location | Top-level `/features` | Under Products `/products/features` |
| Products page | `/products` | `/products/list` |

**Rationale**: Features are always associated with a product. Grouping them improves context and workflow.

### 4.2 PI Calendar
| Change | From | To |
|--------|------|-----|
| Location | `/setup/pi-calendar` | `/pi-calendar` (top-level) |

**Rationale**: PI Calendar is a primary planning tool used frequently by RTEs. Promoting it reduces clicks.

### 4.3 Teams Section
| Change | From | To |
|--------|------|-----|
| Location | `/setup/teams` | `/teams` (top-level) |
| Holidays | Under Teams | Moved to Site Management |

**Rationale**: Teams manage their own capacity. This is a frequent operation that deserves top-level access.

### 4.4 Settings Section (Train-Level Configuration)
This section consolidates all train-level configuration managed by Amigos (Train PM + RTE).

| Sub-section | Description | Current Location |
|-------------|-------------|------------------|
| **Working Days** | Configure working days per week | Setup > Settings > Work Schedule |
| **Capacity Management** | Productivity %, allocation categories | Setup > Settings > Capacity |
| **Components** | Component hats configuration | Setup > Settings > Component Hats |
| **Train Configuration** | Budget ratios, cost settings | Setup > Settings > Budget & Cost |
| **Train Teams** | Team setup at train level | Setup > Settings > Train Teams |
| **Site Management** | Countries, sites, and holidays | Setup > Organization + Teams > Holidays |

### 4.5 Site Management Sub-section
| Sub-section | Description |
|-------------|-------------|
| **Countries & Sites** | Manage countries and office locations |
| **Holidays** | Country-specific holidays that apply to sites |

**Rationale**: Holidays are country-specific and should be managed alongside site/location data.

---

## 5. User Roles & Access Patterns

| Role | Primary Sections | Frequency |
|------|------------------|-----------|
| **Amigos (Train PM + RTE)** | Settings (all), PI Calendar | Weekly/Monthly |
| **Team Members** | Teams, Products/Features | Daily |
| **Product Owners** | Products, Features, Reports | Daily |

---

## 6. Route Mapping

### Old Routes → New Routes

| Old Route | New Route | Component |
|-----------|-----------|-----------|
| `/products` | `/products/list` | ProductsPage |
| `/features` | `/products/features` | FeaturesPage |
| `/setup/pi-calendar` | `/pi-calendar` | PICalendarTab |
| `/setup/teams/list` | `/teams/list` | TeamsTab |
| `/setup/teams/holidays` | `/settings/sites/holidays` | HolidaysTab |
| `/setup/organization` | `/settings/sites/locations` | OrganizationTab |
| `/setup/budgets` | `/settings/train-config` | BudgetsTab (merged) |
| `/setup/settings` | `/settings/*` | Split into sub-pages |

---

## 7. Implementation Checklist

### Phase 1: Route Setup
- [ ] Update React Router configuration with new routes
- [ ] Add route redirects for backward compatibility
- [ ] Update SideNavLayout menu items

### Phase 2: Component Reorganization
- [ ] Move/rename page components to match new structure
- [ ] Split SettingsTab into individual sub-pages
- [ ] Update breadcrumbs and page titles

### Phase 3: Settings Sub-pages
- [ ] Create WorkingDaysPage
- [ ] Create CapacityManagementPage
- [ ] Create ComponentsPage
- [ ] Create TrainConfigurationPage
- [ ] Create TrainTeamsPage
- [ ] Create SiteManagement section with Locations and Holidays

### Phase 4: Testing & Cleanup
- [ ] Test all navigation paths
- [ ] Verify no broken links
- [ ] Update any hardcoded route references
- [ ] Remove deprecated routes after transition period

---

## 8. Questions for Product Manager

1. **Redirect handling**: Should old URLs redirect to new locations, or show a "page moved" message?
2. **Budgets page**: Should it remain separate or merge into Train Configuration?
3. **Default landing pages**: 
   - `/products` → should it go to Product List or show a dashboard?
   - `/settings` → should it go to Working Days or show an overview?
4. **Access control**: Should Settings section have role-based visibility?

---

## 9. PM Decisions on Open Questions

### Q1: Redirect handling
**Decision**: Implement silent redirects (HTTP 301) from old URLs to new locations. Maintain redirects for 6 months for backward compatibility.

### Q2: Budgets page
**Decision**: Keep Budgets **separate** from Train Configuration. Rename to "Budget Management" under Settings. Budgets has distinct workflows (version management, line items) that warrant its own section.

### Q3: Default landing pages
- `/products` → Navigate directly to **Product List**
- `/settings` → Show **Settings Overview page** with quick links to all sub-sections

### Q4: Access control
**Decision**: Not for MVP. All users can access Settings. Role-based visibility will be added in a future release.

---

## 10. Approved Final Structure

```
|- Dashboard
|- Products
   |- Product List
   |- Features
|- PI Calendar
|- Teams
   |- Team List
|- Reports
|- Settings
   |- Working Days
   |- Capacity Management
   |- Components
   |- Budget Management
   |- Train Teams
   |- Site Management
      |- Countries & Sites
      |- Holidays
```

---

## 11. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Product Manager | PM Agent | ✅ Approved | 2026-01-19 |
| UI Designer | Cascade | Draft Complete | 2026-01-19 |
| Frontend Architect | | Pending | |
| Frontend Developer | | Pending | |

---

## Appendix: Visual Mockup

```
┌─────────────────────────────────────────────────────────────┐
│  AMADEUS ELEVATE                                            │
├─────────────────┬───────────────────────────────────────────┤
│                 │                                           │
│  📊 Dashboard   │                                           │
│                 │                                           │
│  📦 Products  ▼ │                                           │
│     Product List│                                           │
│     Features    │                                           │
│                 │                                           │
│  📅 PI Calendar │                                           │
│                 │                                           │
│  👥 Teams     ▼ │                                           │
│     Team List   │                                           │
│                 │                                           │
│  📈 Reports     │                                           │
│                 │                                           │
│  ⚙️ Settings  ▼ │                                           │
│     Working Days│                                           │
│     Capacity    │                                           │
│     Components  │                                           │
│     Train Config│                                           │
│     Train Teams │                                           │
│     Sites     ▼ │                                           │
│       Locations │                                           │
│       Holidays  │                                           │
│                 │                                           │
└─────────────────┴───────────────────────────────────────────┘
```
