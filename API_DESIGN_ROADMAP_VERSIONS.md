# Roadmap Versions API Design

## Overview

RESTful API for managing roadmap versions in the Strategic Planning module. Supports version lifecycle management (DRAFT → PUBLISHED), feature copying, and version history.

---

## Base URL

```
http://localhost:8000/api
```

---

## Authentication

Currently not implemented. Future versions will require authentication token.

```
Authorization: Bearer <token>
```

---

## API Endpoints

### 1. List Versions

**GET** `/api/products/{product_id}/roadmap-versions`

List all roadmap versions for a product, ordered by creation date (newest first).

**Path Parameters:**
- `product_id` (string, required) - Product UUID

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "version_name": "2026-02-05",
      "status": "DRAFT",
      "description": "Q1 2026 Planning",
      "created_at": "2026-02-05T10:00:00Z",
      "published_at": null,
      "created_by": "john.doe",
      "updated_at": "2026-02-05T10:00:00Z",
      "feature_count": 15
    },
    {
      "id": "uuid",
      "product_id": "uuid",
      "version_name": "2026-01-15",
      "status": "PUBLISHED",
      "description": "Initial version",
      "created_at": "2026-01-15T10:00:00Z",
      "published_at": "2026-01-20T14:30:00Z",
      "created_by": "jane.smith",
      "updated_at": "2026-01-20T14:30:00Z",
      "feature_count": 12
    }
  ],
  "total": 2
}
```

---

### 2. Create Version

**POST** `/api/products/{product_id}/roadmap-versions`

Create a new roadmap version. Optionally copy features from an existing version.

**Path Parameters:**
- `product_id` (string, required) - Product UUID

**Request Body:**
```json
{
  "version_name": "2026-02-12",
  "description": "Updated Q1 plan with new features",
  "copy_from_version_id": "uuid"  // Optional
}
```

**Business Rules:**
- Only one DRAFT version allowed per product
- If `copy_from_version_id` provided, copies all features from that version
- Version name defaults to current date (YYYY-MM-DD) if not provided

**Response:** `201 Created`
```json
{
  "id": "new-uuid",
  "product_id": "uuid",
  "version_name": "2026-02-12",
  "status": "DRAFT",
  "description": "Updated Q1 plan with new features",
  "created_at": "2026-02-12T10:00:00Z",
  "published_at": null,
  "created_by": null,
  "updated_at": "2026-02-12T10:00:00Z",
  "feature_count": 15
}
```

**Error Responses:**
- `400 Bad Request` - Draft version already exists
```json
{
  "detail": "A draft version already exists: 2026-02-05. Publish or delete it first."
}
```

---

### 3. Get Version

**GET** `/api/products/{product_id}/roadmap-versions/{version_id}`

Get a specific roadmap version by ID.

**Path Parameters:**
- `product_id` (string, required) - Product UUID
- `version_id` (string, required) - Version UUID

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "product_id": "uuid",
  "version_name": "2026-02-05",
  "status": "DRAFT",
  "description": "Q1 2026 Planning",
  "created_at": "2026-02-05T10:00:00Z",
  "published_at": null,
  "created_by": "john.doe",
  "updated_at": "2026-02-05T10:00:00Z",
  "feature_count": 15
}
```

**Error Responses:**
- `404 Not Found` - Version not found or doesn't belong to product

---

### 4. Update Version

**PUT** `/api/products/{product_id}/roadmap-versions/{version_id}`

Update a roadmap version. Only description can be updated, and only for DRAFT versions.

**Path Parameters:**
- `product_id` (string, required) - Product UUID
- `version_id` (string, required) - Version UUID

**Request Body:**
```json
{
  "description": "Updated description"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "product_id": "uuid",
  "version_name": "2026-02-05",
  "status": "DRAFT",
  "description": "Updated description",
  "created_at": "2026-02-05T10:00:00Z",
  "published_at": null,
  "created_by": "john.doe",
  "updated_at": "2026-02-05T11:00:00Z",
  "feature_count": 15
}
```

**Error Responses:**
- `400 Bad Request` - Cannot update published version
```json
{
  "detail": "Only DRAFT versions can be updated. Published versions are read-only."
}
```
- `404 Not Found` - Version not found

---

### 5. Publish Version

**POST** `/api/products/{product_id}/roadmap-versions/{version_id}/publish`

Publish a version, changing status from DRAFT to PUBLISHED and locking it from edits.

**Path Parameters:**
- `product_id` (string, required) - Product UUID
- `version_id` (string, required) - Version UUID

