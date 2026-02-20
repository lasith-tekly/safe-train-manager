# Architectural Discrepancy Analysis - Two-Level Planning

**Date:** 2026-01-29  
**Issue:** Current implementation doesn't follow the two-level planning architecture  
**Severity:** High - Architectural mismatch with requirements  

---

## Problem Statement

The current Roadmap V4 implementation mixes **Strategic Planning** and **Execution Planning** in a single form, which violates the documented two-level planning architecture.

---

## Requirements (From ROADMAP_PLANNING_V3_PI_ALLOCATION.md)

### Two-Level Planning Model:

**Level 1: Strategic Planning (Year/Budget)**
- Feature definition
- Budget allocation (KEUR)
- Product assignment
- Budget line allocation with percentages
- Gross/Net sizing calculation
- Total cost calculation
- Status: planned, in_progress, completed, cancelled

**Level 2: Execution Planning (PI/Quarter)**
- Team assignment
- JIRA record creation
- Quarterly effort allocation (Q1-Q4)
- Capacity vs demand comparison
- Spillover tracking

---

## Current Implementation Issues

### ❌ What's Wrong:

1. **Single Form Mixing Both Levels:**
   - Feature creation form includes:
     - Strategic fields (product, budget, sizing) ✓ Correct
     - Execution fields (teams, quarterly planning) ✗ Wrong level
   - Teams should not be assigned during feature creation
   - Quarterly allocations should be separate from feature definition

2. **Missing Separation:**
   - No clear distinction between "Feature" (strategic) and "Execution Plan" (tactical)
   - Teams assigned at feature level instead of execution level
   - Quarterly planning mixed with feature definition

3. **Workflow Confusion:**
   - User creates feature → immediately assigns teams and quarters
   - Should be: Create feature → Later plan execution with teams/quarters

---

## Correct Architecture

### Level 1: Strategic Planning (Feature Management)

**Purpose:** Define WHAT to build and HOW MUCH it costs

**Form: "Add/Edit Feature"**
- Product selection
- Feature name
- Customer
- Priority
- Budget allocation (multiple budget lines with %)
  - Budget Line selection (hierarchical: Product → Line → Category)
  - Percentage allocation (must sum to 100%)
- Gross Sizing (eD)
- Net Sizing (calculated)
- Total Cost (calculated)
- Remarks
- Status

**No teams, no JIRA, no quarterly planning at this level**

---

### Level 2: Execution Planning (Capacity Allocation)

**Purpose:** Define WHEN and WHO will build it

**Separate Interface: "Execution Planning" or "PI Allocation"**

**Option A: Feature-Level Execution Planning**
- View feature details (read-only)
- Assign teams to feature
- Create quarterly allocations:
  - Year/Quarter selection
  - Allocated effort days (Net eD)
  - Team assignment per quarter
- Create JIRA records:
  - JIRA key
  - Summary
  - Team assignment
  - Quarterly effort breakdown
  - Spillover tracking

**Option B: PI-Level Capacity Planning View**
- Select PI (e.g., 2026 Q2)
- View all features planned for that PI
- Allocate team capacity to features
- Create/manage JIRA records
- Track capacity vs demand

---

## Proposed Solution

### Phase 1: Immediate Fix (Current Sprint)

**Keep current form but remove execution fields:**
1. Remove "Teams" dropdown from feature form
2. Remove "Quarterly Planning" tab from feature form
3. Feature form only handles strategic planning

**Add placeholder for execution planning:**
- Add "Plan Execution" button in feature table
- Shows message: "Execution planning coming soon"
- Saves feature with strategic data only

### Phase 2: Implement Execution Planning (Next Sprint)

**Create separate execution planning interface:**

**Option 1: Feature-Centric View**
```
Feature Details (read-only)
├── Execution Planning
    ├── Team Assignment
    ├── Quarterly Allocations
    │   ├── 2026 Q1: 20 eD
    │   ├── 2026 Q2: 50 eD
    │   └── ...
    └── JIRA Records
        ├── AOP-12345 (Team A, 10 eD in Q1)
        └── AOP-12346 (Team B, 10 eD in Q1)
```

**Option 2: PI-Centric View**
```
PI: 2026 Q2
├── Available Capacity: 45 eD
├── Features Planned:
    ├── Feature A (20 eD)
    │   ├── Team X: 15 eD
    │   └── Team Y: 5 eD
    └── Feature B (30 eD)
        └── Team X: 30 eD
└── Status: ⚠️ Over capacity by 5 eD
```

---

## Data Model Changes

### Current (Wrong):
```typescript
interface RoadmapFeature {
  // Strategic
  product_id: string;
  budget_allocations: BudgetLineAllocation[];
  gross_sizing_ed: number;
  
  // Execution (should not be here)
  teams: TeamSummary[];  // ❌ Remove
  quarterly_allocations: QuarterlyAllocation[];  // ❌ Remove
  jira_records: JiraRecord[];  // ❌ Remove
}
```

### Correct:
```typescript
// Strategic Level
interface RoadmapFeature {
  id: string;
  product_id: string;
  budget_allocations: BudgetLineAllocation[];
  name: string;
  customer?: string;
  priority: number;
  status: string;
  gross_sizing_ed: number;
  net_sizing_ed: number;
  total_cost_keur: number;
  remarks?: string;
  // No teams, no quarterly allocations, no JIRA
}

// Execution Level (new)
interface FeatureExecutionPlan {
  id: string;
  feature_id: string;
  teams: TeamAssignment[];  // Move here
  quarterly_allocations: QuarterlyAllocation[];  // Move here
  jira_records: JiraRecord[];  // Move here
  capacity_status: 'within' | 'over' | 'under';
  created_at: datetime;
  updated_at: datetime;
}

interface TeamAssignment {
  id: string;
  execution_plan_id: string;
  team_id: string;
  allocated_ed: number;
}
```

---

## Migration Strategy

### Step 1: Update Feature Form (Immediate)
- Remove teams dropdown
- Remove quarterly planning tab
- Keep only strategic fields
- Update API to not require teams/quarterly allocations

### Step 2: Create Execution Planning Interface (Next)
- New page/modal for execution planning
- Link from feature table: "Plan Execution" button
- Separate API endpoints for execution planning

### Step 3: Data Migration (If needed)
- Existing features with teams/quarterly data
- Migrate to new execution plan structure
- Maintain backward compatibility during transition

---

## Benefits of Correct Architecture

1. **Clear Separation of Concerns:**
   - Strategic planning focuses on WHAT and HOW MUCH
   - Execution planning focuses on WHEN and WHO

2. **Better Workflow:**
   - Product Managers define features (strategic)
   - Team Leads plan execution (tactical)
   - Clear handoff between roles

3. **Flexibility:**
   - Can create features without immediate execution plan
   - Can revise execution plan without changing feature definition
   - Multiple execution scenarios for same feature

4. **Capacity Management:**
   - PI-level view shows capacity vs demand
   - Easy to identify over-allocated PIs
   - Better resource planning

---

## Recommendation

**Immediate Action:**
1. Remove teams and quarterly planning from current feature form
2. Feature form handles only strategic planning
3. Add placeholder for execution planning

**Next Sprint:**
1. Design and implement proper execution planning interface
2. Create new data models and API endpoints
3. Migrate existing data if needed

**User Decision Required:**
- Approve the architectural change
- Choose execution planning interface (Feature-centric vs PI-centric)
- Confirm timeline for implementation

---

## Current Status

**Commits:** 23 total  
**Latest:** `c48c56e7` - Fixed immediate crashes  
**Next:** Await user decision on architectural refactoring  

---

**End of Analysis**
