# SAFe Train Manager - Project State Documentation

**Generated:** 2026-01-29  
**Version:** Current State (Developer Branch)

---

## 1. Project Structure

### Backend
```
backend/
├── app/
│   ├── main.py                    # FastAPI entry point
│   ├── database.py                # DB connection
│   ├── models/                    # SQLAlchemy models (13 files)
│   ├── routes/                    # API routes (18 files)
│   ├── routers/                   # New routers (3 files)
│   ├── schemas/                   # Pydantic schemas (17 files)
│   └── services/                  # Business logic (19 files)
├── alembic/                       # Migrations
├── safe_train.db                  # SQLite database
└── requirements.txt
```

### Frontend
```
frontend/
├── src/
│   ├── App.tsx                    # Main app with routing
│   ├── components/                # Reusable components
│   │   ├── Layout/
│   │   ├── SidePanel/
│   │   └── StatusBadge/
│   ├── pages/                     # Page components
│   │   ├── Dashboard/             # Budget, Team, Train dashboards
│   │   ├── Roadmap/               # Roadmap Planning V2/V3
│   │   ├── Settings/              # Budget Configuration, etc.
│   │   └── Setup/                 # Setup wizard
│   ├── services/                  # API integration
│   │   ├── budgetConfigService.ts
│   │   ├── budgetDashboardService.ts
│   │   └── roadmapApi.ts
│   └── types/index.ts
├── package.json
└── .env
```

---

## 2. Database Schema (33 Tables)

### Budget Module (9 tables)
- **fiscal_years** - Fiscal year definitions
- **budget_versions** - Budget versions per fiscal year
- **product_budgets** - Product budget allocations
- **budget_lines** - Budget lines (product-specific or transversal)
- **budget_categories** - Categories within budget lines
- **budget_line_products** - Transversal line to product associations
- **budget_audit_log** - Audit trail
- **capacity_allocation_categories** - Capacity allocation categories
- **global_settings** - System-wide settings

### Roadmap Module (4 tables)
- **roadmaps** - Roadmap definitions
- **roadmap_features** - Features in roadmaps
- **feature_year_allocations** - Year-based budget allocations
- **feature_pi_allocations** - Quarterly (PI) budget breakdown

### Capacity Module (11 tables)
- **teams** - Team definitions
- **team_members** - Team member details
- **team_capacities** - Team capacity per year
- **team_iteration_capacities** - Capacity per iteration
- **team_member_component_hats** - Component hat allocations
- **member_pi_allocations** - PI allocations per member
- **member_iteration_productivity** - Productivity tracking
- **member_leaves** - Leave tracking
- **member_quarterly_availability** - Quarterly availability
- **component_hats** - Component hat definitions
- **team_products** - Team to product associations

### PI Planning (3 tables)
- **pis** - Program Increments
- **iterations** - Iterations within PIs
- **pi_budget_plans** - PI budget planning

### Configuration (6 tables)
- **products** - Product definitions
- **sites** - Site locations
- **countries** - Country definitions
- **holidays** - Holiday definitions
- **site_holidays** - Site-specific holidays
- **jira_configs** - Jira integration configs

---

## 3. API Endpoints Summary

### Products (`/api/products`)
- GET, POST, PUT, DELETE - CRUD operations

### Budget Configuration (`/api/budget`)
- **Fiscal Years:** GET, POST, PUT, DELETE `/fiscal-years`
- **Versions:** GET, POST, PUT, DELETE `/versions`
- **Product Budgets:** GET, POST, PUT, DELETE `/product-budgets`
- **Budget Lines:** GET, POST, PUT, DELETE `/budget-lines`
- **Categories:** GET, POST, PUT, DELETE `/budget-categories`
- **Audit Log:** GET `/audit-log`

### Budget Dashboard (`/api/budget/dashboard`)
- GET `/products` - Products overview
- GET `/product/{id}` - Product detail
- GET `/line/{id}` - Budget line detail
- GET `/line/{id}/chart-data` - PI chart data

### Roadmap Planning V2 (`/api/roadmaps`)
- GET, POST, PUT, DELETE - Roadmap CRUD
- POST `/roadmaps/{id}/features` - Create feature
- PUT `/roadmaps/{id}/features/{fid}` - Update feature
- DELETE `/roadmaps/{id}/features/{fid}` - Delete feature
- POST `/calculate-budget` - Budget calculations
- POST `/calculate-effort` - Effort calculations

