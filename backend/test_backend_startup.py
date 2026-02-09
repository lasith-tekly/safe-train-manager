"""
Backend Startup Diagnostic Script

Run this to identify the exact error causing the 500 Internal Server Error.
"""
import sys
import traceback

print("=" * 80)
print("BACKEND STARTUP DIAGNOSTIC")
print("=" * 80)

# Test 1: Import app.database
print("\n1. Testing database import...")
try:
    from app.database import Base, engine
    print("✅ Database import successful")
except Exception as e:
    print(f"❌ Database import failed: {e}")
    traceback.print_exc()
    sys.exit(1)

# Test 2: Import models
print("\n2. Testing models import...")
try:
    from app.models import (
        Product, RoadmapVersion, RoadmapFeature
    )
    print("✅ Models import successful")
    print(f"   - Product: {Product}")
    print(f"   - RoadmapVersion: {RoadmapVersion}")
    print(f"   - RoadmapFeature: {RoadmapFeature}")
except Exception as e:
    print(f"❌ Models import failed: {e}")
    traceback.print_exc()
    sys.exit(1)

# Test 3: Check model relationships
print("\n3. Testing model relationships...")
try:
    # Check Product relationships
    product_relationships = [attr for attr in dir(Product) if not attr.startswith('_')]
    print(f"   Product has {len(product_relationships)} attributes")
    if hasattr(Product, 'roadmap_versions'):
        print("   ✅ Product.roadmap_versions exists")
    else:
        print("   ❌ Product.roadmap_versions MISSING")
    
    # Check RoadmapVersion relationships
    if hasattr(RoadmapVersion, 'product'):
        print("   ✅ RoadmapVersion.product exists")
    else:
        print("   ❌ RoadmapVersion.product MISSING")
    
    if hasattr(RoadmapVersion, 'features'):
        print("   ✅ RoadmapVersion.features exists")
    else:
        print("   ❌ RoadmapVersion.features MISSING")
    
    # Check RoadmapFeature relationships
    if hasattr(RoadmapFeature, 'roadmap_version'):
        print("   ✅ RoadmapFeature.roadmap_version exists")
    else:
        print("   ❌ RoadmapFeature.roadmap_version MISSING")
        
except Exception as e:
    print(f"❌ Relationship check failed: {e}")
    traceback.print_exc()

# Test 4: Import routes
print("\n4. Testing routes import...")
try:
    from app.routes import roadmap_versions
    print("✅ Roadmap versions routes import successful")
    print(f"   Router: {roadmap_versions.router}")
except Exception as e:
    print(f"❌ Routes import failed: {e}")
    traceback.print_exc()
    sys.exit(1)

# Test 5: Import services
print("\n5. Testing services import...")
try:
    from app.services.roadmap_version_service import RoadmapVersionService
    print("✅ RoadmapVersionService import successful")
except Exception as e:
    print(f"❌ Service import failed: {e}")
    traceback.print_exc()
    sys.exit(1)

# Test 6: Import schemas
print("\n6. Testing schemas import...")
try:
    from app.schemas.roadmap_version import (
        RoadmapVersionResponse,
        CreateVersionRequest
    )
    print("✅ Schemas import successful")
except Exception as e:
    print(f"❌ Schema import failed: {e}")
    traceback.print_exc()
    sys.exit(1)

# Test 7: Try to import main app
print("\n7. Testing main app import...")
try:
    from app.main import app
    print("✅ Main app import successful")
    print(f"   App: {app}")
    print(f"   Routes: {len(app.routes)}")
except Exception as e:
    print(f"❌ Main app import failed: {e}")
    traceback.print_exc()
    sys.exit(1)

# Test 8: Check database connection
print("\n8. Testing database connection...")
try:
    from sqlalchemy import text
    from app.database import SessionLocal
    
    db = SessionLocal()
    result = db.execute(text("SELECT 1"))
    db.close()
    print("✅ Database connection successful")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    traceback.print_exc()

# Test 9: Check if roadmap_versions table exists
print("\n9. Checking if roadmap_versions table exists...")
try:
    from sqlalchemy import text
    from app.database import SessionLocal
    
    db = SessionLocal()
    result = db.execute(text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'roadmap_versions'
        );
    """))
    exists = result.scalar()
    db.close()
    
    if exists:
        print("✅ roadmap_versions table exists")
    else:
        print("❌ roadmap_versions table DOES NOT EXIST")
        print("   Run: alembic upgrade head")
except Exception as e:
    print(f"❌ Table check failed: {e}")
    traceback.print_exc()

# Test 10: Check if version_id column exists in roadmap_features
print("\n10. Checking if version_id column exists in roadmap_features...")
try:
    from sqlalchemy import text
    from app.database import SessionLocal
    
    db = SessionLocal()
    result = db.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'roadmap_features' 
        AND column_name = 'version_id';
    """))
    column = result.fetchone()
    db.close()
    
    if column:
        print("✅ version_id column exists in roadmap_features")
    else:
        print("❌ version_id column DOES NOT EXIST in roadmap_features")
        print("   Run: alembic upgrade head")
except Exception as e:
    print(f"❌ Column check failed: {e}")
    traceback.print_exc()

print("\n" + "=" * 80)
print("DIAGNOSTIC COMPLETE")
print("=" * 80)
print("\nIf all tests passed, the backend should work.")
print("If any tests failed, fix the issues shown above.")
print("\nTo run backend:")
print("  cd backend")
print("  uvicorn app.main:app --reload")
