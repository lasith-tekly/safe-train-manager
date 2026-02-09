# Fix: No Roadmaps Showing

## Problem
Frontend shows "No products found" and backend logs show errors loading features.

## Root Cause
The version control system was added but migrations haven't been run, so the database is missing:
- `roadmap_versions` table
- `version_id` column in `roadmap_features` table

## Solution

### Step 1: Run Migrations

**Open a new terminal and run:**

```bash
cd backend

# If using virtual environment, activate it first:
# source venv/bin/activate  # or your venv path

# Run migrations
python -m alembic upgrade head

# OR if alembic is installed globally:
alembic upgrade head
```

**Expected output:**
```
INFO  [alembic.runtime.migration] Running upgrade ... -> 2026_02_05_add_roadmap_versions
INFO  [alembic.runtime.migration] Running upgrade ... -> 2026_02_05_migrate_features_to_versions
```

### Step 2: Restart Backend

**In your backend terminal:**
1. Press `Ctrl+C` to stop the backend
2. Restart it:
```bash
uvicorn app.main:app --reload
```

### Step 3: Refresh Frontend

**In your browser:**
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Navigate to Roadmap Planning page

---

## If Migrations Fail

### Error: "command not found: alembic"

**Fix:** Install alembic or use python -m
```bash
cd backend
pip install alembic
# OR
python3 -m alembic upgrade head
```

### Error: "command not found: python"

**Fix:** Use python3
```bash
cd backend
python3 -m alembic upgrade head
```

### Error: "No module named 'alembic'"

**Fix:** Install dependencies
```bash
cd backend
pip install -r requirements.txt
# OR
pip3 install -r requirements.txt
```

---

## Manual Migration (If Auto Migration Fails)

If the migration files don't work, run this SQL directly:

```sql
-- Create roadmap_versions table
CREATE TABLE roadmap_versions (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    version_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP,
    CONSTRAINT valid_version_status CHECK (status IN ('DRAFT', 'PUBLISHED'))
);

-- Create indexes
CREATE INDEX ix_roadmap_versions_product_id ON roadmap_versions(product_id);
CREATE INDEX ix_roadmap_versions_status ON roadmap_versions(status);
CREATE INDEX ix_roadmap_versions_product_status ON roadmap_versions(product_id, status);

-- Add version_id to roadmap_features
ALTER TABLE roadmap_features ADD COLUMN version_id VARCHAR(36) REFERENCES roadmap_versions(id) ON DELETE CASCADE;
CREATE INDEX ix_roadmap_features_version_id ON roadmap_features(version_id);

-- Create initial versions for existing products
INSERT INTO roadmap_versions (id, product_id, version_name, status, description, created_at)
SELECT 
    gen_random_uuid()::text,
    id,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') || ' Initial',
    'PUBLISHED',
    'Initial published version created during migration',
    CURRENT_TIMESTAMP
FROM products
WHERE EXISTS (SELECT 1 FROM roadmap_features WHERE roadmap_features.product_id = products.id);

-- Link existing features to their product's published version
UPDATE roadmap_features rf
SET version_id = rv.id
FROM roadmap_versions rv
WHERE rf.product_id = rv.product_id
AND rv.status = 'PUBLISHED'
AND rf.version_id IS NULL;

-- Create draft versions for products with features
INSERT INTO roadmap_versions (id, product_id, version_name, status, description, created_at)
SELECT 
    gen_random_uuid()::text,
    product_id,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'),
    'DRAFT',
    'Current working draft',
    CURRENT_TIMESTAMP
FROM roadmap_versions
WHERE status = 'PUBLISHED'
GROUP BY product_id;
```

**To run SQL:**
```bash
# Connect to your database
psql -d your_database_name

# Paste the SQL above
# Then exit
\q
```

---

## Verify Fix Worked

### Test 1: Check Tables Exist
```bash
cd backend
python3 -c "
from sqlalchemy import inspect
from app.database import engine

inspector = inspect(engine)
tables = inspector.get_table_names()

print('roadmap_versions exists:', 'roadmap_versions' in tables)
print('roadmap_features exists:', 'roadmap_features' in tables)

if 'roadmap_features' in tables:
    columns = [col['name'] for col in inspector.get_columns('roadmap_features')]
    print('version_id column exists:', 'version_id' in columns)
"
```

### Test 2: Check Backend API
```bash
# Test health
curl http://localhost:8000/health

# Test products (replace with your product ID)
curl http://localhost:8000/api/products

# Test versions (replace {product_id})
curl http://localhost:8000/api/products/{product_id}/roadmap-versions
```

### Test 3: Check Frontend
1. Open browser to http://localhost:5173
2. Navigate to Roadmap Planning
3. You should see:
   - Version selector at top
   - Products list
   - Features table

---

## Alternative: Temporary Workaround

If you need to see roadmaps immediately while fixing migrations, you can temporarily disable version checking:

### Option A: Make version_id nullable (already is)
The migration already makes `version_id` nullable, so existing features should still load.

### Option B: Update frontend to handle missing versions
The frontend should gracefully handle when no versions exist yet.

---

## Complete Reset (Nuclear Option)

If nothing works, reset everything:

```bash
# 1. Stop backend (Ctrl+C)

# 2. Backup your database first!

# 3. Drop and recreate tables
cd backend
python3 -c "
from app.database import Base, engine
from app.models import *

# Drop all tables
Base.metadata.drop_all(bind=engine)

# Recreate all tables
Base.metadata.create_all(bind=engine)
"

# 4. Run migrations from scratch
python3 -m alembic stamp head

# 5. Restart backend
uvicorn app.main:app --reload
```

**WARNING:** This will delete all data!

---

## Expected Result After Fix

**Backend logs should show:**
```
INFO:     127.0.0.1:XXXXX - "GET /api/products HTTP/1.1" 200 OK
INFO:     127.0.0.1:XXXXX - "GET /api/products/{id}/roadmap-versions HTTP/1.1" 200 OK
```

**Frontend should show:**
- Version selector with dropdown
- "Create New Version" button
- Products list
- Features table with data

---

## Still Not Working?

**Share these details:**

1. **Migration status:**
   ```bash
   cd backend
   python3 -m alembic current
   ```

2. **Backend error (from terminal):**
   - Copy the full Python traceback

3. **Database check:**
   ```bash
   python3 -c "
   from sqlalchemy import inspect
   from app.database import engine
   inspector = inspect(engine)
   print('Tables:', inspector.get_table_names())
   "
   ```

4. **Browser console errors:**
   - Open DevTools (F12)
   - Check Console tab
   - Copy any red errors

---

**Quick Commands Summary:**

```bash
# Run migrations
cd backend
python3 -m alembic upgrade head

# Restart backend
# (Ctrl+C first, then:)
uvicorn app.main:app --reload

# Test it works
curl http://localhost:8000/health
curl http://localhost:8000/api/products
```

Then refresh your browser!
