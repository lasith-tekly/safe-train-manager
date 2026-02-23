"""
Budget Configuration API Routes
Handles endpoints for budget management with versioning and transversal support.
"""
from typing import List, Optional
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.budget_config_service import BudgetConfigService
from app.schemas.budget_config import (
    FiscalYearCreate, FiscalYearUpdate, FiscalYearResponse, FiscalYearListResponse,
    BudgetVersionCreate, BudgetVersionResponse, BudgetVersionDetailResponse, BudgetVersionListResponse,
    ProductBudgetCreate, ProductBudgetUpdate, ProductBudgetResponse, ProductBudgetDetailResponse, ProductBudgetListResponse,
    BudgetLineCreate, BudgetLineUpdate, BudgetLineResponse,
    BudgetCategoryCreate, BudgetCategoryUpdate, BudgetCategoryResponse,
    BudgetSummaryResponse, BudgetAuditLogListResponse
)

router = APIRouter(prefix="/api/budget", tags=["Budget Configuration"])

# TODO: Add authentication dependency
# from app.dependencies import get_current_user

# Temporary user ID for development
TEMP_USER_ID = UUID("00000000-0000-0000-0000-000000000001")


# ============= Fiscal Year Endpoints =============

@router.get("/fiscal-years", response_model=FiscalYearListResponse)
def get_fiscal_years(db: Session = Depends(get_db)):
    """Get all fiscal years."""
    fiscal_years = BudgetConfigService.get_fiscal_years(db)
    return FiscalYearListResponse(data=fiscal_years)


@router.post("/fiscal-years", response_model=FiscalYearResponse, status_code=201)
def create_fiscal_year(
    data: FiscalYearCreate,
    db: Session = Depends(get_db)
):
    """Create a new fiscal year."""
    fiscal_year = BudgetConfigService.create_fiscal_year(db, data)
    return fiscal_year


@router.put("/fiscal-years/{fiscal_year_id}", response_model=FiscalYearResponse)
def update_fiscal_year(
    fiscal_year_id: UUID,
    data: FiscalYearUpdate,
    db: Session = Depends(get_db)
):
    """Update fiscal year (mainly to set as current)."""
    fiscal_year = BudgetConfigService.update_fiscal_year(db, fiscal_year_id, data.is_current)
    if not fiscal_year:
        raise HTTPException(status_code=404, detail="Fiscal year not found")
    return fiscal_year


# ============= Budget Version Endpoints =============

@router.get("/versions", response_model=BudgetVersionListResponse)
def get_budget_versions(
    fiscal_year_id: UUID = Query(..., description="Fiscal year ID"),
    db: Session = Depends(get_db)
):
    """Get all budget versions for a fiscal year."""
    versions = BudgetConfigService.get_budget_versions(db, fiscal_year_id)
    return BudgetVersionListResponse(data=versions)


@router.post("/versions", response_model=BudgetVersionResponse, status_code=201)
def create_budget_version(
    data: BudgetVersionCreate,
    db: Session = Depends(get_db)
):
    """Create a new budget version."""
    version = BudgetConfigService.create_budget_version(db, data, TEMP_USER_ID)
    return version


@router.get("/versions/{version_id}", response_model=BudgetVersionDetailResponse)
def get_budget_version_detail(
    version_id: UUID,
    db: Session = Depends(get_db)
):
    """Get budget version with full hierarchy."""
    version = BudgetConfigService.get_budget_version_detail(db, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="Budget version not found")
    
    # Calculate summary
    total_budget = sum(pb.allocated_amount for pb in version.product_budgets)
    # TODO: Calculate consumed from features
    total_consumed = 0
    
    return BudgetVersionDetailResponse(
        **version.__dict__,
        summary={
            "total_budget": total_budget,
            "total_consumed": total_consumed,
            "total_remaining": total_budget - total_consumed,
            "utilization_percentage": (total_consumed / total_budget * 100) if total_budget > 0 else 0
        }
    )


# ============= Product Budget Endpoints =============