### Teams (`/api/teams`)
- GET, POST, PUT, DELETE - Team CRUD
- Team members, capacity, PI allocations

### PIs (`/api/pis`)
- GET, POST, PUT, DELETE - PI CRUD
- Iterations management

### Capacity (`/api/capacity`)
- Team capacity calculations
- Member productivity tracking

---

## 4. Frontend Components

### Layout Components
- **SideNavLayout** - Main layout with sidebar navigation
- **SidePanel** - Slide-out panel for forms
- **StatusBadge** - Status indicator badges

### Dashboard Pages
- **BudgetDashboard** - Budget analytics with charts
  - BudgetLineChart - Line chart for PI tracking
  - PIBreakdownTable - PI breakdown table
- **TeamCapacity** - Team capacity dashboard
- **TrainCapacity** - Train-level capacity view

### Roadmap Planning
- **RoadmapList** - List of roadmaps
- **RoadmapDetail** - Roadmap detail with features
- **FeatureFormModal** - Create/edit feature modal
- **PIAllocationInputs** - Quarterly budget breakdown with validation

### Budget Configuration
- **BudgetConfigurationLayout** - Main budget config page
- **BudgetTree** - Hierarchical budget tree view
- **BudgetDetailsPanel** - Budget line/category details
- **FiscalYearSelector** - Fiscal year selector
- **VersionSelector** - Budget version selector
- **StatCard** - Summary statistics card
- Forms: ProductBudgetForm, BudgetLineForm, BudgetCategoryForm
- Modals: CreateFiscalYearModal, CreateVersionModal, etc.

### Setup Wizard
- **ProductsTab** - Product management
- **TeamsTab** - Team setup and management
- **PICalendarTab** - PI calendar setup
- **BudgetsTab** - Budget version setup

---

## 5. Settings & Configuration

### Global Settings (stored in `global_settings` table)

**Current Settings:**
1. **cost_per_day_keur**
   - Value: `0.6`
   - Description: Cost per person-day in KEUR
   - Used for: Budget ↔ Effort conversions

2. **working_days_per_iteration**
   - Value: `10`
   - Description: Working days per iteration
   - Used for: Capacity calculations

3. **iterations_per_pi**
   - Value: `5`
   - Description: Number of iterations per PI
   - Used for: PI planning

### Capacity Allocation Categories

Default categories with percentages:
- **Feature Development** - 60%
- **Enablers** - 20%
- **Bug Fixes** - 10%
- **Technical Debt** - 10%

---

## 6. Existing Features Status

### ✅ Budget Configuration (Complete)
**Screens:**
- Fiscal year management
- Budget version management
- Product budget allocation
- Budget line configuration
- Budget category management
- Transversal budget allocation
- Audit log viewer

**API Integration:**
- Full CRUD operations
- Version activation/deactivation
- Audit trail tracking
- Tree view with real-time updates

### ✅ Budget Dashboard (Complete)
**Screens:**
- Products overview with summaries
- Product detail with budget lines
- Budget line detail with categories
- PI-level chart (target vs actual)

**API Integration:**
- Real-time budget calculations
- PI breakdown tracking
- Chart data generation

### ✅ Roadmap Planning V2 (Complete)
**Screens:**
- Roadmap list
- Roadmap detail with features
- Feature creation/editing
- Multi-year budget allocation

**API Integration:**
- Dynamic budget line selection
- Budget ↔ Effort conversions
- Budget validation against active version

### ✅ Roadmap Planning V3 - PI Allocations (Complete)
**Screens:**
- PI allocation inputs (quarterly breakdown)
- Real-time validation (sum = year total)
- Visual feedback for validation

**API Integration:**
- PI allocation CRUD
- Quarterly budget tracking

### ✅ Capacity Planning (Complete)
**Screens:**
- Team capacity dashboard
- Member PI allocations
- Member leave management
- Iteration capacity tracking

**API Integration:**
- Capacity calculations
- Productivity tracking
- Leave impact calculations

### ✅ PI Calendar (Complete)
**Screens:**
- PI management
- Iteration management
- Calendar view

