# Capacity Calculation Fixes - Session Summary

## Overview
This document summarizes the capacity calculation bugs identified and fixed during the QA session on January 26, 2026.

---

## Agent Workflow Applied

Following the defined agent workflow:

```
@QA → Identified Issues → @Backend-Developer → Fixed Issues → @QA → Verified
```

---

## Issues Fixed

### 1. Working Days Not Net of Holidays

**QA Issue:** Working days card showed 75 days (raw count) instead of 71 days (net after holidays).

**Root Cause:** 
- PI Allocations endpoint was calculating raw Mon-Fri working days
- Holidays were counted but not deducted from the working days total

**Fix Applied:**
- File: `/backend/app/routes/pi_allocations.py`
- Changed calculation order to get holidays first, then exclude them from working days count
- Modified iteration working days calculation to: `if current.weekday() < 5 and current not in holiday_dates`

**Result:**
- Before: 75 working days (raw)
- After: 71 working days (net of 4 holidays)
- Breakdown: Iteration 1: 13d, Iteration 2: 14d, Iteration 3: 15d, Iteration 4: 20d, IP: 9d

**Commit:** `4f2b87b7`

---

### 2. Incorrect Train Productivity Multiplier

**QA Issue:** Alex's Iteration 1 showed 1.4 eD but should be 1.8 eD.

**Root Cause:**
- Line 439 in `team_service.py` set: `train_productivity = global_settings.global_productivity_percentage / 100.0`
- This applied global productivity (80%) at train level
- Member productivity was already applied via `pi_level_productivity`
- Result: Double application of productivity reduction

**Calculation:**
- Before: 9 days × **0.8** (train) × 1.0 × 0.2 (member) = 1.44 → 1.4 eD ❌
- After: 9 days × **1.0** (train) × 1.0 × 0.2 (member) = 1.8 eD ✓

**Fix Applied:**
- File: `/backend/app/services/team_service.py` (line 440)
- Changed: `train_productivity = 1.0` (no train-level override)
- Member-level productivity is correctly applied via `pi_level_productivity`

**Result:**
- Alex Iteration 1: 1.8 eD ✓
- Alex Iteration 2: 2.2 eD ✓
- All other members' capacities recalculated correctly

**Commit:** `57c2b869`

---

### 3. Missing Global Productivity Fallback

**QA Issue:** Mateusz's capacity showed 100% productivity instead of 80% global default.

**Root Cause:**
- Mateusz has `individual_productivity = None` (not set)
- PI allocation has `productivity_percent = None` (not set)
- Code defaulted to **1.0 (100%)** instead of falling back to global productivity

**Calculation:**
- Before: 10 days × 1.0 × **1.0** = 10.0 eD ❌ (should be 8.0)
- After: 10 days × 1.0 × **0.8** = 8.0 eD ✓

**Fix Applied:**
- File: `/backend/app/services/team_service.py` (lines 452-456)
- Changed fallback from `1.0` to `global_settings.global_productivity_percentage / 100.0`

**Productivity Hierarchy (Correct Order):**
1. Iteration-level override (if set) - highest priority
2. PI-level override (if set)
3. Individual member productivity (if set)
4. Global productivity (80%) ← This was missing, now fixed

**Result:**
- Mateusz Iteration 1: 8.0 eD ✓
- Mateusz Iteration 2: 12.0 eD ✓
- Mateusz Iteration 3: 10.4 eD ✓
- Mateusz Iteration 4: 16.0 eD ✓

**Commit:** `ea20c5b4`

---

## Global Impact

### Services Affected
All fixes were applied to the main capacity calculation service:
- **Primary:** `team_service.py` - `get_pi_capacity_detail()` method
- **Secondary:** `pi_allocations.py` - PI summary data endpoint

### Teams Verified
Fixes tested and verified across all teams:
- ✅ Big Bang (6 members)
- ✅ Black Hole (8 members)
- ✅ Nova (1 member)
- ✅ Milkyway (1 member)
- ✅ Sirius (0 members)
- ✅ Qasar (0 members)

---

## Capacity Calculation Formula (Corrected)

### Sprint Iterations
```
Capacity = Net Working Days × Train Allocation % × Productivity %

Where:
- Net Working Days = (Raw Mon-Fri days - Holidays - Member Leave)
- Train Allocation % = Member's train allocation (default 100%)
- Productivity % = Iteration override OR PI override OR Individual OR Global (80%)
```

### IP Iteration

**When `apply_productivity_to_ip = False` (current):**
```
Capacity = (Net Working Days × Train Allocation %) - IP Deduction

Where:
- IP Deduction = Member's ip_week_deduction OR Global pi_planning_days (3)
```

**When `apply_productivity_to_ip = True`:**
```
Capacity = (Net Working Days × Train Allocation % × Productivity %) - (IP Deduction × Productivity %)
```

---

## Testing Checklist

- [x] Alex (20% productivity) - Iteration 1: 1.8 eD ✓
- [x] Mateusz (80% global) - Iteration 1: 8.0 eD ✓
- [x] Aditya (50% productivity, PO) - All iterations correct ✓
- [x] Working days net of holidays - 71 days ✓
- [x] All Big Bang team members - Correct ✓
- [x] All Black Hole team members - Correct ✓
- [x] Other teams (Nova, Milkyway) - Correct ✓

---

## Deployment Status

- ✅ All fixes committed to `developer` branch
- ✅ Pushed to GitHub repository
- ✅ Ready for frontend refresh

**GitHub Commits:**
1. `4f2b87b7` - Working days net of holidays
2. `57c2b869` - Train productivity fix
3. `ea20c5b4` - Global productivity fallback

---

## Future Considerations

### Potential Enhancements
1. Add unit tests for capacity calculation edge cases
2. Create capacity calculation validation service
3. Add logging for productivity hierarchy resolution
4. Consider caching calculated capacities for performance

### Documentation Needed
1. Update API documentation with correct formulas
2. Add capacity calculation examples to user guide
3. Document productivity hierarchy in admin guide

---

## Agent Collaboration Notes

**@Product-Manager:** Requirements for capacity calculation are now correctly implemented according to SAFe principles.

**@Backend-Architect:** All capacity calculations now follow a consistent pattern across services. Consider extracting to a shared utility class.

**@Backend-Developer:** Fixes applied globally to `team_service.py`. All edge cases handled with proper fallbacks.

**@QA:** All identified issues verified and fixed. Capacity calculations now match expected values across all teams and scenarios.

**@Frontend-Developer:** No frontend changes required. API responses now return correct capacity values.

---

*Document created: January 26, 2026*
*Last updated: January 26, 2026*
