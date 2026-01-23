"""
Member Leave API routes.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.team import TeamMember
from app.schemas.holiday import (
    MemberLeaveCreate,
    MemberLeaveResponse
)
from app.services.holiday_service import MemberLeaveService

router = APIRouter(prefix="/api/members", tags=["member-leaves"])


@router.get("/{member_id}/leaves", response_model=List[MemberLeaveResponse])
def list_member_leaves(
    member_id: str,
    year: Optional[int] = Query(None, ge=2020, le=2100),
    db: Session = Depends(get_db)
):
    """List leaves for a member."""
    # Verify member exists
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found"
        )
    
    leaves = MemberLeaveService.get_all(db, member_id, year)
    return [MemberLeaveService.build_leave_response(leave) for leave in leaves]


@router.post("/{member_id}/leaves", response_model=MemberLeaveResponse, status_code=status.HTTP_201_CREATED)
def create_leave(member_id: str, data: MemberLeaveCreate, db: Session = Depends(get_db)):
    """Add leave for a member."""
    # Verify member exists
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found"
        )
    
    leave = MemberLeaveService.create(db, member_id, data)
    return MemberLeaveService.build_leave_response(leave)


@router.put("/{member_id}/leaves/{leave_id}", response_model=MemberLeaveResponse)
def update_leave(
    member_id: str,
    leave_id: str,
    data: MemberLeaveCreate,
    db: Session = Depends(get_db)
):
    """Update a leave."""
    leave = MemberLeaveService.get_by_id(db, leave_id)
    if not leave or leave.member_id != member_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave not found"
        )
    
    updated = MemberLeaveService.update(db, leave_id, data)
    return MemberLeaveService.build_leave_response(updated)


@router.delete("/{member_id}/leaves/{leave_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_leave(member_id: str, leave_id: str, db: Session = Depends(get_db)):
    """Delete a leave."""
    leave = MemberLeaveService.get_by_id(db, leave_id)
    if not leave or leave.member_id != member_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave not found"
        )
    
    MemberLeaveService.delete(db, leave_id)
    return None
