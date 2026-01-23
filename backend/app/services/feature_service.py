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
    TeamSummary,
    ManualFeatureCreate
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
        """Create a new feature from JIRA import."""
        internal_status = FeatureService.map_jira_status(data.jira_status)
        
        feature = Feature(
            jira_key=data.jira_key,
            jira_id=data.jira_id,
            title=data.title,
            description=data.description,
            jira_status=data.jira_status,
            internal_status=internal_status,
            product_id=str(data.product_id) if data.product_id else None,
            budget_line_id=str(data.budget_line_id) if data.budget_line_id else None,
            team_id=str(data.team_id) if data.team_id else None,
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
    def create_manual(db: Session, data: ManualFeatureCreate) -> Feature:
        """Create a feature manually without JIRA."""
        import uuid as uuid_lib
        
        # Generate a unique key for manual features
        manual_id = str(uuid_lib.uuid4())[:8].upper()
        jira_key = f"MANUAL-{manual_id}"
        
        internal_status = FeatureStatus(data.internal_status) if data.internal_status else FeatureStatus.NOT_STARTED
        
        feature = Feature(
            jira_key=jira_key,
            jira_id=f"manual-{manual_id}",
            title=data.title,
            description=data.description,
            jira_status=None,
            internal_status=internal_status,
            product_id=str(data.product_id) if data.product_id else None,
            budget_line_id=str(data.budget_line_id) if data.budget_line_id else None,
            team_id=str(data.team_id) if data.team_id else None,
            quarter=data.quarter,
            year=data.year,
            story_points=data.story_points or 0,
            cost=data.cost or Decimal("0"),
            jira_url=None,
            last_synced_at=None
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
                    FeatureService.update_from_jira_data(db, existing, feature_data)
                else:
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
