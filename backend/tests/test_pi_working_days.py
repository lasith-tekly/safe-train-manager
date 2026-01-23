"""
Tests for PI Calendar Working Days Alignment
@QA Agent: Verify PI/Iteration start/end dates respect Global Settings working days
"""
import pytest
from datetime import date
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


# Day name to weekday mapping (Monday=0, Sunday=6)
DAY_TO_WEEKDAY = {
    "mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6
}


def get_day_name(d: date) -> str:
    """Get 3-letter day name from date"""
    days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    return days[d.weekday()]


def is_working_day(d: date, working_days_str: str) -> bool:
    """Check if date is a working day"""
    working_days = [day.strip().lower() for day in working_days_str.split(",")]
    return get_day_name(d) in working_days


class TestPIWorkingDaysAlignment:
    """Test that PI calendar respects working days from Global Settings"""

    def test_pi_start_date_is_working_day_default(self):
        """Test PI start date falls on a working day (default Mon-Fri)"""
        # Initialize settings (creates defaults)
        client.get("/api/settings/global/2026")
        
        # Generate PIs starting on a Monday (2026-01-05 is Monday)
        response = client.post("/api/pis/generate", json={
            "year": 2026,
            "start_date": "2026-01-05",
            "iterations_per_pi": 5,
            "iteration_weeks": 2,
            "pi_count": 2
        })
        assert response.status_code == 200
        
        pis = response.json()["data"]
        for pi in pis:
            start = date.fromisoformat(pi["start_date"])
            end = date.fromisoformat(pi["end_date"])
            
            # Start should be Mon-Fri (weekday 0-4)
            assert start.weekday() < 5, f"PI {pi['name']} starts on {get_day_name(start)} (not a working day)"
            # End should be Mon-Fri
            assert end.weekday() < 5, f"PI {pi['name']} ends on {get_day_name(end)} (not a working day)"

    def test_iteration_dates_are_working_days_default(self):
        """Test all iteration start/end dates are working days (default Mon-Fri)"""
        client.get("/api/settings/global/2026")
        
        response = client.post("/api/pis/generate", json={
            "year": 2026,
            "start_date": "2026-01-05",
            "iterations_per_pi": 5,
            "iteration_weeks": 2,
            "pi_count": 1
        })
        assert response.status_code == 200
        
        pi = response.json()["data"][0]
        for iteration in pi["iterations"]:
            start = date.fromisoformat(iteration["start_date"])
            end = date.fromisoformat(iteration["end_date"])
            
            assert start.weekday() < 5, f"Iteration {iteration['name']} starts on {get_day_name(start)}"
            assert end.weekday() < 5, f"Iteration {iteration['name']} ends on {get_day_name(end)}"

    def test_start_date_adjusted_if_not_working_day(self):
        """Test that start date on weekend is adjusted to next working day"""
        client.get("/api/settings/global/2026")
        
        # 2026-01-03 is Saturday, should be adjusted to Monday 2026-01-05
        response = client.post("/api/pis/generate", json={
            "year": 2026,
            "start_date": "2026-01-03",  # Saturday
            "iterations_per_pi": 3,
            "iteration_weeks": 2,
            "pi_count": 1
        })
        assert response.status_code == 200
        
        pi = response.json()["data"][0]
        start = date.fromisoformat(pi["start_date"])
        
        # Should be Monday (weekday 0)
        assert start.weekday() == 0, f"Expected Monday, got {get_day_name(start)}"
        assert start == date(2026, 1, 5), f"Expected 2026-01-05, got {start}"

    def test_custom_working_days_mon_wed_fri(self):
        """Test PI generation with custom working days (Mon, Wed, Fri only)"""
        # Set custom working days
        client.get("/api/settings/global/2026")
        client.put("/api/settings/global/2026", json={
            "working_days": "mon,wed,fri"
        })
        
        # Generate PI starting Monday
        response = client.post("/api/pis/generate", json={
            "year": 2026,
            "start_date": "2026-01-05",  # Monday
            "iterations_per_pi": 3,
            "iteration_weeks": 2,
            "pi_count": 1
        })
        assert response.status_code == 200
        
        pi = response.json()["data"][0]
        working_days = {0, 2, 4}  # Mon, Wed, Fri
        
        # Check PI dates
        pi_start = date.fromisoformat(pi["start_date"])
        pi_end = date.fromisoformat(pi["end_date"])
        assert pi_start.weekday() in working_days, f"PI starts on {get_day_name(pi_start)}"
        assert pi_end.weekday() in working_days, f"PI ends on {get_day_name(pi_end)}"
        
        # Check all iteration dates
        for iteration in pi["iterations"]:
            start = date.fromisoformat(iteration["start_date"])
            end = date.fromisoformat(iteration["end_date"])
            assert start.weekday() in working_days, f"{iteration['name']} starts on {get_day_name(start)}"
            assert end.weekday() in working_days, f"{iteration['name']} ends on {get_day_name(end)}"

    def test_custom_working_days_tue_thu(self):
        """Test PI generation with Tue/Thu only working days"""
        client.get("/api/settings/global/2026")
        client.put("/api/settings/global/2026", json={
            "working_days": "tue,thu"
        })
        
        # Start on Tuesday 2026-01-06
        response = client.post("/api/pis/generate", json={
            "year": 2026,
            "start_date": "2026-01-06",  # Tuesday
            "iterations_per_pi": 2,
            "iteration_weeks": 2,
            "pi_count": 1
        })
        assert response.status_code == 200
        
        pi = response.json()["data"][0]
        working_days = {1, 3}  # Tue, Thu
        
        for iteration in pi["iterations"]:
            start = date.fromisoformat(iteration["start_date"])
            end = date.fromisoformat(iteration["end_date"])
            assert start.weekday() in working_days, f"{iteration['name']} starts on {get_day_name(start)}"
            assert end.weekday() in working_days, f"{iteration['name']} ends on {get_day_name(end)}"

    def test_start_on_non_working_day_adjusted_custom(self):
        """Test start date adjustment with custom working days"""
        client.get("/api/settings/global/2026")
        client.put("/api/settings/global/2026", json={
            "working_days": "wed,fri"  # Only Wed and Fri
        })
        
        # Start on Monday - should adjust to Wednesday
        response = client.post("/api/pis/generate", json={
            "year": 2026,
            "start_date": "2026-01-05",  # Monday
            "iterations_per_pi": 2,
            "iteration_weeks": 1,
            "pi_count": 1
        })
        assert response.status_code == 200
        
        pi = response.json()["data"][0]
        start = date.fromisoformat(pi["start_date"])
        
        # Should be Wednesday (weekday 2)
        assert start.weekday() == 2, f"Expected Wednesday, got {get_day_name(start)}"

    def test_consecutive_pis_start_on_working_days(self):
        """Test that consecutive PIs all start on working days"""
        client.get("/api/settings/global/2026")
        
        response = client.post("/api/pis/generate", json={
            "year": 2026,
            "start_date": "2026-01-05",
            "iterations_per_pi": 5,
            "iteration_weeks": 2,
            "pi_count": 4
        })
        assert response.status_code == 200
        
        pis = response.json()["data"]
        assert len(pis) == 4
        
        for i, pi in enumerate(pis):
            start = date.fromisoformat(pi["start_date"])
            end = date.fromisoformat(pi["end_date"])
            
            assert start.weekday() < 5, f"PI {i+1} starts on weekend: {get_day_name(start)}"
            assert end.weekday() < 5, f"PI {i+1} ends on weekend: {get_day_name(end)}"
            
            # Verify no gaps - next PI should start day after previous ends (adjusted for working day)
            if i < len(pis) - 1:
                next_start = date.fromisoformat(pis[i+1]["start_date"])
                # Next PI should start within a few days of current PI ending
                gap = (next_start - end).days
                assert 1 <= gap <= 3, f"Gap between PI {i+1} and PI {i+2} is {gap} days"

    def test_iteration_continuity(self):
        """Test iterations are continuous with no gaps (except weekends)"""
        client.get("/api/settings/global/2026")
        
        response = client.post("/api/pis/generate", json={
            "year": 2026,
            "start_date": "2026-01-05",
            "iterations_per_pi": 5,
            "iteration_weeks": 2,
            "pi_count": 1
        })
        assert response.status_code == 200
        
        iterations = response.json()["data"][0]["iterations"]
        
        for i in range(len(iterations) - 1):
            current_end = date.fromisoformat(iterations[i]["end_date"])
            next_start = date.fromisoformat(iterations[i+1]["start_date"])
            
            # Gap should be 1-3 days (accounting for weekend)
            gap = (next_start - current_end).days
            assert 1 <= gap <= 3, f"Gap between iteration {i+1} and {i+2} is {gap} days"

    def test_working_days_with_saturday(self):
        """Test working days including Saturday"""
        client.get("/api/settings/global/2026")
        client.put("/api/settings/global/2026", json={
            "working_days": "mon,tue,wed,thu,fri,sat"  # 6-day work week
        })
        
        response = client.post("/api/pis/generate", json={
            "year": 2026,
            "start_date": "2026-01-05",
            "iterations_per_pi": 3,
            "iteration_weeks": 2,
            "pi_count": 1
        })
        assert response.status_code == 200
        
        pi = response.json()["data"][0]
        working_days = {0, 1, 2, 3, 4, 5}  # Mon-Sat
        
        for iteration in pi["iterations"]:
            start = date.fromisoformat(iteration["start_date"])
            end = date.fromisoformat(iteration["end_date"])
            # Sunday (6) should not be a start/end date
            assert start.weekday() != 6, f"{iteration['name']} starts on Sunday"
            assert end.weekday() != 6, f"{iteration['name']} ends on Sunday"


