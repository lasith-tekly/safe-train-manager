"""
JIRA Record Service - Execution-level tracking for roadmap features
"""
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
import uuid

from app.models.roadmap_v4 import JiraRecord, JiraQuarterlyAllocation, RoadmapFeature
from app.schemas.jira import (
    CreateJiraRecordRequest,
    UpdateJiraRecordRequest,
    UpdateJiraAllocationsRequest,
    JiraRecordResponse
)


class JiraRecordService:
    """Service for managing JIRA records and their quarterly allocations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def list_jira_records_for_feature(self, feature_id: str) -> List[JiraRecord]:
        """Get all JIRA records for a feature"""
        return self.db.query(JiraRecord).filter(
            JiraRecord.feature_id == feature_id
        ).options(
            joinedload(JiraRecord.team),
            joinedload(JiraRecord.quarterly_allocations)
        ).all()
    
    def get_jira_record(self, jira_record_id: str) -> Optional[JiraRecord]:
        """Get a single JIRA record by ID"""
        return self.db.query(JiraRecord).filter(
            JiraRecord.id == jira_record_id
        ).options(
            joinedload(JiraRecord.team),
            joinedload(JiraRecord.quarterly_allocations)
        ).first()
    
    def create_jira_record(
        self, 
        feature_id: str, 
        request: CreateJiraRecordRequest
    ) -> JiraRecord:
        """Create a new JIRA record"""
        # Verify feature exists
        feature = self.db.query(RoadmapFeature).filter(
            RoadmapFeature.id == feature_id
        ).first()
        if not feature:
            raise ValueError(f"Feature {feature_id} not found")
        
        # Create JIRA record
        jira_record = JiraRecord(
            id=str(uuid.uuid4()),
            feature_id=feature_id,
            jira_key=request.jira_key,
            summary=request.summary,
            team_id=request.team_id,
            status=request.status or "planned",
            is_spillover=request.is_spillover or False,
            spillover_from_year=request.spillover_from_year,
            spillover_from_quarter=request.spillover_from_quarter,
            remarks=request.remarks
        )
        
        self.db.add(jira_record)
        self.db.flush()
        
        # Create quarterly allocations
        for alloc_input in request.quarterly_allocations:
            allocation = JiraQuarterlyAllocation(
                id=str(uuid.uuid4()),
                jira_record_id=jira_record.id,
                year=alloc_input.year,
                quarter=alloc_input.quarter,
                allocated_ed=float(alloc_input.allocated_ed)
            )
            self.db.add(allocation)
        
        self.db.commit()
        self.db.refresh(jira_record)
        
        return jira_record
    
    def update_jira_record(
        self, 
        jira_record_id: str, 
        request: UpdateJiraRecordRequest
    ) -> JiraRecord:
        """Update an existing JIRA record"""
        jira_record = self.get_jira_record(jira_record_id)
        if not jira_record:
            raise ValueError(f"JIRA record {jira_record_id} not found")
        
        # Update fields if provided
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
        if request.spillover_from_year is not None:
            jira_record.spillover_from_year = request.spillover_from_year
        if request.spillover_from_quarter is not None:
            jira_record.spillover_from_quarter = request.spillover_from_quarter
        if request.remarks is not None:
            jira_record.remarks = request.remarks
        
        self.db.commit()
        self.db.refresh(jira_record)
        
        return jira_record
    
    def delete_jira_record(self, jira_record_id: str) -> bool:
        """Delete a JIRA record"""
        jira_record = self.get_jira_record(jira_record_id)
        if not jira_record:
            return False
        
        self.db.delete(jira_record)
        self.db.commit()
        
        return True
    
    def update_jira_allocations(
        self, 
        jira_record_id: str, 
        request: UpdateJiraAllocationsRequest
    ) -> JiraRecord:
        """Update quarterly allocations for a JIRA record"""
        jira_record = self.get_jira_record(jira_record_id)
        if not jira_record:
            raise ValueError(f"JIRA record {jira_record_id} not found")
        
        # Delete existing allocations
        self.db.query(JiraQuarterlyAllocation).filter(
            JiraQuarterlyAllocation.jira_record_id == jira_record_id
        ).delete()
        
        # Create new allocations
        for alloc_input in request.allocations:
            allocation = JiraQuarterlyAllocation(
                id=str(uuid.uuid4()),
                jira_record_id=jira_record_id,
                year=alloc_input.year,
                quarter=alloc_input.quarter,
                allocated_ed=float(alloc_input.allocated_ed)
            )
            self.db.add(allocation)
        
        self.db.commit()
        self.db.refresh(jira_record)
        
        return jira_record
    
    def get_jira_allocations_for_team_quarter(
        self, 
        team_id: str, 
        year: int, 
        quarter: int
    ) -> float:
        """Get total JIRA allocations for a team in a specific quarter"""
        result = self.db.query(
            JiraQuarterlyAllocation
        ).join(
            JiraRecord
        ).filter(
            and_(
                JiraRecord.team_id == team_id,
                JiraQuarterlyAllocation.year == year,
                JiraQuarterlyAllocation.quarter == quarter
            )
        ).all()
        
        return sum(alloc.allocated_ed for alloc in result)
    
    def get_jira_allocations_for_feature_quarter(
        self, 
        feature_id: str, 
        year: int, 
        quarter: int
    ) -> float:
        """Get total JIRA allocations for a feature in a specific quarter"""
        result = self.db.query(
            JiraQuarterlyAllocation
        ).join(
            JiraRecord
        ).filter(
            and_(
                JiraRecord.feature_id == feature_id,
                JiraQuarterlyAllocation.year == year,
                JiraQuarterlyAllocation.quarter == quarter
            )
        ).all()
        
        return sum(alloc.allocated_ed for alloc in result)
