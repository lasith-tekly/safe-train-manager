# Gap Analysis: Requirements vs Current Implementation

**Date:** 2026-01-29  
**Analysis Type:** Requirements Compliance Check  
**Status:** No changes made - Analysis only  

---

## Executive Summary

The current Roadmap V4 implementation has **significant gaps** compared to the original requirements. While the core effort-centric design is correct, several critical features are missing or incomplete.

**Overall Compliance:** ~60%

**Critical Gaps:**
1. ❌ JIRA Records module completely missing
2. ❌ Validation system not implemented
3. ❌ Train configuration settings missing
4. ⚠️ Budget allocation design differs from requirements
5. ⚠️ Two-level planning partially implemented

---

## Detailed Gap Analysis

### ✅ IMPLEMENTED CORRECTLY

#### 1. Core Effort-Centric Design ✓
**Requirement:** Features sized in Effort Days (eD), not KEUR  
**Implementation:** ✅ Correct
- `gross_sizing_ed` as user input
- `net_sizing_ed` calculated
- `total_cost_keur` calculated

#### 2. Database Schema - Partial ✓
**Requirement:** New tables for effort-centric roadmap  
**Implementation:** ✅ Mostly correct

**Tables Created:**
- ✅ `roadmap_features` - Core feature table
- ✅ `feature_teams` - Many-to-many team assignment
- ✅ `feature_quarterly_allocations` - Quarterly effort breakdown
- ✅ `feature_budget_line_allocations` - Multiple budget lines with percentages
- ❌ `jira_records` - **MISSING**
- ❌ `jira_quarterly_allocations` - **MISSING**

#### 3. Calculations ✓
**Requirement:** Automatic sizing and cost calculations  
**Implementation:** ✅ Correct
- Calculation service exists
- `/api/features/calculate` endpoint works
- Formulas match requirements

#### 4. Quarterly Planning ✓
**Requirement:** Multi-year quarterly allocations  
**Implementation:** ✅ Correct
- Can add quarters across multiple years
- Year/Quarter/Effort structure correct
- UI supports adding multiple quarters

---

## ❌ CRITICAL GAPS

### 1. JIRA Records Module - COMPLETELY MISSING

**Requirement:**
```sql
CREATE TABLE jira_records (
    id UUID PRIMARY KEY,
    feature_id UUID REFERENCES roadmap_features(id),
    jira_key VARCHAR(50) NOT NULL,
    summary VARCHAR(500),
    team_id UUID REFERENCES teams(id),
    status VARCHAR(50),
    is_spillover BOOLEAN,
    spillover_from_quarter INTEGER,
    spillover_from_year INTEGER,
    remarks TEXT
);

CREATE TABLE jira_quarterly_allocations (
    id UUID PRIMARY KEY,
    jira_record_id UUID REFERENCES jira_records(id),
    year INTEGER,
    quarter INTEGER,
    allocated_ed DECIMAL(10,2)
);
```

**Current Implementation:** ❌ **NONE**

**Impact:** HIGH - Cannot track execution-level work items

**Missing Features:**
- No JIRA record creation
- No JIRA-to-feature linking
- No spillover tracking
- No team-specific JIRA allocations
- No JIRA status tracking

**Required Work:**
1. Create database tables
2. Create backend models
3. Create backend schemas
4. Create API endpoints:
   - `GET /api/features/{feature_id}/jira-records`
   - `POST /api/features/{feature_id}/jira-records`
   - `PUT /api/jira-records/{id}`
   - `DELETE /api/jira-records/{id}`
   - `PUT /api/jira-records/{id}/allocations`
5. Create UI components:
   - `JiraRecordSection.tsx`
   - `JiraRecordForm.tsx`
6. Add expandable JIRA section under features

---

### 2. Validation System - COMPLETELY MISSING

**Requirement:** Three-level validation system

#### 2.1 Budget Validation (Annual, 3 Levels)
**Required:**
- Product Level: Sum of features vs product budget
- Budget Line Level: Sum of features vs budget line allocation
- Category Level: Sum of features vs category allocation

