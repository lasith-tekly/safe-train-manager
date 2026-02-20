# Product Requirements Document: Spillover Tracking

**Feature:** Spillover Tracking (Phase 3 - Execution Planning)  
**Product:** SAFe Train Manager  
**Created:** February 9, 2026  
**Status:** Requirements Definition  
**Priority:** High

---

## Executive Summary

Enable Product Managers to track and manage work that cannot be completed within a planned Program Increment (PI) and must be moved to a future PI. This feature provides visibility into spillover patterns, helps document reasons for delays, and supports continuous improvement in planning accuracy.

---

## Business Context

### Problem Statement
Currently, when JIRA work items cannot be completed in their planned PI, there is no systematic way to:
- Mark the work as spillover
- Document why the work spilled over
- Track which PI the work originally belonged to
- Analyze spillover patterns for process improvement

This lack of visibility makes it difficult to:
- Understand execution plan accuracy
- Identify recurring planning issues
- Communicate delays to stakeholders
- Improve future PI planning

### Business Value
- **Improved Transparency:** Clear visibility into what work spilled over and why
- **Better Planning:** Historical spillover data informs future PI planning
- **Stakeholder Communication:** Documented reasons for delays
- **Process Improvement:** Identify patterns and root causes of spillovers
- **Risk Management:** Early identification of at-risk work items

---

## User Personas

### Primary Users

**1. Product Manager**
- **Needs:** Track spillovers, document reasons, analyze patterns
- **Goals:** Improve planning accuracy, communicate delays
- **Pain Points:** Manual tracking in spreadsheets, lack of visibility

**2. Scrum Master**
- **Needs:** Identify team capacity issues, track impediments
- **Goals:** Remove blockers, improve team velocity
- **Pain Points:** No systematic way to track why work spills

**3. Release Train Engineer (RTE)**
- **Needs:** Program-level spillover visibility, trend analysis
- **Goals:** Optimize ART planning, identify systemic issues
- **Pain Points:** Aggregating spillover data across teams

### Secondary Users

**4. Engineering Manager**
- **Needs:** Team performance insights
- **Goals:** Resource planning, skill gap identification

**5. Executive Stakeholders**
- **Needs:** High-level metrics on delivery predictability
- **Goals:** Strategic planning, investment decisions

---

## User Stories

### Epic: Spillover Tracking
**As a** Product Manager  
**I want to** track work that spills over from one PI to another  
**So that** I can improve planning accuracy and communicate delays effectively

---

### Story 1: Mark JIRA Record as Spillover

**As a** Product Manager  
**I want to** mark a JIRA record as spillover from a previous PI  
**So that** I can track which work items were not completed on time

**Acceptance Criteria:**
1. ✅ "Mark as Spillover" action button visible on JIRA records with status PLANNED or IN_PROGRESS
2. ✅ Clicking button opens "Mark as Spillover" modal
3. ✅ Modal displays:
   - Current JIRA record details (key, title, current PI)
   - Dropdown to select "Original PI" (spillover_from_pi_id)
   - Text area for "Spillover Reason" (required, max 500 chars)
   - Category dropdown: Technical Debt, Dependencies, Scope Creep, Resource Constraints, External Factors, Other
4. ✅ Validation:
   - Original PI must be before current PI (chronologically)
   - Spillover reason is required
   - Category is required
5. ✅ On save:
   - Status changes to SPILLOVER
   - spillover_from_pi_id is set
   - spillover_reason is saved
   - Record remains in current PI (target PI)
6. ✅ Success message: "JIRA record marked as spillover from [PI Name]"
7. ✅ Error handling for API failures

**Technical Notes:**
- API: POST /api/jira-records/{id}/spillover
- Updates: status, spillover_from_pi_id, spillover_reason
- No changes to pi_id (stays in target PI)

---

### Story 2: Visual Indicators for Spillover Records

