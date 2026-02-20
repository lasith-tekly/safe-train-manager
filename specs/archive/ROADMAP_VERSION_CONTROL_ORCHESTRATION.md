# Roadmap Version Control - Implementation Orchestration Plan

## Executive Summary

**Feature:** Version control for Strategic Roadmap Planning  
**Business Value:** Track roadmap changes over time, maintain history, enable plan vs execution comparison  
**Complexity:** High (Database schema changes, API updates, UI redesign)  
**Estimated Timeline:** 5-7 days  

---

## Business Requirements Recap

### Version Lifecycle
```
DRAFT (editable) → PUBLISHED (locked) → New DRAFT created for changes
```

### Key Behaviors
1. **One draft per product** - Only one DRAFT version allowed at a time
2. **Copy on create** - New version copies ALL features from selected version
3. **Lock on publish** - Publishing locks all features (read-only)
4. **Version history** - View old versions but cannot edit

---

## Architecture Overview

### Database Layer
- New table: `roadmap_versions`
- Modified table: `roadmap_features` (add `version_id`)
- Migration strategy: Create default version for existing features

### API Layer
- Version CRUD endpoints
- Version publish endpoint
- Feature endpoints updated to filter by version
- Validation: Prevent editing published versions

### Frontend Layer
- Version selector dropdown
- Create/Publish version actions
- Read-only mode for published versions
- Version status badges

---

## Task Breakdown by Role

---

## 1️⃣ @Database-Architect

### Task 1.1: Design `roadmap_versions` Table Schema
**Priority:** Critical  
**Estimated Time:** 2 hours  

**Schema:**
```sql
CREATE TABLE roadmap_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    version_name VARCHAR(50) NOT NULL,  -- "2026-02-05"
    status VARCHAR(20) NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED')),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_version_name_per_product UNIQUE (product_id, version_name),
    CONSTRAINT one_draft_per_product UNIQUE (product_id, status) 
        WHERE status = 'DRAFT'
);

-- Indexes
CREATE INDEX idx_roadmap_versions_product ON roadmap_versions(product_id);
CREATE INDEX idx_roadmap_versions_status ON roadmap_versions(status);
```

**Deliverables:**
- [ ] SQL schema file: `migrations/add_roadmap_versions.sql`
- [ ] Index strategy document
- [ ] Constraint validation rules

---

### Task 1.2: Modify `roadmap_features` Table
**Priority:** Critical  
**Estimated Time:** 1 hour  

**Changes:**
```sql
ALTER TABLE roadmap_features 
ADD COLUMN version_id UUID REFERENCES roadmap_versions(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX idx_roadmap_features_version ON roadmap_features(version_id);

-- Make version_id NOT NULL after data migration
-- ALTER TABLE roadmap_features ALTER COLUMN version_id SET NOT NULL;
```

**Deliverables:**
- [ ] Migration script
- [ ] Rollback script
- [ ] Data migration plan for existing features

---

### Task 1.3: Data Migration Strategy
**Priority:** Critical  
**Estimated Time:** 2 hours  

**Migration Steps:**
1. Create default "Initial Version" for each product
2. Set status to PUBLISHED
3. Link all existing features to default version
4. Create new DRAFT version for each product

**Migration Script:**
```sql
-- Step 1: Create default published version for each product
INSERT INTO roadmap_versions (product_id, version_name, status, description, created_by)
SELECT 
    id,
    TO_CHAR(NOW(), 'YYYY-MM-DD') || '-initial',
    'PUBLISHED',
    'Initial version created during migration',
    'system'
FROM products;

-- Step 2: Link existing features to default version
UPDATE roadmap_features rf
SET version_id = (
    SELECT rv.id 
    FROM roadmap_versions rv 
    WHERE rv.product_id = rf.product_id 
    AND rv.version_name LIKE '%-initial'
);

-- Step 3: Create new DRAFT version for each product
INSERT INTO roadmap_versions (product_id, version_name, status, description, created_by)
SELECT 
    id,
    TO_CHAR(NOW(), 'YYYY-MM-DD'),
    'DRAFT',
    'Current working version',
    'system'
FROM products;
```

**Deliverables:**
- [ ] Migration script with rollback
- [ ] Data validation queries
- [ ] Migration execution plan

---

## 2️⃣ @Backend-Architect

### Task 2.1: Design API Endpoints
**Priority:** High  
**Estimated Time:** 3 hours  

**Endpoints Design:**

