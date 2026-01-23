"""
Tests for Team Capacity Management feature.
Following agent workflow: @QA phase
"""
import pytest
from datetime import date
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, engine, get_db, SessionLocal

client = TestClient(app)


# Setup and teardown
@pytest.fixture(autouse=True)
def setup_database():
    """Reset database before each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


class TestTeamMemberEnhancements:
    """Test enhanced team member fields."""

    def test_create_member_with_new_fields(self):
        """Test creating a team member with site_id, specialization, train_allocation_percent."""
        # Create a team first
        team_response = client.post("/api/teams", json={
            "name": "Phoenix Squad",
            "short_code": "PHX",
            "status": "active"
        })
        assert team_response.status_code == 201
        team_id = team_response.json()["id"]
        
        # Create member with new fields
        response = client.post(f"/api/teams/{team_id}/members", json={
            "name": "John Smith",
            "email": "john@example.com",
            "role": "developer",
            "specialization": "Android",
            "train_allocation_percent": 50,
            "individual_productivity": 80
        })
        assert response.status_code == 201
        
        member = response.json()
        assert member["name"] == "John Smith"
        assert member["specialization"] == "Android"
        assert member["train_allocation_percent"] == 50
        assert member["individual_productivity"] == 80
        # Effective capacity = 50% * 80% = 40%
        assert member["effective_capacity_percent"] == 40.0

    def test_create_member_with_ba_pdf_role(self):
        """Test creating a member with BA/PDF role."""
        team_response = client.post("/api/teams", json={
            "name": "Test Team",
            "short_code": "TST",
            "status": "active"
        })
        team_id = team_response.json()["id"]
        
        response = client.post(f"/api/teams/{team_id}/members", json={
            "name": "Lisa Park",
            "role": "ba_pdf",
            "train_allocation_percent": 100
        })
        assert response.status_code == 201
        assert response.json()["role"] == "ba_pdf"

    def test_create_member_with_architect_role(self):
        """Test creating a member with Architect role."""
        team_response = client.post("/api/teams", json={
            "name": "Arch Team",
            "short_code": "ARC",
            "status": "active"
        })
        team_id = team_response.json()["id"]
        
        response = client.post(f"/api/teams/{team_id}/members", json={
            "name": "Mike Chen",
            "role": "architect",
            "train_allocation_percent": 100
        })
        assert response.status_code == 201
        assert response.json()["role"] == "architect"

    def test_effective_capacity_calculation(self):
        """Test effective capacity = train_allocation * productivity."""
        team_response = client.post("/api/teams", json={
            "name": "Capacity Team",
            "short_code": "CAP",
            "status": "active"
        })
        team_id = team_response.json()["id"]
        
        # Transversal member: 50% allocation, 20% productivity
        response = client.post(f"/api/teams/{team_id}/members", json={
            "name": "Transversal John",
            "role": "developer",
            "train_allocation_percent": 50,
            "individual_productivity": 20
        })
        assert response.status_code == 201
        member = response.json()
        # 50% * 20% = 10%
        assert member["effective_capacity_percent"] == 10.0

    def test_default_productivity_from_global_settings(self):
        """Test that default productivity comes from global settings."""
        # Set global productivity
        client.get("/api/settings/global/2026")
        client.put("/api/settings/global/2026", json={
            "global_productivity_percentage": 70
        })
        
        team_response = client.post("/api/teams", json={
            "name": "Default Prod Team",
            "short_code": "DPT",
            "status": "active"
        })
        team_id = team_response.json()["id"]
        
        # Create member without individual_productivity
        response = client.post(f"/api/teams/{team_id}/members", json={
            "name": "Default Member",
            "role": "developer",
            "train_allocation_percent": 100
        })
        assert response.status_code == 201
        member = response.json()
        assert member["effective_productivity"] == 70
        # 100% * 70% = 70%
        assert member["effective_capacity_percent"] == 70.0


class TestComponentHats:
    """Test Component Hat CRUD operations."""

    def test_create_component_hat(self):
        """Test creating a component hat."""
        response = client.post("/api/component-hats", json={
            "name": "Authentication",
            "color": "#1890ff",
            "description": "Auth module expertise"
        })
        assert response.status_code == 201
        hat = response.json()
        assert hat["name"] == "Authentication"
        assert hat["color"] == "#1890ff"

    def test_list_component_hats(self):
        """Test listing all component hats."""
        # Create some hats
        client.post("/api/component-hats", json={"name": "Auth", "color": "#ff0000"})
        client.post("/api/component-hats", json={"name": "Payments", "color": "#00ff00"})
        client.post("/api/component-hats", json={"name": "API", "color": "#0000ff"})
        
        response = client.get("/api/component-hats")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        # Should be sorted by name
        assert data["data"][0]["name"] == "API"

    def test_update_component_hat(self):
        """Test updating a component hat."""
        create_response = client.post("/api/component-hats", json={
            "name": "Old Name",
            "color": "#000000"
        })
        hat_id = create_response.json()["id"]
        
        response = client.put(f"/api/component-hats/{hat_id}", json={
            "name": "New Name",
            "color": "#ffffff"
        })
        assert response.status_code == 200
        assert response.json()["name"] == "New Name"
        assert response.json()["color"] == "#ffffff"

    def test_delete_component_hat(self):
        """Test deleting a component hat."""
        create_response = client.post("/api/component-hats", json={
            "name": "To Delete",
            "color": "#123456"
        })
        hat_id = create_response.json()["id"]
        
        response = client.delete(f"/api/component-hats/{hat_id}")
        assert response.status_code == 204
        
        # Verify deleted
        get_response = client.get(f"/api/component-hats/{hat_id}")
        assert get_response.status_code == 404

    def test_assign_hats_to_member(self):
        """Test assigning component hats to a team member."""
        # Create hats
        hat1 = client.post("/api/component-hats", json={"name": "Auth", "color": "#ff0000"}).json()
        hat2 = client.post("/api/component-hats", json={"name": "API", "color": "#00ff00"}).json()
        
        # Create team and member
        team = client.post("/api/teams", json={
            "name": "Hat Team",
            "short_code": "HAT",
            "status": "active"
        }).json()
        
        member = client.post(f"/api/teams/{team['id']}/members", json={
            "name": "Hat Member",
            "role": "developer"
        }).json()
        
        # Assign hats
        response = client.put(f"/api/teams/{team['id']}/members/{member['id']}", json={
            "component_hat_ids": [hat1["id"], hat2["id"]]
        })
        assert response.status_code == 200
        
        updated_member = response.json()
        assert len(updated_member["component_hats"]) == 2
        hat_names = [h["name"] for h in updated_member["component_hats"]]
        assert "Auth" in hat_names
        assert "API" in hat_names


class TestMemberLeave:
    """Test Member Leave operations (iteration-based)."""

    def _setup_pi_and_team(self):
        """Helper to create PI with iterations and a team with member."""
        # Create global settings
        client.get("/api/settings/global/2026")
        
        # Generate PI
        pi_response = client.post("/api/pis/generate", json={
            "year": 2026,
            "start_date": "2026-01-05",
            "iterations_per_pi": 3,
            "iteration_weeks": 2,
            "pi_count": 1
        })
        pi = pi_response.json()["data"][0]
        iteration = pi["iterations"][0]
        
        # Create team and member
        team = client.post("/api/teams", json={
            "name": "Leave Team",
            "short_code": "LVT",
            "status": "active"
        }).json()
        
        member = client.post(f"/api/teams/{team['id']}/members", json={
            "name": "Leave Member",
            "role": "developer"
        }).json()
        
        return pi, iteration, team, member

    def test_create_member_leave(self):
        """Test creating leave for a member in an iteration."""
        pi, iteration, team, member = self._setup_pi_and_team()
        
        response = client.post(f"/api/members/{member['id']}/leave", json={
            "member_id": member["id"],
            "iteration_id": iteration["id"],
            "leave_days": 2,
            "leave_type": "vacation",
            "notes": "Family vacation"
        })
        assert response.status_code == 201
        
        leave = response.json()
        assert leave["member_name"] == "Leave Member"
        assert float(leave["leave_days"]) == 2  # Decimal serialized as string
        assert leave["leave_type"] == "vacation"

    def test_get_iteration_leave(self):
        """Test getting all leave for an iteration."""
        pi, iteration, team, member = self._setup_pi_and_team()
        
        # Create another member
        member2 = client.post(f"/api/teams/{team['id']}/members", json={
            "name": "Second Member",
            "role": "qa"
        }).json()
        
        # Add leave for both
        client.post(f"/api/members/{member['id']}/leave", json={
            "member_id": member["id"],
            "iteration_id": iteration["id"],
            "leave_days": 2,
            "leave_type": "vacation"
        })
        client.post(f"/api/members/{member2['id']}/leave", json={
            "member_id": member2["id"],
            "iteration_id": iteration["id"],
            "leave_days": 1,
            "leave_type": "sick"
        })
        
        response = client.get(f"/api/iterations/{iteration['id']}/leave")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2

    def test_get_team_iteration_leave(self):
        """Test getting leave for a specific team in an iteration."""
        pi, iteration, team, member = self._setup_pi_and_team()
        
        # Create another team
        team2 = client.post("/api/teams", json={
            "name": "Other Team",
            "short_code": "OTH",
            "status": "active"
        }).json()
        member2 = client.post(f"/api/teams/{team2['id']}/members", json={
            "name": "Other Member",
            "role": "developer"
        }).json()
        
        # Add leave for both teams
        client.post(f"/api/members/{member['id']}/leave", json={
            "member_id": member["id"],
            "iteration_id": iteration["id"],
            "leave_days": 2,
            "leave_type": "vacation"
        })
        client.post(f"/api/members/{member2['id']}/leave", json={
            "member_id": member2["id"],
            "iteration_id": iteration["id"],
            "leave_days": 1,
            "leave_type": "sick"
        })
        
        # Get leave for first team only
        response = client.get(f"/api/teams/{team['id']}/iterations/{iteration['id']}/leave")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["data"][0]["member_name"] == "Leave Member"

    def test_update_leave(self):
        """Test updating a leave record."""
        pi, iteration, team, member = self._setup_pi_and_team()
        
        create_response = client.post(f"/api/members/{member['id']}/leave", json={
            "member_id": member["id"],
            "iteration_id": iteration["id"],
            "leave_days": 2,
            "leave_type": "vacation"
        })
        leave_id = create_response.json()["id"]
        
        response = client.put(f"/api/leave/{leave_id}", json={
            "leave_days": 3,
            "leave_type": "training",
            "notes": "Updated to training"
        })
        assert response.status_code == 200
        assert float(response.json()["leave_days"]) == 3  # Decimal serialized as string
        assert response.json()["leave_type"] == "training"

    def test_delete_leave(self):
        """Test deleting a leave record."""
        pi, iteration, team, member = self._setup_pi_and_team()
        
        create_response = client.post(f"/api/members/{member['id']}/leave", json={
            "member_id": member["id"],
            "iteration_id": iteration["id"],
            "leave_days": 2,
            "leave_type": "vacation"
        })
        leave_id = create_response.json()["id"]
        
        response = client.delete(f"/api/leave/{leave_id}")
        assert response.status_code == 204


class TestSiteHolidays:
    """Test Site Holiday operations."""

    def _create_site(self):
        """Helper to create a country and site."""
        # Create country
        country_response = client.post("/api/countries", json={
            "name": "France",
            "code": "FR"
        })
        assert country_response.status_code == 201, f"Failed to create country: {country_response.json()}"
        country = country_response.json()
        
        # Create site - endpoint is /api/sites with country_id in body
        site_response = client.post("/api/sites", json={
            "name": "Paris Office",
            "code": "PAR",
            "country_id": country["id"]
        })
        assert site_response.status_code == 201, f"Failed to create site: {site_response.json()}"
        site = site_response.json()
        
        return country, site

    def test_create_site_holiday(self):
        """Test creating a site-specific holiday."""
        country, site = self._create_site()
        
        response = client.post(f"/api/sites/{site['id']}/holidays", json={
            "site_id": site["id"],
            "date": "2026-07-14",
            "name": "Bastille Day",
            "year": 2026
        })
        assert response.status_code == 201
        
        holiday = response.json()
        assert holiday["name"] == "Bastille Day"
        assert holiday["site_name"] == "Paris Office"

    def test_get_site_holidays(self):
        """Test getting holidays for a site."""
        country, site = self._create_site()
        
        # Create multiple holidays
        client.post(f"/api/sites/{site['id']}/holidays", json={
            "site_id": site["id"],
            "date": "2026-07-14",
            "name": "Bastille Day",
            "year": 2026
        })
        client.post(f"/api/sites/{site['id']}/holidays", json={
            "site_id": site["id"],
            "date": "2026-12-25",
            "name": "Christmas",
            "year": 2026
        })
        
        response = client.get(f"/api/sites/{site['id']}/holidays")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2

    def test_get_site_holidays_by_year(self):
        """Test filtering site holidays by year."""
        country, site = self._create_site()
        
        # Create holidays for different years
        client.post(f"/api/sites/{site['id']}/holidays", json={
            "site_id": site["id"],
            "date": "2026-07-14",
            "name": "Bastille Day 2026",
            "year": 2026
        })
        client.post(f"/api/sites/{site['id']}/holidays", json={
            "site_id": site["id"],
            "date": "2027-07-14",
            "name": "Bastille Day 2027",
            "year": 2027
        })
        
        response = client.get(f"/api/sites/{site['id']}/holidays?year=2026")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["data"][0]["name"] == "Bastille Day 2026"

    def test_update_site_holiday(self):
        """Test updating a site holiday."""
        country, site = self._create_site()
        
        create_response = client.post(f"/api/sites/{site['id']}/holidays", json={
            "site_id": site["id"],
            "date": "2026-07-14",
            "name": "Old Name",
            "year": 2026
        })
        holiday_id = create_response.json()["id"]
        
        response = client.put(f"/api/site-holidays/{holiday_id}", json={
            "name": "New Name"
        })
        assert response.status_code == 200
        assert response.json()["name"] == "New Name"

    def test_delete_site_holiday(self):
        """Test deleting a site holiday."""
        country, site = self._create_site()
        
        create_response = client.post(f"/api/sites/{site['id']}/holidays", json={
            "site_id": site["id"],
            "date": "2026-07-14",
            "name": "To Delete",
            "year": 2026
        })
        holiday_id = create_response.json()["id"]
        
        response = client.delete(f"/api/site-holidays/{holiday_id}")
        assert response.status_code == 204
