# Backend Architecture - Features Module

**Document Version:** 1.0  
**Created:** 2026-01-15  
**Author:** Backend Architect Agent  
**Status:** Draft  

---

## 1. Overview

This document defines the backend architecture for the Features from JIRA module, including feature entities, JIRA integration, and import functionality.

---

## 2. Database Schema

### 2.1 Feature Model

```python
# app/models/feature.py

import uuid
import enum
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, String, Text, DateTime, Integer, Numeric, ForeignKey
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class FeatureStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Feature(Base):
    __tablename__ = "features"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    jira_key = Column(String(20), nullable=False, unique=True, index=True)
    jira_id = Column(String(50), nullable=False, unique=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    jira_status = Column(String(50), nullable=True)
    internal_status = Column(
        SQLEnum(FeatureStatus),
        nullable=False,
        default=FeatureStatus.NOT_STARTED,
        index=True
    )
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True, index=True)
    budget_line_id = Column(UUID(as_uuid=True), ForeignKey("budget_lines.id"), nullable=True, index=True)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True, index=True)
    quarter = Column(Integer, nullable=True)
    year = Column(Integer, nullable=True, index=True)
    story_points = Column(Integer, nullable=True, default=0)
    cost = Column(Numeric(10, 2), nullable=True, default=0)
    jira_url = Column(String(500), nullable=True)
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    product = relationship("Product", backref="features")
    budget_line = relationship("BudgetLine", backref="features")
    team = relationship("Team", backref="features")

    def __repr__(self):
        return f"<Feature {self.jira_key}: {self.title[:50]}>"


class JiraConfig(Base):
    __tablename__ = "jira_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    jira_url = Column(String(200), nullable=False)
    username = Column(String(100), nullable=False)
    api_token = Column(String(500), nullable=False)  # Encrypted
    project_keys = Column(Text, nullable=True)  # JSON array
    is_active = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<JiraConfig {self.jira_url}>"
```

---

## 3. Pydantic Schemas

```python
# app/schemas/feature.py

from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class FeatureBase(BaseModel):
    jira_key: str = Field(..., max_length=20)
    jira_id: str = Field(..., max_length=50)
    title: str = Field(..., max_length=500)
    description: Optional[str] = None
    jira_status: Optional[str] = Field(None, max_length=50)
    story_points: Optional[int] = Field(0, ge=0)
    jira_url: Optional[str] = Field(None, max_length=500)


class FeatureCreate(FeatureBase):
    product_id: Optional[UUID] = None
    budget_line_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    quarter: Optional[int] = Field(None, ge=1, le=4)
    year: Optional[int] = Field(None, ge=2020, le=2100)
    cost: Optional[Decimal] = Field(Decimal("0"), ge=0)


class FeatureUpdate(BaseModel):
    product_id: Optional[UUID] = None
    budget_line_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    quarter: Optional[int] = Field(None, ge=1, le=4)
    year: Optional[int] = Field(None, ge=2020, le=2100)
    cost: Optional[Decimal] = Field(None, ge=0)
    internal_status: Optional[str] = None

    @field_validator('internal_status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid = ['not_started', 'in_progress', 'completed']
        if v not in valid:
            raise ValueError(f'Status must be one of: {", ".join(valid)}')
        return v


class ProductSummary(BaseModel):
    id: UUID
    name: str
    short_code: str

    class Config:
        from_attributes = True


class BudgetLineSummary(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True


class TeamSummary(BaseModel):
    id: UUID
    name: str
    short_code: str

    class Config:
        from_attributes = True


class FeatureResponse(BaseModel):
    id: UUID
    jira_key: str
    jira_id: str
    title: str
    description: Optional[str] = None
    jira_status: Optional[str] = None
    internal_status: str
    product: Optional[ProductSummary] = None
    budget_line: Optional[BudgetLineSummary] = None
    team: Optional[TeamSummary] = None
    quarter: Optional[int] = None
    year: Optional[int] = None
    story_points: int = 0
    cost: Decimal = Decimal("0")
    jira_url: Optional[str] = None
    last_synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FeatureListResponse(BaseModel):
    data: List[FeatureResponse]
    total: int
    page: int = 1
    page_size: int = 20


class BulkFeatureCreate(BaseModel):
    features: List[FeatureCreate]


class BulkFeatureResponse(BaseModel):
    imported: int
    failed: int
    errors: List[str] = []


# JIRA Schemas
class JiraConfigBase(BaseModel):
    jira_url: str = Field(..., max_length=200)
    username: str = Field(..., max_length=100)
    project_keys: Optional[List[str]] = None


class JiraConfigCreate(JiraConfigBase):
    api_token: str = Field(..., max_length=500)


class JiraConfigUpdate(BaseModel):
    jira_url: Optional[str] = Field(None, max_length=200)
    username: Optional[str] = Field(None, max_length=100)
    api_token: Optional[str] = Field(None, max_length=500)
    project_keys: Optional[List[str]] = None
    is_active: Optional[bool] = None


class JiraConfigResponse(BaseModel):
    id: UUID
    jira_url: str
    username: str
    project_keys: Optional[List[str]] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JiraTestResponse(BaseModel):
    success: bool
    message: str
    projects: Optional[List[str]] = None


class JiraSearchRequest(BaseModel):
    project_key: str
    jql: Optional[str] = None
    max_results: int = Field(50, ge=1, le=100)


class JiraIssue(BaseModel):
    key: str
    id: str
    summary: str
    status: str
    story_points: Optional[int] = 0
    labels: List[str] = []
    url: str
    already_imported: bool = False


class JiraSearchResponse(BaseModel):
    issues: List[JiraIssue]
    total: int
```

