#!/bin/bash
set -e

echo "🔄 Starting Roadmap V4 Migration..."
echo "================================================"

# Backup database
echo "📦 Creating database backup..."
BACKUP_FILE="safe_train_backup_before_roadmap_v4_$(date +%Y%m%d_%H%M%S).db"
cp safe_train.db "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Backup old roadmap data
echo ""
echo "💾 Backing up old roadmap data to _backup_* tables..."
sqlite3 safe_train.db < migrations/backup_roadmap_data.sql
echo "✅ Old roadmap data backed up"

# Run Alembic migrations
echo ""
echo "🗄️ Running Alembic migrations..."
echo "  - Dropping old roadmap tables..."
echo "  - Creating new Roadmap V4 tables..."
alembic upgrade head
echo "✅ Alembic migrations complete"

# Add train config settings
echo ""
echo "⚙️ Adding train configuration settings..."
sqlite3 safe_train.db < migrations/2026_01_29_add_train_config_settings.sql
echo "✅ Train configuration settings added"

# Verify new tables
echo ""
echo "📊 Verifying new tables..."
echo "New Roadmap V4 tables:"
sqlite3 safe_train.db "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('roadmap_features', 'feature_teams', 'feature_quarterly_allocations', 'jira_records', 'jira_quarterly_allocations') ORDER BY name;"

echo ""
echo "Backup tables:"
sqlite3 safe_train.db "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '_backup_%20260129' ORDER BY name;"

echo ""
echo "Train configuration settings:"
sqlite3 safe_train.db "SELECT key, value FROM global_settings WHERE key IN ('unit_cost_keur', 'effort_days_per_year', 'structural_cost_ratio');"

echo ""
echo "================================================"
echo "✅ Migration complete!"
echo ""
echo "📝 Summary:"
echo "  - Old tables dropped: roadmaps, roadmap_features, feature_year_allocations, feature_pi_allocations"
echo "  - New tables created: roadmap_features, feature_teams, feature_quarterly_allocations, jira_records, jira_quarterly_allocations"
echo "  - Backup saved: $BACKUP_FILE"
echo "  - Old data preserved in _backup_* tables"
echo ""
echo "🚀 Ready for Phase 2: Backend Implementation"
