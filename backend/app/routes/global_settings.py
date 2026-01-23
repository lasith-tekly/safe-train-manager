from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.global_settings import GlobalSettingsResponse, GlobalSettingsUpdate
from app.services.global_settings_service import GlobalSettingsService

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/global/{year}", response_model=GlobalSettingsResponse)
def get_global_settings(year: int, db: Session = Depends(get_db)):
    """Get global settings for a year. Creates defaults if not exists."""
    settings = GlobalSettingsService.get_or_create(db, year)
    return settings


@router.put("/global/{year}", response_model=GlobalSettingsResponse)
def update_global_settings(
    year: int,
    data: GlobalSettingsUpdate,
    db: Session = Depends(get_db)
):
    """Update global settings for a year (RTE only)."""
    return GlobalSettingsService.update(db, year, data)
