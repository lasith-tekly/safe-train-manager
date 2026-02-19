"""Make strategic_version_id nullable

Revision ID: 2026_02_19_make_nullable
Revises: 2026_02_13_phase5_6
Create Date: 2026-02-19 10:48:00.000000

Temporary fix to make strategic_version_id nullable until it can be fully removed.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '2026_02_19_make_nullable'
down_revision = '2026_02_13_phase5_6'
branch_labels = None
depends_on = None


def upgrade():
    """Make strategic_version_id nullable."""
    with op.batch_alter_table('po_plan_versions') as batch_op:
        batch_op.alter_column(
            'strategic_version_id',
            existing_type=sa.String(36),
            nullable=True
        )


def downgrade():
    """Revert strategic_version_id to NOT NULL."""
    with op.batch_alter_table('po_plan_versions') as batch_op:
        batch_op.alter_column(
            'strategic_version_id',
            existing_type=sa.String(36),
            nullable=False
        )
