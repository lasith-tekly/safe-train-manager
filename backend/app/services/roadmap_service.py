"""
Roadmap Service

Business logic for roadmap management, budget calculations, and validations.
"""
from typing import Dict, List, Optional, Any
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.roadmap import Roadmap, RoadmapFeature
from app.models.budget_new import BudgetLine, BudgetCategory, ProductBudget, FiscalYear
from app.models.global_settings import GlobalSettings
from app.schemas.roadmap import (
    RoadmapFeatureCreate, RoadmapFeatureUpdate,
    BudgetLineSummary, BudgetCategorySummary
)


class RoadmapService:
    """Service class for roadmap business logic"""

    @staticmethod
    def calculate_budget_from_effort(
        effort_days: Decimal,
        fiscal_year_id: str,
        db: Session
    ) -> Decimal:
        """
        Calculate budget from effort days using formula:
        Budget (KEUR) = (eD × Structural_Cost_Ratio × Unit_Cost) / eD_per_Year
        
        Args:
            effort_days: Effort days to convert
            fiscal_year_id: Fiscal year ID for settings lookup
            db: Database session
            
        Returns:
            Budget in KEUR (rounded to 2 decimals)
            
        Raises:
            HTTPException: If fiscal year or settings not found
        """
        # Get fiscal year
        fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
        if not fiscal_year:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fiscal year not found"
            )
        
        # Get global settings for the fiscal year
        settings = db.query(GlobalSettings).filter(
            GlobalSettings.year == fiscal_year.year
        ).first()
        
        if not settings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Global settings not found for year {fiscal_year.year}"
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
        fiscal_year_id: str,
        db: Session
    ) -> Decimal:
        """
        Calculate effort days from budget using inverse formula:
        eD = ((Budget / Unit_Cost) × eD_per_Year) / Structural_Cost_Ratio
        
        Args:
            budget_keur: Budget in KEUR to convert
            fiscal_year_id: Fiscal year ID for settings lookup
            db: Database session
            
        Returns:
            Effort days (rounded to 2 decimals)
            
        Raises:
            HTTPException: If fiscal year or settings not found
        """
        # Get fiscal year
        fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
        if not fiscal_year:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fiscal year not found"
            )
        
        # Get global settings
        settings = db.query(GlobalSettings).filter(
            GlobalSettings.year == fiscal_year.year
        ).first()
        
        if not settings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Global settings not found for year {fiscal_year.year}"
            )
        
        # Extract conversion factors
        unit_cost = Decimal(str(settings.train_unit_cost_keur))
        ed_per_year = Decimal(str(settings.effort_days_per_year))
        structural_ratio = Decimal(str(settings.train_structural_cost_ratio))
        
        # Calculate effort days: ((Budget / Unit_Cost) × eD_per_Year) / Structural_Cost_Ratio
        effort_days = ((budget_keur / unit_cost) * ed_per_year) / structural_ratio
        
        return round(effort_days, 2)

    @staticmethod
    def calculate_feature_totals(
        feature_data: RoadmapFeatureCreate,
        fiscal_year_id: str,
        db: Session
    ) -> Dict[str, Decimal]:
        """
        Calculate totals and budget for all quarters
        
        Args:
            feature_data: Feature creation data with quarterly effort days
            fiscal_year_id: Fiscal year ID for budget calculation
            db: Database session
            
        Returns:
            Dictionary with calculated totals and quarterly budgets
        """
        # Calculate total effort days
        total_effort = (
            feature_data.q1_effort_days +
            feature_data.q2_effort_days +
            feature_data.q3_effort_days +
            feature_data.q4_effort_days
        )
        
        # Calculate budget for each quarter
        q1_budget = RoadmapService.calculate_budget_from_effort(
            feature_data.q1_effort_days, fiscal_year_id, db
        )
        q2_budget = RoadmapService.calculate_budget_from_effort(
            feature_data.q2_effort_days, fiscal_year_id, db
        )
        q3_budget = RoadmapService.calculate_budget_from_effort(
            feature_data.q3_effort_days, fiscal_year_id, db
        )
        q4_budget = RoadmapService.calculate_budget_from_effort(
            feature_data.q4_effort_days, fiscal_year_id, db
        )
        
        # Calculate total budget
        total_budget = q1_budget + q2_budget + q3_budget + q4_budget
        
        return {
            "total_effort_days": total_effort,
            "total_budget_keur": total_budget,
            "q1_budget_keur": q1_budget,
            "q2_budget_keur": q2_budget,
            "q3_budget_keur": q3_budget,
            "q4_budget_keur": q4_budget,
        }

    @staticmethod
    def recalculate_feature_totals(
        feature: RoadmapFeature,
        update_data: RoadmapFeatureUpdate,
        fiscal_year_id: str,
        db: Session
    ) -> Dict[str, Decimal]:
        """
        Recalculate totals when updating a feature
        
        Args:
            feature: Existing feature
            update_data: Update data (may contain new effort days)
            fiscal_year_id: Fiscal year ID
            db: Database session
            
        Returns:
            Dictionary with updated totals and budgets
        """
        # Use updated values or existing values
        q1_effort = update_data.q1_effort_days if update_data.q1_effort_days is not None else feature.q1_effort_days
        q2_effort = update_data.q2_effort_days if update_data.q2_effort_days is not None else feature.q2_effort_days
        q3_effort = update_data.q3_effort_days if update_data.q3_effort_days is not None else feature.q3_effort_days
        q4_effort = update_data.q4_effort_days if update_data.q4_effort_days is not None else feature.q4_effort_days
        
        # Calculate total effort
        total_effort = q1_effort + q2_effort + q3_effort + q4_effort
        
        # Calculate budgets
        q1_budget = RoadmapService.calculate_budget_from_effort(q1_effort, fiscal_year_id, db)
        q2_budget = RoadmapService.calculate_budget_from_effort(q2_effort, fiscal_year_id, db)
        q3_budget = RoadmapService.calculate_budget_from_effort(q3_effort, fiscal_year_id, db)
        q4_budget = RoadmapService.calculate_budget_from_effort(q4_effort, fiscal_year_id, db)
        
        total_budget = q1_budget + q2_budget + q3_budget + q4_budget
        
        return {
            "total_effort_days": total_effort,
            "total_budget_keur": total_budget,
            "q1_effort_days": q1_effort,
            "q1_budget_keur": q1_budget,
            "q2_effort_days": q2_effort,
            "q2_budget_keur": q2_budget,
            "q3_effort_days": q3_effort,
            "q3_budget_keur": q3_budget,
            "q4_effort_days": q4_effort,
            "q4_budget_keur": q4_budget,
        }

    @staticmethod
    def get_budget_status(planned: Decimal, allocated: Decimal) -> str:
        """
        Determine budget status based on utilization
        
        Args:
            planned: Planned budget amount
            allocated: Allocated budget amount
            
        Returns:
            Status string: 'healthy', 'warning', or 'over_budget'
        """
        if allocated == 0:
            return "healthy"
        
        utilization = (planned / allocated) * 100
        
        if utilization > 100:
            return "over_budget"
        elif utilization >= 80:
            return "warning"
        else:
            return "healthy"

    @staticmethod
    def validate_budget_allocation(
        roadmap_id: str,
        budget_line_id: str,
        budget_category_id: Optional[str],
        additional_budget: Decimal,
        db: Session,
        exclude_feature_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validate if adding this budget would exceed limits
        
        Args:
            roadmap_id: Roadmap ID
            budget_line_id: Budget line ID
            budget_category_id: Optional budget category ID
            additional_budget: Budget amount to add
            db: Database session
            exclude_feature_id: Feature ID to exclude from current calculation (for updates)
            
        Returns:
            Dictionary with validation results
        """
        # Build query for current planned budget
        query = db.query(func.sum(RoadmapFeature.total_budget_keur)).filter(
            RoadmapFeature.roadmap_id == roadmap_id,
            RoadmapFeature.budget_line_id == budget_line_id
        )
        
        # Exclude specific feature if updating
        if exclude_feature_id:
            query = query.filter(RoadmapFeature.id != exclude_feature_id)
        
        # Filter by category if provided
        if budget_category_id:
            query = query.filter(RoadmapFeature.budget_category_id == budget_category_id)
        
        current_planned = query.scalar() or Decimal("0")
        new_planned = current_planned + additional_budget
        
        # Get allocated budget
        if budget_category_id:
            category = db.query(BudgetCategory).filter(
                BudgetCategory.id == budget_category_id
            ).first()
            allocated = Decimal(str(category.allocated_amount)) if category else Decimal("0")
            entity_name = category.name if category else "Unknown"
        else:
            line = db.query(BudgetLine).filter(BudgetLine.id == budget_line_id).first()
            allocated = Decimal(str(line.allocated_amount)) if line else Decimal("0")
            entity_name = line.name if line else "Unknown"
        
        remaining = allocated - new_planned
        utilization = (new_planned / allocated * 100) if allocated > 0 else Decimal("0")
        
        return {
            "valid": remaining >= 0,
            "allocated_budget_keur": allocated,
            "current_planned_keur": current_planned,
            "new_planned_keur": new_planned,
            "remaining_budget_keur": remaining,
            "utilization_percent": round(utilization, 2),
            "status": RoadmapService.get_budget_status(new_planned, allocated),
            "entity_name": entity_name,
            "warning_message": f"This exceeds available budget by {abs(remaining)} KEUR" if remaining < 0 else None
        }

    @staticmethod
    def get_budget_summary(roadmap_id: str, db: Session) -> Dict[str, Any]:
        """
        Calculate budget summary for roadmap grouped by budget lines and categories
        
        Args:
            roadmap_id: Roadmap ID
            db: Database session
            
        Returns:
            Dictionary with budget summary
        """
        roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
        if not roadmap:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Roadmap not found"
            )
        
        # Get all budget lines for this product's budget version
        budget_lines = db.query(BudgetLine).join(ProductBudget).filter(
            ProductBudget.budget_version_id == roadmap.budget_version_id,
            ProductBudget.product_id == roadmap.product_id
        ).all()
        
        summary = {
            "total_allocated_budget_keur": Decimal("0"),
            "total_planned_budget_keur": Decimal("0"),
            "budget_lines": []
        }
        
        for line in budget_lines:
            # Get planned budget for this line
            planned = db.query(func.sum(RoadmapFeature.total_budget_keur)).filter(
                RoadmapFeature.roadmap_id == roadmap_id,
                RoadmapFeature.budget_line_id == line.id
            ).scalar() or Decimal("0")
            
            # Get feature count
            feature_count = db.query(func.count(RoadmapFeature.id)).filter(
                RoadmapFeature.roadmap_id == roadmap_id,
                RoadmapFeature.budget_line_id == line.id
            ).scalar() or 0
            
            allocated = Decimal(str(line.allocated_amount))
            remaining = allocated - planned
            utilization = (planned / allocated * 100) if allocated > 0 else Decimal("0")
            
            # Get categories for this line
            categories = []
            budget_categories = db.query(BudgetCategory).filter(
                BudgetCategory.budget_line_id == line.id
            ).all()
            
            for cat in budget_categories:
                cat_planned = db.query(func.sum(RoadmapFeature.total_budget_keur)).filter(
                    RoadmapFeature.roadmap_id == roadmap_id,
                    RoadmapFeature.budget_line_id == line.id,
                    RoadmapFeature.budget_category_id == cat.id
                ).scalar() or Decimal("0")
                
                cat_feature_count = db.query(func.count(RoadmapFeature.id)).filter(
                    RoadmapFeature.roadmap_id == roadmap_id,
                    RoadmapFeature.budget_line_id == line.id,
                    RoadmapFeature.budget_category_id == cat.id
                ).scalar() or 0
                
                cat_allocated = Decimal(str(cat.allocated_amount))
                cat_remaining = cat_allocated - cat_planned
                cat_utilization = (cat_planned / cat_allocated * 100) if cat_allocated > 0 else Decimal("0")
                
                categories.append({
                    "budget_category_id": cat.id,
                    "category_name": cat.name,
                    "allocated_budget_keur": cat_allocated,
                    "planned_budget_keur": cat_planned,
                    "remaining_budget_keur": cat_remaining,
                    "utilization_percent": round(cat_utilization, 2),
                    "status": RoadmapService.get_budget_status(cat_planned, cat_allocated),
                    "feature_count": cat_feature_count
                })
            
            line_summary = {
                "budget_line_id": line.id,
                "budget_line_name": line.name,
                "allocated_budget_keur": allocated,
                "planned_budget_keur": planned,
                "remaining_budget_keur": remaining,
                "utilization_percent": round(utilization, 2),
                "status": RoadmapService.get_budget_status(planned, allocated),
                "feature_count": feature_count,
                "categories": categories
            }
            
            summary["budget_lines"].append(line_summary)
            summary["total_allocated_budget_keur"] += allocated
            summary["total_planned_budget_keur"] += planned
        
        summary["total_remaining_budget_keur"] = (
            summary["total_allocated_budget_keur"] - summary["total_planned_budget_keur"]
        )
        summary["total_utilization_percent"] = round(
            (summary["total_planned_budget_keur"] / summary["total_allocated_budget_keur"] * 100)
            if summary["total_allocated_budget_keur"] > 0 else Decimal("0"),
            2
        )
        
        return summary

    @staticmethod
    def get_quarterly_summary(roadmap_id: str, db: Session) -> List[Dict[str, Any]]:
        """
        Get quarterly breakdown across all features
        
        Args:
            roadmap_id: Roadmap ID
            db: Database session
            
        Returns:
            List of quarterly summaries
        """
        quarters = []
        
        for quarter_num, quarter_name in [(1, "Q1"), (2, "Q2"), (3, "Q3"), (4, "Q4")]:
            effort_field = f"q{quarter_num}_effort_days"
            budget_field = f"q{quarter_num}_budget_keur"
            
            # Get total for quarter
            total_effort = db.query(func.sum(getattr(RoadmapFeature, effort_field))).filter(
                RoadmapFeature.roadmap_id == roadmap_id
            ).scalar() or Decimal("0")
            
            total_budget = db.query(func.sum(getattr(RoadmapFeature, budget_field))).filter(
                RoadmapFeature.roadmap_id == roadmap_id
            ).scalar() or Decimal("0")
            
            feature_count = db.query(func.count(RoadmapFeature.id)).filter(
                RoadmapFeature.roadmap_id == roadmap_id,
                getattr(RoadmapFeature, effort_field) > 0
            ).scalar() or 0
            
            # Get breakdown by budget line
            budget_lines = []
            features_by_line = db.query(
                RoadmapFeature.budget_line_id,
                BudgetLine.name,
                func.sum(getattr(RoadmapFeature, effort_field)).label('effort'),
                func.sum(getattr(RoadmapFeature, budget_field)).label('budget'),
                func.count(RoadmapFeature.id).label('count')
            ).join(BudgetLine).filter(
                RoadmapFeature.roadmap_id == roadmap_id,
                getattr(RoadmapFeature, effort_field) > 0
            ).group_by(RoadmapFeature.budget_line_id, BudgetLine.name).all()
            
            for line_id, line_name, effort, budget, count in features_by_line:
                budget_lines.append({
                    "budget_line_id": line_id,
                    "budget_line_name": line_name,
                    "effort_days": effort or Decimal("0"),
                    "budget_keur": budget or Decimal("0"),
                    "feature_count": count or 0
                })
            
            quarters.append({
                "quarter": quarter_name,
                "total_effort_days": total_effort,
                "total_budget_keur": total_budget,
                "feature_count": feature_count,
                "budget_lines": budget_lines
            })
        
        return quarters

    @staticmethod
    def validate_status_transition(current_status: str, new_status: str) -> bool:
        """
        Validate if status transition is allowed
        
        Args:
            current_status: Current status
            new_status: Desired new status
            
        Returns:
            True if transition is valid
        """
        valid_transitions = {
            "draft": ["active", "archived"],
            "active": ["archived"],
            "archived": []  # Cannot transition from archived
        }
        
        return new_status in valid_transitions.get(current_status, [])

    @staticmethod
    def validate_feature_status_transition(current_status: str, new_status: str) -> bool:
        """
        Validate if feature status transition is allowed
        
        Args:
            current_status: Current feature status
            new_status: Desired new status
            
        Returns:
            True if transition is valid
        """
        valid_transitions = {
            "planned": ["in_progress", "cancelled"],
            "in_progress": ["completed", "cancelled"],
            "completed": [],  # Cannot change from completed
            "cancelled": []  # Cannot change from cancelled
        }
        
        return new_status in valid_transitions.get(current_status, [])
