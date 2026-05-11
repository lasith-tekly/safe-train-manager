from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.services import auth_service
from app.dependencies.auth import get_current_user
from app.models.auth import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class TrainAssignmentResponse(BaseModel):
    id: str
    train_id: str
    train_name: str
    train_short_code: str
    role: str
    is_default: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    must_change_password: bool = False
    trains: List[TrainAssignmentResponse] = []
    default_train_id: Optional[str] = None


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    train_id: Optional[str] = None  # Kept for backward compatibility
    team_ids: list[str]
    trains: List[TrainAssignmentResponse] = []
    default_train_id: Optional[str] = None
    must_change_password: bool = False


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = auth_service.get_user_by_username(db, req.username)
    if not user or not auth_service.verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid username or password")
    user.last_login = datetime.utcnow()
    db.commit()

    # Build trains list
    from app.models.train import Train
    train_assignments = auth_service.get_user_trains(db, user.id)
    trains = []
    for assignment in train_assignments:
        train = db.query(Train).filter(
            Train.id == assignment.train_id
        ).first()
        if train:
            trains.append(TrainAssignmentResponse(
                id=assignment.id,
                train_id=train.id,
                train_name=train.name,
                train_short_code=train.short_code if hasattr(train, 'short_code') else "",
                role=assignment.role,
                is_default=assignment.is_default
            ))

    default_train_id = auth_service.get_user_default_train_id(db, user.id)

    return TokenResponse(
        access_token=auth_service.create_access_token(user.id, user.role),
        refresh_token=auth_service.create_refresh_token(user.id),
        must_change_password=user.must_change_password,
        trains=trains,
        default_train_id=default_train_id,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(req: RefreshRequest, db: Session = Depends(get_db)):
    payload = auth_service.decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid refresh token")
    user = auth_service.get_user_by_id(db, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="User not found or inactive")

    # Build trains list
    from app.models.train import Train
    train_assignments = auth_service.get_user_trains(db, user.id)
    trains = []
    for assignment in train_assignments:
        train = db.query(Train).filter(
            Train.id == assignment.train_id
        ).first()
        if train:
            trains.append(TrainAssignmentResponse(
                id=assignment.id,
                train_id=train.id,
                train_name=train.name,
                train_short_code=train.short_code if hasattr(train, 'short_code') else "",
                role=assignment.role,
                is_default=assignment.is_default
            ))

    default_train_id = auth_service.get_user_default_train_id(db, user.id)

    return TokenResponse(
        access_token=auth_service.create_access_token(user.id, user.role),
        refresh_token=auth_service.create_refresh_token(user.id),
        trains=trains,
        default_train_id=default_train_id,
    )


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user),
       db: Session = Depends(get_db)):
    team_ids = auth_service.get_user_team_ids(db, current_user.id)

    # Build trains list
    from app.models.train import Train
    train_assignments = auth_service.get_user_trains(db, current_user.id)
    trains = []
    for assignment in train_assignments:
        train = db.query(Train).filter(
            Train.id == assignment.train_id
        ).first()
        if train:
            trains.append(TrainAssignmentResponse(
                id=assignment.id,
                train_id=train.id,
                train_name=train.name,
                train_short_code=train.short_code if hasattr(train, 'short_code') else "",
                role=assignment.role,
                is_default=assignment.is_default
            ))

    default_train_id = auth_service.get_user_default_train_id(db, current_user.id)

    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        train_id=current_user.train_id,  # Kept for backward compatibility
        team_ids=team_ids,
        trains=trains,
        default_train_id=default_train_id,
        must_change_password=current_user.must_change_password,
    )


@router.post("/logout")
def logout():
    # Stateless JWT — client discards tokens
    return {"message": "Logged out successfully"}
