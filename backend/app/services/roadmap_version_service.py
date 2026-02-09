"""
Roadmap Version Service

Business logic for roadmap version management.
Handles version creation, publishing, and feature copying.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from typing import List, Optional
from datetime import datetime
import uuid

from app.models.roadmap_version import RoadmapVersion
from app.models.roadmap_v4 import RoadmapFeature, FeatureQuarterlyAllocation, FeatureTeam
from app.models.feature_budget_allocation import FeatureBudgetLineAllocation
from app.schemas.roadmap_version import RoadmapVersionCreate, RoadmapVersionUpdate, VersionStatus


class RoadmapVersionService:
    """Service for managing roadmap versions"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def list_versions(self, product_id: str) -> List[RoadmapVersion]:
        """
        List all roadmap versions for a product, newest first.
        Includes feature count for each version.
        """
        versions = self.db.query(RoadmapVersion).filter(
            RoadmapVersion.product_id == product_id
        ).order_by(RoadmapVersion.created_at.desc()).all()
        
        # Add feature count to each version
        for version in versions:
            feature_count = self.db.query(func.count(RoadmapFeature.id)).filter(
                RoadmapFeature.version_id == version.id
            ).scalar()
            version.feature_count = feature_count or 0
        
        return versions
    
    def get_version(self, version_id: str, product_id: Optional[str] = None) -> RoadmapVersion:
        """
        Get a specific version by ID.
        Optionally validate it belongs to the specified product.
        """
        query = self.db.query(RoadmapVersion).filter(RoadmapVersion.id == version_id)
        
        if product_id:
            query = query.filter(RoadmapVersion.product_id == product_id)
        
        version = query.first()
        
        if not version:
            raise HTTPException(status_code=404, detail="Version not found")
        
        # Add feature count
        feature_count = self.db.query(func.count(RoadmapFeature.id)).filter(
            RoadmapFeature.version_id == version.id
        ).scalar()
        version.feature_count = feature_count or 0
        
        return version
    
    def create_version(
        self, 
        product_id: str, 
        data: RoadmapVersionCreate, 
        created_by: Optional[str] = None
    ) -> RoadmapVersion:
        """
        Create a new roadmap version.
        
        Business Rules:
        1. Only one DRAFT version allowed per product
        2. If copy_from_version_id provided, copies all features
        3. Version name defaults to current date if not provided
        """
        # Check for existing draft version
        existing_draft = self.db.query(RoadmapVersion).filter(
            RoadmapVersion.product_id == product_id,
            RoadmapVersion.status == VersionStatus.DRAFT
        ).first()
        
        if existing_draft:
            raise HTTPException(
                status_code=400, 
                detail=f"A draft version already exists: {existing_draft.version_name}. Publish or delete it first."
            )
        
        # Create new version
        version = RoadmapVersion(
            id=str(uuid.uuid4()),
            product_id=product_id,
            version_name=data.version_name or datetime.now().strftime("%Y-%m-%d"),
            description=data.description,
            status=VersionStatus.DRAFT,
            created_by=created_by
        )
        
        self.db.add(version)
        self.db.flush()
        
        # Copy features if source version provided
        if data.copy_from_version_id:
            self._copy_features(data.copy_from_version_id, version.id)
        
        self.db.commit()
        self.db.refresh(version)
        
        # Add feature count
        version.feature_count = 0 if not data.copy_from_version_id else self._get_feature_count(version.id)
        
        return version
    
    def update_version(self, version_id: str, data: RoadmapVersionUpdate) -> RoadmapVersion:
        """
        Update a roadmap version.
        Only description can be updated, and only for DRAFT versions.
        """
        version = self.get_version(version_id)
        
        if version.status != VersionStatus.DRAFT:
            raise HTTPException(
                status_code=400,
                detail="Only DRAFT versions can be updated. Published versions are read-only."
            )
        
        if data.description is not None:
            version.description = data.description
        
        self.db.commit()
        self.db.refresh(version)
        
        # Add feature count
        version.feature_count = self._get_feature_count(version.id)
        
        return version
    
    def publish_version(self, version_id: str, published_by: Optional[str] = None) -> RoadmapVersion:
        """
        Publish a version - locks it from further edits.
        Sets status to PUBLISHED and published_at timestamp.
        """
        version = self.get_version(version_id)
        
        if version.status == VersionStatus.PUBLISHED:
            raise HTTPException(
                status_code=400,
                detail="Version is already published"
            )
        
        version.status = VersionStatus.PUBLISHED
        version.published_at = datetime.utcnow()
        
        if published_by:
            version.created_by = published_by  # Store who published it
        
        self.db.commit()
        self.db.refresh(version)
        
        # Add feature count
        version.feature_count = self._get_feature_count(version.id)
        
        return version
    
    def delete_version(self, version_id: str) -> bool:
        """
        Delete a version.
        Only DRAFT versions can be deleted.
        Cascade deletes all features in the version.
        """
        version = self.get_version(version_id)
        
        if version.status == VersionStatus.PUBLISHED:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete published versions"
            )
        
        self.db.delete(version)
        self.db.commit()
        
        return True
    
    def get_version_features(self, version_id: str) -> List[RoadmapFeature]:
        """Get all features for a specific version"""
        return self.db.query(RoadmapFeature).filter(
            RoadmapFeature.version_id == version_id
        ).all()
    
    def _copy_features(self, source_version_id: str, target_version_id: str):
        """
        Deep copy all features from source version to target version.
        Copies:
        - Feature details
        - Quarterly allocations
        - Budget line allocations
        - Team assignments
        """
        source_features = self.db.query(RoadmapFeature).filter(
            RoadmapFeature.version_id == source_version_id
        ).all()
        
        for source_feature in source_features:
            # Create new feature with copied data
            new_feature = RoadmapFeature(
                id=str(uuid.uuid4()),
                version_id=target_version_id,
                product_id=source_feature.product_id,
                name=source_feature.name,
                customer=source_feature.customer,
                priority=source_feature.priority,
                status=source_feature.status,
                remarks=source_feature.remarks,
                gross_sizing_ed=source_feature.gross_sizing_ed,
                net_sizing_ed=source_feature.net_sizing_ed,
                total_cost_keur=source_feature.total_cost_keur,
                created_by=source_feature.created_by
            )
            
            self.db.add(new_feature)
            self.db.flush()
            
            # Copy quarterly allocations
            for qa in source_feature.quarterly_allocations:
                new_qa = FeatureQuarterlyAllocation(
                    id=str(uuid.uuid4()),
                    feature_id=new_feature.id,
                    year=qa.year,
                    quarter=qa.quarter,
                    allocated_ed=qa.allocated_ed
                )
                self.db.add(new_qa)
            
            # Copy budget line allocations
            for alloc in source_feature.budget_allocations:
                new_alloc = FeatureBudgetLineAllocation(
                    id=str(uuid.uuid4()),
                    feature_id=new_feature.id,
                    budget_line_id=alloc.budget_line_id,
                    category_id=alloc.category_id,
                    allocation_percentage=alloc.allocation_percentage,
                    allocated_effort_days=alloc.allocated_effort_days
                )
                self.db.add(new_alloc)
            
            # Copy team assignments
            for team_assignment in self.db.query(FeatureTeam).filter(
                FeatureTeam.feature_id == source_feature.id
            ).all():
                new_team_assignment = FeatureTeam(
                    id=str(uuid.uuid4()),
                    feature_id=new_feature.id,
                    team_id=team_assignment.team_id
                )
                self.db.add(new_team_assignment)
    
    def _get_feature_count(self, version_id: str) -> int:
        """Get count of features in a version"""
        return self.db.query(func.count(RoadmapFeature.id)).filter(
            RoadmapFeature.version_id == version_id
        ).scalar() or 0
