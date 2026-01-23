"""
Tests for Capacity Allocation API
@QA Agent: Test suite for dynamic capacity allocation categories
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db


# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test and drop after"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


class TestCapacityAllocationAPI:
    """Test cases for Capacity Allocation endpoints"""

    def test_get_categories_initializes_defaults(self):
        """Test that default categories are created when none exist"""
        response = client.get("/capacity-allocations/2026")
        assert response.status_code == 200
        
        categories = response.json()
        assert len(categories) == 3
        
        # Verify default categories
        names = [c["name"] for c in categories]
        assert "Feature Capacity" in names
        assert "IT Excellence" in names
        assert "Component Work" in names
        
        # Verify default percentages
        percentages = {c["name"]: c["default_percentage"] for c in categories}
        assert percentages["Feature Capacity"] == 20
        assert percentages["IT Excellence"] == 12
        assert percentages["Component Work"] == 8

    def test_get_summary(self):
        """Test capacity allocation summary endpoint"""
        # First, initialize categories
        client.get("/capacity-allocations/2026")
        
        response = client.get("/capacity-allocations/2026/summary")
        assert response.status_code == 200
        
        summary = response.json()
        assert summary["year"] == 2026
        assert summary["total_allocated"] == 40  # 20 + 12 + 8
        assert summary["remaining_for_sprint"] == 60

    def test_create_category(self):
        """Test creating a new capacity allocation category"""
        new_category = {
            "year": 2026,
            "name": "Security",
            "code": "security",
            "description": "Security and compliance work",
            "default_percentage": 10,
            "color": "#f5222d"
        }
        
        response = client.post("/capacity-allocations", json=new_category)
        assert response.status_code == 200
        
        created = response.json()
        assert created["name"] == "Security"
        assert created["default_percentage"] == 10
        assert created["color"] == "#f5222d"
        assert created["is_active"] == True

    def test_create_category_exceeds_100_percent(self):
        """Test that creating a category that exceeds 100% total fails"""
        # Initialize defaults (40% total)
        client.get("/capacity-allocations/2026")
        
        # Try to add 70% more (would be 110% total)
        new_category = {
            "year": 2026,
            "name": "Too Much",
            "code": "too_much",
            "default_percentage": 70
        }
        
        response = client.post("/capacity-allocations", json=new_category)
        assert response.status_code == 400
        assert "exceed 100%" in response.json()["detail"]

    def test_update_category(self):
        """Test updating an existing category"""
        # Initialize defaults
        response = client.get("/capacity-allocations/2026")
        categories = response.json()
        feature_category = next(c for c in categories if c["name"] == "Feature Capacity")
        
        # Update the percentage
        update_data = {"default_percentage": 25}
        response = client.put(f"/capacity-allocations/{feature_category['id']}", json=update_data)
        assert response.status_code == 200
        
        updated = response.json()
        assert updated["default_percentage"] == 25

    def test_update_category_exceeds_100_percent(self):
        """Test that updating a category to exceed 100% total fails"""
        # Initialize defaults (40% total)
        response = client.get("/capacity-allocations/2026")
        categories = response.json()
        feature_category = next(c for c in categories if c["name"] == "Feature Capacity")
        
        # Try to update to 80% (would be 100% total with others)
        update_data = {"default_percentage": 90}
        response = client.put(f"/capacity-allocations/{feature_category['id']}", json=update_data)
        assert response.status_code == 400

    def test_delete_category_soft(self):
        """Test soft deleting a category"""
        # Initialize defaults
        response = client.get("/capacity-allocations/2026")
        categories = response.json()
        feature_category = next(c for c in categories if c["name"] == "Feature Capacity")
        
        # Soft delete
        response = client.delete(f"/capacity-allocations/{feature_category['id']}")
        assert response.status_code == 200
        
        # Verify it's not in active list
        response = client.get("/capacity-allocations/2026")
        categories = response.json()
        names = [c["name"] for c in categories]
        assert "Feature Capacity" not in names

    def test_delete_category_hard(self):
        """Test hard deleting a category"""
        # Initialize defaults
        response = client.get("/capacity-allocations/2026")
        categories = response.json()
        feature_category = next(c for c in categories if c["name"] == "Feature Capacity")
        
        # Hard delete
        response = client.delete(f"/capacity-allocations/{feature_category['id']}?hard=true")
        assert response.status_code == 200

    def test_category_not_found(self):
        """Test updating/deleting non-existent category"""
        response = client.put("/capacity-allocations/non-existent-id", json={"default_percentage": 10})
        assert response.status_code == 404
        
        response = client.delete("/capacity-allocations/non-existent-id")
        assert response.status_code == 404

    def test_year_isolation(self):
        """Test that categories are isolated by year"""
        # Create category for 2026
        client.get("/capacity-allocations/2026")
        
        # Get categories for 2027 (should initialize fresh defaults)
        response = client.get("/capacity-allocations/2027")
        categories = response.json()
        
        # Should have separate default categories
        assert len(categories) == 3

    def test_validation_empty_name(self):
        """Test that empty name is rejected"""
        new_category = {
            "year": 2026,
            "name": "",
            "code": "empty",
            "default_percentage": 10
        }
        
        response = client.post("/capacity-allocations", json=new_category)
        assert response.status_code == 422  # Validation error

    def test_validation_percentage_range(self):
        """Test that percentage must be 0-100"""
        new_category = {
            "year": 2026,
            "name": "Invalid",
            "code": "invalid",
            "default_percentage": 150
        }
        
        response = client.post("/capacity-allocations", json=new_category)
        assert response.status_code == 422  # Validation error


class TestCapacityAllocationIntegration:
    """Integration tests for capacity allocation with global settings"""

    def test_allocation_affects_capacity_calculation(self):
        """Test that allocations are used in capacity calculations"""
        # This would test integration with the capacity calculation service
        # when that feature is implemented
        pass

    def test_team_override_allocation(self):
        """Test that teams can override default allocations"""
        # This would test team-level allocation overrides
        # when that feature is implemented
        pass