```python
# Version Management
GET    /api/products/{product_id}/roadmap-versions
POST   /api/products/{product_id}/roadmap-versions
GET    /api/roadmap-versions/{version_id}
PUT    /api/roadmap-versions/{version_id}
DELETE /api/roadmap-versions/{version_id}
POST   /api/roadmap-versions/{version_id}/publish

# Feature Management (version-aware)
GET    /api/roadmap-versions/{version_id}/features
POST   /api/roadmap-versions/{version_id}/features
PUT    /api/features/{feature_id}  # Check version status
DELETE /api/features/{feature_id}  # Check version status
```

**Request/Response Schemas:**

```python
# List Versions Response
{
  "data": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "version_name": "2026-02-05",
      "status": "DRAFT",
      "description": "Q1 2026 Planning",
      "created_at": "2026-02-05T10:00:00Z",
      "published_at": null,
      "created_by": "john.doe",
      "feature_count": 15
    }
  ]
}

# Create Version Request
{
  "copy_from_version_id": "uuid",  # Optional, copies features
  "version_name": "2026-02-12",
  "description": "Updated Q1 plan"
}

# Publish Version Request
{
  "published_by": "john.doe"
}
```

**Deliverables:**
- [ ] API specification document (OpenAPI/Swagger)
- [ ] Request/response schema definitions
- [ ] Error response codes and messages
- [ ] Validation rules documentation

---

### Task 2.2: Define Business Logic Rules
**Priority:** High  
**Estimated Time:** 2 hours  

**Validation Rules:**

1. **Version Creation:**
   - Only one DRAFT version per product
   - Version name must be unique per product
   - If copying from version, source version must exist

2. **Version Publishing:**
   - Only DRAFT versions can be published
   - Published versions cannot be unpublished
   - Set `published_at` timestamp

3. **Feature Editing:**
   - Can only edit features in DRAFT versions
   - Return 403 Forbidden if version is PUBLISHED
   - Validate version_id exists and belongs to product

4. **Version Deletion:**
   - Can only delete DRAFT versions
   - Cannot delete if it's the only version
   - Cascade delete all features in version

**Deliverables:**
- [ ] Business rules document
- [ ] Validation logic specifications
- [ ] Error handling strategy

---

## 3️⃣ @Backend-Developer

### Task 3.1: Create SQLAlchemy Models
**Priority:** Critical  
**Estimated Time:** 2 hours  

**File:** `backend/app/models/roadmap_version.py`

```python
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime

class RoadmapVersion(Base):
    __tablename__ = "roadmap_versions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    version_name = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    published_at = Column(DateTime)
    created_by = Column(String(100))
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="roadmap_versions")
    features = relationship("RoadmapFeature", back_populates="version", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        CheckConstraint("status IN ('DRAFT', 'PUBLISHED')", name="valid_status"),
        UniqueConstraint("product_id", "version_name", name="unique_version_name"),
        # Note: Partial unique constraint for one draft per product
        # needs to be handled at application level or with database-specific syntax
    )
```

**Update:** `backend/app/models/roadmap_v4.py`
```python
class RoadmapFeature(Base):
    # ... existing fields ...
    version_id = Column(String(36), ForeignKey("roadmap_versions.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    version = relationship("RoadmapVersion", back_populates="features")
```

**Deliverables:**
- [ ] Model classes with relationships
- [ ] Model unit tests
- [ ] Database migration script

---

### Task 3.2: Create Pydantic Schemas
**Priority:** Critical  
**Estimated Time:** 2 hours  

**File:** `backend/app/schemas/roadmap_version.py`

```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class VersionStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"

class RoadmapVersionBase(BaseModel):
    version_name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None

class CreateRoadmapVersionRequest(RoadmapVersionBase):
    copy_from_version_id: Optional[str] = None

class UpdateRoadmapVersionRequest(BaseModel):
    description: Optional[str] = None

class PublishVersionRequest(BaseModel):
    published_by: str

class RoadmapVersionResponse(RoadmapVersionBase):
    id: str
    product_id: str
    status: VersionStatus
    created_at: datetime
    published_at: Optional[datetime]
    created_by: Optional[str]
    feature_count: Optional[int] = 0
    
    class Config:
        from_attributes = True

class RoadmapVersionListResponse(BaseModel):
    data: List[RoadmapVersionResponse]
    total: int
```

**Deliverables:**
- [ ] Schema definitions
- [ ] Validation rules
- [ ] Schema unit tests

---

### Task 3.3: Implement Version Service
**Priority:** Critical  
**Estimated Time:** 4 hours  

**File:** `backend/app/services/roadmap_version_service.py`

