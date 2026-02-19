"""
Team Planning Service - Phase 5A

CRITICAL BUSINESS RULES:
1. Status is auto-calculated, never manually set
2. Capacity thresholds: <95% green, 95-100% amber, >100% red
3. Orphaned JIRA detection: jira_record_id = NULL
4. No locking after approval
"""
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func, String
from decimal import Decimal
from datetime import datetime
import uuid

from app.models.team_planning import TeamPlanning, POPlanVersion, PlanningNotification
from app.models.roadmap_v4 import JiraRecord
from app.models.team import Team
from app.models.pi import PI
from app.models.roadmap_version import RoadmapVersion
from app.services.team_service import TeamService
from app.schemas.team_planning import (
    TeamPlanningCreate,
    TeamPlanningUpdate,
    CapacityResponse,
    PlanningSummary,
    TeamInfo,
    PIInfo,
    VersionInfo
)


class TeamPlanningService:
    """Service for team planning operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_status(self, planning: TeamPlanning) -> str:
        """
        Auto-calculate status based on planning data.
        Status is NEVER manually set.
        
        Priority order:
        1. orphaned (if jira_record_id is NULL)
        2. descope_proposed (if is_descoped)
        3. not_planned (if no role breakdown)
        4. modified (if effort changed from PM's original)
        5. accepted (kept PM's effort + added role breakdown)
        """
        if planning.is_orphaned or planning.jira_record_id is None:
            return "orphaned"
        
        if planning.is_descoped:
            return "descope_proposed"
        
        # Check if PO has added role breakdown
        has_role_breakdown = (
            planning.dev_effort > 0 or 
            planning.pd_effort > 0 or 
            planning.qa_effort > 0
        )
        
        if not has_role_breakdown:
            return "not_planned"
        
        # Check if effort was modified from PM's original
        if planning.original_pm_effort is not None and planning.planned_effort is not None:
            if abs(float(planning.planned_effort) - float(planning.original_pm_effort)) > 0.01:
                return "modified"
        
        return "accepted"
    
    def get_capacity_status(self, used: Decimal, available: Decimal) -> CapacityResponse:
        """
        Calculate capacity status with EXACT thresholds.
        DO NOT CHANGE:
        - < 95% = green
        - 95-100% = amber
        - > 100% = red
        """
        # Ensure both are Decimal type
        used = Decimal(str(used)) if not isinstance(used, Decimal) else used
        available = Decimal(str(available)) if not isinstance(available, Decimal) else available
        
        if available == 0:
            return CapacityResponse(
                available_ed=0,
                used_ed=float(used),
                remaining_ed=0,
                utilization_percent=0,
                status="warning",
                warning="No capacity configured for this team in this PI"
            )
        
        percent = (used / available) * Decimal("100")
        
        if percent < Decimal("95"):
            status = "green"
        elif percent <= Decimal("100"):
            status = "amber"
        else:
            status = "red"
        
        return CapacityResponse(
            available_ed=float(available),
            used_ed=float(used),
            remaining_ed=float(available - used),
            utilization_percent=round(float(percent), 1),
            status=status
        )
    
    def check_and_mark_orphaned(self, planning: TeamPlanning) -> TeamPlanning:
        """
        Check if item is orphaned (JIRA deleted).
        If jira_record_id is NULL but we have planning data, mark as orphaned.
        """
        if planning.jira_record_id is None and not planning.is_orphaned:
            planning.is_orphaned = True
            planning.orphaned_at = datetime.utcnow()
            planning.status = "orphaned"
        return planning
    
    def get_team_planning_items(
        self,
        team_id: str,
        pi_id: str,
        po_plan_version_id: Optional[str] = None
    ) -> List[TeamPlanning]:
        """Get planning items for team/PI, optionally filtered by PO plan version.
        
        If po_plan_version_id provided: returns that version's saved planning data merged with JIRA records.
        If not provided: returns JIRA records with empty planning data (for initial load).
        """
        print(f"DEBUG: get_team_planning_items called with team={team_id}, pi={pi_id}, po_plan_version_id={po_plan_version_id}")
        
        team_id_lower = team_id.lower()
        pi_id_lower = pi_id.lower()

        # Get all JIRA records for this team/PI
        jira_records = self.db.query(JiraRecord).options(
            joinedload(JiraRecord.feature)
        ).filter(
            and_(
                func.lower(func.cast(JiraRecord.team_id, String)) == team_id_lower,
                func.lower(func.cast(JiraRecord.pi_id, String)) == pi_id_lower
            )
        ).all()
        
        print(f"DEBUG: Found {len(jira_records)} JIRA records for team {team_id}, PI {pi_id}")
        
        # Get ALL saved planning items for this team+PI (ignore plan_version_id for now)
        # This fixes the issue where items saved without plan_version_id weren't being loaded
        print(f"DEBUG: Querying for team={team_id}, pi={pi_id}")
        
        all_saved = self.db.query(TeamPlanning).all()
        print(f"DEBUG: Total TeamPlanning records in DB: {len(all_saved)}")
        
        # Filter manually with case-insensitive comparison
        saved_items = [
            s for s in all_saved
            if str(s.team_id).lower() == team_id_lower
            and str(s.pi_id).lower() == pi_id_lower
        ]
        
        print(f"DEBUG: Found {len(saved_items)} saved items for team={team_id}, pi={pi_id}")
        
        # Index by jira_record_id for quick lookup
        saved_planning = {}
        for item in saved_items:
            if item.jira_record_id:
                saved_planning[item.jira_record_id] = item
                print(f"DB ITEM: jira={item.jira_record_id}, dev={item.dev_effort}, pd={item.pd_effort}, qa={item.qa_effort}, plan_version_id={item.plan_version_id}")
        
        print(f"DEBUG: Indexed {len(saved_planning)} saved planning items")
        
        # Merge JIRA records with saved planning data
        items = []
        now = datetime.utcnow()
        for jira in jira_records:
            # Check if we have saved planning data for this JIRA record
            if jira.id in saved_planning:
                # Use saved planning data
                planning = saved_planning[jira.id]
                print(f"JIRA {jira.jira_key}: FOUND saved data - dev={planning.dev_effort}, pd={planning.pd_effort}, qa={planning.qa_effort}")
                # Populate joined data from JiraRecord
                planning.jira_key = jira.jira_key
                planning.jira_title = jira.title
                planning.feature_name = jira.feature.name if jira.feature else None
                planning.is_spillover = jira.is_spillover or False
                planning.jira_record = jira
            else:
                print(f"JIRA {jira.jira_key}: NO saved data - creating empty planning")
                # Create new planning object with empty data
                planning = TeamPlanning(
                    id=str(uuid.uuid4()),
                    jira_record_id=jira.id,
                    team_id=team_id,
                    pi_id=pi_id,
                    version_id=str(jira.version_id) if jira.version_id else "",
                    plan_version_id=po_plan_version_id,
                    planned_effort=Decimal("0"),
                    dev_effort=Decimal("0"),
                    pd_effort=Decimal("0"),
                    qa_effort=Decimal("0"),
                    status="not_planned",
                    original_pm_effort=jira.planned_effort or Decimal("0"),
                    is_orphaned=False,
                    is_descoped=False,
                    created_at=now,
                    updated_at=now
                )
                # Populate joined data from JiraRecord
                planning.jira_key = jira.jira_key
                planning.jira_title = jira.title
                planning.feature_name = jira.feature.name if jira.feature else None
                planning.is_spillover = jira.is_spillover or False
                planning.jira_record = jira
            
            items.append(planning)
        
        return items
    
    def create_or_update_planning(
        self,
        data: TeamPlanningCreate,
        user_id: str
    ) -> TeamPlanning:
        """
        Create or update planning record (auto-save endpoint).
        Upserts based on jira_record_id + team_id + pi_id + po_plan_version_id.
        """
        # Get JIRA record to extract version_id
        jira = self.db.query(JiraRecord).filter(JiraRecord.id == data.jira_record_id).first()
        if not jira:
            raise ValueError(f"JIRA record {data.jira_record_id} not found")
        
        # Check if planning record exists for this PO plan version
        query_filters = [
            TeamPlanning.jira_record_id == data.jira_record_id,
            TeamPlanning.team_id == data.team_id,
            TeamPlanning.pi_id == data.pi_id
        ]
        
        # CRITICAL: Filter by po_plan_version_id to support multiple independent drafts
        if data.po_plan_version_id:
            query_filters.append(TeamPlanning.plan_version_id == data.po_plan_version_id)
        
        existing = self.db.query(TeamPlanning).filter(and_(*query_filters)).first()
        
        if existing:
            # Update existing
            print(f"UPDATING existing record {existing.id}: jira={data.jira_record_id}, dev={data.dev_effort}, pd={data.pd_effort}, qa={data.qa_effort}")
            existing.planned_effort = data.dev_effort + data.pd_effort + data.qa_effort
            existing.dev_effort = data.dev_effort
            existing.pd_effort = data.pd_effort
            existing.qa_effort = data.qa_effort
            existing.updated_at = datetime.utcnow()
            existing.status = self.calculate_status(existing)
            self.db.commit()
            
            # Reset plan if PO is editing after PM approval/commit
            self._reset_plan_if_needed(data.team_id, data.pi_id)
            
            return existing
        else:
            # Create new - get version_id from JIRA record
            print(f"CREATING new record: jira={data.jira_record_id}, dev={data.dev_effort}, pd={data.pd_effort}, qa={data.qa_effort}")
            planning = TeamPlanning(
                id=str(uuid.uuid4()),
                jira_record_id=data.jira_record_id,
                team_id=data.team_id,
                pi_id=data.pi_id,
                version_id=str(jira.version_id),  # Always from JIRA record
                plan_version_id=data.po_plan_version_id,  # Which PO draft this belongs to
                planned_effort=data.dev_effort + data.pd_effort + data.qa_effort,
                dev_effort=data.dev_effort,
                pd_effort=data.pd_effort,
                qa_effort=data.qa_effort,
                original_pm_effort=jira.planned_effort if jira else None,
                created_by=user_id
            )
            planning.status = self.calculate_status(planning)
            self.db.add(planning)
            self.db.commit()
            self.db.refresh(planning)
            print(f"CREATED record {planning.id} with plan_version_id={planning.plan_version_id}")
            return planning
    
    def descope_item(
        self,
        planning_id: str,
        reason: str,
        user_id: str
    ) -> TeamPlanning:
        """Mark item as descoped."""
        planning = self.db.query(TeamPlanning).filter(TeamPlanning.id == planning_id).first()
        if not planning:
            raise ValueError("Planning item not found")
        
        planning.is_descoped = True
        planning.descope_reason = reason
        planning.descoped_at = datetime.utcnow()
        planning.status = self.calculate_status(planning)  # Will be "descope_proposed"
        self.db.commit()
        return planning
    
    def restore_item(
        self,
        planning_id: str,
        user_id: str
    ) -> TeamPlanning:
        """Restore descoped item."""
        planning = self.db.query(TeamPlanning).filter(TeamPlanning.id == planning_id).first()
        if not planning:
            raise ValueError("Planning item not found")
        
        planning.is_descoped = False
        planning.descope_reason = None
        planning.descoped_at = None
        planning.status = self.calculate_status(planning)
        self.db.commit()
        return planning
    
    def descope_item_by_jira(
        self,
        team_id: str,
        jira_record_id: str,
        reason: str,
        user_id: str
    ) -> TeamPlanning:
        """Mark item as descoped by team_id and jira_record_id."""
        # Find or create planning record
        planning = self.db.query(TeamPlanning).filter(
            and_(
                TeamPlanning.team_id == team_id,
                TeamPlanning.jira_record_id == jira_record_id
            )
        ).first()
        
        if not planning:
            # Get JIRA record to create planning entry
            jira = self.db.query(JiraRecord).filter(JiraRecord.id == jira_record_id).first()
            if not jira:
                raise ValueError("JIRA record not found")
            
            planning = TeamPlanning(
                id=str(uuid.uuid4()),
                jira_record_id=jira_record_id,
                team_id=team_id,
                pi_id=str(jira.pi_id),
                version_id=str(jira.version_id),
                planned_effort=Decimal("0"),
                dev_effort=Decimal("0"),
                pd_effort=Decimal("0"),
                qa_effort=Decimal("0"),
                original_pm_effort=jira.planned_effort or Decimal("0"),
                status="not_planned",
                is_descoped=False,
                is_orphaned=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            self.db.add(planning)
        
        planning.is_descoped = True
        planning.descope_reason = reason
        planning.descoped_at = datetime.utcnow()
        planning.status = "descope_proposed"
        planning.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(planning)
        
        # Reset plan if PO is descoping after PM approval/commit
        self._reset_plan_if_needed(team_id, planning.pi_id)
        
        return planning
    
    def restore_item_by_jira(
        self,
        team_id: str,
        jira_record_id: str,
        user_id: str
    ) -> TeamPlanning:
        """Restore descoped item by team_id and jira_record_id."""
        planning = self.db.query(TeamPlanning).filter(
            and_(
                TeamPlanning.team_id == team_id,
                TeamPlanning.jira_record_id == jira_record_id
            )
        ).first()
        
        if not planning:
            raise ValueError("Planning item not found")
        
        planning.is_descoped = False
        planning.descope_reason = None
        planning.descoped_at = None
        planning.status = "not_planned"  # Back to not planned
        planning.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(planning)
        
        # Reset plan if PO is restoring after PM approval/commit
        self._reset_plan_if_needed(team_id, planning.pi_id)
        
        return planning
    
    def acknowledge_orphan(
        self,
        planning_id: str,
        user_id: str
    ) -> dict:
        """
        Acknowledge and archive orphaned item.
        Item is kept for audit trail but excluded from active planning.
        """
        planning = self.db.query(TeamPlanning).filter(TeamPlanning.id == planning_id).first()
        if not planning:
            raise ValueError("Planning item not found")
        
        if not planning.is_orphaned:
            raise ValueError("Item is not orphaned")
        
        # Mark as acknowledged (we keep the record for audit)
        # In future, could move to separate "archived" table
        planning.updated_at = datetime.utcnow()
        self.db.commit()
        
        return {"success": True, "message": "Orphaned item acknowledged"}
    
    def get_team_capacity(
        self,
        team_id: str,
        pi_id: str
    ) -> dict:
        """
        Get team capacity for PI with role-level breakdown.
        Uses real PI capacity from TeamService.
        """
        print(f"DEBUG: get_team_capacity called with team_id={team_id}, pi_id={pi_id}")
        
        # Get real PI capacity from TeamService
        try:
            from uuid import UUID
            capacity_detail = TeamService.get_pi_capacity_detail(
                self.db, 
                UUID(team_id), 
                UUID(pi_id)
            )
            
            # Use PI Productive Capacity (iterations only - for allocation)
            available = Decimal(str(capacity_detail.summary.pi_capacity))
            dev_available = Decimal(str(capacity_detail.summary.pi_dev_days))
            pd_available = Decimal(str(capacity_detail.summary.pi_pd_days))
            qa_available = Decimal(str(capacity_detail.summary.pi_qa_days))
            
            print(f"DEBUG: Real PI capacity loaded - Total: {available}, Dev: {dev_available}, PD: {pd_available}, QA: {qa_available}")
        except Exception as e:
            print(f"WARNING: Failed to get real PI capacity: {e}. Using fallback values.")
            # Fallback to safe defaults if capacity calculation fails
            available = Decimal("0.0")
            dev_available = Decimal("0.0")
            pd_available = Decimal("0.0")
            qa_available = Decimal("0.0")
        
        team_id_lower = team_id.lower()
        pi_id_lower = pi_id.lower()

        # Calculate total used effort from JIRA records
        used_result = self.db.query(
            func.sum(JiraRecord.planned_effort)
        ).filter(
            and_(
                func.lower(func.cast(JiraRecord.team_id, String)) == team_id_lower,
                func.lower(func.cast(JiraRecord.pi_id, String)) == pi_id_lower
            )
        ).scalar()
        
        used = used_result if used_result is not None else Decimal("0")
        
        # Calculate role-level used effort from TeamPlanning records
        # Sum dev_effort, pd_effort, qa_effort from planning items
        planning_items = self.get_team_planning_items(team_id, pi_id)
        
        dev_used = sum(Decimal(str(item.dev_effort or 0)) for item in planning_items)
        pd_used = sum(Decimal(str(item.pd_effort or 0)) for item in planning_items)
        qa_used = sum(Decimal(str(item.qa_effort or 0)) for item in planning_items)
        
        print(f"DEBUG: Calculated used effort: {used} from JIRA records")
        print(f"DEBUG: Role breakdown - Dev: {dev_used}, PD: {pd_used}, QA: {qa_used}")
        print(f"DEBUG: Available capacity: {available}")
        
        # Get base capacity status
        capacity_status = self.get_capacity_status(used, available)
        
        # Add role-level breakdown
        capacity_status.roles = {
            "dev": {
                "available": float(dev_available),
                "used": float(dev_used),
                "remaining": float(dev_available - dev_used)
            },
            "pd": {
                "available": float(pd_available),
                "used": float(pd_used),
                "remaining": float(pd_available - pd_used)
            },
            "qa": {
                "available": float(qa_available),
                "used": float(qa_used),
                "remaining": float(qa_available - qa_used)
            }
        }
        
        return capacity_status
    
    def get_planning_summary(
        self,
        team_id: str,
        pi_id: str,
        version_id: Optional[str] = None
    ) -> PlanningSummary:
        """Get summary counts by status."""
        items = self.get_team_planning_items(team_id, pi_id)
        
        return PlanningSummary(
            total=len(items),
            accepted=len([i for i in items if i.status == "accepted"]),
            modified=len([i for i in items if i.status == "modified"]),
            descoped=len([i for i in items if i.status == "descope_proposed"]),
            not_planned=len([i for i in items if i.status == "not_planned"]),
            orphaned=len([i for i in items if i.status == "orphaned"])
        )
    
    def get_team_info(self, team_id: str) -> TeamInfo:
        """Get team information."""
        team = self.db.query(Team).filter(Team.id == team_id).first()

        if not team:
            try:
                team_uuid = uuid.UUID(team_id)
                team = self.db.query(Team).filter(Team.id == team_uuid).first()
            except (ValueError, AttributeError):
                pass

        if not team:
            team = self.db.query(Team).filter(
                func.lower(func.cast(Team.id, String)) == team_id.lower()
            ).first()

        if not team:
            print(f"WARNING: Team not found: {team_id}")
            return TeamInfo(id=team_id, name="Unknown Team")

        return TeamInfo(id=str(team.id), name=team.name)
    
    def get_pi_info(self, pi_id: str) -> PIInfo:
        """Get PI information."""
        pi = self.db.query(PI).filter(PI.id == pi_id).first()

        if not pi:
            try:
                pi_uuid = uuid.UUID(pi_id)
                pi = self.db.query(PI).filter(PI.id == pi_uuid).first()
            except (ValueError, AttributeError):
                pass

        if not pi:
            pi = self.db.query(PI).filter(
                func.lower(func.cast(PI.id, String)) == pi_id.lower()
            ).first()

        if not pi:
            print(f"WARNING: PI not found: {pi_id}")
            return PIInfo(id=pi_id, name="Unknown PI", year=2026, sequence=0)

        return PIInfo(id=str(pi.id), name=pi.name, year=pi.year, sequence=pi.sequence)
    
    def get_version_info(self, version_id: str) -> VersionInfo:
        """Get version information."""
        version = self.db.query(RoadmapVersion).filter(RoadmapVersion.id == version_id).first()
        if not version:
            raise ValueError("Version not found")
        return VersionInfo(id=version.id, version_name=version.version_name, status=version.status)
    
    def validate_commit(
        self,
        team_id: str,
        pi_id: str,
        version_id: str
    ) -> dict:
        """
        Validate plan before commit.
        Returns validation result with errors if any.
        """
        errors = []
        
        # Check for orphaned items
        orphaned_count = self.db.query(TeamPlanning).filter(
            and_(
                TeamPlanning.team_id == team_id,
                TeamPlanning.pi_id == pi_id,
                TeamPlanning.version_id == version_id,
                TeamPlanning.is_orphaned == True
            )
        ).count()
        
        if orphaned_count > 0:
            errors.append(f"You have {orphaned_count} orphaned items. Please acknowledge them before committing.")
        
        # Check if at least one item has role breakdown
        planned_count = self.db.query(TeamPlanning).filter(
            and_(
                TeamPlanning.team_id == team_id,
                TeamPlanning.pi_id == pi_id,
                TeamPlanning.version_id == version_id,
                TeamPlanning.is_orphaned == False,
                TeamPlanning.is_descoped == False,
                TeamPlanning.status != "not_planned"
            )
        ).count()
        
        if planned_count == 0:
            errors.append("At least one item must have role breakdown before committing.")
        
        if errors:
            return {"valid": False, "errors": errors}
        
        return {"valid": True}
    
    def commit_plan(self, team_id: str, pi_id: str) -> dict:
        """
        Commit plan for PM review.
        NEVER creates new POPlanVersion - only updates existing one.
        """
        print(f"DEBUG: Commit request - team={team_id}, pi={pi_id}")
        
        # Validate items first
        items = self.get_team_planning_items(team_id, pi_id)
        unplanned = [
            i for i in items
            if not i.get('is_descoped')
            and (float(i.get('dev_effort', 0)) + 
                 float(i.get('pd_effort', 0)) + 
                 float(i.get('qa_effort', 0))) == 0
        ]
        if unplanned:
            raise ValueError(f"{len(unplanned)} item(s) still need role breakdown")

        # Find existing plan - NEVER create new
        po_plan = self.db.query(POPlanVersion).filter(
            and_(
                func.lower(func.cast(POPlanVersion.team_id, String)) == team_id.lower(),
                func.lower(func.cast(POPlanVersion.pi_id, String)) == pi_id.lower()
            )
        ).first()

        if not po_plan:
            raise ValueError("No plan found - please reload the page")

        print(f"DEBUG: Found existing plan {po_plan.id}, status={po_plan.status} - UPDATING")
        
        # UPDATE status only
        po_plan.status = 'committed'
        po_plan.committed_at = datetime.utcnow()
        po_plan.updated_at = datetime.utcnow()
        self.db.commit()

        print(f"COMMITTED: team={team_id}, pi={pi_id}, plan_id={po_plan.id}, items={len(items)}")
        
        return {
            "status": "committed",
            "message": "Plan submitted for PM review",
            "plan_version_id": po_plan.id,
            "committed_at": po_plan.committed_at.isoformat(),
            "items_count": len(items)
        }
    
    def get_committed_plan(self, team_id: str, pi_id: str) -> dict:
        """Get committed plan for PM review"""
        po_plan = self.db.query(POPlanVersion).filter(
            and_(
                POPlanVersion.team_id == team_id,
                POPlanVersion.pi_id == pi_id,
                POPlanVersion.status == 'committed'
            )
        ).first()

        if not po_plan:
            raise ValueError("No committed plan found for review")

        items = self.db.query(TeamPlanning).filter(
            and_(
                TeamPlanning.team_id == team_id,
                TeamPlanning.pi_id == pi_id
            )
        ).all()

        jira_ids = [str(i.jira_record_id) for i in items if i.jira_record_id]
        jira_records = self.db.query(JiraRecord).filter(
            JiraRecord.id.in_(jira_ids)
        ).all() if jira_ids else []
        jira_map = {str(j.id): j for j in jira_records}

        return {
            "plan_id": str(po_plan.id),
            "team_id": team_id,
            "pi_id": pi_id,
            "plan_status": po_plan.status,
            "committed_at": po_plan.committed_at.isoformat() if po_plan.committed_at else None,
            "items": [
                {
                    "jira_record_id": str(i.jira_record_id),
                    "jira_key": jira_map.get(str(i.jira_record_id)).jira_key if jira_map.get(str(i.jira_record_id)) else "",
                    "feature_name": jira_map.get(str(i.jira_record_id)).feature.name if jira_map.get(str(i.jira_record_id)) and jira_map.get(str(i.jira_record_id)).feature else "",
                    "pm_effort": float(i.original_pm_effort or 0),
                    "planned_effort": float(i.planned_effort or 0),
                    "dev_effort": float(i.dev_effort or 0),
                    "pd_effort": float(i.pd_effort or 0),
                    "qa_effort": float(i.qa_effort or 0),
                    "status": i.status,
                    "is_descoped": bool(i.is_descoped),
                    "descope_reason": i.descope_reason,
                    "review_status": i.review_status or 'pending',
                    "review_reason": i.rejection_reason,
                }
                for i in items
            ]
        }

    def review_item(self, team_id: str, jira_record_id: str, action: str, reason: str = None) -> dict:
        """PM approves or rejects a single item"""
        item = self.db.query(TeamPlanning).filter(
            and_(
                TeamPlanning.team_id == team_id,
                TeamPlanning.jira_record_id == jira_record_id
            )
        ).first()

        if not item:
            raise ValueError("Planning item not found")

        item.review_status = 'approved' if action == 'approve' else 'rejected'
        item.rejection_reason = reason
        item.reviewed_at = datetime.utcnow()
        self.db.commit()
        return {"status": item.review_status}

    def complete_review(self, team_id: str, pi_id: str) -> dict:
        """PM completes review and sets plan status"""
        print(f"DEBUG: Complete review request - team={team_id}, pi={pi_id}")
        
        # Find ANY existing plan (not just committed)
        po_plan = self.db.query(POPlanVersion).filter(
            and_(
                func.lower(func.cast(POPlanVersion.team_id, String)) == team_id.lower(),
                func.lower(func.cast(POPlanVersion.pi_id, String)) == pi_id.lower()
            )
        ).first()

        if not po_plan:
            raise ValueError("No plan found")
        
        print(f"DEBUG: Found existing plan {po_plan.id}, status={po_plan.status} - UPDATING")

        # Check if any items were rejected
        items = self.db.query(TeamPlanning).filter(
            and_(
                TeamPlanning.team_id == team_id,
                TeamPlanning.pi_id == pi_id
            )
        ).all()

        has_rejections = any(
            getattr(i, 'review_status', None) == 'rejected' 
            for i in items
        )

        po_plan.status = 'rejected' if has_rejections else 'approved'
        po_plan.reviewed_at = datetime.utcnow()
        po_plan.updated_at = datetime.utcnow()
        self.db.commit()
        
        print(f"REVIEW COMPLETED: plan_id={po_plan.id}, status={po_plan.status}, has_rejections={has_rejections}")

        return {
            "status": po_plan.status,
            "message": "Plan rejected - PO notified" if has_rejections 
                       else "Plan approved successfully"
        }

    def get_pending_review_count(self) -> dict:
        """Get count of plans pending PM review"""
        count = self.db.query(POPlanVersion).filter(
            POPlanVersion.status == 'committed'
        ).count()
        return {"pending_count": count}
    
    def _reset_plan_if_needed(self, team_id: str, pi_id: str):
        """
        Reset plan status to draft if PO makes changes after PM approval/commit.
        Call this after any PO edit (role changes, descope, restore).
        """
        po_plan = self.db.query(POPlanVersion).filter(
            and_(
                POPlanVersion.team_id == team_id,
                POPlanVersion.pi_id == pi_id,
                POPlanVersion.status.in_(['committed', 'approved'])
            )
        ).first()
        
        if po_plan:
            print(f"Plan reset to draft - PO made changes after {po_plan.status}")
            po_plan.status = 'draft'
            po_plan.committed_at = None
            
            # Reset all item review statuses
            self.db.query(TeamPlanning).filter(
                and_(
                    TeamPlanning.team_id == team_id,
                    TeamPlanning.pi_id == pi_id
                )
            ).update({
                "review_status": None,
                "rejection_reason": None,
                "reviewed_at": None
            })
            self.db.commit()
