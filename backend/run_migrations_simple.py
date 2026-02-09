#!/usr/bin/env python3
"""
Simple migration runner that doesn't require alembic command
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 80)
print("Running Database Migrations")
print("=" * 80)

try:
    from alembic.config import Config
    from alembic import command
    
    # Create Alembic config
    alembic_cfg = Config("alembic.ini")
    
    print("\nCurrent migration status:")
    command.current(alembic_cfg)
    
    print("\nRunning migrations...")
    command.upgrade(alembic_cfg, "head")
    
    print("\n" + "=" * 80)
    print("✅ Migrations completed successfully!")
    print("=" * 80)
    
    print("\nFinal migration status:")
    command.current(alembic_cfg)
    
    print("\nNext steps:")
    print("1. Restart your backend server")
    print("2. Refresh your browser")
    print("3. Navigate to Roadmap Planning")
    
except ImportError as e:
    print(f"\n❌ Error: {e}")
    print("\nAlembic is not installed. Please install it:")
    print("  pip install alembic")
    print("  OR")
    print("  pip3 install alembic")
    sys.exit(1)
    
except Exception as e:
    print(f"\n❌ Migration failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
