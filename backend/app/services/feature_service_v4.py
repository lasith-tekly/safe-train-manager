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
            joinedload(RoadmapFeature.budget_allocations),
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
            joinedload(RoadmapFeature.budget_allocations)
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
    
    def create_jira_record(self, feature_id: str, request: CreateJiraRecordRequest) -> JiraRecord:
        """Create a JIRA record for a feature"""
        jira_record = JiraRecord(
            id=str(uuid.uuid4()),
            feature_id=feature_id,
            jira_key=request.jira_key,
            summary=request.summary,
            team_id=request.team_id,
            status=request.status,
            is_spillover=request.is_spillover,
            spillover_from_quarter=request.spillover_from_quarter,
            spillover_from_year=request.spillover_from_year,
            remarks=request.remarks
        )
        
        self.db.add(jira_record)
        self.db.flush()
        
        # Add quarterly allocations
        if request.quarterly_allocations:
            self._save_jira_allocations(jira_record.id, request.quarterly_allocations)
        
        self.db.commit()
        self.db.refresh(jira_record)
        
        return jira_record
    
    def update_jira_record(self, jira_id: str, request: UpdateJiraRecordRequest) -> JiraRecord:
        """Update a JIRA record"""
        jira_record = self.db.query(JiraRecord).filter(JiraRecord.id == jira_id).first()
        if not jira_record:
            raise ValueError(f"JIRA record {jira_id} not found")
        
        # Update fields
        if request.jira_key is not None:
            jira_record.jira_key = request.jira_key
        if request.summary is not None:
            jira_record.summary = request.summary
        if request.team_id is not None:
            jira_record.team_id = request.team_id
        if request.status is not None:
            jira_record.status = request.status
        if request.is_spillover is not None:
            jira_record.is_spillover = request.is_spillover
        if request.spillover_from_quarter is not None:
            jira_record.spillover_from_quarter = request.spillover_from_quarter
        if request.spillover_from_year is not None:
            jira_record.spillover_from_year = request.spillover_from_year
        if request.remarks is not None:
            jira_record.remarks = request.remarks
        
        # Update quarterly allocations
        if request.quarterly_allocations is not None:
            self.db.query(JiraQuarterlyAllocation).filter(
                JiraQuarterlyAllocation.jira_record_id == jira_id
            ).delete()
            self._save_jira_allocations(jira_id, request.quarterly_allocations)
        
        self.db.commit()
        self.db.refresh(jira_record)
        
        return jira_record
    
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
