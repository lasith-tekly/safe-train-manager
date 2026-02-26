"""
Deviation Service - Phase 4

Service for calculating deviations between strategic and execution plans.
"""
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from decimal import Decimal

from app.models.roadmap_v4 import RoadmapFeature, FeatureQuarterlyAllocation, JiraRecord
from app.models.product import Product
from app.models.pi import PI
from app.models.global_settings import GlobalSettings
from app.models.budget_new import BudgetLine, BudgetCategory
from app.models.feature_budget_allocation import FeatureBudgetLineAllocation
from app.schemas.deviation import (
    DeviationStatus,
    QuarterDeviation,
    FeatureDeviationResponse,
    ProductDeviationSummary,
    CategoryValidation,
    BudgetLineValidation,
    BudgetValidationTree
)


class DeviationService:
    """Service for calculating strategic vs execution deviations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.settings = self._load_settings()
    
    def _load_settings(self) -> Dict:
        """Load global settings for calculations"""
        settings = self.db.query(GlobalSettings).first()
        if not settings:
            # Return defaults if no settings found
            return {
                'unit_cost_keur': 78.0,
                'effort_days_per_year': 220.0,
                'structural_cost_ratio': 2.8
            }
        
        return {
            'unit_cost_keur': float(settings.train_unit_cost_keur or 78.0),
            'effort_days_per_year': float(settings.effort_days_per_year or 220.0),
            'structural_cost_ratio': float(settings.train_structural_cost_ratio or 2.8)
        }
    
    def calculate_deviation_status(
        self, 
        deviation: float, 
        strategic: float
    ) -> DeviationStatus:
        """
        Determine deviation status based on thresholds (OR logic).
        
        Thresholds:
        - ALIGNED: |deviation%| <= 5% OR |deviation| <= 0.5 eD
        - MINOR: 5% < |deviation%| <= 15% OR 0.5 < |deviation| <= 2 eD
        - SIGNIFICANT: |deviation%| > 15% OR |deviation| > 2 eD
        - UNDER: deviation < 0 (and not aligned)
        """
        if strategic == 0:
            return DeviationStatus.ALIGNED if deviation == 0 else DeviationStatus.SIGNIFICANT
        
        percent = abs((deviation / strategic) * 100)
        abs_dev = abs(deviation)
        
        # Check if aligned first
        if percent <= 5 and abs_dev <= 0.5:
            return DeviationStatus.ALIGNED
        
        # Under-execution
        if deviation < 0:
            return DeviationStatus.UNDER
        
        # Over-execution
        if percent <= 15 and abs_dev <= 2:
            return DeviationStatus.MINOR
        else:
            return DeviationStatus.SIGNIFICANT
    
    def calculate_budget_impact(self, deviation_net_ed: float) -> float:
        """
        Calculate budget impact from net eD deviation.
        
        Formula:
        1. Gross_eD = Net_eD × Structural_Cost_Ratio
        2. Budget_Impact = (Gross_eD / Effort_Days_Per_Year) × Unit_Cost_KEUR
        """
        gross_ed = deviation_net_ed * self.settings['structural_cost_ratio']
        budget_impact = (gross_ed / self.settings['effort_days_per_year']) * self.settings['unit_cost_keur']
        return round(budget_impact, 2)
    
    def calculate_feature_deviation(
        self, 
        feature_id: str, 
        version_id: str
    ) -> FeatureDeviationResponse:
        """
        Calculate detailed deviation for a single feature.
        
        Returns quarterly breakdown and totals.
        """
        # Get feature - first try with requested version
        feature = self.db.query(RoadmapFeature).filter(
            RoadmapFeature.id == feature_id,
            RoadmapFeature.version_id == version_id
        ).first()
        
        # If not found, try to find feature in any version (it might not have been copied to new version yet)
        if not feature:
            feature = self.db.query(RoadmapFeature).filter(
                RoadmapFeature.id == feature_id
            ).first()
            
            if not feature:
                raise ValueError(f"Feature {feature_id} not found")
            
            # Feature exists but in different version - this is OK for deviation calculation
            # The JIRA records should still be associated with the feature regardless of version
        
        # Get strategic allocations (quarterly)
        strategic_allocations = self.db.query(
            FeatureQuarterlyAllocation
        ).filter(
            FeatureQuarterlyAllocation.feature_id == feature_id
        ).all()
        
        # Get execution data (JIRA records grouped by PI)
        execution_data = self.db.query(
            JiraRecord.pi_id,
            func.sum(JiraRecord.planned_effort).label('total_effort')
        ).filter(
            JiraRecord.feature_id == feature_id
        ).group_by(JiraRecord.pi_id).all()
        
        # Build execution map
        execution_map = {row.pi_id: float(row.total_effort) for row in execution_data if row.pi_id}
        
        # Calculate quarterly deviations
        quarterly_deviations = []
        total_strategic = 0.0
        total_execution = 0.0
        
        for allocation in strategic_allocations:
            # Get PI for this quarter (PI uses 'sequence' not 'quarter')
            pi = self.db.query(PI).filter(
                PI.year == allocation.year,
                PI.sequence == allocation.quarter
            ).first()
            
            if not pi:
                continue
            
            strategic_effort = float(allocation.allocated_ed)
            execution_effort = execution_map.get(pi.id, 0.0)
            deviation = execution_effort - strategic_effort
            deviation_percent = (deviation / strategic_effort * 100) if strategic_effort > 0 else 0.0
            
            total_strategic += strategic_effort
            total_execution += execution_effort
            
            quarter_status = self.calculate_deviation_status(deviation, strategic_effort)
            
            quarterly_deviations.append(QuarterDeviation(
                quarter=f"Q{allocation.quarter} {allocation.year}",
                pi_id=pi.id,
                pi_name=pi.name,
                strategic_effort=strategic_effort,
                execution_effort=execution_effort,
                deviation=deviation,
                deviation_percent=round(deviation_percent, 2),
                status=quarter_status
            ))
        
        # Calculate totals
        total_deviation = total_execution - total_strategic
        total_deviation_percent = (total_deviation / total_strategic * 100) if total_strategic > 0 else 0.0
        overall_status = self.calculate_deviation_status(total_deviation, total_strategic)
        budget_impact = self.calculate_budget_impact(total_deviation)
        
        # Check if deviation is acknowledged (check any quarterly allocation)
        is_acknowledged = any(alloc.deviation_acknowledged for alloc in strategic_allocations)
        acknowledge_reason = next(
            (alloc.deviation_note for alloc in strategic_allocations if alloc.deviation_note),
            None
        )
        
        return FeatureDeviationResponse(
            feature_id=feature.id,
            feature_name=feature.name,
            total_strategic=round(total_strategic, 2),
            total_execution=round(total_execution, 2),
            total_deviation=round(total_deviation, 2),
            total_deviation_percent=round(total_deviation_percent, 2),
            status=overall_status,
            quarters=quarterly_deviations,
            budget_impact_keur=budget_impact,
            is_acknowledged=is_acknowledged,
            acknowledge_reason=acknowledge_reason
        )
    
    def calculate_product_deviation_summary(
        self, 
        product_id: str, 
        version_id: str
    ) -> ProductDeviationSummary:
        """
        Calculate overall deviation summary for a product.
        
        Returns summary statistics and list of all features with deviations.
        """
        # Get product
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise ValueError(f"Product {product_id} not found")
        
        # Get all features for this version
        features = self.db.query(RoadmapFeature).filter(
            RoadmapFeature.version_id == version_id
        ).all()
        
        # Calculate deviation for each feature
        feature_deviations = []
        features_aligned = 0
        features_with_deviation = 0
        total_deviation_ed = 0.0
        total_budget_impact_keur = 0.0
        
        for feature in features:
            try:
                deviation = self.calculate_feature_deviation(feature.id, version_id)
                feature_deviations.append(deviation)
                
                if deviation.status == DeviationStatus.ALIGNED:
                    features_aligned += 1
                else:
                    features_with_deviation += 1
                
                total_deviation_ed += deviation.total_deviation
                total_budget_impact_keur += deviation.budget_impact_keur
            except Exception as e:
                # Skip features with errors
                print(f"Error calculating deviation for feature {feature.id}: {e}")
                continue
        
        # Determine overall status
        if features_with_deviation == 0:
            overall_status = DeviationStatus.ALIGNED
        elif any(f.status == DeviationStatus.SIGNIFICANT for f in feature_deviations):
            overall_status = DeviationStatus.SIGNIFICANT
        elif any(f.status == DeviationStatus.MINOR for f in feature_deviations):
            overall_status = DeviationStatus.MINOR
        else:
            overall_status = DeviationStatus.UNDER
        
        return ProductDeviationSummary(
            product_id=product.id,
            product_name=product.name,
            features_with_deviation=features_with_deviation,
            features_aligned=features_aligned,
            total_deviation_ed=round(total_deviation_ed, 2),
            total_budget_impact_keur=round(total_budget_impact_keur, 2),
            status=overall_status,
            features=feature_deviations
        )
    
    def get_budget_validation_tree(
        self, 
        product_id: str, 
        version_id: str
    ) -> BudgetValidationTree:
        """
        Build budget validation tree: Product → Budget Lines → Categories
        
        Shows allocated vs planned at each level.
        """
        try:
            # Get product
            product = self.db.query(Product).filter(Product.id == product_id).first()
            if not product:
                raise ValueError(f"Product {product_id} not found")
            
            # Get all budget lines for this product
            budget_lines = self.db.query(BudgetLine).filter(
                BudgetLine.product_id == product_id
            ).all()
            
            # Return empty but valid structure if no budget lines
            if not budget_lines:
                print(f"INFO: No budget lines found for product {product_id}")
                return BudgetValidationTree(
                    product_id=product_id,
                    product_name=product.name,
                    total_allocated_keur=0.0,
                    total_planned_keur=0.0,
                    total_planned_ed=0.0,
                    total_remaining_keur=0.0,
                    utilization_percent=0.0,
                    status=DeviationStatus.ALIGNED,
                    budget_lines=[]
                )
            
            # Get all features for this version, including product-level features with no version
            features = self.db.query(RoadmapFeature).filter(
                or_(
                    RoadmapFeature.version_id == version_id,
                    and_(
                        RoadmapFeature.version_id == None,
                        RoadmapFeature.product_id == product_id
                    )
                )
            ).all()
            
            # Calculate totals
            total_allocated_keur = 0.0
            total_planned_keur = 0.0
            total_planned_ed = 0.0
            budget_line_validations = []
            
            for budget_line in budget_lines:
                # Get allocated amount for this budget line
                allocated_keur = float(budget_line.allocated_amount or 0.0)
                total_allocated_keur += allocated_keur
                
                # Calculate planned amount from features
                planned_keur = 0.0
                planned_ed = 0.0
                
                for feature in features:
                    # Get budget allocation for this feature and budget line
                    allocation = self.db.query(FeatureBudgetLineAllocation).filter(
                        FeatureBudgetLineAllocation.feature_id == feature.id,
                        FeatureBudgetLineAllocation.budget_line_id == budget_line.id
                    ).first()
                    
                    if allocation:
                        # Calculate this feature's contribution to budget line
                        percentage = float(allocation.allocation_percentage) / 100.0
                        feature_cost = float(feature.total_cost_keur or 0.0)
                        feature_ed = float(feature.net_sizing_ed or 0.0)
                        
                        planned_keur += feature_cost * percentage
                        planned_ed += feature_ed * percentage
                
                total_planned_keur += planned_keur
                total_planned_ed += planned_ed
                
                # Calculate budget line metrics
                remaining_keur = allocated_keur - planned_keur
                utilization_percent = (planned_keur / allocated_keur * 100) if allocated_keur > 0 else 0.0
                
                # Determine status based on utilization
                if utilization_percent < 80:
                    bl_status = DeviationStatus.ALIGNED
                elif utilization_percent < 90:
                    bl_status = DeviationStatus.MINOR
                elif utilization_percent < 100:
                    bl_status = DeviationStatus.SIGNIFICANT
                else:
                    bl_status = DeviationStatus.SIGNIFICANT
                
                # Get categories for this budget line
                categories = self.db.query(BudgetCategory).filter(
                    BudgetCategory.budget_line_id == budget_line.id
                ).all()
                
                category_validations = []
                for category in categories:
                    cat_allocated = float(category.allocated_amount or 0.0)
                    
                    # Calculate planned for category
                    cat_planned = 0.0
                    for feature in features:
                        allocation = self.db.query(FeatureBudgetLineAllocation).filter(
                            FeatureBudgetLineAllocation.feature_id == feature.id,
                            FeatureBudgetLineAllocation.budget_line_id == budget_line.id,
                            FeatureBudgetLineAllocation.category_id == category.id
                        ).first()
                        
                        if allocation:
                            percentage = float(allocation.allocation_percentage) / 100.0
                            feature_cost = float(feature.total_cost_keur or 0.0)
                            cat_planned += feature_cost * percentage
                    
                    cat_deviation = cat_planned - cat_allocated
                    cat_utilization = (cat_planned / cat_allocated * 100) if cat_allocated > 0 else 0.0
                    
                    if cat_utilization < 80:
                        cat_status = DeviationStatus.ALIGNED
                    elif cat_utilization < 90:
                        cat_status = DeviationStatus.MINOR
                    else:
                        cat_status = DeviationStatus.SIGNIFICANT
                    
                    category_validations.append(CategoryValidation(
                        category_id=category.id,
                        category_name=category.name,
                        allocated_keur=round(cat_allocated, 2),
                        planned_keur=round(cat_planned, 2),
                        deviation_keur=round(cat_deviation, 2),
                        utilization_percent=round(cat_utilization, 2),
                        status=cat_status
                    ))
                
                budget_line_validations.append(BudgetLineValidation(
                    budget_line_id=budget_line.id,
                    budget_line_name=budget_line.name,
                    allocated_keur=round(allocated_keur, 2),
                    planned_keur=round(planned_keur, 2),
                    planned_ed=round(planned_ed, 2),
                    remaining_keur=round(remaining_keur, 2),
                    utilization_percent=round(utilization_percent, 2),
                    status=bl_status,
                    categories=category_validations
                ))
            
            # Calculate product-level metrics
            total_remaining_keur = total_allocated_keur - total_planned_keur
            product_utilization = (total_planned_keur / total_allocated_keur * 100) if total_allocated_keur > 0 else 0.0
            
            if product_utilization < 80:
                product_status = DeviationStatus.ALIGNED
            elif product_utilization < 90:
                product_status = DeviationStatus.MINOR
            else:
                product_status = DeviationStatus.SIGNIFICANT
            
            return BudgetValidationTree(
                product_id=product.id,
                product_name=product.name,
                total_allocated_keur=round(total_allocated_keur, 2),
                total_planned_keur=round(total_planned_keur, 2),
                total_planned_ed=round(total_planned_ed, 2),
                total_remaining_keur=round(total_remaining_keur, 2),
                utilization_percent=round(product_utilization, 2),
                status=product_status,
                budget_lines=budget_line_validations
            )
        except ValueError:
            raise
        except Exception as e:
            import traceback
            print(f"ERROR in get_budget_validation_tree for product {product_id}: {str(e)}")
            print(traceback.format_exc())
            # Return empty structure instead of failing
            return BudgetValidationTree(
                product_id=product_id,
                product_name="Unknown",
                total_allocated_keur=0.0,
                total_planned_keur=0.0,
                total_planned_ed=0.0,
                total_remaining_keur=0.0,
                utilization_percent=0.0,
                status=DeviationStatus.ALIGNED,
                budget_lines=[]
            )
