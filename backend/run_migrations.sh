#!/bin/bash

echo "=========================================="
echo "Running Roadmap Versioning Migrations"
echo "=========================================="

# Check current migration status
echo ""
echo "Current migration status:"
alembic current

echo ""
echo "Available migrations:"
alembic history | head -20

# Run migrations
echo ""
echo "Running migrations..."
alembic upgrade head

# Check final status
echo ""
echo "Final migration status:"
alembic current

# Verify tables exist
echo ""
echo "Verifying roadmap_versions table exists:"
python -c "
from sqlalchemy import text, inspect
from app.database import engine

inspector = inspect(engine)
tables = inspector.get_table_names()

if 'roadmap_versions' in tables:
    print('✅ roadmap_versions table exists')
    
    # Check columns
    columns = [col['name'] for col in inspector.get_columns('roadmap_versions')]
    print(f'   Columns: {columns}')
else:
    print('❌ roadmap_versions table DOES NOT EXIST')

if 'roadmap_features' in tables:
    print('✅ roadmap_features table exists')
    
    # Check if version_id column exists
    columns = [col['name'] for col in inspector.get_columns('roadmap_features')]
    if 'version_id' in columns:
        print('✅ version_id column exists in roadmap_features')
    else:
        print('❌ version_id column MISSING in roadmap_features')
else:
    print('❌ roadmap_features table DOES NOT EXIST')
"

echo ""
echo "=========================================="
echo "Migration complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start backend: uvicorn app.main:app --reload"
echo "2. Test health: curl http://localhost:8000/health"
echo "3. Test versions: curl http://localhost:8000/api/products/{id}/roadmap-versions"
