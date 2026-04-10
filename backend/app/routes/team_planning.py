"""
Team Planning API Routes - Phase 5A

CRITICAL BUSINESS RULES:
1. Status is auto-calculated, never manually set
2. Capacity thresholds: <95% green, 95-100% amber, >100% red
3. No locking after approval
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas.team_planning import (
    TeamPlanningCreate,
    TeamPlanningUpdate,
    TeamPlanningResponse,
    TeamPlanningListResponse,
    CapacityResponse,
    DescopeRequest,
    RestoreRequest,
    CommitPlanRequest,
    CommitPlanResponse,
    AcknowledgeOrphanRequest
)
from app.services.team_planning_service import TeamPlanningService
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Team Planning"])


def _normalize_optional_version_id(version_id: Optional[str]) -> Optional[str]:
    """Normalize empty/invalid version_id query parameter values to None."""
    if version_id is None:
        return None

    normalized = version_id.strip()
    if normalized == "" or normalized.lower() in {"undefined", "null"}:
        return None

    return normalized


@router.get("/teams/{team_id}/planning", response_model=TeamPlanningListResponse)
def get_team_planning(
    team_id: str,
    pi_id: str = Query(..., description="PI UUID"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Get team's planning items for a PI.
    
    Returns:
    - Team, PI information
    - Capacity status (with correct thresholds)
    - Planning items (including orphaned)
    - Summary by status
    
    Automatically creates or uses single draft plan for this team+PI.
    """
    # PO can only access their assigned teams
    from app.dependencies.auth import check_team_access
    check_team_access(team_id, current_user, db)

    try:
        print(f"DEBUG planning: team={team_id}, pi={pi_id}")
        
        service = TeamPlanningService(db)
        
        # Get or create single draft plan for this team+PI
        from app.models.team_planning import POPlanVersion
        from sqlalchemy.exc import IntegrityError
        from sqlalchemy import func, String, and_
        import uuid
        from datetime import datetime
        
        team_id_lower = team_id.lower()
        pi_id_lower = pi_id.lower()
        
        # Check for ANY existing plan (draft, committed, approved) to avoid UNIQUE constraint
        po_plan = db.query(POPlanVersion).filter(
            and_(
                func.lower(func.cast(POPlanVersion.team_id, String)) == team_id_lower,
                func.lower(func.cast(POPlanVersion.pi_id, String)) == pi_id_lower
            )
        ).first()

        if not po_plan:
            try:
                po_plan = POPlanVersion(
                    id=str(uuid.uuid4()),
                    team_id=team_id,
                    pi_id=pi_id,
                    status='draft',
                    version_number=1,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(po_plan)
                db.commit()
                db.refresh(po_plan)
            except IntegrityError:
                # Race condition - another request created it
                db.rollback()
                po_plan = db.query(POPlanVersion).filter(
                    and_(
                        func.lower(func.cast(POPlanVersion.team_id, String)) == team_id_lower,
                        func.lower(func.cast(POPlanVersion.pi_id, String)) == pi_id_lower
                    )
                ).first()
                if not po_plan:
                    raise ValueError("Failed to get or create plan version")
        
        items = service.get_team_planning_items(team_id, pi_id, po_plan.id)
        capacity = service.get_team_capacity(team_id, pi_id)
        summary = service.get_planning_summary(team_id, pi_id, None)
        
        team_info = service.get_team_info(team_id)
        pi_info = service.get_pi_info(pi_id)
        version_info = None  # No longer using roadmap version_id
        
        # Check if draft plan is outdated
        from app.models.team_planning import POPlanVersion
        draft_plan = db.query(POPlanVersion).filter(
            POPlanVersion.team_id == team_id,
            POPlanVersion.pi_id == pi_id,
            POPlanVersion.status == 'draft'
        ).first()
        
        is_outdated = draft_plan.is_outdated if draft_plan else False
        outdated_reason = draft_plan.outdated_reason if draft_plan else None
        outdated_at = draft_plan.outdated_at.isoformat() if draft_plan and draft_plan.outdated_at else None
        
        return TeamPlanningListResponse(
            team=team_info,
            pi=pi_info,
            version=version_info,
            capacity=capacity,
            items=items,
            summary=summary,
            is_outdated=is_outdated,
            outdated_reason=outdated_reason,
            outdated_at=outdated_at
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        print(f"ERROR in get_team_planning: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get team planning: {str(e)}")


@router.get("/teams/{team_id}/capacity", response_model=CapacityResponse)
def get_team_capacity(
    team_id: str,
    pi_id: str = Query(..., description="PI UUID"),
    version_id: Optional[str] = Query(None, description="Optional roadmap version UUID"),
    db: Session = Depends(get_db)
):
    """
    Get team capacity for PI with EXACT thresholds.
    
    Thresholds:
    - < 95% = green
    - 95-100% = amber
    - > 100% = red
    """
    try:
        version_id = _normalize_optional_version_id(version_id)
        print(f"DEBUG capacity: team={team_id}, pi={pi_id}, version={version_id}")
        service = TeamPlanningService(db)
        return service.get_team_capacity(team_id, pi_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get capacity: {str(e)}")


@router.post("/planning", response_model=TeamPlanningResponse)
def create_or_update_planning(
    data: TeamPlanningCreate,
    db: Session = Depends(get_db)
):
    """
    Create or update planning record (auto-save endpoint).
    
    - Upserts based on jira_record_id + team_id + pi_id + version_id
    - Status is auto-calculated
    - Planned effort = dev + pd + qa
    """
    try:
        print(f"SAVE REQUEST: team={data.team_id}, pi={data.pi_id}, jira={data.jira_record_id}, dev={data.dev_effort}, pd={data.pd_effort}, qa={data.qa_effort}, plan_version_id={data.po_plan_version_id}")
        service = TeamPlanningService(db)
        # TODO: Get user_id from auth context
        user_id = "system"  # Placeholder
        return service.create_or_update_planning(data, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save planning: {str(e)}")


@router.put("/planning/{planning_id}", response_model=TeamPlanningResponse)
def update_planning(
    planning_id: str,
    data: TeamPlanningUpdate,
    db: Session = Depends(get_db)
):
    """Update existing planning record."""
    try:
        service = TeamPlanningService(db)
        planning = db.query(service.db.query(TeamPlanning).filter(TeamPlanning.id == planning_id).first())
        
        if not planning:
            raise HTTPException(status_code=404, detail="Planning item not found")
        
        # Update fields
        if data.dev_effort is not None:
            planning.dev_effort = data.dev_effort
        if data.pd_effort is not None:
            planning.pd_effort = data.pd_effort
        if data.qa_effort is not None:
            planning.qa_effort = data.qa_effort
        
        # Recalculate planned_effort and status
        planning.planned_effort = planning.dev_effort + planning.pd_effort + planning.qa_effort
        planning.status = service.calculate_status(planning)
        
        db.commit()
        db.refresh(planning)
        return planning
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update planning: {str(e)}")


@router.post("/teams/{team_id}/planning/{jira_record_id}/descope", response_model=TeamPlanningResponse)
def descope_item(
    team_id: str,
    jira_record_id: str,
    data: DescopeRequest,
    db: Session = Depends(get_db)
):
    """
    Descope a planning item.
    
    - Requires reason (10-500 chars)
    - Sets status to "descope_proposed"
    - Excluded from capacity calculation
    """
    try:
        if len(data.reason.strip()) < 10:
            raise HTTPException(status_code=400, detail="Reason must be at least 10 characters")
        
        service = TeamPlanningService(db)
        user_id = "system"  # TODO: Get user_id from auth context
        return service.descope_item_by_jira(team_id, jira_record_id, data.reason, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        print(f"DESCOPE ERROR: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to descope item: {str(e)}")


@router.post("/teams/{team_id}/planning/{jira_record_id}/restore", response_model=TeamPlanningResponse)
def restore_item(
    team_id: str,
    jira_record_id: str,
    db: Session = Depends(get_db)
):
    """
    Restore a descoped item.
    
    - Removes descope flag
    - Recalculates status
    - Included in capacity calculation
    """
    try:
        service = TeamPlanningService(db)
        user_id = "system"  # TODO: Get user_id from auth context
        return service.restore_item_by_jira(team_id, jira_record_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        print(f"RESTORE ERROR: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to restore item: {str(e)}")


@router.post("/teams/{team_id}/plan-versions/{version_id}/commit")
def commit_plan_version(
    team_id: str,
    version_id: str,
    pi_id: str = Query(..., description="PI UUID"),
    db: Session = Depends(get_db)
):
    """
    Commit a specific PO plan version for PM review.
    
    Business Rules:
    - Only ONE version can be committed at a time
    - Other drafts remain as drafts (not submitted)
    - All items in the version must have role breakdown
    """
    try:
        from app.models.team_planning import POPlanVersion
        from datetime import datetime
        
        # Get the plan version
        plan_version = db.query(POPlanVersion).filter(
            POPlanVersion.id == version_id,
            POPlanVersion.team_id == team_id,
            POPlanVersion.pi_id == pi_id
        ).first()
        
        if not plan_version:
            raise HTTPException(status_code=404, detail="Plan version not found")
        
        if plan_version.status != 'draft':
            raise HTTPException(status_code=400, detail=f"Cannot commit version with status: {plan_version.status}")
        
        # Check if another version is already committed
        existing_committed = db.query(POPlanVersion).filter(
            POPlanVersion.team_id == team_id,
            POPlanVersion.pi_id == pi_id,
            POPlanVersion.status == 'committed',
            POPlanVersion.id != version_id
        ).first()
        
        if existing_committed:
            raise HTTPException(
                status_code=400,
                detail="Another plan version is already submitted for review. Wait for PM review before submitting a new version."
            )
        
        # Update version status to committed
        plan_version.status = 'committed'
        plan_version.committed_at = datetime.utcnow()
        plan_version.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(plan_version)
        
        return {
            "id": plan_version.id,
            "version_number": plan_version.version_number,
            "status": plan_version.status,
            "committed_at": plan_version.committed_at,
            "message": f"Plan v{plan_version.version_number} submitted for PM review"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to commit plan version: {str(e)}")


@router.post("/planning/{planning_id}/acknowledge-orphan")
def acknowledge_orphan(
    planning_id: str,
    db: Session = Depends(get_db)
):
    """
    Acknowledge and archive orphaned item.
    
    - Item kept for audit trail
    - Excluded from active planning
    - Must be acknowledged before commit
    """
    try:
        service = TeamPlanningService(db)
        # TODO: Get user_id from auth context
        user_id = "system"  # Placeholder
        return service.acknowledge_orphan(planning_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to acknowledge orphan: {str(e)}")


@router.post("/teams/{team_id}/planning/commit")
def commit_plan(
    team_id: str,
    data: CommitPlanRequest,
    db: Session = Depends(get_db)
):
    """
    Commit plan for PM review.
    
    Commits the single draft plan for this team+PI.
    Validates that all items have role breakdown.
    """
    try:
        print(f"DEBUG: Commit request - team={team_id}, pi={data.pi_id}")
        
        service = TeamPlanningService(db)
        result = service.commit_plan(team_id, data.pi_id)
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        print(f"COMMIT ERROR: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to commit plan: {str(e)}")


@router.get("/teams/{team_id}/planning/versions")
def get_plan_versions(
    team_id: str,
    pi_id: str = Query(..., description="PI UUID"),
    db: Session = Depends(get_db)
):
    """
    Get PO's draft plan versions (max 2).
    
    Returns list of plan versions with status.
    """
    try:
        from app.models.team_planning import POPlanVersion
        
        versions = db.query(POPlanVersion).filter(
            POPlanVersion.team_id == team_id,
            POPlanVersion.pi_id == pi_id
        ).order_by(POPlanVersion.created_at.desc()).all()
        
        return {
            "versions": [
                {
                    "id": v.id,
                    "version_number": v.version_number,
                    "status": v.status,
                    "committed_at": v.committed_at,
                    "created_at": v.created_at
                }
                for v in versions
            ],
            "count": len(versions),
            "max_allowed": 2
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get plan versions: {str(e)}")


@router.post("/teams/{team_id}/plan-versions/new")
def create_new_draft_version(
    team_id: str,
    pi_id: str = Query(..., description="PI UUID"),
    db: Session = Depends(get_db)
):
    """
    Create a new draft plan version.
    
    Business Rules:
    - Max 2 draft versions per team/PI
    - Cannot create new draft if one is already committed (pending PM review)
    - Auto-increments version_number
    """
    try:
        from app.models.team_planning import POPlanVersion
        from datetime import datetime
        import uuid
        
        # Check existing versions
        existing_versions = db.query(POPlanVersion).filter(
            POPlanVersion.team_id == team_id,
            POPlanVersion.pi_id == pi_id
        ).all()
        
        # Check if max 2 versions already exist
        if len(existing_versions) >= 2:
            raise HTTPException(
                status_code=400,
                detail="Maximum 2 draft versions allowed. Delete or commit an existing version first."
            )
        
        # Check if any version is committed (pending PM review)
        if any(v.status == 'committed' for v in existing_versions):
            raise HTTPException(
                status_code=400,
                detail="Cannot create new draft while a version is pending PM review."
            )
        
        # Determine next version number
        next_version_number = max([v.version_number for v in existing_versions], default=0) + 1
        
        if next_version_number > 2:
            raise HTTPException(
                status_code=400,
                detail="Version number cannot exceed 2."
            )
        
        # Create new draft version
        new_version = POPlanVersion(
            id=str(uuid.uuid4()),
            team_id=team_id,
            pi_id=pi_id,
            version_number=next_version_number,
            status='draft',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(new_version)
        db.commit()
        db.refresh(new_version)
        
        return {
            "id": new_version.id,
            "version_number": new_version.version_number,
            "status": new_version.status,
            "created_at": new_version.created_at,
            "message": f"Draft v{next_version_number} created successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create plan version: {str(e)}")
