from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.feature import (
    JiraConfigCreate,
    JiraConfigResponse,
    JiraTestResponse,
    JiraSearchRequest,
    JiraSearchResponse
)
from app.services.jira_service import JiraService

router = APIRouter(prefix="/api/jira", tags=["jira"])


@router.get("/config", response_model=JiraConfigResponse)
def get_jira_config(db: Session = Depends(get_db)):
    """Get JIRA configuration."""
    config = JiraService.get_config(db)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="JIRA not configured"
        )
    return config


@router.put("/config", response_model=JiraConfigResponse)
def update_jira_config(
    data: JiraConfigCreate,
    db: Session = Depends(get_db)
):
    """Create or update JIRA configuration."""
    return JiraService.save_config(db, data)


@router.post("/test", response_model=JiraTestResponse)
def test_jira_connection(db: Session = Depends(get_db)):
    """Test JIRA connection."""
    return JiraService.test_connection(db)


@router.get("/projects")
def list_jira_projects(db: Session = Depends(get_db)):
    """List available JIRA projects."""
    projects = JiraService.get_projects(db)
    return {"projects": projects}


@router.post("/search", response_model=JiraSearchResponse)
def search_jira_issues(
    data: JiraSearchRequest,
    db: Session = Depends(get_db)
):
    """Search JIRA issues."""
    return JiraService.search_issues(db, data)
