# Phase 5+6: End-to-End Test Scenarios

**Date:** February 13, 2026  
**Status:** Ready for Testing

---

## Test Scenarios (Gherkin Format)

### Test-1: Capacity Thresholds (EXACT)

```gherkin
Feature: Capacity Thresholds Display
  As a PO
  I want to see accurate capacity status
  So that I can plan within team capacity

  Background:
    Given team "Alpha" has 100 eD capacity for PI-2026-Q1

  Scenario: Capacity is GREEN when under 95%
    When total planned effort is 90 eD
    Then capacity bar displays GREEN
    And utilization shows "90%"
    And status label shows "On track"

  Scenario: Capacity is GREEN at 94.9% (boundary test)
    When total planned effort is 94.9 eD
    Then capacity bar displays GREEN
    And utilization shows "94.9%"

  Scenario: Capacity is AMBER at exactly 95% (lower boundary)
    When total planned effort is 95 eD
    Then capacity bar displays AMBER
    And utilization shows "95%"
    And status label shows "Near capacity"

  Scenario: Capacity is AMBER between 95% and 100%
    When total planned effort is 97 eD
    Then capacity bar displays AMBER
    And utilization shows "97%"

  Scenario: Capacity is AMBER at exactly 100% (upper boundary)
    When total planned effort is 100 eD
    Then capacity bar displays AMBER
    And utilization shows "100%"

  Scenario: Capacity is RED when over 100%
    When total planned effort is 101 eD
    Then capacity bar displays RED
    And utilization shows "101%"
    And warning message displays "Over capacity"
    And status label shows "Over capacity"

  Scenario: Over capacity does NOT block commit
    Given total planned effort is 150 eD (150% capacity)
    And capacity bar displays RED
    When PO clicks "Commit Plan"
    Then commit succeeds
    And warning is shown but commit is ALLOWED
```

---

### Test-2: No Auto-Distribution on Bulk Accept

```gherkin
Feature: Bulk Accept Without Auto-Distribution
  As a PO
  I want to bulk accept items without auto-distribution
  So that I can manually plan role breakdown

  Scenario: Bulk accept does NOT auto-distribute roles
    Given there are 5 unplanned JIRA records:
      | JIRA Key | PM Effort |
      | FEAT-101 | 10.0 eD   |
      | FEAT-102 | 8.0 eD    |
      | FEAT-103 | 12.0 eD   |
      | FEAT-104 | 6.0 eD    |
      | FEAT-105 | 15.0 eD   |
    
    When PO selects all 5 items
    And clicks "Accept Selected (5)"
    
    Then all 5 items have status "Accepted"
    And all items have:
      | Field      | Value |
      | dev_effort | 0     |
      | pd_effort  | 0     |
      | qa_effort  | 0     |
    
    And warning message displays:
      """
      5 items accepted - add role breakdown to complete planning
      """
    
    And all 5 items are highlighted in YELLOW
    And banner shows "5 item(s) accepted but missing role breakdown"

  Scenario: PO must manually add role breakdown
    Given item "FEAT-101" is accepted with no role breakdown
    And item is highlighted in yellow
    
    When PO enters:
      | Role | Effort |
      | Dev  | 6.0 eD |
      | PD   | 2.0 eD |
      | QA   | 2.0 eD |
    
    Then item total is 10.0 eD
    And yellow highlight is removed
    And status changes to "Accepted" (with breakdown)
```

---

### Test-3: No Locking After Approval

```gherkin
Feature: No Locking After Approval
  As a PM
  I want approved items to remain modifiable
  So that PO can request changes in next iteration

  Scenario: Approved items are NOT locked
    Given PO has submitted planning for "FEAT-101"
    When PM approves the item
    Then TeamPlanning record has NO 'locked' field
    And TeamPlanning record has NO 'is_locked' field
    And API response includes "locked": false
    And blue info alert displays:
      """
      Approved items are NOT locked.
      PO can request changes in the next iteration if needed.
      """

  Scenario: PO can modify approved items in next iteration
    Given item "FEAT-101" was approved by PM
    And status is "Approved"
    
    When PO opens next planning iteration
    And modifies effort from 10.0 to 12.0 eD
    
    Then update succeeds
    And no "locked" error is shown
    And item can be resubmitted for review
```

---

### Test-4: Descope Approval Outcome

