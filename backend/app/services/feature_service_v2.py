"""
Feature Service V2

Business logic for roadmap feature management with year-based allocations.
"""
from typing import Dict, List, Optional, Any
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.roadmap import Roadmap, RoadmapFeature, FeatureYearAllocation
from app.models.budget_new import BudgetLine, BudgetCategory
from app.services.roadmap_service_v2 import RoadmapServiceV2


class FeatureServiceV2:
    """Service class for roadmap feature operations"""

    @staticmethod
    def validate_budget_line(
        db: Session,
        budget_line_id: str,
        budget_category_id: Optional[str] = None
    ):
        """
        Validate that budget line and category exist and are valid.
        
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
    def create_feature(
        db: Session,
        roadmap_id: str,
        feature_data: Dict[str, Any],
        created_by: str
    ) -> Dict[str, Any]:
        """
        Create feature with year-based allocations.
        
        Args:
            db: Database session
            roadmap_id: Roadmap ID
            feature_data: Feature data including year_allocations
            created_by: User ID creating the feature
            
        Returns:
            Dictionary with feature and budget_alerts
        """
        # Validate roadmap exists
        roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
        if not roadmap:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Roadmap not found"
            )
        
        # Validate budget line and category
        FeatureServiceV2.validate_budget_line(
            db,
            feature_data["budget_line_id"],
            feature_data.get("budget_category_id")
        )
        
        # Create feature
        feature = RoadmapFeature(
            roadmap_id=roadmap_id,
            name=feature_data["name"],
            description=feature_data.get("description"),
            budget_line_id=feature_data["budget_line_id"],
            budget_category_id=feature_data.get("budget_category_id"),
            priority=feature_data.get("priority", 0),
            created_by=created_by,
            status="planned"
        )
        db.add(feature)
        db.flush()
        
        # Create year allocations
        total_budget = Decimal("0")
        total_effort = Decimal("0")
        
        for year_data in feature_data["year_allocations"]:
            year = year_data["year"]
            budget_keur = Decimal(str(year_data["budget_keur"]))
            
            # Calculate effort days from budget
            effort_days = RoadmapServiceV2.calculate_effort_from_budget(
                budget_keur, year, db
            )
            
            allocation = FeatureYearAllocation(
                feature_id=feature.id,
                year=year,
                budget_keur=budget_keur,
                effort_days=effort_days
            )
            db.add(allocation)
            db.flush()  # Flush to get allocation ID
            
            # Save PI allocations if provided
            pi_allocations = year_data.get("pi_allocations")
            if pi_allocations:
                RoadmapServiceV2._save_pi_allocations(db, allocation.id, pi_allocations)
            
            total_budget += budget_keur
            total_effort += effort_days
        
        # Update feature totals
        feature.total_budget_keur = total_budget
        feature.total_effort_days = total_effort
        
        db.commit()
        db.refresh(feature)
        
        # Calculate budget alerts
        alerts = FeatureServiceV2.calculate_feature_budget_alerts(db, feature)
        
        return {
            "feature": feature,
            "budget_alerts": alerts
        }

    @staticmethod
    def update_feature(
        db: Session,
        feature_id: str,
        feature_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update feature and year allocations.
        
        Args:
            db: Database session
            feature_id: Feature ID
            feature_data: Update data
            
        Returns:
            Dictionary with updated feature and budget_alerts
        """
        feature = db.query(RoadmapFeature).filter(RoadmapFeature.id == feature_id).first()
        if not feature:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feature not found"
            )
        
        # Update basic fields
        if "name" in feature_data:
            feature.name = feature_data["name"]
        if "description" in feature_data:
            feature.description = feature_data["description"]
        if "priority" in feature_data:
            feature.priority = feature_data["priority"]
        if "status" in feature_data:
            feature.status = feature_data["status"]
        
        # Update budget line/category if provided
        if "budget_line_id" in feature_data:
            FeatureServiceV2.validate_budget_line(
                db,
                feature_data["budget_line_id"],
                feature_data.get("budget_category_id")
            )
            feature.budget_line_id = feature_data["budget_line_id"]
            if "budget_category_id" in feature_data:
                feature.budget_category_id = feature_data["budget_category_id"]
        
        # Update year allocations if provided
        if "year_allocations" in feature_data:
            # Delete existing allocations
            db.query(FeatureYearAllocation).filter(
                FeatureYearAllocation.feature_id == feature_id
            ).delete()
            
            # Create new allocations
            total_budget = Decimal("0")
            total_effort = Decimal("0")
            
            for year_data in feature_data["year_allocations"]:
                year = year_data["year"]
                budget_keur = Decimal(str(year_data["budget_keur"]))
                
                # Calculate effort days
                effort_days = RoadmapServiceV2.calculate_effort_from_budget(
                    budget_keur, year, db
                )
                
                allocation = FeatureYearAllocation(
                    feature_id=feature.id,
                    year=year,
                    budget_keur=budget_keur,
                    effort_days=effort_days
                )
                db.add(allocation)
                db.flush()  # Flush to get allocation ID
                
                # Save PI allocations if provided
                pi_allocations = year_data.get("pi_allocations")
                if pi_allocations:
                    RoadmapServiceV2._save_pi_allocations(db, allocation.id, pi_allocations)
                
                total_budget += budget_keur
                total_effort += effort_days
            
            # Update totals
            feature.total_budget_keur = total_budget
            feature.total_effort_days = total_effort
        
        db.commit()
        db.refresh(feature)
        
        # Calculate budget alerts
        alerts = FeatureServiceV2.calculate_feature_budget_alerts(db, feature)
        
        return {
            "feature": feature,
            "budget_alerts": alerts
        }

    @staticmethod
    def delete_feature(db: Session, feature_id: str):
        """
        Delete feature (cascade deletes year allocations).
        
        Args:
            db: Database session
            feature_id: Feature ID
        """
        feature = db.query(RoadmapFeature).filter(RoadmapFeature.id == feature_id).first()
        if not feature:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feature not found"
            )
        
        db.delete(feature)
        db.commit()

    @staticmethod
    def calculate_feature_budget_alerts(
        db: Session,
        feature: RoadmapFeature
    ) -> List[Dict[str, Any]]:
        """
        Calculate budget alerts for a feature across all years.
        
        Args:
            db: Database session
            feature: RoadmapFeature instance
            
        Returns:
            List of budget alert dictionaries
        """
        alerts = []
        
        # Get budget line and category names
        budget_line = db.query(BudgetLine).filter(
            BudgetLine.id == feature.budget_line_id
        ).first()
        budget_line_name = budget_line.name if budget_line else "Unknown"
        
        category_name = None
        if feature.budget_category_id:
            category = db.query(BudgetCategory).filter(
                BudgetCategory.id == feature.budget_category_id
            ).first()
            category_name = category.name if category else None
        
        # Check each year allocation
        for allocation in feature.year_allocations:
            year = allocation.year
            budget_keur = allocation.budget_keur
            
            # Get latest active budget version for this year
            budget_version = RoadmapServiceV2.get_latest_active_budget_version(
                db, feature.roadmap.product_id, year
            )
            
            if not budget_version:
                # No budget for this year - no alert
                continue
            
            # Get allocated budget for this line/category
            from app.models.budget_new import ProductBudget
            
            product_budget = db.query(ProductBudget).filter(
                ProductBudget.budget_version_id == budget_version.id,
                ProductBudget.product_id == feature.roadmap.product_id,
                ProductBudget.budget_line_id == feature.budget_line_id
            ).first()
            
            if not product_budget:
                continue
            
            # Determine allocated amount (line or category)
            if feature.budget_category_id:
                category = db.query(BudgetCategory).filter(
                    BudgetCategory.id == feature.budget_category_id
                ).first()
                allocated_keur = Decimal(str(category.allocated_amount)) if category else Decimal("0")
            else:
                allocated_keur = Decimal(str(product_budget.allocated_amount))
            
            # Calculate total planned for this line/category in this year
            from sqlalchemy import func
            planned_keur = db.query(func.sum(FeatureYearAllocation.budget_keur)).join(
                RoadmapFeature
            ).filter(
                RoadmapFeature.roadmap_id == feature.roadmap_id,
                RoadmapFeature.budget_line_id == feature.budget_line_id,
                FeatureYearAllocation.year == year
            )
            
            if feature.budget_category_id:
                planned_keur = planned_keur.filter(
                    RoadmapFeature.budget_category_id == feature.budget_category_id
                )
            
            planned_keur = planned_keur.scalar() or Decimal("0")
            
            # Calculate status
            status_info = RoadmapServiceV2.calculate_budget_status(allocated_keur, planned_keur)
            
            if status_info["status"] != "balanced":
                # Create alert
                variance = status_info.get("variance_keur", Decimal("0"))
                
                if status_info["status"] == "over_budget":
                    message = f"Over budget by {abs(variance):.1f} KEUR"
                elif status_info["status"] == "under_planned":
                    message = f"Under planned by {abs(variance):.1f} KEUR"
                else:
                    message = "Balanced"
                
                alerts.append({
                    "year": year,
                    "budget_line_name": budget_line_name,
                    "category_name": category_name,
                    "status": status_info["status"],
                    "message": message,
                    "allocated_keur": allocated_keur,
                    "planned_keur": planned_keur,
                    "variance_keur": variance,
                    "utilization_percent": status_info.get("utilization_percent")
                })
        
        return alerts
