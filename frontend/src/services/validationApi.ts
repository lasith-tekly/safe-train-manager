/**
 * Validation API Service
 */
import axios from 'axios';
import {
  BudgetValidationResult,
  CapacityValidationResult,
  FeatureConsistencyResult,
  ValidationSummaryResponse
} from '../types/roadmap_v4';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

/**
 * Validate budget at product/budget line/category levels
 */
export const getBudgetValidation = async (
  productId: string,
  year: number,
  budgetLineId?: string,
  categoryId?: string
): Promise<BudgetValidationResult[]> => {
  const params: any = { product_id: productId, year };
  if (budgetLineId) params.budget_line_id = budgetLineId;
  if (categoryId) params.category_id = categoryId;
  
  const response = await axios.get<BudgetValidationResult[]>(
    `${API_BASE_URL}/validation/budget`,
    { params }
  );
  return response.data;
};

/**
 * Validate team capacity for a specific quarter
 */
export const getCapacityValidation = async (
  teamId: string,
  year: number,
  quarter: number
): Promise<CapacityValidationResult> => {
  const response = await axios.get<CapacityValidationResult>(
    `${API_BASE_URL}/validation/capacity`,
    { params: { team_id: teamId, year, quarter } }
  );
  return response.data;
};

/**
 * Get capacity validation summary for all teams
 */
export const getCapacitySummary = async (
  year: number,
  quarter?: number
): Promise<CapacityValidationResult[]> => {
  const params: any = { year };
  if (quarter) params.quarter = quarter;
  
  const response = await axios.get<CapacityValidationResult[]>(
    `${API_BASE_URL}/validation/capacity/summary`,
    { params }
  );
  return response.data;
};

/**
 * Validate feature consistency
 */
export const getFeatureValidation = async (
  featureId: string
): Promise<{ budget_validations: BudgetValidationResult[]; consistency_issues: FeatureConsistencyResult[] }> => {
  const response = await axios.get(
    `${API_BASE_URL}/validation/feature/${featureId}`
  );
  return response.data;
};

/**
 * Get comprehensive validation summary
 */
export const getValidationSummary = async (
  productId?: string,
  year?: number
): Promise<ValidationSummaryResponse> => {
  const params: any = {};
  if (productId) params.product_id = productId;
  if (year) params.year = year;
  
  const response = await axios.get<ValidationSummaryResponse>(
    `${API_BASE_URL}/validation/summary`,
    { params }
  );
  return response.data;
};
