"""
Roadmap Service V2

Business logic for multi-year roadmap management with dynamic budget integration.
"""
from typing import Dict, List, Optional, Any
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.roadmap import Roadmap, RoadmapFeature, FeatureYearAllocation, FeaturePIAllocation
from app.models.budget_new import (
    BudgetLine, BudgetCategory, ProductBudget, 
    FiscalYear, BudgetVersion, BudgetLineProduct
)
from app.models.global_settings import GlobalSettings
from app.models.product import Product
import uuid


class RoadmapServiceV2:
    """Service class for multi-year roadmap business logic"""

    @staticmethod
    def _save_pi_allocations(
        db: Session,
        year_allocation_id: str,
        pi_allocations: Optional[List[Any]]
    ) -> None:
        """
        Save PI allocations for a year allocation.
        
        Deletes existing PI allocations and creates new ones.
        
        Args:
            db: Database session
            year_allocation_id: Year allocation ID
            pi_allocations: List of PI allocation inputs (or None)
        """
        if pi_allocations is None or len(pi_allocations) == 0:
            return
        
        # Delete existing PI allocations
        db.query(FeaturePIAllocation).filter(
            FeaturePIAllocation.feature_year_allocation_id == year_allocation_id
        ).delete()
        
        # Create new PI allocations
        for pi in pi_allocations:
            pi_allocation = FeaturePIAllocation(
                id=str(uuid.uuid4()),
                feature_year_allocation_id=year_allocation_id,
                quarter=pi.quarter,
                budget_keur=pi.budget_keur
            )
            db.add(pi_allocation)

    @staticmethod
    def calculate_budget_from_effort(
        effort_days: Decimal,
        year: int,
        db: Session
    ) -> Decimal:
        """
        Calculate budget from effort days using formula:
        Budget (KEUR) = (eD × Structural_Cost_Ratio × Unit_Cost) / eD_per_Year
        
        Args:
            effort_days: Effort days to convert
            year: Year for settings lookup (e.g., 2026)
            db: Database session
            
        Returns:
            Budget in KEUR (rounded to 2 decimals)
        """
        if effort_days == 0:
            return Decimal("0")
        
        # Get global settings for the year
        settings = db.query(GlobalSettings).filter(
            GlobalSettings.year == year
        ).first()
        
        if not settings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Global settings not found for year {year}"
            )
        
        # Extract conversion factors
        unit_cost = Decimal(str(settings.train_unit_cost_keur))
        ed_per_year = Decimal(str(settings.effort_days_per_year))
        structural_ratio = Decimal(str(settings.train_structural_cost_ratio))
        
        # Calculate budget: (eD × Structural_Cost_Ratio × Unit_Cost) / eD_per_Year
        budget = (effort_days * structural_ratio * unit_cost) / ed_per_year
        
        return round(budget, 2)

    @staticmethod
    def calculate_effort_from_budget(
        budget_keur: Decimal,
        year: int,
        db: Session
    ) -> Decimal:
        """
        Calculate effort days from budget using inverse formula:
        eD = ((Budget / Unit_Cost) × eD_per_Year) / Structural_Cost_Ratio
        
        Args:
            budget_keur: Budget in KEUR to convert
            year: Year for settings lookup
            db: Database session
            
        Returns:
            Effort days (rounded to 2 decimals)
        """
        if budget_keur == 0:
            return Decimal("0")
        
        # Get global settings
        settings = db.query(GlobalSettings).filter(
            GlobalSettings.year == year
        ).first()
        
        if not settings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Global settings not found for year {year}"
            )
        
        # Extract conversion factors
        unit_cost = Decimal(str(settings.train_unit_cost_keur))
        ed_per_year = Decimal(str(settings.effort_days_per_year))
        structural_ratio = Decimal(str(settings.train_structural_cost_ratio))
        
        # Calculate effort days: ((Budget / Unit_Cost) × eD_per_Year) / Structural_Cost_Ratio
        effort_days = ((budget_keur / unit_cost) * ed_per_year) / structural_ratio
        
        return round(effort_days, 2)

    @staticmethod
    def get_latest_active_budget_version(
        db: Session,
        product_id: str,
        year: int
    ) -> Optional[BudgetVersion]:
        """
        Get the latest active budget version for a product and year.
        
        Args:
            db: Database session
            product_id: Product ID
            year: Year (e.g., 2026)
            
        Returns:
            BudgetVersion or None if no budget exists for that year
        """
        # Get fiscal year for the year
        fiscal_year = db.query(FiscalYear).filter(FiscalYear.year == year).first()
        if not fiscal_year:
            return None
        
        # Get active budget version for fiscal year
        budget_version = db.query(BudgetVersion).filter(
            BudgetVersion.fiscal_year_id == fiscal_year.id,
            BudgetVersion.is_active == True
        ).first()
        
        return budget_version

    @staticmethod
    def calculate_budget_status(
        allocated_keur: Optional[Decimal],
        planned_keur: Decimal,
        threshold_percent: Decimal = Decimal("90")
    ) -> Dict[str, Any]:
        """
        Calculate budget status for a year.
        
        Args:
            allocated_keur: Allocated budget (None if no budget for year)
            planned_keur: Planned budget
            threshold_percent: Threshold for "balanced" status (default 90%)
            
        Returns:
            Dictionary with status information
        """
        if allocated_keur is None or allocated_keur == 0:
            return {
                "status": "no_budget",
                "has_budget": False,
                "note": "No budget allocated for this year"
            }
        
        variance = allocated_keur - planned_keur
        utilization = (planned_keur / allocated_keur) * 100
        
        if utilization > 100:
            status = "over_budget"
        elif utilization < threshold_percent:
            status = "under_planned"
        else:
            status = "balanced"
        
        return {
            "status": status,
            "has_budget": True,
            "allocated_keur": allocated_keur,
            "planned_keur": planned_keur,
            "variance_keur": variance,
            "utilization_percent": round(utilization, 2)
        }

    @staticmethod
    def create_roadmap(
        db: Session,
        product_id: str,
        name: str,
        description: Optional[str],
        created_by: str
    ) -> Roadmap:
        """
        Create a new roadmap for a product.
        
        Args:
            db: Database session
            product_id: Product ID
            name: Roadmap name
            description: Optional description
            created_by: User ID creating the roadmap
            
        Returns:
            Created Roadmap
        """
        # Validate product exists
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        roadmap = Roadmap(
            product_id=product_id,
            name=name,
            description=description,
            created_by=created_by,
            status="draft"
        )
        db.add(roadmap)
        db.commit()
        db.refresh(roadmap)
        return roadmap

    @staticmethod
    def activate_roadmap(db: Session, roadmap_id: str) -> Roadmap:
        """
        Activate roadmap and archive any existing active roadmap for the same product.
        
        Args:
            db: Database session
            roadmap_id: Roadmap ID to activate
            
        Returns:
            Activated roadmap
        """
        roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
        if not roadmap:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Roadmap not found"
            )
        
        if roadmap.status == "active":
            return roadmap  # Already active
        
        # Archive existing active roadmap for this product
        existing_active = db.query(Roadmap).filter(
            Roadmap.product_id == roadmap.product_id,
            Roadmap.status == "active",
            Roadmap.id != roadmap_id
        ).first()
        
        if existing_active:
            existing_active.status = "archived"
        
        roadmap.status = "active"
        db.commit()
        db.refresh(roadmap)
        return roadmap

    @staticmethod
    def get_roadmap_with_budget_status(
        db: Session,
        roadmap_id: str
    ) -> Dict[str, Any]:
        """
        Get roadmap with features and real-time budget status.
        
        Compares to latest active budget versions per year.
        
        Args:
            db: Database session
            roadmap_id: Roadmap ID
            
        Returns:
            Dictionary with roadmap and budget_summary
        """
        roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
        if not roadmap:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Roadmap not found"
            )
        
        # Get all years covered by features
        years = set()
        for feature in roadmap.features:
            for allocation in feature.year_allocations:
                years.add(allocation.year)
        
        # Calculate budget status per year
        budget_summary = {}
        for year in sorted(years):
            budget_version = RoadmapServiceV2.get_latest_active_budget_version(
                db, roadmap.product_id, year
            )
            
            if budget_version:
                # Year has budget - calculate status
                year_summary = RoadmapServiceV2.calculate_year_budget_status(
                    db, roadmap, year, budget_version
                )
            else:
                # Year has no budget - planning only
                planned_total = sum(
                    allocation.budget_keur
                    for feature in roadmap.features
                    for allocation in feature.year_allocations
                    if allocation.year == year
                )
                year_summary = {
                    "year": year,
                    "has_budget": False,
                    "total_planned_keur": planned_total,
                    "note": "No budget allocated for this year",
                    "budget_lines": []
                }
            
            budget_summary[year] = year_summary
        
        return {
            "roadmap": roadmap,
            "budget_summary": budget_summary
        }

    @staticmethod
    def calculate_year_budget_status(
        db: Session,
        roadmap: Roadmap,
        year: int,
        budget_version: BudgetVersion
    ) -> Dict[str, Any]:
        """
        Calculate budget status for a specific year.
        
        Args:
            db: Database session
            roadmap: Roadmap instance
            year: Year to calculate for
            budget_version: Budget version for the year
            
        Returns:
            Year budget summary dictionary
        """
        # Get budget line allocations through budget_line_products
        line_allocations = db.query(BudgetLineProduct, BudgetLine).join(
            ProductBudget,
            BudgetLineProduct.product_budget_id == ProductBudget.id
        ).join(
            BudgetLine,
            BudgetLineProduct.budget_line_id == BudgetLine.id
        ).filter(
            ProductBudget.budget_version_id == budget_version.id,
            ProductBudget.product_id == roadmap.product_id
        ).all()
        
        budget_lines_summary = []
        total_allocated = Decimal("0")
        total_planned = Decimal("0")
        
        for line_alloc, budget_line in line_allocations:
            # Calculate planned budget for this line in this year
            planned = db.query(func.sum(FeatureYearAllocation.budget_keur)).join(
                RoadmapFeature
            ).filter(
                RoadmapFeature.roadmap_id == roadmap.id,
                RoadmapFeature.budget_line_id == budget_line.id,
                FeatureYearAllocation.year == year
            ).scalar() or Decimal("0")
            
            # Get feature count
            feature_count = db.query(func.count(func.distinct(RoadmapFeature.id))).join(
                FeatureYearAllocation
            ).filter(
                RoadmapFeature.roadmap_id == roadmap.id,
                RoadmapFeature.budget_line_id == budget_line.id,
                FeatureYearAllocation.year == year
            ).scalar() or 0
            
            allocated = Decimal(str(line_alloc.allocation_value))
            status_info = RoadmapServiceV2.calculate_budget_status(allocated, planned)
            
            # Get categories for this line
            categories = []
            budget_categories = db.query(BudgetCategory).filter(
                BudgetCategory.budget_line_id == budget_line.id
            ).all()
            
            for cat in budget_categories:
                cat_planned = db.query(func.sum(FeatureYearAllocation.budget_keur)).join(
                    RoadmapFeature
                ).filter(
                    RoadmapFeature.roadmap_id == roadmap.id,
                    RoadmapFeature.budget_line_id == budget_line.id,
                    RoadmapFeature.budget_category_id == cat.id,
                    FeatureYearAllocation.year == year
                ).scalar() or Decimal("0")
                
                cat_feature_count = db.query(func.count(func.distinct(RoadmapFeature.id))).join(
                    FeatureYearAllocation
                ).filter(
                    RoadmapFeature.roadmap_id == roadmap.id,
                    RoadmapFeature.budget_line_id == budget_line.id,
                    RoadmapFeature.budget_category_id == cat.id,
                    FeatureYearAllocation.year == year
                ).scalar() or 0
                
                cat_allocated = Decimal(str(cat.allocated_amount))
                cat_status_info = RoadmapServiceV2.calculate_budget_status(cat_allocated, cat_planned)
                
                categories.append({
                    "budget_category_id": str(cat.id),
                    "category_name": cat.name,
                    "allocated_keur": cat_allocated,
                    "planned_keur": cat_planned,
                    "variance_keur": cat_status_info.get("variance_keur"),
                    "utilization_percent": cat_status_info.get("utilization_percent"),
                    "status": cat_status_info["status"],
                    "feature_count": cat_feature_count
                })
            
            budget_lines_summary.append({
                "budget_line_id": str(budget_line.id),
                "budget_line_name": budget_line.name,
                "allocated_keur": allocated,
                "planned_keur": planned,
                "variance_keur": status_info.get("variance_keur"),
                "utilization_percent": status_info.get("utilization_percent"),
                "status": status_info["status"],
                "feature_count": feature_count,
                "categories": categories
            })
            
            total_allocated += allocated
            total_planned += planned
        
        overall_status_info = RoadmapServiceV2.calculate_budget_status(total_allocated, total_planned)
        
        return {
            "year": year,
            "has_budget": True,
            "fiscal_year_id": str(budget_version.fiscal_year_id),
            "budget_version_id": str(budget_version.id),
            "budget_version_name": f"Version {budget_version.version_number}",
            "total_allocated_keur": total_allocated,
            "total_planned_keur": total_planned,
            "overall_status": overall_status_info["status"],
            "budget_lines": budget_lines_summary
        }

    @staticmethod
    def list_roadmaps(
        db: Session,
        product_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        List roadmaps with optional filters.
        
        Args:
            db: Database session
            product_id: Optional product filter
            status: Optional status filter
            
        Returns:
            List of roadmap summaries
        """
        query = db.query(Roadmap)
        
        if product_id:
            query = query.filter(Roadmap.product_id == product_id)
        if status:
            query = query.filter(Roadmap.status == status)
        
        roadmaps = query.all()
        
        result = []
        for roadmap in roadmaps:
            # Get years covered
            years = set()
            for feature in roadmap.features:
                for allocation in feature.year_allocations:
                    years.add(allocation.year)
            
            # Calculate total budget
            total_budget = sum(
                feature.total_budget_keur for feature in roadmap.features
            )
            
            result.append({
                "id": str(roadmap.id),
                "product_id": str(roadmap.product_id),
                "product_name": roadmap.product.name,
                "name": roadmap.name,
                "description": roadmap.description,
                "status": roadmap.status,
                "feature_count": len(roadmap.features),
                "total_budget_keur": total_budget,
                "years_covered": sorted(list(years)),
                "created_at": roadmap.created_at,
                "updated_at": roadmap.updated_at
            })
        
        return result