**Status Indicators:**
- 🔴 Over-planned (>100%)
- 🟡 Approaching (>90%)
- 🔵 Under-planned (<80%)
- ✅ Healthy (80-90%)

**Current Implementation:** ❌ **NONE**

**Missing API Endpoints:**
```
GET /api/validation/budget
  Query: product_id, year, budget_line_id?, category_id?
  Response: {product_validation, budget_line_validation, category_validation}

GET /api/validation/capacity
  Query: team_id, year, quarter
  Response: {team_capacity, allocated, remaining, utilization, status}

GET /api/validation/feature/{feature_id}
  Response: {budget_validation, consistency_validation}

GET /api/validation/summary
  Query: product_id?, year?
  Response: All validations aggregated with alerts
```

#### 2.2 Capacity Validation (Quarterly, Per Team)
**Required:**
- Compare JIRA allocations vs team capacity
- Show utilization percentage
- Alert on over-allocation

**Current Implementation:** ❌ **NONE**

#### 2.3 Feature Consistency Validation
**Required:**
- Compare JIRA allocations vs feature quarterly plan
- Warn if JIRA exceeds feature plan

**Current Implementation:** ❌ **NONE**

**Required Work:**
1. Create `ValidationService` backend service
2. Implement budget validation logic
3. Implement capacity validation logic
4. Implement consistency validation logic
5. Create validation API endpoints
6. Create `ValidationPanel.tsx` UI component
7. Display validation alerts in real-time

---

### 3. Train Configuration Settings - MISSING

**Requirement:**
```sql
INSERT INTO global_settings (key, value, description) VALUES
('train_unit_cost_keur', '78', 'Annual average unit cost in KEUR'),
('effort_days_per_year', '220', 'Working days per year'),
('train_structural_cost_ratio', '2.8', 'Structural cost multiplier');
```

**Current Implementation:** ⚠️ **PARTIALLY IMPLEMENTED**

**What Exists:**
- Settings are used in calculations
- Calculation service references them

**What's Missing:**
- Settings not stored in `global_settings` table
- No UI to view/edit train configuration
- No API endpoints:
  ```
  GET /api/settings/train-config
  PUT /api/settings/train-config
  ```

**Required Work:**
1. Add settings to `global_settings` table
2. Create train config API endpoints
3. Create train config UI (Settings page)
4. Allow admin to modify values

---

## ⚠️ PARTIAL IMPLEMENTATIONS / DEVIATIONS

### 4. Budget Allocation Design Difference

**Requirement:**
- Single budget line per feature
- Optional category

**Current Implementation:**
- ✅ **ENHANCED:** Multiple budget lines per feature with percentage splits
- ✅ Category selection per budget line
- ✅ Transversal budget line support

**Assessment:** ✅ **BETTER THAN REQUIRED**

This is an enhancement, not a gap. The current implementation supports:
- 50% Product Evolution + 50% Maintenance
- Hierarchical selection: Product → Budget Line → Category
- Percentage validation (must sum to 100%)

**Recommendation:** Keep current implementation (superior to requirements)

---

### 5. Two-Level Planning Architecture

**Requirement:**
```
Level 1: Strategic Planning
- Feature definition, budget, sizing, quarterly planning
- NO teams, NO JIRA

Level 2: Execution Planning
- Team assignment
- JIRA records
- Team-specific breakdown
```

**Current Implementation:** ⚠️ **PARTIALLY CORRECT**

**What's Correct:**
- ✅ Feature form has quarterly planning
- ✅ Teams removed from feature creation form
- ✅ Clear separation messaging

**What's Missing:**
- ❌ No execution planning interface
- ❌ No way to assign teams after feature creation
- ❌ No JIRA record management
- ❌ Teams still in database model (not removed, just hidden in UI)

**Required Work:**
1. Create execution planning interface
2. Add "Plan Execution" button in feature table
3. Create execution planning modal/page:
   - View feature details (read-only)
   - Assign teams
   - Create JIRA records
   - Manage JIRA allocations

