/**
 * Budget Dashboard API service
 */
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Types
export interface FiscalYearSummary {
  id: string;
  year: number;
  is_current: boolean;
}

export interface ProductSummary {
  id: string;
  name: string;
  short_code: string;
  total_allocated: number;
  total_planned: number;
  total_remaining: number;
  utilization_percentage: number;
  budget_lines_count: number;
}

export interface ProductsOverviewResponse {
  fiscal_year: FiscalYearSummary;
  products: ProductSummary[];
}

export interface BudgetLineSummary {
  id: string;
  code: string;
  name: string;
  allocated_amount: number;
  planned_amount: number;
  percentage_of_total: number;
  is_transversal: boolean;
}

export interface ProductDetailResponse {
  product: {
    id: string;
    name: string;
    short_code: string;
  };
  budget_version: {
    id: string;
    version_number: number;
    is_active: boolean;
  };
  summary: {
    total_allocated: number;
    total_planned: number;
    total_remaining: number;
    utilization_percentage: number;
  };
  budget_lines: BudgetLineSummary[];
}

export interface CategorySummary {
  id: string;
  name: string;
  allocated_amount: number;
  percentage_of_line: number;
}

export interface BudgetLineDetailResponse {
  budget_line: {
    id: string;
    code: string;
    name: string;
    allocated_amount: number;
    is_transversal: boolean;
  };
  product: {
    id: string;
    name: string;
    short_code: string;
  } | null;
  summary: {
    allocated: number;
    planned: number;
    remaining: number;
    utilization_percentage: number;
  };
  categories: CategorySummary[];
}

export interface ChartDataPoint {
  pi_id: string;
  pi_name: string;
  pi_order: number;
  iterations: number;
  target_amount: number;
  planned_amount: number;
  forecast_amount: number;
  is_actual: boolean;
  variance: number;
  status: string;
}

export interface ChartDataResponse {
  budget_line: {
    id: string;
    code: string;
    name: string;
    allocated_amount: number;
  };
  fiscal_year: {
    id: string;
    year: number;
    total_iterations: number;
  };
  chart_data: ChartDataPoint[];
  totals: {
    total_target: number;
    total_planned: number;
    total_forecast: number;
    remaining_budget: number;
  };
}

// API Functions

export const getProductsOverview = async (
  fiscalYearId: string
): Promise<ProductsOverviewResponse> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/budget/dashboard/products`,
    { params: { fiscal_year_id: fiscalYearId } }
  );
  return response.data;
};

export const getProductDetail = async (
  productId: string,
  budgetVersionId?: string
): Promise<ProductDetailResponse> => {
  const params = budgetVersionId ? { budget_version_id: budgetVersionId } : {};
  const response = await axios.get(
    `${API_BASE_URL}/api/budget/dashboard/product/${productId}`,
    { params }
  );
  return response.data;
};

export const getBudgetLineDetail = async (
  lineId: string
): Promise<BudgetLineDetailResponse> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/budget/dashboard/line/${lineId}`
  );
  return response.data;
};

export const getChartData = async (
  lineId: string
): Promise<ChartDataResponse> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/budget/dashboard/line/${lineId}/chart-data`
  );
  return response.data;
};
