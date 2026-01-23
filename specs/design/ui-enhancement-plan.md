# Amadeus Elevate - UI Enhancement Plan

**Document Version:** 1.0  
**Created:** 2026-01-16  
**Author:** UI Designer Agent  
**Status:** Draft  
**Stakeholders:** @product-manager, @frontend-architect, @backend-architect

---

## 1. Executive Summary

This document outlines the comprehensive UI enhancement plan for rebranding the application to **"Amadeus Elevate"** and implementing the Amadeus Design Factory v2 (7.1.3) design system. Key changes include transitioning from a top navigation to a side navigation layout, reorganizing the information architecture, and adding country-level organization for teams and holidays.

---

## 2. Design System Integration

### 2.1 Amadeus Design Factory v2

**Source:** `Docs/design-factory-v2-7.1.3/`

#### Color Palette (Primary)
| Color | Hex | Usage |
|-------|-----|-------|
| **Primary Blue** | `#005eb8` | Primary actions, links, active states |
| **Dark Primary** | `#004485` | Headers, emphasis |
| **Cyan** | `#009dd1` | Secondary actions, highlights |
| **Teal** | `#1a7ead` | Info states |
| **Light Blue** | `#9bcaeb` | Backgrounds, disabled states |

#### Color Palette (Status)
| Color | Hex | Usage |
|-------|-----|-------|
| **Green** | `#008540` | Success, completed |
| **Orange** | `#f7a827` | Warning, attention |
| **Red** | `#ec0e0e` | Error, danger |
| **Purple** | `#6f2b8d` | Special states |

#### Typography
| Font | Weight | Usage |
|------|--------|-------|
| **Amadeus** | Bold (700) | Headings, brand name |
| **Source Sans Pro** | Regular (400) | Body text |
| **Source Sans Pro** | Semibold (500) | Labels, emphasis |
| **Source Sans Pro** | Bold (700) | Strong emphasis |

#### Spacing Scale
- **xs:** 4px
- **sm:** 8px
- **md:** 16px
- **lg:** 24px
- **xl:** 32px
- **xxl:** 48px

---

## 3. Application Rebranding

### 3.1 Name Change
- **Old:** SAFe Train Manager
- **New:** **Amadeus Elevate**

### 3.2 Logo & Branding
```
┌─────────────────────────────────────┐
│  ▲                                  │
│ ╱ ╲   AMADEUS                       │
│╱   ╲  E L E V A T E                 │
└─────────────────────────────────────┘
```

