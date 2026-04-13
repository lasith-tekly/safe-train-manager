import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.dependencies.auth import require_admin, get_current_user
from app.models.auth import User, UserTeamAssignment
from app.services.auth_service import hash_password

router = APIRouter(prefix="/api/users", tags=["users"])


class CreateUserRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str  # superadmin / admin / po / readonly
    train_id: Optional[str] = None
    team_ids: list[str] = []


class UpdateUserRequest(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    train_id: Optional[str] = None
    is_active: Optional[bool] = None
    team_ids: Optional[list[str]] = None
    password: Optional[str] = None


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    role: str
    train_id: Optional[str]
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
        train_id=user.train_id,
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
    if req.role not in ("superadmin", "admin", "po", "readonly"):
        raise HTTPException(status_code=400, detail="Invalid role")
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    user = User(
        id=str(uuid.uuid4()),
        username=req.username,
        email=req.email,
        password_hash=hash_password(req.password),
        role=req.role,
        train_id=req.train_id,
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
    if req.train_id is not None: user.train_id = req.train_id
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


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.auth_service import verify_password
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    if req.current_password == req.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password")

    current_user.password_hash = hash_password(req.new_password)
    current_user.must_change_password = False
    db.commit()

    return {"message": "Password changed successfully"}
