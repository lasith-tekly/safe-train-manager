import os
import uuid
from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.models.auth import User, UserTeamAssignment

SECRET_KEY = os.getenv("SECRET_KEY", "amadeus-elevate-secret-2026-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "role": role,
         "exp": expire, "type": "access"},
        SECRET_KEY, algorithm=ALGORITHM
    )


def create_refresh_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "refresh"},
        SECRET_KEY, algorithm=ALGORITHM
    )


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(
        User.username == username, User.is_active == True
    ).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_team_ids(db: Session, user_id: str) -> list[str]:
    assignments = db.query(UserTeamAssignment).filter(
        UserTeamAssignment.user_id == user_id
    ).all()
    return [a.team_id for a in assignments]


def get_user_trains(db: Session, user_id: str) -> list:
    """Get all train assignments for a user"""
    from app.models.auth import UserTrainAssignment
    assignments = db.query(UserTrainAssignment).filter(
        UserTrainAssignment.user_id == user_id
    ).all()
    return assignments


def get_user_train_ids(db: Session, user_id: str) -> list[str]:
    """Get list of train IDs user has access to"""
    from app.models.auth import UserTrainAssignment
    assignments = db.query(UserTrainAssignment).filter(
        UserTrainAssignment.user_id == user_id
    ).all()
    return [a.train_id for a in assignments]


def get_user_default_train_id(db: Session, user_id: str) -> Optional[str]:
    """Get user's default train ID"""
    from app.models.auth import UserTrainAssignment
    assignment = db.query(UserTrainAssignment).filter(
        UserTrainAssignment.user_id == user_id,
        UserTrainAssignment.is_default == True
    ).first()
    if assignment:
        return assignment.train_id
    # Fall back to first assignment if no default set
    first = db.query(UserTrainAssignment).filter(
        UserTrainAssignment.user_id == user_id
    ).first()
    return first.train_id if first else None


def assign_user_to_train(db: Session, user_id: str,
                          train_id: str, role: str,
                          is_default: bool = False) -> object:
    """Assign a user to a train with a role"""
    from app.models.auth import UserTrainAssignment
    # If setting as default, clear other defaults first
    if is_default:
        db.query(UserTrainAssignment).filter(
            UserTrainAssignment.user_id == user_id
        ).update({"is_default": False})
    assignment = UserTrainAssignment(
        user_id=user_id,
        train_id=train_id,
        role=role,
        is_default=is_default
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def remove_user_from_train(db: Session, user_id: str, train_id: str) -> bool:
    """Remove a user from a train"""
    from app.models.auth import UserTrainAssignment
    assignment = db.query(UserTrainAssignment).filter(
        UserTrainAssignment.user_id == user_id,
        UserTrainAssignment.train_id == train_id
    ).first()
    if not assignment:
        return False
    db.delete(assignment)
    db.commit()
    return True


def seed_admin_user(db: Session):
    """Create default superadmin if no users exist."""
    # Check if any users exist - if they do, do nothing
    if db.query(User).count() > 0:
        return

    # Only create admin user on first run when database is empty
    admin = User(
        id=str(uuid.uuid4()),
        username="admin",
        email="admin@amadeus.com",
        password_hash=hash_password("Amadeus@2026"),
        role="superadmin",
        is_active=True,
        train_id=None,  # superadmin sees all trains
        must_change_password=True,
    )
    db.add(admin)
    db.commit()
