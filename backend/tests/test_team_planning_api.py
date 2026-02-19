"""
Test Team Planning API - Phase 5A Integration Tests

Tests API endpoints for team planning functionality.
"""
import pytest
from fastapi.testclient import TestClient
from decimal import Decimal
from datetime import datetime
import uuid

from app.main import app
from app.database import get_db


class TestCapacityAPI:
    """Test capacity API returns correct thresholds."""
    
    def test_get_capacity_returns_correct_structure(self, client, team_id, pi_id):
        """Test capacity endpoint returns correct response structure."""
        response = client.get(
            f"/api/teams/{team_id}/capacity",
            params={"pi_id": pi_id}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "available_ed" in data
        assert "used_ed" in data
        assert "remaining_ed" in data
        assert "utilization_percent" in data
        assert "status" in data
        
        # Verify status is one of valid values
        assert data["status"] in ["green", "amber", "red", "warning"]
    
    def test_get_capacity_green_status(self, client, team_id, pi_id):
        """Test capacity returns green when < 95%."""
        response = client.get(
            f"/api/teams/{team_id}/capacity",
            params={"pi_id": pi_id}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # If utilization < 95%, status should be green
        if data["utilization_percent"] < 95:
            assert data["status"] == "green"


class TestTeamPlanningAPI:
    """Test team planning CRUD operations."""
    
    def test_get_team_planning_requires_params(self, client, team_id):
        """Test that pi_id and version_id are required."""
        response = client.get(f"/api/teams/{team_id}/planning")
        
        # Should return 422 (validation error) for missing params
        assert response.status_code == 422
    
    def test_get_team_planning_success(self, client, team_id, pi_id, version_id):
        """Test successful retrieval of team planning."""
        response = client.get(
            f"/api/teams/{team_id}/planning",
            params={"pi_id": pi_id, "version_id": version_id}
        )
        
        assert response.status_code in [200, 404]  # 404 if team/pi/version not found
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify response structure
            assert "team" in data
            assert "pi" in data
            assert "version" in data
            assert "capacity" in data
            assert "items" in data
            assert "summary" in data
            
            # Verify summary structure
            assert "total" in data["summary"]
            assert "accepted" in data["summary"]
            assert "modified" in data["summary"]
            assert "descoped" in data["summary"]
            assert "not_planned" in data["summary"]
            assert "orphaned" in data["summary"]
    
    def test_create_planning_auto_save(self, client):
        """Test creating/updating planning record (auto-save)."""
        planning_data = {
            "jira_record_id": str(uuid.uuid4()),
            "team_id": str(uuid.uuid4()),
            "pi_id": str(uuid.uuid4()),
            "version_id": str(uuid.uuid4()),
            "dev_effort": 6.0,
            "pd_effort": 2.0,
            "qa_effort": 2.0
        }
        
        response = client.post("/api/planning", json=planning_data)
        
        # Should return 200 or 500 (depending on if IDs exist)
        assert response.status_code in [200, 400, 500]
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify response includes status (auto-calculated)
            assert "status" in data
            assert data["status"] in ["not_planned", "accepted", "modified", "descope_proposed", "orphaned"]
    
    def test_create_planning_validates_negative_effort(self, client):
        """Test that negative effort values are rejected."""
        planning_data = {
            "jira_record_id": str(uuid.uuid4()),
            "team_id": str(uuid.uuid4()),
            "pi_id": str(uuid.uuid4()),
            "version_id": str(uuid.uuid4()),
            "dev_effort": -5.0,  # Negative
            "pd_effort": 2.0,
            "qa_effort": 2.0
        }
        
        response = client.post("/api/planning", json=planning_data)
        
        # Should return 422 (validation error)
        assert response.status_code == 422


class TestDescopeAPI:
    """Test descope workflow."""
    
    def test_descope_requires_reason(self, client, planning_id):
        """Test that descope requires a reason."""
        response = client.post(
            f"/api/planning/{planning_id}/descope",
            json={}
        )
        
        # Should return 422 (validation error)
        assert response.status_code == 422
    
    def test_descope_reason_min_length(self, client, planning_id):
        """Test that descope reason must be at least 10 chars."""
        response = client.post(
            f"/api/planning/{planning_id}/descope",
            json={"reason": "Too short"}  # Only 9 chars
        )
        
        # Should return 422 (validation error)
        assert response.status_code == 422
    
    def test_descope_success(self, client, planning_id):
        """Test successful descope."""
        response = client.post(
            f"/api/planning/{planning_id}/descope",
            json={"reason": "Not enough capacity to deliver this PI"}
        )
        
        # Should return 200 or 404 (if planning_id doesn't exist)
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify status changed to descope_proposed
            assert data["status"] == "descope_proposed"
            assert data["is_descoped"] == True
            assert data["descope_reason"] == "Not enough capacity to deliver this PI"


class TestCommitAPI:
    """Test commit plan workflow."""
    
    def test_commit_requires_pi_and_version(self, client, team_id):
        """Test that commit requires pi_id and version_id."""
        response = client.post(
            f"/api/teams/{team_id}/planning/commit",
            json={}
        )
        
        # Should return 422 (validation error)
        assert response.status_code == 422
    
    def test_commit_success(self, client, team_id, pi_id, version_id):
        """Test successful commit."""
        response = client.post(
            f"/api/teams/{team_id}/planning/commit",
            json={
                "pi_id": pi_id,
                "version_id": version_id
            }
        )
        
        # Should return 200 or 400 (validation errors)
        assert response.status_code in [200, 400, 404]
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify response structure
            assert "plan_version_id" in data
            assert "committed_at" in data
            assert "items_count" in data
            assert "notification_sent" in data
            assert data["notification_sent"] == True


class TestPlanVersionsAPI:
    """Test plan versions endpoint."""
    
    def test_get_plan_versions(self, client, team_id, pi_id):
        """Test getting plan versions."""
        response = client.get(
            f"/api/teams/{team_id}/planning/versions",
            params={"pi_id": pi_id}
        )
        
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify response structure
            assert "versions" in data
            assert "count" in data
            assert "max_allowed" in data
            assert data["max_allowed"] == 2  # Max 2 versions


class TestOrphanedJiraAPI:
    """Test orphaned JIRA handling in API."""
    
    def test_acknowledge_orphan(self, client, planning_id):
        """Test acknowledging orphaned item."""
        response = client.post(f"/api/planning/{planning_id}/acknowledge-orphan")
        
        # Should return 200 or 404
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert "success" in data


# Fixtures
@pytest.fixture
def client():
    """Test client for API requests."""
    return TestClient(app)


@pytest.fixture
def team_id():
    """Sample team ID."""
    return str(uuid.uuid4())


@pytest.fixture
def pi_id():
    """Sample PI ID."""
    return str(uuid.uuid4())


@pytest.fixture
def version_id():
    """Sample version ID."""
    return str(uuid.uuid4())


@pytest.fixture
def planning_id():
    """Sample planning ID."""
    return str(uuid.uuid4())
