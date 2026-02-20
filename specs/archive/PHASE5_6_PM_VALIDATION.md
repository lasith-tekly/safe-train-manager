# Phase 5+6: Product Manager Validation & Sign-Off

**Date:** February 13, 2026  
**Product Manager:** Validated  
**Status:** ✅ APPROVED

---

## 1. User Story Priority Validation

### ✅ APPROVED Priorities

All priorities are correctly aligned with business value and implementation dependencies.

| Priority | Stories | Rationale |
|----------|---------|-----------|
| **MUST** | US-5.1, 5.2, 5.3, 5.4, 5.5, 5.8, 5.9, 5.10, 5.11, 5.12 | Core workflow - cannot deliver MVP without these |
| **SHOULD** | US-5.6, 5.7, 5.13, 5.14 | Enhances UX but not blocking for basic workflow |

**No changes required.**

---

## 2. Acceptance Criteria Review

### ✅ Complete Stories (No Changes Needed)

- **US-5.1: View Team Assignments** - Clear and complete
- **US-5.2: Role Breakdown Planning** - Clear and complete
- **US-5.3: Capacity Validation** - Thresholds confirmed (<95% Green, 95-100% Amber, >100% Red)
- **US-5.4: Planning Status Tracking** - Auto-calculation logic confirmed
- **US-5.8: Commit Plan** - Clear and complete
- **US-5.12: Version Context** - Inheritance from Strategic Plan confirmed

---

### ⚠️ Stories Needing Enhanced Acceptance Criteria

#### US-5.5: Descope Workflow - ADD CRITERIA

**Current:** Descope with reason, move to separate section, can restore

**Add:**
```
Acceptance Criteria (Enhanced):
- PO clicks "Descope" → modal requires reason (min 10 chars)
- Item moves to "Descoped Items" section at bottom of page
- Descoped items show strikethrough styling
- PO can click "Restore" to move back to active planning
- Descoped items contribute 0 eD to capacity calculation
- PM sees descope reason in review panel
- When PM approves descope:
  * JIRA record status → "DESCOPED" (new status)
  * JIRA removed from current PI
  * JIRA added to "Future Consideration" backlog (product-level)
  * Notification sent to PO: "Descope approved for [JIRA-123]"
```

**Rationale:** Original spec said "flag for future PI" but didn't specify mechanism.

---

#### US-5.6: Bulk Accept - ADD CRITERIA

**Current:** Accept all unplanned items, copy PM's effort, set status to accepted

**Add:**
```
Acceptance Criteria (Enhanced):
- "Accept All" button visible when 2+ items have status "not_planned"
- Confirmation modal: "Accept X items as-is? You'll need to add role breakdown later."
- After bulk accept:
  * Status → "accepted"
  * Original effort copied to planning record
  * Role breakdown (Dev/PD/QA) left at 0
  * Yellow warning badge: "Needs role breakdown"
- PO can filter: "Show items needing role breakdown"
- Capacity bar shows warning: "X items accepted but missing role breakdown"
```

**Rationale:** Clarifies UX flow and prevents confusion about incomplete planning.

---

#### US-5.7: Planning Summary Banner - ADD CRITERIA

**Current:** Show original, my plan, deviation, counts, approval status

**Add:**
```
Acceptance Criteria (Enhanced):
- Banner always visible at top of planning table
- Shows:
  * Original (PM): X eD
  * My Plan: Y eD
  * Deviation: +/- Z eD (color: green if negative, red if positive)
  * Status breakdown: "A accepted, B modified, C descope proposed, D not planned"
  * Approval status: "Not Submitted" | "Pending PM Review" | "X Approved, Y Rejected"
  * Last committed: timestamp
- Click banner → expands to show detailed breakdown by status
- "Commit Plan" button in banner (primary action)
- Button disabled if: all items "not_planned" OR validation errors exist
```

**Rationale:** Clarifies banner behavior and commit button placement.

---

#### US-5.9: PM Notification - ADD CRITERIA

**Current:** Notification banner, badge on Products menu, click opens review panel

**Add:**
```
Acceptance Criteria (Enhanced):
- Notification banner appears on Roadmap Planning page (Product Roadmap view)
- Banner shows: "X teams submitted plans for [Product] [PI]. Review now?"
- Badge on "Products" menu item: "Products (3)" in red circle
- Badge count = number of products with pending reviews (not total teams)
- Click "Review now" → opens PM Review Panel (modal or side panel)
- Click "Dismiss" → marks notification as read (but badge persists until reviewed)
- Notification persists across sessions until PM reviews all items
- If multiple products have pending reviews: show list in dropdown
```

**Rationale:** Clarifies badge behavior and notification persistence.

---

