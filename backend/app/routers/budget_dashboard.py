"""
Budget Dashboard API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.budget_dashboard import (
    ProductsOverviewResponse,
    ProductDetailResponse,
    BudgetLineDetailResponse,
    ChartDataResponse
)
from app.services.budget_dashboard_service import BudgetDashboardService

router = APIRouter(prefix="/api/budget/dashboard", tags=["budget-dashboard"])


@router.get("/products", response_model=ProductsOverviewResponse)
def get_products_overview(
    fiscal_year_id: str = Query(..., description="Fiscal year ID"),
    db: Session = Depends(get_db)
):
    """
    Get all products with budget summaries for a fiscal year.
    
    Args:
        fiscal_year_id: Fiscal year ID
        db: Database session
        
    Returns:
        Products overview with summaries
        
    Raises:
        HTTPException: 404 if fiscal year not found
    """
    result = BudgetDashboardService.get_products_overview(db, fiscal_year_id)
    
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Fiscal year not found"
        )
    
    return result


@router.get("/product/{product_id}", response_model=ProductDetailResponse)
def get_product_detail(
    product_id: str,
    budget_version_id: Optional[str] = Query(None, description="Budget version ID (defaults to active)"),
    db: Session = Depends(get_db)
):
    """
    Get detailed budget information for a specific product.
    
    Args:
        product_id: Product ID
        budget_version_id: Optional budget version ID
        db: Database session
        
    Returns:
        Product budget details
        
    Raises:
        HTTPException: 404 if product not found
    """
    result = BudgetDashboardService.get_product_detail(db, product_id, budget_version_id)
    
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found or no active budget version"
        )
    
    return result


@router.get("/line/{line_id}", response_model=BudgetLineDetailResponse)
def get_budget_line_detail(
    line_id: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a specific budget line.
    
    Args:
        line_id: Budget line ID
        db: Database session
        
    Returns:
        Budget line details
        
    Raises:
        HTTPException: 404 if budget line not found
    """
    result = BudgetDashboardService.get_budget_line_detail(db, line_id)
    
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Budget line not found"
        )
    
    return result


@router.get("/line/{line_id}/chart-data", response_model=ChartDataResponse)
def get_chart_data(
    line_id: str,
    db: Session = Depends(get_db)
):
    """
    Get PI-level chart data for target vs actual/forecast.
    
    Args:
        line_id: Budget line ID
        db: Database session
        
    Returns:
        Chart data with target, planned, and forecast amounts
        
    Raises:
        HTTPException: 404 if budget line not found
    """
    result = BudgetDashboardService.get_chart_data(db, line_id)
    
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Budget line not found"
        )
    
    return result