**As a** Product Manager  
**I want to** easily identify spillover records in the execution planning view  
**So that** I can quickly see which work items were delayed

**Acceptance Criteria:**
1. ✅ Spillover records display with:
   - Orange "SPILLOVER" tag (instead of blue "PLANNED")
   - Warning icon (⚠️) next to JIRA key
   - Different row background color (light orange tint)
2. ✅ Tooltip on hover shows:
   - "Spillover from: [Original PI Name]"
   - "Reason: [First 100 chars of reason]"
   - "Click to view details"
3. ✅ Clicking spillover record opens detail modal with full information
4. ✅ Visual indicators consistent across:
   - ExecutionPlanningPanel table
   - Feature detail view
   - Any list view showing JIRA records

**Design Notes:**
- Color: #fa8c16 (Ant Design orange)
- Icon: ExclamationCircleOutlined
- Background: rgba(250, 140, 22, 0.1)

---

### Story 3: Spillover Summary in Execution Planning Panel

**As a** Product Manager  
**I want to** see a summary of spillover records for a feature  
**So that** I can understand the overall impact of delays

**Acceptance Criteria:**
1. ✅ Summary section displays above JIRA records table:
   - Total spillover count: "X spillover records"
   - Total spillover effort: "Y eD from previous PIs"
   - Breakdown by source PI: "PI 2025.4: 5 eD, PI 2026.1: 3 eD"
2. ✅ Summary only visible when spillover records exist
3. ✅ Clicking summary expands/collapses detailed breakdown
4. ✅ Detailed breakdown shows:
   - List of spillover records grouped by source PI
   - Each record: JIRA key, title, effort, reason (truncated)
5. ✅ Visual styling:
   - Warning color scheme (orange)
   - Clear separation from main table
   - Collapsible accordion component

**Calculation:**
- Count: WHERE status = 'SPILLOVER'
- Effort: SUM(planned_effort) WHERE status = 'SPILLOVER'
- By PI: GROUP BY spillover_from_pi_id

---

### Story 4: Edit Spillover Information

**As a** Product Manager  
**I want to** update spillover reason or original PI  
**So that** I can correct mistakes or add more context

**Acceptance Criteria:**
1. ✅ Edit button visible on spillover records
2. ✅ Clicking opens same modal as "Mark as Spillover"
3. ✅ Modal pre-populated with existing values:
   - Original PI (selected in dropdown)
   - Spillover reason (in text area)
   - Category (selected)
4. ✅ Can update any field
5. ✅ Validation same as Story 1
6. ✅ On save: Updates spillover_from_pi_id and/or spillover_reason
7. ✅ Success message: "Spillover information updated"

**Business Rule:**
- Can only edit spillover info while status = SPILLOVER
- If status changes to COMPLETED, spillover fields become read-only

---

### Story 5: Remove Spillover Status

**As a** Product Manager  
**I want to** remove spillover status from a record  
**So that** I can correct mistakes or handle work that was re-planned

**Acceptance Criteria:**
1. ✅ "Remove Spillover" action available on spillover records
2. ✅ Confirmation modal:
   - "Are you sure you want to remove spillover status?"
   - "This will change status back to PLANNED"
   - "Spillover information will be cleared"
3. ✅ On confirm:
   - Status changes to PLANNED
   - spillover_from_pi_id set to NULL
   - spillover_reason set to NULL
4. ✅ Record remains in current PI
5. ✅ Visual indicators removed
6. ✅ Success message: "Spillover status removed"

**Business Rule:**
- Can only remove spillover if status = SPILLOVER
- Cannot remove if status = COMPLETED (must stay as historical record)

---

### Story 6: Filter JIRA Records by Spillover Status

**As a** Product Manager  
**I want to** filter JIRA records to show only spillovers  
**So that** I can focus on delayed work items

**Acceptance Criteria:**
1. ✅ Filter dropdown in ExecutionPlanningPanel:
   - All Records (default)
   - Spillover Only
   - Non-Spillover Only
