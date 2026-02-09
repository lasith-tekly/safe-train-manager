"""add roadmap versions

Revision ID: 2026_02_05_add_roadmap_versions
Revises: 2026_01_29_drop_old_roadmap_tables
Create Date: 2026-02-05 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = '2026_02_05_add_roadmap_versions'
down_revision = '2026_01_29_drop_old_roadmap_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Create roadmap_versions table
    op.create_table(
        'roadmap_versions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('product_id', sa.String(36), sa.ForeignKey('products.id', ondelete='CASCADE'), nullable=False),
        sa.Column('version_name', sa.String(50), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='DRAFT'),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('published_at', sa.DateTime, nullable=True),
        sa.Column('created_by', sa.String(100), nullable=True),
        sa.Column('updated_at', sa.DateTime, nullable=True, onupdate=datetime.utcnow),
        sa.CheckConstraint("status IN ('DRAFT', 'PUBLISHED')", name='valid_version_status'),
    )
    
    # Create indexes for roadmap_versions
    op.create_index('ix_roadmap_versions_product_id', 'roadmap_versions', ['product_id'])
    op.create_index('ix_roadmap_versions_status', 'roadmap_versions', ['status'])
    op.create_index('ix_roadmap_versions_product_status', 'roadmap_versions', ['product_id', 'status'])
    
    # Add version_id column to roadmap_features table
    op.add_column('roadmap_features', sa.Column('version_id', sa.String(36), nullable=True))
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_roadmap_features_version_id',
        'roadmap_features', 
        'roadmap_versions',
        ['version_id'], 
        ['id'],
        ondelete='CASCADE'
    )
    
    # Create index for faster queries
    op.create_index('ix_roadmap_features_version_id', 'roadmap_features', ['version_id'])


def downgrade():
    # Drop index and foreign key from roadmap_features
    op.drop_index('ix_roadmap_features_version_id', table_name='roadmap_features')
    op.drop_constraint('fk_roadmap_features_version_id', 'roadmap_features', type_='foreignkey')
    op.drop_column('roadmap_features', 'version_id')
    
    # Drop indexes from roadmap_versions
    op.drop_index('ix_roadmap_versions_product_status', table_name='roadmap_versions')
    op.drop_index('ix_roadmap_versions_status', table_name='roadmap_versions')
    op.drop_index('ix_roadmap_versions_product_id', table_name='roadmap_versions')
    
    # Drop roadmap_versions table
    op.drop_table('roadmap_versions')
