"""
PI and Iteration API routes.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.schemas.pi import (
    PICreate,
    PIUpdate,
    PIResponse,
    PIListResponse,
    PIGenerateRequest,
    IterationCreate,
    IterationUpdate,
    IterationResponse,
    CascadePreviewResponse,
    CascadeApplyRequest
)
from app.services.pi_service import PIService, IterationService

router = APIRouter(prefix="/api/pis", tags=["pis"])


@router.get("", response_model=PIListResponse)
def list_pis(
    year: Optional[int] = Query(None, ge=2020, le=2100),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all PIs (optionally filtered by year) with their iterations."""
    pis, total = PIService.get_all(db, year, status)
    return PIListResponse(
        data=[PIService.build_pi_response(pi) for pi in pis],
        total=total
    )


@router.post("", response_model=PIResponse, status_code=status.HTTP_201_CREATED)
def create_pi(
    data: PICreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Create a new PI with iterations."""
    # Check for overlapping PIs
    if PIService.check_overlap(db, data.year, data.start_date, data.end_date):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PI dates overlap with an existing PI"
        )
    
    pi = PIService.create(db, data)
    return PIService.build_pi_response(pi)


@router.get("/{pi_id}", response_model=PIResponse)
def get_pi(
    pi_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a PI with all iterations."""
    pi = PIService.get_by_id(db, pi_id)
    if not pi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PI not found"
        )
    return PIService.build_pi_response(pi)


@router.put("/{pi_id}", response_model=PIResponse)
def update_pi(
    pi_id: str,
    data: PIUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Update PI details."""
    pi = PIService.get_by_id(db, pi_id)
    if not pi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PI not found"
        )
    
    # Check for overlapping if dates are changing
    if data.start_date or data.end_date:
        start = data.start_date or pi.start_date
        end = data.end_date or pi.end_date
        if PIService.check_overlap(db, pi.year, start, end, exclude_id=pi_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PI dates overlap with an existing PI"
            )
    
    updated = PIService.update(db, pi_id, data)
    return PIService.build_pi_response(updated)


@router.delete("/{pi_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pi(
    pi_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Delete PI and all iterations."""
    if not PIService.delete(db, pi_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PI not found"
        )
    return None


@router.post("/generate", response_model=PIListResponse)
def generate_pis(
    data: PIGenerateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Generate PIs from template."""
    # Check if PIs already exist for this year
    existing, _ = PIService.get_all(db, data.year)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PIs already exist for year {data.year}. Delete them first."
        )
    
    pis = PIService.generate_from_template(db, data)
    return PIListResponse(
        data=[PIService.build_pi_response(pi) for pi in pis],
        total=len(pis)
    )


# Iteration endpoints

@router.post("/{pi_id}/iterations", response_model=IterationResponse, status_code=status.HTTP_201_CREATED)
def add_iteration(
    pi_id: str,
    data: IterationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Add iteration to PI."""
    iteration = IterationService.add_to_pi(db, pi_id, data)
    if not iteration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PI not found"
        )
    return IterationService.build_iteration_response(iteration)


@router.put("/iterations/{iteration_id}", response_model=IterationResponse)
def update_iteration(
    iteration_id: str,
    data: IterationUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Update iteration with partial data."""
    iteration = IterationService.update(db, iteration_id, data)
    if not iteration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Iteration not found"
        )
    return IterationService.build_iteration_response(iteration)


@router.delete("/iterations/{iteration_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_iteration(
    iteration_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Delete iteration."""
    if not IterationService.delete(db, iteration_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Iteration not found"
        )
    return None


@router.post("/{pi_id}/recalculate", response_model=PIResponse)
def recalculate_pi(
    pi_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Recalculate PI dates based on iterations and resequence."""
    pi = PIService.get_by_id(db, pi_id)
    if not pi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PI not found"
        )
    
    # Resequence iterations by start date
    PIService.resequence_iterations(db, pi_id)
    # Recalculate PI dates
    pi = PIService.recalculate_pi_dates(db, pi_id)
    
    return PIService.build_pi_response(pi)


@router.post("/{pi_id}/commit", response_model=PIResponse)
def commit_pi(
    pi_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Commit a draft PI to lock it."""
    try:
        pi = PIService.commit_pi(db, pi_id)
        if not pi:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PI not found"
            )
        return PIService.build_pi_response(pi)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{pi_id}/uncommit", response_model=PIResponse)
def uncommit_pi(
    pi_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Revert a committed PI back to draft."""
    try:
        pi = PIService.uncommit_pi(db, pi_id)
        if not pi:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PI not found"
            )
        return PIService.build_pi_response(pi)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/year/{year}/commit", response_model=PIListResponse)
def commit_year(
    year: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Commit all draft PIs for a year."""
    try:
        pis = PIService.commit_year(db, year)
        return PIListResponse(
            data=[PIService.build_pi_response(pi) for pi in pis],
            total=len(pis)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/year/{year}/uncommit", response_model=PIListResponse)
def uncommit_year(
    year: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Uncommit all committed PIs for a year back to draft."""
    try:
        pis = PIService.uncommit_year(db, year)
        return PIListResponse(
            data=[PIService.build_pi_response(pi) for pi in pis],
            total=len(pis)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/iterations/{iteration_id}/cascade-preview", response_model=CascadePreviewResponse)
def get_cascade_preview(
    iteration_id: str,
    new_duration_weeks: int = Query(..., ge=1, le=4),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Preview cascade impact of changing iteration duration."""
    preview = PIService.get_cascade_preview(db, iteration_id, new_duration_weeks)
    if not preview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Iteration not found"
        )
    return preview


@router.post("/cascade-apply", response_model=PIResponse)
def apply_cascade(
    data: CascadeApplyRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Apply cascade changes to iteration and optionally following PIs."""
    pi = PIService.apply_cascade(db, data)
    if not pi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Iteration not found"
        )
    return PIService.build_pi_response(pi)


@router.post("/realign-working-days/{year}", response_model=PIListResponse)
def realign_working_days(
    year: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Realign all PIs and iterations for a year to respect working days.
    
    This fixes existing PIs that may have dates on non-working days (weekends).
    All dates will be adjusted to fall on configured working days.
    """
    pis = PIService.realign_to_working_days(db, year)
    if not pis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No PIs found for year {year}"
        )
    return PIListResponse(
        data=[PIService.build_pi_response(pi) for pi in pis],
        total=len(pis)
    )
