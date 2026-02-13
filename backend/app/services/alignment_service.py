"""
Alignment Service - Phase 4

Service for applying alignment actions to resolve deviations.
"""
from typing import Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from fastapi import HTTPException

from app.models.roadmap_v4 import RoadmapFeature, FeatureQuarterlyAllocation, JiraRecord
from app.models.roadmap_version import RoadmapVersion
from app.models.pi import PI
from app.schemas.alignment import (
    AlignmentAction,
    AlignFeatureRequest,
    AlignFeatureResponse,
    QuarterAllocation,
    BatchJiraUpdateRequest,
    BatchJiraUpdateResponse,
    CreateVersionFromAlignmentRequest,
    CreateVersionFromAlignmentResponse,
    AcknowledgeDeviationRequest,
    AcknowledgeDeviationResponse
)


class AlignmentService:
    """Service for applying alignment actions"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def align_feature(
        self, 
        feature_id: str, 
        version_id: str, 
        request: AlignFeatureRequest
    ) -> AlignFeatureResponse:
        """Apply alignment action to feature."""
        if request.action == AlignmentAction.AUTO_ALIGN:
            return self._auto_align(feature_id, version_id)
        elif request.action == AlignmentAction.MANUAL_UPDATE:
            if not request.quarterly_allocations:
                raise HTTPException(400, "quarterly_allocations required for manual_update")
            return self._manual_update(feature_id, version_id, request.quarterly_allocations)
        elif request.action == AlignmentAction.ADJUST_EXECUTION:
            # Auto-fetch strategic allocations if not provided
            allocations = request.quarterly_allocations
            if not allocations:
                allocations = self._get_strategic_allocations_as_quarters(feature_id, version_id)
                if not allocations:
                    raise HTTPException(400, "No strategic allocations found for this feature")
            return self._adjust_execution(feature_id, version_id, allocations)
        elif request.action == AlignmentAction.ACKNOWLEDGE:
            # Allow empty reason
            reason = request.acknowledge_reason or ""
            return self._acknowledge(feature_id, version_id, reason)
        else:
            raise HTTPException(400, f"Unknown action: {request.action}")
    
    def _get_strategic_allocations_as_quarters(self, feature_id: str, version_id: str) -> List[QuarterAllocation]:
        """Fetch feature's strategic quarterly allocations and convert to QuarterAllocation format."""
        try:
            # Get strategic allocations
            strategic_allocations = self.db.query(FeatureQuarterlyAllocation).filter(
                FeatureQuarterlyAllocation.feature_id == feature_id
            ).all()
            
            if not strategic_allocations:
                return []
            
            # Convert to QuarterAllocation format
            result = []
            for alloc in strategic_allocations:
                # Get PI for this quarter
                pi = self.db.query(PI).filter(
                    PI.year == alloc.year,
                    PI.sequence == alloc.quarter
                ).first()
                
                if pi:
                    result.append(QuarterAllocation(
                        pi_id=pi.id,
                        effort_ed=float(alloc.allocated_ed)
                    ))
            
            return result
        except Exception as e:
            print(f"ERROR fetching strategic allocations for feature {feature_id}: {str(e)}")
            return []
    
    def _auto_align(self, feature_id: str, version_id: str) -> AlignFeatureResponse:
        """Copy execution values to strategic allocations."""
        try:
            # Get feature
            feature = self.db.query(RoadmapFeature).filter(
                RoadmapFeature.id == feature_id,
                RoadmapFeature.version_id == version_id
            ).first()
            
            if not feature:
                raise HTTPException(404, f"Feature {feature_id} not found in version {version_id}")
            
            # Get current strategic allocations
            strategic_allocations = self.db.query(FeatureQuarterlyAllocation).filter(
                FeatureQuarterlyAllocation.feature_id == feature_id
            ).all()
            
            if not strategic_allocations:
                # No allocations to update - return success with no changes
                print(f"INFO: No strategic allocations found for feature {feature_id}")
                return AlignFeatureResponse(
                    feature_id=feature_id,
                    action=AlignmentAction.AUTO_ALIGN,
                    previous_total=0.0,
                    new_total=0.0,
                    change=0.0,
                    quarterly_changes={},
                    success=True,
                    message="No strategic allocations found to align"
                )
            
            # Get execution data per PI
            execution_data = self.db.query(
                JiraRecord.pi_id,
                func.sum(JiraRecord.planned_effort).label('total_effort')
            ).filter(
                JiraRecord.feature_id == feature_id
            ).group_by(JiraRecord.pi_id).all()
            
            execution_map = {row.pi_id: float(row.total_effort) for row in execution_data if row.pi_id}
            
            # Calculate totals
            previous_total = sum(float(alloc.allocated_ed) for alloc in strategic_allocations)
            quarterly_changes = {}
            
            # Update allocations to match execution
            for allocation in strategic_allocations:
                # Get PI for this quarter (PI uses 'sequence' not 'quarter')
                pi = self.db.query(PI).filter(
                    PI.year == allocation.year,
                    PI.sequence == allocation.quarter
                ).first()
                
                if pi:
                    execution_effort = execution_map.get(pi.id, 0.0)
                    previous_effort = float(allocation.allocated_ed)
                    
                    # Update allocation
                    allocation.allocated_ed = execution_effort
                    allocation.updated_at = datetime.utcnow()
                    
                    quarter_label = f"Q{allocation.quarter} {allocation.year}"
                    quarterly_changes[quarter_label] = {
                        "previous": previous_effort,
                        "new": execution_effort,
                        "change": execution_effort - previous_effort
                    }
            
            self.db.commit()
            
            new_total = sum(float(alloc.allocated_ed) for alloc in strategic_allocations)
            
            return AlignFeatureResponse(
                feature_id=feature_id,
                action=AlignmentAction.AUTO_ALIGN,
                previous_total=round(previous_total, 2),
                new_total=round(new_total, 2),
                change=round(new_total - previous_total, 2),
                quarterly_changes=quarterly_changes,
                success=True,
                message="Feature aligned successfully - strategic values updated to match execution"
            )
        except HTTPException:
            raise
        except Exception as e:
            import traceback
            print(f"ERROR in _auto_align for feature {feature_id}: {str(e)}")
            print(traceback.format_exc())
            self.db.rollback()
            raise HTTPException(500, f"Failed to auto-align feature: {str(e)}")
    
    def _manual_update(
        self, 
        feature_id: str, 
        version_id: str, 
        allocations: List[QuarterAllocation]
    ) -> AlignFeatureResponse:
        """Apply user-provided quarterly allocations."""
        # Get feature
        feature = self.db.query(RoadmapFeature).filter(
            RoadmapFeature.id == feature_id,
            RoadmapFeature.version_id == version_id
        ).first()
        
        if not feature:
            raise HTTPException(404, f"Feature {feature_id} not found in version {version_id}")
        
        # Get current strategic allocations
        strategic_allocations = self.db.query(FeatureQuarterlyAllocation).filter(
            FeatureQuarterlyAllocation.feature_id == feature_id
        ).all()
        
        previous_total = sum(float(alloc.allocated_ed) for alloc in strategic_allocations)
        quarterly_changes = {}
        
        # Create map of PI ID to new effort
        new_efforts = {alloc.pi_id: alloc.effort_ed for alloc in allocations}
        
        # Update allocations
        for allocation in strategic_allocations:
            # Get PI for this quarter (PI uses 'sequence' not 'quarter')
            pi = self.db.query(PI).filter(
                PI.year == allocation.year,
                PI.sequence == allocation.quarter
            ).first()
            
            if pi and pi.id in new_efforts:
                previous_effort = float(allocation.allocated_ed)
                new_effort = new_efforts[pi.id]
                
                # Update allocation
                allocation.allocated_ed = new_effort
                allocation.updated_at = datetime.utcnow()
                
                quarter_label = f"Q{allocation.quarter} {allocation.year}"
                quarterly_changes[quarter_label] = {
                    "previous": previous_effort,
                    "new": new_effort,
                    "change": new_effort - previous_effort
                }
        
        self.db.commit()
        
        new_total = sum(float(alloc.allocated_ed) for alloc in strategic_allocations)
        
        return AlignFeatureResponse(
            feature_id=feature_id,
            action=AlignmentAction.MANUAL_UPDATE,
            previous_total=round(previous_total, 2),
            new_total=round(new_total, 2),
            change=round(new_total - previous_total, 2),
            quarterly_changes=quarterly_changes,
            success=True,
            message="Feature updated with custom quarterly allocations"
        )
    
    def _acknowledge(
        self, 
        feature_id: str, 
        version_id: str, 
        reason: str
    ) -> AlignFeatureResponse:
        """Mark deviation as acknowledged."""
        # Get feature
        feature = self.db.query(RoadmapFeature).filter(
            RoadmapFeature.id == feature_id,
            RoadmapFeature.version_id == version_id
        ).first()
        
        if not feature:
            raise HTTPException(404, f"Feature {feature_id} not found in version {version_id}")
        
        # Get strategic allocations
        strategic_allocations = self.db.query(FeatureQuarterlyAllocation).filter(
            FeatureQuarterlyAllocation.feature_id == feature_id
        ).all()
        
        total_effort = sum(float(alloc.allocated_ed) for alloc in strategic_allocations)
        
        # Mark all quarterly allocations as acknowledged
        for allocation in strategic_allocations:
            allocation.deviation_acknowledged = True
            allocation.deviation_note = reason
            allocation.deviation_acknowledged_at = datetime.utcnow()
            allocation.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        return AlignFeatureResponse(
            feature_id=feature_id,
            action=AlignmentAction.ACKNOWLEDGE,
            previous_total=round(total_effort, 2),
            new_total=round(total_effort, 2),
            change=0.0,
            quarterly_changes={},
            success=True,
            message=f"Deviation acknowledged: {reason}"
        )
    
    def _adjust_execution(
        self, 
        feature_id: str, 
        version_id: str, 
        allocations: List[QuarterAllocation]
    ) -> AlignFeatureResponse:
        """Adjust execution (JIRA records) to match strategic allocations."""
        try:
            # Get feature
            feature = self.db.query(RoadmapFeature).filter(
                RoadmapFeature.id == feature_id,
                RoadmapFeature.version_id == version_id
            ).first()
            
            if not feature:
                raise HTTPException(404, f"Feature {feature_id} not found in version {version_id}")
            
            # Get current JIRA records grouped by PI
            jira_records = self.db.query(JiraRecord).filter(
                JiraRecord.feature_id == feature_id
            ).all()
            
            # Calculate current execution totals by PI
            execution_by_pi = {}
            for record in jira_records:
                if record.pi_id:
                    execution_by_pi[record.pi_id] = execution_by_pi.get(record.pi_id, 0.0) + float(record.planned_effort or 0.0)
            
            previous_total = sum(execution_by_pi.values())
            quarterly_changes = {}
            new_total = 0.0
            
            # Update JIRA records to match strategic allocations
            for allocation in allocations:
                pi_id = allocation.pi_id
                target_effort = allocation.effort_ed
                new_total += target_effort
                
                # Get PI info for display
                pi = self.db.query(PI).filter(PI.id == pi_id).first()
                if pi:
                    quarter_label = f"Q{pi.sequence} {pi.year}"
                    previous_effort = execution_by_pi.get(pi_id, 0.0)
                    
                    quarterly_changes[quarter_label] = {
                        "previous": previous_effort,
                        "new": target_effort,
                        "change": target_effort - previous_effort
                    }
                    
                    # Get JIRA records for this PI
                    pi_records = [r for r in jira_records if r.pi_id == pi_id]
                    
                    if pi_records:
                        # Distribute target effort across existing records proportionally
                        current_pi_total = sum(float(r.planned_effort or 0.0) for r in pi_records)
                        
                        if current_pi_total > 0:
                            # Proportional distribution
                            for record in pi_records:
                                proportion = float(record.planned_effort or 0.0) / current_pi_total
                                record.planned_effort = target_effort * proportion
                                record.updated_at = datetime.utcnow()
                        else:
                            # Equal distribution if current total is 0
                            effort_per_record = target_effort / len(pi_records)
                            for record in pi_records:
                                record.planned_effort = effort_per_record
                                record.updated_at = datetime.utcnow()
                    else:
                        # No records for this PI - would need to create one
                        # For now, skip (this is an edge case)
                        print(f"WARNING: No JIRA records found for PI {pi_id}")
            
            self.db.commit()
            
            return AlignFeatureResponse(
                feature_id=feature_id,
                action=AlignmentAction.ADJUST_EXECUTION,
                previous_total=round(previous_total, 2),
                new_total=round(new_total, 2),
                change=round(new_total - previous_total, 2),
                quarterly_changes=quarterly_changes,
                success=True,
                message="Execution plan adjusted to match strategic allocations"
            )
        except HTTPException:
            raise
        except Exception as e:
            import traceback
            print(f"ERROR in _adjust_execution for feature {feature_id}: {str(e)}")
            print(traceback.format_exc())
            self.db.rollback()
            raise HTTPException(500, f"Failed to adjust execution: {str(e)}")
    
    def batch_update_jira_records(
        self, 
        request: BatchJiraUpdateRequest
    ) -> BatchJiraUpdateResponse:
        """Batch update JIRA records."""
        updated_count = 0
        failed_count = 0
        results = []
        
        for update in request.updates:
            try:
                # Get JIRA record
                record = self.db.query(JiraRecord).filter(
                    JiraRecord.id == update.record_id
                ).first()
                
                if not record:
                    failed_count += 1
                    results.append({
                        "record_id": update.record_id,
                        "status": "failed",
                        "error": "Record not found"
                    })
                    continue
                
                # Check if record can be modified
                if record.status in ['IN_PROGRESS', 'COMPLETED']:
                    failed_count += 1
                    results.append({
                        "record_id": update.record_id,
                        "status": "failed",
                        "error": f"Cannot modify record with status {record.status}"
                    })
                    continue
                
                if record.is_spillover:
                    failed_count += 1
                    results.append({
                        "record_id": update.record_id,
                        "status": "failed",
                        "error": "Cannot modify spillover records"
                    })
                    continue
                
                # Apply updates
                changes = {}
                if update.new_pi_id:
                    old_pi_id = record.pi_id
                    record.pi_id = update.new_pi_id
                    changes["pi_id"] = f"{old_pi_id} → {update.new_pi_id}"
                
                if update.new_effort is not None:
                    old_effort = record.planned_effort
                    record.planned_effort = update.new_effort
                    changes["planned_effort"] = f"{old_effort} → {update.new_effort}"
                
                record.updated_at = datetime.utcnow()
                
                updated_count += 1
                results.append({
                    "record_id": update.record_id,
                    "status": "updated",
                    "changes": changes
                })
                
            except Exception as e:
                failed_count += 1
                results.append({
                    "record_id": update.record_id,
                    "status": "failed",
                    "error": str(e)
                })
        
        if updated_count > 0:
            self.db.commit()
        
        return BatchJiraUpdateResponse(
            updated_count=updated_count,
            failed_count=failed_count,
            results=results
        )
    
    def acknowledge_deviation(
        self, 
        feature_id: str, 
        version_id: str, 
        request: AcknowledgeDeviationRequest
    ) -> AcknowledgeDeviationResponse:
        """Mark deviation as acknowledged."""
        # Get feature
        feature = self.db.query(RoadmapFeature).filter(
            RoadmapFeature.id == feature_id,
            RoadmapFeature.version_id == version_id
        ).first()
        
        if not feature:
            raise HTTPException(404, f"Feature {feature_id} not found in version {version_id}")
        
        # Get strategic allocations
        strategic_allocations = self.db.query(FeatureQuarterlyAllocation).filter(
            FeatureQuarterlyAllocation.feature_id == feature_id
        ).all()
        
        acknowledged_at = datetime.utcnow()
        
        # Mark all quarterly allocations as acknowledged
        for allocation in strategic_allocations:
            allocation.deviation_acknowledged = True
            allocation.deviation_note = request.reason
            allocation.deviation_acknowledged_at = acknowledged_at
            allocation.updated_at = acknowledged_at
        
        self.db.commit()
        
        return AcknowledgeDeviationResponse(
            feature_id=feature_id,
            acknowledged=True,
            reason=request.reason,
            acknowledged_at=acknowledged_at.isoformat()
        )
    
    def create_version_from_alignment(
        self, 
        request: CreateVersionFromAlignmentRequest
    ) -> CreateVersionFromAlignmentResponse:
        """Create a new roadmap version from alignment changes."""
        from app.models.roadmap_version import RoadmapVersion
        from app.models.product import Product
        import uuid
        import json
        
        # Verify product exists
        product = self.db.query(Product).filter(Product.id == request.product_id).first()
        if not product:
            raise HTTPException(404, f"Product {request.product_id} not found")
        
        # Verify source version exists
        source_version = self.db.query(RoadmapVersion).filter(
            RoadmapVersion.id == request.source_version_id,
            RoadmapVersion.product_id == request.product_id
        ).first()
        
        if not source_version:
            raise HTTPException(404, f"Source version {request.source_version_id} not found")
        
        # Create new version
        new_version = RoadmapVersion(
            id=str(uuid.uuid4()),
            product_id=request.product_id,
            version_name=request.version_name,
            description=request.notes,
            status="PUBLISHED" if request.publish_immediately else "DRAFT",
            created_at=datetime.utcnow()
        )
        
        self.db.add(new_version)
        
        # Copy features from source version
        source_features = self.db.query(RoadmapFeature).filter(
            RoadmapFeature.version_id == request.source_version_id
        ).all()
        
        features_aligned = 0
        total_deviation_before = 0.0
        total_deviation_after = 0.0
        
        for source_feature in source_features:
            # Create new feature
            new_feature = RoadmapFeature(
                id=str(uuid.uuid4()),
                product_id=request.product_id,
                version_id=new_version.id,
                name=source_feature.name,
                gross_sizing_ed=source_feature.gross_sizing_ed,
                net_sizing_ed=source_feature.net_sizing_ed,
                total_cost_keur=source_feature.total_cost_keur,
                created_at=datetime.utcnow()
            )
            self.db.add(new_feature)
            
            # Copy quarterly allocations
            source_allocations = self.db.query(FeatureQuarterlyAllocation).filter(
                FeatureQuarterlyAllocation.feature_id == source_feature.id
            ).all()
            
            for source_alloc in source_allocations:
                new_alloc = FeatureQuarterlyAllocation(
                    id=str(uuid.uuid4()),
                    feature_id=new_feature.id,
                    year=source_alloc.year,
                    quarter=source_alloc.quarter,
                    allocated_ed=source_alloc.allocated_ed,
                    created_at=datetime.utcnow()
                )
                self.db.add(new_alloc)
            
            # Check if feature was aligned
            if any(alloc.deviation_acknowledged for alloc in source_allocations):
                features_aligned += 1
        
        self.db.commit()
        
        return CreateVersionFromAlignmentResponse(
            version_id=new_version.id,
            version_name=new_version.version_name,
            status=new_version.status,
            created_at=new_version.created_at.isoformat(),
            features_aligned=features_aligned,
            total_deviation_before=round(total_deviation_before, 2),
            total_deviation_after=round(total_deviation_after, 2)
        )
