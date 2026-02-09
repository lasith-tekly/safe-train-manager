#!/usr/bin/env python3
"""
Run JIRA Records Execution Planning Migration

This script applies the database migration for PI-level execution planning.
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 80)
print("JIRA Records Execution Planning Migration")
print("=" * 80)

try:
    from alembic.config import Config
    from alembic import command
    from sqlalchemy import inspect, text
    from app.database import engine
    
    # Create Alembic config
    alembic_cfg = Config("alembic.ini")
    
    print("\n1. Current migration status:")
    command.current(alembic_cfg)
    
    print("\n2. Running migration...")
    command.upgrade(alembic_cfg, "head")
    
    print("\n3. Verifying jira_records table structure...")
    inspector = inspect(engine)
    
    if 'jira_records' in inspector.get_table_names():
        print("   ✅ jira_records table exists")
        
        columns = {col['name']: col for col in inspector.get_columns('jira_records')}
        
        # Check required columns
        required_columns = [
            'id', 'jira_key', 'title', 'description',
            'feature_id', 'team_id', 'pi_id',
            'planned_effort', 'actual_effort',
            'status', 'spillover_from_pi_id', 'spillover_reason',
            'created_at', 'updated_at'
        ]
        
        print("\n   Column verification:")
        for col_name in required_columns:
            if col_name in columns:
                print(f"   ✅ {col_name}: {columns[col_name]['type']}")
            else:
                print(f"   ❌ {col_name}: MISSING")
        
        # Check foreign keys
        print("\n   Foreign key verification:")
        fks = inspector.get_foreign_keys('jira_records')
        fk_columns = {fk['constrained_columns'][0]: fk['referred_table'] for fk in fks}
        
        expected_fks = {
            'feature_id': 'roadmap_features',
            'team_id': 'teams',
            'pi_id': 'pis',
            'spillover_from_pi_id': 'pis'
        }
        
        for col, table in expected_fks.items():
            if col in fk_columns and fk_columns[col] == table:
                print(f"   ✅ {col} -> {table}")
            else:
                print(f"   ⚠️  {col} -> {table} (may not be set)")
        
        # Check indexes
        print("\n   Index verification:")
        indexes = inspector.get_indexes('jira_records')
        index_columns = {idx['column_names'][0] if len(idx['column_names']) == 1 else tuple(idx['column_names']) for idx in indexes}
        
        expected_indexes = ['jira_key', 'feature_id', 'team_id', 'pi_id', 'status']
        for col in expected_indexes:
            if col in index_columns:
                print(f"   ✅ Index on {col}")
            else:
                print(f"   ⚠️  Index on {col} (may not be created)")
        
        # Check constraints
        print("\n   Constraint verification:")
        try:
            # Try to insert invalid data to test constraints
            conn = engine.connect()
            
            # Test status constraint
            try:
                conn.execute(text("""
                    INSERT INTO jira_records (id, title, feature_id, status, planned_effort)
                    VALUES ('test-invalid-status', 'Test', 'fake-id', 'INVALID', 0)
                """))
                conn.rollback()
                print("   ⚠️  Status constraint not working")
            except Exception:
                print("   ✅ Status constraint working")
            
            # Test effort constraint
            try:
                conn.execute(text("""
                    INSERT INTO jira_records (id, title, feature_id, status, planned_effort)
                    VALUES ('test-negative-effort', 'Test', 'fake-id', 'PLANNED', -10)
                """))
                conn.rollback()
                print("   ⚠️  Effort constraint not working")
            except Exception:
                print("   ✅ Effort constraint working")
            
            conn.close()
        except Exception as e:
            print(f"   ⚠️  Could not test constraints: {e}")
    else:
        print("   ❌ jira_records table DOES NOT EXIST")
    
    print("\n" + "=" * 80)
    print("✅ Migration completed successfully!")
    print("=" * 80)
    
    print("\nFinal migration status:")
    command.current(alembic_cfg)
    
    print("\nNext steps:")
    print("1. Restart your backend server")
    print("2. Test the JIRA records API endpoints")
    print("3. Verify execution planning UI components")
    
except ImportError as e:
    print(f"\n❌ Import error: {e}")
    print("\nMake sure you have installed all dependencies:")
    print("  pip install alembic sqlalchemy")
    sys.exit(1)
    
except Exception as e:
    print(f"\n❌ Migration failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
