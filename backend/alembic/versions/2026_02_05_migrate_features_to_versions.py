"""migrate features to versions

Revision ID: 2026_02_05_migrate_features_to_versions
Revises: 2026_02_05_add_roadmap_versions
Create Date: 2026-02-05 16:30:00.000000

Data migration script to:
1. Create default PUBLISHED version for each product with existing features
2. Link all existing features to their product's default version
3. Create new DRAFT version for each product for future work

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from datetime import datetime
import uuid


# revision identifiers, used by Alembic.
revision = '2026_02_05_migrate_features_to_versions'
down_revision = '2026_02_05_add_roadmap_versions'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    
    # Step 1: Get all products that have features
    products_with_features = connection.execute(text("""
        SELECT DISTINCT product_id 
        FROM roadmap_features 
        WHERE product_id IS NOT NULL
    """)).fetchall()
    
    print(f"Found {len(products_with_features)} products with features")
    
    for (product_id,) in products_with_features:
        # Step 2: Create initial PUBLISHED version for this product
        initial_version_id = str(uuid.uuid4())
        initial_version_name = datetime.now().strftime('%Y-%m-%d') + '-initial'
        
        connection.execute(text("""
            INSERT INTO roadmap_versions 
            (id, product_id, version_name, status, description, created_at, created_by)
            VALUES 
            (:id, :product_id, :version_name, 'PUBLISHED', :description, :created_at, 'system')
        """), {
            'id': initial_version_id,
            'product_id': product_id,
            'version_name': initial_version_name,
            'description': 'Initial version created during migration - contains all existing features',
            'created_at': datetime.utcnow()
        })
        
        # Step 3: Link all existing features to this version
        connection.execute(text("""
            UPDATE roadmap_features 
            SET version_id = :version_id 
            WHERE product_id = :product_id
        """), {
            'version_id': initial_version_id,
            'product_id': product_id
        })
        
        # Step 4: Create new DRAFT version for future work
        draft_version_id = str(uuid.uuid4())
        draft_version_name = datetime.now().strftime('%Y-%m-%d')
        
        connection.execute(text("""
            INSERT INTO roadmap_versions 
            (id, product_id, version_name, status, description, created_at, created_by)
            VALUES 
            (:id, :product_id, :version_name, 'DRAFT', :description, :created_at, 'system')
        """), {
            'id': draft_version_id,
            'product_id': product_id,
            'version_name': draft_version_name,
            'description': 'Current working version',
            'created_at': datetime.utcnow()
        })
        
        print(f"Migrated product {product_id}: {initial_version_name} (PUBLISHED) + {draft_version_name} (DRAFT)")
    
    # Step 5: Make version_id NOT NULL after migration
    # Note: Commented out to allow gradual migration - uncomment when ready
    # op.alter_column('roadmap_features', 'version_id', nullable=False)
    
    print("Migration completed successfully!")


def downgrade():
    connection = op.get_bind()
    
    # Remove the NOT NULL constraint if it was added
    # op.alter_column('roadmap_features', 'version_id', nullable=True)
    
    # Set all version_id to NULL
    connection.execute(text("""
        UPDATE roadmap_features 
        SET version_id = NULL
    """))
    
    # Delete all auto-created versions
    connection.execute(text("""
        DELETE FROM roadmap_versions 
        WHERE created_by = 'system'
    """))
    
    print("Downgrade completed - all features unlinked from versions")
