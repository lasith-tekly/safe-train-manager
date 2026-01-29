# Integration Status and Guidelines

**Date:** 2026-01-28  
**Purpose:** Document current system state and guidelines to prevent breaking existing functionality

---

## 🎯 Current System Status

### ✅ Working Modules (DO NOT BREAK)

#### 1. Budget Configuration Module
**Status:** WORKING - Fully functional  
**Location:** `/budget-configuration`  
**API Endpoints:** `/api/budget/*`

**Functionality:**
- ✅ View product budgets by fiscal year
- ✅ Create budget versions
- ✅ Allocate budget to products
- ✅ Distribute budget across budget lines
- ✅ Track budget utilization
- ✅ Support multiple products (BRS, FM, Amadeus Ramp Operation)

**Current Data:**
- BRS 2026: 500 KEUR allocated
  - Product Evolution: 300 KEUR
  - Maintenance: 200 KEUR
- Other products: Can be added through existing UI

**Database Tables:**
- `fiscal_years` - Fiscal year definitions
- `budget_versions` - Budget versions per fiscal year
- `product_budgets` - Total budget per product per version
- `budget_lines` - Budget line definitions (Maintenance, Product Evolution, etc.)
- `budget_line_products` - Budget line allocations per product
- `budget_categories` - Sub-categories within budget lines

**IMPORTANT:** 
- Budget Configuration module works independently
- Users can add budgets for any product through the UI
- Do NOT modify budget tables without understanding impact
- Budget line allocations use `budget_line_products` table

---

#### 2. Roadmap Planning V2 Module
**Status:** WORKING - Fully functional with budget integration  
**Location:** `/roadmap`  
**API Endpoints:** `/api/roadmaps/*`

**Functionality:**
- ✅ Create multi-year roadmaps per product
- ✅ Add features with year-level budget allocations
- ✅ Year-based grid view (2026, 2027, etc.)
- ✅ Budget integration - shows allocated vs planned
- ✅ Budget alerts (over/under budget)
- ✅ Dynamic link to Budget Configuration
- ✅ Feature CRUD operations
- ✅ Delete draft roadmaps with confirmation

**Current Data:**
- BRS Roadmap 2026: 2 features, 150 KEUR planned
- Budget comparison working for 2026

**Database Tables:**
- `roadmaps` - Roadmap definitions per product
- `roadmap_features` - Features within roadmaps
- `feature_year_allocations` - Year-level budget/effort per feature

**Integration Points:**
- Queries `budget_line_products` to get allocated budget
- Compares planned (from features) vs allocated (from budget config)
- Uses latest active budget version per year

---

#### 3. Team Capacity Module
**Status:** WORKING - Fully functional  
**Location:** `/teams`  
**API Endpoints:** `/api/teams/*`

**Functionality:**
- ✅ Manage teams and members
- ✅ PI-level capacity planning
- ✅ Leave management
- ✅ Capacity calculations
- ✅ Team allocations to products

**IMPORTANT:** Do NOT modify - used by other modules

---

#### 4. Products Module
**Status:** WORKING - Fully functional  
**Location:** `/products`  
**API Endpoints:** `/api/products/*`

**Functionality:**
- ✅ Product definitions
- ✅ Product-team assignments
- ✅ Product status management

**Current Products:**
1. Baggage Reconciliation System (BRS)
2. Flight Management (FM)
3. Amadeus Ramp Operation

---

## 🔗 Integration Architecture

### Budget Configuration ↔ Roadmap Planning

**Data Flow:**
```
Budget Configuration (Source of Truth)
    ↓
budget_versions → product_budgets → budget_line_products
    ↓
Roadmap Planning (Consumer)
    ↓
Queries budget_line_products to get allocated budget
    ↓
Compares with planned budget from features
    ↓
Shows budget status and alerts
```

**Key Integration Points:**

1. **Budget Lines API** (`/api/roadmaps/budget-lines`)
   - Used by roadmap feature form to show available budget lines
   - Returns budget lines with allocations per year
   - Queries through `budget_line_products` table

2. **Budget Status Calculation** (`RoadmapServiceV2.calculate_year_budget_status`)
   - Queries `budget_line_products` to get allocated amounts
   - Sums planned amounts from `feature_year_allocations`
   - Calculates variance and utilization
   - Returns budget summary per year

3. **Dynamic Updates**
   - When budget is updated in Budget Configuration, roadmap automatically reflects changes
   - No hard-linking - always queries latest active budget version
   - Budget changes immediately visible in roadmap

---

## ⚠️ Critical Guidelines to Prevent Breaking Changes

### 1. Database Schema Changes

**BEFORE making ANY database changes:**
- ✅ Check which modules use the affected tables
- ✅ Test all related API endpoints
- ✅ Verify UI still works
- ✅ Document the change

