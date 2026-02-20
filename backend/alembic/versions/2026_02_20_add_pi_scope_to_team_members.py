"""Add PI scope fields to team_members

Revision ID: 2026_02_20_pi_scope
Revises: 2026_02_19_make_nullable
Create Date: 2026-02-20 10:59:00.000000

Adds effective_from_pi_id and left_after_pi_id to team_members table.
Both fields are nullable - NULL means active in all PIs (backwards compatible).
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '2026_02_20_pi_scope'
down_revision = '2026_02_19_make_nullable'
branch_labels = None
depends_on = None


def upgrade():
    """Add PI scope fields to team_members."""
    op.add_column('team_members',
        sa.Column('effective_from_pi_id', sa.String(36), nullable=True))
    op.add_column('team_members',
        sa.Column('left_after_pi_id', sa.String(36), nullable=True))


def downgrade():
    """Remove PI scope fields from team_members."""
    op.drop_column('team_members', 'left_after_pi_id')
    op.drop_column('team_members', 'effective_from_pi_id')