@router.get("/products", response_model=ProductBudgetListResponse)
def get_product_budgets(
    fiscal_year_id: Optional[UUID] = Query(None, description="Fiscal year ID"),
    version_id: Optional[UUID] = Query(None, description="Budget version ID"),
    db: Session = Depends(get_db)
):
    """Get product budgets for active version or specified version."""
    product_budgets = BudgetConfigService.get_product_budgets(db, fiscal_year_id, version_id)
    
    # Enrich with consumed amounts
    # TODO: Calculate from features
    response_data = []
    for pb in product_budgets:
        consumed = 0
        response_data.append(ProductBudgetResponse(
            id=pb.id,
            budget_version_id=pb.budget_version_id,
            product={"id": pb.product.id, "name": pb.product.name, "short_code": pb.product.short_code},
            allocated_amount=pb.allocated_amount,
            consumed_amount=consumed,
            remaining_amount=pb.allocated_amount - consumed,
            utilization_percentage=(consumed / pb.allocated_amount * 100) if pb.allocated_amount > 0 else 0,
            budget_lines_count=len(pb.budget_lines),
            created_at=pb.created_at,
            updated_at=pb.updated_at
        ))
    
    return ProductBudgetListResponse(data=response_data)


@router.post("/products", response_model=ProductBudgetResponse, status_code=201)
def create_or_update_product_budget(
    data: ProductBudgetCreate,
    db: Session = Depends(get_db)
):
    """Create or update product budget."""
    product_budget = BudgetConfigService.create_or_update_product_budget(db, data)
    
    consumed = 0  # TODO: Calculate from features
    return ProductBudgetResponse(
        id=product_budget.id,
        budget_version_id=product_budget.budget_version_id,
        product={"id": product_budget.product.id, "name": product_budget.product.name, "short_code": product_budget.product.short_code},
        allocated_amount=product_budget.allocated_amount,
        consumed_amount=consumed,
        remaining_amount=product_budget.allocated_amount - consumed,
        utilization_percentage=(consumed / product_budget.allocated_amount * 100) if product_budget.allocated_amount > 0 else 0,
        budget_lines_count=len(product_budget.budget_lines),
        created_at=product_budget.created_at,
        updated_at=product_budget.updated_at
    )


@router.get("/products/{product_budget_id}", response_model=ProductBudgetDetailResponse)
def get_product_budget_detail(
    product_budget_id: UUID,
    db: Session = Depends(get_db)
):
    """Get product budget details with budget lines."""
    product_budget = BudgetConfigService.get_product_budget_detail(db, product_budget_id)
    if not product_budget:
        raise HTTPException(status_code=404, detail="Product budget not found")
    
    # TODO: Calculate consumed amounts
    consumed = 0
    
    return ProductBudgetDetailResponse(
        id=product_budget.id,
        budget_version_id=product_budget.budget_version_id,
        product={"id": product_budget.product.id, "name": product_budget.product.name, "short_code": product_budget.product.short_code},
        allocated_amount=product_budget.allocated_amount,
        consumed_amount=consumed,
        remaining_amount=product_budget.allocated_amount - consumed,
        utilization_percentage=(consumed / product_budget.allocated_amount * 100) if product_budget.allocated_amount > 0 else 0,
        budget_lines_count=len(product_budget.budget_lines),
        budget_lines=product_budget.budget_lines,
        created_at=product_budget.created_at,
        updated_at=product_budget.updated_at
    )


# ============= Budget Line Endpoints =============

@router.post("/lines", response_model=BudgetLineResponse, status_code=201)
def create_budget_line(
    data: BudgetLineCreate,
    db: Session = Depends(get_db)
):
    """Create a budget line (transversal or non-transversal)."""
    # Validate transversal allocations
    if data.is_transversal and data.product_allocations:
        if len(data.product_allocations) < 2:
            raise HTTPException(
                status_code=400, 
                detail="Transversal budget lines must have at least 2 product allocations"
            )
        
        # Validate percentage allocations sum to 100
        percentage_allocs = [a for a in data.product_allocations if a.allocation_type == "PERCENTAGE"]
        if percentage_allocs:
            total_pct = sum(a.allocation_value for a in percentage_allocs)
            if total_pct != 100:
                raise HTTPException(
                    status_code=400,
                    detail=f"Percentage allocations must sum to 100, got {total_pct}"
                )
    
    budget_line = BudgetConfigService.create_budget_line(db, data, TEMP_USER_ID)
    return budget_line