```python
from sqlalchemy.orm import Session
from app.models.roadmap_version import RoadmapVersion
from app.models.roadmap_v4 import RoadmapFeature
from app.schemas.roadmap_version import CreateRoadmapVersionRequest, VersionStatus
from datetime import datetime
import uuid

class RoadmapVersionService:
    def __init__(self, db: Session):
        self.db = db
    
    def list_versions(self, product_id: str):
        """List all versions for a product"""
        versions = self.db.query(RoadmapVersion).filter(
            RoadmapVersion.product_id == product_id
        ).order_by(RoadmapVersion.created_at.desc()).all()
        
        # Add feature count
        for version in versions:
            version.feature_count = len(version.features)
        
        return versions
    
    def create_version(self, product_id: str, request: CreateRoadmapVersionRequest, created_by: str):
        """Create new version, optionally copying features from another version"""
        
        # Check for existing draft
        existing_draft = self.db.query(RoadmapVersion).filter(
            RoadmapVersion.product_id == product_id,
            RoadmapVersion.status == VersionStatus.DRAFT
        ).first()
        
        if existing_draft:
            raise ValueError("A draft version already exists for this product")
        
        # Create new version
        new_version = RoadmapVersion(
            id=str(uuid.uuid4()),
            product_id=product_id,
            version_name=request.version_name,
            status=VersionStatus.DRAFT,
            description=request.description,
            created_by=created_by
        )
        
        self.db.add(new_version)
        self.db.flush()
        
        # Copy features if requested
        if request.copy_from_version_id:
            self._copy_features(request.copy_from_version_id, new_version.id)
        
        self.db.commit()
        self.db.refresh(new_version)
        return new_version
    
    def publish_version(self, version_id: str, published_by: str):
        """Publish a draft version (locks it)"""
        version = self.db.query(RoadmapVersion).filter(
            RoadmapVersion.id == version_id
        ).first()
        
        if not version:
            raise ValueError("Version not found")
        
        if version.status != VersionStatus.DRAFT:
            raise ValueError("Only draft versions can be published")
        
        version.status = VersionStatus.PUBLISHED
        version.published_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(version)
        return version
    
    def _copy_features(self, source_version_id: str, target_version_id: str):
        """Copy all features from source version to target version"""
        source_features = self.db.query(RoadmapFeature).filter(
            RoadmapFeature.version_id == source_version_id
        ).all()
        
        for feature in source_features:
            new_feature = RoadmapFeature(
                id=str(uuid.uuid4()),
                version_id=target_version_id,
                product_id=feature.product_id,
                name=feature.name,
                customer=feature.customer,
                priority=feature.priority,
                gross_sizing_ed=feature.gross_sizing_ed,
                net_sizing_ed=feature.net_sizing_ed,
                total_cost_keur=feature.total_cost_keur,
                remarks=feature.remarks,
                status=feature.status
            )
            self.db.add(new_feature)
            
            # Copy related data (teams, allocations, etc.)
            # ... implementation details ...
```

**Deliverables:**
- [ ] Service class with all methods
- [ ] Feature copying logic
- [ ] Service unit tests
- [ ] Integration tests

---

### Task 3.4: Implement API Routes
**Priority:** Critical  
**Estimated Time:** 3 hours  

**File:** `backend/app/routes/roadmap_versions.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.roadmap_version_service import RoadmapVersionService
from app.schemas.roadmap_version import (
    CreateRoadmapVersionRequest,
    UpdateRoadmapVersionRequest,
    PublishVersionRequest,
    RoadmapVersionResponse,
    RoadmapVersionListResponse
)

router = APIRouter(prefix="/api", tags=["Roadmap Versions"])

@router.get("/products/{product_id}/roadmap-versions", response_model=RoadmapVersionListResponse)
def list_versions(product_id: str, db: Session = Depends(get_db)):
    """List all roadmap versions for a product"""
    service = RoadmapVersionService(db)
    versions = service.list_versions(product_id)
    return {"data": versions, "total": len(versions)}

@router.post("/products/{product_id}/roadmap-versions", response_model=RoadmapVersionResponse, status_code=201)
def create_version(
    product_id: str,
    request: CreateRoadmapVersionRequest,
    db: Session = Depends(get_db),
    created_by: str = "current_user"  # TODO: Get from auth
):
    """Create new roadmap version"""
    service = RoadmapVersionService(db)
    try:
        version = service.create_version(product_id, request, created_by)
        return version
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/roadmap-versions/{version_id}/publish", response_model=RoadmapVersionResponse)
def publish_version(
    version_id: str,
    request: PublishVersionRequest,
    db: Session = Depends(get_db)
):
    """Publish a draft version (locks it)"""
    service = RoadmapVersionService(db)
    try:
        version = service.publish_version(version_id, request.published_by)
        return version
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/roadmap-versions/{version_id}/features")
def get_version_features(version_id: str, db: Session = Depends(get_db)):
    """Get all features for a specific version"""
    # Use existing feature service but filter by version_id
    from app.services.feature_service_v4 import FeatureServiceV4
    service = FeatureServiceV4(db)
    # Update list_features to accept version_id parameter
    features = service.list_features(version_id=version_id)
    return features
```

