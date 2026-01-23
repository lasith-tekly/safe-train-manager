from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.capacity_allocation import CapacityAllocationCategory
from app.schemas.capacity_allocation import (
    CapacityAllocationCategoryCreate,
    CapacityAllocationCategoryUpdate,
    CapacityAllocationSummary,
    CapacityAllocationCategoryResponse
)


class CapacityAllocationService:
    """Service for managing capacity allocation categories"""

    @staticmethod
    def get_categories_by_year(db: Session, year: int, active_only: bool = True) -> List[CapacityAllocationCategory]:
        """Get all capacity allocation categories for a year"""
        query = db.query(CapacityAllocationCategory).filter(
            CapacityAllocationCategory.year == year
        )
        if active_only:
            query = query.filter(CapacityAllocationCategory.is_active == True)
        return query.order_by(CapacityAllocationCategory.sort_order).all()

    @staticmethod
    def get_category_by_id(db: Session, category_id: str) -> Optional[CapacityAllocationCategory]:
        """Get a specific category by ID"""
        return db.query(CapacityAllocationCategory).filter(
            CapacityAllocationCategory.id == category_id
        ).first()

    @staticmethod
    def create_category(db: Session, data: CapacityAllocationCategoryCreate) -> CapacityAllocationCategory:
        """Create a new capacity allocation category"""
        # Get max sort_order for the year
        max_order = db.query(CapacityAllocationCategory).filter(
            CapacityAllocationCategory.year == data.year
        ).count()
        
        category = CapacityAllocationCategory(
            year=data.year,
            name=data.name,
            code=data.code,
            description=data.description,
            default_percentage=data.default_percentage,
            color=data.color,
            sort_order=data.sort_order if data.sort_order > 0 else max_order,
            is_active=data.is_active
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def update_category(
        db: Session, 
        category_id: str, 
        data: CapacityAllocationCategoryUpdate
    ) -> Optional[CapacityAllocationCategory]:
        """Update an existing category"""
        category = db.query(CapacityAllocationCategory).filter(
            CapacityAllocationCategory.id == category_id
        ).first()
        
        if not category:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(category, field, value)
        
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def delete_category(db: Session, category_id: str) -> bool:
        """Delete a category (soft delete by setting is_active=False)"""
        category = db.query(CapacityAllocationCategory).filter(
            CapacityAllocationCategory.id == category_id
        ).first()
        
        if not category:
            return False
        
        # Soft delete
        category.is_active = False
        db.commit()
        return True

    @staticmethod
    def hard_delete_category(db: Session, category_id: str) -> bool:
        """Permanently delete a category"""
        category = db.query(CapacityAllocationCategory).filter(
            CapacityAllocationCategory.id == category_id
        ).first()
        
        if not category:
            return False
        
        db.delete(category)
        db.commit()
        return True

    @staticmethod
    def get_summary(db: Session, year: int) -> CapacityAllocationSummary:
        """Get capacity allocation summary for a year"""
        categories = CapacityAllocationService.get_categories_by_year(db, year, active_only=True)
        total_allocated = sum(c.default_percentage for c in categories)
        
        return CapacityAllocationSummary(
            year=year,
            categories=[CapacityAllocationCategoryResponse.model_validate(c) for c in categories],
            total_allocated=total_allocated,
            remaining_for_iteration=100 - total_allocated
        )

    @staticmethod
    def initialize_default_categories(db: Session, year: int) -> List[CapacityAllocationCategory]:
        """Initialize default categories for a year if none exist"""
        existing = CapacityAllocationService.get_categories_by_year(db, year, active_only=False)
        if existing:
            return existing
        
        defaults = [
            {
                "name": "Feature Capacity",
                "code": "feature_capacity",
                "description": "New features for business",
                "default_percentage": 20,
                "color": "#1890ff",
                "sort_order": 0
            },
            {
                "name": "IT Excellence",
                "code": "it_excellence",
                "description": "Tech debt, tooling improvements",
                "default_percentage": 12,
                "color": "#52c41a",
                "sort_order": 1
            },
            {
                "name": "Component Work",
                "code": "component_work",
                "description": "Shared services, infrastructure",
                "default_percentage": 8,
                "color": "#faad14",
                "sort_order": 2
            }
        ]
        
        categories = []
        for default in defaults:
            category = CapacityAllocationCategory(
                year=year,
                **default,
                is_active=True
            )
            db.add(category)
            categories.append(category)
        
        db.commit()
        for cat in categories:
            db.refresh(cat)
        
        return categories