```gherkin
Feature: Descope Approval
  As a PM
  I want to approve descope requests
  So that items are removed from PI and flagged for future

  Scenario: Descope approval removes from PI and flags for future
    Given PO has proposed descoping "FEAT-103"
    And descope reason is "Not enough capacity to deliver this PI"
    And PM opens review panel
    
    When PM sees yellow warning:
      """
      1 item(s) proposed for descope.
      Approving descope will remove items from this PI and flag them for future consideration.
      """
    
    And PM clicks "Approve"
    
    Then JIRA record "FEAT-103" has:
      | Field                  | Value                                    |
      | planned_effort         | 0                                        |
      | is_descoped            | true                                     |
      | descope_reason         | Not enough capacity to deliver this PI   |
      | flagged_for_future_pi  | true                                     |
    
    And item is removed from current PI
    And item is flagged for future PI consideration
    And PO receives notification: "Your descope request was approved"
```

---

### Test-5: Orphaned JIRA Handling

```gherkin
Feature: Orphaned JIRA Handling
  As a PO
  I want my planning data preserved when JIRA is deleted
  So that I don't lose my work

  Scenario: JIRA deleted while PO is planning
    Given PO has planned 10.0 eD for "FEAT-101"
    And PO has added role breakdown:
      | Role | Effort |
      | Dev  | 6.0 eD |
      | PD   | 2.0 eD |
      | QA   | 2.0 eD |
    
    When PM deletes JIRA record "FEAT-101" from strategic plan
    
    Then TeamPlanning record has:
      | Field               | Value                |
      | jira_record_id      | NULL                 |
      | is_orphaned         | true                 |
      | orphaned_jira_key   | FEAT-101             |
      | orphaned_jira_title | Original title       |
      | status              | orphaned             |
      | planned_effort      | 10.0 (preserved)     |
      | dev_effort          | 6.0 (preserved)      |
      | pd_effort           | 2.0 (preserved)      |
      | qa_effort           | 2.0 (preserved)      |
    
    And PO sees:
      - Yellow warning banner: "⚠️ JIRA Deleted"
      - Preserved JIRA key and title
      - Preserved planning data for reference
      - "Acknowledge & Remove" button
    
    And commit is blocked with message:
      """
      Cannot commit: 1 orphaned items must be acknowledged
      """

  Scenario: PO acknowledges orphaned item
    Given item "FEAT-101" is orphaned
    When PO clicks "Acknowledge & Remove"
    Then item is removed from planning list
    And commit is now allowed
```

---

### Test-6: No Notification Expiry

```gherkin
Feature: Notification Persistence
  As a PM
  I want to see all unread notifications
  So that I don't miss any planning submissions

  Scenario: Old notifications are still visible
    Given PM notification was created 30 days ago
    And notification has NOT been read
    And notification type is "plan_committed"
    
    When PM opens notification panel
    
    Then old notification is visible in list
    And there is NO "expired" indicator
    And notification shows:
      - Team name
      - PI name
      - Message
      - Created date (30 days ago)
      - NO "expires at" date
    
    And PM can click to review the plan

  Scenario: Notifications persist until read
    Given notification was created 60 days ago
    And notification is unread
    
    When PM marks notification as read
    
    Then notification moves to "read" list
    And notification is NOT deleted
    And notification remains accessible for reference
```

---

### Test-7: Draft Version Limit

```gherkin
Feature: Maximum 2 Draft Versions
  As a system
  I want to limit draft versions to 2
  So that planning doesn't become cluttered

  Scenario: Maximum 2 draft versions allowed
    Given PO has committed version 1 for "Team Alpha - PI Q1"
    And version 1 status is "draft"
    
    When PO commits version 2
    Then version 2 is created successfully
    And version 2 status is "draft"
    
    When PO tries to commit version 3
    Then error is shown:
      """
      Maximum 2 draft versions allowed. Please wait for PM review.
      """
    And commit is blocked
    And version count remains at 2
```

---

### Test-8: Outdated Draft Preserved

```gherkin
Feature: Outdated Draft Preservation
  As a PO
  I want my outdated draft preserved
  So that I can reference it when starting new plan

  Scenario: Outdated draft is preserved for reference
    Given PO has uncommitted draft plan with 15 items
    And PO has added role breakdown for 10 items
    And PM publishes new Strategic version "v2.1"
    
    Then PO receives notification:
      """
      New Strategic Plan Version Published
      """
    
    And PO's draft status changes to "outdated"
    And PO's draft data is PRESERVED (not deleted)
    
    And yellow warning banner displays:
      """
      A new strategic plan version (v2.1) has been published.
      Your current draft is now outdated but has been preserved for reference.
      """
    
    And PO sees two buttons:
      - "Start New Plan"
      - "View Outdated Draft"
    
    When PO clicks "View Outdated Draft"
    Then PO can see all 15 items with planning data
    And reference-only message displays:
      """
      You are viewing an outdated draft. This is for reference only and cannot be committed.
      """
```