2. ✅ Selecting "Spillover Only" shows only records with status = SPILLOVER
3. ✅ Selecting "Non-Spillover Only" shows records with status != SPILLOVER
4. ✅ Filter persists during session (not across page reloads)
5. ✅ Summary section updates based on filter
6. ✅ Clear visual indication of active filter

**UI Location:**
- Above JIRA records table
- Next to existing status filter (if any)

---

## Business Rules

### BR-1: Spillover Status Lifecycle
```
PLANNED/IN_PROGRESS → SPILLOVER → COMPLETED
                          ↓
                       PLANNED (if removed)
```
- Spillover can only be marked from PLANNED or IN_PROGRESS status
- Once COMPLETED, spillover status cannot be removed (historical record)
- Spillover can be removed to return to PLANNED status

### BR-2: Original PI Validation
- Original PI (spillover_from_pi_id) must be chronologically before current PI (pi_id)
- Cannot mark spillover from a future PI
- Cannot mark spillover from the same PI

### BR-3: Spillover Reason Requirements
- Spillover reason is mandatory when marking as spillover
- Minimum length: 10 characters
- Maximum length: 500 characters
- Must be meaningful text (not just "N/A" or "TBD")

### BR-4: PI Assignment
- Spillover records remain in their target PI (pi_id)
- spillover_from_pi_id is reference only, does not change current assignment
- Moving a spillover record to another PI updates pi_id, keeps spillover_from_pi_id

### BR-5: Effort Tracking
- Spillover effort counts toward target PI, not original PI
- Original PI shows effort as "not completed"
- Target PI shows effort as "spillover work"

### BR-6: Team Assignment
- Spillover records can change team assignment
- Team in target PI may differ from team in original PI
- No validation required for team consistency

### BR-7: Read-Only Historical Data
- Completed spillover records are read-only
- Cannot change spillover_from_pi_id or reason after completion
- Can view historical spillover data for reporting

---

## Edge Cases

### EC-1: Cascading Spillovers
**Scenario:** Work spills from PI 1 → PI 2 → PI 3  
**Handling:**
- Each spillover only tracks immediate previous PI
- spillover_from_pi_id in PI 3 points to PI 2 (not PI 1)
- UI shows: "Spillover from PI 2" (not "Originally from PI 1")
- Reporting can trace full chain if needed

### EC-2: Spillover to Non-Existent PI
**Scenario:** Original PI is deleted or archived  
**Handling:**
- spillover_from_pi_id remains (foreign key allows NULL on delete)
- UI shows: "Spillover from: [Deleted PI]" or PI ID if name unavailable
- Does not block spillover functionality

### EC-3: Partial Spillover
**Scenario:** Only part of work spills over (e.g., 5 of 10 eD)  
**Handling:**
- **Out of Scope for Phase 3**
- Current implementation: Entire JIRA record spills over
- Future enhancement: Split JIRA record into completed/spillover portions

### EC-4: Spillover Across Years
**Scenario:** Work spills from 2025.4 to 2026.1  
**Handling:**
- No special handling required
- Chronological validation works across years
- Reporting groups by year if needed

### EC-5: Multiple Teams on Same Feature
**Scenario:** Feature has JIRA records for Team A and Team B, only Team A spills  
**Handling:**
- Each JIRA record tracked independently
- Team A records marked as spillover
- Team B records remain PLANNED/COMPLETED
- Summary shows spillover count per team

### EC-6: Spillover During PI Planning
**Scenario:** User marks spillover while PI is still active  
**Handling:**
- Allowed - spillover can be marked anytime
- Common use case: Mid-PI realization that work won't complete
- Helps with re-planning for next PI

### EC-7: Spillover from Draft Version
**Scenario:** Original PI was in a DRAFT version that was never published  
**Handling:**
- **Out of Scope** - Spillover only tracks published versions
- Validation: Original PI must be from PUBLISHED version
- Draft work should be deleted/moved, not marked as spillover

