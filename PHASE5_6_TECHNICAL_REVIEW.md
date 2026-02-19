# Phase 5+6: Technical Review - PO Team Planning & PM Review

**Date:** February 13, 2026  
**Status:** ✅ APPROVED WITH CONDITIONS  
**Timeline:** 12-15 days  
**Risk:** 🟡 MEDIUM

---

## 1. Dependencies Analysis

### Existing Infrastructure ✅
- Phase 2: JIRA records with version_id
- Phase 3: Spillover tracking
- Phase 4: Deviation & Alignment workflow
- Phase 1: Versioning (DRAFT/PUBLISHED)

### New Requirements
**Tables:** team_planning, planning_notifications, po_plan_versions  
**Services:** TeamPlanningService, PlanningNotificationService  
**Components:** 8 new frontend components

---

## 2. Risk Assessment

### HIGH RISKS 🔴

**RISK-1: Auto-save Data Loss**
- Mitigation: Optimistic locking, local storage backup, conflict resolution UI

**RISK-2: Version Synchronization**
- Mitigation: Mark draft as "outdated", show warning, allow comparison

**RISK-3: Orphaned JIRA Records**
- Mitigation: Soft delete (deleted_at column), mark as "orphaned", preserve PO data

### MEDIUM RISKS 🟡

**RISK-4: Capacity Calculation Performance**
- Mitigation: Cache capacity, debounce (500ms), optimistic UI

**RISK-5: Notification Overload**
- Mitigation: Batch by product/PI, show count, bulk actions

---

## 3. Implementation Phases

### Phase 5A: Foundation (3 days)
- Create tables (team_planning, planning_notifications, po_plan_versions)
- Backend APIs: GET /api/teams/{team_id}/planning
- Frontend: TeamAssignmentsPage skeleton
- Empty state handling

### Phase 5B: Planning & Role Breakdown (3 days)
- RoleBreakdownEditor with inline editing
- Auto-save (500ms debounce)
- Status auto-calculation
- CapacityBar component
- Validation (Dev+PD+QA = Planned)

### Phase 5C: Descope & Commit (2 days)
- DescopeModal component
- Bulk accept (NO auto-distribution)
- PlanningCommitModal
- PlanningSummaryBanner
- Create PM notification

### Phase 6A: PM Review & Approval (3 days)
- PlanningNotificationBanner
- Badge on Products menu
- PMReviewPanel
- Approve/reject per item
- Update Execution Plan on approval

### Phase 6B: Integration & Polish (2-3 days)
- PO revision workflow
- Phase 4 integration (approval → deviation detection)
- Orphaned JIRA handling
- Version conflict resolution
- Testing & bug fixes

**Total: 13-15 days**

---

## 4. Data Model

### team_planning
```sql
CREATE TABLE team_planning (
    id UUID PRIMARY KEY,
    jira_record_id UUID REFERENCES jira_records(id),
    version_id UUID REFERENCES roadmap_versions(id),
    team_id UUID REFERENCES teams(id),
    pi_id UUID REFERENCES pis(id),
    dev_effort DECIMAL(10,2) DEFAULT 0,
    pd_effort DECIMAL(10,2) DEFAULT 0,
    qa_effort DECIMAL(10,2) DEFAULT 0,
    planning_status VARCHAR(50) DEFAULT 'not_planned',
    is_descoped BOOLEAN DEFAULT FALSE,
    descope_reason TEXT,
    pm_review_status VARCHAR(50) DEFAULT 'pending',
    pm_reviewed_by UUID REFERENCES users(id),
    pm_review_note TEXT,
    original_planned_effort DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(jira_record_id, version_id)
);
```

### planning_notifications
```sql
CREATE TABLE planning_notifications (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    version_id UUID REFERENCES roadmap_versions(id),
    team_id UUID REFERENCES teams(id),
    pi_id UUID REFERENCES pis(id),
    notification_type VARCHAR(50) DEFAULT 'plan_submitted',
    message TEXT NOT NULL,
    items_count INTEGER DEFAULT 0,
    is_reviewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Modify jira_records
```sql
ALTER TABLE jira_records ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE jira_records ADD COLUMN deleted_by UUID REFERENCES users(id);
```

---

## 5. Key APIs

**PO Planning:**
- GET /api/teams/{team_id}/planning?pi_id=X&version_id=Y
- POST /api/teams/{team_id}/planning/items (auto-save)
- POST /api/teams/{team_id}/planning/bulk-accept
- POST /api/teams/{team_id}/planning/descope
- POST /api/teams/{team_id}/planning/commit

**PM Review:**
- GET /api/planning/notifications
- GET /api/planning/review?product_id=X&pi_id=Y
- POST /api/planning/items/{id}/approve
- POST /api/planning/items/{id}/reject
- POST /api/planning/bulk-approve

---

## 6. Critical Questions for PM

**Q1: Bulk Accept - Quick Fill Option?**
Should we provide optional default role distribution (Dev 60%, PD 20%, QA 20%) to reduce manual work?

**Q2: Descope Approval Outcome**
How to "flag for future PI"? New status? Separate table? Just a note field?

**Q3: Orphaned JIRA Handling**
Can PO commit plans with orphaned items? Or must they acknowledge/remove first?

**Q4: Version Outdated Behavior**
Can PO continue editing outdated draft? Or must sync to new version first?

**Q5: Capacity Threshold**
Confirm: <95% Green, 95-100% Amber, >100% Red. Warning only, no blocking?

**Q6: PM Approval Locking**
Confirm: Approved items do NOT lock. PO can request changes in next iteration?

**Q7: Notification Persistence**
Confirm: No expiry. Notifications persist until PM reviews?

---

## 7. Recommendation

✅ **PROCEED** with phased implementation

**Conditions:**
1. Resolve Q1-Q4 before Phase 5A starts
2. Implement auto-save with conflict detection (RISK-1)
3. Add soft delete for JIRA records (RISK-3)
4. Test version synchronization thoroughly (RISK-2)

**Timeline:** 13-15 days (2.5-3 weeks)

**Next Steps:**
1. PM answers critical questions (Q1-Q4)
2. Create detailed Phase 5A tasks
3. Set up development environment
4. Begin database schema design
