import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db

# Create in-memory SQLite database for testing
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
    """Create tables before each test and drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


class TestProductsAPI:
    """Test cases for Products API endpoints."""

    def test_list_products_empty(self):
        """Test listing products when none exist."""
        response = client.get("/api/products")
        assert response.status_code == 200
        data = response.json()
        assert data["data"] == []
        assert data["total"] == 0

    def test_create_product_success(self):
        """Test creating a product successfully."""
        response = client.post("/api/products", json={
            "name": "Business Risk Solutions",
            "short_code": "BRS",
            "description": "Risk management solutions",
            "status": "active"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Business Risk Solutions"
        assert data["short_code"] == "BRS"
        assert data["status"] == "active"
        assert "id" in data

    def test_create_product_auto_uppercase_code(self):
        """Test that short_code is auto-uppercased."""
        response = client.post("/api/products", json={
            "name": "Financial Management",
            "short_code": "fm",
            "status": "active"
        })
        assert response.status_code == 201
        assert response.json()["short_code"] == "FM"

    def test_create_product_duplicate_name(self):
        """Test creating product with duplicate name fails."""
        # Create first product
        client.post("/api/products", json={
            "name": "Test Product",
            "short_code": "TST1",
            "status": "active"
        })

        # Try to create with same name
        response = client.post("/api/products", json={
            "name": "Test Product",
            "short_code": "TST2",
            "status": "active"
        })
        assert response.status_code == 400
        assert "name already exists" in response.json()["detail"]

    def test_create_product_duplicate_short_code(self):
        """Test creating product with duplicate short_code fails."""
        # Create first product
        client.post("/api/products", json={
            "name": "Product One",
            "short_code": "DUP",
            "status": "active"
        })

        # Try to create with same short_code
        response = client.post("/api/products", json={
            "name": "Product Two",
            "short_code": "DUP",
            "status": "active"
        })
        assert response.status_code == 400
        assert "short code already exists" in response.json()["detail"]

    def test_create_product_invalid_short_code(self):
        """Test creating product with invalid short_code fails."""
        response = client.post("/api/products", json={
            "name": "Test Product",
            "short_code": "A",  # Too short
            "status": "active"
        })
        assert response.status_code == 422

    def test_get_product_by_id(self):
        """Test getting a single product by ID."""
        # Create product
        create_response = client.post("/api/products", json={
            "name": "Test Product",
            "short_code": "TEST",
            "status": "active"
        })
        product_id = create_response.json()["id"]

        # Get product
        response = client.get(f"/api/products/{product_id}")
        assert response.status_code == 200
        assert response.json()["name"] == "Test Product"

    def test_get_product_not_found(self):
        """Test getting non-existent product returns 404."""
        response = client.get("/api/products/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 404

    def test_update_product(self):
        """Test updating a product."""
        # Create product
        create_response = client.post("/api/products", json={
            "name": "Original Name",
            "short_code": "ORIG",
            "status": "active"
        })
        product_id = create_response.json()["id"]

        # Update product
        response = client.put(f"/api/products/{product_id}", json={
            "name": "Updated Name",
            "description": "New description"
        })
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"
        assert response.json()["description"] == "New description"
        assert response.json()["short_code"] == "ORIG"  # Unchanged

    def test_update_product_status(self):
        """Test updating product status."""
        # Create product
        create_response = client.post("/api/products", json={
            "name": "Test Product",
            "short_code": "TEST",
            "status": "active"
        })
        product_id = create_response.json()["id"]

        # Deactivate
        response = client.put(f"/api/products/{product_id}", json={
            "status": "inactive"
        })
        assert response.status_code == 200
        assert response.json()["status"] == "inactive"

    def test_delete_product(self):
        """Test deleting a product."""
        # Create product
        create_response = client.post("/api/products", json={
            "name": "To Delete",
            "short_code": "DEL",
            "status": "active"
        })
        product_id = create_response.json()["id"]

        # Delete product
        response = client.delete(f"/api/products/{product_id}")
        assert response.status_code == 204

        # Verify deleted
        get_response = client.get(f"/api/products/{product_id}")
        assert get_response.status_code == 404

    def test_list_products_with_filter(self):
        """Test listing products with status filter."""
        # Create active product
        client.post("/api/products", json={
            "name": "Active Product",
            "short_code": "ACT",
            "status": "active"
        })

        # Create inactive product
        client.post("/api/products", json={
            "name": "Inactive Product",
            "short_code": "INACT",
            "status": "inactive"
        })

        # Filter by active
        response = client.get("/api/products?status=active")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["data"][0]["name"] == "Active Product"

    def test_list_products_with_search(self):
        """Test listing products with search."""
        # Create products
        client.post("/api/products", json={
            "name": "Business Risk Solutions",
            "short_code": "BRS",
            "status": "active"
        })
        client.post("/api/products", json={
            "name": "Financial Management",
            "short_code": "FM",
            "status": "active"
        })

        # Search by name
        response = client.get("/api/products?search=Business")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["data"][0]["short_code"] == "BRS"

        # Search by code
        response = client.get("/api/products?search=FM")
        data = response.json()
        assert data["total"] == 1
        assert data["data"][0]["name"] == "Financial Management"


class TestHealthCheck:
    """Test health check endpoint."""

    def test_health_check(self):
        """Test health check returns healthy status."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
