"""
JIRA Record Service - PI-Level Execution Planning

Manages JIRA records with team assignment, PI allocation, capacity validation,
and execution vs strategic plan comparison.
"""
from typing import List, Optional, Tuple, Dict
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func
import uuid
from datetime import datetime

from app.models.roadmap_v4 import JiraRecord, JiraQuarterlyAllocation, RoadmapFeature, FeatureQuarterlyAllocation
from app.models.team import Team, TeamCapacity
from app.models.pi import PI
from app.schemas.jira_record import (
    JiraRecordCreate,
    JiraRecordUpdate,
    JiraRecordResponse,
    JiraRecordListResponse,
    SpilloverRequest,
    TeamPIAllocationResponse,
    ExecutionValidationResponse,
    ExecutionValidationWarning,
    QuarterAllocationComparison,
    CapacityWarning
)


class JiraRecordService:
    """Service for managing JIRA records with PI-level execution planning"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_feature_jira_records(
        self,
        feature_id: str,
        status: Optional[str] = None,
        team_id: Optional[str] = None,
        pi_id: Optional[str] = None
    ) -> dict:
        """Get all JIRA records for a feature with filters and summary"""
        query = self.db.query(JiraRecord).filter(
            JiraRecord.feature_id == feature_id
        ).options(
            joinedload(JiraRecord.team),
            joinedload(JiraRecord.pi),
            joinedload(JiraRecord.feature)
        )
        
        if status:
            query = query.filter(JiraRecord.status == status)
        if team_id:
            query = query.filter(JiraRecord.team_id == team_id)
        if pi_id:
            query = query.filter(JiraRecord.pi_id == pi_id)
        
        records = query.all()
        
        # Calculate summary statistics
        summary = {
            "total_planned_effort": float(sum(r.planned_effort or 0 for r in records)),
            "total_actual_effort": float(sum(r.actual_effort or 0 for r in records)),
            "by_status": {},
            "by_pi": {},
            "by_team": {}
        }
        
        for record in records:
            # By status
            summary["by_status"][record.status] = summary["by_status"].get(record.status, 0) + 1
            
            # By PI
            if record.pi:
                pi_name = record.pi.name
                summary["by_pi"][pi_name] = summary["by_pi"].get(pi_name, 0) + float(record.planned_effort or 0)
            
            # By team
            if record.team:
                team_name = record.team.name
                summary["by_team"][team_name] = summary["by_team"].get(team_name, 0) + float(record.planned_effort or 0)
        
        # Build response objects as dicts
        data = [self._build_jira_record_response(r) for r in records]
        
        return {
            "data": data,
            "total": len(records),
            "summary": summary
        }
    
    def get_jira_record(self, record_id: str) -> Optional[dict]:
        """Get a single JIRA record by ID"""
        record = self.db.query(JiraRecord).filter(
            JiraRecord.id == record_id
        ).options(
            joinedload(JiraRecord.team),
            joinedload(JiraRecord.pi),
            joinedload(JiraRecord.feature),
            joinedload(JiraRecord.spillover_from_pi)
        ).first()
        
        if not record:
            return None
        
        return self._build_jira_record_response(record)
    
    def create_jira_record(
        self,
        feature_id: str,
        data: JiraRecordCreate
    ) -> Tuple[JiraRecordResponse, Optional[CapacityWarning]]:
        """Create a new JIRA record with capacity validation"""
        # Verify feature exists
        feature = self.db.query(RoadmapFeature).filter(
            RoadmapFeature.id == feature_id
        ).first()
        if not feature:
            raise ValueError(f"Feature {feature_id} not found")
        
        # Verify team exists if provided
        if data.team_id:
            team = self.db.query(Team).filter(Team.id == data.team_id).first()
            if not team:
                raise ValueError(f"Team {data.team_id} not found")
        
        # Verify PI exists if provided
        if data.pi_id:
            pi = self.db.query(PI).filter(PI.id == data.pi_id).first()
            if not pi:
                raise ValueError(f"PI {data.pi_id} not found")
        
        # Check for duplicate jira_key
        if data.jira_key:
            existing = self.db.query(JiraRecord).filter(
                JiraRecord.jira_key == data.jira_key
            ).first()
            if existing:
                raise ValueError(f"JIRA key {data.jira_key} already exists")
        
        # Create JIRA record
        record = JiraRecord(
            id=str(uuid.uuid4()),
            feature_id=feature_id,
            jira_key=data.jira_key,
            title=data.title,
            description=data.description,
            team_id=data.team_id,
            pi_id=data.pi_id,
            planned_effort=data.planned_effort,
            status=data.status
        )
        
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        
        # Check capacity and generate warning if needed
        capacity_warning = None
        if data.team_id and data.pi_id:
            capacity_warning = self.calculate_capacity_warning(
                data.team_id,
                data.pi_id,
                data.planned_effort
            )
        
        response = self._build_jira_record_response(record)
        return response, capacity_warning
    
    def update_jira_record(
        self,
        record_id: str,
        data: JiraRecordUpdate
    ) -> dict:
        """Update an existing JIRA record"""
        record = self.db.query(JiraRecord).filter(
            JiraRecord.id == record_id
        ).first()
        
        if not record:
            raise ValueError(f"JIRA record {record_id} not found")
        
        # Check for duplicate jira_key if changing
        if data.jira_key and data.jira_key != record.jira_key:
            existing = self.db.query(JiraRecord).filter(
                JiraRecord.jira_key == data.jira_key,
                JiraRecord.id != record_id
            ).first()
            if existing:
                raise ValueError(f"JIRA key {data.jira_key} already exists")
        
        # Update fields if provided
        if data.jira_key is not None:
            record.jira_key = data.jira_key
        if data.title is not None:
            record.title = data.title
        if data.description is not None:
            record.description = data.description
        if data.team_id is not None:
            record.team_id = data.team_id
        if data.pi_id is not None:
            record.pi_id = data.pi_id
        if data.planned_effort is not None:
            record.planned_effort = data.planned_effort
        if data.actual_effort is not None:
            record.actual_effort = data.actual_effort
        if data.status is not None:
            record.status = data.status
        if data.spillover_from_pi_id is not None:
            record.spillover_from_pi_id = data.spillover_from_pi_id
        if data.spillover_reason is not None:
            record.spillover_reason = data.spillover_reason
        
        record.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(record)
        
        return self._build_jira_record_response(record)
    
    def delete_jira_record(self, record_id: str) -> bool:
        """Delete a JIRA record"""
        record = self.db.query(JiraRecord).filter(
            JiraRecord.id == record_id
        ).first()
        
        if not record:
            return False
        
        self.db.delete(record)
        self.db.commit()
        
        return True
    
    def mark_as_spillover(
        self,
        record_id: str,
        data: SpilloverRequest
    ) -> dict:
        """Mark a JIRA record as spillover and move to new PI"""
        record = self.db.query(JiraRecord).filter(
            JiraRecord.id == record_id
        ).first()
        
        if not record:
            raise ValueError(f"JIRA record {record_id} not found")
        
        # Verify new PI exists
        new_pi = self.db.query(PI).filter(PI.id == data.new_pi_id).first()
        if not new_pi:
            raise ValueError(f"PI {data.new_pi_id} not found")
        
        # Set spillover fields
        record.spillover_from_pi_id = record.pi_id
        record.pi_id = data.new_pi_id
        record.status = "SPILLOVER"
        record.spillover_reason = data.reason
        record.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(record)
        
        return self._build_jira_record_response(record)
    
    def get_team_pi_allocation(
        self,
        team_id: str,
        pi_id: str
    ) -> TeamPIAllocationResponse:
        """Get team's allocation summary for a specific PI"""
        # Get team
        team = self.db.query(Team).filter(Team.id == team_id).first()
        if not team:
            raise ValueError(f"Team {team_id} not found")
        
        # Get PI
        pi = self.db.query(PI).filter(PI.id == pi_id).first()
        if not pi:
            raise ValueError(f"PI {pi_id} not found")
        
        # Calculate team capacity for this PI
        total_capacity_ed = self._get_team_pi_capacity(team_id, pi_id)
        
        # Sum all JIRA records assigned to this team for this PI
        allocated_effort_ed = self.db.query(
            func.sum(JiraRecord.planned_effort)
        ).filter(
            JiraRecord.team_id == team_id,
            JiraRecord.pi_id == pi_id
        ).scalar() or 0.0
        
        available_effort_ed = total_capacity_ed - allocated_effort_ed
        utilization_percent = (allocated_effort_ed / total_capacity_ed * 100) if total_capacity_ed > 0 else 0
        is_over_allocated = allocated_effort_ed > total_capacity_ed
        
        # Get all JIRA records for this team/PI
        records = self.db.query(JiraRecord).filter(
            JiraRecord.team_id == team_id,
            JiraRecord.pi_id == pi_id
        ).options(
            joinedload(JiraRecord.feature),
            joinedload(JiraRecord.pi)
        ).all()
        
        jira_records = [self._build_jira_record_response(r) for r in records]
        
        return TeamPIAllocationResponse(
            team_id=team_id,
            team_name=team.name,
            pi_id=pi_id,
            pi_name=pi.name,
            total_capacity_ed=total_capacity_ed,
            allocated_effort_ed=allocated_effort_ed,
            available_effort_ed=available_effort_ed,
            utilization_percent=utilization_percent,
            is_over_allocated=is_over_allocated,
            jira_records=jira_records
        )
    
    def validate_execution_plan(
        self,
        feature_id: str
    ) -> ExecutionValidationResponse:
        """Validate execution plan against strategic roadmap allocations"""
        # Get feature
        feature = self.db.query(RoadmapFeature).filter(
            RoadmapFeature.id == feature_id
        ).first()
        if not feature:
            raise ValueError(f"Feature {feature_id} not found")
        
        # Get strategic allocations (quarterly)
        strategic_allocations = self.db.query(FeatureQuarterlyAllocation).filter(
            FeatureQuarterlyAllocation.feature_id == feature_id
        ).all()
        
        strategic_by_quarter = {}
        for alloc in strategic_allocations:
            key = (alloc.year, alloc.quarter)
            strategic_by_quarter[key] = alloc.allocated_ed
        
        # Get execution allocations (JIRA records by PI → Quarter)
        jira_records = self.db.query(JiraRecord).filter(
            JiraRecord.feature_id == feature_id
        ).options(joinedload(JiraRecord.pi)).all()
        
        execution_by_quarter = {}
        for record in jira_records:
            if record.pi:
                year, quarter = self._pi_to_quarter(record.pi.name)
                key = (year, quarter)
                execution_by_quarter[key] = execution_by_quarter.get(key, 0) + record.planned_effort
        
        # Compare and generate warnings
        warnings = []
        quarterly_comparisons = []
        
        # Check all strategic quarters
        all_quarters = set(strategic_by_quarter.keys()) | set(execution_by_quarter.keys())
        
        for year, quarter in sorted(all_quarters):
            strategic_ed = strategic_by_quarter.get((year, quarter), 0)
            execution_ed = execution_by_quarter.get((year, quarter), 0)
            difference_ed = strategic_ed - execution_ed
            
            is_matched = abs(difference_ed) < 0.1  # Tolerance
            
            quarterly_comparisons.append(QuarterAllocationComparison(
                year=year,
                quarter=quarter,
                strategic_allocation_ed=strategic_ed,
                execution_allocation_ed=execution_ed,
                difference_ed=difference_ed,
                is_matched=is_matched
            ))
            
            if not is_matched:
                if difference_ed > 0:
                    message = f"Q{quarter} {year}: Under-allocated - Execution ({execution_ed} eD) is less than strategic ({strategic_ed} eD)"
                else:
                    message = f"Q{quarter} {year}: Over-allocated - Execution ({execution_ed} eD) exceeds strategic ({strategic_ed} eD)"
                
                warnings.append(ExecutionValidationWarning(
                    level="warning",
                    message=message,
                    details={
                        "year": year,
                        "quarter": quarter,
                        "strategic": strategic_ed,
                        "execution": execution_ed,
                        "difference": difference_ed
                    }
                ))
        
        total_strategic_ed = sum(strategic_by_quarter.values())
        total_execution_ed = sum(execution_by_quarter.values())
        total_difference_ed = total_strategic_ed - total_execution_ed
        
        is_valid = len(warnings) == 0
        
        return ExecutionValidationResponse(
            feature_id=feature_id,
            feature_name=feature.name,
            is_valid=is_valid,
            warnings=warnings,
            quarterly_comparisons=quarterly_comparisons,
            total_strategic_ed=total_strategic_ed,
            total_execution_ed=total_execution_ed,
            total_difference_ed=total_difference_ed
        )
    
    def calculate_capacity_warning(
        self,
        team_id: str,
        pi_id: str,
        new_effort: float
    ) -> Optional[CapacityWarning]:
        """Calculate if adding new effort will exceed capacity"""
        team = self.db.query(Team).filter(Team.id == team_id).first()
        pi = self.db.query(PI).filter(PI.id == pi_id).first()
        
        if not team or not pi:
            return None
        
        capacity_ed = self._get_team_pi_capacity(team_id, pi_id)
        current_allocation_ed = self.db.query(
            func.sum(JiraRecord.planned_effort)
        ).filter(
            JiraRecord.team_id == team_id,
            JiraRecord.pi_id == pi_id
        ).scalar() or 0.0
        
        total_allocation_ed = current_allocation_ed + new_effort
        
        if total_allocation_ed > capacity_ed:
            over_allocation_ed = total_allocation_ed - capacity_ed
            return CapacityWarning(
                team_id=team_id,
                team_name=team.name,
                pi_id=pi_id,
                pi_name=pi.name,
                capacity_ed=capacity_ed,
                current_allocation_ed=current_allocation_ed,
                new_allocation_ed=new_effort,
                total_allocation_ed=total_allocation_ed,
                over_allocation_ed=over_allocation_ed,
                message=f"Team {team.name} will be over-allocated by {over_allocation_ed:.1f} eD in {pi.name}"
            )
        
        return None
    
    def _get_team_pi_capacity(self, team_id: str, pi_id: str) -> float:
        """Calculate team's total capacity for a PI in eD"""
        # Get PI to determine quarter
        pi = self.db.query(PI).filter(PI.id == pi_id).first()
        if not pi:
            return 0.0
        
        year, quarter = self._pi_to_quarter(pi.name)
        
        # Get team capacity for that quarter
        capacity = self.db.query(TeamCapacity).filter(
            TeamCapacity.team_id == team_id,
            TeamCapacity.year == year
        ).first()
        
        if not capacity:
            return 0.0
        
        # Get capacity for the specific quarter
        quarter_capacity = {
            1: capacity.q1_capacity,
            2: capacity.q2_capacity,
            3: capacity.q3_capacity,
            4: capacity.q4_capacity
        }.get(quarter, 0)
        
        return float(quarter_capacity)
    
    def _pi_to_quarter(self, pi_name: str) -> Tuple[int, int]:
        """Convert PI name to (year, quarter)"""
        # PI 2026.1 → (2026, 1)
        # PI 2026.2 → (2026, 2)
        parts = pi_name.replace("PI ", "").split(".")
        year = int(parts[0])
        quarter = int(parts[1])
        return (year, quarter)
    
    def _build_jira_record_response(self, record: JiraRecord) -> dict:
        """Build JIRA record response with related data"""
        return {
            "id": record.id,
            "jira_key": record.jira_key,
            "title": record.title or "Untitled",
            "description": record.description,
            "feature_id": record.feature_id,
            "feature_name": record.feature.name if record.feature else None,
            "team_id": record.team_id,
            "team_name": record.team.name if record.team else None,
            "pi_id": record.pi_id,
            "pi_name": record.pi.name if record.pi else None,
            "planned_effort": float(record.planned_effort) if record.planned_effort else 0.0,
            "actual_effort": float(record.actual_effort) if record.actual_effort else None,
            "status": record.status or "PLANNED",
            "spillover_from_pi_id": record.spillover_from_pi_id,
            "spillover_from_pi_name": record.spillover_from_pi.name if record.spillover_from_pi else None,
            "spillover_reason": record.spillover_reason,
            "created_at": record.created_at,
            "updated_at": record.updated_at
        }
