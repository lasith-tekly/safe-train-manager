# New Productivity System - Design Document

## 📋 Requirements Summary

### Current System (To Be Replaced)
- 4-level productivity hierarchy: Iteration → PI → Individual → Global
- PI-level productivity field in PI Allocations
- Individual productivity field in Team Members

### New System (Proposed)
- **2-level productivity hierarchy:** Iteration → Global
- **Remove:** PI-level productivity, Individual productivity
- **Add:** Agile Role Allocation / Other Train Allocation split

---

## 🎯 New Productivity Logic

### Simplified Hierarchy
1. **Iteration-level productivity** (if set) → Overrides global
2. **Global productivity** (fallback) → Used when no iteration-level override

### New Capacity Formula
```
Individual Iteration Capacity = net_days × Train Allocation × (100% - Agile Role Deduction %) × Productivity
```

**Where:**
- `net_days` = Working days - Site holidays - Individual holidays
- `Train Allocation` = Member's overall allocation to this train (0-100%)
- `Agile Role Deduction %` = Percentage of time spent on agile role duties (SM/PO) that REDUCES train capacity
- `Productivity` = Iteration-level productivity OR Global productivity

**Important:** Agile Role Allocation % is a **DEDUCTION** from capacity, not an allocation TO capacity.
- If PO has 60% Agile Role Allocation → They lose 60% of capacity to PO duties
- Remaining 40% is available for train work
- Formula: Capacity = net_days × Train Allocation × (100% - 60%) × Productivity

---

## 🔄 Key Changes

### 1. Remove PI-Level Productivity
**Current:** "PI-Level Settings" section has "Productivity %" field  
**New:** Remove this field entirely

**Impact:**
- Database: Keep `member_pi_allocations.productivity_percent` column (for backward compatibility) but don't use it
- UI: Remove from PI Allocations panel
- Backend: Remove from capacity calculation logic

### 2. Remove Individual Productivity
**Current:** `team_members.individual_productivity` field  
**New:** Not used in calculations

**Impact:**
- Database: Keep column (for backward compatibility) but don't use it
- UI: Remove from Team Members panel (if exists)
- Backend: Remove from capacity calculation logic

### 3. Rename "Team Roles" Section → "Agile Role Allocation"
**Before:**
```
PI-Level Settings
├── Productivity %: [__] %
└── Team Roles
    ├── ☐ Scrum Master
    └── ☐ Product Owner
```

**After:**
```
PI-Level Settings
├── Agile Role Allocation: [0] %
└── Team Roles
    ├── ☐ Scrum Master
    ├── ☐ Product Owner
    └── ☐ Other
```

**Logic:**
- **Agile Role Allocation** = Percentage of time spent on agile role duties (SM/PO) that is DEDUCTED from train capacity
- If member is **Scrum Master** → Set Agile Role Allocation (e.g., 80% = 80% time on SM duties)
- If member is **Product Owner** → Set Agile Role Allocation (e.g., 60% = 60% time on PO duties)
- If member is **Other** → Indicates work on different train (not used in calculation, just a flag)
- **Default: 0%** = No agile role deduction (full capacity available for train work)
- **Train Capacity** = net_days × Train Allocation × (100% - Agile Role Allocation) × Productivity

---

## 📊 Detailed Capacity Calculation Examples

### Example 1: Regular Team Member (0% Agile Role Deduction)
```
Member: Developer
Role: Regular team member (not SM/PO)
Iteration: 10 working days (after holidays/leaves)
Train Allocation: 100%
Agile Role Allocation: 0% (no agile role duties - full capacity for train work)
Productivity: 70% (global)

Calculation:
Capacity = 10 days × 100% × (100% - 0%) × 70%
         = 10 × 1.0 × 1.0 × 0.7
         = 7.0 days

Interpretation: Developer has NO agile role deduction, contributes full 7.0 days to train
```

### Example 2: Product Owner (60% Agile Role Deduction)
```
Member: Aditya (Product Owner)
Role: Product Owner checked
Iteration: 10 working days
Train Allocation: 100%
Agile Role Allocation: 60% (60% time spent on PO duties - DEDUCTED from train capacity)
Productivity: 70% (global)

Calculation:
Train Capacity = 10 days × 100% × (100% - 60%) × 70%
               = 10 × 1.0 × 0.4 × 0.7
               = 2.8 days

Interpretation: 
- Aditya spends 60% of time (6 days) on PO duties → NOT counted in train capacity
- Remaining 40% of time (4 days) available for train work
- With 70% productivity: 4 days × 0.7 = 2.8 days train capacity
- PO duties (6 days) are separate - not tracked in train capacity
```

### Example 3: Scrum Master (80% Agile Role Deduction) with Iteration Productivity Override
```
Member: Scrum Master
Role: Scrum Master checked
Iteration: 10 working days
Train Allocation: 100%
Agile Role Allocation: 80% (80% time on SM duties - DEDUCTED from train capacity)
Productivity: 85% (iteration-level override - higher productivity this iteration)

Calculation:
Train Capacity = 10 days × 100% × (100% - 80%) × 85%
               = 10 × 1.0 × 0.2 × 0.85
               = 1.7 days

Interpretation: 
- SM spends 80% of time (8 days) on SM duties → NOT counted in train capacity
- Remaining 20% of time (2 days) available for train work
- With 85% productivity (iteration override): 2 days × 0.85 = 1.7 days train capacity
- The iteration-level 85% overrides the global 70%
```