**Tables Used by Multiple Modules:**
- `products` - Used by Budget Config, Roadmap, Teams, Dashboard
- `budget_lines` - Used by Budget Config, Roadmap
- `budget_line_products` - Used by Budget Config, Roadmap (CRITICAL)
- `fiscal_years` - Used by Budget Config, Roadmap
- `budget_versions` - Used by Budget Config, Roadmap

### 2. Service Layer Changes

**BEFORE modifying services:**
- ✅ Check all callers of the service method
- ✅ Ensure backward compatibility
- ✅ Add new methods instead of modifying existing ones
- ✅ Test all affected endpoints

**Critical Services:**
- `BudgetIntegrationService` - Used by Roadmap to query budget data
- `RoadmapServiceV2` - Core roadmap business logic
- `BudgetService` - Core budget configuration logic

### 3. API Endpoint Changes

**BEFORE modifying API endpoints:**
- ✅ Check frontend usage
- ✅ Ensure response schema compatibility
- ✅ Version breaking changes (e.g., `/api/v2/...`)
- ✅ Test with actual frontend

**Critical Endpoints:**
- `/api/budget/*` - Budget Configuration UI depends on these
- `/api/roadmaps/*` - Roadmap UI depends on these
- `/api/roadmaps/budget-lines` - Feature form depends on this

### 4. Frontend Changes

**BEFORE modifying frontend components:**
- ✅ Test in browser with real data
- ✅ Check console for errors
- ✅ Verify all user workflows
- ✅ Test with different data scenarios

**Critical Components:**
- Budget Configuration pages - DO NOT MODIFY without testing
- Roadmap List/Detail pages - Test after any changes
- Feature Form Modal - Critical for feature creation

---

## 📋 Testing Checklist

### After ANY Change, Test:

**Budget Configuration:**
- [ ] Can view product budgets
- [ ] Can select different products
- [ ] Can create new budget versions
- [ ] Can edit budget line allocations
- [ ] Budget totals calculate correctly

**Roadmap Planning:**
- [ ] Can view roadmap list
- [ ] Can open roadmap detail
- [ ] Can add features
- [ ] Budget status cards show correctly
- [ ] Budget alerts work
- [ ] Feature grid displays properly

**Integration:**
- [ ] Budget changes reflect in roadmap
- [ ] Budget line dropdown shows correct lines
- [ ] Budget comparison calculates correctly
- [ ] No console errors

---

## 🚀 Future Enhancements (V3 - PI Allocation)

**Status:** Requirements defined, NOT YET IMPLEMENTED

**Scope:**
- Add PI-level (quarterly) capacity allocation within years
- Link to team capacity per PI
- PI-level budget comparison
- Estimated effort: 19-27 hours

**Database Changes Required:**
- New table: `feature_pi_allocations`
- Links to `roadmap_features`
- Stores effort days per quarter (Q1-Q4) per year

**IMPORTANT:**
- This is a NEW feature, not a modification of existing
- Will ADD to current functionality, not replace
- Year-level planning remains unchanged
- PI allocation is optional enhancement

---

## 📊 Current Data State

### Budget Configuration
```
Fiscal Year: 2026
Budget Version: V1 (Active)

Product: BRS
Total Budget: 500 KEUR
Budget Lines:
  - Product Evolution: 300 KEUR
  - Maintenance: 200 KEUR
```

### Roadmap Planning
```
Product: BRS
Roadmap: BRS Roadmap_2026JAN
Features: 2 features
Total Planned 2026: 100 KEUR
Status: Under Planned (100/500 = 20%)
```

---

## 🔧 How to Add Budget for Other Products

**Using Existing Budget Configuration UI:**

1. Navigate to `/budget-configuration`
2. Select product from dropdown (e.g., "Flight Management")
3. Select fiscal year (e.g., 2026)
4. Click "Edit Budget Lines" or "+ New" to create budget version
5. Allocate budget across budget lines
6. Save

**The UI already supports this - no code changes needed!**

---

## 📝 Summary

**What's Working:**
- ✅ Budget Configuration - fully functional for all products
- ✅ Roadmap Planning - fully functional with budget integration
- ✅ Budget-Roadmap integration - dynamic and working

**What NOT to Break:**
- ⚠️ Budget Configuration module and its APIs
- ⚠️ Existing database schema without careful testing
- ⚠️ Integration points between modules

**Next Steps:**
- User can add budgets for FM and other products through existing UI
- Test budget integration with multiple products
- Implement PI allocation (V3) when ready - as NEW feature, not modification

---

## 🎯 Key Principle

**"If it's working, don't break it. Add to it, don't replace it."**

- Preserve existing functionality
- Add new features incrementally
- Test thoroughly before committing
- Document all changes
- Keep integration points stable
