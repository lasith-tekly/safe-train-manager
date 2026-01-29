# CRITICAL CORRECTION: Agile Role Allocation Logic

## ❌ Original (INCORRECT) Understanding

**Formula:**
```
Capacity = net_days × Train Allocation × Agile Role Allocation × Productivity
```

**Example:** PO with 60% Agile Role Allocation
- Capacity = 10 days × 100% × 60% × 70% = 4.2 days
- **WRONG:** This allocated 60% TO train capacity

---

## ✅ Corrected Understanding

**Formula:**
```
Capacity = net_days × Train Allocation × (100% - Agile Role Allocation) × Productivity
```

**Example:** PO with 60% Agile Role Allocation
- Capacity = 10 days × 100% × (100% - 60%) × 70% = 2.8 days
- **CORRECT:** 60% is DEDUCTED from capacity (time spent on PO duties)

---

## 🎯 Key Concept

**Agile Role Allocation % = Time spent on agile role duties (SM/PO) that REDUCES train capacity**

- **0%** = No agile role duties → Full capacity available for train work (regular developers)
- **60%** = 60% time on PO duties → Only 40% capacity available for train work
- **80%** = 80% time on SM duties → Only 20% capacity available for train work

---

## 📊 Corrected Examples

### Regular Developer
- Agile Role Allocation: **0%**
- Capacity: 10 × 100% × (100% - 0%) × 70% = **7.0 days**
- Interpretation: Full capacity for train work

### Product Owner
- Agile Role Allocation: **60%**
- Capacity: 10 × 100% × (100% - 60%) × 70% = **2.8 days**
- Interpretation: 60% time on PO duties, 40% available for train work

### Scrum Master
- Agile Role Allocation: **80%**
- Capacity: 10 × 100% × (100% - 80%) × 85% = **1.7 days**
- Interpretation: 80% time on SM duties, 20% available for train work

---

## 🔧 Implementation Impact

### Backend Calculation (team_service.py)
```python
# CORRECT formula:
agile_role_pct = pi_allocation.agile_role_allocation_percent / 100.0
available_capacity_pct = 1.0 - agile_role_pct  # Subtract from 100%

iter_member_days = net_days * (train_alloc_pct / 100.0) * available_capacity_pct * productivity
```

### UI Label
- Field name: "Agile Role Allocation"
- Description: "Percentage of time spent on agile role duties (SM/PO) - reduces train capacity"
- Default: 0% (no deduction)
- Range: 0-100%

---

## ✅ Status

- Design document corrected: `NEW_PRODUCTIVITY_SYSTEM_DESIGN.md`
- All 5 examples updated with correct formula
- Ready to proceed with Phase 2 implementation
