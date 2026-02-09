"""Fix jira_records table - add missing columns"""
import sqlite3
import os

# Find the database file
db_path = "safe_train.db"  # Default for this project

if not os.path.exists(db_path):
    # Try common locations
    for path in ["./safe_train.db", "./app.db", "./data/app.db", "../safe_train.db"]:
        if os.path.exists(path):
            db_path = path
            break

if not os.path.exists(db_path):
    print("❌ Database file not found!")
    print("Please specify the correct path.")
    exit(1)

print(f"Using database: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check if table exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='jira_records'")
if not cursor.fetchone():
    print("❌ jira_records table does not exist!")
    conn.close()
    exit(1)

# Check current table structure
print("\n1. Current jira_records structure:")
cursor.execute("PRAGMA table_info(jira_records)")
columns = cursor.fetchall()
for col in columns:
    print(f"   {col[1]} ({col[2]})")

existing_columns = [col[1] for col in columns]

# Columns that should exist
required_columns = {
    'id': 'VARCHAR(36)',
    'jira_key': 'VARCHAR(50)',
    'title': 'VARCHAR(255)',
    'description': 'TEXT',
    'feature_id': 'VARCHAR(36)',
    'team_id': 'VARCHAR(36)',
    'pi_id': 'VARCHAR(36)',
    'planned_effort': 'FLOAT DEFAULT 0',
    'actual_effort': 'FLOAT',
    'status': 'VARCHAR(20) DEFAULT "PLANNED"',
    'spillover_from_pi_id': 'VARCHAR(36)',
    'spillover_reason': 'VARCHAR(100)',
    'created_at': 'DATETIME',
    'updated_at': 'DATETIME'
}

# Add missing columns
print("\n2. Adding missing columns...")
added_count = 0
for col_name, col_type in required_columns.items():
    if col_name not in existing_columns:
        try:
            sql = f"ALTER TABLE jira_records ADD COLUMN {col_name} {col_type}"
            print(f"   Adding: {col_name} ({col_type})")
            cursor.execute(sql)
            added_count += 1
        except Exception as e:
            print(f"   ⚠️  Error adding {col_name}: {e}")

if added_count == 0:
    print("   No columns needed to be added.")
else:
    print(f"   Added {added_count} column(s)")

conn.commit()

# Verify
print("\n3. Updated jira_records structure:")
cursor.execute("PRAGMA table_info(jira_records)")
columns = cursor.fetchall()
for col in columns:
    print(f"   {col[1]} ({col[2]})")

# Check for any data
cursor.execute("SELECT COUNT(*) FROM jira_records")
count = cursor.fetchone()[0]
print(f"\n4. Records in table: {count}")

conn.close()
print("\n✅ Done! Restart the backend with: python3 -m uvicorn app.main:app --reload")