### EC-8: Bulk Spillover Operations
**Scenario:** User needs to mark 10+ records as spillover at once  
**Handling:**
- **Out of Scope for Phase 3**
- Current: Mark spillover one at a time
- Future enhancement: Bulk spillover action

---

## Success Metrics

### Primary Metrics

**1. Adoption Rate**
- **Target:** 80% of PMs use spillover tracking within 2 PIs
- **Measure:** % of features with at least 1 spillover record
- **Baseline:** 0% (new feature)

**2. Spillover Documentation Rate**
- **Target:** 95% of spillover records have meaningful reasons
- **Measure:** % of spillover records with reason length > 20 chars
- **Baseline:** N/A (new feature)

**3. Planning Accuracy Improvement**
- **Target:** 10% reduction in spillover rate over 3 PIs
- **Measure:** (Spillover eD / Total Planned eD) per PI
- **Baseline:** Establish in first PI

### Secondary Metrics

**4. User Engagement**
- Average spillover records per feature
- % of spillover records with category selected
- Time spent in spillover modal (avg)

**5. Data Quality**
- % of spillover records with valid original PI
- % of spillover records with reason > 50 chars
- % of spillover records edited after creation

### Success Criteria

**Phase 3 is successful if:**
- ✅ 80% of active PMs use spillover tracking
- ✅ 90% of spillover records have documented reasons
- ✅ Zero critical bugs in production after 2 weeks
- ✅ Average user rating ≥ 4/5 for feature usability
- ✅ Spillover data used in at least 1 PI retrospective

---

## Out of Scope

### Not Included in Phase 3

**1. Partial Spillover**
- Splitting JIRA record into completed/spillover portions
- Tracking percentage of work completed
- **Reason:** Adds complexity, low priority for MVP

**2. Bulk Spillover Operations**
- Mark multiple records as spillover at once
- Bulk edit spillover reasons
- **Reason:** Can be added in Phase 4 if needed

**3. Spillover Analytics Dashboard**
- Trend charts for spillover rates
- Root cause analysis reports
- Team-level spillover comparisons
- **Reason:** Reporting is Phase 4 focus

**4. Spillover Predictions**
- AI/ML to predict likely spillovers
- Risk scoring for JIRA records
- **Reason:** Advanced feature, requires historical data

**5. Spillover Notifications**
- Email alerts when work marked as spillover
- Slack/Teams integration
- **Reason:** Notification system not yet implemented

**6. Spillover Workflow Automation**
- Auto-mark spillover based on PI end date
- Auto-move spillover to next PI
- **Reason:** Requires complex business logic, high risk

**7. Cross-Feature Spillover Tracking**
- Dependencies between spillover records
- Impact analysis across features
- **Reason:** Dependency management is separate epic

**8. Spillover Budget Impact**
- Automatic budget adjustments for spillovers
- Cost tracking for delayed work
- **Reason:** Budget module changes are out of scope

**9. Capacity Impact Analysis**
- How spillover affects team capacity
- Capacity re-planning for spillover work
- **Reason:** Capacity module changes are out of scope

**10. Historical Spillover Migration**
- Import historical spillover data
- Backfill spillover records from old system
- **Reason:** No old system to migrate from

---

## Dependencies

### Technical Dependencies
- ✅ JIRA records CRUD (Phase 2) - **Complete**
- ✅ ExecutionPlanningPanel (Phase 2) - **Complete**
- ✅ Database fields (spillover_from_pi_id, spillover_reason) - **Complete**
- ✅ PI data available via API - **Complete**

### External Dependencies
- None - Feature is self-contained within execution planning module

### Assumptions
- Users understand PI concept and chronology
- Users have access to historical PI data
- Spillover reasons are subjective (no validation of "correctness")

---

## Risks & Mitigations

