"""
JIRA Record Routes - Execution-level tracking
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services.jira_record_service import JiraRecordService
from app.schemas.jira import (
    CreateJiraRecordRequest,
    UpdateJiraRecordRequest,
    UpdateJiraAllocationsRequest,
    JiraRecordResponse,
    JiraRecordListResponse
)

router = APIRouter(prefix="/api", tags=["jira-records"])


@router.get("/features/{feature_id}/jira-records", response_model=JiraRecordListResponse)
def list_jira_records(
    feature_id: str,
    db: Session = Depends(get_db)
):
    """Get all JIRA records for a feature"""
    service = JiraRecordService(db)
    jira_records = service.list_jira_records_for_feature(feature_id)
    
    return JiraRecordListResponse(
        data=jira_records,
        total=len(jira_records)
    )


@router.post("/features/{feature_id}/jira-records", response_model=JiraRecordResponse, status_code=status.HTTP_201_CREATED)
def create_jira_record(
    feature_id: str,
    request: CreateJiraRecordRequest,
    db: Session = Depends(get_db)
):
    """Create a new JIRA record for a feature"""
    service = JiraRecordService(db)
    
    try:
        jira_record = service.create_jira_record(feature_id, request)
        return jira_record
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create JIRA record: {str(e)}"
        )


@router.get("/jira-records/{jira_record_id}", response_model=JiraRecordResponse)
def get_jira_record(
    jira_record_id: str,
    db: Session = Depends(get_db)
):
    """Get a single JIRA record"""
    service = JiraRecordService(db)
    jira_record = service.get_jira_record(jira_record_id)
    
    if not jira_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"JIRA record {jira_record_id} not found"
        )
    
    return jira_record


@router.put("/jira-records/{jira_record_id}", response_model=JiraRecordResponse)
def update_jira_record(
    jira_record_id: str,
    request: UpdateJiraRecordRequest,
    db: Session = Depends(get_db)
):
    """Update a JIRA record"""
    service = JiraRecordService(db)
    
    try:
        jira_record = service.update_jira_record(jira_record_id, request)
        return jira_record
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update JIRA record: {str(e)}"
        )


@router.delete("/jira-records/{jira_record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_jira_record(
    jira_record_id: str,
    db: Session = Depends(get_db)
):
    """Delete a JIRA record"""
    service = JiraRecordService(db)
    
    if not service.delete_jira_record(jira_record_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"JIRA record {jira_record_id} not found"
        )
    
    return None


@router.put("/jira-records/{jira_record_id}/allocations", response_model=JiraRecordResponse)
def update_jira_allocations(
    jira_record_id: str,
    request: UpdateJiraAllocationsRequest,
    db: Session = Depends(get_db)
):
    """Update quarterly allocations for a JIRA record"""
    service = JiraRecordService(db)
    
    try:
        jira_record = service.update_jira_allocations(jira_record_id, request)
        return jira_record
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update allocations: {str(e)}"
        )
