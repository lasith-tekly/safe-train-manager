import uuid
from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.models.auth import User, UserTeamAssignment

SECRET_KEY = "amadeus-elevate-secret-2026"  # move to env var later
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours for dev
REFRESH_TOKEN_EXPIRE_DAYS = 7


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_access_token(user_id: str, role: str,
                         train_id: str | None = None) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "role": role, "train_id": train_id,
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


def seed_admin_user(db: Session):
    """Create default superadmin if no users exist."""
    if db.query(User).count() == 0:
        admin = User(
            id=str(uuid.uuid4()),
            username="admin",
            email="admin@amadeus.com",
            password_hash=hash_password("Amadeus@2026"),
            role="superadmin",
            is_active=True,
            train_id=None,  # superadmin sees all trains
        )
        db.add(admin)
        db.commit()
