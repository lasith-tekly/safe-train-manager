"""
Member PI Allocation API routes.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.team_member import (
    MemberPIAllocationCreate, MemberPIAllocationUpdate, 
    MemberPIAllocationResponse, MemberPIAllocationListResponse,
    BulkPIAllocationCreate,
    MemberIterationProductivityCreate, MemberIterationProductivityResponse,
    BulkIterationProductivityCreate
)
from app.services.team_member_service import MemberPIAllocationService, TeamMemberService
from app.models.member_iteration_productivity import MemberIterationProductivity
from app.models.pi import Iteration

router = APIRouter(prefix="/api", tags=["pi-allocations"])


@router.get("/teams/{team_id}/pi/{pi_id}/allocations", response_model=MemberPIAllocationListResponse)
def get_team_pi_allocations(team_id: str, pi_id: str, db: Session = Depends(get_db)):
    """Get all member allocations for a team in a specific PI."""
    from app.models.team import Team
    from app.models.pi import PI, Iteration
    from app.models.holiday import Holiday
    from app.models.organization import Site
    from app.schemas.team_member import PIIterationSummary
    from datetime import timedelta
    
    allocations = MemberPIAllocationService.get_by_team_pi(db, team_id, pi_id)
    
    # Get PI summary data
    team = db.query(Team).filter(Team.id == team_id).first()
    pi = db.query(PI).filter(PI.id == pi_id).first()
    
    site_holidays_count = 0
    iteration_working_days = []
    
    if team and pi:
        # Calculate iteration working days
        iterations = db.query(Iteration).filter(Iteration.pi_id == pi_id).order_by(Iteration.start_date).all()
        for iteration in iterations:
            if iteration.start_date and iteration.end_date:
                working_days = 0
                current = iteration.start_date
                while current <= iteration.end_date:
                    if current.weekday() < 5:  # Mon-Fri
                        working_days += 1
                    current += timedelta(days=1)
                iteration_working_days.append(PIIterationSummary(
                    iteration_name=iteration.name,
                    working_days=working_days
                ))
        
        # Get site-level holidays count
        if team.site_id:
            site = db.query(Site).filter(Site.id == team.site_id).first()
            holidays_query = db.query(Holiday).filter(
                Holiday.date >= pi.start_date,
                Holiday.date <= pi.end_date
            )
            
            if site and site.country_id:
                holidays = holidays_query.filter(
                    (Holiday.country_id == site.country_id) | (Holiday.team_id == team.id)
                ).all()
            else:
                holidays = holidays_query.filter(Holiday.team_id == team.id).all()
            
            site_holidays_count = len(holidays)
    
    return MemberPIAllocationListResponse(
        data=allocations, 
        total=len(allocations),
        site_holidays_count=site_holidays_count,
        iteration_working_days=iteration_working_days
    )


@router.get("/members/{member_id}/pi-allocations", response_model=MemberPIAllocationListResponse)
def get_member_pi_allocations(member_id: str, db: Session = Depends(get_db)):
    """Get all PI allocations for a member."""
    member = TeamMemberService.get_by_id(db, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    allocations = MemberPIAllocationService.get_by_member(db, member_id)
    return MemberPIAllocationListResponse(data=allocations, total=len(allocations))


@router.post("/members/{member_id}/pi/{pi_id}/allocation", response_model=MemberPIAllocationResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_pi_allocation(
    member_id: str, 
    pi_id: str, 
    data: MemberPIAllocationCreate, 
    db: Session = Depends(get_db)
):
    """Create or update a PI allocation for a member."""
    try:
        # Ensure member_id and pi_id match
        data.member_id = member_id
        data.pi_id = pi_id
        return MemberPIAllocationService.create_or_update(db, member_id, pi_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/teams/{team_id}/pi/{pi_id}/allocations/bulk", response_model=MemberPIAllocationListResponse)
def bulk_create_pi_allocations(
    team_id: str,
    pi_id: str,
    data: BulkPIAllocationCreate,
    db: Session = Depends(get_db)
):
    """Bulk create/update PI allocations for a team."""
    results = []
    for alloc_data in data.allocations:
        alloc_data.pi_id = pi_id
        try:
            result = MemberPIAllocationService.create_or_update(
                db, alloc_data.member_id, pi_id, alloc_data
            )
            results.append(result)
        except ValueError:
            continue  # Skip invalid members
    
    return MemberPIAllocationListResponse(data=results, total=len(results))


@router.delete("/pi-allocations/{allocation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pi_allocation(allocation_id: str, db: Session = Depends(get_db)):
    """Delete a PI allocation."""
    if not MemberPIAllocationService.delete(db, allocation_id):
        raise HTTPException(status_code=404, detail="Allocation not found")


# ============================================
# Iteration Productivity Endpoints
# ============================================

@router.get("/teams/{team_id}/pi/{pi_id}/iteration-productivity", response_model=List[MemberIterationProductivityResponse])
def get_team_iteration_productivity(team_id: str, pi_id: str, db: Session = Depends(get_db)):
    """Get all iteration productivity overrides for a team in a specific PI."""
    from app.models.team import TeamMember, TeamStatus
    
    # Get team members
    members = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.status == TeamStatus.ACTIVE
    ).all()
    member_ids = [m.id for m in members]
    
    # Get iterations for this PI
    iterations = db.query(Iteration).filter(Iteration.pi_id == pi_id).all()
    iteration_ids = [it.id for it in iterations]
    
    # Get productivity records
    records = db.query(MemberIterationProductivity).filter(
        MemberIterationProductivity.member_id.in_(member_ids),
        MemberIterationProductivity.iteration_id.in_(iteration_ids)
    ).all()
    
    return [MemberIterationProductivityResponse.model_validate(r) for r in records]


@router.post("/teams/{team_id}/iteration-productivity/bulk", response_model=List[MemberIterationProductivityResponse])
def bulk_create_iteration_productivity(
    team_id: str,
    data: BulkIterationProductivityCreate,
    db: Session = Depends(get_db)
):
    """Bulk create/update iteration productivity for a team."""
    results = []
    
    for item in data.items:
        # Check if record exists
        existing = db.query(MemberIterationProductivity).filter(
            MemberIterationProductivity.member_id == item.member_id,
            MemberIterationProductivity.iteration_id == item.iteration_id
        ).first()
        
        if existing:
            # Update existing
            existing.productivity_percent = item.productivity_percent
            db.commit()
            db.refresh(existing)
            results.append(MemberIterationProductivityResponse.model_validate(existing))
        else:
            # Create new
            new_record = MemberIterationProductivity(
                member_id=item.member_id,
                iteration_id=item.iteration_id,
                productivity_percent=item.productivity_percent
            )
            db.add(new_record)
            db.commit()
            db.refresh(new_record)
            results.append(MemberIterationProductivityResponse.model_validate(new_record))
    
    return results


@router.delete("/iteration-productivity/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_iteration_productivity(record_id: str, db: Session = Depends(get_db)):
    """Delete an iteration productivity override (revert to PI default)."""
    record = db.query(MemberIterationProductivity).filter(
        MemberIterationProductivity.id == record_id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    db.delete(record)
    db.commit()
