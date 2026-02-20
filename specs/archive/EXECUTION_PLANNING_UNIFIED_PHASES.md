# Execution Planning - Unified Phase Plan

**Created:** February 9, 2026
**Status:** Phase 1 & 2 Complete, Phase 3 Next

---

## Completed Phases

### ✅ Phase 1: Versioning (Complete)
- Version selector UI
- DRAFT/PUBLISHED states
- Read-only enforcement for published versions
- Create new version from existing

### ✅ Phase 2: Execution Planning Core (Complete)
- JIRA records CRUD (Create, Read, Update, Delete)
- ExecutionPlanningPanel drawer
- JiraRecordModal for add/edit
- Strategic vs Execution allocation display
- Gap/deviation warnings (basic)
- Panel width consistency (50%)

---

## Upcoming Phases

### 🔜 Phase 3: Spillover Tracking

**Goal:** Enable tracking of work that spills over from one PI to another.

**Features:**
1. **Spillover Status**
   - Mark JIRA record as SPILLOVER status
   - Select original PI (spillover_from_pi_id)
   - Enter spillover reason

2. **Spillover UI**
   - "Mark as Spillover" action button on JIRA records
   - Spillover modal with PI selection and reason input
   - Visual indicator (warning icon, different tag color) for spillover records
   - Tooltip showing spillover details

3. **Spillover Summary**
   - Count of spillover records per feature
   - Total spillover effort (eD)
   - Spillover breakdown by source PI

**Database:** Already has fields (spillover_from_pi_id, spillover_reason)

**API:** 
- POST /api/jira-records/{id}/spillover (already defined, needs implementation)

**Constraints:**
- ❌ NO changes to capacity modules
- ❌ NO changes to budget modules
- ✅ READ-ONLY from existing PI data

---

### 📋 Phase 4: Deviation Display

**Goal:** Enhanced visualization of strategic vs execution deviations.

**Features:**
1. **Per-PI Deviation**
   - Show deviation for each PI (e.g., PI 2026.1: +5 eD over)
   - Color coding: Green (within 5%), Yellow (5-15%), Red (>15%)

2. **Per-Team Breakdown**
   - Show effort allocation by team
   - READ from existing team data (no modifications)
   - Display team name and total planned effort

3. **Deviation Summary Panel**
   - Overall feature health indicator
   - List of warnings/issues
   - Recommendations (e.g., "Add more JIRA records to Q2")

4. **Visual Enhancements**
   - Progress bars per quarter
   - Comparison chart (strategic vs execution)
   - Trend indicators

**Constraints:**
- ❌ NO changes to capacity modules
- ❌ NO changes to budget modules
- ✅ READ-ONLY from existing quarterly allocations
- ✅ READ-ONLY from existing team data

---

### 📋 Phase 5: Team Assignments Page

**Goal:** Dedicated view for team-level JIRA assignments.

**Features:**
1. **Team-Centric View**
   - Select a team → see all JIRA records assigned
   - Filter by PI, status, feature
   - Group by feature or PI

2. **Team Workload Summary**
   - Total planned effort per PI
   - READ capacity from existing team capacity data
   - Show utilization (planned / capacity) - READ ONLY

3. **Navigation**
   - New menu item or sub-tab under Teams
   - Link from ExecutionPlanningPanel to Team view
   - Link from Team view to feature

**Constraints:**
- ❌ NO changes to capacity calculation logic
- ❌ NO changes to team capacity modules
- ✅ READ-ONLY from team capacity data
- ✅ Display only, no editing of capacity

---

### 📋 Phase 6: Team Planning (PO View)

**Goal:** Product Owner view for planning team work across features.

**Features:**
1. **PO Dashboard**
   - View assigned JIRA records for their team(s)
   - See upcoming PI workload
   - Identify capacity conflicts (READ-ONLY display)

2. **Cross-Feature View**
   - All features with work assigned to the team
   - Timeline/calendar view of work
   - Status overview (planned, in-progress, completed, spillover)

3. **Quick Actions**
   - Update JIRA record status
   - Add notes/comments
   - Flag issues

**Constraints:**
- ❌ NO changes to capacity modules
- ❌ NO changes to budget modules
- ✅ READ-ONLY from all existing data
- ✅ Only modify JIRA record status/notes

---

### 📋 Phase 7: Change Propagation

**Goal:** Handle cascading updates when strategic plan changes.

**Features:**
1. **Change Detection**
   - Detect when quarterly allocation changes
   - Detect when feature sizing changes
   - Alert if execution plan is affected

2. **Impact Analysis**
   - Show which JIRA records are impacted
   - Calculate new deviation
   - Highlight affected teams/PIs

3. **Reconciliation UI**
   - Suggest adjustments to JIRA records
   - Bulk update options
   - Audit trail of changes

**Constraints:**
- ❌ NO changes to how budget/capacity propagation works
- ✅ React to changes made elsewhere
- ✅ Update JIRA records to align with new plan

---

## Phase Priority & Dependencies
```
Phase 1 (Versioning) ──────────────────────────────────────► ✅ DONE
       │
       ▼
Phase 2 (Execution Core) ──────────────────────────────────► ✅ DONE
       │
       ▼
Phase 3 (Spillover Tracking) ──────────────────────────────► 🔜 NEXT
       │
       ▼
Phase 4 (Deviation Display) ───────────────────────────────► Planned
       │
       ▼
Phase 5 (Team Assignments Page) ───────────────────────────► Planned
       │
       ▼
Phase 6 (Team Planning - PO View) ─────────────────────────► Planned
       │
       ▼
Phase 7 (Change Propagation) ──────────────────────────────► Planned
```

---

## Key Constraints (All Phases)

### ❌ DO NOT Modify:
- Capacity planning modules
- Budget configuration modules
- Team capacity calculation
- PI planning modules
- Budget line allocation logic
- Quarterly allocation logic (in roadmap)

### ✅ CAN Do:
- READ from capacity data (display only)
- READ from budget data (display only)
- READ from team data (display only)
- CREATE/UPDATE/DELETE JIRA records
- ADD new tables/fields for execution tracking
- ADD new UI components for execution planning
- ADD new API endpoints for execution features

---

## Estimated Timeline

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 3: Spillover | 2-3 days | High |
| Phase 4: Deviation | 2-3 days | High |
| Phase 5: Team Assignments | 3-4 days | Medium |
| Phase 6: PO View | 3-4 days | Medium |
| Phase 7: Change Propagation | 4-5 days | Low |

---

## Next Action

**Phase 3: Spillover Tracking** - Ready to start!
