"""Organization routes - Country and Site management."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.organization import (
    CountryCreate, CountryUpdate, CountryResponse, CountryWithSites,
    SiteCreate, SiteUpdate, SiteResponse
)
from app.services.organization_service import CountryService, SiteService

router = APIRouter(prefix="/api", tags=["organization"])


# ============================================
# Country Endpoints
# ============================================

@router.get("/countries", response_model=List[CountryResponse])
def get_countries(
    include_inactive: bool = Query(False, description="Include inactive countries"),
    db: Session = Depends(get_db)
):
    """Get all countries."""
    countries = CountryService.get_all(db, include_inactive)
    return [CountryService.build_response(db, c) for c in countries]


@router.get("/countries/{country_id}", response_model=CountryResponse)
def get_country(country_id: str, db: Session = Depends(get_db)):
    """Get a country by ID."""
    country = CountryService.get_by_id(db, country_id)
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    return CountryService.build_response(db, country)


@router.post("/countries", response_model=CountryResponse, status_code=201)
def create_country(data: CountryCreate, db: Session = Depends(get_db)):
    """Create a new country."""
    # Check if code already exists
    existing = CountryService.get_by_code(db, data.code)
    if existing:
        raise HTTPException(status_code=400, detail=f"Country with code '{data.code}' already exists")
    
    country = CountryService.create(db, data)
    return CountryService.build_response(db, country)


@router.put("/countries/{country_id}", response_model=CountryResponse)
def update_country(country_id: str, data: CountryUpdate, db: Session = Depends(get_db)):
    """Update a country."""
    # Check if new code conflicts
    if data.code:
        existing = CountryService.get_by_code(db, data.code)
        if existing and existing.id != country_id:
            raise HTTPException(status_code=400, detail=f"Country with code '{data.code}' already exists")
    
    country = CountryService.update(db, country_id, data)
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    return CountryService.build_response(db, country)


@router.delete("/countries/{country_id}", status_code=204)
def delete_country(country_id: str, db: Session = Depends(get_db)):
    """Delete (deactivate) a country."""
    # Check for active sites
    sites = SiteService.get_all(db, country_id=country_id)
    if sites:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete country with {len(sites)} active site(s). Deactivate sites first."
        )
    
    success = CountryService.delete(db, country_id)
    if not success:
        raise HTTPException(status_code=404, detail="Country not found")


@router.get("/countries/{country_id}/sites", response_model=List[SiteResponse])
def get_country_sites(
    country_id: str,
    include_inactive: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Get all sites in a country."""
    country = CountryService.get_by_id(db, country_id)
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    
    sites = SiteService.get_all(db, country_id=country_id, include_inactive=include_inactive)
    return [SiteService.build_response(db, s) for s in sites]


# ============================================
# Site Endpoints
# ============================================

@router.get("/sites", response_model=List[SiteResponse])
def get_sites(
    country_id: Optional[str] = Query(None, description="Filter by country"),
    include_inactive: bool = Query(False, description="Include inactive sites"),
    db: Session = Depends(get_db)
):
    """Get all sites."""
    sites = SiteService.get_all(db, country_id=country_id, include_inactive=include_inactive)
    return [SiteService.build_response(db, s) for s in sites]


@router.get("/sites/{site_id}", response_model=SiteResponse)
def get_site(site_id: str, db: Session = Depends(get_db)):
    """Get a site by ID."""
    site = SiteService.get_by_id(db, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return SiteService.build_response(db, site)


@router.post("/sites", response_model=SiteResponse, status_code=201)
def create_site(data: SiteCreate, db: Session = Depends(get_db)):
    """Create a new site."""
    # Check if country exists
    country = CountryService.get_by_id(db, data.country_id)
    if not country:
        raise HTTPException(status_code=400, detail="Country not found")
    
    # Check if code already exists
    existing = SiteService.get_by_code(db, data.code)
    if existing:
        raise HTTPException(status_code=400, detail=f"Site with code '{data.code}' already exists")
    
    site = SiteService.create(db, data)
    return SiteService.build_response(db, site)


@router.put("/sites/{site_id}", response_model=SiteResponse)
def update_site(site_id: str, data: SiteUpdate, db: Session = Depends(get_db)):
    """Update a site."""
    # Check if new code conflicts
    if data.code:
        existing = SiteService.get_by_code(db, data.code)
        if existing and existing.id != site_id:
            raise HTTPException(status_code=400, detail=f"Site with code '{data.code}' already exists")
    
    # Check if new country exists
    if data.country_id:
        country = CountryService.get_by_id(db, data.country_id)
        if not country:
            raise HTTPException(status_code=400, detail="Country not found")
    
    site = SiteService.update(db, site_id, data)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return SiteService.build_response(db, site)


@router.delete("/sites/{site_id}", status_code=204)
def delete_site(site_id: str, db: Session = Depends(get_db)):
    """Delete (deactivate) a site."""
    from app.models.team import Team
    
    # Check for active teams
    site = SiteService.get_by_id(db, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    team_count = db.query(Team).filter(
        Team.site_id == site_id,
        Team.status == 'active'
    ).count()
    
    if team_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete site with {team_count} active team(s). Reassign teams first."
        )
    
    success = SiteService.delete(db, site_id)
    if not success:
        raise HTTPException(status_code=404, detail="Site not found")
