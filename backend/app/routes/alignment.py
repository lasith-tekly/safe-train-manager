"""
Alignment API Routes - Phase 4

API endpoints for alignment actions to resolve deviations.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.alignment_service import AlignmentService
from app.schemas.alignment import (
    AlignFeatureRequest,
    AlignFeatureResponse,
    AcknowledgeDeviationRequest,
    AcknowledgeDeviationResponse,
    BatchJiraUpdateRequest,
    BatchJiraUpdateResponse,
    CreateVersionFromAlignmentRequest,
    CreateVersionFromAlignmentResponse
)

router = APIRouter(prefix="/api", tags=["Alignment"])


@router.post("/features/{feature_id}/align", response_model=AlignFeatureResponse)
def align_feature(
    feature_id: str,
    version_id: str = Query(..., description="Roadmap version ID"),
    request: AlignFeatureRequest = ...,
    db: Session = Depends(get_db)
):
    """
    Apply alignment action to a feature.
    
    Actions:
    - auto_align: Copy execution values to strategic allocations
    - manual_update: Apply user-provided quarterly allocations
    - adjust_execution: Adjust execution plan to match strategic allocations
    - acknowledge: Mark deviation as acknowledged with reason
    
    Returns:
    - Previous and new totals
    - Quarterly changes
    - Success status and message
    """
    try:
        service = AlignmentService(db)
        return service.align_feature(feature_id, version_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to align feature: {str(e)}")


@router.post("/features/{feature_id}/acknowledge-deviation", response_model=AcknowledgeDeviationResponse)
def acknowledge_deviation(
    feature_id: str,
    version_id: str = Query(..., description="Roadmap version ID"),
    request: AcknowledgeDeviationRequest = ...,
    db: Session = Depends(get_db)
):
    """
    Acknowledge deviation for a feature.
    
    Marks the deviation as acknowledged and stores the reason.
    This is an alternative to the acknowledge action in the align endpoint.
    
    Returns:
    - Feature ID
    - Acknowledgment status
    - Reason
    - Timestamp
    """
    try:
        service = AlignmentService(db)
        return service.acknowledge_deviation(feature_id, version_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to acknowledge deviation: {str(e)}")


@router.post("/jira-records/batch-update", response_model=BatchJiraUpdateResponse)
def batch_update_jira_records(
    request: BatchJiraUpdateRequest = ...,
    db: Session = Depends(get_db)
):
    """
    Batch update JIRA records.
    
    Allows updating multiple JIRA records at once:
    - Move records to different PIs (new_pi_id)
    - Change planned effort (new_effort)
    
    Validation:
    - Cannot modify IN_PROGRESS or COMPLETED records
    - Cannot modify spillover records
    
    Returns:
    - Count of updated and failed records
    - Detailed results for each update
    """
    try:
        service = AlignmentService(db)
        return service.batch_update_jira_records(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to batch update JIRA records: {str(e)}")


@router.post("/roadmap-versions/create-from-alignment", response_model=CreateVersionFromAlignmentResponse)
def create_version_from_alignment(
    request: CreateVersionFromAlignmentRequest = ...,
    db: Session = Depends(get_db)
):
    """
    Create a new roadmap version from alignment changes.
    
    This endpoint creates a new version by:
    1. Copying all data from the source version
    2. Applying accumulated alignment changes
    3. Setting the version status (DRAFT or PUBLISHED)
    
    Use this after aligning multiple features to create a new
    version that reflects the aligned strategic plan.
    
    Returns:
    - New version ID and details
    - Features aligned count
    - Deviation before and after
    """
    try:
        service = AlignmentService(db)
        return service.create_version_from_alignment(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create version from alignment: {str(e)}")