**Request Body:**
```json
{
  "published_by": "john.doe"  // Optional
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "product_id": "uuid",
  "version_name": "2026-02-05",
  "status": "PUBLISHED",
  "description": "Q1 2026 Planning",
  "created_at": "2026-02-05T10:00:00Z",
  "published_at": "2026-02-05T14:30:00Z",
  "created_by": "john.doe",
  "updated_at": "2026-02-05T14:30:00Z",
  "feature_count": 15
}
```

**Error Responses:**
- `400 Bad Request` - Version already published
```json
{
  "detail": "Version is already published"
}
```
- `404 Not Found` - Version not found

---

### 6. Delete Version

**DELETE** `/api/products/{product_id}/roadmap-versions/{version_id}`

Delete a roadmap version. Only DRAFT versions can be deleted. Cascade deletes all features.

**Path Parameters:**
- `product_id` (string, required) - Product UUID
- `version_id` (string, required) - Version UUID

**Response:** `204 No Content`

**Error Responses:**
- `400 Bad Request` - Cannot delete published version
```json
{
  "detail": "Cannot delete published versions"
}
```
- `404 Not Found` - Version not found

---

### 7. Get Version Features

**GET** `/api/products/{product_id}/roadmap-versions/{version_id}/features`

Get all features for a specific version.

**Path Parameters:**
- `product_id` (string, required) - Product UUID
- `version_id` (string, required) - Version UUID

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "version_id": "uuid",
      "product_id": "uuid",
      "name": "Feature 1",
      "customer": "Customer A",
      "priority": 0,
      "status": "planned",
      "gross_sizing_ed": 10.0,
      "net_sizing_ed": 8.5,
      "total_cost_keur": 3.55,
      "quarterly_allocations": [...],
      "budget_allocations": [...],
      "teams": [...]
    }
  ],
  "total": 15
}
```

---

### 8. Get Current Draft

**GET** `/api/products/{product_id}/roadmap-versions/current/draft`

Get the current DRAFT version for a product (convenience endpoint).

**Path Parameters:**
- `product_id` (string, required) - Product UUID

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "product_id": "uuid",
  "version_name": "2026-02-05",
  "status": "DRAFT",
  "description": "Current working version",
  "created_at": "2026-02-05T10:00:00Z",
  "published_at": null,
  "created_by": "system",
  "updated_at": "2026-02-05T10:00:00Z",
  "feature_count": 15
}
```

**Error Responses:**
- `404 Not Found` - No draft version exists
```json
{
  "detail": "No draft version found for this product"
}
```

---

## Data Models

### RoadmapVersion

```typescript
{
  id: string;                    // UUID
  product_id: string;            // UUID
  version_name: string;          // e.g., "2026-02-05"
  status: "DRAFT" | "PUBLISHED"; // Version status
  description?: string;          // Optional description
  created_at: string;            // ISO 8601 datetime
  published_at?: string;         // ISO 8601 datetime (null if draft)
  created_by?: string;           // Username
  updated_at?: string;           // ISO 8601 datetime
  feature_count: number;         // Number of features in version
}
```

---

## Business Rules

### Version Creation
1. **One Draft Per Product:** Only one DRAFT version allowed per product at a time
2. **Auto-naming:** Version name defaults to current date (YYYY-MM-DD) if not provided
3. **Feature Copying:** If `copy_from_version_id` provided, deep copies all features including:
   - Feature details
   - Quarterly allocations
   - Budget line allocations
   - Team assignments

### Version Publishing
1. **Status Change:** Changes status from DRAFT to PUBLISHED
2. **Timestamp:** Sets `published_at` to current timestamp
3. **Locking:** All features in published version become read-only
4. **Irreversible:** Cannot unpublish a version

### Version Editing
1. **Draft Only:** Only DRAFT versions can be updated
2. **Limited Fields:** Only `description` can be updated
3. **Published Lock:** Published versions are completely read-only

### Version Deletion
1. **Draft Only:** Only DRAFT versions can be deleted
2. **Cascade:** Deletes all features in the version
3. **Protection:** Published versions cannot be deleted

---

## Error Handling

### Standard Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

### HTTP Status Codes

- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST (create)
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error or business rule violation
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Usage Examples

### Example 1: Create New Version from Scratch

```bash
# Create empty draft version
curl -X POST http://localhost:8000/api/products/{product_id}/roadmap-versions \
  -H "Content-Type: application/json" \
  -d '{
    "version_name": "2026-02-12",
    "description": "Q1 2026 Planning"
  }'
```

### Example 2: Create Version by Copying