---

### 6. Feature Table Display

**Requirement:**
```
Feature Name | BL | Customer | Gross | Net | Cost | Q1-Q4
▶ Disruption  | PE | AVINOR   | 280   | 100 | 99.3K| 10|20|..
  └─ AOP-25718|    | Polaris  |       |     |      | 20|  |
  └─ AOP-21678|    | Sirius   |       |     |      |   |30|
```

**Current Implementation:** ⚠️ **SIMPLIFIED**

**What Exists:**
- Feature list with basic columns
- Budget allocation shown as percentage tags
- Edit/Delete actions

**What's Missing:**
- ❌ No expandable JIRA records under features
- ❌ No quarterly breakdown in table (Q1-Q4 columns)
- ❌ No team display per feature
- ❌ No nested JIRA display

**Required Work:**
1. Add expandable rows
2. Add Q1-Q4 columns showing effort per quarter
3. Show JIRA records when expanded
4. Show teams assigned to feature

---

### 7. Validation Panel in UI

**Requirement:**
```
┌───────────────────────────────────────────────────────────────┐
│ VALIDATION SUMMARY                                             │
│ 🔴 BRS PE 2026: Over-planned by 15K                           │
│ 🟡 Team Polaris Q1: 92% utilized                              │
└───────────────────────────────────────────────────────────────┘
```

**Current Implementation:** ❌ **NONE**

**Required Work:**
1. Create `ValidationPanel.tsx` component
2. Fetch validation data from API
3. Display alerts with color coding
4. Show in main roadmap page
5. Show in feature form modal

---

## 📊 COMPLIANCE SCORECARD

| Feature | Required | Implemented | Status | Priority |
|---------|----------|-------------|--------|----------|
| **Core Design** |
| Effort-centric sizing | ✓ | ✓ | ✅ Complete | - |
| Calculation service | ✓ | ✓ | ✅ Complete | - |
| **Database** |
| roadmap_features | ✓ | ✓ | ✅ Complete | - |
| feature_teams | ✓ | ✓ | ✅ Complete | - |
| feature_quarterly_allocations | ✓ | ✓ | ✅ Complete | - |
| feature_budget_line_allocations | - | ✓ | ✅ Enhanced | - |
| jira_records | ✓ | ✗ | ❌ Missing | HIGH |
| jira_quarterly_allocations | ✓ | ✗ | ❌ Missing | HIGH |
| **Backend API** |
| Feature CRUD | ✓ | ✓ | ✅ Complete | - |
| Calculation endpoint | ✓ | ✓ | ✅ Complete | - |
| JIRA CRUD | ✓ | ✗ | ❌ Missing | HIGH |
| Validation endpoints | ✓ | ✗ | ❌ Missing | HIGH |
| Train config endpoints | ✓ | ✗ | ❌ Missing | MEDIUM |
| **Frontend UI** |
| Feature form | ✓ | ✓ | ✅ Complete | - |
| Quarterly planning | ✓ | ✓ | ✅ Complete | - |
| JIRA record form | ✓ | ✗ | ❌ Missing | HIGH |
| Validation panel | ✓ | ✗ | ❌ Missing | HIGH |
| Execution planning interface | ✓ | ✗ | ❌ Missing | HIGH |
| Expandable JIRA in table | ✓ | ✗ | ❌ Missing | MEDIUM |
| Q1-Q4 columns in table | ✓ | ✗ | ❌ Missing | LOW |
| **Two-Level Planning** |
| Strategic planning form | ✓ | ✓ | ✅ Complete | - |
| Execution planning interface | ✓ | ✗ | ❌ Missing | HIGH |
| **Settings** |
| Train config in DB | ✓ | ✗ | ❌ Missing | MEDIUM |
| Train config UI | ✓ | ✗ | ❌ Missing | LOW |

---

## 🎯 PRIORITY RANKING

### P0 - Critical (Blocking Core Functionality)
1. **JIRA Records Module**
   - Database tables
   - Backend models/schemas/services
   - API endpoints
   - UI forms and display
   - **Estimated Effort:** 2-3 days

