"""
JIRA Record Routes - Execution-level tracking
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime

from app.database import get_db
from app.services.jira_record_service import JiraRecordService
from app.models.roadmap_v4 import JiraRecord
from app.models.spillover_history import SpilloverHistory
from app.models.record_history import RecordHistory
from app.schemas.jira import (
    CreateJiraRecordRequest,
    UpdateJiraRecordRequest,
    UpdateJiraAllocationsRequest,
    JiraRecordResponse,
    JiraRecordListResponse
)
from app.schemas.jira_record import (
    MarkSpilloverRequest,
    UpdateSpilloverRequest,
    RecordHistoryListResponse
)

router = APIRouter(prefix="/api", tags=["jira-records"])


@router.get("/features/{feature_id}/jira-records")
def list_jira_records(
    feature_id: str,
    db: Session = Depends(get_db)
):
    """Get all JIRA records for a feature with spillover summary"""
    service = JiraRecordService(db)
    response = service.get_feature_jira_records(feature_id)
    
    return response


@router.post("/features/{feature_id}/jira-records", response_model=JiraRecordResponse, status_code=status.HTTP_201_CREATED)
def create_jira_record(
    feature_id: str,
    request: CreateJiraRecordRequest,
    db: Session = Depends(get_db)
):
    """Create a new JIRA record for a feature"""
    service = JiraRecordService(db)
    
    try:
        jira_record, capacity_warning = service.create_jira_record(feature_id, request)
        # TODO: Handle capacity_warning (maybe add to response headers or separate field)
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


@router.post("/jira-records/{record_id}/spillover", response_model=JiraRecordResponse)
def mark_jira_record_as_spillover(
    record_id: str,
    request: MarkSpilloverRequest,
    db: Session = Depends(get_db)
):
    """
    Mark a JIRA record as spillover from a previous PI.
    
    - **record_id**: UUID of the JIRA record
    - **new_pi_id**: Target PI where work will be completed
    - **spillover_from_pi_id**: Original PI where work was planned
    - **spillover_reason**: Reason for spillover (10-500 chars)
    - **spillover_category**: Category of spillover
    """
    service = JiraRecordService(db)
    
    try:
        result = service.mark_as_spillover(
            record_id=record_id,
            new_pi_id=request.new_pi_id,
            spillover_from_pi_id=request.spillover_from_pi_id,
            spillover_reason=request.spillover_reason,
            spillover_category=request.spillover_category,
            spillover_effort=request.spillover_effort,
            completed_effort=request.completed_effort if request.completed_effort is not None else 0
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.put("/jira-records/{record_id}/spillover", response_model=JiraRecordResponse)
def update_spillover_details(
    record_id: str,
    request: UpdateSpilloverRequest,
    db: Session = Depends(get_db)
):
    """
    Update spillover details for an existing spillover record (Phase 3.2).
    
    - **record_id**: UUID of the JIRA record
    - **spillover_reason**: Updated reason for spillover (10-500 chars)
    - **spillover_category**: Updated category
    - **spillover_effort**: Updated spillover effort (eD)
    - **completed_effort**: Updated completed effort (eD)
    - **edit_reason**: Optional reason for editing (for audit trail)
    """
    service = JiraRecordService(db)
    
    try:
        result = service.update_spillover_details(
            record_id=record_id,
            spillover_reason=request.spillover_reason,
            spillover_category=request.spillover_category,
            spillover_effort=request.spillover_effort,
            completed_effort=request.completed_effort,
            edit_reason=request.edit_reason
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/jira-records/{record_id}/history", response_model=RecordHistoryListResponse)
def get_record_history(
    record_id: str,
    event_type: str = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Get complete history for a JIRA record (Phase 3.2).
    
    - **record_id**: UUID of the JIRA record
    - **event_type**: Optional filter by event type (CREATED, STATUS_CHANGE, SPILLOVER, SPILLOVER_EDIT, etc.)
    - **limit**: Maximum number of entries to return (default: 50)
    - **offset**: Offset for pagination (default: 0)
    """
    service = JiraRecordService(db)
    
    try:
        result = service.get_record_history(
            record_id=record_id,
            event_type=event_type,
            limit=limit,
            offset=offset
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/jira-records/{record_id}/revert-spillover", response_model=JiraRecordResponse)
def revert_spillover(
    record_id: str,
    db: Session = Depends(get_db)
):
    """
    Revert a spillover record back to its original PI (Phase 3.2).
    
    This endpoint allows undoing a spillover action, moving the record back to
    its previous PI and clearing spillover-related fields.
    
    - **record_id**: UUID of the JIRA record to revert
    
    Returns the updated record with spillover fields cleared.
    """
    service = JiraRecordService(db)
    
    try:
        result = service.revert_spillover(record_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/jira-records/{record_id}/spillover-history")
def get_spillover_history(
    record_id: str,
    db: Session = Depends(get_db)
):
    """
    Get spillover history events for a record.
    
    Returns all spillover events from the spillover_history table,
    ordered by sequence (latest first).
    """
    from app.models.pi import PI
    
    # Get the record to verify it exists
    record = db.query(JiraRecord).filter(JiraRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    # Get spillover history events
    history = db.query(SpilloverHistory).filter(
        SpilloverHistory.jira_record_id == record_id
    ).order_by(SpilloverHistory.sequence.desc()).all()
    
    # Build response with PI names
    result = []
    for event in history:
        from_pi = db.query(PI).filter(PI.id == event.from_pi_id).first()
        to_pi = db.query(PI).filter(PI.id == event.to_pi_id).first()
        
        result.append({
            "id": event.id,
            "sequence": event.sequence,
            "from_pi_id": event.from_pi_id,
            "from_pi_name": from_pi.name if from_pi else None,
            "to_pi_id": event.to_pi_id,
            "to_pi_name": to_pi.name if to_pi else None,
            "spillover_effort": event.spillover_effort,
            "completed_effort": event.completed_effort,
            "reason": event.reason,
            "category": event.category,
            "created_at": event.created_at.isoformat() if event.created_at else None
        })
    
    return result


@router.delete("/jira-records/{record_id}/spillover-history/{event_id}")
def delete_spillover_event(
    record_id: str, 
    event_id: str, 
    db: Session = Depends(get_db)
):
    """
    Delete a spillover event (must be the latest one).
    This reverts the record to the previous PI.
    
    Phase 3.2: Stack-based spillover management
    - Only the latest spillover event can be deleted
    - Deleting reverts the record to the previous PI
    - If last spillover, clears spillover status completely
    """
    # Get the record
    record = db.query(JiraRecord).filter(JiraRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    if not record.is_spillover:
        raise HTTPException(status_code=400, detail="Record is not a spillover")
    
    # Get the spillover event from spillover_history table
    event = db.query(SpilloverHistory).filter(SpilloverHistory.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Spillover event not found")
    
    if event.jira_record_id != record_id:
        raise HTTPException(status_code=400, detail="Event does not belong to this record")
    
    # Verify it's the latest event (highest sequence number)
    latest = db.query(SpilloverHistory).filter(
        SpilloverHistory.jira_record_id == record_id
    ).order_by(SpilloverHistory.sequence.desc()).first()
    
    if not latest or event.id != latest.id:
        raise HTTPException(
            status_code=400, 
            detail="Can only delete the latest spillover event. Delete newer events first."
        )
    
    # Store previous PI for response
    previous_pi_id = event.from_pi_id
    
    # Revert record to previous PI
    record.pi_id = event.from_pi_id
    record.spillover_count = max(0, (record.spillover_count or 1) - 1)
    
    # If this was the only spillover, clear spillover status completely
    if record.spillover_count == 0:
        record.is_spillover = False
        record.spillover_from_pi_id = None
        record.spillover_reason = None
        record.spillover_category = None
        record.spillover_effort = None
        record.completed_effort = None
        record.original_pi_id = None
    else:
        # Get the previous spillover event to restore its values
        previous = db.query(SpilloverHistory).filter(
            SpilloverHistory.jira_record_id == record_id,
            SpilloverHistory.sequence == event.sequence - 1
        ).first()
        
        if previous:
            record.spillover_from_pi_id = previous.from_pi_id
            record.spillover_reason = previous.spillover_reason
            record.spillover_category = previous.spillover_category
            record.spillover_effort = previous.spillover_effort
            record.completed_effort = previous.completed_effort
    
    # Delete the spillover event
    db.delete(event)
    
    # Add record_history entry for audit trail
    history_entry = RecordHistory(
        id=str(uuid.uuid4()),
        jira_record_id=record_id,
        event_type="SPILLOVER_DELETED",
        from_value=str(event.to_pi_id),
        to_value=str(event.from_pi_id),
        spillover_effort=event.spillover_effort,
        completed_effort=event.completed_effort,
        spillover_reason=f"Deleted spillover #{event.sequence}",
        created_at=datetime.utcnow()
    )
    db.add(history_entry)
    
    db.commit()
    db.refresh(record)
    
    # Build response using service method
    service = JiraRecordService(db)
    record_response = service._build_jira_record_response(record)
    
    return {
        "message": f"Spillover event #{event.sequence} deleted successfully",
        "reverted_to_pi": previous_pi_id,
        "new_spillover_count": record.spillover_count,
        "is_spillover": record.is_spillover,
        "record": record_response
    }
