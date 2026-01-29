"""
Validation Service V4 - Budget and Capacity Validations

Validates features against budget allocations and team capacity
"""
from decimal import Decimal
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.roadmap_v4 import RoadmapFeature, FeatureQuarterlyAllocation, JiraRecord, JiraQuarterlyAllocation
from app.models.budget_new import BudgetLine, BudgetCategory, ProductBudget
from app.models.team import Team
from app.services.calculation_service import CalculationService


class ValidationServiceV4:
    """Service for validating features against budget and capacity"""
    
    def __init__(self, db: Session):
        self.db = db
        self.calc_service = CalculationService(db)
    
    def validate_budget(self, product_id: str, budget_line_id: str, category_id: Optional[str], year: int) -> Dict:
        """
        Validate budget at 3 levels: Product, Budget Line, Category
        
        Returns validation results for each level with status and messages
        """
        results = {
            'product_validation': None,
            'budget_line_validation': None,
            'category_validation': None
        }
        
        # Level 1: Product Level
        product_validation = self._validate_product_level(product_id, year)
        results['product_validation'] = product_validation
        
        # Level 2: Budget Line Level
        line_validation = self._validate_budget_line_level(budget_line_id, year)
        results['budget_line_validation'] = line_validation
        
        # Level 3: Category Level (if category specified)
        if category_id:
            category_validation = self._validate_category_level(category_id, year)
            results['category_validation'] = category_validation
        
        return results
    
    def _validate_product_level(self, product_id: str, year: int) -> Dict:
        """Validate at product level"""
        # Get product's total budget for the year
        product_budget = self.db.query(ProductBudget).filter(
            ProductBudget.product_id == product_id
        ).first()
        
        if not product_budget:
            return {
                'level': 'product',
                'name': 'Product',
                'allocated_keur': 0,
                'planned_keur': 0,
                'percentage': 0,
                'status': 'no_budget',
                'message': 'No budget allocated for this product'
            }
        
        # Sum all features for this product in this year
        planned_cost = self._sum_feature_costs_for_product(product_id, year)
        
        # Get total budget lines for this product
        allocated = self._get_product_total_budget(product_budget.id)
        
        return self._create_validation_result('product', 'Product', allocated, planned_cost)
    
    def _validate_budget_line_level(self, budget_line_id: str, year: int) -> Dict:
        """Validate at budget line level"""
        budget_line = self.db.query(BudgetLine).filter(BudgetLine.id == budget_line_id).first()
        
        if not budget_line:
            return self._create_no_budget_result('budget_line', 'Budget Line')
        
        allocated = Decimal(str(budget_line.allocated_amount))
        planned_cost = self._sum_feature_costs_for_line(budget_line_id, year)
        
        return self._create_validation_result('budget_line', budget_line.name, allocated, planned_cost)
    
    def _validate_category_level(self, category_id: str, year: int) -> Dict:
        """Validate at category level"""
        category = self.db.query(BudgetCategory).filter(BudgetCategory.id == category_id).first()
        
        if not category:
            return self._create_no_budget_result('category', 'Category')
        
        allocated = Decimal(str(category.allocated_amount))
        planned_cost = self._sum_feature_costs_for_category(category_id, year)
        
        return self._create_validation_result('category', category.name, allocated, planned_cost)
    
    def _sum_feature_costs_for_product(self, product_id: str, year: int) -> Decimal:
        """Sum feature costs for a product in a specific year"""
        # Get all features for this product
        features = self.db.query(RoadmapFeature).filter(
            RoadmapFeature.product_id == product_id
        ).all()
        
        total_cost = Decimal('0')
        for feature in features:
            # Sum quarterly allocations for this year
            year_allocations = self.db.query(
                func.sum(FeatureQuarterlyAllocation.allocated_ed)
            ).filter(
                FeatureQuarterlyAllocation.feature_id == feature.id,
                FeatureQuarterlyAllocation.year == year
            ).scalar() or 0
            
            # Convert Net eD to cost
            if year_allocations > 0:
                cost = self.calc_service.quarterly_ed_to_cost(Decimal(str(year_allocations)))
                total_cost += cost
        
        return total_cost
    
    def _sum_feature_costs_for_line(self, budget_line_id: str, year: int) -> Decimal:
        """Sum feature costs for a budget line in a specific year"""
        features = self.db.query(RoadmapFeature).filter(
            RoadmapFeature.budget_line_id == budget_line_id
        ).all()
        
        total_cost = Decimal('0')
        for feature in features:
            year_allocations = self.db.query(
                func.sum(FeatureQuarterlyAllocation.allocated_ed)
            ).filter(
                FeatureQuarterlyAllocation.feature_id == feature.id,
                FeatureQuarterlyAllocation.year == year
            ).scalar() or 0
            
            if year_allocations > 0:
                cost = self.calc_service.quarterly_ed_to_cost(Decimal(str(year_allocations)))
                total_cost += cost
        
        return total_cost
    
    def _sum_feature_costs_for_category(self, category_id: str, year: int) -> Decimal:
        """Sum feature costs for a category in a specific year"""
        features = self.db.query(RoadmapFeature).filter(
            RoadmapFeature.category_id == category_id
        ).all()
        
        total_cost = Decimal('0')
        for feature in features:
            year_allocations = self.db.query(
                func.sum(FeatureQuarterlyAllocation.allocated_ed)
            ).filter(
                FeatureQuarterlyAllocation.feature_id == feature.id,
                FeatureQuarterlyAllocation.year == year
            ).scalar() or 0
            
            if year_allocations > 0:
                cost = self.calc_service.quarterly_ed_to_cost(Decimal(str(year_allocations)))
                total_cost += cost
        
        return total_cost
    
    def _get_product_total_budget(self, product_budget_id: str) -> Decimal:
        """Get total budget for a product"""
        total = self.db.query(
            func.sum(BudgetLine.allocated_amount)
        ).filter(
            BudgetLine.product_budget_id == product_budget_id
        ).scalar() or 0
        
        return Decimal(str(total))
    
    def _create_validation_result(self, level: str, name: str, allocated: Decimal, planned: Decimal) -> Dict:
        """Create validation result with status determination"""
        if allocated == 0:
            return self._create_no_budget_result(level, name)
        
        percentage = (planned / allocated * 100) if allocated > 0 else 0
        
        if percentage > 100:
            status = 'over_planned'
            message = f"🔴 {name} {year}: Planned {planned}K exceeds allocated {allocated}K"
        elif percentage > 90:
            status = 'approaching'
            message = f"🟡 {name} {year}: {percentage:.0f}% allocated"
        elif percentage < 80 and allocated > 0:
            status = 'under_planned'
            remaining = allocated - planned
            message = f"🔵 {name} {year}: Only {percentage:.0f}% planned, {remaining}K remaining"
        else:
            status = 'healthy'
            message = f"✅ {name} {year}: {percentage:.0f}% allocated"
        
        return {
            'level': level,
            'name': name,
            'allocated_keur': allocated,
            'planned_keur': planned,
            'percentage': Decimal(str(round(percentage, 2))),
            'status': status,
            'message': message
        }
    
    def _create_no_budget_result(self, level: str, name: str) -> Dict:
        """Create result for no budget scenario"""
        return {
            'level': level,
            'name': name,
            'allocated_keur': 0,
            'planned_keur': 0,
            'percentage': 0,
            'status': 'no_budget',
            'message': f'No budget allocated for {name}'
        }
    
    def validate_team_capacity(self, team_id: str, year: int, quarter: int) -> Dict:
        """
        Validate team capacity for a specific quarter
        
        Returns capacity validation with utilization status
        """
        team = self.db.query(Team).filter(Team.id == team_id).first()
        if not team:
            return {
                'team_id': team_id,
                'team_name': 'Unknown',
                'year': year,
                'quarter': quarter,
                'capacity_ed': 0,
                'allocated_ed': 0,
                'remaining_ed': 0,
                'utilization': 0,
                'status': 'no_capacity',
                'message': 'Team not found'
            }
        
        # Get team capacity for this quarter (simplified - would need actual capacity calculation)
        # For now, return placeholder
        capacity_ed = Decimal('200')  # Placeholder
        
        # Sum JIRA allocations for this team/year/quarter
        allocated_ed = self.db.query(
            func.sum(JiraQuarterlyAllocation.allocated_ed)
        ).join(JiraRecord).filter(
            JiraRecord.team_id == team_id,
            JiraQuarterlyAllocation.year == year,
            JiraQuarterlyAllocation.quarter == quarter
        ).scalar() or 0
        
        allocated_ed = Decimal(str(allocated_ed))
        remaining_ed = capacity_ed - allocated_ed
        utilization = (allocated_ed / capacity_ed * 100) if capacity_ed > 0 else 0
        
        if utilization > 100:
            status = 'over_allocated'
            message = f"🔴 {team.name} Q{quarter}: Over-allocated by {abs(remaining_ed):.0f} eD"
        elif utilization > 90:
            status = 'high_utilization'
            message = f"🟡 {team.name} Q{quarter}: {utilization:.0f}% utilized"
        else:
            status = 'healthy'
            message = f"✅ {team.name} Q{quarter}: {utilization:.0f}% utilized, {remaining_ed:.0f} eD remaining"
        
        return {
            'team_id': team_id,
            'team_name': team.name,
            'year': year,
            'quarter': quarter,
            'capacity_ed': capacity_ed,
            'allocated_ed': allocated_ed,
            'remaining_ed': remaining_ed,
            'utilization': Decimal(str(round(utilization, 2))),
            'status': status,
            'message': message
        }
    
    def validate_feature_consistency(self, feature_id: str, year: int, quarter: int) -> Dict:
        """
        Validate that JIRA allocations don't exceed feature plan
        
        Returns consistency validation result
        """
        # Get feature's quarterly allocation
        feature_allocation = self.db.query(FeatureQuarterlyAllocation).filter(
            FeatureQuarterlyAllocation.feature_id == feature_id,
            FeatureQuarterlyAllocation.year == year,
            FeatureQuarterlyAllocation.quarter == quarter
        ).first()
        
        feature_planned_ed = Decimal(str(feature_allocation.allocated_ed)) if feature_allocation else Decimal('0')
        
        # Sum JIRA allocations for this feature/quarter
        jira_total = self.db.query(
            func.sum(JiraQuarterlyAllocation.allocated_ed)
        ).join(JiraRecord).filter(
            JiraRecord.feature_id == feature_id,
            JiraQuarterlyAllocation.year == year,
            JiraQuarterlyAllocation.quarter == quarter
        ).scalar() or 0
        
        jira_allocated_ed = Decimal(str(jira_total))
        
        if jira_allocated_ed > feature_planned_ed:
            return {
                'feature_id': feature_id,
                'year': year,
                'quarter': quarter,
                'feature_planned_ed': feature_planned_ed,
                'jira_allocated_ed': jira_allocated_ed,
                'status': 'exceeded',
                'message': f"⚠️ JIRA allocations ({jira_allocated_ed} eD) exceed feature plan ({feature_planned_ed} eD)"
            }
        
        return {
            'feature_id': feature_id,
            'year': year,
            'quarter': quarter,
            'feature_planned_ed': feature_planned_ed,
            'jira_allocated_ed': jira_allocated_ed,
            'status': 'ok',
            'message': None
        }
