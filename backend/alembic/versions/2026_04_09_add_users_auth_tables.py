"""Add users and user_team_assignments tables for auth

Revision ID: 2026_04_09_auth_tables
Revises: None (standalone branch — main chain broken since 2026-02-26 DB reset)
Create Date: 2026-04-09 09:00:00.000000

New tables:
  - users
  - user_team_assignments
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '2026_04_09_auth_tables'
down_revision = None
branch_labels = ('auth',)
depends_on = None


def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('username', sa.String(50), nullable=False, unique=True, index=True),
        sa.Column('email', sa.String(100), nullable=False, unique=True, index=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('last_login', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'user_team_assignments',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False, index=True),
        sa.Column('team_id', sa.String(36),
                  sa.ForeignKey('teams.id', ondelete='CASCADE'),
                  nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table('user_team_assignments')
    op.drop_table('users')