### Risk 1: Low Adoption
**Risk:** Users don't see value, continue manual tracking  
**Impact:** High - Feature unused, wasted effort  
**Mitigation:**
- Clear onboarding/training materials
- Show value with sample data
- Make feature easy to discover (prominent UI placement)
- Gather feedback early and iterate

### Risk 2: Poor Data Quality
**Risk:** Users enter vague reasons like "delayed" or "TBD"  
**Impact:** Medium - Reduces analytical value  
**Mitigation:**
- Require minimum reason length (10 chars)
- Provide reason templates/examples
- Category dropdown to guide users
- Show good examples in UI

### Risk 3: Confusion with Status Changes
**Risk:** Users confused when status changes to SPILLOVER  
**Impact:** Medium - Support burden, user frustration  
**Mitigation:**
- Clear confirmation modal explaining status change
- Help text in UI
- Ability to undo (remove spillover status)
- Training documentation

### Risk 4: Performance with Large Datasets
**Risk:** Spillover summary slow with 100+ JIRA records  
**Impact:** Low - Most features have < 50 records  
**Mitigation:**
- Backend aggregation (not frontend)
- Pagination if needed
- Caching of summary data
- Performance testing with large datasets

---

## Open Questions

1. **Q:** Should spillover records be highlighted in the roadmap table view?  
   **A:** Out of scope for Phase 3. Roadmap view changes are separate.

2. **Q:** Can a COMPLETED record be marked as spillover retroactively?  
   **A:** No. Spillover must be marked before completion. Historical accuracy.

3. **Q:** Should we track who marked the spillover and when?  
   **A:** Yes - Use existing created_at/updated_at timestamps. No new fields needed.

4. **Q:** What if original PI is from a different product?  
   **A:** Out of scope. Spillover only within same product/feature context.

5. **Q:** Should spillover affect capacity calculations?  
   **A:** No. Capacity module changes are out of scope. Read-only display only.

---

## Next Steps

### For Tech Lead
1. Review PRD and confirm technical feasibility
2. Create technical design document
3. Estimate effort (expected: 2-3 days)
4. Identify any technical risks

### For UI/UX Designer
1. Design spillover modal mockups
2. Design visual indicators for spillover records
3. Design spillover summary section
4. Create interactive prototype

### For Backend Architect
1. Review existing API endpoint: POST /api/jira-records/{id}/spillover
2. Confirm database schema supports all requirements
3. Design spillover summary aggregation logic
4. Plan API response structure

### For Frontend Architect
1. Plan component structure (SpilloverModal, SpilloverSummary)
2. Design state management for spillover data
3. Plan integration with ExecutionPlanningPanel
4. Identify reusable components

### For QA Engineer
1. Review acceptance criteria
2. Create test plan for spillover scenarios
3. Identify edge cases for testing
4. Plan performance testing approach

---

## Appendix

### Spillover Reason Categories

**1. Technical Debt**
- Underestimated complexity
- Legacy code issues
- Technical challenges

**2. Dependencies**
- Waiting on other teams
- External API delays
- Third-party integrations

**3. Scope Creep**
- Requirements changed
- Additional features requested
- Expanded scope mid-PI

**4. Resource Constraints**
- Team member unavailable
- Insufficient capacity
- Competing priorities

**5. External Factors**
- Vendor delays
- Regulatory changes
- Market conditions

**6. Other**
- Anything not covered above
- Requires detailed explanation

### Sample Spillover Reasons

**Good Examples:**
- "API integration took 2 weeks longer due to vendor documentation issues"
- "Scope expanded to include mobile support after stakeholder review"
- "Key developer on medical leave for 3 weeks, team at 60% capacity"

**Poor Examples:**
- "Delayed" (too vague)
- "TBD" (not a reason)
- "N/A" (meaningless)

---

**Document Status:** Ready for Technical Review  
**Next Review Date:** After technical design complete  
**Approvers:** Product Manager, Tech Lead, Engineering Manager
