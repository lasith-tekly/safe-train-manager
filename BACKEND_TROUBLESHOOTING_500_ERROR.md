# Backend 500 Error Troubleshooting Guide

## Quick Diagnosis

Run the diagnostic script to identify the exact issue:

```bash
cd backend
python test_backend_startup.py
```

This will test all imports, relationships, and database connections.

---

## Common Issues & Fixes

### Issue 1: Migrations Not Run

**Symptoms:**
- 500 error on all endpoints
- "relation 'roadmap_versions' does not exist" in logs

**Fix:**
```bash
cd backend
alembic upgrade head
```

**Verify:**
```bash
# Check if table exists
psql -d your_database -c "\dt roadmap_versions"
```

---

### Issue 2: Missing Model Relationships

**Symptoms:**
- AttributeError about missing relationships
- "Product has no attribute 'roadmap_versions'"

**Check Product Model:**
```python
# backend/app/models/product.py
roadmap_versions = relationship(
    "RoadmapVersion", 
    back_populates="product", 
    order_by="desc(RoadmapVersion.created_at)",
    cascade="all, delete-orphan"
)
```

**Check RoadmapFeature Model:**
```python
# backend/app/models/roadmap_v4.py
version_id = Column(String(36), ForeignKey("roadmap_versions.id", ondelete="CASCADE"), nullable=True)
roadmap_version = relationship("RoadmapVersion", back_populates="features")
```

---

### Issue 3: Circular Import

**Symptoms:**
- ImportError during startup
- "cannot import name 'X' from partially initialized module"

**Check:**
```bash
cd backend
python -c "from app.models import RoadmapVersion"
```

**Fix:**
- Ensure no circular imports between models
- Use TYPE_CHECKING for type hints

---

### Issue 4: Routes Not Registered

**Symptoms:**
- 404 on version endpoints
- Routes don't appear in /docs

**Check main.py:**
```python
from app.routes.roadmap_versions import router as roadmap_versions_router
app.include_router(roadmap_versions_router)
```

---

### Issue 5: Database Connection Failed

**Symptoms:**
- "could not connect to server"
- "FATAL: database does not exist"

**Fix:**
```bash
# Check if PostgreSQL is running
pg_isready

# Check connection string
# backend/app/database.py
DATABASE_URL = "postgresql://user:password@localhost/dbname"
```

---

## Step-by-Step Debug Process

### Step 1: Check Backend Logs

```bash
cd backend
uvicorn app.main:app --reload --log-level debug
```

Look for the Python traceback showing the exact error.

### Step 2: Test Imports

```bash
cd backend
python -c "from app.main import app; print('Success')"
```

If this fails, you have an import error.

### Step 3: Check Database

```bash
# Test connection
psql -d your_database -c "SELECT 1;"

# Check if migrations ran
psql -d your_database -c "SELECT version_num FROM alembic_version;"

# Check if table exists
psql -d your_database -c "\dt roadmap_versions"
```

### Step 4: Test API Endpoint

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test products endpoint
curl http://localhost:8000/api/products

# Test versions endpoint
curl http://localhost:8000/api/products/{product_id}/roadmap-versions
```

---

## Error Messages & Solutions

### "relation 'roadmap_versions' does not exist"

**Solution:** Run migrations
```bash
cd backend
alembic upgrade head
```

### "column roadmap_features.version_id does not exist"

**Solution:** Run migrations
```bash
cd backend
alembic upgrade head
```

### "A draft version already exists"

**Solution:** This is expected behavior. Publish or delete the existing draft first.

### "Cannot edit features in a published version"

**Solution:** This is expected behavior. Create a new version to make changes.

### "ImportError: cannot import name 'RoadmapVersion'"

**Solution:** Check `backend/app/models/__init__.py` includes:
```python
from app.models.roadmap_version import RoadmapVersion
```

And in `__all__`:
```python
__all__ = [
    # ... other models
    "RoadmapVersion",
]
```

---

## Verification Checklist

After fixing issues, verify:

- [ ] Backend starts without errors
- [ ] `/health` endpoint returns 200
- [ ] `/api/products` endpoint returns data
- [ ] `/api/products/{id}/roadmap-versions` returns versions
- [ ] Can create version via POST
- [ ] Can publish version
- [ ] Frontend loads without CORS errors

---

## Quick Fixes

### Reset and Restart

```bash
# Stop backend (Ctrl+C)

# Run migrations
cd backend
alembic upgrade head

# Clear Python cache
find . -type d -name __pycache__ -exec rm -r {} +
find . -type f -name "*.pyc" -delete

# Restart backend
uvicorn app.main:app --reload
```

### Check Alembic Migration Status

```bash
cd backend
alembic current
alembic history
```

### Rollback Last Migration (if needed)

```bash
cd backend
alembic downgrade -1
alembic upgrade head
```

---

## Still Having Issues?

1. **Share the full error traceback** from backend terminal
2. **Run diagnostic script** and share output:
   ```bash
   cd backend
   python test_backend_startup.py
   ```
3. **Check these files** are correct:
   - `backend/app/models/__init__.py` - RoadmapVersion exported
   - `backend/app/models/product.py` - roadmap_versions relationship
   - `backend/app/models/roadmap_v4.py` - version_id and relationship
   - `backend/app/main.py` - roadmap_versions_router registered

---

## Expected Behavior

**After successful fix:**

1. Backend starts without errors
2. Swagger UI accessible at http://localhost:8000/docs
3. Version endpoints visible in Swagger
4. Can list, create, and publish versions
5. Frontend loads and shows version selector

**Test with curl:**
```bash
# List versions
curl http://localhost:8000/api/products/{product_id}/roadmap-versions

# Create version
curl -X POST http://localhost:8000/api/products/{product_id}/roadmap-versions \
  -H "Content-Type: application/json" \
  -d '{"version_name": "2026-02-05", "description": "Test"}'

# Publish version
curl -X POST http://localhost:8000/api/products/{product_id}/roadmap-versions/{version_id}/publish \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

**Last Updated:** February 5, 2026  
**Status:** Ready for troubleshooting
