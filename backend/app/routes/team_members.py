from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlalchemy.orm import Session

from app.database import get_db
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
    db: Session = Depends(get_db)
):
    """Remove a member from a team."""
    member = TeamMemberService.get_by_id(db, member_id)
    if not member or member.team_id != team_id:
        raise HTTPException(status_code=404, detail="Member not found")
    TeamMemberService.delete(db, member_id)


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
        # Removing from first PI = never active
        # Set effective_from_pi_id to current PI and left_after to None
        # This creates an impossible range = inactive everywhere
        member.effective_from_pi_id = pi_id
        member.left_after_pi_id = None
    else:
        # Left after the previous PI
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
