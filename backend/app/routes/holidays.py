"""
Holiday API routes.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.holiday import (
    HolidayCreate,
    HolidayUpdate,
    HolidayResponse,
    HolidayListResponse,
    HolidayImportRequest
)
from app.services.holiday_service import HolidayService

router = APIRouter(prefix="/api/holidays", tags=["holidays"])


@router.get("", response_model=HolidayListResponse)
def list_holidays(
    year: int = Query(..., ge=2020, le=2100),
    country_id: Optional[str] = Query(None),
    team_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List holidays for a year, optionally filtered by country."""
    holidays, total = HolidayService.get_all(db, year, country_id=country_id, team_id=team_id)
    return HolidayListResponse(
        data=[HolidayService.build_holiday_response(h) for h in holidays],
        total=total
    )


@router.post("", response_model=HolidayResponse, status_code=status.HTTP_201_CREATED)
def create_holiday(data: HolidayCreate, db: Session = Depends(get_db)):
    """Create a holiday."""
    holiday = HolidayService.create(db, data)
    return HolidayService.build_holiday_response(holiday)


@router.get("/{holiday_id}", response_model=HolidayResponse)
def get_holiday(holiday_id: str, db: Session = Depends(get_db)):
    """Get a holiday by ID."""
    holiday = HolidayService.get_by_id(db, holiday_id)
    if not holiday:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Holiday not found"
        )
    return HolidayService.build_holiday_response(holiday)


@router.put("/{holiday_id}", response_model=HolidayResponse)
def update_holiday(holiday_id: str, data: HolidayUpdate, db: Session = Depends(get_db)):
    """Update a holiday."""
    holiday = HolidayService.update(db, holiday_id, data)
    if not holiday:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Holiday not found"
        )
    return HolidayService.build_holiday_response(holiday)


@router.delete("/{holiday_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_holiday(holiday_id: str, db: Session = Depends(get_db)):
    """Delete a holiday."""
    if not HolidayService.delete(db, holiday_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Holiday not found"
        )
    return None


@router.post("/import", response_model=HolidayListResponse)
def import_holidays(data: HolidayImportRequest, db: Session = Depends(get_db)):
    """Import holidays from country preset."""
    if data.country_code.upper() not in HolidayService.get_presets():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown country code: {data.country_code}"
        )
    
    holidays = HolidayService.import_from_preset(db, data)
    return HolidayListResponse(
        data=[HolidayService.build_holiday_response(h) for h in holidays],
        total=len(holidays)
    )


@router.get("/presets/list")
def list_presets():
    """List available country presets."""
    return {"presets": HolidayService.get_presets()}


@router.get("/templates/{country_code}")
def get_holiday_template(
    country_code: str,
    year: int = Query(..., ge=2020, le=2100)
):
    """Get holiday template for a country and year."""
    template = HolidayService.get_template(country_code.upper(), year)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No template found for country: {country_code}"
        )
    return template
