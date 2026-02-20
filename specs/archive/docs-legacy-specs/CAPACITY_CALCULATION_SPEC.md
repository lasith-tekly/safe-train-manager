# Capacity Calculation Specification

**Status:** APPROVED  
**Version:** 2.0  
**Date:** 2026-01-27  
**Author:** @Backend-Architect

---

## 1. Overview

This specification defines the **official capacity calculation logic** for all team members across all teams in the Safe Train Manager application.

---

## 2. Core Formula

### 2.1 Sprint Iterations (Non-IP)

```
Step 1: Allocated Days = Working Days × Train Allocation
Step 2: Net Days = Allocated Days - Leave Days
Step 3: Capacity = Net Days × Available Capacity × Productivity
```

### 2.2 IP Iteration

```
Step 1: Allocated Days = Working Days × Train Allocation
Step 2: Net Days = Allocated Days - Leave Days
Step 3: Capacity = (Net Days × Available Capacity) - IP Week Deduction
```

**Note:** Productivity is NOT applied to IP iterations (configurable via `apply_productivity_to_ip` setting).

---

## 3. Key Principle

**Leave is deducted AFTER train allocation**, because leave is taken from the member's allocated time to this train, not from total working days.

### Example: Usha (50% Train Allocation) - Iteration 2

| Step | Calculation | Result |
|------|-------------|--------|
| Working Days | | 15 days |
| **Step 1:** Allocated Days | 15 × 0.50 | **7.5 days** |
| **Step 2:** Net Days | 7.5 - 0.5 (leave) | **7.0 days** |
| **Step 3:** Capacity | 7.0 × 1.00 × 0.80 | **5.60 days** |

---

## 4. Parameter Definitions

### 4.1 Working Days
- Weekdays (Mon-Fri) in the iteration period
- Excludes site-specific and global holidays
- Source: Calculated from `iterations.start_date` and `iterations.end_date`

### 4.2 Train Allocation (%)
- Percentage of time allocated to this train
- Source: `member_pi_allocations.train_allocation_percent`
- Default: 100%

### 4.3 Leave Days
- Total leave days for the member in this iteration
- Source: `member_leaves.leave_days` (summed per iteration)
- **Deduplication:** Records are deduplicated by (iteration_id, leave_days, leave_type)

### 4.4 Available Capacity (%)
- `Available Capacity = 1.0 - Agile Role Allocation`
- Source: `member_pi_allocations.agile_role_allocation_percent`
- Default: 100% (if no agile role)

### 4.5 Productivity (%)
- Priority order:
  1. Iteration-specific: `member_iteration_productivity.productivity_percent`
  2. Global: `global_settings.global_productivity_percentage`
- Default: 80%

### 4.6 IP Week Deduction (days)
- Fixed days deducted from IP iteration capacity
- Source: `member_pi_allocations.ip_week_deduction`
- Default: 0

---

## 5. Accumulated Productivity

Displayed in UI under member name:

```
Accumulated Productivity = Available Capacity × Average Sprint Productivity
```

Where Average Sprint Productivity = average of productivity across Iterations 1-4.

---

## 6. Backend Implementation

### 6.1 File Location
`backend/app/services/team_service.py`

### 6.2 Key Code Change

**BEFORE (incorrect):**
```python
net_days = max(0, iter_working_days - iter_leave_days)
iter_member_days = net_days * (train_alloc_pct / 100.0) * available_capacity_pct * iter_productivity
```

**AFTER (correct):**
```python
allocated_days = iter_working_days * (train_alloc_pct / 100.0)
net_days = max(0, allocated_days - iter_leave_days)
iter_member_days = net_days * available_capacity_pct * iter_productivity
```

### 6.3 Affected Functions
- `get_team_capacity_for_pi()` in `team_service.py`
- Any other capacity calculation functions

---

## 7. Validation Checklist

- [ ] Working days calculated correctly (excluding holidays)
- [ ] Train allocation applied FIRST
- [ ] Leave deducted AFTER train allocation
- [ ] Available capacity applied correctly
- [ ] Iteration-specific productivity used when available
- [ ] Global productivity used as fallback
- [ ] IP deduction applied only to IP iteration
- [ ] Productivity NOT applied to IP iteration
- [ ] Accumulated productivity calculated correctly
- [ ] Consistent logic across ALL teams and members

---

## 8. Supersedes

This specification supersedes:
- `CAPACITY_CALCULATION_ANALYSIS.md` (EXPIRED)
- `CAPACITY_CALCULATION_FIXES.md` (EXPIRED)
- `DEDUPLICATION_FIX_SUMMARY.md` (EXPIRED)
- `AGILE_ROLE_ALLOCATION_CORRECTION.md` (EXPIRED)

---

*Approved by: User (2026-01-27)*