### Example 4: Part-Time Developer (50% Train Allocation, 0% Agile Role)
```
Member: Developer
Role: Regular team member
Iteration: 10 working days
Train Allocation: 50% (only works half-time on this train)
Agile Role Allocation: 0% (no agile role duties)
Productivity: 70% (global)

Calculation:
Train Capacity = 10 days × 50% × (100% - 0%) × 70%
               = 10 × 0.5 × 1.0 × 0.7
               = 3.5 days

Interpretation:
- Developer works 5 days total on this train (50% of 10 days)
- No agile role deduction (0%)
- With 70% productivity: 5 days × 0.7 = 3.5 days train capacity
```

### Example 5: Default 0% - Full Capacity Available
```
Member: New Developer
Role: Regular team member
Iteration: 10 working days
Train Allocation: 100%
Agile Role Allocation: 0% (default - no agile role duties)
Productivity: 70% (global)

Calculation:
Train Capacity = 10 days × 100% × (100% - 0%) × 70%
               = 10 × 1.0 × 1.0 × 0.7
               = 7.0 days

Interpretation:
- Default 0% means NO agile role deduction
- Member contributes FULL capacity to train work
- This is correct: regular developers have 0% agile role deduction
```

---

## 📈 Capacity Reporting Options

Based on the examples above, here are two reporting options:

### Option A: Show Combined Total Only (Simpler)
```
Team Capacity Report - PI 2025.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Member          Role    Iteration 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Developer       Dev     7.0 days
Aditya          PO      4.2 days
Scrum Master    SM      6.8 days
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                   18.0 days
```

**Pros:** Clean, simple, easy to understand  
**Cons:** Doesn't show split between this train and other trains

### Option B: Show Breakdown (More Detailed)
```
Team Capacity Report - PI 2025.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Member          Role    This Train  Other Train  Total
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Developer       Dev     7.0 days    0.0 days     7.0 days
Aditya          PO      4.2 days    2.8 days     7.0 days
Scrum Master    SM      6.8 days    1.7 days     8.5 days
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                   18.0 days   4.5 days     22.5 days
```

**Pros:** Shows full picture of capacity allocation  
**Cons:** More complex, may confuse users

**Recommendation:** Start with **Option A** (combined total only) for simplicity. The "This Train" capacity is what matters for planning. Other train capacity is tracked separately in that train's view.

---

## 🗄️ Database Changes

### Schema Modifications

#### 1. Add New Column: `member_pi_allocations.agile_role_allocation_percent`
```sql
ALTER TABLE member_pi_allocations 
ADD COLUMN agile_role_allocation_percent INTEGER DEFAULT 100;
```

**Purpose:** Store the percentage of time member spends in agile role vs other train activities

#### 2. Add New Column: `member_pi_allocations.is_other_role`
```sql
ALTER TABLE member_pi_allocations 
ADD COLUMN is_other_role BOOLEAN DEFAULT FALSE;
```

**Purpose:** Flag to indicate if member has "Other" role checked

#### 3. Deprecate (Keep but Don't Use)
- `member_pi_allocations.productivity_percent` → Keep for backward compatibility
- `team_members.individual_productivity` → Keep for backward compatibility

**Note:** We keep these columns to avoid data loss, but they won't be used in calculations.

---

## 🎨 UI Changes

### 1. PI Allocations Panel - Right Side

**Before:**
```
PI-Level Settings
├── Productivity %: [__] %
└── Team Roles
    ├── ☐ Scrum Master
    └── ☐ Product Owner
```

**After:**
```
PI-Level Settings
├── Agile Role Allocation: [100] %
└── Team Roles
    ├── ☐ Scrum Master
    ├── ☐ Product Owner
    └── ☐ Other
```

**Changes:**
- Replace "Productivity %" field with "Agile Role Allocation" field
- Add "Other" checkbox to Team Roles
- Default value: 100%
- Validation: 0-100

### 2. Iteration Capacity Deductions Section

**Keep as is:**
```
Iteration Capacity Deductions (days)
                    Iteration 1  Iteration 2  Iteration 3  Iteration 4  IP
Leave               [0.0]        [0.0]        [0.0]        [0.0]        [0.0]
Training            [0.0]        [0.0]        [0.0]        [0.0]        [0.0]
Other               [0.0]        [0.0]        [0.0]        [0.0]        [0.0]
Productivity %      [__]         [__]         [__]         [__]         [__]
IP Deduction                                                            [5.0]
```

**No changes** - This stays the same for iteration-level productivity overrides.

### 3. Remove from Team Members Panel
- Remove "Individual Productivity" field (if it exists)

---

## ⚙️ Backend Logic Changes

