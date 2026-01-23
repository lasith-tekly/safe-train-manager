"""
Component Hats API routes.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.team_member import (
    ComponentHatCreate, ComponentHatUpdate, ComponentHatResponse, ComponentHatListResponse
)
from app.services.team_member_service import ComponentHatService

router = APIRouter(prefix="/api/component-hats", tags=["component-hats"])


@router.get("", response_model=ComponentHatListResponse)
def list_component_hats(db: Session = Depends(get_db)):
    """List all component hats."""
    hats = ComponentHatService.get_all(db)
    return ComponentHatListResponse(data=hats, total=len(hats))


@router.post("", response_model=ComponentHatResponse, status_code=status.HTTP_201_CREATED)
def create_component_hat(data: ComponentHatCreate, db: Session = Depends(get_db)):
    """Create a new component hat."""
    return ComponentHatService.create(db, data)


@router.get("/{hat_id}", response_model=ComponentHatResponse)
def get_component_hat(hat_id: str, db: Session = Depends(get_db)):
    """Get a specific component hat."""
    hat = ComponentHatService.get_by_id(db, hat_id)
    if not hat:
        raise HTTPException(status_code=404, detail="Component hat not found")
    return ComponentHatService.build_response(hat)


@router.put("/{hat_id}", response_model=ComponentHatResponse)
def update_component_hat(hat_id: str, data: ComponentHatUpdate, db: Session = Depends(get_db)):
    """Update a component hat."""
    result = ComponentHatService.update(db, hat_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Component hat not found")
    return result


@router.delete("/{hat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_component_hat(hat_id: str, db: Session = Depends(get_db)):
    """Delete a component hat."""
    if not ComponentHatService.delete(db, hat_id):
        raise HTTPException(status_code=404, detail="Component hat not found")
