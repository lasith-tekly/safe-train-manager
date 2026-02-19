"""
Feature Service V4 - Feature Management

CRUD operations and business logic for roadmap features
"""
from typing import List, Optional, Dict
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
import uuid

from app.models.roadmap_v4 import (
    RoadmapFeature, FeatureTeam, FeatureQuarterlyAllocation,
    JiraRecord, JiraQuarterlyAllocation
)
from app.models.feature_budget_allocation import FeatureBudgetLineAllocation
from app.models.team import Team
from app.schemas.roadmap_v4 import (
    CreateFeatureRequest, UpdateFeatureRequest,
    CreateJiraRecordRequest, UpdateJiraRecordRequest
)
from app.services.calculation_service import CalculationService
from app.services.validation_service_v4 import ValidationServiceV4


class FeatureServiceV4:
    """Service for managing roadmap features"""
    
    def __init__(self, db: Session):
        self.db = db
        self.calc_service = CalculationService(db)
        self.validation_service = ValidationServiceV4(db)
    
    def create_feature(self, request: CreateFeatureRequest, created_by: Optional[str] = None) -> RoadmapFeature:
        """Create a new feature with calculations and budget allocations"""
        # Calculate net sizing and cost
        sizing = self.calc_service.calculate_sizing(request.gross_sizing_ed)
        
        # Create feature
        feature = RoadmapFeature(
            id=str(uuid.uuid4()),
            product_id=request.product_id,
            name=request.name,
            customer=request.customer,
            priority=request.priority,
            gross_sizing_ed=float(sizing['gross_sizing_ed']),
            net_sizing_ed=float(sizing['net_sizing_ed']),
            total_cost_keur=float(sizing['total_cost_keur']),
            remarks=request.remarks,
            created_by=created_by
        )
        
        self.db.add(feature)
        self.db.flush()
        
        # Create budget line allocations
        for alloc_input in request.budget_allocations:
            allocated_effort = float(request.gross_sizing_ed) * (float(alloc_input.allocation_percentage) / 100)
            allocation = FeatureBudgetLineAllocation(
                id=str(uuid.uuid4()),
                feature_id=feature.id,
                budget_line_id=alloc_input.budget_line_id,
                category_id=alloc_input.category_id,
                allocation_percentage=float(alloc_input.allocation_percentage),
                allocated_effort_days=allocated_effort
            )
            self.db.add(allocation)
        
        # Add team assignments
        if request.team_ids:
            self._assign_teams(feature.id, request.team_ids)
        
        # Add quarterly allocations
        if request.quarterly_allocations:
            self._save_quarterly_allocations(feature.id, request.quarterly_allocations)
        
        self.db.commit()
        self.db.refresh(feature)
        
        return feature
    
    def update_feature(self, feature_id: str, request: UpdateFeatureRequest) -> RoadmapFeature:
        """Update an existing feature"""
        feature = self.db.query(RoadmapFeature).filter(RoadmapFeature.id == feature_id).first()
        if not feature:
            raise ValueError(f"Feature {feature_id} not found")
        
        # Check if version is published (read-only)
        if feature.roadmap_version and feature.roadmap_version.status == "PUBLISHED":
            raise ValueError("Cannot edit features in a published version. Create a new version to make changes.")
        
        # Update basic fields
        if request.name is not None:
            feature.name = request.name
        if request.customer is not None:
            feature.customer = request.customer
        if request.priority is not None:
            feature.priority = request.priority
        if request.remarks is not None:
            feature.remarks = request.remarks
        if request.status is not None:
            feature.status = request.status
        
        # Recalculate if gross sizing changed
        if request.gross_sizing_ed is not None:
            sizing = self.calc_service.calculate_sizing(request.gross_sizing_ed)
            feature.gross_sizing_ed = float(sizing['gross_sizing_ed'])
            feature.net_sizing_ed = float(sizing['net_sizing_ed'])
            feature.total_cost_keur = float(sizing['total_cost_keur'])
            
            # Recalculate budget allocations if gross sizing changed
            for allocation in feature.budget_allocations:
                allocation.allocated_effort_days = feature.gross_sizing_ed * (float(allocation.allocation_percentage) / 100)
        
        # Update budget allocations
        if request.budget_allocations is not None:
            # Remove existing allocations
            self.db.query(FeatureBudgetLineAllocation).filter(
                FeatureBudgetLineAllocation.feature_id == feature_id
            ).delete()
            # Add new allocations
            for alloc_input in request.budget_allocations:
                allocated_effort = feature.gross_sizing_ed * (float(alloc_input.allocation_percentage) / 100)
                allocation = FeatureBudgetLineAllocation(
                    id=str(uuid.uuid4()),
                    feature_id=feature_id,
                    budget_line_id=alloc_input.budget_line_id,
                    category_id=alloc_input.category_id,
                    allocation_percentage=float(alloc_input.allocation_percentage),
                    allocated_effort_days=allocated_effort
                )
                self.db.add(allocation)
        
        # Update team assignments
        if request.team_ids is not None:
            # Remove existing assignments
            self.db.query(FeatureTeam).filter(FeatureTeam.feature_id == feature_id).delete()
            # Add new assignments
            self._assign_teams(feature_id, request.team_ids)
        
        # Update quarterly allocations
        if request.quarterly_allocations is not None:
            # Remove existing allocations
            self.db.query(FeatureQuarterlyAllocation).filter(
                FeatureQuarterlyAllocation.feature_id == feature_id
            ).delete()
            # Add new allocations
            self._save_quarterly_allocations(feature_id, request.quarterly_allocations)
        
        self.db.commit()
        self.db.refresh(feature)
        
        return feature
    
    def get_feature(self, feature_id: str, include_jira: bool = True) -> Optional[RoadmapFeature]:
        """Get a single feature with all relationships"""
        query = self.db.query(RoadmapFeature).options(
            joinedload(RoadmapFeature.teams),
            joinedload(RoadmapFeature.quarterly_allocations),
            joinedload(RoadmapFeature.budget_allocations).joinedload(FeatureBudgetLineAllocation.budget_line),
            joinedload(RoadmapFeature.product)
        )
        
        if include_jira:
            query = query.options(
                joinedload(RoadmapFeature.jira_records).joinedload(JiraRecord.team),
                joinedload(RoadmapFeature.jira_records).joinedload(JiraRecord.quarterly_allocations)
            )
        
        return query.filter(RoadmapFeature.id == feature_id).first()
    
    def list_features(
        self,
        product_id: Optional[str] = None,
        budget_line_id: Optional[str] = None,
        year: Optional[int] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 50
    ) -> Dict:
        """List features with filters and pagination"""
        query = self.db.query(RoadmapFeature).options(
            joinedload(RoadmapFeature.teams),
            joinedload(RoadmapFeature.quarterly_allocations),
            joinedload(RoadmapFeature.budget_allocations).joinedload(FeatureBudgetLineAllocation.budget_line)
        )
        
        # Apply filters
        if product_id:
            query = query.filter(RoadmapFeature.product_id == product_id)
        if budget_line_id:
            # Filter by budget line allocation
            query = query.join(FeatureBudgetLineAllocation).filter(
                FeatureBudgetLineAllocation.budget_line_id == budget_line_id
            ).distinct()
        if status:
            query = query.filter(RoadmapFeature.status == status)
        if year:
            query = query.join(FeatureQuarterlyAllocation).filter(
                FeatureQuarterlyAllocation.year == year
            ).distinct()
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        features = query.order_by(RoadmapFeature.priority, RoadmapFeature.created_at).offset(offset).limit(page_size).all()
        
        return {
            'data': features,
            'total': total,
            'page': page,
            'page_size': page_size
        }
    
    def delete_feature(self, feature_id: str) -> bool:
        """Delete a feature (cascade deletes teams, allocations, JIRA records)"""
        feature = self.db.query(RoadmapFeature).filter(RoadmapFeature.id == feature_id).first()
        if not feature:
            return False
        
        # Check if version is published (read-only)
        if feature.roadmap_version and feature.roadmap_version.status == "PUBLISHED":
            raise ValueError("Cannot delete features in a published version. Create a new version to make changes.")
        
        self.db.delete(feature)
        self.db.commit()
        
        return True
    
    def _assign_teams(self, feature_id: str, team_ids: List[str]):
        """Assign teams to a feature"""
        for team_id in team_ids:
            assignment = FeatureTeam(
                id=str(uuid.uuid4()),
                feature_id=feature_id,
                team_id=team_id
            )
            self.db.add(assignment)
    
    def _save_quarterly_allocations(self, feature_id: str, allocations: List):
        """Save quarterly allocations for a feature"""
        for alloc in allocations:
            allocation = FeatureQuarterlyAllocation(
                id=str(uuid.uuid4()),
                feature_id=feature_id,
                year=alloc.year,
                quarter=alloc.quarter,
                allocated_ed=float(alloc.allocated_ed)
            )
            self.db.add(allocation)
    
    # JIRA Record Methods
    
    def create_jira_record(self, feature_id: str, request: CreateJiraRecordRequest) -> dict:
        """Create a JIRA record for a feature"""
        # Fetch parent feature to inherit version_id if not provided
        feature = self.db.query(RoadmapFeature).filter(
            RoadmapFeature.id == feature_id
        ).first()
        if not feature:
            raise ValueError(f"Feature {feature_id} not found")
        
        # Inherit version_id from feature if not provided in request
        version_id = request.version_id if request.version_id else feature.version_id
        
        print(f"DEBUG: Creating JIRA record - feature={feature_id}, version_id={version_id}")
        
        if not version_id:
            raise ValueError(f"Feature {feature_id} has no version_id - cannot create JIRA record")
        
        # Get title from new field or fall back to old field
        title = request.title if request.title else (request.summary if request.summary else '')
        
        # Get description from new field or fall back to old field
        description = request.description if request.description else request.remarks
        
        jira_record = JiraRecord(
            id=str(uuid.uuid4()),
            feature_id=feature_id,
            version_id=version_id,  # Use inherited or provided version_id
            jira_key=request.jira_key,
            title=title,
            description=description,
            team_id=request.team_id,
            pi_id=request.pi_id,
            planned_effort=request.planned_effort,
            status=request.status
        )
        
        self.db.add(jira_record)
        self.db.flush()
        
        # Add quarterly allocations
        if request.quarterly_allocations:
            self._save_jira_allocations(jira_record.id, request.quarterly_allocations)
        
        self.db.commit()
        self.db.refresh(jira_record)
        
        # Convert to dict with proper serialization of relationships
        return {
            "id": jira_record.id,
            "feature_id": jira_record.feature_id,
            "jira_key": jira_record.jira_key,
            "title": jira_record.title or "Untitled",
            "description": jira_record.description,
            "team_id": jira_record.team_id,
            "team": {"id": jira_record.team.id, "name": jira_record.team.name} if jira_record.team else None,
            "pi_id": jira_record.pi_id,
            "pi": {"id": str(jira_record.pi.id), "name": jira_record.pi.name, "year": jira_record.pi.year} if jira_record.pi else None,
            "planned_effort": float(jira_record.planned_effort) if jira_record.planned_effort else 0.0,
            "actual_effort": float(jira_record.actual_effort) if jira_record.actual_effort else None,
            "status": jira_record.status or "PLANNED",
            "spillover_from_pi_id": jira_record.spillover_from_pi_id,
            "spillover_reason": jira_record.spillover_reason,
            "created_at": jira_record.created_at,
            "updated_at": jira_record.updated_at,
            # Legacy fields for backward compatibility
            "summary": jira_record.title,
            "remarks": jira_record.description,
            "is_spillover": jira_record.status == "SPILLOVER",
            "spillover_from_quarter": None,
            "spillover_from_year": None,
            "quarterly_allocations": []
        }
    
    def update_jira_record(self, jira_id: str, request: UpdateJiraRecordRequest) -> JiraRecord:
        """Update a JIRA record"""
        jira_record = self.db.query(JiraRecord).filter(JiraRecord.id == jira_id).first()
        if not jira_record:
            raise ValueError(f"JIRA record {jira_id} not found")
        
        # Update fields - support both old and new field names
        if request.jira_key is not None:
            jira_record.jira_key = request.jira_key
        
        # Handle title/summary
        if hasattr(request, 'title') and request.title is not None:
            jira_record.title = request.title
        elif hasattr(request, 'summary') and request.summary is not None:
            jira_record.title = request.summary
        
        # Handle description/remarks
        if hasattr(request, 'description') and request.description is not None:
            jira_record.description = request.description
        elif hasattr(request, 'remarks') and request.remarks is not None:
            jira_record.description = request.remarks
        
        if request.team_id is not None:
            jira_record.team_id = request.team_id
        if request.status is not None:
            jira_record.status = request.status
        
        # Handle new PI-based fields
        if hasattr(request, 'pi_id') and request.pi_id is not None:
            jira_record.pi_id = request.pi_id
        if hasattr(request, 'planned_effort') and request.planned_effort is not None:
            jira_record.planned_effort = request.planned_effort
        if hasattr(request, 'actual_effort') and request.actual_effort is not None:
            jira_record.actual_effort = request.actual_effort
        if hasattr(request, 'spillover_from_pi_id') and request.spillover_from_pi_id is not None:
            jira_record.spillover_from_pi_id = request.spillover_from_pi_id
        if hasattr(request, 'spillover_reason') and request.spillover_reason is not None:
            jira_record.spillover_reason = request.spillover_reason
        
        # Update quarterly allocations
        if request.quarterly_allocations is not None:
            self.db.query(JiraQuarterlyAllocation).filter(
                JiraQuarterlyAllocation.jira_record_id == jira_id
            ).delete()
            self._save_jira_allocations(jira_id, request.quarterly_allocations)
        
        self.db.commit()
        self.db.refresh(jira_record)
        
        # Convert to dict with proper serialization of relationships
        return {
            "id": jira_record.id,
            "feature_id": jira_record.feature_id,
            "jira_key": jira_record.jira_key,
            "title": jira_record.title or "Untitled",
            "description": jira_record.description,
            "team_id": jira_record.team_id,
            "team": {"id": jira_record.team.id, "name": jira_record.team.name} if jira_record.team else None,
            "pi_id": jira_record.pi_id,
            "pi": {"id": str(jira_record.pi.id), "name": jira_record.pi.name, "year": jira_record.pi.year} if jira_record.pi else None,
            "planned_effort": float(jira_record.planned_effort) if jira_record.planned_effort else 0.0,
            "actual_effort": float(jira_record.actual_effort) if jira_record.actual_effort else None,
            "status": jira_record.status or "PLANNED",
            "spillover_from_pi_id": jira_record.spillover_from_pi_id,
            "spillover_reason": jira_record.spillover_reason,
            "created_at": jira_record.created_at,
            "updated_at": jira_record.updated_at,
            # Legacy fields for backward compatibility
            "summary": jira_record.title,
            "remarks": jira_record.description,
            "is_spillover": jira_record.status == "SPILLOVER",
            "spillover_from_quarter": None,
            "spillover_from_year": None,
            "quarterly_allocations": []
        }
    
    def delete_jira_record(self, jira_id: str) -> bool:
        """Delete a JIRA record"""
        jira_record = self.db.query(JiraRecord).filter(JiraRecord.id == jira_id).first()
        if not jira_record:
            return False
        
        self.db.delete(jira_record)
        self.db.commit()
        
        return True
    
    def _save_jira_allocations(self, jira_record_id: str, allocations: List):
        """Save quarterly allocations for a JIRA record"""
        for alloc in allocations:
            allocation = JiraQuarterlyAllocation(
                id=str(uuid.uuid4()),
                jira_record_id=jira_record_id,
                year=alloc.year,
                quarter=alloc.quarter,
                allocated_ed=float(alloc.allocated_ed)
            )
            self.db.add(allocation)
