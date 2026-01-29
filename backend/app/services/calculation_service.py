"""
Calculation Service - Effort/Cost Conversions

Core calculation logic for Roadmap V4 effort-centric design
"""
from decimal import Decimal
from typing import Dict
from sqlalchemy.orm import Session
from app.models.global_settings import GlobalSettings


class CalculationService:
    """Service for effort/cost calculations"""
    
    def __init__(self, db: Session):
        self.db = db
        self._settings_cache = None
    
    def _get_settings(self) -> Dict[str, float]:
        """Get train configuration settings (cached)"""
        if self._settings_cache is None:
            settings = self.db.query(GlobalSettings).first()
            if not settings:
                raise ValueError("Global settings not configured")
            
            self._settings_cache = {
                'unit_cost_keur': float(settings.train_unit_cost_keur),
                'effort_days_per_year': int(settings.effort_days_per_year),
                'structural_cost_ratio': float(settings.train_structural_cost_ratio)
            }
        
        return self._settings_cache
    
    def calculate_sizing(self, gross_sizing_ed: Decimal) -> Dict[str, Decimal]:
        """
        Calculate net sizing and total cost from gross sizing
        
        Formula:
        - Net eD = Gross eD / Structural Cost Ratio
        - Total Cost (KEUR) = (Gross eD / Effort Days per Year) * Unit Cost KEUR
        
        Example:
        - Input: gross_sizing_ed = 280
        - Output: net_sizing_ed = 100, total_cost_keur = 99.27
        """
        settings = self._get_settings()
        
        gross = float(gross_sizing_ed)
        net_sizing_ed = gross / settings['structural_cost_ratio']
        total_cost_keur = (gross / settings['effort_days_per_year']) * settings['unit_cost_keur']
        
        return {
            'gross_sizing_ed': Decimal(str(round(gross, 2))),
            'net_sizing_ed': Decimal(str(round(net_sizing_ed, 2))),
            'total_cost_keur': Decimal(str(round(total_cost_keur, 2)))
        }
    
    def quarterly_ed_to_cost(self, quarterly_ed: Decimal) -> Decimal:
        """
        Convert quarterly Net eD allocation to cost in KEUR
        
        Formula:
        - Gross eD = Net eD * Structural Cost Ratio
        - Cost (KEUR) = (Gross eD / Effort Days per Year) * Unit Cost KEUR
        
        Example:
        - Input: quarterly_ed = 10 (Net eD)
        - Gross = 10 * 2.8 = 28 eD
        - Cost = (28 / 220) * 78 = 9.93 KEUR
        """
        settings = self._get_settings()
        
        net_ed = float(quarterly_ed)
        gross_ed = net_ed * settings['structural_cost_ratio']
        cost_keur = (gross_ed / settings['effort_days_per_year']) * settings['unit_cost_keur']
        
        return Decimal(str(round(cost_keur, 2)))
    
    def budget_to_available_ed(self, budget_keur: Decimal) -> Decimal:
        """
        Convert allocated budget to available Net effort days
        
        Formula:
        - Available Net eD = (Budget KEUR / Unit Cost KEUR) * Effort Days per Year / Structural Cost Ratio
        
        Example:
        - Input: budget_keur = 100
        - Output: 100.73 Net eD available
        """
        settings = self._get_settings()
        
        budget = float(budget_keur)
        available_ed = (budget / settings['unit_cost_keur']) * settings['effort_days_per_year'] / settings['structural_cost_ratio']
        
        return Decimal(str(round(available_ed, 2)))
    
    def cost_to_gross_ed(self, cost_keur: Decimal) -> Decimal:
        """
        Convert cost to gross effort days
        
        Formula:
        - Gross eD = (Cost KEUR / Unit Cost KEUR) * Effort Days per Year
        """
        settings = self._get_settings()
        
        cost = float(cost_keur)
        gross_ed = (cost / settings['unit_cost_keur']) * settings['effort_days_per_year']
        
        return Decimal(str(round(gross_ed, 2)))
    
    def validate_quarterly_sum(self, quarterly_allocations: list, expected_total: Decimal, tolerance: Decimal = Decimal('0.01')) -> bool:
        """
        Validate that quarterly allocations sum to expected total
        
        Args:
            quarterly_allocations: List of allocations with 'allocated_ed' field
            expected_total: Expected sum
            tolerance: Acceptable difference (default 0.01)
        
        Returns:
            True if sum matches within tolerance
        """
        total = sum(Decimal(str(alloc.get('allocated_ed', 0))) for alloc in quarterly_allocations)
        return abs(total - expected_total) <= tolerance
