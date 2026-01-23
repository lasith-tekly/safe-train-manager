"""Organization service - Country and Site management."""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.organization import Country, Site
from app.models.team import Team
from app.schemas.organization import (
    CountryCreate, CountryUpdate, CountryResponse, CountryWithSites,
    SiteCreate, SiteUpdate, SiteResponse, SiteWithTeams
)


class CountryService:
    """Service for Country operations."""

    @staticmethod
    def get_all(db: Session, include_inactive: bool = False) -> List[Country]:
        """Get all countries."""
        query = db.query(Country)
        if not include_inactive:
            query = query.filter(Country.is_active == True)
        return query.order_by(Country.name).all()

    @staticmethod
    def get_by_id(db: Session, country_id: str) -> Optional[Country]:
        """Get country by ID."""
        return db.query(Country).filter(Country.id == country_id).first()

    @staticmethod
    def get_by_code(db: Session, code: str) -> Optional[Country]:
        """Get country by code."""
        return db.query(Country).filter(Country.code == code.upper()).first()

    @staticmethod
    def create(db: Session, data: CountryCreate) -> Country:
        """Create a new country."""
        country = Country(
            code=data.code.upper(),
            name=data.name,
            timezone=data.timezone,
            is_active=data.is_active
        )
        db.add(country)
        db.commit()
        db.refresh(country)
        return country

    @staticmethod
    def update(db: Session, country_id: str, data: CountryUpdate) -> Optional[Country]:
        """Update a country."""
        country = CountryService.get_by_id(db, country_id)
        if not country:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        if 'code' in update_data:
            update_data['code'] = update_data['code'].upper()
        
        for field, value in update_data.items():
            setattr(country, field, value)
        
        db.commit()
        db.refresh(country)
        return country

    @staticmethod
    def delete(db: Session, country_id: str) -> bool:
        """Delete (deactivate) a country."""
        country = CountryService.get_by_id(db, country_id)
        if not country:
            return False
        
        # Soft delete - just deactivate
        country.is_active = False
        db.commit()
        return True

    @staticmethod
    def build_response(db: Session, country: Country) -> CountryResponse:
        """Build country response with counts."""
        site_count = db.query(func.count(Site.id)).filter(
            Site.country_id == country.id,
            Site.is_active == True
        ).scalar() or 0
        
        team_count = db.query(func.count(Team.id)).join(Site).filter(
            Site.country_id == country.id,
            Team.status == 'active'
        ).scalar() or 0
        
        return CountryResponse(
            id=country.id,
            code=country.code,
            name=country.name,
            timezone=country.timezone,
            is_active=country.is_active,
            created_at=country.created_at,
            updated_at=country.updated_at,
            site_count=site_count,
            team_count=team_count
        )


class SiteService:
    """Service for Site operations."""

    @staticmethod
    def get_all(db: Session, country_id: Optional[str] = None, include_inactive: bool = False) -> List[Site]:
        """Get all sites, optionally filtered by country."""
        query = db.query(Site)
        if country_id:
            query = query.filter(Site.country_id == country_id)
        if not include_inactive:
            query = query.filter(Site.is_active == True)
        return query.order_by(Site.name).all()

    @staticmethod
    def get_by_id(db: Session, site_id: str) -> Optional[Site]:
        """Get site by ID."""
        return db.query(Site).filter(Site.id == site_id).first()

    @staticmethod
    def get_by_code(db: Session, code: str) -> Optional[Site]:
        """Get site by code."""
        return db.query(Site).filter(Site.code == code.upper()).first()

    @staticmethod
    def create(db: Session, data: SiteCreate) -> Site:
        """Create a new site."""
        site = Site(
            code=data.code.upper(),
            name=data.name,
            country_id=data.country_id,
            address=data.address,
            unit_cost_keur=data.unit_cost_keur,
            is_active=data.is_active
        )
        db.add(site)
        db.commit()
        db.refresh(site)
        return site

    @staticmethod
    def update(db: Session, site_id: str, data: SiteUpdate) -> Optional[Site]:
        """Update a site."""
        site = SiteService.get_by_id(db, site_id)
        if not site:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        if 'code' in update_data:
            update_data['code'] = update_data['code'].upper()
        
        for field, value in update_data.items():
            setattr(site, field, value)
        
        db.commit()
        db.refresh(site)
        return site

    @staticmethod
    def delete(db: Session, site_id: str) -> bool:
        """Delete (deactivate) a site."""
        site = SiteService.get_by_id(db, site_id)
        if not site:
            return False
        
        # Soft delete - just deactivate
        site.is_active = False
        db.commit()
        return True

    @staticmethod
    def build_response(db: Session, site: Site) -> SiteResponse:
        """Build site response with counts."""
        team_count = db.query(func.count(Team.id)).filter(
            Team.site_id == site.id,
            Team.status == 'active'
        ).scalar() or 0
        
        country = site.country
        
        return SiteResponse(
            id=site.id,
            code=site.code,
            name=site.name,
            country_id=site.country_id,
            address=site.address,
            unit_cost_keur=float(site.unit_cost_keur) if site.unit_cost_keur else 85.0,
            is_active=site.is_active,
            created_at=site.created_at,
            updated_at=site.updated_at,
            team_count=team_count,
            country_name=country.name if country else None,
            country_code=country.code if country else None
        )
