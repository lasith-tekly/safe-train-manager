#!/usr/bin/env python3
"""
Manual migration script to add and populate version_id in jira_records table
"""
import sqlite3
import sys

def run_migration():
    conn = sqlite3.connect('safe_train.db')
    cursor = conn.cursor()
    
    try:
        print("Step 1: Checking if version_id column exists...")
        cursor.execute("PRAGMA table_info(jira_records)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'version_id' not in columns:
            print("Adding version_id column...")
            cursor.execute("ALTER TABLE jira_records ADD COLUMN version_id VARCHAR(36)")
            conn.commit()
            print("✅ Column added")
        else:
            print("✅ Column already exists")
        
        print("\nStep 2: Checking for NULL version_id values...")
        cursor.execute("SELECT COUNT(*) FROM jira_records WHERE version_id IS NULL")
        null_count = cursor.fetchone()[0]
        print(f"Found {null_count} records with NULL version_id")
        
        if null_count > 0:
            print("\nStep 3: Backfilling version_id - Pass 1 (Published versions)...")
            cursor.execute("""
                UPDATE jira_records
                SET version_id = (
                    SELECT rv.id 
                    FROM roadmap_versions rv 
                    JOIN roadmap_features rf ON rf.product_id = rv.product_id
                    WHERE rf.id = jira_records.feature_id
                    AND rv.status = 'PUBLISHED'
                    ORDER BY rv.created_at DESC
                    LIMIT 1
                )
                WHERE version_id IS NULL
            """)
            updated = cursor.rowcount
            conn.commit()
            print(f"✅ Updated {updated} records with published versions")
            
            print("\nStep 4: Backfilling version_id - Pass 2 (Draft versions)...")
            cursor.execute("""
                UPDATE jira_records
                SET version_id = (
                    SELECT rv.id 
                    FROM roadmap_versions rv 
                    JOIN roadmap_features rf ON rf.product_id = rv.product_id
                    WHERE rf.id = jira_records.feature_id
                    AND rv.status = 'DRAFT'
                    ORDER BY rv.created_at DESC
                    LIMIT 1
                )
                WHERE version_id IS NULL
            """)
            updated = cursor.rowcount
            conn.commit()
            print(f"✅ Updated {updated} records with draft versions")
            
            print("\nStep 5: Backfilling version_id - Pass 3 (Any version)...")
            cursor.execute("""
                UPDATE jira_records
                SET version_id = (
                    SELECT rv.id 
                    FROM roadmap_versions rv 
                    JOIN roadmap_features rf ON rf.product_id = rv.product_id
                    WHERE rf.id = jira_records.feature_id
                    ORDER BY rv.created_at DESC
                    LIMIT 1
                )
                WHERE version_id IS NULL
            """)
            updated = cursor.rowcount
            conn.commit()
            print(f"✅ Updated {updated} records with any available version")
        
        print("\nStep 6: Final verification...")
        cursor.execute("SELECT COUNT(*) FROM jira_records WHERE version_id IS NULL")
        remaining_null = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM jira_records")
        total = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM jira_records WHERE version_id IS NOT NULL")
        with_version = cursor.fetchone()[0]
        
        print(f"\n{'='*60}")
        print(f"Migration Results:")
        print(f"  Total JIRA records: {total}")
        print(f"  Records with version_id: {with_version}")
        print(f"  Records with NULL version_id: {remaining_null}")
        print(f"{'='*60}")
        
        if remaining_null == 0:
            print("\n✅ SUCCESS: All records have version_id populated!")
            
            print("\nSample records:")
            cursor.execute("""
                SELECT jr.id, jr.jira_key, jr.version_id, rv.version_name, rv.status
                FROM jira_records jr
                LEFT JOIN roadmap_versions rv ON rv.id = jr.version_id
                LIMIT 5
            """)
            for row in cursor.fetchall():
                print(f"  {row[1]}: version={row[3]} ({row[4]})")
            
            return 0
        else:
            print(f"\n⚠️  WARNING: {remaining_null} records still have NULL version_id")
            print("These records may be orphaned (no matching feature/version)")
            return 1
            
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        conn.rollback()
        return 1
    finally:
        conn.close()

if __name__ == "__main__":
    sys.exit(run_migration())
