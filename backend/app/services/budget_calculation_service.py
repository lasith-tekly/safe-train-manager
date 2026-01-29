"""
Budget calculation service for dashboard analytics.
Handles target, forecast, and status calculations for PI-level budget planning.
"""
from typing import List, Dict
from sqlalchemy.orm import Session
from uuid import UUID


class BudgetCalculationService:
    """Service for budget calculation logic."""

    @staticmethod
    def calculate_pi_target(
        total_allocation: float, 
        pi_iterations: int, 
        total_iterations: int
    ) -> float:
        """
        Calculate target budget allocation for a PI based on iteration distribution.
        
        Formula: PI Target = Total Allocation × (PI Iterations / Total Iterations)
        
        Args:
            total_allocation: Total budget allocated to the budget line
            pi_iterations: Number of iterations in the PI
            total_iterations: Total iterations in the fiscal year
            
        Returns:
            Target allocation for the PI
        """
        if total_iterations == 0:
            return 0.0
        return total_allocation * (pi_iterations / total_iterations)

    @staticmethod
    def calculate_pi_forecast(
        remaining_budget: float, 
        pi_iterations: int, 
        remaining_iterations: int
    ) -> float:
        """
        Calculate forecasted budget for a future PI based on remaining budget.
        
        Formula: PI Forecast = Remaining Budget × (PI Iterations / Remaining Iterations)
        
        Args:
            remaining_budget: Budget remaining after actual planning
            pi_iterations: Number of iterations in the future PI
            remaining_iterations: Total remaining iterations in fiscal year
            
        Returns:
            Forecasted allocation for the PI
        """
        if remaining_iterations == 0:
            return 0.0
        return remaining_budget * (pi_iterations / remaining_iterations)

    @staticmethod
    def get_pi_status(planned: float, target: float) -> str:
        """
        Determine PI status based on planned vs target.
        
        Args:
            planned: Actual planned amount
            target: Target allocation
            
        Returns:
            Status string: NOT_STARTED, ON_TRACK, WARNING, or OVER_BUDGET
        """
        if planned == 0:
            return "NOT_STARTED"
        
        if target == 0:
            return "ON_TRACK"
        
        percentage = (planned / target) * 100
        
        if percentage <= 100:
            return "ON_TRACK"
        elif percentage <= 120:
            return "WARNING"
        else:
            return "OVER_BUDGET"

    @staticmethod
    def calculate_variance(planned: float, target: float) -> float:
        """Calculate variance between planned and target."""
        return planned - target

    @staticmethod
    def calculate_variance_percentage(planned: float, target: float) -> float:
        """Calculate variance as percentage of target."""
        if target == 0:
            return 0.0
        return ((planned - target) / target) * 100

    @staticmethod
    def calculate_utilization_percentage(used: float, allocated: float) -> float:
        """Calculate budget utilization percentage."""
        if allocated == 0:
            return 0.0
        return (used / allocated) * 100

    @staticmethod
    def calculate_chart_data(
        budget_line_allocation: float,
        pis: List[Dict],
        planned_amounts: Dict[str, float] = None
    ) -> List[Dict]:
        """
        Calculate complete chart data for all PIs.
        
        Args:
            budget_line_allocation: Total budget allocated to the line
            pis: List of PI dictionaries with id, name, iterations, order
            planned_amounts: Dict mapping PI ID to planned amount (optional)
            
        Returns:
            List of chart data points with target, planned, forecast
        """
        if planned_amounts is None:
            planned_amounts = {}
        
        # Calculate total iterations
        total_iterations = sum(pi['iterations'] for pi in pis)
        
        # Calculate targets for all PIs
        chart_data = []
        total_planned = 0.0
        
        for pi in pis:
            target = BudgetCalculationService.calculate_pi_target(
                budget_line_allocation,
                pi['iterations'],
                total_iterations
            )
            
            planned = planned_amounts.get(pi['id'], 0.0)
            total_planned += planned
            
            chart_data.append({
                'pi_id': pi['id'],
                'pi_name': pi['name'],
                'pi_order': pi['order'],
                'iterations': pi['iterations'],
                'target_amount': round(target, 2),
                'planned_amount': round(planned, 2),
                'is_actual': planned > 0,
                'variance': round(planned - target, 2),
                'status': BudgetCalculationService.get_pi_status(planned, target)
            })
        
        # Calculate forecasts for future PIs (where planned = 0)
        remaining_budget = budget_line_allocation - total_planned
        future_pis = [pi for pi in chart_data if pi['planned_amount'] == 0]
        
        if future_pis and remaining_budget > 0:
            remaining_iterations = sum(pi['iterations'] for pi in future_pis)
            
            for pi_data in chart_data:
                if pi_data['planned_amount'] == 0:
                    forecast = BudgetCalculationService.calculate_pi_forecast(
                        remaining_budget,
                        pi_data['iterations'],
                        remaining_iterations
                    )
                    pi_data['forecast_amount'] = round(forecast, 2)
                else:
                    pi_data['forecast_amount'] = pi_data['planned_amount']
        else:
            # If all PIs have planned amounts or no remaining budget
            for pi_data in chart_data:
                pi_data['forecast_amount'] = pi_data['planned_amount']
        
        return chart_data