**Deliverables:**
- [ ] API route handlers
- [ ] Error handling
- [ ] API endpoint tests

---

### Task 3.5: Update Feature Service for Version Awareness
**Priority:** Critical  
**Estimated Time:** 3 hours  

**Updates to:** `backend/app/services/feature_service_v4.py`

```python
class FeatureServiceV4:
    def create_feature(self, request: CreateFeatureRequest, version_id: str, created_by: Optional[str] = None):
        """Create feature - check version is DRAFT"""
        version = self.db.query(RoadmapVersion).filter(RoadmapVersion.id == version_id).first()
        if not version:
            raise ValueError("Version not found")
        if version.status != "DRAFT":
            raise ValueError("Cannot create features in published version")
        
        # ... existing create logic ...
        feature.version_id = version_id
    
    def update_feature(self, feature_id: str, request: UpdateFeatureRequest):
        """Update feature - check version is DRAFT"""
        feature = self.db.query(RoadmapFeature).filter(RoadmapFeature.id == feature_id).first()
        if not feature:
            raise ValueError("Feature not found")
        
        if feature.version.status != "DRAFT":
            raise ValueError("Cannot edit features in published version")
        
        # ... existing update logic ...
    
    def list_features(self, version_id: Optional[str] = None, product_id: Optional[str] = None, ...):
        """List features - filter by version_id"""
        query = self.db.query(RoadmapFeature)
        
        if version_id:
            query = query.filter(RoadmapFeature.version_id == version_id)
        elif product_id:
            # Get current draft version for product
            draft_version = self.db.query(RoadmapVersion).filter(
                RoadmapVersion.product_id == product_id,
                RoadmapVersion.status == "DRAFT"
            ).first()
            if draft_version:
                query = query.filter(RoadmapFeature.version_id == draft_version.id)
        
        # ... rest of query logic ...
```

**Deliverables:**
- [ ] Updated feature service methods
- [ ] Version validation logic
- [ ] Updated feature service tests

---

## 4️⃣ @Frontend-Architect

### Task 4.1: Design Component Structure
**Priority:** High  
**Estimated Time:** 2 hours  

**Component Hierarchy:**

```
ProductRoadmapPage
├── RoadmapVersionSelector (NEW)
│   ├── VersionDropdown
│   ├── CreateVersionButton
│   └── PublishVersionButton
├── VersionStatusBanner (NEW)
├── FeatureTable (UPDATED - read-only mode)
├── FeatureForm (UPDATED - version validation)
└── FeatureDetailPanel (UPDATED - show version info)
```

**New Components:**

1. **RoadmapVersionSelector**
   - Props: `versions`, `currentVersion`, `onVersionChange`, `onCreateVersion`, `onPublish`
   - State: `isCreating`, `isPublishing`
   - Renders: Dropdown + action buttons

2. **VersionStatusBanner**
   - Props: `version`
   - Renders: Alert banner for published versions (read-only mode)

**Updated Components:**

1. **ProductRoadmapPage**
   - Add version state management
   - Add version API calls
   - Pass read-only flag to child components

2. **FeatureTable**
   - Add `readOnly` prop
   - Disable edit/delete actions when read-only

3. **FeatureForm**
   - Add version validation
   - Show version info in form

**Deliverables:**
- [ ] Component structure diagram
- [ ] Props/state definitions
- [ ] Component interaction flow
- [ ] Routing strategy (version in URL?)

---

### Task 4.2: Define State Management Strategy
**Priority:** High  
**Estimated Time:** 2 hours  

**State Structure:**

```typescript
interface RoadmapVersionState {
  versions: RoadmapVersion[];
  currentVersion: RoadmapVersion | null;
  loading: boolean;
  error: string | null;
}

interface RoadmapVersion {
  id: string;
  product_id: string;
  version_name: string;
  status: 'DRAFT' | 'PUBLISHED';
  description?: string;
  created_at: string;
  published_at?: string;
  created_by?: string;
  feature_count: number;
}
```

**State Management Approach:**
- Use React hooks (useState, useEffect)
- Version selection triggers feature reload
- Optimistic updates for publish action
- Error handling with rollback

