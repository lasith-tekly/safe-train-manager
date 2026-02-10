"""
Fix record_history table - Add missing field_name column
"""
import sqlite3
from pathlib import Path

db_path = Path(__file__).parent / "safe_train.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check if field_name column exists
    cursor.execute("PRAGMA table_info(record_history)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'field_name' not in columns:
        print("Adding field_name column...")
        cursor.execute("ALTER TABLE record_history ADD COLUMN field_name VARCHAR(100)")
        conn.commit()
        print("✅ Added field_name column")
    else:
        print("⏭️  field_name column already exists")
    
    # Verify
    cursor.execute("PRAGMA table_info(record_history)")
    columns = cursor.fetchall()
    print(f"\n📋 Total columns: {len(columns)}")
    print("Columns:", [c[1] for c in columns])
    
    # Check data
    cursor.execute("SELECT COUNT(*) FROM record_history")
    count = cursor.fetchone()[0]
    print(f"\n📊 Total history records: {count}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    conn.rollback()
finally:
    conn.close()
