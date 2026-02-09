"""
JIRA Records Routes - PI-Level Execution Planning

API endpoints for managing JIRA records with team assignment,
PI allocation, capacity validation, and execution planning.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.services.jira_record_service import JiraRecordService
from app.schemas.jira_record import (
    JiraRecordCreate,
    JiraRecordUpdate,
    JiraRecordResponse,
    JiraRecordListResponse,
    SpilloverRequest,
    TeamPIAllocationResponse,
    ExecutionValidationResponse
)

router = APIRouter(prefix="/api", tags=["jira-records"])


@router.get("/features/{feature_id}/jira-records", response_model=JiraRecordListResponse)
def list_feature_jira_records(
    feature_id: str,
    status: Optional[str] = Query(None, description="Filter by status"),
    team_id: Optional[str] = Query(None, description="Filter by team"),
    pi_id: Optional[str] = Query(None, description="Filter by PI"),
    db: Session = Depends(get_db)
):
    """
    List all JIRA records for a feature with optional filters.
    
    Returns summary statistics including:
    - Total planned/actual effort
    - Breakdown by status, PI, and team
    """
    try:
        service = JiraRecordService(db)
        return service.get_feature_jira_records(
            feature_id=feature_id,
            status=status,
            team_id=team_id,
            pi_id=pi_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/features/{feature_id}/jira-records", response_model=dict, status_code=201)
def create_jira_record(
    feature_id: str,
    data: JiraRecordCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new JIRA record for a feature.
    
    Returns the created record along with a capacity warning if the team
    will be over-allocated in the assigned PI.
    """
    try:
        service = JiraRecordService(db)
        record, capacity_warning = service.create_jira_record(feature_id, data)
        
        response = {"record": record}
        if capacity_warning:
            response["capacity_warning"] = capacity_warning
        
        return response
    except ValueError as e:
        if "already exists" in str(e):
            raise HTTPException(status_code=409, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/jira-records/{record_id}", response_model=JiraRecordResponse)
def get_jira_record(
    record_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific JIRA record by ID."""
    try:
        service = JiraRecordService(db)
        record = service.get_jira_record(record_id)
        
        if not record:
            raise HTTPException(status_code=404, detail=f"JIRA record {record_id} not found")
        
        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.put("/jira-records/{record_id}", response_model=JiraRecordResponse)
def update_jira_record(
    record_id: str,
    data: JiraRecordUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing JIRA record."""
    try:
        service = JiraRecordService(db)
        return service.update_jira_record(record_id, data)
    except ValueError as e:
        if "already exists" in str(e):
            raise HTTPException(status_code=409, detail=str(e))
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/jira-records/{record_id}", status_code=204)
def delete_jira_record(
    record_id: str,
    db: Session = Depends(get_db)
):
    """Delete a JIRA record."""
    try:
        service = JiraRecordService(db)
        success = service.delete_jira_record(record_id)
        
        if not success:
            raise HTTPException(status_code=404, detail=f"JIRA record {record_id} not found")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/jira-records/{record_id}/spillover", response_model=JiraRecordResponse)
def mark_as_spillover(
    record_id: str,
    data: SpilloverRequest,
    db: Session = Depends(get_db)
):
    """
    Mark a JIRA record as spillover and move it to a new PI.
    
    Sets spillover_from_pi_id to the current PI, updates pi_id to the new PI,
    sets status to SPILLOVER, and records the spillover reason.
    """
    try:
        service = JiraRecordService(db)
        return service.mark_as_spillover(record_id, data)
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/teams/{team_id}/pi-allocation/{pi_id}", response_model=TeamPIAllocationResponse)
def get_team_pi_allocation(
    team_id: str,
    pi_id: str,
    db: Session = Depends(get_db)
):
    """
    Get team's allocation summary for a specific PI.
    
    Returns:
    - Total capacity in eD
    - Allocated effort (sum of JIRA records)
    - Available effort
    - Utilization percentage
    - Over-allocation flag
    - List of all JIRA records for this team/PI
    """
    try:
        service = JiraRecordService(db)
        return service.get_team_pi_allocation(team_id, pi_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/features/{feature_id}/validate-execution", response_model=ExecutionValidationResponse)
def validate_execution_plan(
    feature_id: str,
    db: Session = Depends(get_db)
):
    """
    Validate execution plan against strategic roadmap allocations.
    
    Compares:
    - Strategic quarterly allocations (from roadmap)
    - Execution allocations (sum of JIRA records by PI → Quarter)
    
    Returns warnings for:
    - Under-allocation (execution < strategic)
    - Over-allocation (execution > strategic)
    - Missing execution plans
    """
    try:
        service = JiraRecordService(db)
        return service.validate_execution_plan(feature_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