### File: `backend/app/services/team_service.py`

#### Current Logic (Lines 452-456):
```python
pi_level_productivity = (
    (pi_allocation.productivity_percent / 100.0) if pi_allocation and pi_allocation.productivity_percent 
    else (member.individual_productivity / 100.0 if member.individual_productivity 
          else global_settings.global_productivity_percentage / 100.0)
)
```

#### New Logic:
```python
# Simplified: Only iteration-level or global
base_productivity = global_settings.global_productivity_percentage / 100.0
```

#### Current Iteration Capacity (Line 534):
```python
iter_member_days = net_days * train_productivity * (train_alloc_pct / 100.0) * iter_productivity
```

#### New Iteration Capacity:
```python
# Get agile role allocation (default 100%)
agile_role_pct = (
    pi_allocation.agile_role_allocation_percent if pi_allocation 
    else 100
) / 100.0

# Get productivity (iteration-level override or global)
productivity = iter_productivity_map.get(iteration.id, base_productivity)

# Calculate capacity
iter_member_days = net_days * (train_alloc_pct / 100.0) * agile_role_pct * productivity
```

**Note:** Removed `train_productivity` variable (was hardcoded to 1.0)

---

## 🔍 Impact Analysis

### Components Affected

| Component | File/Location | Change Type | Complexity |
|-----------|---------------|-------------|------------|
| **Database Schema** | Migration file | Add columns | Low |
| **Backend Models** | `app/models/team.py` | Add fields | Low |
| **Backend Schemas** | `app/schemas/team_member.py` | Update schemas | Low |
| **Backend Service** | `app/services/team_service.py` | Modify calculation logic | Medium |
| **Frontend Types** | `frontend/src/types/index.ts` | Update interfaces | Low |
| **Frontend UI** | `PIAllocationsPanel.tsx` | Redesign PI-Level Settings | Medium |
| **Frontend API** | API service calls | Update payloads | Low |

### Breaking Changes
- **API:** `MemberPIAllocationCreate` schema changes (add `agile_role_allocation_percent`, `is_other_role`)
- **Calculation:** Capacity values will change for existing data (need migration strategy)

---

## 📝 Implementation Plan (Agent Workflow)

### Phase 1: Database & Backend Models
1. Create migration to add new columns
2. Update `MemberPIAllocation` model
3. Update schemas (`MemberPIAllocationCreate`, `MemberPIAllocationResponse`)

### Phase 2: Backend Calculation Logic
1. Update `get_pi_capacity_detail()` in `team_service.py`
2. Remove PI-level and Individual productivity from hierarchy
3. Implement new formula with agile role allocation
4. Remove `train_productivity` variable

### Phase 3: Frontend Types & API
1. Update TypeScript interfaces
2. Update API service calls

### Phase 4: Frontend UI
1. Redesign "PI-Level Settings" section
2. Replace "Productivity %" with "Agile Role Allocation"
3. Add "Other" checkbox to Team Roles
4. Update form validation

### Phase 5: Testing & Verification
1. Test capacity calculations with new formula
2. Verify backward compatibility
3. Test UI changes

---

## ✅ Product Manager Decisions (Confirmed)

### 1. "Other" Role Purpose ✅
**Answer:** Different train work

**Meaning:** 
- "Other" checkbox indicates member is working on a different train/project
- Agile Role Allocation % = Time spent on THIS train's agile work
- Other Train % = (100% - Agile Role %) = Time spent on OTHER train work

### 2. Capacity Reporting ✅
**Answer:** Need sample/clarification

**Action Required:** Will provide capacity calculation examples with different scenarios below.

### 3. Backward Compatibility ✅
**Answer:** Migrate all to 100%

**Implementation:**
- Migration script will set `agile_role_allocation_percent = 100` for all existing `member_pi_allocations` records
- This assumes all existing members were 100% allocated to their train's agile work
- No recalculation of historical data needed

### 4. Role Combinations ✅
**Answer:** Yes - "Other" can be combined with SM/PO

**Examples:**
- Scrum Master who is 70% SM duties, 30% other train work → Agile Role Allocation = 70%
- Product Owner who is 60% PO duties, 40% other train work → Agile Role Allocation = 60%
- Regular developer who is 50% this train, 50% other train → Agile Role Allocation = 50%

### 5. Default Value ✅
**Answer:** 0% (default - full capacity available)

**Logic:**
- Default 0% means NO agile role deduction
- 0% = Member has full capacity available for train work (no SM/PO duties)
- Regular developers should stay at 0%
- Only SM/PO roles should have values > 0% (representing time spent on agile role duties)
- **Corrected Understanding:** 0% is the CORRECT default for regular team members

---

## 🎯 Next Steps

1. **Product Manager:** Review this design and answer open questions
2. **Confirm:** Formula and UI changes are correct
3. **Approve:** Implementation plan
4. **Start:** Phase 1 (Database & Backend Models)

---

## 📚 References
- Original requirements: User message (Jan 26, 2026)
- Current implementation: `backend/app/services/team_service.py` lines 426-556
- UI screenshot: PI Allocations Panel
