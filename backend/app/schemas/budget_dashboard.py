"""
Pydantic schemas for Budget Dashboard API.
"""
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID


class FiscalYearSummary(BaseModel):
    """Fiscal year summary for dashboard."""
    id: str
    year: int
    is_current: bool

    class Config:
        from_attributes = True


class ProductSummary(BaseModel):
    """Product budget summary."""
    id: str
    name: str
    short_code: str
    total_allocated: float
    total_planned: float
    total_remaining: float
    utilization_percentage: float
    budget_lines_count: int


class ProductsOverviewResponse(BaseModel):
    """Response for products overview endpoint."""
    fiscal_year: FiscalYearSummary
    products: List[ProductSummary]


class BudgetLineSummary(BaseModel):
    """Budget line summary for product detail."""
    id: str
    code: str
    name: str
    allocated_amount: float
    planned_amount: float
    percentage_of_total: float
    is_transversal: bool


class ProductDetailResponse(BaseModel):
    """Response for product detail endpoint."""
    product: dict
    budget_version: dict
    summary: dict
    budget_lines: List[BudgetLineSummary]


class CategorySummary(BaseModel):
    """Category summary for budget line detail."""
    id: str
    name: str
    allocated_amount: float
    percentage_of_line: float


class BudgetLineDetailResponse(BaseModel):
    """Response for budget line detail endpoint."""
    budget_line: dict
    product: Optional[dict]
    summary: dict
    categories: List[CategorySummary]


class ChartDataPoint(BaseModel):
    """Single data point for chart."""
    pi_id: str
    pi_name: str
    pi_order: int
    iterations: int
    target_amount: float
    planned_amount: float
    forecast_amount: float
    is_actual: bool
    variance: float
    status: str


class ChartDataResponse(BaseModel):
    """Response for chart data endpoint."""
    budget_line: dict
    fiscal_year: dict
    chart_data: List[ChartDataPoint]
    totals: dict