---

## 4. API Routes

```python
# app/routes/features.py

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.feature import (
    FeatureCreate,
    FeatureUpdate,
    FeatureResponse,
    FeatureListResponse,
    BulkFeatureCreate,
    BulkFeatureResponse
)
from app.services.feature_service import FeatureService

router = APIRouter(prefix="/api/features", tags=["features"])


@router.get("", response_model=FeatureListResponse)
def list_features(
    product_id: Optional[UUID] = Query(None),
    budget_line_id: Optional[UUID] = Query(None),
    team_id: Optional[UUID] = Query(None),
    year: Optional[int] = Query(None),
    quarter: Optional[int] = Query(None, ge=1, le=4),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List features with filtering and pagination."""
    features, total = FeatureService.get_all(
        db,
        product_id=product_id,
        budget_line_id=budget_line_id,
        team_id=team_id,
        year=year,
        quarter=quarter,
        status=status,
        search=search,
        page=page,
        page_size=page_size
    )
    return FeatureListResponse(
        data=features,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{feature_id}", response_model=FeatureResponse)
def get_feature(
    feature_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a single feature by ID."""
    feature = FeatureService.get_by_id(db, feature_id)
    if not feature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature not found"
        )
    return FeatureService.build_feature_response(feature)


@router.post("", response_model=BulkFeatureResponse, status_code=status.HTTP_201_CREATED)
def create_features(
    data: BulkFeatureCreate,
    db: Session = Depends(get_db)
):
    """Import features (bulk create/update)."""
    return FeatureService.bulk_import(db, data.features)


@router.put("/{feature_id}", response_model=FeatureResponse)
def update_feature(
    feature_id: UUID,
    data: FeatureUpdate,
    db: Session = Depends(get_db)
):
    """Update feature mapping."""
    feature = FeatureService.get_by_id(db, feature_id)
    if not feature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature not found"
        )
    
    updated = FeatureService.update(db, feature_id, data)
    return FeatureService.build_feature_response(updated)


@router.delete("/{feature_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feature(
    feature_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a feature."""
    feature = FeatureService.get_by_id(db, feature_id)
    if not feature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature not found"
        )
    
    FeatureService.delete(db, feature_id)
    return None


@router.post("/{feature_id}/sync", response_model=FeatureResponse)
def sync_feature(
    feature_id: UUID,
    db: Session = Depends(get_db)
):
    """Sync a single feature from JIRA."""
    feature = FeatureService.get_by_id(db, feature_id)
    if not feature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature not found"
        )
    
    synced = FeatureService.sync_from_jira(db, feature)
    if not synced:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to sync from JIRA"
        )
    return FeatureService.build_feature_response(synced)


@router.post("/sync-all", response_model=BulkFeatureResponse)
def sync_all_features(
    db: Session = Depends(get_db)
):
    """Sync all features from JIRA."""
    return FeatureService.sync_all(db)
```

