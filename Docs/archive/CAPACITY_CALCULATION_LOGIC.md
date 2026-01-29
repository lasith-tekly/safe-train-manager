# Capacity Calculation Logic - Complete Reference

**Status:** CURRENT  
**Version:** 2.0  
**Date:** 2026-01-27  
**Specification:** See `Docs/specs/CAPACITY_CALCULATION_SPEC.md` for official specification

## Overview

This document defines the **official capacity calculation logic** for all team members across all teams. This serves as the single source of truth for how capacity is calculated in the Safe Train Manager application.

> **Note:** Old documentation files have been archived to `Docs/archive/`. This document and `Docs/specs/CAPACITY_CALCULATION_SPEC.md` are the current sources of truth.

---

## 1. Core Formula

### 1.1 Sprint Iterations (Non-IP)

```
Step 1: Allocated Days = Working Days × Train Allocation
Step 2: Net Days = Allocated Days - Leave Days
Step 3: Capacity = Net Days × Available Capacity × Productivity

Where:
- Working Days = Weekdays in iteration (excluding holidays)
- Train Allocation = % of time allocated to this train
- Leave Days = Member's leave in this iteration
- Available Capacity = 1.0 - Agile Role Allocation
- Productivity = Iteration-Specific OR Global (see priority below)
```

**IMPORTANT:** Leave is deducted AFTER applying train allocation, because leave is taken from the member's allocated time to this train, not from total working days.

### 1.2 IP Iteration

```
Step 1: Allocated Days = Working Days × Train Allocation
Step 2: Net Days = Allocated Days - Leave Days
Step 3: Capacity = (Net Days × Available Capacity) - IP Week Deduction

Note: Productivity is NOT applied to IP iterations (apply_productivity_to_ip = 0)
```

---

## 2. Parameter Definitions

### 2.1 Working Days

Working days are calculated for each iteration based on:
- **Start Date** and **End Date** of the iteration
- **Weekdays only** (Monday to Friday)
- **Excluding holidays** (site-specific and global)

**PI 2026.1 Iteration Dates:**

| Iteration | Start Date | End Date | Working Days | Notes |
|-----------|------------|----------|--------------|-------|
| Iteration 1 | 2025-12-15 | 2026-01-02 | 12 days | Excludes Dec 25, 26, Jan 1 |
| Iteration 2 | 2026-01-05 | 2026-01-23 | 15 days | No holidays |
| Iteration 3 | 2026-01-26 | 2026-02-13 | 15 days | No holidays |
| Iteration 4 | 2026-02-16 | 2026-03-13 | 20 days | No holidays |
| IP | 2026-03-16 | 2026-03-27 | 10 days | No holidays |

