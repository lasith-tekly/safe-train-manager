"""
Temporary migration endpoint - run this once to populate version_id
Access via: http://localhost:8000/migrate-version-id
"""
from fastapi import APIRouter
from sqlalchemy import text
from app.database import get_db

router = APIRouter()

@router.post("/migrate-version-id")
def migrate_version_id():
    """Manually run the version_id migration"""
    db = next(get_db())
    
    try:
        # Check NULL count
        result = db.execute(text("SELECT COUNT(*) FROM jira_records WHERE version_id IS NULL"))
        null_count = result.scalar()
        
        if null_count == 0:
            return {"status": "success", "message": "All records already have version_id", "null_count": 0}
        
        # Pass 1: Published versions
        db.execute(text("""
            UPDATE jira_records
            SET version_id = (
                SELECT rv.id 
                FROM roadmap_versions rv 
                JOIN roadmap_features rf ON rf.product_id = rv.product_id
                WHERE rf.id = jira_records.feature_id
                AND rv.status = 'PUBLISHED'
                ORDER BY rv.created_at DESC
                LIMIT 1
            )
            WHERE version_id IS NULL
        """))
        
        # Pass 2: Draft versions
        db.execute(text("""
            UPDATE jira_records
            SET version_id = (
                SELECT rv.id 
                FROM roadmap_versions rv 
                JOIN roadmap_features rf ON rf.product_id = rv.product_id
                WHERE rf.id = jira_records.feature_id
                AND rv.status = 'DRAFT'
                ORDER BY rv.created_at DESC
                LIMIT 1
            )
            WHERE version_id IS NULL
        """))
        
        # Pass 3: Any version
        db.execute(text("""
            UPDATE jira_records
            SET version_id = (
                SELECT rv.id 
                FROM roadmap_versions rv 
                JOIN roadmap_features rf ON rf.product_id = rv.product_id
                WHERE rf.id = jira_records.feature_id
                ORDER BY rv.created_at DESC
                LIMIT 1
            )
            WHERE version_id IS NULL
        """))
        
        db.commit()
        
        # Check final count
        result = db.execute(text("SELECT COUNT(*) FROM jira_records WHERE version_id IS NULL"))
        remaining_null = result.scalar()
        
        result = db.execute(text("SELECT COUNT(*) FROM jira_records"))
        total = result.scalar()
        
        return {
            "status": "success" if remaining_null == 0 else "partial",
            "message": "Migration completed",
            "total_records": total,
            "null_before": null_count,
            "null_after": remaining_null,
            "updated": null_count - remaining_null
        }
        
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
