from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_train_context
from app.models.product import Product, ProductStatus
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse
)
from app.services.product_service import ProductService

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=ProductListResponse)
def list_products(
    status: Optional[str] = Query(None, description="Filter by status (active/inactive)"),
    search: Optional[str] = Query(None, description="Search by name or short code"),
    db: Session = Depends(get_db),
    train_id: Optional[str] = Depends(get_train_context),
):
    """
    List all products with optional filtering.

    - **status**: Filter by 'active' or 'inactive'
    - **search**: Search in name or short_code
    """
    products, total = ProductService.get_all(
        db, status=status, search=search, train_id=train_id)
    return ProductListResponse(data=products, total=total)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a single product by ID."""
    product = ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Convert to response with team_count
    return ProductResponse(
        id=product.id,
        name=product.name,
        short_code=product.short_code,
        description=product.description,
        status=product.status.value if isinstance(product.status, ProductStatus) else product.status,
        team_count=ProductService._get_team_count(db, product.id),
        created_at=product.created_at,
        updated_at=product.updated_at
    )


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new product.

    - **name**: Unique product name (required)
    - **short_code**: Unique 2-6 char code (required, auto-uppercased)
    - **description**: Optional description (max 500 chars)
    - **status**: 'active' (default) or 'inactive'
    """
    # Check for duplicate name
    existing = ProductService.get_by_name(db, product_data.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A product with this name already exists"
        )

    # Check for duplicate short_code
    existing = ProductService.get_by_short_code(db, product_data.short_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A product with this short code already exists"
        )

    product = ProductService.create(db, product_data)

    return ProductResponse(
        id=product.id,
        name=product.name,
        short_code=product.short_code,
        description=product.description,
        status=product.status.value if isinstance(product.status, ProductStatus) else product.status,
        train_id=product.train_id,
        team_count=0,
        created_at=product.created_at,
        updated_at=product.updated_at
    )


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: UUID,
    product_data: ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing product."""
    product = ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Check uniqueness if name is being changed
    if product_data.name and product_data.name.strip().lower() != product.name.lower():
        existing = ProductService.get_by_name(db, product_data.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A product with this name already exists"
            )

    # Check uniqueness if short_code is being changed
    if product_data.short_code and product_data.short_code.upper().strip() != product.short_code:
        existing = ProductService.get_by_short_code(db, product_data.short_code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A product with this short code already exists"
            )

    # Check deactivation constraints
    current_status = product.status.value if isinstance(product.status, ProductStatus) else product.status
    if product_data.status == "inactive" and current_status == "active":
        can_deactivate, reason = ProductService.can_deactivate(db, product_id)
        if not can_deactivate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot deactivate: {reason}"
            )

    updated = ProductService.update(db, product_id, product_data)

    return ProductResponse(
        id=updated.id,
        name=updated.name,
        short_code=updated.short_code,
        description=updated.description,
        status=updated.status.value if isinstance(updated.status, ProductStatus) else updated.status,
        team_count=ProductService._get_team_count(db, updated.id),
        created_at=updated.created_at,
        updated_at=updated.updated_at
    )


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Delete a product.

    Note: Products with associated budgets or features cannot be deleted.
    """
    product = ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    can_delete, reason = ProductService.can_delete(db, product_id)
    if not can_delete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete: {reason}"
        )

    ProductService.delete(db, product_id)
    return None