**Deliverables:**
- [ ] State management design document
- [ ] TypeScript interfaces
- [ ] State update flow diagrams

---

## 5️⃣ @UI-Designer

### Task 5.1: Design Version Selector UI
**Priority:** High  
**Estimated Time:** 3 hours  

**Design Requirements:**

1. **Version Dropdown:**
   - Show version name + status badge
   - DRAFT: Orange badge
   - PUBLISHED: Green badge
   - Sort: Draft first, then by date descending
   - Show feature count

2. **Action Buttons:**
   - "Create New Version" - Primary button
   - "Publish Version" - Success button (only for DRAFT)
   - Disabled states with tooltips

3. **Status Banner:**
   - Published version: Blue info banner
   - Text: "🔒 This is a published version (read-only). Create a new version to make changes."
   - Dismissible: No

**Mockup Example:**

```
┌─────────────────────────────────────────────────────────────┐
│ Roadmap Planning - Baggage Reconciliation System           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Version: [2026-02-05 🟠 DRAFT ▼]  [Create New] [Publish]  │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 🔒 This is a published version (read-only)              ││
│ │    Create a new version to make changes.                ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ [Feature Table...]                                          │
└─────────────────────────────────────────────────────────────┘
```

**Deliverables:**
- [ ] Figma mockups
- [ ] Component specifications
- [ ] Color/spacing guidelines
- [ ] Interaction states (hover, disabled, loading)

---

### Task 5.2: Design Create Version Modal
**Priority:** Medium  
**Estimated Time:** 2 hours  

**Modal Design:**

```
┌──────────────────────────────────────────┐
│ Create New Roadmap Version               │
├──────────────────────────────────────────┤
│                                          │
│ Version Name: [2026-02-12        ]      │
│               (auto-generated)           │
│                                          │
│ Copy from:    [2026-02-05 (PUBLISHED) ▼]│
│               ✓ Copy all features        │
│                                          │
│ Description:  [                        ] │
│               [                        ] │
│               [                        ] │
│                                          │
│              [Cancel]  [Create Version]  │
└──────────────────────────────────────────┘
```

**Deliverables:**
- [ ] Modal mockup
- [ ] Form validation rules
- [ ] Success/error states

---

## 6️⃣ @Frontend-Developer

### Task 6.1: Create Version API Service
**Priority:** Critical  
**Estimated Time:** 2 hours  

**File:** `frontend/src/services/roadmapVersionApi.ts`

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface RoadmapVersion {
  id: string;
  product_id: string;
  version_name: string;
  status: 'DRAFT' | 'PUBLISHED';
  description?: string;
  created_at: string;
  published_at?: string;
  created_by?: string;
  feature_count: number;
}

export interface CreateVersionRequest {
  version_name: string;
  copy_from_version_id?: string;
  description?: string;
}

export const listVersions = async (productId: string): Promise<RoadmapVersion[]> => {
  const response = await axios.get(`${API_BASE_URL}/products/${productId}/roadmap-versions`);
  return response.data.data;
};

export const createVersion = async (
  productId: string,
  request: CreateVersionRequest
): Promise<RoadmapVersion> => {
  const response = await axios.post(
    `${API_BASE_URL}/products/${productId}/roadmap-versions`,
    request
  );
  return response.data;
};

export const publishVersion = async (
  versionId: string,
  publishedBy: string
): Promise<RoadmapVersion> => {
  const response = await axios.post(
    `${API_BASE_URL}/roadmap-versions/${versionId}/publish`,
    { published_by: publishedBy }
  );
  return response.data;
};

