"""
Budget Integration Service

Service for integrating roadmap planning with budget configuration.
Provides dynamic access to budget lines, categories, and allocations.
"""
from typing import Dict, List, Optional, Any
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.budget_new import (
    BudgetLine, BudgetCategory, ProductBudget,
    FiscalYear, BudgetVersion, BudgetLineProduct
)
from app.services.roadmap_service_v2 import RoadmapServiceV2


class BudgetIntegrationService:
    """Service for budget configuration integration"""

    @staticmethod
    def get_budget_lines_with_allocations(
        db: Session,
        year: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all budget lines with categories and allocations by year.
        
        Args:
            db: Database session
            year: Optional year filter to show only lines with allocation for that year
            
        Returns:
            List of budget line options with categories and year allocations
        """
        # Get all budget lines
        budget_lines = db.query(BudgetLine).all()
        
        result = []
        for line in budget_lines:
            # Get categories for this line
            categories = []
            budget_categories = db.query(BudgetCategory).filter(
                BudgetCategory.budget_line_id == line.id
            ).all()
            
            for cat in budget_categories:
                categories.append({
                    "budget_category_id": str(cat.id),
                    "budget_category_name": cat.name,
                    "budget_category_code": cat.name.lower().replace(" ", "_")  # Generate code from name
                })
            
            # Get allocations by year
            allocations_by_year = {}
            
            # Get all fiscal years
            fiscal_years = db.query(FiscalYear).all()
            
            for fy in fiscal_years:
                # Skip if year filter provided and doesn't match
                if year and fy.year != year:
                    continue
                
                # Get active budget version for this fiscal year
                budget_version = db.query(BudgetVersion).filter(
                    BudgetVersion.fiscal_year_id == fy.id,
                    BudgetVersion.is_active == True
                ).first()
                
                if budget_version:
                    # Get budget line allocations through budget_line_products
                    # Join ProductBudget -> BudgetLineProduct to get line-level allocations
                    line_allocations = db.query(BudgetLineProduct).join(
                        ProductBudget,
                        BudgetLineProduct.product_budget_id == ProductBudget.id
                    ).filter(
                        ProductBudget.budget_version_id == budget_version.id,
                        BudgetLineProduct.budget_line_id == line.id
                    ).all()
                    
                    if line_allocations:
                        # Sum allocated amounts for this budget line
                        total_allocated = sum(
                            Decimal(str(la.allocation_value)) for la in line_allocations
                        )
                        
                        allocations_by_year[fy.year] = {
                            "fiscal_year_id": str(fy.id),
                            "budget_version_id": str(budget_version.id),
                            "budget_version_name": f"Version {budget_version.version_number}",
                            "is_active": budget_version.is_active,
                            "allocated_keur": total_allocated
                        }
            
            # Skip this line if year filter provided and no allocation found
            if year and year not in allocations_by_year:
                continue
            
            result.append({
                "budget_line_id": str(line.id),
                "budget_line_name": line.name,
                "budget_line_code": line.code,
                "categories": categories,
                "allocations_by_year": allocations_by_year
            })
        
        return result

    @staticmethod
    def get_budget_allocation(
        db: Session,
        product_id: str,
        year: int,
        budget_line_id: str,
        budget_category_id: Optional[str] = None
    ) -> Optional[Decimal]:
        """
        Get budget allocation for a specific product, year, line, and optional category.
        
        Args:
            db: Database session
            product_id: Product ID
            year: Year (e.g., 2026)
            budget_line_id: Budget line ID
            budget_category_id: Optional budget category ID
            
        Returns:
            Allocated amount in KEUR or None if no budget exists
        """
        # Get latest active budget version for year
        budget_version = RoadmapServiceV2.get_latest_active_budget_version(
            db, product_id, year
        )
        
        if not budget_version:
            return None
        
        # Get product budget
        product_budget = db.query(ProductBudget).filter(
            ProductBudget.budget_version_id == budget_version.id,
            ProductBudget.product_id == product_id,
            ProductBudget.budget_line_id == budget_line_id
        ).first()
        
        if not product_budget:
            return None
        
        # If category specified, get category allocation
        if budget_category_id:
            category = db.query(BudgetCategory).filter(
                BudgetCategory.id == budget_category_id,
                BudgetCategory.budget_line_id == budget_line_id
            ).first()
            
            if not category:
                return None
            
            return Decimal(str(category.allocated_amount))
        
        # Return line allocation
        return Decimal(str(product_budget.allocated_amount))

    @staticmethod
    def validate_budget_line_exists(
        db: Session,
        budget_line_id: str,
        budget_category_id: Optional[str] = None
    ):
        """
        Validate that budget line and optional category exist.
        
        Args:
            db: Database session
            budget_line_id: Budget line ID
            budget_category_id: Optional budget category ID
            
        Raises:
            HTTPException if validation fails
        """
        budget_line = db.query(BudgetLine).filter(BudgetLine.id == budget_line_id).first()
        if not budget_line:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Budget line {budget_line_id} not found"
            )
        
        if budget_category_id:
            category = db.query(BudgetCategory).filter(
                BudgetCategory.id == budget_category_id,
                BudgetCategory.budget_line_id == budget_line_id
            ).first()
            
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Budget category {budget_category_id} not found or does not belong to budget line"
                )

    @staticmethod
    def check_budget_line_deleted(
        db: Session,
        budget_line_id: str
    ) -> bool:
        """
        Check if a budget line has been deleted.
        
        Args:
            db: Database session
            budget_line_id: Budget line ID
            
        Returns:
            True if budget line no longer exists
        """
        budget_line = db.query(BudgetLine).filter(BudgetLine.id == budget_line_id).first()
        return budget_line is None

    @staticmethod
    def get_features_with_deleted_budget_lines(
        db: Session,
        roadmap_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get features that reference deleted budget lines or categories.
        
        Args:
            db: Database session
            roadmap_id: Roadmap ID
            
        Returns:
            List of features with deleted budget references
        """
        from app.models.roadmap import RoadmapFeature
        
        features = db.query(RoadmapFeature).filter(
            RoadmapFeature.roadmap_id == roadmap_id
        ).all()
        
        flagged_features = []
        
        for feature in features:
            issues = []
            
            # Check budget line
            budget_line = db.query(BudgetLine).filter(
                BudgetLine.id == feature.budget_line_id
            ).first()
            
            if not budget_line:
                issues.append(f"Budget line has been deleted")
            
            # Check category if exists
            if feature.budget_category_id:
                category = db.query(BudgetCategory).filter(
                    BudgetCategory.id == feature.budget_category_id
                ).first()
                
                if not category:
                    issues.append(f"Budget category has been deleted")
            
            if issues:
                flagged_features.append({
                    "feature_id": str(feature.id),
                    "feature_name": feature.name,
                    "issues": issues
                })
        
        return flagged_features
