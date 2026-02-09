"""Migrate jira_records data from old schema to new schema"""
import sqlite3

db_path = "safe_train.db"

print(f"Migrating jira_records data in: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Step 1: Migrate data from old columns to new columns
print("\n1. Migrating data from old columns to new columns...")

# Migrate summary -> title
cursor.execute("UPDATE jira_records SET title = summary WHERE title IS NULL AND summary IS NOT NULL")
rows_updated = cursor.rowcount
print(f"   Migrated summary -> title: {rows_updated} rows")

# Migrate remarks -> description
cursor.execute("UPDATE jira_records SET description = remarks WHERE description IS NULL AND remarks IS NOT NULL")
rows_updated = cursor.rowcount
print(f"   Migrated remarks -> description: {rows_updated} rows")

# Set default values for new required columns
cursor.execute("UPDATE jira_records SET planned_effort = 0 WHERE planned_effort IS NULL")
rows_updated = cursor.rowcount
print(f"   Set default planned_effort: {rows_updated} rows")

cursor.execute("UPDATE jira_records SET status = 'PLANNED' WHERE status = 'planned'")
cursor.execute("UPDATE jira_records SET status = 'IN_PROGRESS' WHERE status = 'in_progress'")
cursor.execute("UPDATE jira_records SET status = 'COMPLETED' WHERE status = 'done'")
cursor.execute("UPDATE jira_records SET status = 'SPILLOVER' WHERE status = 'spillover'")
print(f"   Updated status values to uppercase")

# Set title for any records that still don't have one
cursor.execute("UPDATE jira_records SET title = 'Untitled' WHERE title IS NULL OR title = ''")
rows_updated = cursor.rowcount
print(f"   Set default title for records: {rows_updated} rows")

conn.commit()

# Step 2: Verify data
print("\n2. Verifying migrated data...")
cursor.execute("SELECT id, jira_key, title, status, planned_effort FROM jira_records")
records = cursor.fetchall()
print(f"   Total records: {len(records)}")
for record in records:
    print(f"   - {record[1] or 'No Key'}: {record[2]} (Status: {record[3]}, Effort: {record[4]})")

# Step 3: Check for NULL values in required columns
print("\n3. Checking for NULL values in required columns...")
cursor.execute("SELECT COUNT(*) FROM jira_records WHERE title IS NULL OR title = ''")
null_titles = cursor.fetchone()[0]
if null_titles > 0:
    print(f"   ⚠️  {null_titles} records have NULL or empty title")
else:
    print(f"   ✅ All records have title")

cursor.execute("SELECT COUNT(*) FROM jira_records WHERE feature_id IS NULL")
null_features = cursor.fetchone()[0]
if null_features > 0:
    print(f"   ⚠️  {null_features} records have NULL feature_id")
else:
    print(f"   ✅ All records have feature_id")

conn.close()
print("\n✅ Migration complete! Restart the backend.")
print("\nNote: Old columns (summary, remarks, is_spillover, etc.) are still present")
print("but are no longer used. They can be safely ignored.")
