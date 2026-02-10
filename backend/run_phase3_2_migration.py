"""
Phase 3.2 Migration Script
Add missing columns to jira_records table for Spillover UX Improvements & Record Lifecycle
"""
import sqlite3
import sys
from pathlib import Path

def run_migration():
    """Add Phase 3.2 columns to jira_records table."""
    
    db_path = Path(__file__).parent / "safe_train.db"
    
    if not db_path.exists():
        print(f"❌ Database not found at: {db_path}")
        sys.exit(1)
    
    print(f"📁 Database: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check existing columns
        cursor.execute("PRAGMA table_info(jira_records)")
        existing_columns = {row[1] for row in cursor.fetchall()}
        print(f"✓ Found {len(existing_columns)} existing columns")
        
        columns_to_add = {
            'workflow_status': "ALTER TABLE jira_records ADD COLUMN workflow_status VARCHAR(50) DEFAULT 'PLANNED'",
            'is_spillover': "ALTER TABLE jira_records ADD COLUMN is_spillover BOOLEAN DEFAULT 0 NOT NULL",
            'spillover_category': "ALTER TABLE jira_records ADD COLUMN spillover_category VARCHAR(50)",
            'spillover_category_other': "ALTER TABLE jira_records ADD COLUMN spillover_category_other VARCHAR(500)",
            'spillover_effort': "ALTER TABLE jira_records ADD COLUMN spillover_effort FLOAT",
            'completed_effort': "ALTER TABLE jira_records ADD COLUMN completed_effort FLOAT DEFAULT 0 NOT NULL",
            'spillover_count': "ALTER TABLE jira_records ADD COLUMN spillover_count INTEGER DEFAULT 0 NOT NULL",
            'original_pi_id': "ALTER TABLE jira_records ADD COLUMN original_pi_id VARCHAR(36)"
        }
        
        added_count = 0
        skipped_count = 0
        
        for col_name, sql in columns_to_add.items():
            if col_name in existing_columns:
                print(f"⏭️  Skipping {col_name} (already exists)")
                skipped_count += 1
            else:
                print(f"➕ Adding column: {col_name}")
                cursor.execute(sql)
                added_count += 1
        
        # Data migrations
        print("\n📊 Running data migrations...")
        
        # Populate workflow_status from status
        cursor.execute("""
            UPDATE jira_records 
            SET workflow_status = CASE 
                WHEN status = 'SPILLOVER' THEN 'PLANNED'
                ELSE status
            END
            WHERE workflow_status IS NULL OR workflow_status = ''
        """)
        print(f"✓ Populated workflow_status for {cursor.rowcount} records")
        
        # Set is_spillover flag
        cursor.execute("UPDATE jira_records SET is_spillover = 1 WHERE status = 'SPILLOVER'")
        print(f"✓ Set is_spillover flag for {cursor.rowcount} records")
        
        # Set default category for existing spillovers
        cursor.execute("UPDATE jira_records SET spillover_category = 'dependencies' WHERE is_spillover = 1 AND spillover_category IS NULL")
        print(f"✓ Set default category for {cursor.rowcount} spillover records")
        
        # Set spillover_effort for existing spillovers
        cursor.execute("UPDATE jira_records SET spillover_effort = planned_effort WHERE is_spillover = 1 AND spillover_effort IS NULL")
        print(f"✓ Set spillover_effort for {cursor.rowcount} records")
        
        # Set spillover_count for existing spillovers
        cursor.execute("UPDATE jira_records SET spillover_count = 1 WHERE is_spillover = 1 AND spillover_count = 0")
        print(f"✓ Set spillover_count for {cursor.rowcount} records")
        
        # Set original_pi_id for existing spillovers
        cursor.execute("UPDATE jira_records SET original_pi_id = spillover_from_pi_id WHERE is_spillover = 1 AND original_pi_id IS NULL")
        print(f"✓ Set original_pi_id for {cursor.rowcount} records")
        
        conn.commit()
        
        print(f"\n✅ Migration completed successfully!")
        print(f"   - Added: {added_count} columns")
        print(f"   - Skipped: {skipped_count} columns (already exist)")
        
        # Verify final schema
        cursor.execute("PRAGMA table_info(jira_records)")
        final_columns = [row[1] for row in cursor.fetchall()]
        print(f"\n📋 Final column count: {len(final_columns)}")
        
        # Check for Phase 3.2 columns
        phase3_2_columns = ['workflow_status', 'is_spillover', 'spillover_category', 'spillover_effort', 
                           'completed_effort', 'spillover_count', 'original_pi_id']
        missing = [col for col in phase3_2_columns if col not in final_columns]
        
        if missing:
            print(f"⚠️  Missing Phase 3.2 columns: {missing}")
        else:
            print(f"✅ All Phase 3.2 columns present!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Phase 3.2 Database Migration")
    print("Spillover UX Improvements & Record Lifecycle")
    print("=" * 60)
    print()
    
    run_migration()
