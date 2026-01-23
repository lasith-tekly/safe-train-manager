from typing import Optional
from sqlalchemy.orm import Session

from app.models.global_settings import GlobalSettings
from app.schemas.global_settings import GlobalSettingsCreate, GlobalSettingsUpdate


class GlobalSettingsService:
    """Service layer for Global Settings."""
    
    @staticmethod
    def get_by_year(db: Session, year: int) -> Optional[GlobalSettings]:
        """Get global settings for a specific year."""
        return db.query(GlobalSettings).filter(GlobalSettings.year == year).first()
    
    @staticmethod
    def get_or_create(db: Session, year: int) -> GlobalSettings:
        """Get settings for year, or create with defaults if not exists."""
        settings = GlobalSettingsService.get_by_year(db, year)
        if not settings:
            settings = GlobalSettings(year=year)
            db.add(settings)
            db.commit()
            db.refresh(settings)
        return settings
    
    @staticmethod
    def create(db: Session, data: GlobalSettingsCreate) -> GlobalSettings:
        """Create new global settings for a year."""
        settings = GlobalSettings(
            year=data.year,
            global_productivity_percentage=data.global_productivity_percentage,
            default_hours_per_day=data.default_hours_per_day
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
        return settings
    
    @staticmethod
    def update(db: Session, year: int, data: GlobalSettingsUpdate) -> GlobalSettings:
        """Update global settings for a year."""
        settings = GlobalSettingsService.get_or_create(db, year)
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(settings, field, value)
        db.commit()
        db.refresh(settings)
        return settings
