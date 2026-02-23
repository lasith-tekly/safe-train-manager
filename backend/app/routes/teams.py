from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.team import Team, TeamStatus
from app.schemas.team import (
    TeamCreate,
    TeamUpdate,
    TeamResponse,
    TeamListResponse,
    TeamCapacityUpdate,
    TeamCapacityResponse
)
from app.schemas.team_capacity_detail import TeamPICapacityDetail
from app.services.team_service import TeamService

router = APIRouter(prefix="/api/teams", tags=["teams"])


@router.get("", response_model=TeamListResponse)
def list_teams(
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by name"),
    year: Optional[int] = Query(None, description="Year for capacity data"),
    pi_id: Optional[str] = Query(None, description="PI ID for member count filtering"),
    db: Session = Depends(get_db)
):
    """List all teams with optional filtering."""
    teams, total = TeamService.get_all(db, status=status, search=search, year=year, pi_id=pi_id)
    return TeamListResponse(data=teams, total=total)


@router.get("/{team_id}", response_model=TeamResponse)
def get_team(
    team_id: UUID,
    year: Optional[int] = Query(None, description="Year for capacity data"),
    db: Session = Depends(get_db)
):
    """Get a single team by ID."""
    team = TeamService.get_by_id(db, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    return TeamService.build_team_response(db, team, year)


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    data: TeamCreate,
    db: Session = Depends(get_db)
):
    """Create a new team."""
    # Check for duplicate name
    if TeamService.get_by_name(db, data.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A team with this name already exists"
        )

    # Check for duplicate short_code
    if TeamService.get_by_short_code(db, data.short_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A team with this short code already exists"
        )

    team = TeamService.create(db, data)
    year = data.capacity.year if data.capacity else None
    return TeamService.build_team_response(db, team, year)


@router.put("/{team_id}", response_model=TeamResponse)
def update_team(
    team_id: UUID,
    data: TeamUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing team."""
    team = TeamService.get_by_id(db, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    # Check name uniqueness if changing
    if data.name and data.name.strip().lower() != team.name.lower():
        if TeamService.get_by_name(db, data.name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A team with this name already exists"
            )

    # Check short_code uniqueness if changing
    if data.short_code and data.short_code.upper().strip() != team.short_code:
        if TeamService.get_by_short_code(db, data.short_code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A team with this short code already exists"
            )

    updated = TeamService.update(db, team_id, data)
    return TeamService.build_team_response(db, updated)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a team."""
    team = TeamService.get_by_id(db, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    can_delete, reason = TeamService.can_delete(db, team_id)
    if not can_delete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete: {reason}"
        )

    TeamService.delete(db, team_id)
    return None


@router.get("/{team_id}/capacity/summary")
def get_team_capacity_summary(
    team_id: UUID,
    pi_id: Optional[str] = Query(None, description="PI ID for PI-specific allocations"),
    db: Session = Depends(get_db)
):
    """Get team capacity summary with role breakdown and allocation categories."""
    from app.services.capacity_calculator import CapacityCalculator
    
    team = TeamService.get_by_id(db, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    return CapacityCalculator.calculate_team_capacity_summary(db, team, pi_id)


@router.get("/{team_id}/capacity/{year}", response_model=TeamCapacityResponse)
def get_team_capacity(
    team_id: UUID,
    year: int,
    db: Session = Depends(get_db)
):
    """Get team capacity for a specific year."""
    team = TeamService.get_by_id(db, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    capacity = TeamService.get_capacity(db, team_id, year)
    return TeamService.build_capacity_response(db, team_id, capacity, year)


@router.put("/{team_id}/capacity/{year}", response_model=TeamCapacityResponse)
def update_team_capacity(
    team_id: UUID,
    year: int,
    data: TeamCapacityUpdate,
    db: Session = Depends(get_db)
):
    """Update team capacity for a specific year."""
    team = TeamService.get_by_id(db, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    capacity = TeamService.update_capacity(db, team_id, year, data)
    return TeamService.build_capacity_response(db, team_id, capacity, year)


@router.get("/{team_id}/capacity/pi/{pi_id}", response_model=TeamPICapacityDetail)
def get_team_pi_capacity_detail(
    team_id: UUID,
    pi_id: UUID,
    db: Session = Depends(get_db)
):
    """Get comprehensive team capacity detail for a specific PI.
    
    Returns detailed capacity breakdown including:
    - Summary (total days, member counts by role)
    - Capacity by role (developer, PD, QA)
    - Allocation summary by category
    - Allocation breakdown by role and category
    - Iteration-level capacity details
    - Member-level capacity details
    """
    try:
        return TeamService.get_pi_capacity_detail(db, team_id, pi_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
