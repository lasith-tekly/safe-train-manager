# Dashboard Comparison: Train Capacity vs Team Capacity

## Overview

There are currently **two capacity dashboards** in the system that serve different purposes and show capacity data from different perspectives.

---

## 1. Train Capacity Dashboard

**Location:** Dashboard → Train Capacity  
**Purpose:** Shows **PI-level capacity** for the entire train (all teams) with iteration-by-iteration breakdown  
**Data Source:** `get_train_overview()` in `dashboard_service.py`

### What It Shows:
- **PI-based view** - Select a specific PI (e.g., PI 2026.1)
- **Iteration breakdown** - Shows capacity for each iteration (It1, It2, It3, It4, It5, IP)
- **Team rows** - Each team shows capacity per iteration
- **Productive capacity** - Applies productivity percentage and deducts PI planning days
- **Allocation categories** - Shows how capacity is allocated (Features, Defects, Enablers, etc.)
- **FTE calculation** - Based on train allocation percentages

### Calculation Method:
```
For each team member:
  1. Get working days in iteration (excluding holidays)
  2. Deduct leave days
  3. Apply train allocation % (e.g., 80% allocated to train)
  4. Apply productivity % (e.g., 80% productive)
  5. For IP iteration: Deduct PI planning days (e.g., 2 days)
  
Team Iteration Capacity = Sum of all member capacities
```

### Key Features:
- ✅ Considers holidays and leave
- ✅ Applies productivity factors
- ✅ Deducts PI planning overhead
- ✅ Shows iteration-level detail
- ✅ Real-time calculation based on team members

---

## 2. Team Capacity Dashboard

**Location:** Dashboard → Team Capacity  
**Purpose:** Shows **annual/quarterly capacity** for each team  
**Data Source:** `getTeams()` API with capacity data

### What It Shows:
- **Year-based view** - Select a year (e.g., 2026)
- **Quarterly breakdown** - Shows Q1, Q2, Q3, Q4 capacity
- **Team list** - Each team shows quarterly totals
- **Utilization %** - Shows how much capacity is used
- **Annual totals** - Aggregated capacity across all quarters

### Calculation Method:
```
For each team:
  - Q1, Q2, Q3, Q4 capacity values (stored in database)
  - Utilization % = (Allocated / Total) × 100
  - Annual Total = Q1 + Q2 + Q3 + Q4
```

### Key Features:
- ✅ High-level quarterly view
- ✅ Year-over-year comparison
- ✅ Utilization tracking
- ✅ Simple aggregated numbers
- ⚠️ May use pre-calculated/stored values

---

## Alignment Issue

### Problem:
The **Train Capacity Dashboard** figures don't align with the capacity shown in the **Teams** section.

### Root Cause:
These dashboards use **different calculation methods** and **different data sources**:

1. **Train Capacity Dashboard:**
   - Calculates capacity **dynamically** from team members
   - Uses **iteration-level** granularity
   - Applies **productivity factors** and **PI planning deductions**
   - Based on **actual working days** with holidays

2. **Team Capacity Dashboard:**
   - Uses **pre-calculated quarterly** capacity values
   - May be based on **different assumptions**
   - Doesn't necessarily apply same productivity factors
   - Quarterly aggregation may not match PI boundaries

### Why They Differ:

| Factor | Train Capacity | Team Capacity |
|--------|---------------|---------------|
| **Granularity** | Iteration-level | Quarterly |
| **Calculation** | Dynamic from members | Stored values |
| **Productivity** | Applied (80%) | May not be applied |
| **PI Planning** | Deducted (2 days) | Not deducted |
| **Holidays** | Considered | May not be considered |
| **Leave** | Deducted | May not be deducted |

---

## Recommendations

### Short-term Fix:
1. **Document the difference** - Make it clear these are different views
2. **Add tooltips** - Explain what each dashboard shows
3. **Rename if needed** - Consider clearer names like:
   - "PI Planning Dashboard" (instead of Train Capacity)
   - "Annual Capacity Overview" (instead of Team Capacity)

### Long-term Solution:
1. **Unify calculation logic** - Use the same method for both
2. **Single source of truth** - Calculate from team members consistently
3. **Store calculated values** - Cache results for performance
4. **Add reconciliation** - Show how quarterly maps to PIs

---

## Which Dashboard to Use?

### Use Train Capacity Dashboard when:
- Planning a specific PI
- Need iteration-level detail
- Want to see productivity-adjusted capacity
- Allocating work to teams for upcoming iterations

### Use Team Capacity Dashboard when:
- Looking at annual trends
- Comparing quarters
- High-level capacity planning
- Year-over-year analysis

---

## Technical Details

### Train Capacity Calculation:
```python
# From dashboard_service.py line 732-759
working_days = CalendarService.count_working_days(
    iteration.start_date, iteration.end_date, holiday_dates
)

for member in members:
    train_alloc = member.train_allocation_percent / 100.0
    leave_days = sum(leave_records)
    available_days = max(0, working_days - leave_days)
    member_capacity = available_days * train_alloc * train_productivity
    iter_capacity += member_capacity

if iteration.is_ip_iteration:
    iter_capacity -= pi_planning_days * train_alloc
```

### Team Capacity Data:
```typescript
// From TeamCapacity/index.tsx
const getAnnualCapacity = (capacity: Team['capacity']) => {
  const total = (capacity.q1?.total || 0) + (capacity.q2?.total || 0) + 
                (capacity.q3?.total || 0) + (capacity.q4?.total || 0);
  return { total, utilization };
};
```

---

## Action Items

1. ✅ Document the difference between dashboards
2. ⏳ Add explanatory text/tooltips to each dashboard
3. ⏳ Consider renaming dashboards for clarity
4. ⏳ Investigate if Team Capacity should use same calculation as Train Capacity
5. ⏳ Add reconciliation report showing how quarterly capacity maps to PIs

---

*Last Updated: 2026-01-27*