### 3.3 Favicon & App Icons
- Create Amadeus-branded favicon
- Use Amadeus blue (#005eb8) as primary color
- Include "E" monogram for compact views

---

## 4. Layout Transformation

### 4.1 Current Layout (Top Navigation)
```
┌─────────────────────────────────────────────────────────────┐
│  Logo    │ Home │ Features │ Planning │ Reports │ Setup    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      CONTENT AREA                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 New Layout (Side Navigation)
```
┌──────────────────────────────────────────────────────────────────┐
│  AMADEUS ELEVATE                              🔔  👤 User ▼     │
├────────────┬─────────────────────────────────────────────────────┤
│            │                                                     │
│  🏠 Home   │                                                     │
│            │                                                     │
│  📊 Dash   │              CONTENT AREA                           │
│            │                                                     │
│  📋 Feat   │                                                     │
│            │                                                     │
│  📅 Plan   │                                                     │
│            │                                                     │
│  📈 Report │                                                     │
│            │                                                     │
│  ⚙️ Setup  │                                                     │
│    ├─ 🏢   │                                                     │
│    ├─ 👥   │                                                     │
│    ├─ 📅   │                                                     │
│    └─ 💰   │                                                     │
│            │                                                     │
├────────────┴─────────────────────────────────────────────────────┤
│  © 2026 Amadeus                                    v1.0.0        │
└──────────────────────────────────────────────────────────────────┘
```

### 4.3 Side Navigation Specifications

| Property | Value |
|----------|-------|
| **Width (Expanded)** | 240px |
| **Width (Collapsed)** | 64px |
| **Background** | `#004485` (Dark Primary) |
| **Text Color** | `#ffffff` |
| **Active Item BG** | `#005eb8` (Primary) |
| **Hover BG** | `rgba(255,255,255,0.1)` |
| **Icon Size** | 20px |
| **Item Height** | 48px |
| **Collapse Trigger** | Bottom of sidebar |

---

## 5. Information Architecture Redesign

### 5.1 New Navigation Structure

```
📊 Dashboard
    └─ Overview (default)

📋 Features
    ├─ Feature Board
    ├─ JIRA Import
    └─ Allocation

📅 Planning
    ├─ PI Calendar
    ├─ Capacity View
    └─ Roadmap

📈 Reports
    ├─ Capacity Reports
    ├─ Feature Reports
    └─ Team Reports

⚙️ Setup
    ├─ 🏢 Organization
    │   ├─ Countries/Sites
    │   └─ Products
    │
    ├─ 👥 Teams
    │   ├─ Team List
    │   ├─ Members
    │   └─ 📅 Holidays (moved here)
    │
    ├─ 📅 PI Calendar
    │   ├─ PI Configuration
    │   └─ Global Settings
    │
    └─ 💰 Budgets
        └─ Budget Management
```

### 5.2 Key Changes

| Change | Rationale |
|--------|-----------|
| **Holidays → Teams submenu** | Holidays are team-specific, logical grouping |
| **New: Organization section** | Countries/Sites for team organization |
| **Products under Organization** | Products are organizational entities |
| **PI Calendar separate** | Important enough for own section |

---

## 6. New Feature: Country/Site Management

### 6.1 Data Model (Backend)

```python
# New Model: Country
class Country(Base):
    __tablename__ = "countries"
    
    id = Column(String(36), primary_key=True)
    code = Column(String(3), unique=True)  # ISO 3166-1 alpha-3
    name = Column(String(100), nullable=False)
    timezone = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    sites = relationship("Site", back_populates="country")
    holidays = relationship("Holiday", back_populates="country")

# New Model: Site
class Site(Base):
    __tablename__ = "sites"
    
    id = Column(String(36), primary_key=True)
    code = Column(String(10), unique=True)
    name = Column(String(100), nullable=False)
    country_id = Column(String(36), ForeignKey("countries.id"))
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    country = relationship("Country", back_populates="sites")
    teams = relationship("Team", back_populates="site")

# Update Team Model
class Team(Base):
    # ... existing fields ...
    site_id = Column(String(36), ForeignKey("sites.id"), nullable=True)
    site = relationship("Site", back_populates="teams")

# Update Holiday Model
class Holiday(Base):
    # ... existing fields ...
    country_id = Column(String(36), ForeignKey("countries.id"), nullable=True)
    country = relationship("Country", back_populates="holidays")
```

### 6.2 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/countries` | List all countries |
| POST | `/api/countries` | Create country |
| PUT | `/api/countries/{id}` | Update country |
| DELETE | `/api/countries/{id}` | Delete country |
| GET | `/api/countries/{id}/sites` | List sites in country |
| POST | `/api/sites` | Create site |
| PUT | `/api/sites/{id}` | Update site |
| DELETE | `/api/sites/{id}` | Delete site |
| GET | `/api/countries/{id}/holidays` | Get country holidays |

### 6.3 UI: Country/Site Management

```
┌─────────────────────────────────────────────────────────────────┐
│  Organization > Countries & Sites                    [+ Add]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🇫🇷 France (FRA)                                    [Edit]     │
│  ├─ 📍 Nice (NCE) - 3 teams                                     │
│  ├─ 📍 Sophia Antipolis (SOP) - 5 teams                         │
│  └─ 📍 Paris (PAR) - 2 teams                                    │
│                                                                 │
│  🇩🇪 Germany (DEU)                                   [Edit]     │
│  ├─ 📍 Munich (MUC) - 4 teams                                   │
│  └─ 📍 Berlin (BER) - 1 team                                    │
│                                                                 │
│  🇮🇳 India (IND)                                     [Edit]     │
│  └─ 📍 Bangalore (BLR) - 6 teams                                │
│                                                                 │
│  🇺🇸 United States (USA)                             [Edit]     │
│  └─ 📍 Miami (MIA) - 2 teams                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Teams Reorganization

### 7.1 Teams List with Site Grouping

```
┌─────────────────────────────────────────────────────────────────┐
│  Teams                                               [+ Add]    │
├─────────────────────────────────────────────────────────────────┤
│  Filter: [All Sites ▼]  [All Status ▼]         🔍 Search...    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📍 SOPHIA ANTIPOLIS (SOP)                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Team Alpha (ALPHA)     │ 8 members │ Active  │ [Edit]   │   │
│  │ Team Beta (BETA)       │ 6 members │ Active  │ [Edit]   │   │
│  │ Team Gamma (GAMMA)     │ 5 members │ Active  │ [Edit]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📍 BANGALORE (BLR)                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Team Delta (DELTA)     │ 7 members │ Active  │ [Edit]   │   │
│  │ Team Epsilon (EPS)     │ 4 members │ Active  │ [Edit]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Holidays Under Teams

```
┌─────────────────────────────────────────────────────────────────┐
│  Teams > Holidays                                               │
├─────────────────────────────────────────────────────────────────┤
│  Year: [2026 ▼]    Country: [All ▼]              [+ Add]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🇫🇷 FRANCE                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Jan 1   │ New Year's Day        │ Full Day │ [Edit] [X] │   │
│  │ May 1   │ Labour Day            │ Full Day │ [Edit] [X] │   │
│  │ Jul 14  │ Bastille Day          │ Full Day │ [Edit] [X] │   │
│  │ Dec 25  │ Christmas Day         │ Full Day │ [Edit] [X] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🇮🇳 INDIA                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Jan 26  │ Republic Day          │ Full Day │ [Edit] [X] │   │
│  │ Aug 15  │ Independence Day      │ Full Day │ [Edit] [X] │   │
│  │ Oct 2   │ Gandhi Jayanti        │ Full Day │ [Edit] [X] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Component Specifications

### 8.1 Side Navigation Component

```tsx
// SideNav.tsx
interface SideNavProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard', path: '/' },
  { key: 'features', icon: <AppstoreOutlined />, label: 'Features', path: '/features' },
  { key: 'planning', icon: <CalendarOutlined />, label: 'Planning', children: [
    { key: 'pi-calendar', label: 'PI Calendar', path: '/planning/pi-calendar' },
    { key: 'capacity', label: 'Capacity View', path: '/planning/capacity' },
  ]},
  { key: 'reports', icon: <BarChartOutlined />, label: 'Reports', path: '/reports' },
  { key: 'setup', icon: <SettingOutlined />, label: 'Setup', children: [
    { key: 'organization', label: 'Organization', children: [
      { key: 'countries', label: 'Countries & Sites', path: '/setup/organization' },
      { key: 'products', label: 'Products', path: '/setup/products' },
    ]},
    { key: 'teams', label: 'Teams', children: [
      { key: 'team-list', label: 'Team List', path: '/setup/teams' },
      { key: 'holidays', label: 'Holidays', path: '/setup/teams/holidays' },
    ]},
    { key: 'pi-config', label: 'PI Calendar', path: '/setup/pi-calendar' },
    { key: 'budgets', label: 'Budgets', path: '/setup/budgets' },
  ]},
];
```

### 8.2 Header Component

```tsx
// Header.tsx - Slim top header
interface HeaderProps {
  userName: string;
  onLogout: () => void;
}