```python
# app/routes/jira.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.feature import (
    JiraConfigCreate,
    JiraConfigUpdate,
    JiraConfigResponse,
    JiraTestResponse,
    JiraSearchRequest,
    JiraSearchResponse
)
from app.services.jira_service import JiraService

router = APIRouter(prefix="/api/jira", tags=["jira"])


@router.get("/config", response_model=JiraConfigResponse)
def get_jira_config(db: Session = Depends(get_db)):
    """Get JIRA configuration."""
    config = JiraService.get_config(db)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="JIRA not configured"
        )
    return config


@router.put("/config", response_model=JiraConfigResponse)
def update_jira_config(
    data: JiraConfigCreate,
    db: Session = Depends(get_db)
):
    """Create or update JIRA configuration."""
    return JiraService.save_config(db, data)


@router.post("/test", response_model=JiraTestResponse)
def test_jira_connection(db: Session = Depends(get_db)):
    """Test JIRA connection."""
    return JiraService.test_connection(db)


@router.get("/projects")
def list_jira_projects(db: Session = Depends(get_db)):
    """List available JIRA projects."""
    projects = JiraService.get_projects(db)
    return {"projects": projects}


@router.post("/search", response_model=JiraSearchResponse)
def search_jira_issues(
    data: JiraSearchRequest,
    db: Session = Depends(get_db)
):
    """Search JIRA issues."""
    return JiraService.search_issues(db, data)
```

---

## 5. Service Layer

