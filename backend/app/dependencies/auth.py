from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import decode_token, get_user_by_id
from app.models.auth import User

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid or expired token")
    user = get_user_by_id(db, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="User not found or inactive")
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Admin access required")
    return current_user


def require_po_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "po"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Insufficient permissions")
    return current_user


def check_team_access(team_id: str, current_user: User, db: Session):
    """PO must be assigned to the team. Admin can access any team."""
    if current_user.role == "admin":
        return
    from app.services.auth_service import get_user_team_ids
    assigned = get_user_team_ids(db, current_user.id)
    if team_id not in assigned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You are not assigned to this team")
