# Data Architecture: Single Source of Truth

**Date:** 2026-01-28  
**Purpose:** Define single source of truth for all entities and ensure consistency across modules

---

## 🎯 Core Principle

**"One entity, one source, many views"**

Each entity should have:
1. **Single database table** as the source of truth
2. **One primary module** for CRUD operations
3. **Multiple modules** can READ and display the data
4. **Automatic propagation** of changes across all modules

---

## 📊 Entity Ownership Map

### **1. Products**

**Source of Truth:** `products` table  
**Owner Module:** Products (Setup → Product List)  
**CRUD Location:** `/products`

**Used By:**
- Budget Configuration (read-only dropdown)
- Roadmap Planning (read-only dropdown)
- Team Configuration (product-team assignments)
- Dashboard (product metrics)

**Rules:**
- ✅ Create/Edit/Delete ONLY in Products module
- ✅ Other modules query products table (read-only)
- ✅ Deletion should check for dependencies:
  - Has budget configured? → Warn or prevent
  - Has roadmap? → Warn or prevent
  - Has team assignments? → Warn or prevent

---

### **2. Budget Configuration**

**Source of Truth:** `product_budgets`, `budget_lines`, `budget_categories` tables  
**Owner Module:** Budget Configuration (Settings → Budget Configuration)  
**CRUD Location:** `/settings/budget-configuration`

**Used By:**
- Roadmap Planning (reads budget allocations for comparison)
- Dashboard (budget utilization metrics)

**Rules:**
- ✅ Create/Edit/Delete budget ONLY in Budget Configuration
- ✅ Roadmap reads budget data dynamically (no caching)
- ✅ Changes in budget immediately reflect in roadmap
- ✅ Bottom-up calculation: Product total = Sum of budget lines

---

### **3. Roadmaps & Features**

**Source of Truth:** `roadmaps`, `roadmap_features`, `feature_year_allocations` tables  
**Owner Module:** Roadmap Planning  
**CRUD Location:** `/roadmap`

**Used By:**
- Budget Configuration (reads planned amounts for utilization)
- Dashboard (feature delivery metrics)

**Rules:**
- ✅ Create/Edit/Delete roadmaps ONLY in Roadmap Planning
- ✅ Budget Configuration reads planned amounts (read-only)
- ✅ Features must reference valid budget lines
- ✅ Deletion of budget line should warn if features use it

---

### **4. Teams & Members**

**Source of Truth:** `teams`, `team_members` tables  
**Owner Module:** Teams (Setup → Teams)  
**CRUD Location:** `/teams`

**Used By:**
- Capacity Planning (team capacity calculations)
- Roadmap Planning (capacity comparison)
- Dashboard (team metrics)

**Rules:**
- ✅ Create/Edit/Delete teams ONLY in Teams module
- ✅ Other modules query teams table (read-only)
- ✅ Team capacity calculated from team members

---

### **5. Fiscal Years & Budget Versions**

**Source of Truth:** `fiscal_years`, `budget_versions` tables  
**Owner Module:** Budget Configuration  
**CRUD Location:** `/settings/budget-configuration`

**Used By:**
- Budget Configuration (version management)
- Roadmap Planning (budget comparison per year)

**Rules:**
- ✅ Create/Edit fiscal years and versions ONLY in Budget Configuration
- ✅ Roadmap always uses LATEST ACTIVE version
- ✅ No hard-linking to versions

---

## 🔗 Referential Integrity Rules

### **Product Deletion**

**Before deleting a product, check:**
1. Has budget configured? → `product_budgets.product_id`
2. Has roadmap? → `roadmaps.product_id`
3. Has team assignments? → `product_teams.product_id`

**Options:**
- **Prevent deletion** with error message listing dependencies
- **Cascade deletion** (delete all related data) - DANGEROUS
- **Soft delete** (mark as inactive) - RECOMMENDED

**Current Implementation:** ⚠️ Needs improvement
- Products can be deleted without checking dependencies
- Should add validation before deletion

---

### **Budget Line Deletion**

**Before deleting a budget line, check:**
1. Has features using it? → `roadmap_features.budget_line_id`

**Options:**
- **Prevent deletion** if features exist
- **Warn user** and require confirmation
- **Reassign features** to another budget line

