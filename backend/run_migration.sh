#!/bin/bash

# Roadmap V2 Migration Script
# Run this script to apply the multi-year roadmap database changes

echo "=========================================="
echo "Roadmap V2 Migration Script"
echo "=========================================="
echo ""

# Check if database file exists
if [ ! -f "safe_train_manager.db" ]; then
    echo "❌ Error: Database file 'safe_train_manager.db' not found"
    echo "Please ensure you're in the backend directory"
    exit 1
fi

# Backup database
BACKUP_FILE="safe_train_manager_backup_$(date +%Y%m%d_%H%M%S).db"
echo "📦 Creating backup: $BACKUP_FILE"
cp safe_train_manager.db "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully"
else
    echo "❌ Failed to create backup"
    exit 1
fi

echo ""
echo "🔄 Running migration..."
echo ""

# Run migration
sqlite3 safe_train_manager.db < migrations/004_roadmap_multi_year_v2.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Changes applied:"
    echo "  ✓ Created feature_year_allocations table"
    echo "  ✓ Removed fiscal_year_id and budget_version_id from roadmaps"
    echo "  ✓ Removed Q1-Q4 columns from roadmap_features"
    echo ""
    echo "Backup saved as: $BACKUP_FILE"
    echo ""
    echo "Next steps:"
    echo "  1. Start the backend: uvicorn app.main:app --reload"
    echo "  2. Test the API at: http://localhost:8000/docs"
    echo ""
else
    echo ""
    echo "❌ Migration failed!"
    echo "Restoring from backup..."
    cp "$BACKUP_FILE" safe_train_manager.db
    echo "Database restored to previous state"
    exit 1
fi
