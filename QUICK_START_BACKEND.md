# Quick Start - Backend with Roadmap Versioning

## 🚀 Fast Track (Copy & Paste)

```bash
# Navigate to backend
cd backend

# Run migrations
alembic upgrade head

# Start backend
uvicorn app.main:app --reload
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Test it works:**
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","service":"safe-train-manager-api"}
```

---

## 📋 Step-by-Step Guide

### Step 1: Check Migration Status

```bash
cd backend
alembic current
```

**Expected:** Shows current migration revision

### Step 2: Run Migrations

```bash
alembic upgrade head
```

**Expected output:**
```
INFO  [alembic.runtime.migration] Running upgrade ... -> 2026_02_05_add_roadmap_versions
INFO  [alembic.runtime.migration] Running upgrade ... -> 2026_02_05_migrate_features_to_versions
```

**If you see errors**, check the troubleshooting section below.

### Step 3: Verify Tables Created

```bash
python test_backend_startup.py
```

**Expected:** All tests pass with ✅

### Step 4: Start Backend

```bash
uvicorn app.main:app --reload
```

**Backend should start on:** http://localhost:8000

### Step 5: Test Endpoints

**Health check:**
```bash
curl http://localhost:8000/health
```

**API docs:**
Open browser: http://localhost:8000/docs

**List products:**
```bash
curl http://localhost:8000/api/products
```

**List versions (replace {product_id}):**
```bash
curl http://localhost:8000/api/products/{product_id}/roadmap-versions
```

---

## 🔧 Using the Helper Script

We've created a helper script that does everything:

```bash
cd backend
./run_migrations.sh
```

This will:
1. Show current migration status
2. Run all pending migrations
3. Verify tables were created
4. Show next steps

---

## ❌ Common Errors & Fixes

### Error: "Can't locate revision identified by '...'"

**Cause:** Migration chain is broken

**Fix:**
```bash
# Check migration history
alembic history

# If broken, reset to a known good state
alembic downgrade base
alembic upgrade head
```

### Error: "relation 'roadmap_versions' already exists"

**Cause:** Table already exists from previous attempt

**Fix:**
```bash
# Mark migration as complete without running it
alembic stamp 2026_02_05_migrate_features_to_versions
```

### Error: "column 'version_id' already exists"

**Cause:** Column was added manually or by previous migration

**Fix:**
```bash
# Mark migration as complete
alembic stamp 2026_02_05_add_roadmap_versions
alembic upgrade head
```

### Error: "No module named 'app'"

**Cause:** Not in backend directory or virtual environment not activated

**Fix:**
```bash
# Make sure you're in backend directory
cd backend

# Activate virtual environment if you have one
source venv/bin/activate  # or your venv path
```

### Error: "could not connect to server"

**Cause:** PostgreSQL not running

**Fix:**
```bash
# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql

# Or check if it's running
pg_isready
```

---

## 🧪 Verify Everything Works

### Test 1: Backend Health
```bash
curl http://localhost:8000/health
```
**Expected:** `{"status":"healthy",...}`

### Test 2: API Documentation
Open: http://localhost:8000/docs
**Expected:** Swagger UI with all endpoints

### Test 3: Products Endpoint
```bash
curl http://localhost:8000/api/products
```
**Expected:** List of products (or empty array)

### Test 4: Versions Endpoint
```bash
# Replace {product_id} with actual product ID
curl http://localhost:8000/api/products/{product_id}/roadmap-versions
```
**Expected:** `{"items": [...], "total": ...}`

### Test 5: Create Version
```bash
curl -X POST http://localhost:8000/api/products/{product_id}/roadmap-versions \
  -H "Content-Type: application/json" \
  -d '{"version_name": "2026-02-05", "description": "Test version"}'
```
**Expected:** New version object returned

---

## 🎯 Success Checklist

- [ ] Migrations run successfully
- [ ] `roadmap_versions` table exists
- [ ] `version_id` column exists in `roadmap_features`
- [ ] Backend starts without errors
- [ ] `/health` endpoint returns 200
- [ ] `/docs` shows version endpoints
- [ ] Can list versions
- [ ] Can create version
- [ ] Can publish version

---

## 🔄 Start Fresh (Nuclear Option)

If everything is broken and you want to start over:

```bash
# WARNING: This will delete all data!

# 1. Downgrade all migrations
alembic downgrade base

# 2. Upgrade to latest
alembic upgrade head

# 3. Verify
python test_backend_startup.py

# 4. Start backend
uvicorn app.main:app --reload
```

---

## 📊 Migration Files

The following migration files should exist:

```
backend/alembic/versions/
├── 2026_02_05_add_roadmap_versions.py      ← Creates table & adds column
└── 2026_02_05_migrate_features_to_versions.py  ← Migrates existing data
```

**To check:**
```bash
ls -la backend/alembic/versions/ | grep 2026_02_05
```

---

## 🐛 Still Having Issues?

1. **Run diagnostic script:**
   ```bash
   cd backend
   python test_backend_startup.py
   ```

2. **Check backend logs:**
   - Look for Python traceback
   - Note the exact error message

3. **Share the error:**
   - Copy full error from terminal
   - Include migration status: `alembic current`
   - Include table list from diagnostic script

4. **Check database:**
   ```bash
   # Connect to database
   psql -d your_database
   
   # List tables
   \dt
   
   # Check roadmap_versions table
   \d roadmap_versions
   
   # Check roadmap_features columns
   \d roadmap_features
   ```

---

## 🎉 Next Steps After Backend is Running

1. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open Application:**
   http://localhost:5173

3. **Navigate to Roadmap:**
   - Click on a product
   - You should see the version selector

4. **Test Version Control:**
   - Create new version
   - Switch between versions
   - Publish a version
   - Verify read-only mode

---

## 📝 Environment Variables

If you need to configure database connection:

```bash
# backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

Or in `backend/app/database.py`:
```python
DATABASE_URL = "postgresql://user:password@localhost:5432/dbname"
```

---

**Last Updated:** February 5, 2026  
**Status:** Ready to use  
**Support:** Run `python test_backend_startup.py` for diagnostics
