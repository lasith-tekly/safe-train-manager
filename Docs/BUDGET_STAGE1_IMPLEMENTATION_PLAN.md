# Budget Configuration - Stage 1 Implementation Plan

**Feature:** Budget Configuration (Stage 1: Allocation)  
**Status:** Ready for Frontend Implementation  
**Date:** 2026-01-27  
**Following:** Agentic Workflow

---

## Executive Summary

This document outlines the complete implementation plan for Budget Configuration Stage 1, following the agentic workflow with clear agent responsibilities and deliverables.

**Scope:** Budget Allocation & Configuration (Stage 1 only)  
**Out of Scope:** Budget Planning (Stage 2), Feature Linking (Stage 3)

---

## Implementation Status

### ✅ Completed Phases

| Phase | Agent | Status | Deliverable |
|-------|-------|--------|-------------|
| Requirements | @Product-Manager | ✅ Complete | `Docs/specs/requirements/BUDGET_CONFIGURATION.md` |
| Database Design | @Database-Architect | ✅ Complete | `Docs/specs/database/BUDGET_SCHEMA.md` |
| API Design | @Backend-Architect | ✅ Complete | `Docs/specs/api/BUDGET_API_SPEC.md` |
| Backend Implementation | @Backend-Developer | ✅ Complete | Models, Schemas, Service, Routes |
| UI Design | @UI-Designer | ✅ Complete | `Docs/specs/ui/BUDGET_CONFIGURATION_UI.md` |

---

## Pending Phases

### Phase 5: Database Migration
**Owner:** User  
**Status:** ⏳ Pending  
**Estimated Time:** 5 minutes

**Tasks:**
1. Run migration script
2. Verify tables created
3. Seed initial fiscal year

**Commands:**
```bash
cd ~/Desktop/My\ Projects/safe-train-manager/backend
sqlite3 safe_train_manager.db < migrations/001_create_budget_tables.sql
```

**Verification:**
```bash
sqlite3 safe_train_manager.db "SELECT * FROM fiscal_years;"
```

---

### Phase 6-12: Frontend Implementation
**Owner:** @Frontend-Developer  
**Status:** ⏳ Pending  
**Estimated Time:** 2-3 days

---

## Frontend Implementation Plan (Agentic Workflow)

### Phase 6: Setup & Navigation
**Agent:** @Frontend-Developer  
**Duration:** 2 hours  
**Dependencies:** Phase 5 (Migration)

**Tasks:**
1. Create route structure
2. Add Settings → Budget Configuration menu item
3. Create main layout component
4. Setup API client for budget endpoints

**Deliverables:**
- `frontend/src/pages/settings/BudgetConfiguration/index.tsx`
- `frontend/src/pages/settings/BudgetConfiguration/BudgetConfigurationLayout.tsx`
- `frontend/src/services/budgetConfigService.ts`
- Route configuration updated

**Acceptance Criteria:**
- [ ] Budget Configuration page accessible from Settings
- [ ] Layout renders with top bar and split panels
- [ ] API client configured with all endpoints

---

### Phase 7: Fiscal Year Management
**Agent:** @Frontend-Developer  
**Duration:** 3 hours  
**Dependencies:** Phase 6

**Tasks:**
1. Create Fiscal Year selector component
2. Create Fiscal Year creation modal
3. Implement fiscal year CRUD operations
4. Add fiscal year state management

**Deliverables:**
- `frontend/src/pages/settings/BudgetConfiguration/components/FiscalYearSelector.tsx`
- `frontend/src/pages/settings/BudgetConfiguration/modals/CreateFiscalYearModal.tsx`
- Redux slice or Context for fiscal year state

**Acceptance Criteria:**
- [ ] Fiscal year dropdown shows all years
- [ ] Can create new fiscal year
- [ ] Can set current fiscal year
- [ ] Fiscal year selection updates UI

**API Endpoints Used:**
- `GET /api/budget/fiscal-years`
- `POST /api/budget/fiscal-years`
- `PUT /api/budget/fiscal-years/{id}`

---

### Phase 8: Budget Version Management
**Agent:** @Frontend-Developer  
**Duration:** 3 hours  
**Dependencies:** Phase 7

**Tasks:**
1. Create Version selector component
2. Create Version creation modal
3. Implement version CRUD operations
4. Add version state management
5. Implement "copy from previous" logic