class TestIterationWorkingDays:
    """Test that iteration add/update respects working days"""

    def test_add_iteration_adjusts_to_working_day(self):
        """Test adding iteration with non-working day start gets adjusted"""
        client.get("/api/settings/global/2026")
        
        # Generate a PI first
        response = client.post("/api/pis/generate", json={
            "year": 2026,
            "start_date": "2026-01-05",  # Monday
            "iterations_per_pi": 2,
            "iteration_weeks": 2,
            "pi_count": 1
        })
        assert response.status_code == 200
        pi_id = response.json()["data"][0]["id"]
        
        # Add iteration starting on Saturday - should be adjusted
        response = client.post(f"/api/pis/{pi_id}/iterations", json={
            "name": "Sprint 3",
            "sequence": 3,
            "start_date": "2026-02-07",  # Saturday
            "end_date": "2026-02-20",
            "duration_weeks": 2,
            "is_ip_iteration": False
        })
        assert response.status_code == 201
        
        iteration = response.json()
        start = date.fromisoformat(iteration["start_date"])
        end = date.fromisoformat(iteration["end_date"])
        
        # Should be adjusted to working days
        assert start.weekday() < 5, f"Start should be weekday, got {get_day_name(start)}"
        assert end.weekday() < 5, f"End should be weekday, got {get_day_name(end)}"

    def test_add_iteration_shifts_following_to_working_days(self):
        """Test that adding iteration shifts following iterations to working days"""
        client.get("/api/settings/global/2026")
        
        # Generate PI with 3 iterations
        response = client.post("/api/pis/generate", json={
            "year": 2026,
            "start_date": "2026-01-05",
            "iterations_per_pi": 3,
            "iteration_weeks": 2,
            "pi_count": 1
        })
        assert response.status_code == 200
        pi = response.json()["data"][0]
        pi_id = pi["id"]
        
        # Insert new iteration at sequence 2 (shifts Sprint 2 and Sprint 3)
        response = client.post(f"/api/pis/{pi_id}/iterations", json={
            "name": "New Sprint",
            "sequence": 2,
            "start_date": "2026-01-19",  # Monday
            "end_date": "2026-01-30",
            "duration_weeks": 2,
            "is_ip_iteration": False
        })
        assert response.status_code == 201
        
        # Get updated PI
        response = client.get(f"/api/pis/{pi_id}")
        assert response.status_code == 200
        
        updated_pi = response.json()
        for iteration in updated_pi["iterations"]:
            start = date.fromisoformat(iteration["start_date"])
            end = date.fromisoformat(iteration["end_date"])
            assert start.weekday() < 5, f"{iteration['name']} starts on {get_day_name(start)}"
            assert end.weekday() < 5, f"{iteration['name']} ends on {get_day_name(end)}"

    def test_update_iteration_duration_respects_working_days(self):
        """Test updating iteration duration calculates end date on working day"""
        client.get("/api/settings/global/2026")
        
        # Generate PI
        response = client.post("/api/pis/generate", json={
            "year": 2026,
            "start_date": "2026-01-05",
            "iterations_per_pi": 2,
            "iteration_weeks": 2,
            "pi_count": 1
        })
        assert response.status_code == 200
        iteration_id = response.json()["data"][0]["iterations"][0]["id"]
        
        # Update duration
        response = client.put(f"/api/pis/iterations/{iteration_id}", json={
            "duration_weeks": 3
        })
        assert response.status_code == 200
        
        iteration = response.json()
        end = date.fromisoformat(iteration["end_date"])
        assert end.weekday() < 5, f"End should be weekday, got {get_day_name(end)}"

    def test_update_iteration_start_date_adjusted(self):
        """Test updating iteration start date to weekend gets adjusted"""
        client.get("/api/settings/global/2026")
        
        response = client.post("/api/pis/generate", json={
            "year": 2026,
            "start_date": "2026-01-05",
            "iterations_per_pi": 2,
            "iteration_weeks": 2,
            "pi_count": 1
        })
        assert response.status_code == 200
        iteration_id = response.json()["data"][0]["iterations"][0]["id"]
        
        # Update start date to Saturday
        response = client.put(f"/api/pis/iterations/{iteration_id}", json={
            "start_date": "2026-01-10"  # Saturday
        })
        assert response.status_code == 200
        
        iteration = response.json()
        start = date.fromisoformat(iteration["start_date"])
        # Should be adjusted to Monday (2026-01-12)
        assert start.weekday() == 0, f"Expected Monday, got {get_day_name(start)}"

    def test_custom_working_days_respected_on_add(self):
        """Test custom working days (Mon/Wed/Fri) respected when adding iteration"""
        client.get("/api/settings/global/2026")
        client.put("/api/settings/global/2026", json={
            "working_days": "mon,wed,fri"
        })
        
        response = client.post("/api/pis/generate", json={
            "year": 2026,
            "start_date": "2026-01-05",  # Monday
            "iterations_per_pi": 2,
            "iteration_weeks": 2,
            "pi_count": 1
        })
        assert response.status_code == 200
        pi_id = response.json()["data"][0]["id"]
        
        # Add iteration starting on Tuesday - should adjust to Wednesday
        response = client.post(f"/api/pis/{pi_id}/iterations", json={
            "name": "Sprint 3",
            "sequence": 3,
            "start_date": "2026-02-03",  # Tuesday
            "end_date": "2026-02-13",
            "duration_weeks": 2,
            "is_ip_iteration": False
        })
        assert response.status_code == 201
        
        iteration = response.json()
        start = date.fromisoformat(iteration["start_date"])
        end = date.fromisoformat(iteration["end_date"])
        
        working_days = {0, 2, 4}  # Mon, Wed, Fri
        assert start.weekday() in working_days, f"Start {start} is {get_day_name(start)}"
        assert end.weekday() in working_days, f"End {end} is {get_day_name(end)}"


