import json
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
import httpx

from app.models.feature import JiraConfig, Feature
from app.schemas.feature import (
    JiraConfigCreate,
    JiraConfigResponse,
    JiraTestResponse,
    JiraSearchRequest,
    JiraSearchResponse,
    JiraIssue
)


class JiraService:
    """Service layer for JIRA integration."""

    @staticmethod
    def get_config(db: Session) -> Optional[JiraConfigResponse]:
        """Get active JIRA configuration."""
        config = db.query(JiraConfig).filter(JiraConfig.is_active == 1).first()
        if not config:
            return None
        
        project_keys = json.loads(config.project_keys) if config.project_keys else []
        
        return JiraConfigResponse(
            id=config.id,
            jira_url=config.jira_url,
            username=config.username,
            project_keys=project_keys,
            is_active=bool(config.is_active),
            created_at=config.created_at,
            updated_at=config.updated_at
        )

    @staticmethod
    def save_config(db: Session, data: JiraConfigCreate) -> JiraConfigResponse:
        """Create or update JIRA configuration."""
        config = db.query(JiraConfig).filter(JiraConfig.is_active == 1).first()
        
        project_keys_json = json.dumps(data.project_keys) if data.project_keys else None
        
        if config:
            config.jira_url = data.jira_url
            config.username = data.username
            config.api_token = data.api_token
            config.project_keys = project_keys_json
        else:
            config = JiraConfig(
                jira_url=data.jira_url,
                username=data.username,
                api_token=data.api_token,
                project_keys=project_keys_json,
                is_active=1
            )
            db.add(config)

        db.commit()
        db.refresh(config)
        
        return JiraConfigResponse(
            id=config.id,
            jira_url=config.jira_url,
            username=config.username,
            project_keys=data.project_keys,
            is_active=bool(config.is_active),
            created_at=config.created_at,
            updated_at=config.updated_at
        )

    @staticmethod
    def _get_auth(config: JiraConfig) -> tuple:
        """Get authentication tuple for JIRA API."""
        return (config.username, config.api_token)

    @staticmethod
    def test_connection(db: Session) -> JiraTestResponse:
        """Test JIRA connection."""
        config = db.query(JiraConfig).filter(JiraConfig.is_active == 1).first()
        if not config:
            return JiraTestResponse(
                success=False,
                message="JIRA not configured"
            )

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(
                    f"{config.jira_url}/rest/api/2/myself",
                    auth=JiraService._get_auth(config)
                )
                
                if response.status_code == 200:
                    projects_response = client.get(
                        f"{config.jira_url}/rest/api/2/project",
                        auth=JiraService._get_auth(config)
                    )
                    projects = []
                    if projects_response.status_code == 200:
                        projects = [p['key'] for p in projects_response.json()]
                    
                    return JiraTestResponse(
                        success=True,
                        message="Connection successful",
                        projects=projects
                    )
                else:
                    return JiraTestResponse(
                        success=False,
                        message=f"Authentication failed: {response.status_code}"
                    )
        except Exception as e:
            return JiraTestResponse(
                success=False,
                message=f"Connection error: {str(e)}"
            )

    @staticmethod
    def get_projects(db: Session) -> List[str]:
        """Get list of JIRA projects."""
        config = db.query(JiraConfig).filter(JiraConfig.is_active == 1).first()
        if not config:
            return []

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(
                    f"{config.jira_url}/rest/api/2/project",
                    auth=JiraService._get_auth(config)
                )
                if response.status_code == 200:
                    return [p['key'] for p in response.json()]
        except Exception:
            pass
        return []

    @staticmethod
    def search_issues(db: Session, request: JiraSearchRequest) -> JiraSearchResponse:
        """Search JIRA issues."""
        config = db.query(JiraConfig).filter(JiraConfig.is_active == 1).first()
        if not config:
            return JiraSearchResponse(issues=[], total=0)

        jql = f"project = {request.project_key}"
        if request.jql:
            jql += f" AND ({request.jql})"
        else:
            jql += " AND issuetype = Epic"

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.get(
                    f"{config.jira_url}/rest/api/2/search",
                    params={
                        "jql": jql,
                        "maxResults": request.max_results,
                        "fields": "summary,status,customfield_10016,labels"
                    },
                    auth=JiraService._get_auth(config)
                )
                
                if response.status_code != 200:
                    return JiraSearchResponse(issues=[], total=0)

                data = response.json()
                issues = []
                
                imported_keys = set(
                    f.jira_key for f in db.query(Feature.jira_key).all()
                )

                for issue in data.get('issues', []):
                    fields = issue.get('fields', {})
                    status_obj = fields.get('status', {})
                    
                    issues.append(JiraIssue(
                        key=issue['key'],
                        id=issue['id'],
                        summary=fields.get('summary', ''),
                        status=status_obj.get('name', 'Unknown'),
                        story_points=fields.get('customfield_10016') or 0,
                        labels=fields.get('labels', []),
                        url=f"{config.jira_url}/browse/{issue['key']}",
                        already_imported=issue['key'] in imported_keys
                    ))

                return JiraSearchResponse(
                    issues=issues,
                    total=data.get('total', len(issues))
                )
        except Exception:
            return JiraSearchResponse(issues=[], total=0)

    @staticmethod
    def get_issue(db: Session, jira_key: str) -> Optional[Dict[str, Any]]:
        """Get a single JIRA issue."""
        config = db.query(JiraConfig).filter(JiraConfig.is_active == 1).first()
        if not config:
            return None

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(
                    f"{config.jira_url}/rest/api/2/issue/{jira_key}",
                    params={"fields": "summary,status,customfield_10016,description"},
                    auth=JiraService._get_auth(config)
                )
                
                if response.status_code != 200:
                    return None

                data = response.json()
                fields = data.get('fields', {})
                status_obj = fields.get('status', {})

                return {
                    'key': data['key'],
                    'id': data['id'],
                    'summary': fields.get('summary', ''),
                    'status': status_obj.get('name', 'Unknown'),
                    'story_points': fields.get('customfield_10016') or 0,
                    'description': fields.get('description', '')
                }
        except Exception:
            return None
