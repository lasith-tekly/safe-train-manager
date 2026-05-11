from fastapi import Depends, HTTPException, status, Request
from typing import Optional
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import decode_token, get_user_by_id
from app.models.auth import User

bearer_scheme = HTTPBearer()
bearer_scheme_optional = HTTPBearer(auto_error=False)


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
    if current_user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Admin access required")
    return current_user


def require_po_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "superadmin", "po"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Insufficient permissions")
    return current_user


def check_team_access(team_id: str, current_user: User, db: Session):
    """PO must be assigned to the team. Admin can access any team."""
    if current_user.role in ("admin", "superadmin"):
        return
    from app.services.auth_service import get_user_team_ids
    assigned = get_user_team_ids(db, current_user.id)
    if team_id not in assigned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You are not assigned to this team")


def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme_optional),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        return None
    return get_user_by_id(db, payload["sub"])


def get_train_context(
    request: Request,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
) -> Optional[str]:
    """
    Determines the active train context for data filtering.

    Priority order:
    1. If no user → no filter (None)
    2. If superadmin + no header → no filter (sees all)
    3. If superadmin + header → filter to that train
    4. If regular user + valid header → filter to that train
    5. If regular user + no/invalid header → use default train
    """
    if not current_user:
        return None

    selected = request.headers.get("X-Train-Context")

    if current_user.role == "superadmin":
        if not selected:
            return None  # sees all data
        return selected  # filter to selected train

    # Regular user (admin, po, readonly)
    from app.services.auth_service import (
        get_user_train_ids, get_user_default_train_id
    )
    user_train_ids = get_user_train_ids(db, current_user.id)

    if selected and selected in user_train_ids:
        return selected

    # Fall back to default train
    return get_user_default_train_id(db, current_user.id)
