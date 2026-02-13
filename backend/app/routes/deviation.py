"""
Deviation API Routes - Phase 4

API endpoints for deviation calculation and budget validation.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.deviation_service import DeviationService
from app.schemas.deviation import (
    FeatureDeviationResponse,
    ProductDeviationSummary,
    BudgetValidationTree
)

router = APIRouter(prefix="/api", tags=["Deviation"])


@router.get("/products/{product_id}/deviation-summary", response_model=ProductDeviationSummary)
def get_product_deviation_summary(
    product_id: str,
    version_id: str = Query(..., description="Roadmap version ID"),
    db: Session = Depends(get_db)
):
    """
    Get overall deviation summary for a product.
    
    Returns:
    - Summary statistics (aligned count, deviation count, etc.)
    - List of all features with their deviations
    - Total deviation in eD and budget impact in KEUR
    """
    try:
        service = DeviationService(db)
        return service.calculate_product_deviation_summary(product_id, version_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate deviation summary: {str(e)}")


@router.get("/features/{feature_id}/deviation", response_model=FeatureDeviationResponse)
def get_feature_deviation(
    feature_id: str,
    version_id: str = Query(..., description="Roadmap version ID"),
    db: Session = Depends(get_db)
):
    """
    Get detailed deviation for a single feature.
    
    Returns:
    - Quarterly breakdown of strategic vs execution
    - Total deviation in eD and percentage
    - Budget impact in KEUR
    - Deviation status (aligned, minor, significant, under)
    - Acknowledgment status if applicable
    """
    try:
        service = DeviationService(db)
        return service.calculate_feature_deviation(feature_id, version_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate feature deviation: {str(e)}")


@router.get("/products/{product_id}/budget-validation", response_model=BudgetValidationTree)
def get_budget_validation_tree(
    product_id: str,
    version_id: str = Query(..., description="Roadmap version ID"),
    db: Session = Depends(get_db)
):
    """
    Get budget validation tree for a product.
    
    Returns hierarchical structure:
    - Product total (allocated vs planned)
    - Budget lines breakdown
    - Categories within each budget line
    
    Shows utilization percentage and remaining budget at each level.
    """
    try:
        service = DeviationService(db)
        return service.get_budget_validation_tree(product_id, version_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get budget validation: {str(e)}")
