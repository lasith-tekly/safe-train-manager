"""
Tests for Budget & Cost Configuration in Global Settings
@QA Agent: Test suite for budget and cost parameters
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


class TestBudgetCostSettings:
    """Test cases for Budget & Cost Configuration fields"""

    def test_get_settings_returns_budget_fields(self):
        """Test that GET settings includes budget fields with defaults"""
        response = client.get("/api/settings/global/2026")
        assert response.status_code == 200
        
        data = response.json()
        assert "train_structural_cost_ratio" in data
        assert "effort_days_per_year" in data
        assert "train_unit_cost_keur" in data
        
        # Check defaults
        assert data["train_structural_cost_ratio"] == 2.8
        assert data["effort_days_per_year"] == 220
        assert data["train_unit_cost_keur"] == 85.0

    def test_update_structural_cost_ratio(self):
        """Test updating structural cost ratio"""
        # First get to create settings
        client.get("/api/settings/global/2026")
        
        # Update
        response = client.put("/api/settings/global/2026", json={
            "train_structural_cost_ratio": 3.2
        })
        assert response.status_code == 200
        assert response.json()["train_structural_cost_ratio"] == 3.2

    def test_update_effort_days_per_year(self):
        """Test updating effort days per year"""
        client.get("/api/settings/global/2026")
        
        response = client.put("/api/settings/global/2026", json={
            "effort_days_per_year": 200
        })
        assert response.status_code == 200
        assert response.json()["effort_days_per_year"] == 200

    def test_update_unit_cost_keur(self):
        """Test updating unit cost in KEUR"""
        client.get("/api/settings/global/2026")
        
        response = client.put("/api/settings/global/2026", json={
            "train_unit_cost_keur": 95.5
        })
        assert response.status_code == 200
        assert response.json()["train_unit_cost_keur"] == 95.5

    def test_update_all_budget_fields(self):
        """Test updating all budget fields at once"""
        client.get("/api/settings/global/2026")
        
        response = client.put("/api/settings/global/2026", json={
            "train_structural_cost_ratio": 2.5,
            "effort_days_per_year": 210,
            "train_unit_cost_keur": 100.0
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["train_structural_cost_ratio"] == 2.5
        assert data["effort_days_per_year"] == 210
        assert data["train_unit_cost_keur"] == 100.0

    def test_validation_structural_cost_ratio_min(self):
        """Test that structural cost ratio must be >= 1.0"""
        client.get("/api/settings/global/2026")
        
        response = client.put("/api/settings/global/2026", json={
            "train_structural_cost_ratio": 0.5
        })
        assert response.status_code == 422  # Validation error

    def test_validation_structural_cost_ratio_max(self):
        """Test that structural cost ratio must be <= 5.0"""
        client.get("/api/settings/global/2026")
        
        response = client.put("/api/settings/global/2026", json={
            "train_structural_cost_ratio": 6.0
        })
        assert response.status_code == 422

    def test_validation_effort_days_min(self):
        """Test that effort days must be >= 100"""
        client.get("/api/settings/global/2026")
        
        response = client.put("/api/settings/global/2026", json={
            "effort_days_per_year": 50
        })
        assert response.status_code == 422

    def test_validation_effort_days_max(self):
        """Test that effort days must be <= 365"""
        client.get("/api/settings/global/2026")
        
        response = client.put("/api/settings/global/2026", json={
            "effort_days_per_year": 400
        })
        assert response.status_code == 422

    def test_validation_unit_cost_min(self):
        """Test that unit cost must be >= 0"""
        client.get("/api/settings/global/2026")
        
        response = client.put("/api/settings/global/2026", json={
            "train_unit_cost_keur": -10
        })
        assert response.status_code == 422

    def test_validation_unit_cost_max(self):
        """Test that unit cost must be <= 500"""
        client.get("/api/settings/global/2026")
        
        response = client.put("/api/settings/global/2026", json={
            "train_unit_cost_keur": 600
        })
        assert response.status_code == 422

    def test_budget_fields_persist_across_requests(self):
        """Test that budget fields are persisted correctly"""
        client.get("/api/settings/global/2026")
        
        # Update
        client.put("/api/settings/global/2026", json={
            "train_structural_cost_ratio": 3.0,
            "effort_days_per_year": 215,
            "train_unit_cost_keur": 90.0
        })
        
        # Get again
        response = client.get("/api/settings/global/2026")
        data = response.json()
        
        assert data["train_structural_cost_ratio"] == 3.0
        assert data["effort_days_per_year"] == 215
        assert data["train_unit_cost_keur"] == 90.0

    def test_year_isolation_for_budget_fields(self):
        """Test that budget fields are isolated by year"""
        # Set up 2026
        client.get("/api/settings/global/2026")
        client.put("/api/settings/global/2026", json={
            "train_unit_cost_keur": 100.0
        })
        
        # Set up 2027
        client.get("/api/settings/global/2027")
        client.put("/api/settings/global/2027", json={
            "train_unit_cost_keur": 110.0
        })
        
        # Verify isolation
        response_2026 = client.get("/api/settings/global/2026")
        response_2027 = client.get("/api/settings/global/2027")
        
        assert response_2026.json()["train_unit_cost_keur"] == 100.0
        assert response_2027.json()["train_unit_cost_keur"] == 110.0
