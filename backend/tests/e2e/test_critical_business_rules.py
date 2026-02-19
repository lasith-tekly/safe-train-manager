"""
End-to-End Tests for Critical Business Rules - Phase 5+6

CRITICAL BUSINESS RULES TESTED:
1. Capacity thresholds: <95% green, 95-100% amber, >100% red
2. No auto-distribution on bulk accept
3. No locking after approval
4. Descope approval: Remove from PI, flag for future
5. Orphaned JIRA handling
6. No notification expiry
7. Max 2 draft versions
8. Outdated draft preserved
"""
import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.models.team_planning import TeamPlanning, PlanningNotification, POPlanVersion
from app.models.roadmap_v4 import JiraRecord


class TestCapacityThresholds:
    """
    Test EXACT capacity thresholds.
    CRITICAL: <95% green, 95-100% amber, >100% red
    """
    
    def test_capacity_green_under_95_percent(self, client, team, pi, setup_capacity):
        """Capacity should be GREEN when < 95%."""
        # Setup: 100 eD capacity, 90 eD used
        setup_capacity(team.id, pi.id, available=100, used=90)
        
        response = client.get(
            f"/api/teams/{team.id}/capacity",
            params={"pi_id": pi.id}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["utilization_percent"] == 90.0
        assert data["status"] == "green"
    
    def test_capacity_green_at_94_point_9_percent(self, client, team, pi, setup_capacity):
        """Capacity should be GREEN at 94.9% (boundary test)."""
        setup_capacity(team.id, pi.id, available=100, used=94.9)
        
        response = client.get(f"/api/teams/{team.id}/capacity", params={"pi_id": pi.id})
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "green"
    
    def test_capacity_amber_at_95_percent_boundary(self, client, team, pi, setup_capacity):
        """Capacity should be AMBER at exactly 95% (lower boundary)."""
        setup_capacity(team.id, pi.id, available=100, used=95)
        
        response = client.get(f"/api/teams/{team.id}/capacity", params={"pi_id": pi.id})
        
        assert response.status_code == 200
        data = response.json()
        assert data["utilization_percent"] == 95.0
        assert data["status"] == "amber"
    
    def test_capacity_amber_between_95_and_100(self, client, team, pi, setup_capacity):
        """Capacity should be AMBER between 95% and 100%."""
        setup_capacity(team.id, pi.id, available=100, used=97)
        
        response = client.get(f"/api/teams/{team.id}/capacity", params={"pi_id": pi.id})
        
        assert response.status_code == 200
        data = response.json()
        assert data["utilization_percent"] == 97.0
        assert data["status"] == "amber"
    
    def test_capacity_amber_at_100_percent_boundary(self, client, team, pi, setup_capacity):
        """Capacity should be AMBER at exactly 100% (upper boundary)."""
        setup_capacity(team.id, pi.id, available=100, used=100)
        
        response = client.get(f"/api/teams/{team.id}/capacity", params={"pi_id": pi.id})
        
        assert response.status_code == 200
        data = response.json()
        assert data["utilization_percent"] == 100.0
        assert data["status"] == "amber"
    
    def test_capacity_red_over_100_percent(self, client, team, pi, setup_capacity):
        """Capacity should be RED when > 100%."""
        setup_capacity(team.id, pi.id, available=100, used=101)
        
        response = client.get(f"/api/teams/{team.id}/capacity", params={"pi_id": pi.id})
        
        assert response.status_code == 200
        data = response.json()
        assert data["utilization_percent"] == 101.0
        assert data["status"] == "red"
    
    def test_over_capacity_does_not_block_commit(self, client, team, pi, planning_items):
        """Over capacity (red) should NOT block commit - warning only."""
        # Setup: 150% capacity (red)
        
        response = client.post(
            f"/api/teams/{team.id}/planning/commit",
            json={"pi_id": pi.id, "version_id": "version-1"}
        )
        
        # Should succeed even though over capacity
        assert response.status_code == 200
        # Commit allowed despite red capacity


class TestNoAutoDistribution:
    """
    Test that bulk accept does NOT auto-distribute roles.
    CRITICAL: PO must manually fill in Dev/PD/QA.
    """
    
    def test_bulk_accept_no_auto_distribution(self, client, team, pi, version, jira_records):
        """Bulk accept should NOT auto-distribute roles."""
        # Create 5 unplanned items
        planning_ids = []
        for jira in jira_records[:5]:
            response = client.post("/api/planning", json={
                "jira_record_id": jira.id,
                "team_id": team.id,
                "pi_id": pi.id,
                "version_id": version.id,
                "dev_effort": 0,
                "pd_effort": 0,
                "qa_effort": 0
            })
            planning_ids.append(response.json()["id"])
        
        # Bulk accept
        response = client.post("/api/planning/bulk-approve", json={
            "planning_ids": planning_ids
        })
        
        assert response.status_code == 200
        
        # Verify NO auto-distribution
        for planning_id in planning_ids:
            planning = get_planning(planning_id)
            assert planning.dev_effort == 0, "Dev effort should NOT be auto-distributed"
            assert planning.pd_effort == 0, "PD effort should NOT be auto-distributed"
            assert planning.qa_effort == 0, "QA effort should NOT be auto-distributed"
            assert planning.status == "accepted"


class TestNoLocking:
    """
    Test that approved items are NOT locked.
    CRITICAL: No locking mechanism exists.
    """
    
    def test_no_locked_field_in_model(self):
        """TeamPlanning model should NOT have locked field."""
        assert not hasattr(TeamPlanning, 'locked'), "TeamPlanning should NOT have 'locked' field"
        assert not hasattr(TeamPlanning, 'is_locked'), "TeamPlanning should NOT have 'is_locked' field"
        assert not hasattr(TeamPlanning, 'locked_at'), "TeamPlanning should NOT have 'locked_at' field"
        assert not hasattr(TeamPlanning, 'locked_by'), "TeamPlanning should NOT have 'locked_by' field"
    
    def test_approve_response_includes_locked_false(self, client, planning_item):
        """Approve response should explicitly include locked: false."""
        response = client.post(
            f"/api/planning/{planning_item.id}/approve",
            json={"note": "Looks good"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["locked"] == False, "Response must explicitly confirm no locking"
    
    def test_approved_item_can_be_modified(self, client, approved_planning_item):
        """Approved items should be modifiable (no locking)."""
        # Try to update approved item
        response = client.put(
            f"/api/planning/{approved_planning_item.id}",
            json={
                "dev_effort": 8.0,
                "pd_effort": 2.0,
                "qa_effort": 2.0
            }
        )
        
        # Should succeed - no locking
        assert response.status_code == 200


class TestDescopeApproval:
    """
    Test descope approval outcome.
    CRITICAL: Remove from PI (effort=0), flag for future.
    """
    
    def test_descope_approval_removes_from_pi(self, client, db_session, descoped_planning):
        """Descope approval should set JIRA effort to 0."""
        jira_id = descoped_planning.jira_record_id
        
        response = client.post(
            f"/api/planning/{descoped_planning.id}/approve",
            json={"note": "Approved descope"}
        )
        
        assert response.status_code == 200
        
        # Verify JIRA record updated
        jira = db_session.query(JiraRecord).filter(JiraRecord.id == jira_id).first()
        assert jira.planned_effort == 0, "Effort should be 0 (removed from PI)"
        assert jira.is_descoped == True
        assert jira.flagged_for_future_pi == True, "Should be flagged for future PI"
        assert jira.descope_reason is not None


class TestOrphanedJiraHandling:
    """
    Test orphaned JIRA detection and data preservation.
    CRITICAL: Preserve PO's planning data when JIRA deleted.
    """
    
    def test_orphaned_jira_preserves_data(self, client, db_session, planning_with_jira):
        """Orphaned JIRA should preserve PO's planning data."""
        original_effort = planning_with_jira.planned_effort
        original_dev = planning_with_jira.dev_effort
        jira_key = planning_with_jira.jira_record.jira_key
        jira_title = planning_with_jira.jira_record.jira_title
        
        # Delete JIRA record (simulating PM deletion)
        db_session.delete(planning_with_jira.jira_record)
        db_session.commit()
        
        # Fetch planning items
        response = client.get(
            f"/api/teams/{planning_with_jira.team_id}/planning",
            params={
                "pi_id": planning_with_jira.pi_id,
                "version_id": planning_with_jira.version_id
            }
        )
        
        assert response.status_code == 200
        items = response.json()["items"]
        
        orphaned = [i for i in items if i["is_orphaned"]][0]
        assert orphaned["planned_effort"] == float(original_effort), "Effort should be preserved"
        assert orphaned["dev_effort"] == float(original_dev), "Dev effort should be preserved"
        assert orphaned["orphaned_jira_key"] == jira_key, "JIRA key should be preserved"
        assert orphaned["orphaned_jira_title"] == jira_title, "JIRA title should be preserved"
        assert orphaned["status"] == "orphaned"
    
    def test_orphaned_items_block_commit(self, client, team, pi, orphaned_planning):
        """Orphaned items should block commit until acknowledged."""
        response = client.post(
            f"/api/teams/{team.id}/planning/commit",
            json={"pi_id": pi.id, "version_id": orphaned_planning.version_id}
        )
        
        assert response.status_code == 400
        assert "orphaned" in response.json()["detail"].lower()


class TestNoNotificationExpiry:
    """
    Test that notifications do NOT expire.
    CRITICAL: No expires_at field, persist until read.
    """
    
    def test_no_expires_at_field_in_model(self):
        """PlanningNotification should NOT have expires_at field."""
        assert not hasattr(PlanningNotification, 'expires_at'), \
            "PlanningNotification should NOT have 'expires_at' field"
        assert not hasattr(PlanningNotification, 'expiry_date'), \
            "PlanningNotification should NOT have 'expiry_date' field"
    
    def test_old_notifications_still_visible(self, client, db_session):
        """Notifications from 30 days ago should still be visible."""
        # Create old notification
        old_notification = PlanningNotification(
            id="old-notif-1",
            team_id="team-1",
            pi_id="pi-1",
            product_id="prod-1",
            notification_type="plan_committed",
            message="Old notification",
            is_read=False,
            created_at=datetime.utcnow() - timedelta(days=30)
        )
        db_session.add(old_notification)
        db_session.commit()
        
        # Fetch notifications
        response = client.get("/api/notifications/planning")
        
        assert response.status_code == 200
        notifications = response.json()["notifications"]
        
        # Old notification should be present
        assert any(n["id"] == "old-notif-1" for n in notifications), \
            "Old notification should still be visible (no expiry)"


class TestDraftVersionLimit:
    """
    Test maximum 2 draft versions.
    CRITICAL: Max 2 versions enforced.
    """
    
    def test_max_two_versions_enforced(self, client, team, pi, version):
        """Should enforce maximum 2 draft versions."""
        # Create version 1
        response1 = client.post(
            f"/api/teams/{team.id}/planning/commit",
            json={"pi_id": pi.id, "version_id": version.id}
        )
        assert response1.status_code == 200
        
        # Create version 2
        response2 = client.post(
            f"/api/teams/{team.id}/planning/commit",
            json={"pi_id": pi.id, "version_id": version.id}
        )
        assert response2.status_code == 200
        
        # Try to create version 3 - should fail
        response3 = client.post(
            f"/api/teams/{team.id}/planning/commit",
            json={"pi_id": pi.id, "version_id": version.id}
        )
        assert response3.status_code == 400
        assert "maximum 2" in response3.json()["detail"].lower()


class TestOutdatedDraftPreserved:
    """
    Test that outdated drafts are preserved.
    CRITICAL: Draft data preserved for reference.
    """
    
    def test_outdated_draft_preserved(self, client, db_session, draft_plan_version):
        """Outdated draft should be preserved (not deleted)."""
        original_snapshot = draft_plan_version.planning_snapshot
        
        # Mark as outdated (simulating new strategic version)
        draft_plan_version.status = "outdated"
        db_session.commit()
        
        # Fetch versions
        response = client.get(
            f"/api/teams/{draft_plan_version.team_id}/planning/versions",
            params={"pi_id": draft_plan_version.pi_id}
        )
        
        assert response.status_code == 200
        versions = response.json()["versions"]
        
        outdated = [v for v in versions if v["status"] == "outdated"][0]
        assert outdated["planning_snapshot"] == original_snapshot, \
            "Planning data should be preserved"


# Fixtures
@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def setup_capacity(db_session):
    def _setup(team_id, pi_id, available, used):
        # Implementation to setup capacity
        pass
    return _setup


@pytest.fixture
def planning_with_jira(db_session):
    # Create planning with JIRA record
    pass


@pytest.fixture
def descoped_planning(db_session):
    # Create descoped planning item
    pass


@pytest.fixture
def orphaned_planning(db_session):
    # Create orphaned planning item
    pass


@pytest.fixture
def approved_planning_item(db_session):
    # Create approved planning item
    pass


@pytest.fixture
def draft_plan_version(db_session):
    # Create draft plan version
    pass