---

### Test-9: Version Inheritance

```gherkin
Feature: Version Inheritance from Strategic Plan
  As a PO
  I want to plan against the Active Strategic version
  So that my planning aligns with current strategy

  Scenario: PO plan inherits from Active Strategic Plan
    Given Strategic Plan has versions:
      | Version | Status    |
      | v1.0    | Published |
      | v2.0    | Published |
      | v2.1    | Active    |
    
    When PO opens Team Planning page
    
    Then version is displayed as "v2.1"
    And version badge shows:
      """
      🔒 v2.1 (Inherited from Active Strategic Plan - Read Only)
      """
    
    And version selector is disabled
    And PO cannot change version
    And tooltip explains:
      """
      Version is inherited from Active Strategic Plan and cannot be changed
      """
```

---

## Test Execution Commands

### Run All E2E Tests
```bash
cd backend
pytest tests/e2e/test_critical_business_rules.py -v
```

### Run Specific Test Classes
```bash
# Capacity thresholds
pytest tests/e2e/test_critical_business_rules.py::TestCapacityThresholds -v

# No auto-distribution
pytest tests/e2e/test_critical_business_rules.py::TestNoAutoDistribution -v

# No locking
pytest tests/e2e/test_critical_business_rules.py::TestNoLocking -v

# Descope approval
pytest tests/e2e/test_critical_business_rules.py::TestDescopeApproval -v

# Orphaned JIRA
pytest tests/e2e/test_critical_business_rules.py::TestOrphanedJiraHandling -v

# No notification expiry
pytest tests/e2e/test_critical_business_rules.py::TestNoNotificationExpiry -v

# Draft version limit
pytest tests/e2e/test_critical_business_rules.py::TestDraftVersionLimit -v

# Outdated draft
pytest tests/e2e/test_critical_business_rules.py::TestOutdatedDraftPreserved -v
```

### Run with Coverage
```bash
pytest tests/e2e/ --cov=app --cov-report=html --cov-report=term
```

### Run with HTML Report
```bash
pytest tests/e2e/ -v --html=test_report.html --self-contained-html
```

---

## Expected Test Results

### All Tests Passing
```
tests/e2e/test_critical_business_rules.py::TestCapacityThresholds::test_capacity_green_under_95_percent PASSED
tests/e2e/test_critical_business_rules.py::TestCapacityThresholds::test_capacity_amber_at_95_percent_boundary PASSED
tests/e2e/test_critical_business_rules.py::TestCapacityThresholds::test_capacity_red_over_100_percent PASSED
tests/e2e/test_critical_business_rules.py::TestNoAutoDistribution::test_bulk_accept_no_auto_distribution PASSED
tests/e2e/test_critical_business_rules.py::TestNoLocking::test_no_locked_field_in_model PASSED
tests/e2e/test_critical_business_rules.py::TestNoLocking::test_approve_response_includes_locked_false PASSED
tests/e2e/test_critical_business_rules.py::TestDescopeApproval::test_descope_approval_removes_from_pi PASSED
tests/e2e/test_critical_business_rules.py::TestOrphanedJiraHandling::test_orphaned_jira_preserves_data PASSED
tests/e2e/test_critical_business_rules.py::TestNoNotificationExpiry::test_no_expires_at_field_in_model PASSED
tests/e2e/test_critical_business_rules.py::TestNoNotificationExpiry::test_old_notifications_still_visible PASSED
tests/e2e/test_critical_business_rules.py::TestDraftVersionLimit::test_max_two_versions_enforced PASSED
tests/e2e/test_critical_business_rules.py::TestOutdatedDraftPreserved::test_outdated_draft_preserved PASSED

======================== 12 passed in 5.23s =========================
```

---

## Success Criteria

**Phase 5+6 is complete when:**

✅ All 12 E2E tests pass  
✅ Capacity thresholds verified: <95% green, 95-100% amber, >100% red  
✅ No auto-distribution on bulk accept verified  
✅ No locking mechanism exists (field checks pass)  
✅ Descope approval removes from PI and flags for future  
✅ Orphaned JIRA data preserved correctly  
✅ No notification expiry (field checks pass)  
✅ Max 2 draft versions enforced  
✅ Outdated drafts preserved for reference  
✅ Version inheritance working correctly  

---

**Status:** ✅ E2E test scenarios complete - Ready for test execution
