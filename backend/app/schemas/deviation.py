"""
Deviation Schemas - Phase 4

Pydantic schemas for deviation calculation and budget validation responses.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class DeviationStatus(str, Enum):
    """Deviation status based on thresholds"""
    ALIGNED = "aligned"
    MINOR = "minor"
    SIGNIFICANT = "significant"
    UNDER = "under"


class QuarterDeviation(BaseModel):
    """Quarterly deviation details"""
    quarter: str = Field(..., description="Quarter label (e.g., 'Q1 2026')")
    pi_id: str = Field(..., description="PI identifier")
    pi_name: str = Field(..., description="PI name")
    strategic_effort: float = Field(..., description="Strategic effort in Net eD")
    execution_effort: float = Field(..., description="Execution effort in Net eD")
    deviation: float = Field(..., description="Deviation in Net eD (execution - strategic)")
    deviation_percent: float = Field(..., description="Deviation percentage")
    status: DeviationStatus = Field(..., description="Deviation status for this quarter")

    class Config:
        json_schema_extra = {
            "example": {
                "quarter": "Q1 2026",
                "pi_id": "uuid",
                "pi_name": "PI 2026.1",
                "strategic_effort": 10.0,
                "execution_effort": 12.0,
                "deviation": 2.0,
                "deviation_percent": 20.0,
                "status": "significant"
            }
        }


class FeatureDeviationResponse(BaseModel):
    """Feature-level deviation response"""
    feature_id: str
    feature_name: str
    total_strategic: float = Field(..., description="Total strategic effort in Net eD")
    total_execution: float = Field(..., description="Total execution effort in Net eD")
    total_deviation: float = Field(..., description="Total deviation in Net eD")
    total_deviation_percent: float = Field(..., description="Total deviation percentage")
    status: DeviationStatus
    quarters: List[QuarterDeviation] = Field(default_factory=list)
    budget_impact_keur: float = Field(..., description="Budget impact in KEUR")
    is_acknowledged: bool = Field(default=False)
    acknowledge_reason: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "feature_id": "uuid",
                "feature_name": "User Authentication",
                "total_strategic": 30.0,
                "total_execution": 33.0,
                "total_deviation": 3.0,
                "total_deviation_percent": 10.0,
                "status": "minor",
                "quarters": [],
                "budget_impact_keur": 1.03,
                "is_acknowledged": False,
                "acknowledge_reason": None
            }
        }


class ProductDeviationSummary(BaseModel):
    """Product-level deviation summary"""
    product_id: str
    product_name: str
    features_with_deviation: int = Field(..., description="Count of features with deviations")
    features_aligned: int = Field(..., description="Count of aligned features")
    total_deviation_ed: float = Field(..., description="Total deviation in Net eD")
    total_budget_impact_keur: float = Field(..., description="Total budget impact in KEUR")
    status: DeviationStatus = Field(..., description="Overall product status")
    features: List[FeatureDeviationResponse] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "product_id": "uuid",
                "product_name": "Train Product A",
                "features_with_deviation": 10,
                "features_aligned": 15,
                "total_deviation_ed": 45.2,
                "total_budget_impact_keur": 15.6,
                "status": "significant",
                "features": []
            }
        }


class CategoryValidation(BaseModel):
    """Budget category validation"""
    category_id: str
    category_name: str
    allocated_keur: float
    planned_keur: float
    deviation_keur: float
    utilization_percent: float
    status: DeviationStatus

    class Config:
        json_schema_extra = {
            "example": {
                "category_id": "uuid",
                "category_name": "New Features",
                "allocated_keur": 250.0,
                "planned_keur": 200.0,
                "deviation_keur": -50.0,
                "utilization_percent": 80.0,
                "status": "aligned"
            }
        }


class BudgetLineValidation(BaseModel):
    """Budget line validation"""
    budget_line_id: str
    budget_line_name: str
    allocated_keur: float
    planned_keur: float
    planned_ed: float = Field(..., description="Planned effort in Net eD")
    remaining_keur: float
    utilization_percent: float
    status: DeviationStatus
    categories: List[CategoryValidation] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "budget_line_id": "uuid",
                "budget_line_name": "Product Evolution",
                "allocated_keur": 600.0,
                "planned_keur": 450.0,
                "planned_ed": 128.6,
                "remaining_keur": 150.0,
                "utilization_percent": 75.0,
                "status": "aligned",
                "categories": []
            }
        }


class BudgetValidationTree(BaseModel):
    """Budget validation tree response"""
    product_id: str
    product_name: str
    total_allocated_keur: float
    total_planned_keur: float
    total_planned_ed: float = Field(..., description="Total planned effort in Net eD")
    total_remaining_keur: float
    utilization_percent: float
    status: DeviationStatus
    budget_lines: List[BudgetLineValidation] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "product_id": "uuid",
                "product_name": "Train Product A",
                "total_allocated_keur": 1500.0,
                "total_planned_keur": 1250.0,
                "total_planned_ed": 357.1,
                "total_remaining_keur": 250.0,
                "utilization_percent": 83.3,
                "status": "aligned",
                "budget_lines": []
            }
        }