**Deliverables:**
- `frontend/src/pages/settings/BudgetConfiguration/components/VersionSelector.tsx`
- `frontend/src/pages/settings/BudgetConfiguration/modals/CreateVersionModal.tsx`
- Version state management

**Acceptance Criteria:**
- [ ] Version dropdown shows all versions for selected fiscal year
- [ ] Can create new version
- [ ] Can copy from previous version
- [ ] Active version is highlighted
- [ ] Version selection loads budget data

**API Endpoints Used:**
- `GET /api/budget/versions?fiscal_year_id={id}`
- `POST /api/budget/versions`
- `GET /api/budget/versions/{id}`

---

### Phase 9: Budget Tree Component
**Agent:** @Frontend-Developer  
**Duration:** 4 hours  
**Dependencies:** Phase 8

**Tasks:**
1. Create hierarchical tree component
2. Implement tree node rendering (Product/Line/Category)
3. Add expand/collapse functionality
4. Add progress bars and utilization display
5. Implement context menu (right-click)
6. Add transversal indicator (🔗)

**Deliverables:**
- `frontend/src/pages/settings/BudgetConfiguration/components/BudgetTree.tsx`
- `frontend/src/pages/settings/BudgetConfiguration/components/BudgetTreeNode.tsx`
- `frontend/src/pages/settings/BudgetConfiguration/components/BudgetContextMenu.tsx`

**Acceptance Criteria:**
- [ ] Tree displays full hierarchy (Product → Line → Category)
- [ ] Nodes show allocated, consumed, utilization
- [ ] Progress bars color-coded (green/yellow/red)
- [ ] Expand/collapse works
- [ ] Right-click shows context menu
- [ ] Transversal lines show 🔗 icon
- [ ] Clicking node shows details in right panel

**API Endpoints Used:**
- `GET /api/budget/products?version_id={id}`
- `GET /api/budget/products/{id}`

---

### Phase 10: Budget Forms (Product/Line/Category)
**Agent:** @Frontend-Developer  
**Duration:** 5 hours  
**Dependencies:** Phase 9

**Tasks:**
1. Create Product Budget form
2. Create Budget Line form
3. Create Budget Category form
4. Implement form validation
5. Add warning messages for sum validation
6. Implement CRUD operations

**Deliverables:**
- `frontend/src/pages/settings/BudgetConfiguration/forms/ProductBudgetForm.tsx`
- `frontend/src/pages/settings/BudgetConfiguration/forms/BudgetLineForm.tsx`
- `frontend/src/pages/settings/BudgetConfiguration/forms/BudgetCategoryForm.tsx`
- Form validation utilities

**Acceptance Criteria:**
- [ ] Product budget form validates input
- [ ] Budget line form validates code, name, amount
- [ ] Category form validates name, amount
- [ ] Warning shown when children exceed parent
- [ ] Forms show success/error messages
- [ ] Tree updates after save

**API Endpoints Used:**
- `POST /api/budget/products`
- `POST /api/budget/lines`
- `PUT /api/budget/lines/{id}`
- `DELETE /api/budget/lines/{id}`
- `POST /api/budget/categories`
- `PUT /api/budget/categories/{id}`
- `DELETE /api/budget/categories/{id}`

---

### Phase 11: Transversal Budget Allocation
**Agent:** @Frontend-Developer  
**Duration:** 4 hours  
**Dependencies:** Phase 10

**Tasks:**
1. Add transversal checkbox to Budget Line form
2. Create product allocation section
3. Implement percentage/absolute toggle
4. Add validation for percentage sum (100%)
5. Show allocation breakdown

**Deliverables:**
- `frontend/src/pages/settings/BudgetConfiguration/components/TransversalAllocation.tsx`
- Transversal validation logic

**Acceptance Criteria:**
- [ ] Transversal checkbox toggles allocation section
- [ ] Can add multiple product allocations
- [ ] Percentage/Absolute toggle works
- [ ] Percentage validation (must sum to 100%)
- [ ] Shows error if < 2 products for transversal
- [ ] Tree shows 🔗 for transversal lines

**API Endpoints Used:**
- `POST /api/budget/lines` (with transversal allocations)

---

### Phase 12: Version Comparison & Audit Log
**Agent:** @Frontend-Developer  
**Duration:** 3 hours  
**Dependencies:** Phase 10

**Tasks:**
1. Create Compare Versions modal
2. Implement version comparison logic
3. Create Audit Log modal
4. Implement audit log filtering and pagination