class TestPIWorkingDaysEdgeCases:
    """Edge case tests for PI working days alignment"""

    def test_year_without_settings_uses_defaults(self):
        """Test that year without settings uses default Mon-Fri"""
        # Don't create settings for 2027
        response = client.post("/api/pis/generate", json={
            "year": 2027,
            "start_date": "2027-01-04",  # Monday
            "iterations_per_pi": 3,
            "iteration_weeks": 2,
            "pi_count": 1
        })
        assert response.status_code == 200
        
        pi = response.json()["data"][0]
        start = date.fromisoformat(pi["start_date"])
        
        # Should use default Mon-Fri
        assert start.weekday() < 5

    def test_single_working_day_per_week(self):
        """Test with only one working day per week"""
        client.get("/api/settings/global/2026")
        client.put("/api/settings/global/2026", json={
            "working_days": "wed"  # Only Wednesday
        })
        
        response = client.post("/api/pis/generate", json={
            "year": 2026,
            "start_date": "2026-01-07",  # Wednesday
            "iterations_per_pi": 2,
            "iteration_weeks": 2,
            "pi_count": 1
        })
        assert response.status_code == 200
        
        pi = response.json()["data"][0]
        
        for iteration in pi["iterations"]:
            start = date.fromisoformat(iteration["start_date"])
            end = date.fromisoformat(iteration["end_date"])
            assert start.weekday() == 2, f"Start should be Wednesday, got {get_day_name(start)}"
            assert end.weekday() == 2, f"End should be Wednesday, got {get_day_name(end)}"
