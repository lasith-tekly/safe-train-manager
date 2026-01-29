# Budget Dashboard - Implementation Plan

**Document Version:** 1.0  
**Date:** 2026-01-27  
**Status:** IN PROGRESS

---

## Implementation Phases

Following the Agent Orchestration Guide workflow:
```
PM → Designer → Backend Arch → DB Arch → Backend Dev → Frontend Dev → QA
```

---

## Phase 1: Product Manager ✅

**Status:** COMPLETED

**Deliverables:**
- ✅ Requirements specification: `Docs/specs/requirements/BUDGET_DASHBOARD.md`
- ✅ Implementation plan: This document

**Key Requirements Summary:**
1. Separate dashboard under Dashboard navigation
2. Line chart visualization (Target vs Actual/Forecast)
3. PI-level budget planning and forecasting
4. Data source: PI Planning module (to be implemented)

---

## Phase 2: UI Designer

**Status:** PENDING

**Tasks:**
- [ ] Design dashboard layout and navigation
- [ ] Design line chart component specifications
- [ ] Design metric cards for dashboard
- [ ] Design product/budget line selector UI
- [ ] Create visual design specification document

**Deliverables:**
- UI design specification document
- Component wireframes
- Interaction states

---

## Phase 3: Backend Architect

**Status:** PENDING

**Tasks:**
- [ ] Design API endpoint structure
- [ ] Define request/response schemas
- [ ] Design PIBudgetPlan data model
- [ ] Define business logic services
- [ ] Plan integration with existing budget models

**Deliverables:**
- API design document
- Schema definitions
- Service layer architecture

---

## Phase 4: Database Architect

**Status:** PENDING

**Tasks:**
- [ ] Create PIBudgetPlan SQLAlchemy model
- [ ] Define relationships with BudgetLine and PI entities
- [ ] Create Alembic migration script
- [ ] Add necessary indexes
- [ ] Update existing models if needed

**Deliverables:**
- SQLAlchemy model implementation
- Migration script
- Relationship documentation

---

## Phase 5: Backend Developer

**Status:** PENDING

**Tasks:**
- [ ] Implement dashboard API endpoints
- [ ] Create budget calculation services
- [ ] Implement target calculation logic
- [ ] Implement forecast calculation logic
- [ ] Add validation and error handling

**Endpoints to Implement:**
1. `GET /api/budget/dashboard/products?fiscal_year_id={id}`
2. `GET /api/budget/dashboard/product/{product_id}`
3. `GET /api/budget/dashboard/line/{line_id}`
4. `GET /api/budget/dashboard/line/{line_id}/chart-data`

**Deliverables:**
- Complete API implementation
- Service layer code
- API documentation

---

## Phase 6: Frontend Developer

**Status:** PENDING

**Tasks:**
- [ ] Create Budget Dashboard route and navigation
- [ ] Implement line chart component (using recharts or @ant-design/charts)
- [ ] Create product/budget line selector
- [ ] Implement metric cards
- [ ] Create dashboard service layer
- [ ] Integrate with backend APIs

**Components to Create:**
1. `BudgetDashboard.tsx` - Main dashboard page
2. `BudgetLineChart.tsx` - Dual-line chart component
3. `DashboardMetrics.tsx` - Metric cards
4. `ProductSelector.tsx` - Product selection dropdown
5. `BudgetLineSelector.tsx` - Budget line selection

**Deliverables:**
- Complete dashboard UI
- Chart visualization
- API integration

---

## Phase 7: QA Engineer

**Status:** PENDING

**Tasks:**
- [ ] Test target calculation logic
- [ ] Test forecast calculation logic
- [ ] Test chart data rendering
- [ ] Test product/budget line selection
- [ ] Test edge cases (no data, single PI, etc.)
- [ ] Integration testing

**Test Scenarios:**
1. View dashboard with multiple products
2. Select product and view budget lines
3. Select budget line and view chart
4. Verify target calculation accuracy
5. Verify forecast calculation accuracy
6. Test with different fiscal year configurations

**Deliverables:**
- Test suite
- Test results documentation
- Bug reports (if any)

---

## Dependencies

### External Dependencies
- PI Planning module (for actual planned amounts)
- Fiscal Year configuration (for PI/iteration counts)

### Internal Dependencies
- Budget Configuration (existing)
- Product management (existing)
- Budget Line management (existing)

---

## Data Flow

```
Budget Configuration
    ↓
Budget Lines (Allocated amounts)
    ↓
Dashboard Calculations
    ├── Target: Based on iteration distribution
    ├── Planned: From PI Planning (future)
    └── Forecast: Based on remaining budget
    ↓
Line Chart Visualization
```

---

## Implementation Notes

### Phase 1 Implementation (MVP)
Since PI Planning is not yet implemented, Phase 1 will show:
- ✅ Target line (calculated from iterations)
- ⚠️ Planned line will be 0 (no PI Planning data)
- ⚠️ Forecast line will show full budget distributed

### Phase 2 Implementation (Full Feature)
Once PI Planning is implemented:
- ✅ Target line (calculated)
- ✅ Planned line (from PI Planning actuals)
- ✅ Forecast line (calculated from remaining)

---

## Calculation Examples

### Target Calculation
```python
def calculate_pi_target(budget_allocation, pi_iterations, total_iterations):
    return budget_allocation * (pi_iterations / total_iterations)

# Example:
# Budget: 1000 KEUR
# Q1: 4 iterations, Q2: 3, Q3: 4, Q4: 3 (Total: 14)
# Q1 Target = 1000 * (4/14) = 285.7 KEUR
```

### Forecast Calculation
```python
def calculate_pi_forecast(remaining_budget, pi_iterations, remaining_iterations):
    return remaining_budget * (pi_iterations / remaining_iterations)

# Example (after Q1 with 500 KEUR planned):
# Remaining: 500 KEUR
# Remaining iterations: 3+4+3 = 10
# Q2 Forecast = 500 * (3/10) = 150 KEUR
```

---

## Success Criteria

- [ ] Dashboard accessible from Dashboard navigation
- [ ] Line chart displays target allocation correctly
- [ ] Calculations match specification formulas
- [ ] UI is responsive and follows design system
- [ ] API responses are performant (<500ms)
- [ ] All tests pass

---

## Timeline Estimate

| Phase | Estimated Time | Status |
|-------|---------------|--------|
| Phase 1: PM | 1 hour | ✅ DONE |
| Phase 2: UI Designer | 2 hours | PENDING |
| Phase 3: Backend Arch | 2 hours | PENDING |
| Phase 4: DB Arch | 2 hours | PENDING |
| Phase 5: Backend Dev | 4 hours | PENDING |
| Phase 6: Frontend Dev | 4 hours | PENDING |
| Phase 7: QA | 2 hours | PENDING |
| **Total** | **17 hours** | |

---

## Next Steps

1. ✅ Complete Phase 1 (PM) - DONE
2. ⏭️ Start Phase 2 (UI Designer) - Design dashboard UI
3. Continue through phases sequentially

---

*Implementation Plan Created: 2026-01-27*
*Last Updated: 2026-01-27*
