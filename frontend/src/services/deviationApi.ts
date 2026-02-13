/**
 * Deviation API Service
 * Handles API calls for deviation tracking and budget validation
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export type DeviationStatus = 'aligned' | 'minor' | 'significant' | 'under';

export interface QuarterDeviation {
  quarter: string;
  pi_id: string;
  pi_name: string;
  strategic_effort: number;
  execution_effort: number;
  deviation: number;
  deviation_percent: number;
  status: DeviationStatus;
}

export interface FeatureDeviationResponse {
  feature_id: string;
  feature_name: string;
  total_strategic: number;
  total_execution: number;
  total_deviation: number;
  total_deviation_percent: number;
  status: DeviationStatus;
  quarters: QuarterDeviation[];
  budget_impact_keur: number;
  is_acknowledged: boolean;
  acknowledge_reason?: string;
}

export interface FeatureDeviationSummary {
  feature_id: string;
  feature_name: string;
  total_deviation: number;
  status: DeviationStatus;
  budget_impact_keur: number;
}

export interface ProductDeviationSummary {
  product_id: string;
  product_name: string;
  features_with_deviation: number;
  features_aligned: number;
  total_deviation_ed: number;
  total_budget_impact_keur: number;
  status: DeviationStatus;
  features: FeatureDeviationSummary[];
}

export interface BudgetFeatureNode {
  feature_id: string;
  feature_name: string;
  planned_keur: number;
}

export interface BudgetCategoryNode {
  name: string;
  allocated_keur: number;
  planned_keur: number;
  status: 'ok' | 'warning' | 'error';
  features: BudgetFeatureNode[];
}

export interface BudgetLineNode {
  name: string;
  allocated_keur: number;
  planned_keur: number;
  status: 'ok' | 'warning' | 'error';
  categories: BudgetCategoryNode[];
}

export interface BudgetProductNode {
  name: string;
  allocated_keur: number;
  planned_keur: number;
  status: 'ok' | 'warning' | 'error';
  budget_lines: BudgetLineNode[];
}

export interface BudgetValidationTree {
  product: BudgetProductNode;
}

/**
 * Helper function to map backend status to frontend status
 */
function mapStatus(backendStatus: string): 'ok' | 'warning' | 'error' {
  switch (backendStatus) {
    case 'aligned':
    case 'under':
      return 'ok';
    case 'minor':
      return 'warning';
    case 'significant':
    case 'over':
      return 'error';
    default:
      return 'ok';
  }
}

/**
 * Deviation API methods
 */
export const deviationApi = {
  /**
   * Get product-level deviation summary
   */
  getProductDeviationSummary: async (
    productId: string,
    versionId: string
  ): Promise<ProductDeviationSummary> => {
    const response = await axios.get<ProductDeviationSummary>(
      `${API_BASE_URL}/products/${productId}/deviation-summary`,
      { params: { version_id: versionId } }
    );
    return response.data;
  },

  /**
   * Get feature-level deviation details
   */
  getFeatureDeviation: async (
    featureId: string,
    versionId: string
  ): Promise<FeatureDeviationResponse> => {
    const response = await axios.get<FeatureDeviationResponse>(
      `${API_BASE_URL}/features/${featureId}/deviation`,
      { params: { version_id: versionId } }
    );
    return response.data;
  },

  /**
   * Get budget validation tree
   */
  getBudgetValidationTree: async (
    productId: string,
    versionId: string
  ): Promise<BudgetValidationTree> => {
    // Backend response structure
    interface BackendBudgetValidationResponse {
      product_id: string;
      product_name: string;
      total_allocated_keur: number;
      total_planned_keur: number;
      total_planned_ed: number;
      total_remaining_keur: number;
      utilization_percent: number;
      status: string;
      budget_lines: Array<{
        budget_line_id: string;
        budget_line_name: string;
        allocated_keur: number;
        planned_keur: number;
        planned_ed: number;
        remaining_keur: number;
        utilization_percent: number;
        status: string;
        categories: Array<{
          category_id: string;
          category_name: string;
          allocated_keur: number;
          planned_keur: number;
          deviation_keur: number;
          utilization_percent: number;
          status: string;
        }>;
      }>;
    }

    const response = await axios.get<BackendBudgetValidationResponse>(
      `${API_BASE_URL}/products/${productId}/budget-validation`,
      { params: { version_id: versionId } }
    );

    const backendData = response.data;

    // Transform backend response to frontend structure
    const transformedData: BudgetValidationTree = {
      product: {
        name: backendData.product_name,
        allocated_keur: backendData.total_allocated_keur,
        planned_keur: backendData.total_planned_keur,
        status: mapStatus(backendData.status),
        budget_lines: backendData.budget_lines.map(line => ({
          name: line.budget_line_name,
          allocated_keur: line.allocated_keur,
          planned_keur: line.planned_keur,
          status: mapStatus(line.status),
          categories: line.categories.map(category => ({
            name: category.category_name,
            allocated_keur: category.allocated_keur,
            planned_keur: category.planned_keur,
            status: mapStatus(category.status),
            features: [] // Categories don't have features in current backend response
          }))
        }))
      }
    };

    return transformedData;
  },
};
