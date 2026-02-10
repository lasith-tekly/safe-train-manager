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
    MarkSpilloverRequest,
    TeamPIAllocationResponse,
    ExecutionValidationResponse,
    ExecutionValidationWarning,
    QuarterAllocationComparison,
    CapacityWarning
)
from fastapi import HTTPException


class JiraRecordService:
    """Service for managing JIRA records with PI-level execution planning"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def mark_as_spillover(
        self,
        record_id: str,
        new_pi_id: str,
        spillover_from_pi_id: str,
        spillover_reason: str,
        spillover_category: str,
        spillover_effort: Optional[float] = None,
        completed_effort: float = 0
    ) -> dict:
        """
        Mark a JIRA record as spillover from a previous PI with effort tracking.
        
        Args:
            record_id: UUID of the JIRA record
            new_pi_id: Target PI ID where work will be completed
            spillover_from_pi_id: Original PI ID where work was planned
            spillover_reason: Reason for spillover (10-500 chars)
            spillover_category: Category of spillover
            spillover_effort: Effort spilling over (defaults to planned_effort)
            completed_effort: Effort completed in original PI (defaults to 0)
            
        Returns:
            dict: Serialized JIRA record response
            
        Raises:
            ValueError: If validation fails
            HTTPException: If record or PI not found
        """
        # 1. Fetch record with relationships
        record = self.db.query(JiraRecord).filter(
            JiraRecord.id == record_id
        ).options(
            joinedload(JiraRecord.team),
            joinedload(JiraRecord.pi),
            joinedload(JiraRecord.feature)
        ).first()
        
        if not record:
            raise HTTPException(status_code=404, detail="JIRA record not found")
        
        # 2. Validate effort split
        if spillover_effort is None:
            spillover_effort = record.planned_effort
        
        spillover_effort, completed_effort = self._validate_spillover_effort(
            spillover_effort, completed_effort, record.planned_effort
        )
        
        # 3. Validate current status
        if record.status not in ['PLANNED', 'IN_PROGRESS', 'SPILLOVER']:
            raise ValueError(
                "Can only mark spillover for records with status PLANNED, IN_PROGRESS, or SPILLOVER"
            )
        
        # 4. Fetch and validate PIs
        original_pi = self.db.query(PI).filter(PI.id == spillover_from_pi_id).first()
        if not original_pi:
            raise HTTPException(status_code=404, detail="Original PI not found")
        
        target_pi = self.db.query(PI).filter(PI.id == new_pi_id).first()
        if not target_pi:
            raise HTTPException(status_code=404, detail="Target PI not found")
        
        # 5. Validate PI chronology
        if spillover_from_pi_id == new_pi_id:
            raise ValueError("Cannot mark spillover from the same PI")
        
        # Compare PI chronology (year.sequence)
        original_pi_value = original_pi.year * 10 + original_pi.sequence
        target_pi_value = target_pi.year * 10 + target_pi.sequence
        
        if original_pi_value >= target_pi_value:
            raise ValueError("Original PI must be chronologically before target PI")
        
        # 6. Set original_pi_id on first spillover
        if record.spillover_count == 0:
            record.original_pi_id = spillover_from_pi_id
        
        # 7. Increment spillover count
        record.spillover_count += 1
        
        # 8. Create history entry
        from app.models.spillover_history import SpilloverHistory
        history_entry = SpilloverHistory(
            id=str(uuid.uuid4()),
            jira_record_id=record_id,
            from_pi_id=spillover_from_pi_id,
            to_pi_id=new_pi_id,
            spillover_effort=spillover_effort,
            completed_effort=completed_effort,
            reason=spillover_reason,
            category=spillover_category,
            sequence=record.spillover_count,
            created_at=datetime.utcnow()
        )
        self.db.add(history_entry)
        
        # 9. Update record
        record.pi_id = new_pi_id
        record.is_spillover = True  # CRITICAL: Mark as spillover
        record.spillover_from_pi_id = spillover_from_pi_id
        record.spillover_reason = spillover_reason
        record.spillover_effort = spillover_effort
        record.completed_effort = completed_effort
        if hasattr(record, 'spillover_category'):
            record.spillover_category = spillover_category
        record.status = 'SPILLOVER'
        record.updated_at = datetime.utcnow()
        
        # 6. Commit changes
        self.db.commit()
        self.db.refresh(record)
        
        # 7. Reload with relationships for response
        record = self.db.query(JiraRecord).filter(
            JiraRecord.id == record_id
        ).options(
            joinedload(JiraRecord.team),
            joinedload(JiraRecord.pi),
            joinedload(JiraRecord.feature),
            joinedload(JiraRecord.spillover_from_pi)
        ).first()
        
        # 8. Return serialized response
        return self._build_jira_record_response(record)
    
    def get_feature_jira_records(
        self,
        feature_id: str,
        status: Optional[str] = None,
        team_id: Optional[str] = None,
        pi_id: Optional[str] = None
    ) -> dict:
        """Get all JIRA records for a feature with filters and enhanced summary"""
        query = self.db.query(JiraRecord).filter(
            JiraRecord.feature_id == feature_id
        ).options(
            joinedload(JiraRecord.team),
            joinedload(JiraRecord.pi),
            joinedload(JiraRecord.feature),
            joinedload(JiraRecord.spillover_from_pi)
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
        
        # Calculate spillover summary
        spillover_records = [r for r in records if r.status == 'SPILLOVER']
        spillover_summary = None
        
        if spillover_records:
            # Group by source PI
            by_source_pi = {}
            for record in spillover_records:
                if record.spillover_from_pi_id:
                    pi_id = record.spillover_from_pi_id
                    if pi_id not in by_source_pi:
                        by_source_pi[pi_id] = {
                            "pi_id": pi_id,
                            "pi_name": record.spillover_from_pi.name if record.spillover_from_pi else "Unknown",
                            "count": 0,
                            "effort": 0.0
                        }
                    by_source_pi[pi_id]["count"] += 1
                    by_source_pi[pi_id]["effort"] += float(record.planned_effort or 0)
            
            spillover_summary = {
                "count": len(spillover_records),
                "total_effort": float(sum(r.planned_effort or 0 for r in spillover_records)),
                "by_source_pi": sorted(
                    list(by_source_pi.values()),
                    key=lambda x: x["pi_name"]
                )
            }
        
        # Build response objects as dicts
        data = [self._build_jira_record_response(r) for r in records]
        
        response = {
            "data": data,
            "total": len(records),
            "summary": summary
        }
        
        # Only include spillover_summary if spillover records exist
        if spillover_summary:
            response["spillover_summary"] = spillover_summary
        
        return response
    
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
        
        # Update fields using model_dump to handle all provided fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(record, field):
                setattr(record, field, value)
        
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
    
    def _validate_spillover_effort(
        self,
        spillover_effort: float,
        completed_effort: float,
        planned_effort: float
    ) -> Tuple[float, float]:
        """Validate spillover and completed effort."""
        
        # Minimum spillover
        if spillover_effort < 0.5:
            raise HTTPException(
                status_code=400,
                detail="Spillover effort must be at least 0.5 eD"
            )
        
        # Non-negative completed
        if completed_effort < 0:
            raise HTTPException(
                status_code=400,
                detail="Completed effort cannot be negative"
            )
        
        # Sum validation
        total = spillover_effort + completed_effort
        if total > planned_effort:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Total effort ({total:.1f} eD) cannot exceed "
                    f"planned effort ({planned_effort:.1f} eD)"
                )
            )
        
        return spillover_effort, completed_effort
    
    def get_spillover_history(self, record_id: str) -> List[Dict]:
        """Get spillover history for a JIRA record."""
        from app.models.spillover_history import SpilloverHistory
        
        # Verify record exists
        record = self.db.query(JiraRecord).filter(JiraRecord.id == record_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="JIRA record not found")
        
        # Query history with PI joins
        history_entries = (
            self.db.query(SpilloverHistory)
            .filter(SpilloverHistory.jira_record_id == record_id)
            .order_by(SpilloverHistory.sequence)
            .all()
        )
        
        # Format response with PI names
        result = []
        for entry in history_entries:
            from_pi = self.db.query(PI).filter(PI.id == entry.from_pi_id).first() if entry.from_pi_id else None
            to_pi = self.db.query(PI).filter(PI.id == entry.to_pi_id).first() if entry.to_pi_id else None
            
            result.append({
                "id": entry.id,
                "sequence": entry.sequence,
                "from_pi_id": entry.from_pi_id,
                "from_pi_name": from_pi.name if from_pi else None,
                "to_pi_id": entry.to_pi_id,
                "to_pi_name": to_pi.name if to_pi else None,
                "spillover_effort": float(entry.spillover_effort),
                "completed_effort": float(entry.completed_effort),
                "reason": entry.reason,
                "category": entry.category,
                "created_at": entry.created_at
            })
        
        return result
    
    def _build_jira_record_response(self, record: JiraRecord) -> dict:
        """Build JIRA record response with related data"""
        # Get original PI name if original_pi_id exists
        original_pi_name = None
        if record.original_pi_id:
            original_pi = self.db.query(PI).filter(PI.id == record.original_pi_id).first()
            original_pi_name = original_pi.name if original_pi else None
        
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
            "workflow_status": getattr(record, 'workflow_status', None) or record.status or "PLANNED",  # Phase 3.2
            "is_spillover": getattr(record, 'is_spillover', False) or False,  # Phase 3.2
            "spillover_from_pi_id": record.spillover_from_pi_id,
            "spillover_from_pi_name": record.spillover_from_pi.name if record.spillover_from_pi else None,
            "spillover_reason": record.spillover_reason,
            "spillover_category": getattr(record, 'spillover_category', None),
            # Explicitly return new fields with proper fallbacks
            "spillover_effort": float(record.spillover_effort) if record.spillover_effort is not None else None,
            "completed_effort": float(record.completed_effort) if record.completed_effort is not None else 0.0,
            "spillover_count": int(record.spillover_count) if record.spillover_count is not None else 0,
            "original_pi_id": record.original_pi_id,
            "original_pi_name": original_pi_name,
            "created_at": record.created_at,
            "updated_at": record.updated_at
        }
    
    # Phase 3.2: New methods for spillover editing and record history
    
    def update_spillover_details(
        self,
        record_id: str,
        spillover_reason: str,
        spillover_category: str,
        spillover_effort: float,
        completed_effort: float,
        edit_reason: Optional[str] = None
    ) -> dict:
        """
        Update spillover details for an existing spillover record.
        
        Args:
            record_id: JIRA record ID
            spillover_reason: Updated reason for spillover
            spillover_category: Updated category
            spillover_effort: Updated spillover effort
            completed_effort: Updated completed effort
            edit_reason: Reason for editing (for audit trail)
        
        Returns:
            Updated JIRA record response
        """
        from app.models.spillover_history import SpilloverHistory
        from app.models.record_history import RecordHistory
        import json
        
        # Get record
        record = self.get_jira_record(record_id)
        
        # Validate record is spillover
        is_spillover = getattr(record, 'is_spillover', False) or record.status == 'SPILLOVER'
        if not is_spillover:
            raise HTTPException(
                status_code=400,
                detail="Record is not marked as spillover"
            )
        
        # Validate effort totals
        self._validate_spillover_effort(spillover_effort, completed_effort, record.planned_effort)
        
        # Get old values for history
        old_values = {
            "reason": record.spillover_reason,
            "category": getattr(record, 'spillover_category', None),
            "spillover_effort": record.spillover_effort,
            "completed_effort": record.completed_effort
        }
        
        new_values = {
            "reason": spillover_reason,
            "category": spillover_category,
            "spillover_effort": spillover_effort,
            "completed_effort": completed_effort
        }
        
        # Update latest spillover_history entry
        latest_history = (
            self.db.query(SpilloverHistory)
            .filter(SpilloverHistory.jira_record_id == record_id)
            .order_by(SpilloverHistory.sequence.desc())
            .first()
        )
        
        if latest_history:
            latest_history.reason = spillover_reason
            latest_history.category = spillover_category
            latest_history.spillover_effort = spillover_effort
            latest_history.completed_effort = completed_effort
        
        # Create record_history entry
        self._create_history_entry(
            jira_record_id=record_id,
            event_type="SPILLOVER_EDIT",
            from_value=json.dumps(old_values),
            to_value=json.dumps(new_values),
            metadata={"edit_reason": edit_reason} if edit_reason else {}
        )
        
        # Update record
        record.spillover_reason = spillover_reason
        if hasattr(record, 'spillover_category'):
            record.spillover_category = spillover_category
        record.spillover_effort = spillover_effort
        record.completed_effort = completed_effort
        record.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(record)
        
        return self._build_jira_record_response(record)
    
    def get_record_history(
        self,
        record_id: str,
        event_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> dict:
        """
        Get complete history for a JIRA record.
        
        Args:
            record_id: JIRA record ID
            event_type: Optional filter by event type
            limit: Maximum number of entries to return
            offset: Offset for pagination
        
        Returns:
            Dictionary with data and total count
        """
        from app.models.record_history import RecordHistory
        import json
        
        print(f"=== DEBUG: get_record_history called for record_id={record_id} ===")
        
        try:
            # Build query
            query = self.db.query(RecordHistory).filter(RecordHistory.jira_record_id == record_id)
            
            if event_type:
                query = query.filter(RecordHistory.event_type == event_type)
            
            print(f"Counting total entries...")
            total = query.count()
            print(f"Total entries found: {total}")
            
            # Get history entries
            print(f"Fetching history entries (limit={limit}, offset={offset})...")
            history = (
                query
                .order_by(RecordHistory.created_at.asc())
                .limit(limit)
                .offset(offset)
                .all()
            )
            print(f"Fetched {len(history)} entries")
            
            # Format response with PI names
            result = []
            for idx, entry in enumerate(history):
                print(f"Processing entry {idx + 1}/{len(history)}: id={entry.id}, type={entry.event_type}")
                try:
                    entry_dict = {
                        "id": entry.id,
                        "jira_record_id": entry.jira_record_id,
                        "event_type": entry.event_type,
                        "from_value": entry.from_value,
                        "to_value": entry.to_value,
                        "field_name": entry.field_name,
                        "created_at": entry.created_at
                    }
                    print(f"  Basic fields extracted successfully")
                    
                    # Add spillover-specific fields
                    if entry.event_type in ["SPILLOVER", "SPILLOVER_EDIT"]:
                        print(f"  Adding spillover-specific fields...")
                        if entry.from_pi_id:
                            from_pi = self.db.query(PI).filter(PI.id == entry.from_pi_id).first()
                            entry_dict["from_pi_id"] = entry.from_pi_id
                            entry_dict["from_pi_name"] = from_pi.name if from_pi else None
                        
                        if entry.to_pi_id:
                            to_pi = self.db.query(PI).filter(PI.id == entry.to_pi_id).first()
                            entry_dict["to_pi_id"] = entry.to_pi_id
                            entry_dict["to_pi_name"] = to_pi.name if to_pi else None
                        
                        entry_dict["spillover_effort"] = entry.spillover_effort
                        entry_dict["completed_effort"] = entry.completed_effort
                        entry_dict["spillover_reason"] = entry.spillover_reason
                        entry_dict["spillover_category"] = entry.spillover_category
                    
                    # Add event metadata
                    if entry.event_metadata:
                        try:
                            entry_dict["metadata"] = json.loads(entry.event_metadata)
                        except Exception as meta_error:
                            print(f"  Warning: Failed to parse event_metadata: {meta_error}")
                            entry_dict["metadata"] = {}
                    
                    result.append(entry_dict)
                    print(f"  Entry processed successfully")
                    
                except Exception as entry_error:
                    print(f"  ERROR processing entry: {entry_error}")
                    import traceback
                    traceback.print_exc()
                    # Continue processing other entries
            
            print(f"Successfully processed {len(result)} entries")
            return {
                "data": result,
                "total": total
            }
            
        except Exception as e:
            print(f"=== FATAL ERROR in get_record_history ===")
            print(f"Error type: {type(e).__name__}")
            print(f"Error message: {str(e)}")
            import traceback
            traceback.print_exc()
            raise
    
    def revert_spillover(self, record_id: str) -> dict:
        """
        Revert a spillover record back to its original PI.
        
        Args:
            record_id: JIRA record ID to revert
            
        Returns:
            Dictionary with updated record data
            
        Raises:
            ValueError: If record not found or not a spillover
        """
        # Fetch record
        record = self.db.query(JiraRecord).filter(
            JiraRecord.id == record_id
        ).options(
            joinedload(JiraRecord.team),
            joinedload(JiraRecord.pi),
            joinedload(JiraRecord.feature)
        ).first()
        
        if not record:
            raise ValueError("JIRA record not found")
        
        if not record.is_spillover:
            raise ValueError("Record is not a spillover - cannot revert")
        
        # Store original values for history
        original_pi_id = record.pi_id
        revert_to_pi_id = record.spillover_from_pi_id
        
        if not revert_to_pi_id:
            raise ValueError("Cannot revert: original PI not found")
        
        # Revert to previous PI
        record.pi_id = revert_to_pi_id
        
        # Clear spillover fields
        record.is_spillover = False
        record.spillover_from_pi_id = None
        record.spillover_reason = None
        record.spillover_category = None
        record.spillover_effort = None
        record.completed_effort = 0
        
        # Decrement spillover count (but don't go below 0)
        if record.spillover_count and record.spillover_count > 0:
            record.spillover_count = record.spillover_count - 1
        else:
            record.spillover_count = 0
        
        # If spillover_count is now 0, clear original_pi_id
        if record.spillover_count == 0:
            record.original_pi_id = None
        
        # Update workflow status back to previous state if it was changed
        if record.workflow_status == 'PLANNED':
            # Keep as PLANNED
            pass
        
        record.updated_at = datetime.utcnow()
        
        # Create history entry
        self._create_history_entry(
            jira_record_id=record_id,
            event_type="SPILLOVER_REVERTED",
            from_value="SPILLOVER",
            to_value=record.workflow_status or record.status,
            from_pi_id=original_pi_id,
            to_pi_id=revert_to_pi_id,
            metadata={
                "action": "revert_spillover",
                "reverted_at": datetime.utcnow().isoformat()
            }
        )
        
        self.db.commit()
        self.db.refresh(record)
        
        return self._build_jira_record_response(record)
    
    def _create_history_entry(
        self,
        jira_record_id: str,
        event_type: str,
        from_value: Optional[str] = None,
        to_value: Optional[str] = None,
        field_name: Optional[str] = None,
        from_pi_id: Optional[str] = None,
        to_pi_id: Optional[str] = None,
        spillover_effort: Optional[float] = None,
        completed_effort: Optional[float] = None,
        spillover_reason: Optional[str] = None,
        spillover_category: Optional[str] = None,
        metadata: Optional[dict] = None
    ):
        """Create a record history entry"""
        from app.models.record_history import RecordHistory
        import json
        
        history = RecordHistory(
            id=str(uuid.uuid4()),
            jira_record_id=jira_record_id,
            event_type=event_type,
            from_value=from_value,
            to_value=to_value,
            field_name=field_name,
            from_pi_id=from_pi_id,
            to_pi_id=to_pi_id,
            spillover_effort=spillover_effort,
            completed_effort=completed_effort,
            spillover_reason=spillover_reason,
            spillover_category=spillover_category,
            metadata=json.dumps(metadata) if metadata else None
        )
        
        self.db.add(history)
        return history
