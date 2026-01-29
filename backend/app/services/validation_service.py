"""
Validation Service - Budget, Capacity, and Feature Consistency Validation
"""
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from decimal import Decimal

from app.models.roadmap_v4 import RoadmapFeature, FeatureQuarterlyAllocation, JiraRecord, JiraQuarterlyAllocation
from app.models.budget_new import ProductBudget, BudgetLine, BudgetCategory
from app.models.team import Team, TeamCapacity


class ValidationService:
    """Service for validating budget, capacity, and feature consistency"""
    
    # Train configuration constants (should come from global_settings)
    UNIT_COST_KEUR = 78
    EFFORT_DAYS_PER_YEAR = 220
    STRUCTURAL_COST_RATIO = 2.8
    
    def __init__(self, db: Session):
        self.db = db
    
    def _quarterly_ed_to_cost(self, quarterly_ed: float) -> float:
        """Convert quarterly Net eD allocation to cost in KEUR"""
        gross_ed = quarterly_ed * self.STRUCTURAL_COST_RATIO
        cost_keur = (gross_ed / self.EFFORT_DAYS_PER_YEAR) * self.UNIT_COST_KEUR
        return round(cost_keur, 2)
    
    def _calculate_planned_cost_for_product(self, product_id: str, year: int) -> float:
        """Calculate total planned cost for a product in a given year"""
        # Get all features for this product
        features = self.db.query(RoadmapFeature).filter(
            RoadmapFeature.product_id == product_id
        ).all()
        
        total_cost = 0.0
        for feature in features:
            # Get quarterly allocations for this year
            allocations = self.db.query(FeatureQuarterlyAllocation).filter(
                and_(
                    FeatureQuarterlyAllocation.feature_id == feature.id,
                    FeatureQuarterlyAllocation.year == year
                )
            ).all()
            
            # Sum up costs for this feature in this year
            for alloc in allocations:
                total_cost += self._quarterly_ed_to_cost(float(alloc.allocated_ed))
        
        return round(total_cost, 2)
    
    def _calculate_planned_cost_for_budget_line(self, budget_line_id: str, year: int) -> float:
        """Calculate total planned cost for a budget line in a given year"""
        # Get all features using this budget line
        from app.models.feature_budget_allocation import FeatureBudgetLineAllocation
        
        allocations = self.db.query(FeatureBudgetLineAllocation).filter(
            FeatureBudgetLineAllocation.budget_line_id == budget_line_id
        ).all()
        
        total_cost = 0.0
        for alloc in allocations:
            feature = self.db.query(RoadmapFeature).filter(
                RoadmapFeature.id == alloc.feature_id
            ).first()
            
            if feature:
                # Get quarterly allocations for this year
                quarterly_allocs = self.db.query(FeatureQuarterlyAllocation).filter(
                    and_(
                        FeatureQuarterlyAllocation.feature_id == feature.id,
                        FeatureQuarterlyAllocation.year == year
                    )
                ).all()
                
                # Calculate cost for this feature's portion
                feature_year_cost = sum(
                    self._quarterly_ed_to_cost(float(qa.allocated_ed)) 
                    for qa in quarterly_allocs
                )
                
                # Apply budget line percentage
                percentage = float(alloc.allocation_percentage) / 100
                total_cost += feature_year_cost * percentage
        
        return round(total_cost, 2)
    
    def _calculate_planned_cost_for_category(self, category_id: str, year: int) -> float:
        """Calculate total planned cost for a category in a given year"""
        from app.models.feature_budget_allocation import FeatureBudgetLineAllocation
        
        allocations = self.db.query(FeatureBudgetLineAllocation).filter(
            FeatureBudgetLineAllocation.category_id == category_id
        ).all()
        
        total_cost = 0.0
        for alloc in allocations:
            feature = self.db.query(RoadmapFeature).filter(
                RoadmapFeature.id == alloc.feature_id
            ).first()
            
            if feature:
                quarterly_allocs = self.db.query(FeatureQuarterlyAllocation).filter(
                    and_(
                        FeatureQuarterlyAllocation.feature_id == feature.id,
                        FeatureQuarterlyAllocation.year == year
                    )
                ).all()
                
                feature_year_cost = sum(
                    self._quarterly_ed_to_cost(float(qa.allocated_ed)) 
                    for qa in quarterly_allocs
                )
                
                percentage = float(alloc.allocation_percentage) / 100
                total_cost += feature_year_cost * percentage
        
        return round(total_cost, 2)
    
    def _check_threshold(
        self, 
        level: str, 
        allocated: float, 
        planned: float, 
        name: Optional[str] = None
    ) -> Dict:
        """Check if planned cost is within acceptable thresholds"""
        percentage = (planned / allocated * 100) if allocated > 0 else 0
        
        if percentage > 100:
            status = 'over_planned'
            message = f"Over-planned by {planned - allocated:.2f} KEUR ({percentage:.1f}%)"
        elif percentage > 90:
            status = 'approaching'
            message = f"Approaching limit ({percentage:.1f}% used)"
        elif percentage < 80 and allocated > 0:
            status = 'under_planned'
            message = f"Under-planned ({percentage:.1f}% used, {allocated - planned:.2f} KEUR remaining)"
        else:
            status = 'healthy'
            message = f"Healthy ({percentage:.1f}% used)"
        
        return {
            'level': level,
            'name': name,
            'allocated_keur': round(allocated, 2),
            'planned_keur': round(planned, 2),
            'percentage': round(percentage, 1),
            'status': status,
            'message': message
        }
    
    def validate_budget(
        self, 
        product_id: str, 
        year: int, 
        budget_line_id: Optional[str] = None,
        category_id: Optional[str] = None
    ) -> List[Dict]:
        """Validate budget at product, budget line, and category levels"""
        results = []
        
        # Product level validation
        # Note: ProductBudget is linked to year through budget_version -> fiscal_year
        from app.models.budget_new import BudgetVersion, FiscalYear
        
        product_budget = self.db.query(ProductBudget).join(
            BudgetVersion, ProductBudget.budget_version_id == BudgetVersion.id
        ).join(
            FiscalYear, BudgetVersion.fiscal_year_id == FiscalYear.id
        ).filter(
            and_(
                ProductBudget.product_id == product_id,
                FiscalYear.year == year
            )
        ).first()
        
        if product_budget:
            planned_cost = self._calculate_planned_cost_for_product(product_id, year)
            allocated = float(product_budget.allocated_amount)
            
            from app.models.product import Product
            product = self.db.query(Product).filter(Product.id == product_id).first()
            product_name = product.name if product else "Product"
            
            results.append(self._check_threshold(
                'product', 
                allocated, 
                planned_cost, 
                f"{product_name} {year}"
            ))
        
        # Budget line level validation
        if budget_line_id:
            budget_line = self.db.query(BudgetLine).filter(
                BudgetLine.id == budget_line_id
            ).first()
            
            if budget_line:
                planned_cost = self._calculate_planned_cost_for_budget_line(budget_line_id, year)
                # Note: Budget line allocation would come from budget_line_allocations table
                # For now, using a placeholder
                allocated = 0  # TODO: Get from budget_line_allocations
                
                results.append(self._check_threshold(
                    'budget_line',
                    allocated,
                    planned_cost,
                    f"{budget_line.name} {year}"
                ))
        
        # Category level validation
        if category_id:
            category = self.db.query(BudgetCategory).filter(
                BudgetCategory.id == category_id
            ).first()
            
            if category:
                planned_cost = self._calculate_planned_cost_for_category(category_id, year)
                allocated = 0  # TODO: Get from category allocations
                
                results.append(self._check_threshold(
                    'category',
                    allocated,
                    planned_cost,
                    f"{category.name} {year}"
                ))
        
        return results
    
    def validate_capacity(
        self, 
        team_id: str, 
        year: int, 
        quarter: int
    ) -> Dict:
        """Validate team capacity for a specific quarter"""
        # Get team capacity - TeamCapacity has q1_capacity, q2_capacity, etc.
        team_capacity = self.db.query(TeamCapacity).filter(
            and_(
                TeamCapacity.team_id == team_id,
                TeamCapacity.year == year
            )
        ).first()
        
        # Get capacity for specific quarter
        capacity_ed = 0
        if team_capacity:
            if quarter == 1:
                capacity_ed = float(team_capacity.q1_capacity or 0)
            elif quarter == 2:
                capacity_ed = float(team_capacity.q2_capacity or 0)
            elif quarter == 3:
                capacity_ed = float(team_capacity.q3_capacity or 0)
            elif quarter == 4:
                capacity_ed = float(team_capacity.q4_capacity or 0)
        
        # Sum JIRA allocations for this team/quarter
        jira_allocations = self.db.query(JiraQuarterlyAllocation).join(
            JiraRecord
        ).filter(
            and_(
                JiraRecord.team_id == team_id,
                JiraQuarterlyAllocation.year == year,
                JiraQuarterlyAllocation.quarter == quarter
            )
        ).all()
        
        allocated_ed = sum(float(alloc.allocated_ed) for alloc in jira_allocations)
        remaining_ed = capacity_ed - allocated_ed
        utilization = (allocated_ed / capacity_ed * 100) if capacity_ed > 0 else 0
        
        if utilization > 100:
            status = 'over_allocated'
            message = f"Over-allocated by {allocated_ed - capacity_ed:.2f} eD"
        elif utilization > 90:
            status = 'high_utilization'
            message = f"High utilization ({utilization:.1f}%)"
        else:
            status = 'healthy'
            message = f"Healthy ({utilization:.1f}% utilized)"
        
        team = self.db.query(Team).filter(Team.id == team_id).first()
        team_name = team.name if team else "Team"
        
        return {
            'team_id': team_id,
            'team_name': team_name,
            'year': year,
            'quarter': quarter,
            'capacity_ed': round(capacity_ed, 2),
            'allocated_ed': round(allocated_ed, 2),
            'remaining_ed': round(remaining_ed, 2),
            'utilization': round(utilization, 1),
            'status': status,
            'message': message
        }
    
    def validate_capacity_summary(
        self, 
        year: int, 
        quarter: Optional[int] = None
    ) -> List[Dict]:
        """Get capacity validation summary for all teams"""
        teams = self.db.query(Team).all()
        results = []
        
        if quarter:
            quarters = [quarter]
        else:
            quarters = [1, 2, 3, 4]
        
        for team in teams:
            for q in quarters:
                validation = self.validate_capacity(team.id, year, q)
                if validation['status'] in ['over_allocated', 'high_utilization']:
                    results.append(validation)
        
        return results
    
    def validate_feature_consistency(self, feature_id: str) -> List[Dict]:
        """Validate that JIRA allocations don't exceed feature quarterly plans"""
        issues = []
        
        feature = self.db.query(RoadmapFeature).filter(
            RoadmapFeature.id == feature_id
        ).first()
        
        if not feature:
            return issues
        
        # Get all quarterly allocations for this feature
        feature_allocations = self.db.query(FeatureQuarterlyAllocation).filter(
            FeatureQuarterlyAllocation.feature_id == feature_id
        ).all()
        
        for alloc in feature_allocations:
            # Sum JIRA allocations for this quarter
            jira_allocations = self.db.query(JiraQuarterlyAllocation).join(
                JiraRecord
            ).filter(
                and_(
                    JiraRecord.feature_id == feature_id,
                    JiraQuarterlyAllocation.year == alloc.year,
                    JiraQuarterlyAllocation.quarter == alloc.quarter
                )
            ).all()
            
            jira_total = sum(float(ja.allocated_ed) for ja in jira_allocations)
            feature_planned = float(alloc.allocated_ed)
            
            if jira_total > feature_planned:
                issues.append({
                    'feature_id': feature_id,
                    'year': alloc.year,
                    'quarter': alloc.quarter,
                    'feature_planned_ed': round(feature_planned, 2),
                    'jira_allocated_ed': round(jira_total, 2),
                    'status': 'exceeded',
                    'message': f"JIRA allocations ({jira_total:.2f} eD) exceed feature plan ({feature_planned:.2f} eD) for {alloc.year} Q{alloc.quarter}"
                })
        
        return issues
    
    def get_validation_summary(
        self, 
        product_id: Optional[str] = None, 
        year: Optional[int] = None
    ) -> Dict:
        """Get comprehensive validation summary"""
        budget_alerts = []
        capacity_alerts = []
        consistency_alerts = []
        
        # Budget validation
        if product_id and year:
            budget_alerts = self.validate_budget(product_id, year)
        
        # Capacity validation
        if year:
            capacity_alerts = self.validate_capacity_summary(year)
        
        # Feature consistency validation
        if product_id:
            features = self.db.query(RoadmapFeature).filter(
                RoadmapFeature.product_id == product_id
            ).all()
            
            for feature in features:
                issues = self.validate_feature_consistency(feature.id)
                consistency_alerts.extend(issues)
        
        has_errors = any(
            alert['status'] == 'over_planned' for alert in budget_alerts
        ) or any(
            alert['status'] == 'over_allocated' for alert in capacity_alerts
        ) or len(consistency_alerts) > 0
        
        has_warnings = any(
            alert['status'] in ['approaching', 'high_utilization'] for alert in budget_alerts + capacity_alerts
        )
        
        return {
            'budget_validations': budget_alerts,
            'capacity_validations': capacity_alerts,
            'consistency_validations': consistency_alerts,
            'has_errors': has_errors,
            'has_warnings': has_warnings
        }