**UK Holidays (PI 2026.1):**
- 2025-12-25 (Christmas Day)
- 2025-12-26 (Boxing Day)
- 2026-01-01 (New Year's Day)

### 2.2 Train Allocation (%)

The percentage of time a team member is allocated to this specific train/team.

- **100%** = Full-time on this train
- **50%** = Half-time on this train (e.g., shared between two trains)
- **90%** = 90% on this train, 10% on other activities

**Source:** `member_pi_allocations.train_allocation_percent`

### 2.3 Agile Role Allocation (%)

The percentage of time spent on agile ceremonies and facilitation duties (e.g., Scrum Master, Product Owner duties).

- **0%** = No agile role duties
- **10%** = 10% time on SM/PO duties
- **50%** = 50% time on agile role duties

**Available Capacity = 100% - Agile Role Allocation**

**Source:** `member_pi_allocations.agile_role_allocation_percent`

### 2.4 Productivity (%)

The productivity factor applied to sprint iterations. This can be:

1. **Iteration-Specific Productivity** (highest priority)
   - Source: `member_iteration_productivity.productivity_percent`
   - Can vary per iteration for ramping team members

2. **Global Productivity** (fallback)
   - Source: `global_settings.global_productivity_percentage`
   - Default: 80%

**Priority Order:**
1. Check `member_iteration_productivity` for this member + iteration
2. If not found, use `global_settings.global_productivity_percentage`

### 2.5 IP Week Deduction (days)

Fixed number of days deducted from IP iteration capacity for PI planning activities.

- **Source:** `member_pi_allocations.ip_week_deduction`
- **Default:** 0 if not set

### 2.6 Leave Days

Total leave days for a member in a specific iteration.

- **Source:** `member_leaves.leave_days` (summed per iteration)
- **Types:** VACATION, TRAINING, OTHER

**IMPORTANT:** Leave records may have duplicates. The system deduplicates by (iteration_id, leave_days, leave_type) before summing.

---

## 3. Accumulated Productivity

The **Accumulated Productivity** displayed in the UI is calculated as:

```
Accumulated Productivity = Available Capacity × Average Sprint Productivity

Where:
- Available Capacity = 1.0 - Agile Role Allocation
- Average Sprint Productivity = Average of productivity across all sprint iterations
```

**Example:**
- Agile Role Allocation = 10%
- Available Capacity = 90%
- Iteration Productivity = 80% (all iterations)
- Accumulated Productivity = 0.90 × 0.80 = 72%

---

## 4. Global Settings (2026)

| Setting | Value |
|---------|-------|
| Global Productivity | 80% |
| PI Planning Days | 3 |
| Apply Productivity to IP | No (0) |

---

## 5. Team Member Data (PI 2026.1)

### 5.1 Big Bang Team

| Member | Role | Train% | Agile% | Available% | IP Deduction | Iteration Productivity |
|--------|------|--------|--------|------------|--------------|------------------------|
| Aditya | PD | 90% | 50% | 50% | 5.0 days | Global (80%) |
| Alex | PD | 100% | 0% | 100% | 0.0 days | 20% (all iterations) |
| Ethan | DEVELOPER | 100% | 10% | 90% | 3.0 days | 40% (all iterations) |
| Mateusz | DEVELOPER | 100% | 10% | 90% | 3.0 days | Global (80%) |
| Usha | QA | 50% | 0% | 100% | 3.0 days | Global (80%) |
| Yuli | DEVELOPER | 100% | 0% | 100% | 3.0 days | Global (80%) |

**Leave Data (Big Bang):**

| Member | Iter 1 | Iter 2 | Iter 3 | Iter 4 | IP |
|--------|--------|--------|--------|--------|-----|
| Aditya | 0 | 0 | 2* | 0 | 3* |
| Alex | 3 | 4 | 0 | 0 | 0 |
| Ethan | 6.5 | 0 | 5 | 0 | 0 |
| Mateusz | 2* | 0 | 0 | 0 | 3 |
| Usha | 2 | 0.5 | 0 | 0.5 | 0 |
| Yuli | 5 | 2 | 0 | 1 | 0 |

*Note: Values marked with * have duplicate records in database. After deduplication: Aditya Iter3=2, Aditya IP=3, Mateusz Iter1=2

### 5.2 Black Hole Team

| Member | Role | Train% | Agile% | Available% | IP Deduction | Iteration Productivity |
|--------|------|--------|--------|------------|--------------|------------------------|
| Angela Acevedo | PD | 100% | 0% | 100% | 3.0 days | Global (80%) |
| Bryan TABARES | DEVELOPER | 100% | 0% | 100% | 3.0 days | Global (80%) |
| Camilo De Los Rios | QA | N/A | N/A | N/A | N/A | 45%→50%→55%→60% |
| Cristian HENAO | DEVELOPER | 100% | 0% | 100% | 3.0 days | 50%→55%→60%→65% |
| Daniel MORENO | PD | 100% | 0% | 100% | 3.0 days | Global (80%) |
| Fernanda Salinas | PD | 100% | 0% | 100% | 3.0 days | 40%→45%→50%→55% |
| JUAN PAEZ | DEVELOPER | 100% | 0% | 100% | 0.0 days | Global (80%) |
| Juan CLAVIJO | DEVELOPER | 100% | 0% | 100% | 0.0 days | 45%→50%→55%→60% |

**Leave Data (Black Hole):**

| Member | Iter 1 | Iter 2 | Iter 3 | Iter 4 | IP |
|--------|--------|--------|--------|--------|-----|
| Angela Acevedo | 2 | 2 | 3 | 1 | 5 |
| Bryan TABARES | 11 | 4 | 3 | 3 | 1 |
| Camilo De Los Rios | 1 | 1 | 2 | 0 | 1 |
| Cristian HENAO | 1 | 1 | 0 | 0 | 1 |
| Daniel MORENO | 2 | 3 | 3 | 2 | 1 |
| Fernanda Salinas | 2 | 2 | 3 | 3 | 1 |
| JUAN PAEZ | 0 | 1 | 0 | 0 | 1 |
| Juan CLAVIJO | 1 | 1 | 0 | 0 | 1 |

### 5.3 Milkyway Team

| Member | Role | Train% | Agile% | Available% | IP Deduction | Iteration Productivity |
|--------|------|--------|--------|------------|--------------|------------------------|
| Harsha | DEVELOPER | 100% | 0% | 100% | 3.0 days | Global (80%) |

**Leave Data (Milkyway):**

| Member | Iter 1 | Iter 2 | Iter 3 | Iter 4 | IP |
|--------|--------|--------|--------|--------|-----|
| Harsha | 1 | 0 | 2 | 0 | 0 |

### 5.4 Nova Team

| Member | Role | Train% | Agile% | Available% | IP Deduction | Iteration Productivity |
|--------|------|--------|--------|------------|--------------|------------------------|
| Vipin Raj | DEVELOPER | 100% | 0% | 100% | 3.0 days | Global (80%) |

**Leave Data (Nova):**

| Member | Iter 1 | Iter 2 | Iter 3 | Iter 4 | IP |
|--------|--------|--------|--------|--------|-----|
| Vipin Raj | 2 | 2 | 0 | 0 | 2 |

---

## 6. Calculation Examples

### 6.1 Example: Usha (Big Bang) - Iteration 2

**Parameters:**
- Working Days: 15
- Train Allocation: 50%
- Leave: 0.5 days
- Agile Role: 0%
- Available Capacity: 100%
- Productivity: 80% (global)

**Calculation:**
```
Step 1: Allocated Days = 15 × 0.50 = 7.5 days
Step 2: Net Days = 7.5 - 0.5 = 7.0 days
Step 3: Capacity = 7.0 × 1.00 × 0.80 = 5.60 days
```

### 6.2 Example: Alex (Big Bang) - Iteration 2

**Parameters:**
- Working Days: 15
- Train Allocation: 100%
- Leave: 4 days
- Agile Role: 0%
- Available Capacity: 100%
- Productivity: 20% (iteration-specific)

**Calculation:**
```
Step 1: Allocated Days = 15 × 1.00 = 15 days
Step 2: Net Days = 15 - 4 = 11 days
Step 3: Capacity = 11 × 1.00 × 0.20 = 2.20 days
```

### 6.3 Example: Ethan (Big Bang) - Iteration 1

**Parameters:**
- Working Days: 12
- Train Allocation: 100%
- Leave: 6.5 days
- Agile Role: 10%
- Available Capacity: 90%
- Productivity: 40% (iteration-specific)

**Calculation:**
```
Step 1: Allocated Days = 12 × 1.00 = 12 days
Step 2: Net Days = 12 - 6.5 = 5.5 days
Step 3: Capacity = 5.5 × 0.90 × 0.40 = 1.98 days
```

### 6.4 Example: Aditya (Big Bang) - IP Iteration

**Parameters:**
- Working Days: 10
- Train Allocation: 90%
- Leave: 3 days (after deduplication)
- Agile Role: 50%
- Available Capacity: 50%
- IP Deduction: 5.0 days

**Calculation:**
```
Step 1: Allocated Days = 10 × 0.90 = 9 days
Step 2: Net Days = 9 - 3 = 6 days
Step 3: Capacity = (6 × 0.50) - 5.0 = 3.0 - 5.0 = -2.0 → 0.00 days (capped at 0)
```

---

## 7. Expected Capacity Values (Big Bang Team)

### After Deduplication Fix:

| Member | Iter 1 | Iter 2 | Iter 3 | Iter 4 | IP | Total | Accum% |
|--------|--------|--------|--------|--------|-----|-------|--------|
| Aditya | 4.32 | 5.40 | 4.68 | 7.20 | 0.00 | 21.60 | 40% |
| Alex | 1.80 | 2.20 | 3.00 | 4.00 | 10.00 | 21.00 | 20% |
| Ethan | 1.98 | 5.40 | 3.60 | 7.20 | 6.10 | 24.28 | 36% |
| Mateusz | 7.20 | 10.80 | 10.80 | 14.40 | 3.30 | 46.50 | 72% |
| Usha | 4.00 | 5.80 | 6.00 | 7.80 | 5.00 | 28.60 | 40% |
| Yuli | 5.60 | 10.40 | 12.00 | 15.20 | 7.00 | 50.20 | 80% |

---

## 8. Implementation Notes

### 8.1 Deduplication Logic

The backend deduplicates leave records before summing:

```python
# Deduplicate leave records by (iteration_id, leave_days, leave_type)
seen_leaves = {}
for leave in iteration_leaves:
    key = (leave.iteration_id, leave.leave_days, leave.leave_type)
    if key not in seen_leaves:
        seen_leaves[key] = leave

# Sum deduplicated leave days per iteration
for leave in seen_leaves.values():
    member_leaves_by_iter[leave.iteration_id] += leave.leave_days or 0
```

### 8.2 Backend Code Location

- **Capacity Calculation:** `backend/app/services/team_service.py` (lines 467-550)
- **Leave Deduplication:** `backend/app/services/team_service.py` (lines 474-486)

### 8.3 Database Tables

- `team_members` - Member basic info
- `member_pi_allocations` - Train allocation, agile role, IP deduction
- `member_iteration_productivity` - Iteration-specific productivity overrides
- `member_leaves` - Leave records per iteration
- `iterations` - Iteration dates and IP flag
- `global_settings` - Global productivity and settings
- `holidays` - Holiday dates

---

## 9. Validation Checklist

Before confirming capacity calculations are correct, verify:

- [ ] Working days calculated correctly (excluding weekends and holidays)
- [ ] Leave days summed correctly (after deduplication)
- [ ] Train allocation applied correctly
- [ ] Agile role allocation subtracted from available capacity
- [ ] Iteration-specific productivity used when available
- [ ] Global productivity used as fallback
- [ ] IP deduction applied only to IP iteration
- [ ] Productivity NOT applied to IP iteration
- [ ] Accumulated productivity calculated correctly

---

## 10. Change Log

| Date | Change |
|------|--------|
| 2026-01-27 | Added deduplication logic for leave records |
| 2026-01-27 | Corrected Usha train allocation to 50% |
| 2026-01-27 | Corrected Ethan agile role to 10% |
| 2026-01-27 | Created comprehensive calculation documentation |

---

*Last Updated: 2026-01-27*