2. **Validation System**
   - Backend validation service
   - Validation API endpoints
   - Validation panel UI
   - Real-time validation display
   - **Estimated Effort:** 2-3 days

3. **Execution Planning Interface**
   - Team assignment UI
   - JIRA management UI
   - Integration with feature list
   - **Estimated Effort:** 1-2 days

### P1 - High (Important for Complete Experience)
4. **Train Configuration Management**
   - Settings in database
   - API endpoints
   - Settings UI
   - **Estimated Effort:** 0.5 days

5. **Expandable JIRA in Feature Table**
   - Expandable rows
   - JIRA display under features
   - **Estimated Effort:** 0.5 days

### P2 - Medium (Nice to Have)
6. **Quarterly Columns in Table**
   - Q1-Q4 effort display
   - Compact view
   - **Estimated Effort:** 0.5 days

7. **Enhanced Table Display**
   - Team display
   - Better formatting
   - **Estimated Effort:** 0.5 days

---

## 📋 IMPLEMENTATION ROADMAP

### Phase 1: JIRA Records (2-3 days)
**Goal:** Enable execution-level tracking

**Tasks:**
1. Create database tables
2. Create backend models (`JiraRecord`, `JiraQuarterlyAllocation`)
3. Create backend schemas
4. Create JIRA service
5. Create API endpoints
6. Create `JiraRecordForm.tsx`
7. Create `JiraRecordSection.tsx`
8. Integrate with feature detail view

**Deliverables:**
- Can create JIRA records under features
- Can allocate effort per quarter per JIRA
- Can track spillovers
- Can assign teams to JIRA records

---

### Phase 2: Validation System (2-3 days)
**Goal:** Enable budget and capacity validation

**Tasks:**
1. Create `ValidationService` backend
2. Implement budget validation logic (3 levels)
3. Implement capacity validation logic
4. Implement consistency validation logic
5. Create validation API endpoints
6. Create `ValidationPanel.tsx`
7. Integrate with feature form
8. Integrate with main roadmap page

**Deliverables:**
- Real-time budget validation
- Capacity utilization tracking
- Feature consistency checks
- Visual alerts (🔴🟡🔵✅)

---

### Phase 3: Execution Planning Interface (1-2 days)
**Goal:** Complete two-level planning architecture

**Tasks:**
1. Create "Plan Execution" button in feature table
2. Create execution planning modal
3. Team assignment interface
4. JIRA management interface
5. Link to validation system

**Deliverables:**
- Separate execution planning from strategic planning
- Clear workflow: Create feature → Plan execution
- Team assignment after feature creation

---

### Phase 4: Train Configuration & Polish (1 day)
**Goal:** Complete remaining features

**Tasks:**
1. Add train config to `global_settings`
2. Create train config API endpoints
3. Create train config UI
4. Add expandable JIRA rows
5. Add Q1-Q4 columns
6. Polish UI/UX

**Deliverables:**
- Configurable train settings
- Enhanced table display
- Complete feature set

---

## 🔍 DETAILED MISSING COMPONENTS

### Backend Files Needed

**Models:**
```
backend/app/models/jira_record.py
backend/app/models/jira_quarterly_allocation.py
```

**Schemas:**
```
backend/app/schemas/jira.py
- JiraRecordCreate
- JiraRecordUpdate
- JiraRecordResponse
- JiraQuarterlyAllocationInput
- JiraQuarterlyAllocationResponse
```

**Services:**
```
backend/app/services/jira_service.py
- create_jira_record()
- update_jira_record()
- delete_jira_record()
- list_jira_records()
- update_jira_allocations()

backend/app/services/validation_service_v4.py (UPDATE)
- validate_budget() - Already exists but incomplete
- validate_capacity() - MISSING
- validate_feature_consistency() - MISSING
- get_validation_summary() - MISSING
```

