# Capacity Calculation Logic - Requirements vs Implementation Analysis

## Your Requirements

### 1. Team Capacity = Sum of Individual Capacity ✅
**Status:** ALIGNED

### 2. Individual Capacity = Iteration Capacities + IP Week Capacity ✅
**Status:** ALIGNED

### 3. Iteration Capacity Formula
**Requirement:**
```
Iteration Capacity = (# of working days - (site holidays + individual holidays)) 
                     × Train Allocation 
                     × Productivity
```

**Current Implementation (Line 534):**
```python
iter_member_days = net_days * train_productivity * (train_alloc_pct / 100.0) * iter_productivity
```

Where:
- `net_days = working_days - site_holidays - individual_holidays`
- `train_productivity = 1.0` (not used correctly)
- `train_alloc_pct` = Train Allocation %
- `iter_productivity` = Productivity %

**Status:** ⚠️ **MISALIGNMENT FOUND**

**Issue:** The code multiplies by `train_productivity` which is hardcoded to `1.0` (line 440). This variable name is misleading - it should not be in the formula at all.

**Correct Formula Should Be:**
```python
iter_member_days = net_days * (train_alloc_pct / 100.0) * iter_productivity
```

---

### 4. Productivity Hierarchy ✅
**Requirement:**
1. If iteration-level productivity exists → Use it
2. Else if PI-level productivity exists → Use it
3. Else if individual productivity exists → Use it
4. Else → Use global productivity

**Current Implementation (Lines 452-456, 509-510):**
```python
# PI-level productivity calculation
pi_level_productivity = (
    (pi_allocation.productivity_percent / 100.0) if pi_allocation and pi_allocation.productivity_percent 
    else (member.individual_productivity / 100.0 if member.individual_productivity 
          else global_settings.global_productivity_percentage / 100.0)
)

# Iteration-level override
iter_productivity = iter_productivity_map.get(iteration.id, pi_level_productivity)
```

**Status:** ✅ **ALIGNED**

---

### 5. No Productivity at PI Allocation Level → Use Global ✅
**Status:** ALIGNED (covered in hierarchy above)

---

### 6. IP Weeks Productivity Setting
**Requirement:**
- If `apply_productivity_to_ip` is **unchecked** → Do NOT apply productivity
- If `apply_productivity_to_ip` is **checked** → Apply productivity

**Current Implementation (Lines 516-526):**
```python
if apply_productivity_to_ip:
    # IP WITH productivity
    iter_member_days = net_days * train_productivity * (train_alloc_pct / 100.0) * iter_productivity
    planning_deduction = effective_ip_deduction * train_productivity * (train_alloc_pct / 100.0) * iter_productivity
else:
    # IP WITHOUT productivity - raw days × train allocation only
    iter_member_days = net_days * (train_alloc_pct / 100.0)
    planning_deduction = effective_ip_deduction
```

**Status:** ⚠️ **MISALIGNMENT FOUND**

**Issues:**
1. When `apply_productivity_to_ip = True`, it multiplies by `train_productivity` (which is 1.0, but shouldn't be there)
2. When `apply_productivity_to_ip = False`, the formula is correct: `net_days * train_alloc_pct`

---

## Summary of Misalignments

### Issue 1: Unnecessary `train_productivity` Variable
**Location:** Lines 440, 518, 520, 534

**Problem:**
```python
train_productivity = 1.0  # Line 440 - hardcoded, not used correctly
```

This variable is multiplied in the formulas but is always 1.0, making it redundant. It should be removed from all calculations.

**Impact:** 
- Currently no impact (since it's 1.0)
- But it's confusing and could cause bugs if someone tries to use it

**Fix Required:**
Remove `train_productivity` from all formulas:

**Sprint Iterations (Line 534):**
```python
# CURRENT (WRONG):
iter_member_days = net_days * train_productivity * (train_alloc_pct / 100.0) * iter_productivity

# SHOULD BE:
iter_member_days = net_days * (train_alloc_pct / 100.0) * iter_productivity
```

**IP Iterations with Productivity (Line 518):**
```python
# CURRENT (WRONG):
iter_member_days = net_days * train_productivity * (train_alloc_pct / 100.0) * iter_productivity

# SHOULD BE:
iter_member_days = net_days * (train_alloc_pct / 100.0) * iter_productivity
```

**IP Iterations without Productivity (Line 523):**
```python
# CURRENT (CORRECT):
iter_member_days = net_days * (train_alloc_pct / 100.0)

# This one is already correct!
```

---

## Verification Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| 1. Team Capacity = Sum of Individual | ✅ Aligned | Lines 558-576 |
| 2. Individual = Iterations + IP | ✅ Aligned | Lines 492-556 |
| 3. Iteration Formula | ⚠️ Fix Needed | Remove `train_productivity` |
| 4. Productivity Hierarchy | ✅ Aligned | Lines 452-456, 509-510 |
| 5. No PI Productivity → Global | ✅ Aligned | Part of hierarchy |
| 6. IP Weeks Productivity Setting | ⚠️ Fix Needed | Remove `train_productivity` |

---

## Recommended Fix

Remove the `train_productivity` variable and update all capacity calculations to use the correct formula:

**For Sprint Iterations:**
```
Capacity = (Working Days - Holidays - Leaves) × Train Allocation % × Productivity %
```

**For IP Weeks (when apply_productivity_to_ip = True):**
```
Capacity = (Working Days - Holidays - Leaves) × Train Allocation % × Productivity %
         - (IP Deduction Days × Train Allocation % × Productivity %)
```

**For IP Weeks (when apply_productivity_to_ip = False):**
```
Capacity = (Working Days - Holidays - Leaves) × Train Allocation %
         - IP Deduction Days
```