```bash
# Copy all features from existing version
curl -X POST http://localhost:8000/api/products/{product_id}/roadmap-versions \
  -H "Content-Type: application/json" \
  -d '{
    "version_name": "2026-02-12",
    "description": "Updated Q1 plan",
    "copy_from_version_id": "existing-version-uuid"
  }'
```

### Example 3: Publish Version

```bash
# Publish draft version
curl -X POST http://localhost:8000/api/products/{product_id}/roadmap-versions/{version_id}/publish \
  -H "Content-Type: application/json" \
  -d '{
    "published_by": "john.doe"
  }'
```

### Example 4: List All Versions

```bash
# Get all versions for product
curl http://localhost:8000/api/products/{product_id}/roadmap-versions
```

---

## Integration with Features API

### Version-Aware Feature Endpoints

Features API should be updated to be version-aware:

```bash
# Create feature in specific version
POST /api/roadmap-versions/{version_id}/features

# Update feature (checks version is DRAFT)
PUT /api/features/{feature_id}

# Delete feature (checks version is DRAFT)
DELETE /api/features/{feature_id}
```

### Read-Only Enforcement

When a version is PUBLISHED:
- All feature CRUD operations should return `403 Forbidden`
- Error message: "Cannot modify features in published version"

---

## Performance Considerations

### Indexes
- `ix_roadmap_versions_product_id` - Fast version lookup by product
- `ix_roadmap_versions_status` - Fast filtering by status
- `ix_roadmap_versions_product_status` - Composite for "get draft version"
- `ix_roadmap_features_version_id` - Fast feature filtering by version

### Optimization Tips
1. **Eager Loading:** Load features with version when needed
2. **Pagination:** Consider pagination for products with many versions
3. **Caching:** Cache current draft version per product
4. **Batch Operations:** Use transactions for feature copying

---

## Testing

### Test Scenarios

1. **Create Version:**
   - ✅ Create empty draft version
   - ✅ Create version by copying features
   - ❌ Create second draft (should fail)
   - ✅ Auto-generate version name

2. **Publish Version:**
   - ✅ Publish draft version
   - ❌ Publish already published version (should fail)
   - ✅ Verify published_at timestamp set

3. **Update Version:**
   - ✅ Update draft version description
   - ❌ Update published version (should fail)

4. **Delete Version:**
   - ✅ Delete draft version
   - ❌ Delete published version (should fail)
   - ✅ Verify cascade delete of features

5. **Feature Copying:**
   - ✅ Copy all feature details
   - ✅ Copy quarterly allocations
   - ✅ Copy budget allocations
   - ✅ Copy team assignments
   - ✅ Verify feature count accuracy

---

## Migration Path

### Phase 1: Database (Complete)
- ✅ Create `roadmap_versions` table
- ✅ Add `version_id` to `roadmap_features`
- ✅ Migrate existing features to default versions

### Phase 2: Backend API (Current)
- ✅ Create Pydantic schemas
- ✅ Implement service layer
- ✅ Create API routes
- ✅ Register routes in main.py

### Phase 3: Feature Service Updates (Next)
- ⏳ Update FeatureService to be version-aware
- ⏳ Add version validation to feature CRUD
- ⏳ Implement read-only enforcement

### Phase 4: Frontend (Pending)
- ⏳ Version selector component
- ⏳ Create/publish version UI
- ⏳ Read-only mode for published versions

---

## API Documentation

### OpenAPI/Swagger

API documentation available at:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Postman Collection

Import the OpenAPI spec into Postman for testing:
```
http://localhost:8000/openapi.json
```

---

## Security Considerations

### Future Enhancements

1. **Authentication:** Require auth token for all endpoints
2. **Authorization:** Role-based access control (RBAC)
   - Product Managers: Can create/publish versions
   - Viewers: Can only view versions
3. **Audit Trail:** Log all version changes
4. **Rate Limiting:** Prevent abuse of copy operations

---

## Status

✅ **Schemas:** Complete  
✅ **Service Layer:** Complete  
✅ **API Routes:** Complete  
✅ **Registration:** Complete  
⏳ **Testing:** Pending  
⏳ **Documentation:** In progress  

**Ready for:** Backend Developer implementation and testing

---

## Next Steps

1. **Run migrations** to create database schema
2. **Test API endpoints** using Swagger UI
3. **Update FeatureService** to be version-aware
4. **Implement read-only enforcement** for published versions
5. **Create integration tests**

---

**Designed by:** @Backend-Architect  
**Date:** February 5, 2026  
**Review Status:** Ready for implementation  
**API Version:** 1.0.0
