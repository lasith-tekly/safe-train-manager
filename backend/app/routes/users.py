import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.dependencies.auth import require_admin
from app.models.auth import User, UserTeamAssignment
from app.services.auth_service import hash_password

router = APIRouter(prefix="/api/users", tags=["users"])


class CreateUserRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str  # admin / po / readonly
    team_ids: list[str] = []


class UpdateUserRequest(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    team_ids: Optional[list[str]] = None
    password: Optional[str] = None


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    role: str
    is_active: bool
    team_ids: list[str]
    last_login: Optional[str]


def _user_out(user: User, db: Session) -> UserOut:
    from app.services.auth_service import get_user_team_ids
    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        team_ids=get_user_team_ids(db, user.id),
        last_login=user.last_login.isoformat() if user.last_login else None,
    )


@router.get("", dependencies=[Depends(require_admin)])
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.username).all()
    return {"data": [_user_out(u, db) for u in users]}


@router.post("", dependencies=[Depends(require_admin)])
def create_user(req: CreateUserRequest, db: Session = Depends(get_db)):
    if req.role not in ("admin", "po", "readonly"):
        raise HTTPException(status_code=400, detail="Invalid role")
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    user = User(
        id=str(uuid.uuid4()),
        username=req.username,
        email=req.email,
        password_hash=hash_password(req.password),
        role=req.role,
    )
    db.add(user)
    db.flush()
    for team_id in req.team_ids:
        db.add(UserTeamAssignment(
            id=str(uuid.uuid4()),
            user_id=user.id,
            team_id=team_id
        ))
    db.commit()
    return _user_out(user, db)


@router.put("/{user_id}", dependencies=[Depends(require_admin)])
def update_user(user_id: str, req: UpdateUserRequest,
                db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if req.email is not None: user.email = req.email
    if req.role is not None: user.role = req.role
    if req.is_active is not None: user.is_active = req.is_active
    if req.password is not None: user.password_hash = hash_password(req.password)
    if req.team_ids is not None:
        db.query(UserTeamAssignment).filter(
            UserTeamAssignment.user_id == user_id
        ).delete()
        for team_id in req.team_ids:
            db.add(UserTeamAssignment(
                id=str(uuid.uuid4()),
                user_id=user_id,
                team_id=team_id
            ))
    db.commit()
    return _user_out(user, db)


@router.delete("/{user_id}", dependencies=[Depends(require_admin)])
def delete_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