**API Integration:**
- PI CRUD operations
- Iteration CRUD operations

---

## 7. TypeScript Interfaces

### Budget Interfaces
```typescript
interface FiscalYear {
  id: string;
  year: number;
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
  is_current: boolean;
}

interface BudgetVersion {
  id: string;
  fiscal_year_id: string;
  version_number: number;
  name: string;
  is_active: boolean;
}

interface BudgetLine {
  id: string;
  code: string;
  name: string;
  allocated_amount: number;
  is_transversal: boolean;
}
```

### Roadmap Interfaces
```typescript
interface PIAllocation {
  quarter: number;
  budget_keur: number;
}

interface YearAllocation {
  year: number;
  budget_keur: number;
  pi_allocations?: PIAllocation[];
}

interface RoadmapFeature {
  id: string;
  roadmap_id: string;
  budget_line_id: string;
  name: string;
  priority: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  year_allocations: YearAllocation[];
}
```

### Team Interfaces
```typescript
interface Team {
  id: string;
  name: string;
  description?: string;
  site_id?: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  name: string;
  email: string;
  role: string;
  fte: number;
}
```

---

## 8. Services & API Integration

### API Service Structure

**Base Configuration:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
```

### Service Files

**budgetConfigService.ts**
- Fiscal year operations
- Budget version operations
- Product budget operations
- Budget line operations
- Category operations
- Audit log retrieval

**budgetDashboardService.ts**
- Products overview
- Product detail
- Budget line detail
- Chart data retrieval

**roadmapApi.ts**
- Roadmap CRUD
- Feature CRUD
- Budget calculations
- Effort calculations

**api.ts (Base Service)**
- Axios instance configuration
- Common API utilities
- Error handling

### Authentication
- **Current:** No authentication
- **User Tracking:** User ID passed in requests as `created_by`
- **Future:** JWT-based authentication planned

### Error Handling
- Axios interceptors for global error handling
- Toast notifications for user feedback
- Validation errors displayed inline

---

## 9. Technology Stack

### Backend
- **Framework:** FastAPI 0.109.0
- **ORM:** SQLAlchemy 2.0
- **Database:** SQLite
- **Migrations:** Alembic
- **Validation:** Pydantic 2.5.3
- **Server:** Uvicorn
- **Python:** 3.9+

### Frontend
- **Framework:** React 18
- **Language:** TypeScript
- **UI Library:** Ant Design 5.x
- **Charts:** Recharts
- **HTTP Client:** Axios
- **Build Tool:** Vite
- **Routing:** React Router DOM

### Development Tools
- **Backend Testing:** Pytest
- **Code Quality:** ESLint, Prettier
- **Version Control:** Git
- **Repository:** GitHub (lasith-tekly/safe-train-manager)

---

## 10. Key Features Summary

### Completed Modules
1. ✅ **Budget Configuration** - Full fiscal year and budget management
2. ✅ **Budget Dashboard** - Analytics and PI tracking
3. ✅ **Roadmap Planning V2** - Multi-year roadmap planning
4. ✅ **Roadmap Planning V3** - Quarterly (PI) budget breakdown
5. ✅ **Capacity Planning** - Team capacity and allocation management
6. ✅ **PI Calendar** - PI and iteration management
7. ✅ **Product Management** - Product CRUD operations
8. ✅ **Team Management** - Team and member management

### Database Statistics
- **Total Tables:** 33
- **Total Records:** ~500+ (varies by environment)
- **Database Size:** ~1-2 MB

### API Statistics
- **Total Endpoints:** 50+
- **API Modules:** 8 major modules
- **Response Format:** JSON
- **Status Codes:** Standard HTTP codes

---

## 11. Current State Summary

**Repository Status:**
- ✅ Clean and organized
- ✅ All features functional
- ✅ No Pydantic warnings
- ✅ Documentation complete
- ✅ Latest commit: Pydantic v2 fixes

**Known Issues:**
- ⚠️ React warnings from Ant Design (external library)
- ⚠️ No authentication implemented yet

**Next Steps:**
- Roadmap Planning design improvements (pending user requirements)
- Optional: PIGridView component
- Optional: Authentication implementation

---

**End of Project State Documentation**
