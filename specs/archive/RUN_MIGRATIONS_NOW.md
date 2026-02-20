# Run Migrations - Step by Step

## Your Situation
You don't have `python`, `python3`, or `alembic` commands available in your terminal PATH.

## Solution: Use the Python that's running your backend

Since your backend is currently running, we know Python is installed. We just need to use the same Python.

---

## Option 1: Find Your Python (Recommended)

**Step 1: Check how your backend is running**

Look at your backend terminal. You should see something like:
```
uvicorn app.main:app --reload
```

**Step 2: Find the full path to Python**

Try these commands one by one until one works:

```bash
cd backend

# Try these in order:
/usr/bin/python3 --version
/usr/local/bin/python3 --version
/opt/homebrew/bin/python3 --version
python3 --version
python --version
```

**Step 3: Once you find the working Python, use it to run migrations**

Replace `/path/to/python3` with the path that worked above:

```bash
cd backend
/path/to/python3 run_migrations_simple.py
```

For example:
```bash
/usr/bin/python3 run_migrations_simple.py
# OR
/usr/local/bin/python3 run_migrations_simple.py
```

---

## Option 2: Use the Migration Script Directly

I created a simple Python script that doesn't require the `alembic` command.

**Just run:**

```bash
cd backend

# Try each of these until one works:
python3 run_migrations_simple.py
python run_migrations_simple.py
/usr/bin/python3 run_migrations_simple.py
/usr/local/bin/python3 run_migrations_simple.py
```

---

## Option 3: Manual SQL Migration

If Python isn't working, run the SQL directly in your database:

**Step 1: Connect to your database**

```bash
# Find your database connection details in backend/app/database.py
# Then connect with psql or your database tool

psql -d your_database_name
```

**Step 2: Copy and paste this SQL:**

```sql
-- Create roadmap_versions table
CREATE TABLE IF NOT EXISTS roadmap_versions (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    version_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP,
    CONSTRAINT fk_roadmap_versions_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT valid_version_status CHECK (status IN ('DRAFT', 'PUBLISHED'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS ix_roadmap_versions_product_id ON roadmap_versions(product_id);
CREATE INDEX IF NOT EXISTS ix_roadmap_versions_status ON roadmap_versions(status);
CREATE INDEX IF NOT EXISTS ix_roadmap_versions_product_status ON roadmap_versions(product_id, status);

-- Add version_id to roadmap_features
ALTER TABLE roadmap_features ADD COLUMN IF NOT EXISTS version_id VARCHAR(36);

-- Add foreign key
ALTER TABLE roadmap_features ADD CONSTRAINT IF NOT EXISTS fk_roadmap_features_version_id 
    FOREIGN KEY (version_id) REFERENCES roadmap_versions(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS ix_roadmap_features_version_id ON roadmap_features(version_id);

-- Create initial PUBLISHED version for each product that has features
INSERT INTO roadmap_versions (id, product_id, version_name, status, description, created_at)
SELECT 
    gen_random_uuid()::text,
    p.id,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') || ' Initial',
    'PUBLISHED',
    'Initial published version created during migration',
    CURRENT_TIMESTAMP
FROM products p
WHERE EXISTS (
    SELECT 1 FROM roadmap_features rf 
    WHERE rf.product_id = p.id
)
AND NOT EXISTS (
    SELECT 1 FROM roadmap_versions rv 
    WHERE rv.product_id = p.id AND rv.status = 'PUBLISHED'
);

-- Link existing features to their product's PUBLISHED version
UPDATE roadmap_features rf
SET version_id = rv.id
FROM roadmap_versions rv
WHERE rf.product_id = rv.product_id
AND rv.status = 'PUBLISHED'
AND rf.version_id IS NULL;

-- Create DRAFT version for each product that has a PUBLISHED version
INSERT INTO roadmap_versions (id, product_id, version_name, status, description, created_at)
SELECT 
    gen_random_uuid()::text,
    rv.product_id,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'),
    'DRAFT',
    'Current working draft',
    CURRENT_TIMESTAMP
FROM roadmap_versions rv
WHERE rv.status = 'PUBLISHED'
AND NOT EXISTS (
    SELECT 1 FROM roadmap_versions rv2 
    WHERE rv2.product_id = rv.product_id AND rv2.status = 'DRAFT'
)
GROUP BY rv.product_id;

-- Mark migration as complete
INSERT INTO alembic_version (version_num) 
VALUES ('2026_02_05_migrate_features_to_versions')
ON CONFLICT DO NOTHING;
```

**Step 3: Exit psql**
```sql
\q
```

---

## Option 4: Use VS Code / Windsurf Terminal

**Step 1: Open integrated terminal in VS Code/Windsurf**

**Step 2: Navigate to backend:**
```bash
cd backend
```

**Step 3: The integrated terminal should have access to Python. Try:**
```bash
python3 run_migrations_simple.py
```

---

## After Running Migrations

**Step 1: Restart Backend**
- Go to your backend terminal
- Press `Ctrl+C` to stop
- Run: `uvicorn app.main:app --reload`

**Step 2: Refresh Browser**
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

**Step 3: Navigate to Roadmap Planning**
- You should now see the version selector
- Products should load
- Features should appear

---

## Verify It Worked

**Test 1: Check backend logs**
Should show:
```
INFO: 127.0.0.1:XXXXX - "GET /api/products HTTP/1.1" 200 OK
```

**Test 2: Check browser console**
- Open DevTools (F12)
- Console tab should have no red errors

**Test 3: Check UI**
- Version selector visible at top
- Products list shows items
- Features table has data

---

## Still Having Issues?

**Share these details:**

1. **How is your backend currently running?**
   - What command did you use to start it?
   - Copy the exact command from your terminal

2. **What's in your backend terminal?**
   - Copy any error messages

3. **Database type:**
   - PostgreSQL? SQLite? MySQL?
   - How do you connect to it?

---

## Quick Summary

**Try these in order:**

1. `cd backend && python3 run_migrations_simple.py`
2. `cd backend && python run_migrations_simple.py`
3. Use the SQL migration (Option 3 above)
4. Share your backend startup command for more help

Then restart backend and refresh browser!