@router.put("/lines/{budget_line_id}", response_model=BudgetLineResponse)
def update_budget_line(
    budget_line_id: UUID,
    data: BudgetLineUpdate,
    db: Session = Depends(get_db)
):
    """Update budget line."""
    budget_line = BudgetConfigService.update_budget_line(
        db, budget_line_id, data.name, data.allocated_amount, TEMP_USER_ID
    )
    if not budget_line:
        raise HTTPException(status_code=404, detail="Budget line not found")
    return budget_line


@router.delete("/lines/{budget_line_id}", status_code=204)
def delete_budget_line(
    budget_line_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete budget line.
    
    Returns 409 if the budget line is referenced by Roadmap features.
    """
    result = BudgetConfigService.delete_budget_line(
        db, budget_line_id, TEMP_USER_ID
    )
    
    if not result["success"]:
        if result["error_code"] == "NOT_FOUND":
            raise HTTPException(
                status_code=404, 
                detail="Budget line not found"
            )
        if result["error_code"] == "HAS_REFERENCES":
            raise HTTPException(
                status_code=409,
                detail={
                    "message": result["message"],
                    "features": result["features"]
                }
            )
    
    return None


@router.delete("/products/{product_budget_id}", status_code=204)
def delete_product_budget(
    product_budget_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete product budget and all associated budget lines."""
    success = BudgetConfigService.delete_product_budget(db, product_budget_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product budget not found")
    return None


# ============= Budget Category Endpoints =============

@router.post("/categories", response_model=BudgetCategoryResponse, status_code=201)
def create_budget_category(
    data: BudgetCategoryCreate,
    db: Session = Depends(get_db)
):
    """Create a budget category."""
    category = BudgetConfigService.create_budget_category(db, data, TEMP_USER_ID)
    return category


@router.put("/categories/{category_id}", response_model=BudgetCategoryResponse)
def update_budget_category(
    category_id: UUID,
    data: BudgetCategoryUpdate,
    db: Session = Depends(get_db)
):
    """Update budget category."""
    category = BudgetConfigService.update_budget_category(
        db, category_id, data.name, data.allocated_amount, TEMP_USER_ID
    )
    if not category:
        raise HTTPException(status_code=404, detail="Budget category not found")
    return category


@router.delete("/categories/{category_id}", status_code=204)
def delete_budget_category(
    category_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete budget category."""
    success = BudgetConfigService.delete_budget_category(db, category_id, TEMP_USER_ID)
    if not success:
        raise HTTPException(status_code=404, detail="Budget category not found")
    return None


# ============= Summary & Reports Endpoints =============

@router.get("/summary", response_model=BudgetSummaryResponse)
def get_budget_summary(
    fiscal_year_id: Optional[UUID] = Query(None, description="Fiscal year ID"),
    version_id: Optional[UUID] = Query(None, description="Budget version ID"),
    db: Session = Depends(get_db)
):
    """Get budget summary for active version or specified version."""
    summary = BudgetConfigService.get_budget_summary(db, fiscal_year_id, version_id)
    if not summary:
        raise HTTPException(status_code=404, detail="No budget data found")
    return summary


@router.get("/audit-log", response_model=BudgetAuditLogListResponse)
def get_audit_log(
    entity_type: Optional[str] = Query(None, description="Entity type filter"),
    entity_id: Optional[UUID] = Query(None, description="Entity ID filter"),
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    changed_by: Optional[UUID] = Query(None, description="User ID filter"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db)
):
    """Get audit log with filters and pagination."""
    logs, total = BudgetConfigService.get_audit_log(
        db, entity_type, entity_id, start_date, end_date, changed_by, page, page_size
    )
    
    return BudgetAuditLogListResponse(
        data=logs,
        pagination={
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
            "total_items": total
        }
    )