// Layout:
// [Logo] ─────────────────────────────── [Notifications] [User Menu]
```

### 8.3 Design Tokens (CSS Variables)

```css
:root {
  /* Amadeus Brand Colors */
  --amadeus-primary: #005eb8;
  --amadeus-primary-dark: #004485;
  --amadeus-cyan: #009dd1;
  --amadeus-teal: #1a7ead;
  --amadeus-light-blue: #9bcaeb;
  
  /* Status Colors */
  --status-success: #008540;
  --status-warning: #f7a827;
  --status-danger: #ec0e0e;
  --status-info: #1a7ead;
  
  /* Grayscale */
  --gray-50: #f2f2f2;
  --gray-100: #e6e6e6;
  --gray-200: #cccccc;
  --gray-300: #b3b3b3;
  --gray-400: #999999;
  --gray-500: #808080;
  --gray-600: #666666;
  --gray-700: #4d4d4d;
  --gray-800: #333333;
  --gray-900: #1a1a1a;
  
  /* Layout */
  --sidebar-width: 240px;
  --sidebar-collapsed-width: 64px;
  --header-height: 50px;
  --content-padding: 24px;
  
  /* Typography */
  --font-family-brand: 'Amadeus', sans-serif;
  --font-family-body: 'Source Sans Pro', sans-serif;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.1);
  --shadow-md: 0 2px 4px rgba(0,0,0,0.2);
  --shadow-lg: 0 4px 8px rgba(0,0,0,0.2);
  
  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s ease;
}
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Copy Design Factory fonts to frontend assets
- [ ] Create CSS variables/tokens file
- [ ] Update Ant Design theme configuration
- [ ] Create new Layout component with side navigation
- [ ] Update App.tsx routing structure
- [ ] Rebrand to "Amadeus Elevate"