**Deliverables:**
- `frontend/src/pages/settings/BudgetConfiguration/modals/CompareVersionsModal.tsx`
- `frontend/src/pages/settings/BudgetConfiguration/modals/AuditLogModal.tsx`

**Acceptance Criteria:**
- [ ] Compare modal shows two version selectors
- [ ] Displays changes in table format
- [ ] Shows summary of changes
- [ ] Audit log shows all changes
- [ ] Filters work (entity type, user, date)
- [ ] Pagination works

**API Endpoints Used:**
- `GET /api/budget/audit-log`

---

### Phase 13: Integration Testing
**Owner:** @Frontend-Developer + User  
**Duration:** 4 hours  
**Dependencies:** Phase 12

**Test Scenarios:**

#### Scenario 1: Create Fiscal Year
1. Navigate to Budget Configuration
2. Create fiscal year 2027
3. Set as current
4. Verify in dropdown

#### Scenario 2: Create Budget Version
1. Select fiscal year 2026
2. Create new version V3
3. Copy from V2
4. Verify budget data copied

#### Scenario 3: Manage Product Budget
1. Select active version
2. Add product budget for FM
3. Set amount to 10,000 KEUR
4. Verify in tree

#### Scenario 4: Create Budget Lines
1. Select product budget
2. Add budget line "MNT"
3. Set amount to 5,000 KEUR
4. Add categories under MNT
5. Verify hierarchy in tree

#### Scenario 5: Transversal Budget Line
1. Create budget line "Services"
2. Check transversal
3. Add 2 product allocations (60%, 40%)
4. Verify validation
5. Save and verify 🔗 icon

#### Scenario 6: Version Comparison
1. Create V2 with different amounts
2. Open Compare Versions
3. Select V1 and V2
4. Verify changes displayed

#### Scenario 7: Audit Log
1. Make several changes
2. Open Audit Log
3. Verify all changes logged
4. Test filters

**Acceptance Criteria:**
- [ ] All scenarios pass
- [ ] No console errors
- [ ] API calls successful
- [ ] Data persists after refresh
- [ ] Validation works correctly

---

### Phase 14: User Acceptance Testing
**Owner:** User  
**Duration:** 1 day  
**Dependencies:** Phase 13

**Testing Checklist:**

**Fiscal Year Management:**
- [ ] Create fiscal year
- [ ] Set current fiscal year
- [ ] Switch between fiscal years

**Budget Version Management:**
- [ ] Create new version
- [ ] Copy from previous version
- [ ] Switch between versions
- [ ] View version history

**Budget Configuration:**
- [ ] Add product budgets
- [ ] Add budget lines
- [ ] Add categories
- [ ] Edit amounts
- [ ] Delete items (with validation)

**Transversal Budget:**
- [ ] Create transversal budget line
- [ ] Allocate across products
- [ ] Validate percentage sum
- [ ] View transversal indicator

**Validation & Warnings:**
- [ ] Warning when children exceed parent
- [ ] Error on invalid input
- [ ] Success messages on save

**Version Comparison:**
- [ ] Compare two versions
- [ ] View changes
- [ ] Export comparison

**Audit Log:**
- [ ] View all changes
- [ ] Filter by entity type
- [ ] Filter by user
- [ ] Filter by date
- [ ] Pagination works

**UI/UX:**
- [ ] Tree expands/collapses smoothly
- [ ] Progress bars display correctly
- [ ] Colors match utilization (green/yellow/red)
- [ ] Forms are intuitive
- [ ] Modals open/close properly
- [ ] Responsive on different screen sizes

---

## Technical Implementation Details

### Frontend Tech Stack
- **Framework:** React + TypeScript
- **UI Library:** Ant Design
- **State Management:** Redux Toolkit or React Context
- **API Client:** Axios
- **Tree Component:** Ant Design Tree or custom
- **Forms:** Ant Design Form + React Hook Form

