"""
Iteration Capacity API routes.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.team import Team
from app.models.pi import Iteration
from app.schemas.iteration_capacity import (
    TeamIterationCapacityResponse,
    CapacitySummaryResponse,
    CapacityOverrideRequest,
    IterationCapacityResponse
)
from app.services.iteration_capacity_service import IterationCapacityService

router = APIRouter(prefix="/api/capacity", tags=["capacity"])


@router.get("/summary", response_model=CapacitySummaryResponse)
def get_capacity_summary(
    year: int = Query(..., ge=2020, le=2100),
    pi_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get capacity summary for all teams."""
    summary = IterationCapacityService.get_capacity_summary(db, year, pi_id)
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No PI found for the specified year"
        )
    return summary


@router.get("/teams/{team_id}/iterations", response_model=TeamIterationCapacityResponse)
def get_team_iteration_capacity(
    team_id: str,
    pi_id: str = Query(...),
    db: Session = Depends(get_db)
):
    """Get team capacity by iteration."""
    result = IterationCapacityService.get_team_iteration_capacity(db, team_id, pi_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team or PI not found"
        )
    return result


@router.post("/teams/{team_id}/calculate")
def calculate_team_capacity(
    team_id: str,
    pi_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Recalculate team capacity for all iterations."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    capacities = IterationCapacityService.calculate_and_store_team_capacity(db, team_id, pi_id)
    return {"message": f"Calculated capacity for {len(capacities)} iterations"}


@router.put("/teams/{team_id}/iterations/{iteration_id}", response_model=IterationCapacityResponse)
def override_capacity(
    team_id: str,
    iteration_id: str,
    data: CapacityOverrideRequest,
    db: Session = Depends(get_db)
):
    """Override calculated capacity with manual value."""
    # Verify team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Verify iteration exists
    iteration = db.query(Iteration).filter(Iteration.id == iteration_id).first()
    if not iteration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Iteration not found"
        )
    
    cap = IterationCapacityService.override_capacity(
        db, team_id, iteration_id, data.manual_override, data.override_reason
    )
    
    return IterationCapacityResponse(
        iteration_id=iteration.id,
        iteration_name=iteration.name,
        iteration_sequence=iteration.sequence,
        start_week=iteration.start_week,
        end_week=iteration.end_week,
        is_ip=iteration.is_ip_iteration,
        calculated_capacity=float(cap.calculated_capacity),
        manual_override=float(cap.manual_override) if cap.manual_override else None,
        override_reason=cap.override_reason,
        final_capacity=cap.final_capacity,
        allocated=float(cap.allocated),
        available=cap.available,
        utilization=cap.utilization
    )


@router.delete("/teams/{team_id}/iterations/{iteration_id}/override", status_code=status.HTTP_204_NO_CONTENT)
def reset_capacity_override(
    team_id: str,
    iteration_id: str,
    db: Session = Depends(get_db)
):
    """Reset to calculated capacity."""
    if not IterationCapacityService.reset_override(db, team_id, iteration_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Capacity record not found"
        )
    return None
