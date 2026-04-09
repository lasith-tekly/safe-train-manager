import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.dependencies.auth import require_admin
from app.models.train import Train

router = APIRouter(prefix="/api/trains", tags=["trains"])


class TrainCreate(BaseModel):
    name: str
    short_code: str
    description: Optional[str] = None


class TrainUpdate(BaseModel):
    name: Optional[str] = None
    short_code: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class TrainOut(BaseModel):
    id: str
    name: str
    short_code: str
    description: Optional[str]
    is_active: bool


def _out(t: Train) -> TrainOut:
    return TrainOut(id=t.id, name=t.name, short_code=t.short_code,
                    description=t.description, is_active=t.is_active)


@router.get("")
def list_trains(db: Session = Depends(get_db)):
    # Public — any authenticated user can list trains
    trains = db.query(Train).order_by(Train.name).all()
    return {"data": [_out(t) for t in trains]}


@router.post("", dependencies=[Depends(require_admin)])
def create_train(req: TrainCreate, db: Session = Depends(get_db)):
    if db.query(Train).filter(Train.short_code == req.short_code).first():
        raise HTTPException(400, "Short code already exists")
    t = Train(id=str(uuid.uuid4()), name=req.name,
              short_code=req.short_code, description=req.description)
    db.add(t)
    db.commit()
    return _out(t)


@router.put("/{train_id}", dependencies=[Depends(require_admin)])
def update_train(train_id: str, req: TrainUpdate,
                 db: Session = Depends(get_db)):
    t = db.query(Train).filter(Train.id == train_id).first()
    if not t:
        raise HTTPException(404, "Train not found")
    if req.name is not None: t.name = req.name
    if req.short_code is not None: t.short_code = req.short_code
    if req.description is not None: t.description = req.description
    if req.is_active is not None: t.is_active = req.is_active
    db.commit()
    return _out(t)


@router.delete("/{train_id}", dependencies=[Depends(require_admin)])
def delete_train(train_id: str, db: Session = Depends(get_db)):
    t = db.query(Train).filter(Train.id == train_id).first()
    if not t:
        raise HTTPException(404, "Train not found")
    db.delete(t)
    db.commit()
    return {"message": "Train deleted"}