#### US-5.10: PM Review & Approval - ADD CRITERIA

**Current:** Review panel, approve/reject per item, update Execution Plan

**Add:**
```
Acceptance Criteria (Enhanced):
- Review panel shows:
  * Team name + PI + Product
  * List of all submitted items grouped by status (modified, descope, accepted)
  * For each item:
    - JIRA key + Feature name
    - Original (PM): X eD
    - PO Plan: Y eD (with role breakdown: Dev/PD/QA)
    - Delta: +/- Z eD
    - PO's reason (if modified or descoped)
- PM can:
  * Approve item → green checkmark, optional note
  * Reject item → red X, required reason (min 20 chars)
  * Approve All (for team) → bulk action
  * Reject All (for team) → bulk action with single reason
- After approval:
  * JIRA planned_effort updated immediately
  * Phase 4 deviation detection triggered
  * PO sees "Approved" badge on item
  * Item does NOT lock (PO can request changes in next iteration)
- After rejection:
  * PO receives notification with PM's reason
  * Item highlighted in red in PO's view
  * PO can edit and re-commit
- Review panel shows progress: "Reviewed 5 of 12 items"
```

**Rationale:** Clarifies approval/rejection flow and non-locking behavior.

---

#### US-5.11: PO Revision After Rejection - ADD CRITERIA

**Current:** See rejection reason, revise, resubmit

**Add:**
```
Acceptance Criteria (Enhanced):
- Rejected items highlighted with red border in planning table
- Rejection reason shown in tooltip on hover
- Click item → expands to show:
  * PM's rejection reason (full text)
  * Original effort (PM)
  * PO's previous plan (rejected)
  * Current plan (editable)
- PO can:
  * Edit role breakdown
  * Change total effort
  * Add response note to PM (optional)
- After editing rejected item:
  * Status → "modified" (recalculated)
  * "Re-commit" button enabled
- Re-commit creates new notification for PM
- PM sees: "Team X revised their plan (2nd submission)"
- Revision history preserved (show "Previous: X eD, Rejected: reason")
```

**Rationale:** Clarifies revision workflow and communication loop.

---

#### US-5.13: Empty State Handling - ADD CRITERIA

**Current:** Show guidance when no JIRA records

**Add:**
```
Acceptance Criteria (Enhanced):
- Empty state shows when:
  * No JIRA records exist for team/PI combination
  * All JIRA records are descoped
- Empty state displays:
  * Icon: clipboard with X
  * Message: "No work assigned to [Team] for [PI]"
  * Guidance: "Contact your Product Manager to assign features to your team."
  * Action button: "View All Products" (links to Products page)
- If JIRA records exist but all descoped:
  * Message: "All items descoped. Review descoped section below."
  * Show descoped section
```

**Rationale:** Clarifies different empty state scenarios.

---

#### US-5.14: Orphaned JIRA Handling - ADD CRITERIA

**Current:** Keep PO's data, mark as orphaned, show warning

**Add:**
```
Acceptance Criteria (Enhanced):
- When PM deletes JIRA record while PO is planning:
  * PO's planning data preserved in team_planning table
  * Item marked with "orphaned" flag
  * Yellow warning badge: "Item removed by PM"
- Orphaned item shows:
  * Strikethrough JIRA key
  * Warning icon with tooltip: "This item was removed from Execution Plan by PM on [date]. Your planning is saved for reference."
  * PO's role breakdown (read-only)
  * "Acknowledge & Remove" button
- Orphaned items:
  * Contribute 0 eD to capacity calculation
  * Cannot be committed (blocked)
  * Must be acknowledged before commit
- PO clicks "Acknowledge & Remove":
  * Item moved to "Archived" section
  * No longer blocks commit
  * Data preserved for audit trail
- If PO tries to commit with orphaned items:
  * Error message: "You have X orphaned items. Please acknowledge them before committing."
```

**Rationale:** Clarifies orphaned item behavior and commit blocking.

---

## 3. Edge Cases Analysis

### ✅ Covered Edge Cases

1. **Concurrent Edits** - Optimistic locking with updated_at timestamp
2. **Network Failures** - Local storage backup, retry mechanism
3. **Version Conflicts** - Mark draft as "outdated", show warning
4. **Capacity Overflow** - Warning at 95%, error at 100%, but doesn't block
5. **Zero Capacity** - Show warning: "No capacity configured"

---

### 🔴 NEW Edge Cases to Handle

#### EDGE-1: PM Changes JIRA Effort While PO is Planning

**Scenario:** PM updates JIRA planned_effort from 10 eD to 15 eD while PO is editing

**Current Handling:** Not specified

