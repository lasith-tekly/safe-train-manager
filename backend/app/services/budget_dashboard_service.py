"""
Budget Dashboard service for retrieving and calculating dashboard data.
"""
from typing import Optional, Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID

from app.models.budget_new import BudgetVersion, ProductBudget, BudgetLine, BudgetCategory, FiscalYear
from app.models.product import Product
from app.models.pi import PI, Iteration
from app.services.budget_calculation_service import BudgetCalculationService


class BudgetDashboardService:
    """Service for budget dashboard operations."""

    @staticmethod
    def get_products_overview(db: Session, fiscal_year_id: str) -> Dict:
        """
        Get all products with budget summaries for a fiscal year.
        
        Args:
            db: Database session
            fiscal_year_id: Fiscal year ID
            
        Returns:
            Dictionary with fiscal year info and product summaries
        """
        # Get fiscal year
        fiscal_year = db.query(FiscalYear).filter(
            FiscalYear.id == fiscal_year_id
        ).first()
        
        if not fiscal_year:
            return None
        
        # Get active budget version for fiscal year
        # Note: BudgetVersion.fiscal_year_id has hyphens, but FiscalYear.id doesn't
        # So we need to use the original fiscal_year_id parameter
        budget_version = db.query(BudgetVersion).filter(
            BudgetVersion.fiscal_year_id == fiscal_year_id,
            BudgetVersion.is_active == True
        ).first()
        
        if not budget_version:
            return {
                'fiscal_year': {
                    'id': fiscal_year.id,
                    'year': fiscal_year.year,
                    'is_current': fiscal_year.is_current
                },
                'products': []
            }
        
        # Get all product budgets for this version
        product_budgets = db.query(ProductBudget).filter(
            ProductBudget.budget_version_id == budget_version.id
        ).all()
        
        products = []
        for pb in product_budgets:
            # Get product
            product = db.query(Product).filter(Product.id == pb.product_id).first()
            if not product:
                continue
            
            # Get budget lines for this product budget
            budget_lines = db.query(BudgetLine).filter(
                BudgetLine.product_budget_id == pb.id
            ).all()
            
            total_allocated = sum(line.allocated_amount for line in budget_lines)
            # TODO: Get planned amounts from PIBudgetPlan when PI Planning is implemented
            total_planned = 0.0
            
            products.append({
                'id': product.id,
                'name': product.name,
                'short_code': product.short_code,
                'total_allocated': float(total_allocated),
                'total_planned': total_planned,
                'total_remaining': float(total_allocated) - total_planned,
                'utilization_percentage': BudgetCalculationService.calculate_utilization_percentage(
                    total_planned, float(total_allocated)
                ),
                'budget_lines_count': len(budget_lines)
            })
        
        return {
            'fiscal_year': {
                'id': fiscal_year.id,
                'year': fiscal_year.year,
                'is_current': fiscal_year.is_current
            },
            'products': products
        }

    @staticmethod
    def get_product_detail(
        db: Session, 
        product_id: str, 
        budget_version_id: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Get detailed budget information for a specific product.
        
        Args:
            db: Database session
            product_id: Product ID
            budget_version_id: Optional budget version ID (defaults to active)
            
        Returns:
            Dictionary with product budget details
        """
        # Get product
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return None
        
        # Get budget version
        if budget_version_id:
            budget_version = db.query(BudgetVersion).filter(
                BudgetVersion.id == budget_version_id
            ).first()
        else:
            # Get active version for product's fiscal year
            budget_version = db.query(BudgetVersion).join(
                ProductBudget, BudgetVersion.id == ProductBudget.budget_version_id
            ).filter(
                ProductBudget.product_id == product_id,
                BudgetVersion.is_active == True
            ).first()
        
        if not budget_version:
            return None
        
        # Get product budget
        product_budget = db.query(ProductBudget).filter(
            ProductBudget.product_id == product_id,
            ProductBudget.budget_version_id == budget_version.id
        ).first()
        
        if not product_budget:
            return None
        
        # Get budget lines
        budget_lines = db.query(BudgetLine).filter(
            BudgetLine.product_budget_id == product_budget.id
        ).all()
        
        total_allocated = sum(line.allocated_amount for line in budget_lines)
        # TODO: Get planned amounts from PIBudgetPlan
        total_planned = 0.0
        
        lines_data = []
        for line in budget_lines:
            # TODO: Get planned amount for this line
            line_planned = 0.0
            
            lines_data.append({
                'id': line.id,
                'code': line.code,
                'name': line.name,
                'allocated_amount': float(line.allocated_amount),
                'planned_amount': line_planned,
                'percentage_of_total': (line.allocated_amount / total_allocated * 100) if total_allocated > 0 else 0,
                'is_transversal': line.is_transversal
            })
        
        return {
            'product': {
                'id': product.id,
                'name': product.name,
                'short_code': product.short_code
            },
            'budget_version': {
                'id': budget_version.id,
                'version_number': budget_version.version_number,
                'is_active': budget_version.is_active
            },
            'summary': {
                'total_allocated': float(total_allocated),
                'total_planned': total_planned,
                'total_remaining': float(total_allocated) - total_planned,
                'utilization_percentage': BudgetCalculationService.calculate_utilization_percentage(
                    total_planned, float(total_allocated)
                )
            },
            'budget_lines': lines_data
        }

    @staticmethod
    def get_budget_line_detail(db: Session, line_id: str) -> Optional[Dict]:
        """
        Get detailed information for a specific budget line.
        
        Args:
            db: Database session
            line_id: Budget line ID
            
        Returns:
            Dictionary with budget line details
        """
        # Get budget line
        budget_line = db.query(BudgetLine).filter(
            BudgetLine.id == line_id
        ).first()
        
        if not budget_line:
            return None
        
        # Get product
        product = None
        if budget_line.product_id:
            product = db.query(Product).filter(
                Product.id == budget_line.product_id
            ).first()
        
        # Get categories
        categories = db.query(BudgetCategory).filter(
            BudgetCategory.budget_line_id == line_id
        ).all()
        
        # TODO: Get planned amount from PIBudgetPlan
        planned_amount = 0.0
        
        categories_data = []
        for cat in categories:
            categories_data.append({
                'id': cat.id,
                'name': cat.name,
                'allocated_amount': float(cat.allocated_amount),
                'percentage_of_line': (cat.allocated_amount / budget_line.allocated_amount * 100) 
                    if budget_line.allocated_amount > 0 else 0
            })
        
        return {
            'budget_line': {
                'id': budget_line.id,
                'code': budget_line.code,
                'name': budget_line.name,
                'allocated_amount': float(budget_line.allocated_amount),
                'is_transversal': budget_line.is_transversal
            },
            'product': {
                'id': product.id if product else None,
                'name': product.name if product else 'N/A',
                'short_code': product.short_code if product else 'N/A'
            } if product else None,
            'summary': {
                'allocated': float(budget_line.allocated_amount),
                'planned': planned_amount,
                'remaining': float(budget_line.allocated_amount) - planned_amount,
                'utilization_percentage': BudgetCalculationService.calculate_utilization_percentage(
                    planned_amount, float(budget_line.allocated_amount)
                )
            },
            'categories': categories_data
        }

    @staticmethod
    def get_chart_data(db: Session, line_id: str) -> Optional[Dict]:
        """
        Get PI-level chart data for target vs actual/forecast.
        
        Args:
            db: Database session
            line_id: Budget line ID
            
        Returns:
            Dictionary with chart data
        """
        # Get budget line
        budget_line = db.query(BudgetLine).filter(
            BudgetLine.id == line_id
        ).first()
        
        if not budget_line:
            return None
        
        # Get fiscal year through budget version
        budget_version = db.query(BudgetVersion).filter(
            BudgetVersion.id == budget_line.budget_version_id
        ).first()
        
        if not budget_version:
            return None
        
        # Get fiscal year explicitly
        fiscal_year = db.query(FiscalYear).filter(
            FiscalYear.id == budget_version.fiscal_year_id
        ).first()
        
        if not fiscal_year:
            return None
        
        # Get all PIs for fiscal year (need to link through year)
        pis = db.query(PI).filter(
            PI.year == fiscal_year.year
        ).order_by(PI.sequence).all()
        
        if not pis:
            return {
                'budget_line': {
                    'id': budget_line.id,
                    'code': budget_line.code,
                    'name': budget_line.name,
                    'allocated_amount': float(budget_line.allocated_amount)
                },
                'fiscal_year': {
                    'id': fiscal_year.id,
                    'year': fiscal_year.year,
                    'total_iterations': 0
                },
                'chart_data': [],
                'totals': {
                    'total_target': 0.0,
                    'total_planned': 0.0,
                    'total_forecast': 0.0,
                    'remaining_budget': float(budget_line.allocated_amount)
                }
            }
        
        # Get iteration counts for each PI
        pis_data = []
        total_iterations = 0
        
        for pi in pis:
            iteration_count = db.query(func.count(Iteration.id)).filter(
                Iteration.pi_id == pi.id
            ).scalar() or 0
            
            total_iterations += iteration_count
            
            pis_data.append({
                'id': pi.id,
                'name': pi.name,
                'order': pi.sequence,
                'iterations': iteration_count
            })
        
        # Get planned amounts from PIBudgetPlan (if any)
        # TODO: Implement when PI Planning module is ready
        planned_amounts = {}
        
        # Calculate chart data
        chart_data = BudgetCalculationService.calculate_chart_data(
            float(budget_line.allocated_amount),
            pis_data,
            planned_amounts
        )
        
        # Calculate totals
        total_target = sum(point['target_amount'] for point in chart_data)
        total_planned = sum(point['planned_amount'] for point in chart_data)
        total_forecast = sum(point['forecast_amount'] for point in chart_data)
        
        return {
            'budget_line': {
                'id': budget_line.id,
                'code': budget_line.code,
                'name': budget_line.name,
                'allocated_amount': float(budget_line.allocated_amount)
            },
            'fiscal_year': {
                'id': fiscal_year.id,
                'year': fiscal_year.year,
                'total_iterations': total_iterations
            },
            'chart_data': chart_data,
            'totals': {
                'total_target': round(total_target, 2),
                'total_planned': round(total_planned, 2),
                'total_forecast': round(total_forecast, 2),
                'remaining_budget': round(float(budget_line.allocated_amount) - total_planned, 2)
            }
        }