**Routes:**
```
backend/app/routes/jira_v4.py
- GET /api/features/{feature_id}/jira-records
- POST /api/features/{feature_id}/jira-records
- PUT /api/jira-records/{id}
- DELETE /api/jira-records/{id}
- PUT /api/jira-records/{id}/allocations

backend/app/routes/validation_v4.py
- GET /api/validation/budget
- GET /api/validation/capacity
- GET /api/validation/feature/{feature_id}
- GET /api/validation/summary

backend/app/routes/train_config.py
- GET /api/settings/train-config
- PUT /api/settings/train-config
```

---

### Frontend Files Needed

**Components:**
```
frontend/src/pages/RoadmapV4/JiraRecordSection.tsx
- Display JIRA records under feature
- Expandable/collapsible
- Add/Edit/Delete actions

frontend/src/pages/RoadmapV4/JiraRecordForm.tsx
- Create/Edit JIRA record
- JIRA key, summary, team, status
- Spillover tracking
- Quarterly allocation grid
- Validation display

frontend/src/pages/RoadmapV4/ExecutionPlanningModal.tsx
- Feature details (read-only)
- Team assignment section
- JIRA records management
- Validation summary

frontend/src/pages/RoadmapV4/ValidationPanel.tsx
- Budget validation display
- Capacity validation display
- Consistency validation display
- Alert list with color coding

frontend/src/pages/Settings/TrainConfig.tsx
- View/Edit train configuration
- unit_cost_keur
- effort_days_per_year
- structural_cost_ratio
```

**Services:**
```
frontend/src/services/jiraApi.ts
- listJiraRecords()
- createJiraRecord()
- updateJiraRecord()
- deleteJiraRecord()
- updateJiraAllocations()

frontend/src/services/validationApi.ts
- getBudgetValidation()
- getCapacityValidation()
- getFeatureValidation()
- getValidationSummary()

frontend/src/services/trainConfigApi.ts
- getTrainConfig()
- updateTrainConfig()
```

**Types:**
```
frontend/src/types/roadmap_v4.ts (UPDATE)
- Add JiraRecord interface
- Add JiraQuarterlyAllocation interface
- Add BudgetValidation interface
- Add CapacityValidation interface
- Add FeatureConsistencyValidation interface
- Add TrainConfig interface
```

---

## 💡 RECOMMENDATIONS

### Immediate Actions (This Sprint)
1. ✅ **Keep current implementation** - Don't rollback
2. 🎯 **Prioritize JIRA module** - Most critical gap
3. 🎯 **Implement validation system** - Second most critical
4. 📋 **Create detailed task breakdown** for each phase

### Architecture Decisions
1. ✅ **Keep enhanced budget allocation** - Multiple budget lines is better
2. ✅ **Keep two-level planning separation** - Correct approach
3. ✅ **Keep quarterly planning in strategic form** - As per requirements
4. 🔄 **Add execution planning interface** - Complete the separation

### Technical Debt
1. Remove teams from feature creation API (make optional)
2. Clean up old/unused files
3. Update documentation
4. Add comprehensive tests

---

## 📊 SUMMARY STATISTICS

**Total Requirements:** 25 major features  
**Implemented:** 15 features (60%)  
**Missing:** 10 features (40%)  

**Estimated Remaining Effort:** 6-9 days

**Breakdown:**
- JIRA Module: 2-3 days
- Validation System: 2-3 days
- Execution Planning: 1-2 days
- Train Config & Polish: 1 day

---

## ✅ CONCLUSION

The current Roadmap V4 implementation has a **solid foundation** with the correct effort-centric design and enhanced budget allocation features. However, **critical execution-level features are missing**:

1. **JIRA Records** - Cannot track execution items
2. **Validation System** - Cannot validate budget/capacity
3. **Execution Planning Interface** - Two-level planning incomplete

**Recommendation:** Continue with current implementation and add missing features in phases. The architecture is sound; we just need to complete the feature set.

**Next Steps:**
1. Get user approval for phased approach
2. Start with Phase 1 (JIRA Records)
3. Follow with Phase 2 (Validation System)
4. Complete with Phase 3 & 4

---

**End of Gap Analysis**