**Recommended Solution:**
```
- Detect conflict on PO's next save (compare updated_at timestamp)
- Show modal: "PM updated this item's effort from 10 eD to 15 eD. Your plan: 12 eD."
- Options:
  * "Keep My Plan (12 eD)" → PO's value wins, status = "modified"
  * "Use PM's New Value (15 eD)" → PM's value wins, PO must re-enter role breakdown
  * "View Details" → side-by-side comparison
```

**Impact:** MEDIUM - Prevents data loss and confusion

---

#### EDGE-2: Multiple POs from Same Team Editing Simultaneously

**Scenario:** Two POs from Team A both editing plans for PI 2026.1

**Current Handling:** Not specified

**Recommended Solution:**
```
- Allow concurrent edits (different items = no conflict)
- If editing same item:
  * Last write wins
  * Show warning to both: "Another user is editing this item"
  * Lock item for 30 seconds after last edit
- Organizational policy: One PO per team per PI (recommended)
```

**Impact:** LOW - Rare scenario, but needs handling

---

#### EDGE-3: PO Commits, Then PM Publishes New Strategic Version

**Scenario:** PO commits plan based on Strategic v1, PM publishes Strategic v2 before reviewing

**Current Handling:** Mark draft as "outdated"

**Recommended Enhancement:**
```
- When PM publishes new Strategic version:
  * All pending PO plans marked as "outdated"
  * Notification sent to all POs: "Strategic Plan updated. Review changes before PM reviews your plan."
  * PM sees warning in review panel: "This plan is based on outdated Strategic version (v1). Current: v2."
- PM options:
  * Review anyway (if changes are minor)
  * Reject with reason: "Please sync to new Strategic version and resubmit"
- PO can:
  * View diff: Strategic v1 vs v2
  * Sync to v2 (re-calculate based on new Strategic allocations)
  * Keep v1 plan (if PM approves)
```

**Impact:** MEDIUM - Prevents misalignment

---

#### EDGE-4: All Items Descoped

**Scenario:** PO descopes every single JIRA record

**Current Handling:** Empty state shows descoped section

**Recommended Enhancement:**
```
- Show confirmation modal: "You're descoping all work for this PI. Are you sure?"
- If confirmed:
  * All items moved to descoped section
  * Capacity bar shows 0% utilization
  * Warning banner: "No active work planned for this PI"
  * Commit button enabled (PM needs to review descope decisions)
- PM sees: "Team X descoped all items for [PI]. Reasons: [list]"
```

**Impact:** LOW - Rare but needs confirmation

---

#### EDGE-5: Role Breakdown Exceeds Planned Effort

**Scenario:** PO enters Dev=5, PD=3, QA=4 (total=12) but JIRA planned_effort=10

**Current Handling:** Validation error

**Recommended Enhancement:**
```
- Real-time validation on blur
- Error message: "Total role breakdown (12 eD) exceeds planned effort (10 eD)"
- Options:
  * Auto-adjust JIRA planned_effort to 12 eD (status = "modified")
  * Reduce role breakdown to match 10 eD
- Block save until resolved
```

**Impact:** MEDIUM - Data integrity

---

#### EDGE-6: PM Deletes Entire PI

**Scenario:** PM removes PI 2026.1 from calendar while PO is planning for it

**Current Handling:** Not specified

**Recommended Solution:**
```
- All JIRA records for that PI become orphaned
- PO sees error: "PI 2026.1 has been removed from the calendar. Your planning is archived."
- Planning page shows read-only view
- PO cannot commit
- Data preserved for audit trail
```

**Impact:** LOW - Very rare, but needs graceful handling

---

## 4. Implementation Approach Validation

### ✅ APPROVED Technical Approach

**Database Design:** ✅ Appropriate
- `team_planning` table structure is correct
- `planning_notifications` covers notification needs
- `po_plan_versions` supports draft versioning
- Soft delete for JIRA records (deleted_at) is correct

**API Design:** ✅ RESTful and logical
- GET /api/teams/{team_id}/planning - correct
- POST /api/teams/{team_id}/planning/items - auto-save endpoint correct
- POST /api/planning/items/{id}/approve - correct

**Frontend Architecture:** ✅ Component hierarchy makes sense
- TeamAssignmentsPage → PlanningTable → RoleBreakdownEditor
- Auto-save with 500ms debounce is correct
- Optimistic UI updates for performance

**Phase Breakdown:** ✅ Logical progression
- 5A: Foundation (3 days) - correct
- 5B: Planning & Role Breakdown (3 days) - correct
- 5C: Descope & Commit (2 days) - correct
- 6A: PM Review (3 days) - correct
- 6B: Integration & Polish (2-3 days) - correct

**Total: 13-15 days is realistic**

---

## 5. Business Rules Validation

