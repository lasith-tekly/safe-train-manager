"""
Site Holidays API routes.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.team_member import (
    SiteHolidayCreate, SiteHolidayUpdate, SiteHolidayResponse, SiteHolidayListResponse
)
from app.services.team_member_service import SiteHolidayService

router = APIRouter(prefix="/api", tags=["site-holidays"])


@router.get("/sites/{site_id}/holidays", response_model=SiteHolidayListResponse)
def get_site_holidays(
    site_id: str,
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get holidays for a site, optionally filtered by year."""
    holidays = SiteHolidayService.get_by_site(db, site_id, year)
    return SiteHolidayListResponse(data=holidays, total=len(holidays))


@router.post("/sites/{site_id}/holidays", response_model=SiteHolidayResponse, status_code=status.HTTP_201_CREATED)
def create_site_holiday(site_id: str, data: SiteHolidayCreate, db: Session = Depends(get_db)):
    """Create a site holiday."""
    # Ensure site_id matches
    if data.site_id != site_id:
        data.site_id = site_id
    
    return SiteHolidayService.create(db, data)


@router.put("/site-holidays/{holiday_id}", response_model=SiteHolidayResponse)
def update_site_holiday(holiday_id: str, data: SiteHolidayUpdate, db: Session = Depends(get_db)):
    """Update a site holiday."""
    result = SiteHolidayService.update(db, holiday_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Site holiday not found")
    return result


@router.delete("/site-holidays/{holiday_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site_holiday(holiday_id: str, db: Session = Depends(get_db)):
    """Delete a site holiday."""
    if not SiteHolidayService.delete(db, holiday_id):
        raise HTTPException(status_code=404, detail="Site holiday not found")