**Current Implementation:** ⚠️ Needs improvement
- Budget lines can be deleted without checking roadmap features
- Should add validation

---

### **Budget Version Changes**

**When activating a new budget version:**
1. Deactivate previous version
2. Roadmap automatically uses new version (no hard-linking)
3. Budget comparison updates immediately

**Current Implementation:** ✅ Working correctly
- Roadmap queries latest active version dynamically
- No hard-linking to specific versions

---

## 🛠️ Implementation Guidelines

### **For Frontend Developers:**

**DO:**
- ✅ Query data from source tables via API
- ✅ Use dropdowns populated from source tables
- ✅ Refresh data after changes in source module
- ✅ Show read-only data from other modules

**DON'T:**
- ❌ Cache data from other modules
- ❌ Allow editing data from non-owner modules
- ❌ Duplicate data across modules
- ❌ Hard-code IDs or values

---

### **For Backend Developers:**

**DO:**
- ✅ Use foreign keys for referential integrity
- ✅ Add CASCADE constraints where appropriate
- ✅ Validate dependencies before deletion
- ✅ Return clear error messages for constraint violations
- ✅ Use transactions for multi-table updates

**DON'T:**
- ❌ Allow orphaned records
- ❌ Duplicate data across tables
- ❌ Skip validation checks
- ❌ Use hard-coded IDs

---

## 📋 Current Issues & Fixes Needed

### **Issue 1: Product Deletion**
**Problem:** Products can be deleted without checking if they're used in Budget Configuration or Roadmap Planning

**Fix Needed:**
```python
# Before deleting product, check:
1. Check product_budgets table
2. Check roadmaps table
3. Check product_teams table
4. If any exist, return error with list of dependencies
```

**Status:** ⚠️ TODO

---

### **Issue 2: Budget Line Deletion**
**Problem:** Budget lines can be deleted without checking if roadmap features use them

**Fix Needed:**
```python
# Before deleting budget line, check:
1. Check roadmap_features.budget_line_id
2. If features exist, warn user or prevent deletion
```

**Status:** ⚠️ TODO

---

### **Issue 3: Product Budget Deletion**
**Problem:** Product budgets can be deleted, but should warn if roadmap features exist

**Fix Needed:**
```python
# Before deleting product budget, check:
1. Check if roadmap exists for product
2. Check if features reference budget lines
3. Warn user about impact
```

**Status:** ✅ DELETE endpoint added, validation TODO

---

## ✅ What's Working Correctly

### **Budget-Roadmap Integration**
- ✅ Roadmap queries latest active budget version dynamically
- ✅ No hard-linking to budget versions
- ✅ Changes in budget immediately reflect in roadmap
- ✅ Budget comparison calculates correctly

### **Product Dropdown Sync**
- ✅ Budget Configuration shows all products from products table
- ✅ Roadmap Planning shows all products from products table
- ✅ Dropdowns automatically update when products added

### **Bottom-Up Budget Calculation**
- ✅ Product budget = Sum of budget lines
- ✅ Budget line total = Sum of categories
- ✅ Automatic recalculation on changes

---

## 🎯 Recommendations

### **Priority 1: Add Deletion Validation**
Implement dependency checks before deleting:
- Products
- Budget lines
- Budget categories

**Estimated Effort:** 2-3 hours

---

### **Priority 2: Soft Delete Option**
Add `is_active` flag to products, budget lines, etc.
- Allows "deletion" without breaking references
- Can be reactivated if needed
- Historical data preserved

**Estimated Effort:** 3-4 hours

---

### **Priority 3: Dependency Viewer**
Add UI to show where an entity is used:
- "This product is used in: 2 roadmaps, 1 budget configuration"
- "This budget line is used in: 5 features"

**Estimated Effort:** 4-5 hours

---

## 📝 Summary

**Single Source of Truth Achieved:**
- ✅ Products table is source for all product data
- ✅ Budget Configuration is source for all budget data
- ✅ Roadmap Planning is source for all roadmap data
- ✅ Dynamic queries (no caching or duplication)

**Still Needs Work:**
- ⚠️ Deletion validation (check dependencies)
- ⚠️ Soft delete option
- ⚠️ Dependency viewer UI

**Key Principle:**
**"Update once, reflect everywhere"** - Changes in source module automatically propagate to all consuming modules through dynamic queries.
