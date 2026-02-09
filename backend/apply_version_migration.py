#!/usr/bin/env python3
"""
Direct SQL migration for roadmap versioning
Bypasses Alembic to apply changes directly to SQLite database
"""
import sqlite3
import sys
from datetime import datetime
import uuid

DB_PATH = "safe_train.db"

print("=" * 80)
print("Applying Roadmap Version Control Migration")
print("=" * 80)

try:
    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("\n1. Creating roadmap_versions table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS roadmap_versions (
            id TEXT PRIMARY KEY,
            product_id TEXT NOT NULL,
            version_name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'DRAFT',
            description TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            published_at TIMESTAMP,
            created_by TEXT,
            updated_at TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            CHECK (status IN ('DRAFT', 'PUBLISHED'))
        )
    """)
    print("   ✅ roadmap_versions table created")
    
    print("\n2. Creating indexes on roadmap_versions...")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_roadmap_versions_product_id ON roadmap_versions(product_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_roadmap_versions_status ON roadmap_versions(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_roadmap_versions_product_status ON roadmap_versions(product_id, status)")
    print("   ✅ Indexes created")
    
    print("\n3. Adding version_id column to roadmap_features...")
    # Check if column already exists
    cursor.execute("PRAGMA table_info(roadmap_features)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'version_id' not in columns:
        cursor.execute("ALTER TABLE roadmap_features ADD COLUMN version_id TEXT")
        print("   ✅ version_id column added")
    else:
        print("   ℹ️  version_id column already exists")
    
    print("\n4. Creating index on roadmap_features.version_id...")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_roadmap_features_version_id ON roadmap_features(version_id)")
    print("   ✅ Index created")
    
    print("\n5. Creating initial versions for products with features...")
    
    # Get products that have features
    cursor.execute("""
        SELECT DISTINCT product_id 
        FROM roadmap_features 
        WHERE product_id IS NOT NULL
    """)
    products_with_features = cursor.fetchall()
    
    today = datetime.now().strftime('%Y-%m-%d')
    
    for (product_id,) in products_with_features:
        # Check if versions already exist for this product
        cursor.execute("SELECT COUNT(*) FROM roadmap_versions WHERE product_id = ?", (product_id,))
        version_count = cursor.fetchone()[0]
        
        if version_count == 0:
            # Create PUBLISHED version
            published_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO roadmap_versions (id, product_id, version_name, status, description, created_at)
                VALUES (?, ?, ?, 'PUBLISHED', 'Initial published version created during migration', CURRENT_TIMESTAMP)
            """, (published_id, product_id, f"{today} Initial"))
            
            # Link existing features to PUBLISHED version
            cursor.execute("""
                UPDATE roadmap_features 
                SET version_id = ? 
                WHERE product_id = ? AND version_id IS NULL
            """, (published_id, product_id))
            
            # Create DRAFT version
            draft_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO roadmap_versions (id, product_id, version_name, status, description, created_at)
                VALUES (?, ?, ?, 'DRAFT', 'Current working draft', CURRENT_TIMESTAMP)
            """, (draft_id, product_id, today))
            
            print(f"   ✅ Created versions for product {product_id[:8]}...")
    
    print(f"\n6. Verifying migration...")
    
    # Count versions
    cursor.execute("SELECT COUNT(*) FROM roadmap_versions")
    version_count = cursor.fetchone()[0]
    print(f"   Total versions created: {version_count}")
    
    # Count features with versions
    cursor.execute("SELECT COUNT(*) FROM roadmap_features WHERE version_id IS NOT NULL")
    linked_features = cursor.fetchone()[0]
    print(f"   Features linked to versions: {linked_features}")
    
    # Commit changes
    conn.commit()
    
    print("\n" + "=" * 80)
    print("✅ Migration completed successfully!")
    print("=" * 80)
    
    print("\nNext steps:")
    print("1. Restart your backend server (Ctrl+C then run again)")
    print("2. Refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)")
    print("3. Navigate to Roadmap Planning page")
    print("4. You should see the version selector!")
    
except sqlite3.Error as e:
    print(f"\n❌ Database error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    if conn:
        conn.close()
