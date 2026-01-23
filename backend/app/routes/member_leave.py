"""
Member Leave API routes.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.team_member import (
    MemberLeaveCreate, MemberLeaveUpdate, MemberLeaveResponse, MemberLeaveListResponse
)
from app.services.team_member_service import MemberLeaveService, TeamMemberService

router = APIRouter(prefix="/api", tags=["member-leave"])


@router.get("/iterations/{iteration_id}/leave", response_model=MemberLeaveListResponse)
def get_iteration_leave(iteration_id: str, db: Session = Depends(get_db)):
    """Get all leave records for an iteration."""
    leaves = MemberLeaveService.get_by_iteration(db, iteration_id)
    return MemberLeaveListResponse(data=leaves, total=len(leaves))


@router.get("/teams/{team_id}/iterations/{iteration_id}/leave", response_model=MemberLeaveListResponse)
def get_team_iteration_leave(team_id: str, iteration_id: str, db: Session = Depends(get_db)):
    """Get leave records for a specific team in an iteration."""
    leaves = MemberLeaveService.get_by_team_iteration(db, team_id, iteration_id)
    return MemberLeaveListResponse(data=leaves, total=len(leaves))


@router.get("/members/{member_id}/leave", response_model=MemberLeaveListResponse)
def get_member_leave(
    member_id: str,
    iteration_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get leave records for a member, optionally filtered by iteration."""
    member = TeamMemberService.get_by_id(db, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    leaves = MemberLeaveService.get_by_member(db, member_id, iteration_id)
    return MemberLeaveListResponse(data=leaves, total=len(leaves))


@router.post("/members/{member_id}/leave", response_model=MemberLeaveResponse, status_code=status.HTTP_201_CREATED)
def create_member_leave(member_id: str, data: MemberLeaveCreate, db: Session = Depends(get_db)):
    """Create a leave record for a member."""
    member = TeamMemberService.get_by_id(db, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Ensure member_id matches
    if data.member_id != member_id:
        data.member_id = member_id
    
    return MemberLeaveService.create(db, data)


@router.put("/leave/{leave_id}", response_model=MemberLeaveResponse)
def update_leave(leave_id: str, data: MemberLeaveUpdate, db: Session = Depends(get_db)):
    """Update a leave record."""
    result = MemberLeaveService.update(db, leave_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Leave record not found")
    return result


@router.delete("/leave/{leave_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_leave(leave_id: str, db: Session = Depends(get_db)):
    """Delete a leave record."""
    if not MemberLeaveService.delete(db, leave_id):
        raise HTTPException(status_code=404, detail="Leave record not found")
