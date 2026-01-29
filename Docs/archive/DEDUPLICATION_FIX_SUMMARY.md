# Leave Deduplication Fix - Summary

## Problem Identified

The database contained duplicate leave records for some team members, causing inflated leave totals and incorrect capacity calculations.

### Duplicate Records Found:
- **Aditya Iteration 3:** 4 duplicate entries of 2 days each = 8 days total (should be 2)
- **Aditya IP:** 2 duplicate entries of 3 days each = 6 days total (should be 3)
- **Mateusz Iteration 1:** 2 duplicate entries of 2 days each = 4 days total (should be 2)

## Solution Implemented

Added deduplication logic in `backend/app/services/team_service.py` (lines 467-486):

```python
# Get member leaves per iteration with deduplication
member_leaves_by_iter = {}
iteration_leaves = db.query(MemberLeave).filter(
    MemberLeave.member_id == member.id,
    MemberLeave.iteration_id.in_([it.id for it in iterations])
).all()

# Deduplicate leave records by iteration_id and leave_days
# This prevents duplicate entries from inflating leave totals
seen_leaves = {}
for leave in iteration_leaves:
    key = (leave.iteration_id, leave.leave_days, leave.leave_type)
    if key not in seen_leaves:
        seen_leaves[key] = leave

# Sum deduplicated leave days per iteration
for leave in seen_leaves.values():
    if leave.iteration_id not in member_leaves_by_iter:
        member_leaves_by_iter[leave.iteration_id] = 0
    member_leaves_by_iter[leave.iteration_id] += leave.leave_days or 0
```

## Expected Capacity Values After Fix

### Working Days per Iteration (with UK holidays):
- **Iteration 1:** 12 days (Dec 15, 2025 - Jan 2, 2026)
- **Iteration 2:** 15 days (Jan 5 - Jan 23, 2026)
- **Iteration 3:** 15 days (Jan 26 - Feb 13, 2026)
- **Iteration 4:** 20 days (Feb 16 - Mar 13, 2026)
- **IP:** 10 days (Mar 16 - Mar 27, 2026)

### Team Member Capacities:

| Member | Iter 1 | Iter 2 | Iter 3 | Iter 4 | IP | Total | Accum Prod |
|--------|--------|--------|--------|--------|-----|-------|------------|
| **Aditya** | 4.32 | 5.40 | 4.68 | 7.20 | 0.00 | **21.60** | 40% |
| **Mateusz** | 7.20 | 10.80 | 10.80 | 14.40 | 3.30 | **46.50** | 72% |
| **Alex** | 1.80 | 2.20 | 3.00 | 4.00 | 10.00 | **21.00** | 20% |
| **Ethan** | 2.20 | 6.00 | 4.00 | 8.00 | 7.00 | **27.20** | 40% |
| **Usha** | 8.00 | 11.60 | 12.00 | 15.60 | 10.00 | **57.20** | 80% |
| **Yuli** | 5.60 | 10.40 | 12.00 | 15.20 | 10.00 | **53.20** | 80% |

### Key Changes from Deduplication:

**Aditya:**
- Iteration 3: **4.68 days** (was 2.52 with duplicates)
- Total: **21.60 days** (was 19.44)

**Mateusz:**
- Iteration 1: **7.20 days** (was 5.76 with duplicates)
- Total: **46.50 days** (was 45.06)

## Capacity Calculation Formula

### Sprint Iterations (1-4):
```
Capacity = Net Days × Train Allocation × Available Capacity × Productivity

Where:
- Net Days = Working Days - Leave Days
- Available Capacity = 1.0 - Agile Role Allocation
- Productivity = Iteration-specific OR Individual OR Global (80%)
```

### IP Iteration:
```
Capacity = (Net Days × Train Allocation × Available Capacity) - IP Deduction

Note: NO productivity multiplier applied to IP iterations
```

## Verification Steps

1. **Backend restarted** with deduplication fix
2. **Frontend should be refreshed** to pick up new capacity values
3. **Expected behavior:**
   - Leave data displays correctly (no inflated values)
   - Capacity calculations match expected values above
   - All team members processed consistently

## Member-Specific Details

### Aditya (PD)
- Train Allocation: 90%
- Agile Role: 50% (PO duties)
- Available Capacity: 50%
- Productivity: 80%
- **Accumulated Productivity: 40%**
- IP Deduction: 5.0 days
- **Leave:** Iteration 3 = 2 days, IP = 3 days

### Mateusz (DEVELOPER)
- Train Allocation: 100%
- Agile Role: 10% (SM duties)
- Available Capacity: 90%
- Productivity: 80%
- **Accumulated Productivity: 72%**
- IP Deduction: 3.0 days
- **Leave:** Iteration 1 = 2 days, IP = 3 days

### Alex (PD)
- Train Allocation: 100%
- Agile Role: 0%
- Available Capacity: 100%
- **Iteration Productivity: 20%** (all sprint iterations)
- **Accumulated Productivity: 20%**
- IP Deduction: 0.0 days
- **Leave:** Iteration 1 = 3 days, Iteration 2 = 4 days

### Ethan (DEVELOPER)
- Train Allocation: 100%
- Agile Role: 0%
- Available Capacity: 100%
- **Iteration Productivity: 40%** (all sprint iterations)
- **Accumulated Productivity: 40%**
- IP Deduction: 3.0 days
- **Leave:** Iteration 1 = 6.5 days, Iteration 3 = 5.0 days

### Usha (QA)
- Train Allocation: 100%
- Agile Role: 0%
- Available Capacity: 100%
- Productivity: 80%
- **Accumulated Productivity: 80%**
- IP Deduction: 0.0 days
- **Leave:** Iteration 1 = 2 days, Iteration 2 = 0.5 days, Iteration 4 = 0.5 days

### Yuli (DEVELOPER)
- Train Allocation: 100%
- Agile Role: 0%
- Available Capacity: 100%
- Productivity: 80%
- **Accumulated Productivity: 80%**
- IP Deduction: 0.0 days
- **Leave:** Iteration 1 = 5 days, Iteration 2 = 2 days, Iteration 4 = 1 day

## Implementation Notes

1. **Deduplication is applied consistently to ALL team members** - not selective
2. **Logic runs for every member** in the capacity calculation loop
3. **Deduplication key:** (iteration_id, leave_days, leave_type)
4. **Only unique combinations** are counted
5. **Backend code location:** `backend/app/services/team_service.py` lines 467-486

## Testing Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Navigate to Setup → Teams → Big bang → PI Allocations
- [ ] Verify Aditya's Iteration 3 capacity shows ~4.68 days
- [ ] Verify Mateusz's Iteration 1 capacity shows ~7.20 days
- [ ] Verify all accumulated productivity percentages display correctly
- [ ] Verify leave data shows correct values (not inflated)
- [ ] Verify total PI capacity for each member matches expected values

## Status

✅ **Deduplication logic implemented**  
✅ **Backend restarted with fix**  
⏳ **User to verify in UI**

---

*Last Updated: 2026-01-27*