### Phase 2: Backend - Organization (Week 1-2)
- [ ] Create Country model and migrations
- [ ] Create Site model and migrations
- [ ] Update Team model with site_id
- [ ] Update Holiday model with country_id
- [ ] Create Country/Site API endpoints
- [ ] Update existing APIs for new relationships

### Phase 3: Frontend - Navigation (Week 2)
- [ ] Implement SideNav component
- [ ] Implement collapsible behavior
- [ ] Add nested menu support
- [ ] Update header component
- [ ] Add breadcrumb navigation
- [ ] Responsive mobile menu

### Phase 4: Frontend - Organization Pages (Week 2-3)
- [ ] Create Countries & Sites page
- [ ] Update Teams page with site grouping
- [ ] Move Holidays under Teams section
- [ ] Update Holiday page with country filter
- [ ] Add country-based holiday presets

### Phase 5: Polish & Testing (Week 3)
- [ ] Apply Design Factory styling throughout
- [ ] Accessibility audit
- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] Documentation update

---

## 10. Migration Notes

### 10.1 Database Migration
```sql
-- Add country and site tables
CREATE TABLE countries (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sites (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    country_id VARCHAR(36) REFERENCES countries(id),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update teams table
ALTER TABLE teams ADD COLUMN site_id VARCHAR(36) REFERENCES sites(id);

-- Update holidays table
ALTER TABLE holidays ADD COLUMN country_id VARCHAR(36) REFERENCES countries(id);
```

### 10.2 Data Migration
1. Create default countries based on existing team locations
2. Create default sites
3. Assign teams to sites
4. Migrate global holidays to country-specific

---

## 11. Acceptance Criteria

### AC-1: Side Navigation
- [ ] Navigation is on the left side
- [ ] Can be collapsed to icon-only mode
- [ ] Nested menus expand/collapse
- [ ] Active item is highlighted
- [ ] Responsive on mobile (drawer)

### AC-2: Branding
- [ ] App name shows "Amadeus Elevate"
- [ ] Uses Amadeus color palette
- [ ] Uses Amadeus/Source Sans Pro fonts
- [ ] Favicon updated

### AC-3: Organization Structure
- [ ] Can create/edit/delete countries
- [ ] Can create/edit/delete sites under countries
- [ ] Teams can be assigned to sites
- [ ] Teams list can be filtered by site

### AC-4: Holidays
- [ ] Holidays accessible under Teams menu
- [ ] Holidays can be assigned to countries
- [ ] Country filter on holidays page
- [ ] Holiday presets by country

---

## 12. Appendix

### A. Design Factory Assets Location
```
Docs/design-factory-v2-7.1.3/package/
├── assets/fonts/           # Amadeus & Source Sans Pro fonts
├── design-factory.css      # Pre-compiled CSS
└── styles/scss/            # SCSS source files
```

### B. Font Files to Copy
```
amadeus-bold/
amadeus-regular/
amadeus-thin/
source-sans-pro-bold/
source-sans-pro-regular/
source-sans-pro-semibold/
source-sans-pro-light/
```

---

## 13. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-16 | UI Designer | Initial plan |

---

**Next Steps:**
1. @product-manager: Review and approve navigation structure
2. @backend-architect: Review data model for Country/Site
3. @frontend-architect: Plan component structure for new layout