```python
# app/services/feature_service.py

from typing import Optional, Tuple, List
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.feature import Feature, FeatureStatus
from app.schemas.feature import (
    FeatureCreate,
    FeatureUpdate,
    FeatureResponse,
    BulkFeatureResponse,
    ProductSummary,
    BudgetLineSummary,
    TeamSummary
)


class FeatureService:
    """Service layer for Feature business logic."""

    STATUS_MAPPING = {
        'to do': FeatureStatus.NOT_STARTED,
        'open': FeatureStatus.NOT_STARTED,
        'backlog': FeatureStatus.NOT_STARTED,
        'in progress': FeatureStatus.IN_PROGRESS,
        'in development': FeatureStatus.IN_PROGRESS,
        'in review': FeatureStatus.IN_PROGRESS,
        'done': FeatureStatus.COMPLETED,
        'closed': FeatureStatus.COMPLETED,
        'resolved': FeatureStatus.COMPLETED,
    }

    @staticmethod
    def map_jira_status(jira_status: str) -> FeatureStatus:
        """Map JIRA status to internal status."""
        if not jira_status:
            return FeatureStatus.NOT_STARTED
        return FeatureService.STATUS_MAPPING.get(
            jira_status.lower(),
            FeatureStatus.NOT_STARTED
        )

    @staticmethod
    def get_all(
        db: Session,
        product_id: Optional[UUID] = None,
        budget_line_id: Optional[UUID] = None,
        team_id: Optional[UUID] = None,
        year: Optional[int] = None,
        quarter: Optional[int] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[FeatureResponse], int]:
        """Get all features with filtering."""
        query = db.query(Feature)

        if product_id:
            query = query.filter(Feature.product_id == product_id)
        if budget_line_id:
            query = query.filter(Feature.budget_line_id == budget_line_id)
        if team_id:
            query = query.filter(Feature.team_id == team_id)
        if year:
            query = query.filter(Feature.year == year)
        if quarter:
            query = query.filter(Feature.quarter == quarter)
        if status:
            query = query.filter(Feature.internal_status == status)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Feature.jira_key.ilike(search_term),
                    Feature.title.ilike(search_term)
                )
            )

        total = query.count()
        
        offset = (page - 1) * page_size
        features = query.order_by(Feature.created_at.desc()).offset(offset).limit(page_size).all()

        result = [FeatureService.build_feature_response(f) for f in features]
        return result, total

    @staticmethod
    def get_by_id(db: Session, feature_id: UUID) -> Optional[Feature]:
        """Get feature by ID."""
        return db.query(Feature).filter(Feature.id == feature_id).first()

    @staticmethod
    def get_by_jira_key(db: Session, jira_key: str) -> Optional[Feature]:
        """Get feature by JIRA key."""
        return db.query(Feature).filter(Feature.jira_key == jira_key).first()

    @staticmethod
    def create(db: Session, data: FeatureCreate) -> Feature:
        """Create a new feature."""
        internal_status = FeatureService.map_jira_status(data.jira_status)
        
        feature = Feature(
            jira_key=data.jira_key,
            jira_id=data.jira_id,
            title=data.title,
            description=data.description,
            jira_status=data.jira_status,
            internal_status=internal_status,
            product_id=data.product_id,
            budget_line_id=data.budget_line_id,
            team_id=data.team_id,
            quarter=data.quarter,
            year=data.year,
            story_points=data.story_points or 0,
            cost=data.cost or Decimal("0"),
            jira_url=data.jira_url,
            last_synced_at=datetime.utcnow()
        )
        db.add(feature)
        db.commit()
        db.refresh(feature)
        return feature

    @staticmethod
    def update(db: Session, feature_id: UUID, data: FeatureUpdate) -> Feature:
        """Update a feature."""
        feature = db.query(Feature).filter(Feature.id == feature_id).first()
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is None:
                continue
            if field == 'internal_status':
                value = FeatureStatus(value)
            setattr(feature, field, value)

        db.commit()
        db.refresh(feature)
        return feature

    @staticmethod
    def delete(db: Session, feature_id: UUID) -> None:
        """Delete a feature."""
        feature = db.query(Feature).filter(Feature.id == feature_id).first()
        db.delete(feature)
        db.commit()

    @staticmethod
    def bulk_import(db: Session, features: List[FeatureCreate]) -> BulkFeatureResponse:
        """Bulk import features."""
        imported = 0
        failed = 0
        errors = []

        for feature_data in features:
            try:
                existing = FeatureService.get_by_jira_key(db, feature_data.jira_key)
                if existing:
                    # Update existing
                    FeatureService.update_from_jira_data(db, existing, feature_data)
                else:
                    # Create new
                    FeatureService.create(db, feature_data)
                imported += 1
            except Exception as e:
                failed += 1
                errors.append(f"{feature_data.jira_key}: {str(e)}")

        return BulkFeatureResponse(imported=imported, failed=failed, errors=errors)

    @staticmethod
    def update_from_jira_data(db: Session, feature: Feature, data: FeatureCreate) -> Feature:
        """Update feature from JIRA data."""
        feature.title = data.title
        feature.description = data.description
        feature.jira_status = data.jira_status
        feature.internal_status = FeatureService.map_jira_status(data.jira_status)
        feature.story_points = data.story_points or feature.story_points
        feature.jira_url = data.jira_url
        feature.last_synced_at = datetime.utcnow()
        
        # Update mappings if provided
        if data.product_id:
            feature.product_id = data.product_id
        if data.budget_line_id:
            feature.budget_line_id = data.budget_line_id
        if data.team_id:
            feature.team_id = data.team_id
        if data.quarter:
            feature.quarter = data.quarter
        if data.year:
            feature.year = data.year
        if data.cost:
            feature.cost = data.cost

        db.commit()
        db.refresh(feature)
        return feature

    @staticmethod
    def sync_from_jira(db: Session, feature: Feature) -> Optional[Feature]:
        """Sync a single feature from JIRA."""
        from app.services.jira_service import JiraService
        
        issue_data = JiraService.get_issue(db, feature.jira_key)
        if not issue_data:
            return None

        feature.title = issue_data.get('summary', feature.title)
        feature.jira_status = issue_data.get('status', feature.jira_status)
        feature.internal_status = FeatureService.map_jira_status(feature.jira_status)
        feature.story_points = issue_data.get('story_points', feature.story_points)
        feature.last_synced_at = datetime.utcnow()

        db.commit()
        db.refresh(feature)
        return feature

    @staticmethod
    def sync_all(db: Session) -> BulkFeatureResponse:
        """Sync all features from JIRA."""
        features = db.query(Feature).all()
        synced = 0
        failed = 0
        errors = []

        for feature in features:
            try:
                result = FeatureService.sync_from_jira(db, feature)
                if result:
                    synced += 1
                else:
                    failed += 1
                    errors.append(f"{feature.jira_key}: Sync failed")
            except Exception as e:
                failed += 1
                errors.append(f"{feature.jira_key}: {str(e)}")

        return BulkFeatureResponse(imported=synced, failed=failed, errors=errors)

    @staticmethod
    def build_feature_response(feature: Feature) -> FeatureResponse:
        """Build feature response with relationships."""
        product = None
        if feature.product:
            product = ProductSummary(
                id=feature.product.id,
                name=feature.product.name,
                short_code=feature.product.short_code
            )

        budget_line = None
        if feature.budget_line:
            budget_line = BudgetLineSummary(
                id=feature.budget_line.id,
                name=feature.budget_line.name
            )

        team = None
        if feature.team:
            team = TeamSummary(
                id=feature.team.id,
                name=feature.team.name,
                short_code=feature.team.short_code
            )

        return FeatureResponse(
            id=feature.id,
            jira_key=feature.jira_key,
            jira_id=feature.jira_id,
            title=feature.title,
            description=feature.description,
            jira_status=feature.jira_status,
            internal_status=feature.internal_status.value,
            product=product,
            budget_line=budget_line,
            team=team,
            quarter=feature.quarter,
            year=feature.year,
            story_points=feature.story_points or 0,
            cost=feature.cost or Decimal("0"),
            jira_url=feature.jira_url,
            last_synced_at=feature.last_synced_at,
            created_at=feature.created_at,
            updated_at=feature.updated_at
        )
```