### ✅ All Business Rules Confirmed

| Rule | Status | Notes |
|------|--------|-------|
| Status Auto-Calculation | ✅ Correct | Derived from PO actions |
| Capacity Thresholds | ✅ Correct | <95% Green, 95-100% Amber, >100% Red |
| No Auto-Distribution | ✅ Correct | PO must manually fill roles |
| No Locking | ✅ Correct | PO can request changes after approval |
| Descope Outcome | ✅ Enhanced | Added "Future Consideration" backlog |
| Version Inheritance | ✅ Correct | PO inherits from Strategic Plan |
| Orphaned JIRA | ✅ Enhanced | Added acknowledge & remove flow |
| No Notification Expiry | ✅ Correct | Persist until reviewed |
| Draft Limit | ✅ Correct | 1-2 drafts, commit only one |
| Outdated Drafts | ✅ Enhanced | Added sync workflow |
| Phase 4 Integration | ✅ Correct | Approval triggers deviation detection |

---

## 6. Risks & Mitigation Validation

### ✅ APPROVED Risk Assessment

**HIGH RISKS:**
- Auto-save Data Loss → Mitigation: Optimistic locking ✅
- Version Synchronization → Mitigation: Outdated flag + sync ✅
- Orphaned JIRA → Mitigation: Soft delete + warning ✅

**MEDIUM RISKS:**
- Capacity Calculation Performance → Mitigation: Caching + debounce ✅
- Notification Overload → Mitigation: Batching + filters ✅

All mitigations are appropriate and sufficient.

---

## 7. Missing Requirements

### 🔴 ADD: Audit Trail

**Requirement:** Track all PO planning changes for compliance

**Solution:**
```sql
CREATE TABLE planning_audit_log (
    id UUID PRIMARY KEY,
    team_planning_id UUID REFERENCES team_planning(id),
    action VARCHAR(50) NOT NULL,
    -- Values: created, updated, descoped, restored, committed, approved, rejected
    changed_by UUID REFERENCES users(id),
    changes JSONB,
    -- Store before/after values
    timestamp TIMESTAMP DEFAULT NOW()
);
```

**Rationale:** Required for audit compliance and debugging

---

### 🟡 CONSIDER: Bulk Operations History

**Requirement:** Track when bulk actions were used (for analytics)

**Solution:** Add `is_bulk_action` flag to planning_audit_log

**Rationale:** Helps understand PO behavior and optimize UX

---

## 8. Acceptance Criteria Summary

### Stories with Enhanced Criteria

- ✅ US-5.5: Descope Workflow - Added PM approval outcome
- ✅ US-5.6: Bulk Accept - Added warning badges and filters
- ✅ US-5.7: Planning Summary Banner - Added detailed breakdown
- ✅ US-5.9: PM Notification - Added badge behavior
- ✅ US-5.10: PM Review & Approval - Added non-locking behavior
- ✅ US-5.11: PO Revision - Added revision history
- ✅ US-5.13: Empty State - Added multiple scenarios
- ✅ US-5.14: Orphaned JIRA - Added acknowledge & remove flow

---

## 9. Final Sign-Off

### ✅ **APPROVED FOR IMPLEMENTATION**

**Conditions:**
1. ✅ Implement enhanced acceptance criteria for US-5.5 through US-5.14
2. ✅ Handle 6 new edge cases identified (EDGE-1 through EDGE-6)
3. ✅ Add audit trail table (planning_audit_log)
4. ✅ Test all edge cases thoroughly in Phase 6B

**Timeline:** 13-15 days (approved)

**Next Steps:**
1. Tech Lead updates user stories with enhanced acceptance criteria
2. Create detailed Phase 5A task breakdown
3. Begin implementation on [start date]

---

## 10. Product Manager Statement

**I, as Product Manager, approve Phase 5+6 implementation with the following enhancements:**

1. **Enhanced Acceptance Criteria** for 8 user stories (US-5.5 through US-5.14)
2. **6 New Edge Cases** to be handled (EDGE-1 through EDGE-6)
3. **Audit Trail** requirement added (planning_audit_log table)
4. **All business rules** confirmed as specified
5. **Implementation approach** approved (5A → 5B → 5C → 6A → 6B)

**Expected Outcome:**
- POs can plan team work with role breakdown (Dev/PD/QA)
- Real-time capacity validation with visual feedback
- Descope workflow with PM approval
- PM can review and approve/reject plans
- Integration with Phase 4 deviation detection
- All edge cases handled gracefully

**Sign-Off Date:** February 13, 2026

**Status:** ✅ **APPROVED - PROCEED WITH IMPLEMENTATION**

---

**Next Milestone:** Phase 5A Foundation complete in 3 days