export const getVersionFeatures = async (versionId: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/roadmap-versions/${versionId}/features`
  );
  return response.data;
};
```

**Deliverables:**
- [ ] API service functions
- [ ] TypeScript interfaces
- [ ] Error handling

---

### Task 6.2: Implement RoadmapVersionSelector Component
**Priority:** Critical  
**Estimated Time:** 4 hours  

**File:** `frontend/src/pages/RoadmapV4/components/RoadmapVersionSelector.tsx`

```typescript
import React, { useState } from 'react';
import { Select, Button, Space, Tag, Tooltip } from 'antd';
import { PlusOutlined, CheckOutlined } from '@ant-design/icons';
import { RoadmapVersion } from '../../../services/roadmapVersionApi';

interface RoadmapVersionSelectorProps {
  versions: RoadmapVersion[];
  currentVersion: RoadmapVersion | null;
  onVersionChange: (versionId: string) => void;
  onCreateVersion: () => void;
  onPublish: () => void;
  loading?: boolean;
}

export const RoadmapVersionSelector: React.FC<RoadmapVersionSelectorProps> = ({
  versions,
  currentVersion,
  onVersionChange,
  onCreateVersion,
  onPublish,
  loading = false
}) => {
  const isDraft = currentVersion?.status === 'DRAFT';
  const hasDraft = versions.some(v => v.status === 'DRAFT');

  return (
    <Space size="middle" style={{ marginBottom: 16 }}>
      <span style={{ fontWeight: 500 }}>Version:</span>
      
      <Select
        value={currentVersion?.id}
        onChange={onVersionChange}
        style={{ width: 250 }}
        loading={loading}
      >
        {versions.map(version => (
          <Select.Option key={version.id} value={version.id}>
            <Space>
              {version.version_name}
              <Tag color={version.status === 'DRAFT' ? 'orange' : 'green'}>
                {version.status}
              </Tag>
              <span style={{ color: '#888', fontSize: 12 }}>
                ({version.feature_count} features)
              </span>
            </Space>
          </Select.Option>
        ))}
      </Select>

      <Tooltip title={hasDraft ? 'A draft version already exists' : 'Create new version from current'}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onCreateVersion}
          disabled={hasDraft || loading}
        >
          Create New Version
        </Button>
      </Tooltip>

      {isDraft && (
        <Tooltip title="Publish this version (locks all features)">
          <Button
            type="primary"
            style={{ background: '#52c41a' }}
            icon={<CheckOutlined />}
            onClick={onPublish}
            disabled={loading}
          >
            Publish Version
          </Button>
        </Tooltip>
      )}
    </Space>
  );
};
```

**Deliverables:**
- [ ] Component implementation
- [ ] Props validation
- [ ] Component tests

---

### Task 6.3: Implement CreateVersionModal Component
**Priority:** Critical  
**Estimated Time:** 3 hours  

**File:** `frontend/src/pages/RoadmapV4/components/CreateVersionModal.tsx`

```typescript
import React, { useState } from 'react';
import { Modal, Form, Input, Select, Checkbox, message } from 'antd';
import { RoadmapVersion, CreateVersionRequest } from '../../../services/roadmapVersionApi';

interface CreateVersionModalProps {
  visible: boolean;
  versions: RoadmapVersion[];
  productId: string;
  onClose: () => void;
  onSuccess: (version: RoadmapVersion) => void;
}

export const CreateVersionModal: React.FC<CreateVersionModalProps> = ({
  visible,
  versions,
  productId,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [copyFeatures, setCopyFeatures] = useState(true);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const request: CreateVersionRequest = {
        version_name: values.version_name,
        description: values.description,
        copy_from_version_id: copyFeatures ? values.copy_from_version_id : undefined
      };

      const newVersion = await createVersion(productId, request);
      message.success('Version created successfully');
      onSuccess(newVersion);
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('Failed to create version');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create New Roadmap Version"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Create Version"
      width={500}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="version_name"
          label="Version Name"
          initialValue={new Date().toISOString().split('T')[0]}
          rules={[{ required: true, message: 'Version name is required' }]}
        >
          <Input placeholder="2026-02-12" />
        </Form.Item>

        <Form.Item label="Copy from Version">
          <Checkbox
            checked={copyFeatures}
            onChange={(e) => setCopyFeatures(e.target.checked)}
          >
            Copy all features from existing version
          </Checkbox>
        </Form.Item>

        {copyFeatures && (
          <Form.Item
            name="copy_from_version_id"
            rules={[{ required: copyFeatures, message: 'Select a version to copy from' }]}
          >
            <Select placeholder="Select version">
              {versions.map(version => (
                <Select.Option key={version.id} value={version.id}>
                  {version.version_name} ({version.status})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} placeholder="Optional description..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};
```

**Deliverables:**
- [ ] Modal component
- [ ] Form validation
- [ ] Component tests

---

### Task 6.4: Update ProductRoadmapPage with Version Management
**Priority:** Critical  
**Estimated Time:** 4 hours  

**Updates to:** `frontend/src/pages/RoadmapV4/ProductRoadmapPage.tsx`

```typescript
import { RoadmapVersionSelector } from './components/RoadmapVersionSelector';
import { CreateVersionModal } from './components/CreateVersionModal';
import { listVersions, publishVersion, RoadmapVersion } from '../../services/roadmapVersionApi';

const ProductRoadmapPage: React.FC = () => {
  // ... existing state ...
  const [versions, setVersions] = useState<RoadmapVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<RoadmapVersion | null>(null);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  useEffect(() => {
    if (productId) {
      loadVersions();
    }
  }, [productId]);

  const loadVersions = async () => {
    setVersionsLoading(true);
    try {
      const versionList = await listVersions(productId!);
      setVersions(versionList);
      
      // Select draft version by default, or most recent
      const draftVersion = versionList.find(v => v.status === 'DRAFT');
      const selectedVersion = draftVersion || versionList[0];
      setCurrentVersion(selectedVersion);
      
      if (selectedVersion) {
        loadFeaturesForVersion(selectedVersion.id);
      }
    } catch (error) {
      message.error('Failed to load versions');
    } finally {
      setVersionsLoading(false);
    }
  };

  const loadFeaturesForVersion = async (versionId: string) => {
    setLoading(true);
    try {
      const response = await getVersionFeatures(versionId);
      setFeatures(response.data);
    } catch (error) {
      message.error('Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  const handleVersionChange = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setCurrentVersion(version);
      loadFeaturesForVersion(versionId);
    }
  };

  const handlePublishVersion = async () => {
    if (!currentVersion) return;
    
    Modal.confirm({
      title: 'Publish Version',
      content: 'Are you sure? This will lock all features and prevent further edits.',
      onOk: async () => {
        try {
          await publishVersion(currentVersion.id, 'current_user');
          message.success('Version published successfully');
          loadVersions();
        } catch (error) {
          message.error('Failed to publish version');
        }
      }
    });
  };

  const isReadOnly = currentVersion?.status === 'PUBLISHED';

  return (
    <div>
      <RoadmapVersionSelector
        versions={versions}
        currentVersion={currentVersion}
        onVersionChange={handleVersionChange}
        onCreateVersion={() => setCreateModalVisible(true)}
        onPublish={handlePublishVersion}
        loading={versionsLoading}
      />

      {isReadOnly && (
        <Alert
          message="Read-Only Mode"
          description="This is a published version. Create a new version to make changes."
          type="info"
          showIcon
          closable={false}
          style={{ marginBottom: 16 }}
        />
      )}

      <FeatureTable
        features={features}
        readOnly={isReadOnly}
        // ... other props
      />

      <CreateVersionModal
        visible={createModalVisible}
        versions={versions}
        productId={productId!}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={() => {
          loadVersions();
          setCreateModalVisible(false);
        }}
      />
    </div>
  );
};
```

**Deliverables:**
- [ ] Updated ProductRoadmapPage
- [ ] Version state management
- [ ] Read-only mode implementation
- [ ] Integration tests

---

### Task 6.5: Update FeatureTable for Read-Only Mode
**Priority:** High  
**Estimated Time:** 2 hours  

**Updates to:** Feature table columns

```typescript
const columns = [
  // ... existing columns ...
  {
    title: 'Actions',
    key: 'actions',
    render: (_, record) => (
      <Space>
        <Button
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
          disabled={readOnly}
        >
          Edit
        </Button>
        <Button
          icon={<DeleteOutlined />}
          danger
          onClick={() => handleDelete(record.id)}
          disabled={readOnly}
        >
          Delete
        </Button>
      </Space>
    )
  }
];

// Disable "Create Feature" button when read-only
<Button
  type="primary"
  icon={<PlusOutlined />}
  onClick={handleCreateFeature}
  disabled={readOnly}
>
  Create Feature
</Button>
```

**Deliverables:**
- [ ] Read-only mode implementation
- [ ] Disabled state styling
- [ ] Tooltips for disabled actions

---

## 7️⃣ @QA

### Task 7.1: Create Test Scenarios
**Priority:** High  
**Estimated Time:** 3 hours  

**Test Scenarios:**

#### Scenario 1: Create New Version
1. Navigate to Roadmap Planning
2. Click "Create New Version"
3. Enter version name and description
4. Select "Copy from existing version"
5. Click "Create Version"
6. **Expected:** New draft version created with copied features

#### Scenario 2: Publish Version
1. Select draft version
2. Click "Publish Version"
3. Confirm action
4. **Expected:** Version status changes to PUBLISHED, features locked

#### Scenario 3: Edit Published Version (Negative Test)
1. Select published version
2. Try to edit a feature
3. **Expected:** Edit button disabled, error message shown

#### Scenario 4: Multiple Drafts (Negative Test)
1. Create a draft version
2. Try to create another draft
3. **Expected:** Error message: "A draft version already exists"

#### Scenario 5: Version Switching
1. Create multiple versions
2. Switch between versions using dropdown
3. **Expected:** Feature table updates to show version-specific features

#### Scenario 6: Delete Draft Version
1. Create draft version
2. Delete draft version
3. **Expected:** Version deleted, features removed

#### Scenario 7: Feature Count Accuracy
1. Create version with features
2. Add/remove features
3. Check version dropdown
4. **Expected:** Feature count updates correctly

**Deliverables:**
- [ ] Test case document
- [ ] Test data setup scripts
- [ ] Expected results documentation

---

### Task 7.2: Execute Integration Tests
**Priority:** High  
**Estimated Time:** 4 hours  

**Test Coverage:**

1. **API Tests:**
   - Version CRUD operations
   - Publish version endpoint
   - Feature filtering by version
   - Validation rules

2. **UI Tests:**
   - Version selector functionality
   - Create version modal
   - Publish confirmation
   - Read-only mode enforcement

3. **End-to-End Tests:**
   - Complete version lifecycle
   - Feature copying accuracy
   - Permission enforcement

**Deliverables:**
- [ ] Test execution report
- [ ] Bug reports (if any)
- [ ] Test coverage metrics

---

## Implementation Timeline

### Phase 1: Foundation (Days 1-2)
- Database schema design and migration
- SQLAlchemy models
- Pydantic schemas
- Basic API endpoints

### Phase 2: Backend Logic (Days 2-3)
- Version service implementation
- Feature service updates
- API route handlers
- Validation logic

### Phase 3: Frontend Components (Days 3-4)
- API service layer
- Version selector component
- Create version modal
- ProductRoadmapPage updates

### Phase 4: Integration & Polish (Days 4-5)
- Read-only mode implementation
- UI polish and styling
- Error handling
- Loading states

### Phase 5: Testing & QA (Days 5-7)
- Unit tests
- Integration tests
- End-to-end tests
- Bug fixes

---

## Success Criteria

✅ **Database:**
- Migration runs successfully
- Existing features linked to default version
- Constraints enforced

✅ **Backend:**
- All API endpoints functional
- Validation rules enforced
- Feature copying works correctly

✅ **Frontend:**
- Version selector displays correctly
- Create/publish actions work
- Read-only mode enforced
- No UI regressions

✅ **Testing:**
- All test scenarios pass
- No critical bugs
- Performance acceptable

---

## Risk Mitigation

### Risk 1: Data Migration Failure
**Mitigation:** Test migration on copy of production data, have rollback script ready

### Risk 2: Performance Impact (Feature Copying)
**Mitigation:** Implement batch copying, add progress indicator

### Risk 3: UI Complexity
**Mitigation:** Incremental rollout, feature flag for version control

### Risk 4: Breaking Changes to Existing Features
**Mitigation:** Maintain backward compatibility, gradual migration

---

## Rollout Strategy

### Phase 1: Internal Testing
- Deploy to dev environment
- Test with sample data
- Gather feedback from team

### Phase 2: Beta Testing
- Enable for select products
- Monitor performance
- Collect user feedback

### Phase 3: Full Rollout
- Enable for all products
- Provide user training
- Monitor for issues

---

## Documentation Requirements

1. **API Documentation:**
   - OpenAPI/Swagger specs
   - Request/response examples
   - Error codes

2. **User Guide:**
   - How to create versions
   - How to publish versions
   - How to view history

3. **Developer Guide:**
   - Database schema
   - API integration
   - Component usage

---

## Post-Implementation Tasks

1. **Monitoring:**
   - Track version creation rate
   - Monitor API performance
   - Track user adoption

2. **Optimization:**
   - Optimize feature copying
   - Add caching if needed
   - Improve UI responsiveness

3. **Future Enhancements:**
   - Version comparison view
   - Rollback to previous version
   - Version branching
   - Export version as PDF

---

## Questions & Clarifications Needed

1. **User Authentication:** How to get current user for `created_by` field?
2. **Permissions:** Should version management require special permissions?
3. **Version Naming:** Should version names be auto-generated or user-defined?
4. **Feature Limit:** Is there a limit on features per version?
5. **Version Retention:** Should old versions be archived/deleted after X months?

---

## Summary

This orchestration plan provides a comprehensive roadmap for implementing version control in Strategic Roadmap Planning. The feature enables PMs to track changes over time, maintain history, and compare planned vs actual execution.

**Key Deliverables:**
- Database schema with migrations
- Complete backend API
- Frontend components and UI
- Comprehensive test coverage
- User documentation

**Estimated Timeline:** 5-7 days  
**Team Size:** 7 roles (Database, Backend, Frontend, QA, UI, Architecture)  
**Complexity:** High (requires coordination across all layers)

---

**Status:** Ready for implementation  
**Next Step:** Review and approve plan, assign tasks to team members