```python
# app/services/jira_service.py

import json
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
import httpx

from app.models.feature import JiraConfig, Feature
from app.schemas.feature import (
    JiraConfigCreate,
    JiraConfigResponse,
    JiraTestResponse,
    JiraSearchRequest,
    JiraSearchResponse,
    JiraIssue
)


class JiraService:
    """Service layer for JIRA integration."""

    @staticmethod
    def get_config(db: Session) -> Optional[JiraConfigResponse]:
        """Get active JIRA configuration."""
        config = db.query(JiraConfig).filter(JiraConfig.is_active == 1).first()
        if not config:
            return None
        
        project_keys = json.loads(config.project_keys) if config.project_keys else []
        
        return JiraConfigResponse(
            id=config.id,
            jira_url=config.jira_url,
            username=config.username,
            project_keys=project_keys,
            is_active=bool(config.is_active),
            created_at=config.created_at,
            updated_at=config.updated_at
        )

    @staticmethod
    def save_config(db: Session, data: JiraConfigCreate) -> JiraConfigResponse:
        """Create or update JIRA configuration."""
        config = db.query(JiraConfig).filter(JiraConfig.is_active == 1).first()
        
        project_keys_json = json.dumps(data.project_keys) if data.project_keys else None
        
        if config:
            config.jira_url = data.jira_url
            config.username = data.username
            config.api_token = data.api_token
            config.project_keys = project_keys_json
        else:
            config = JiraConfig(
                jira_url=data.jira_url,
                username=data.username,
                api_token=data.api_token,
                project_keys=project_keys_json,
                is_active=1
            )
            db.add(config)

        db.commit()
        db.refresh(config)
        
        return JiraConfigResponse(
            id=config.id,
            jira_url=config.jira_url,
            username=config.username,
            project_keys=data.project_keys,
            is_active=bool(config.is_active),
            created_at=config.created_at,
            updated_at=config.updated_at
        )

    @staticmethod
    def _get_auth(config: JiraConfig) -> tuple:
        """Get authentication tuple for JIRA API."""
        return (config.username, config.api_token)

    @staticmethod
    def test_connection(db: Session) -> JiraTestResponse:
        """Test JIRA connection."""
        config = db.query(JiraConfig).filter(JiraConfig.is_active == 1).first()
        if not config:
            return JiraTestResponse(
                success=False,
                message="JIRA not configured"
            )

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(
                    f"{config.jira_url}/rest/api/2/myself",
                    auth=JiraService._get_auth(config)
                )
                
                if response.status_code == 200:
                    # Get projects
                    projects_response = client.get(
                        f"{config.jira_url}/rest/api/2/project",
                        auth=JiraService._get_auth(config)
                    )
                    projects = []
                    if projects_response.status_code == 200:
                        projects = [p['key'] for p in projects_response.json()]
                    
                    return JiraTestResponse(
                        success=True,
                        message="Connection successful",
                        projects=projects
                    )
                else:
                    return JiraTestResponse(
                        success=False,
                        message=f"Authentication failed: {response.status_code}"
                    )
        except Exception as e:
            return JiraTestResponse(
                success=False,
                message=f"Connection error: {str(e)}"
            )

    @staticmethod
    def get_projects(db: Session) -> List[str]:
        """Get list of JIRA projects."""
        config = db.query(JiraConfig).filter(JiraConfig.is_active == 1).first()
        if not config:
            return []

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(
                    f"{config.jira_url}/rest/api/2/project",
                    auth=JiraService._get_auth(config)
                )
                if response.status_code == 200:
                    return [p['key'] for p in response.json()]
        except Exception:
            pass
        return []

    @staticmethod
    def search_issues(db: Session, request: JiraSearchRequest) -> JiraSearchResponse:
        """Search JIRA issues."""
        config = db.query(JiraConfig).filter(JiraConfig.is_active == 1).first()
        if not config:
            return JiraSearchResponse(issues=[], total=0)

        # Build JQL
        jql = f"project = {request.project_key}"
        if request.jql:
            jql += f" AND ({request.jql})"
        else:
            jql += " AND issuetype = Epic"

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.get(
                    f"{config.jira_url}/rest/api/2/search",
                    params={
                        "jql": jql,
                        "maxResults": request.max_results,
                        "fields": "summary,status,customfield_10016,labels"  # customfield_10016 is often story points
                    },
                    auth=JiraService._get_auth(config)
                )
                
                if response.status_code != 200:
                    return JiraSearchResponse(issues=[], total=0)

                data = response.json()
                issues = []
                
                # Get already imported keys
                imported_keys = set(
                    f.jira_key for f in db.query(Feature.jira_key).all()
                )

                for issue in data.get('issues', []):
                    fields = issue.get('fields', {})
                    status_obj = fields.get('status', {})
                    
                    issues.append(JiraIssue(
                        key=issue['key'],
                        id=issue['id'],
                        summary=fields.get('summary', ''),
                        status=status_obj.get('name', 'Unknown'),
                        story_points=fields.get('customfield_10016') or 0,
                        labels=fields.get('labels', []),
                        url=f"{config.jira_url}/browse/{issue['key']}",
                        already_imported=issue['key'] in imported_keys
                    ))

                return JiraSearchResponse(
                    issues=issues,
                    total=data.get('total', len(issues))
                )
        except Exception as e:
            return JiraSearchResponse(issues=[], total=0)

    @staticmethod
    def get_issue(db: Session, jira_key: str) -> Optional[Dict[str, Any]]:
        """Get a single JIRA issue."""
        config = db.query(JiraConfig).filter(JiraConfig.is_active == 1).first()
        if not config:
            return None

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(
                    f"{config.jira_url}/rest/api/2/issue/{jira_key}",
                    params={"fields": "summary,status,customfield_10016,description"},
                    auth=JiraService._get_auth(config)
                )
                
                if response.status_code != 200:
                    return None

                data = response.json()
                fields = data.get('fields', {})
                status_obj = fields.get('status', {})

                return {
                    'key': data['key'],
                    'id': data['id'],
                    'summary': fields.get('summary', ''),
                    'status': status_obj.get('name', 'Unknown'),
                    'story_points': fields.get('customfield_10016') or 0,
                    'description': fields.get('description', '')
                }
        except Exception:
            return None
```

---

## 6. File Structure Update

```
backend/app/
├── models/
│   ├── __init__.py      # Add Feature imports
│   └── feature.py       # NEW
├── schemas/
│   ├── __init__.py      # Add Feature imports
│   └── feature.py       # NEW
├── routes/
│   ├── __init__.py      # Add features, jira routers
│   ├── features.py      # NEW
│   └── jira.py          # NEW
├── services/
│   ├── __init__.py      # Add FeatureService, JiraService
│   ├── feature_service.py  # NEW
│   └── jira_service.py     # NEW
└── main.py              # Include new routers
```

---

## 7. Dependencies

Add to `requirements.txt`:
```
httpx>=0.24.0
```
