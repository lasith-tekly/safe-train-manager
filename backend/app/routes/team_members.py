from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, String

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.team_member import (
    TeamMemberCreate, TeamMemberUpdate, TeamMemberResponse,
    MemberAvailabilityUpdate, MemberAvailabilityResponse,
    MemberCapacityResponse, MemberAvailabilityCreate
)
from app.services.team_member_service import TeamMemberService
from app.services.capacity_calculator import CapacityCalculator

router = APIRouter(prefix="/api/teams/{team_id}/members", tags=["team-members"])


@router.get("", response_model=List[TeamMemberResponse])
def list_team_members(
    team_id: str,
    status: Optional[str] = None,
    pi_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List all members of a team with optional PI context for is_active computation."""
    return TeamMemberService.get_by_team(db, team_id, status, pi_id)


@router.post("", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
def add_team_member(
    team_id: str,
    data: TeamMemberCreate,
    db: Session = Depends(get_db)
):
    """Add a member to a team."""
    return TeamMemberService.create(db, team_id, data)


@router.get("/{member_id}", response_model=TeamMemberResponse)
def get_team_member(
    team_id: str,
    member_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific team member."""
    member = TeamMemberService.get_by_id(db, member_id)
    if not member or member.team_id != team_id:
        raise HTTPException(status_code=404, detail="Member not found")
    return TeamMemberService.build_member_response(db, member)


@router.put("/{member_id}", response_model=TeamMemberResponse)
def update_team_member(
    team_id: str,
    member_id: str,
    data: TeamMemberUpdate,
    db: Session = Depends(get_db)
):
    """Update a team member."""
    member = TeamMemberService.get_by_id(db, member_id)
    if not member or member.team_id != team_id:
        raise HTTPException(status_code=404, detail="Member not found")
    return TeamMemberService.update(db, member_id, data)


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    team_id: str,
    member_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Remove a member from a team."""
    # Check permissions
    if current_user.role not in ("admin", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can remove team members"
        )

    # Verify member exists and belongs to team
    member = TeamMemberService.get_by_id(db, member_id)
    if not member or member.team_id != team_id:
        raise HTTPException(status_code=404, detail="Member not found")

    # Attempt deletion with error handling
    try:
        TeamMemberService.delete(db, member_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{member_id}/remove-from-pi")
def remove_member_from_pi(
    team_id: str,
    member_id: str,
    pi_id: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Soft remove: member left after the PI BEFORE the given pi_id.
    Past PI capacity preserved. No hard delete.
    """
    from app.models.team import TeamMember
    from app.models.pi import PI
    from pydantic import BaseModel
    
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Validate team ownership
    if str(member.team_id).lower() != team_id.lower():
        raise HTTPException(status_code=403, detail="Member not in this team")
    
    # Get all PIs ordered by start_date
    all_pis = db.query(PI).order_by(PI.start_date).all()
    
    try:
        current_index = next(
            i for i, p in enumerate(all_pis)
            if str(p.id).lower() == pi_id.lower()
        )
    except StopIteration:
        raise HTTPException(status_code=404, detail="PI not found")
    
    if current_index == 0:
        # Removing from first PI = member was never active in this team
        # DELETE the record entirely
        db.delete(member)
        db.commit()
        return {
            "id": str(member.id),
            "name": member.name,
            "status": "deleted"
        }
    else:
        # Remove from PI X onwards = last active PI was X-1
        previous_pi = all_pis[current_index - 1]
        member.left_after_pi_id = str(previous_pi.id)
        db.commit()
        db.refresh(member)
        
        return {
            "id": str(member.id),
            "name": member.name,
            "left_after_pi_id": member.left_after_pi_id,
            "status": "removed_from_pi"
        }


@router.post("/{member_id}/re-onboard")
def re_onboard_member(
    team_id: str,
    member_id: str,
    pi_id: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Re-onboard a previously removed member from the given PI onwards.
    Clears left_after_pi_id and sets effective_from_pi_id = pi_id.
    
    Special case: if member originally had no PI scope (was a global member),
    clear BOTH fields to restore full global membership.
    """
    from app.models.team import TeamMember
    from app.models.pi import PI

    member = db.query(TeamMember).filter(
        TeamMember.id == member_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if str(member.team_id).lower() != team_id.lower():
        raise HTTPException(status_code=403, detail="Member not in this team")

    # Validate PI exists
    pi = db.query(PI).filter(
        func.lower(func.cast(PI.id, String)) == pi_id.lower()
    ).first()
    if not pi:
        raise HTTPException(status_code=404, detail="PI not found")

    # Determine if member was originally a global member
    # (effective_from_pi_id was NULL before they were removed)
    # We can infer this: if effective_from_pi_id is currently NULL,
    # they were a global member who got soft-removed (only left_after was set)
    was_global_member = member.effective_from_pi_id is None

    if was_global_member:
        # Restore to fully global - active in all PIs
        member.effective_from_pi_id = None
        member.left_after_pi_id = None
    else:
        # PI-scoped member rejoining - active from selected PI onwards
        member.effective_from_pi_id = str(pi_id)
        member.left_after_pi_id = None

    db.commit()
    db.refresh(member)

    return {
        "id": str(member.id),
        "name": member.name,
        "effective_from_pi_id": member.effective_from_pi_id,
        "left_after_pi_id": member.left_after_pi_id,
        "status": "re_onboarded"
    }


@router.get("/{member_id}/availability/{year}", response_model=List[MemberAvailabilityResponse])
def get_member_availability(
    team_id: str,
    member_id: str,
    year: int,
    db: Session = Depends(get_db)
):
    """Get member's quarterly availability for a year."""
    member = TeamMemberService.get_by_id(db, member_id)
    if not member or member.team_id != team_id:
        raise HTTPException(status_code=404, detail="Member not found")
    return TeamMemberService.get_availability(db, member_id, year)


@router.put("/{member_id}/availability/{year}/{quarter}", response_model=MemberAvailabilityResponse)
def update_member_availability(
    team_id: str,
    member_id: str,
    year: int,
    quarter: int,
    data: MemberAvailabilityUpdate,
    db: Session = Depends(get_db)
):
    """Update member's availability for a specific quarter."""
    if quarter < 1 or quarter > 4:
        raise HTTPException(status_code=400, detail="Quarter must be 1-4")
    
    member = TeamMemberService.get_by_id(db, member_id)
    if not member or member.team_id != team_id:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return TeamMemberService.update_availability(db, member_id, year, quarter, data)


@router.post("/{member_id}/availability", response_model=MemberAvailabilityResponse)
def set_member_availability(
    team_id: str,
    member_id: str,
    data: MemberAvailabilityCreate,
    db: Session = Depends(get_db)
):
    """Set availability for a specific quarter (create or update)."""
    member = TeamMemberService.get_by_id(db, member_id)
    if not member or member.team_id != team_id:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return TeamMemberService.set_availability(db, member_id, data)


@router.get("/{member_id}/capacity/{year}/{quarter}", response_model=MemberCapacityResponse)
def get_member_capacity(
    team_id: str,
    member_id: str,
    year: int,
    quarter: int,
    db: Session = Depends(get_db)
):
    """Get calculated capacity for a member for a specific quarter."""
    if quarter < 1 or quarter > 4:
        raise HTTPException(status_code=400, detail="Quarter must be 1-4")
    
    member = TeamMemberService.get_by_id(db, member_id)
    if not member or member.team_id != team_id:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return CapacityCalculator.calculate_member_quarterly_capacity(db, member, year, quarter)
