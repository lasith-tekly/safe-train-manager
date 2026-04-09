from typing import Optional, Tuple, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.models.product import Product, ProductStatus
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse


class ProductService:
    """Service layer for Product business logic."""

    @staticmethod
    def get_all(
        db: Session,
        status: Optional[str] = None,
        search: Optional[str] = None,
        train_id: Optional[str] = None
    ) -> Tuple[List[ProductResponse], int]:
        """Get all products with optional filtering."""
        query = db.query(Product)

        if train_id is not None:
            query = query.filter(Product.train_id == train_id)

        if status:
            query = query.filter(Product.status == status)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_term),
                    Product.short_code.ilike(search_term)
                )
            )

        total = query.count()
        products = query.order_by(Product.name).all()

        # Convert to response objects with team_count
        result = []
        for product in products:
            team_count = ProductService._get_team_count(db, product.id)
            product_response = ProductResponse(
                id=product.id,
                name=product.name,
                short_code=product.short_code,
                description=product.description,
                status=product.status.value if isinstance(product.status, ProductStatus) else product.status,
                team_count=team_count,
                created_at=product.created_at,
                updated_at=product.updated_at
            )
            result.append(product_response)

        return result, total

    @staticmethod
    def get_by_id(db: Session, product_id: UUID) -> Optional[Product]:
        """Get product by ID."""
        return db.query(Product).filter(Product.id == str(product_id)).first()

    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Product]:
        """Get product by name (case-insensitive)."""
        return db.query(Product).filter(
            func.lower(Product.name) == func.lower(name)
        ).first()

    @staticmethod
    def get_by_short_code(db: Session, short_code: str) -> Optional[Product]:
        """Get product by short code (case-insensitive)."""
        return db.query(Product).filter(
            func.lower(Product.short_code) == func.lower(short_code)
        ).first()

    @staticmethod
    def create(db: Session, data: ProductCreate) -> Product:
        """Create a new product."""
        product = Product(
            name=data.name.strip(),
            short_code=data.short_code.upper().strip(),
            description=data.description,
            status=ProductStatus(data.status),
            train_id=data.train_id if hasattr(data, 'train_id') else None
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def update(db: Session, product_id: UUID, data: ProductUpdate) -> Product:
        """Update an existing product."""
        product = db.query(Product).filter(Product.id == str(product_id)).first()

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is None:
                continue
            if field == 'short_code':
                value = value.upper().strip()
            if field == 'status':
                value = ProductStatus(value)
            if field == 'name':
                value = value.strip()
            setattr(product, field, value)

        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def delete(db: Session, product_id: UUID) -> None:
        """Delete a product."""
        product = db.query(Product).filter(Product.id == str(product_id)).first()
        db.delete(product)
        db.commit()

    @staticmethod
    def can_deactivate(db: Session, product_id: UUID) -> Tuple[bool, str]:
        """Check if product can be deactivated."""
        # TODO: Implement when BudgetVersion and Feature models exist
        # Check for active budget versions
        # Check for in-progress features
        return True, ""

    @staticmethod
    def can_delete(db: Session, product_id: UUID) -> Tuple[bool, str]:
        """
        Check if product can be deleted.
        
        Products cannot be deleted if they have:
        - Active roadmaps
        - Budget allocations
        
        Instead, use archive/inactive status.
        """
        from app.models.roadmap import Roadmap
        from app.models.budget_new import ProductBudget
        
        product_id_str = str(product_id)
        
        # Check for roadmaps
        roadmap_count = db.query(Roadmap).filter(
            Roadmap.product_id == product_id_str
        ).count()
        
        if roadmap_count > 0:
            return False, f"Product has {roadmap_count} roadmap(s). Archive the product instead of deleting it."
        
        # Check for budget allocations
        budget_count = db.query(ProductBudget).filter(
            ProductBudget.product_id == product_id_str
        ).count()
        
        if budget_count > 0:
            return False, f"Product has budget allocation(s). Archive the product instead of deleting it."
        
        return True, ""

    @staticmethod
    def _get_team_count(db: Session, product_id: UUID) -> int:
        """Get count of teams working on this product's features."""
        # TODO: Implement when Feature and Team models exist
        return 0