### File Structure
```
frontend/src/pages/settings/BudgetConfiguration/
├── index.tsx                          # Main page
├── BudgetConfigurationLayout.tsx      # Layout component
├── components/
│   ├── FiscalYearSelector.tsx
│   ├── VersionSelector.tsx
│   ├── BudgetTree.tsx
│   ├── BudgetTreeNode.tsx
│   ├── BudgetContextMenu.tsx
│   ├── BudgetSummaryCard.tsx
│   └── TransversalAllocation.tsx
├── forms/
│   ├── ProductBudgetForm.tsx
│   ├── BudgetLineForm.tsx
│   └── BudgetCategoryForm.tsx
├── modals/
│   ├── CreateFiscalYearModal.tsx
│   ├── CreateVersionModal.tsx
│   ├── CompareVersionsModal.tsx
│   └── AuditLogModal.tsx
└── hooks/
    ├── useBudgetData.ts
    ├── useFiscalYear.ts
    └── useBudgetVersion.ts

frontend/src/services/
└── budgetConfigService.ts             # API client

frontend/src/store/slices/
└── budgetSlice.ts                     # Redux slice (if using Redux)
```

### API Integration
All endpoints are already implemented in backend:
- Base URL: `/api/budget`
- Authentication: TODO (currently using temp user ID)
- Error handling: Standard HTTP status codes
- Response format: JSON

### State Management Strategy
```typescript
interface BudgetState {
  currentFiscalYear: FiscalYear | null;
  activeVersion: BudgetVersion | null;
  budgetHierarchy: ProductBudget[];
  loading: boolean;
  error: string | null;
}
```

---

## Risk Assessment & Mitigation

### Risk 1: Complex Tree Rendering
**Impact:** High  
**Probability:** Medium  
**Mitigation:** 
- Use Ant Design Tree component
- Implement virtual scrolling for large trees
- Cache expanded state

### Risk 2: Transversal Budget Validation
**Impact:** Medium  
**Probability:** Low  
**Mitigation:**
- Real-time validation
- Clear error messages
- Visual feedback (red border, error text)

### Risk 3: Performance with Large Datasets
**Impact:** Medium  
**Probability:** Low  
**Mitigation:**
- Lazy loading
- Pagination for audit log
- Debounce search/filter inputs

---

## Success Criteria

### Functional Requirements
- [ ] All CRUD operations work for fiscal years, versions, products, lines, categories
- [ ] Transversal budget allocation works with validation
- [ ] Version comparison shows accurate changes
- [ ] Audit log displays all changes with filters
- [ ] Tree displays hierarchy correctly with utilization

### Non-Functional Requirements
- [ ] Page loads in < 2 seconds
- [ ] Tree renders smoothly with 100+ nodes
- [ ] No console errors or warnings
- [ ] Responsive on desktop, tablet, mobile
- [ ] Accessible (keyboard navigation, screen readers)

### User Experience
- [ ] Intuitive navigation
- [ ] Clear validation messages
- [ ] Smooth animations
- [ ] Consistent with existing UI patterns

---

## Timeline Summary

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 5: Database Migration | 5 min | None |
| Phase 6: Setup & Navigation | 2 hours | Phase 5 |
| Phase 7: Fiscal Year Management | 3 hours | Phase 6 |
| Phase 8: Budget Version Management | 3 hours | Phase 7 |
| Phase 9: Budget Tree Component | 4 hours | Phase 8 |
| Phase 10: Budget Forms | 5 hours | Phase 9 |
| Phase 11: Transversal Allocation | 4 hours | Phase 10 |
| Phase 12: Version Comparison & Audit | 3 hours | Phase 10 |
| Phase 13: Integration Testing | 4 hours | Phase 12 |
| Phase 14: User Acceptance Testing | 1 day | Phase 13 |

**Total Estimated Time:** 2-3 days (frontend) + 1 day (testing) = **3-4 days**

---

## Next Steps

### Immediate Actions:
1. **User:** Run database migration (Phase 5)
2. **@Frontend-Developer:** Start Phase 6 (Setup & Navigation)
3. **User:** Review and approve this implementation plan

### After Implementation:
1. Document any deviations from plan
2. Update implementation summary
3. Plan for Stage 2 (Budget Planning)
4. Plan for Stage 3 (Feature Linking)

---

## Future Enhancements (Out of Scope)

### Stage 2: Budget Planning
- Distribute allocated budget across quarters/PIs
- Plan vs. Actual comparison
- Budget forecasting

### Stage 3: Feature Linking
- Link features to budget lines/categories during JIRA import
- Calculate actual consumption from PI planning
- Budget utilization tracking per PI

### Stage 4: Alignment Dashboard
- Capacity-Budget-Demand alignment view
- Visual indicators for misalignment
- Recommendations for rebalancing

---

*Created: 2026-01-27*  
*Following: Agentic Workflow*
