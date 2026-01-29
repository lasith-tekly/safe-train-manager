/**
 * Roadmap Planning API Service V2
 * 
 * API functions for multi-year roadmap management, feature planning, and budget tracking.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// ============================================
// Types
// ============================================

export interface PIAllocation {
  quarter: number;
  budget_keur: number;
}

export interface PIAllocationResponse {
  id: string;
  quarter: number;
  budget_keur: number;
  created_at: string;
  updated_at: string;
}

export interface YearAllocation {
  year: number;
  budget_keur: number;
  effort_days?: number;
  pi_allocations?: PIAllocation[];
}

export interface YearAllocationResponse {
  id: string;
  year: number;
  budget_keur: number;
  effort_days: number;
  pi_allocations: PIAllocationResponse[];
}

export interface BudgetAlert {
  year: number;
  budget_line_name: string;
  category_name?: string;
  status: 'balanced' | 'under_planned' | 'over_budget' | 'no_budget';
  message: string;
  allocated_keur?: number;
  planned_keur: number;
  variance_keur?: number;
  utilization_percent?: number;
}

export interface RoadmapFeature {
  id: string;
  roadmap_id: string;
  budget_line_id: string;
  budget_line_name: string;
  budget_category_id?: string;
  budget_category_name?: string;
  name: string;
  description?: string;
  priority: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  total_effort_days: number;
  total_budget_keur: number;
  year_allocations: YearAllocationResponse[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetCategorySummary {
  budget_category_id: string;
  category_name: string;
  allocated_keur?: number;
  planned_keur: number;
  variance_keur?: number;
  utilization_percent?: number;
  status: 'balanced' | 'under_planned' | 'over_budget' | 'no_budget';
  feature_count: number;
}

export interface BudgetLineSummary {
  budget_line_id: string;
  budget_line_name: string;
  allocated_keur?: number;
  planned_keur: number;
  variance_keur?: number;
  utilization_percent?: number;
  status: 'balanced' | 'under_planned' | 'over_budget' | 'no_budget';
  feature_count: number;
  categories: BudgetCategorySummary[];
}

export interface YearBudgetSummary {
  year: number;
  has_budget: boolean;
  fiscal_year_id?: string;
  budget_version_id?: string;
  budget_version_name?: string;
  total_allocated_keur?: number;
  total_planned_keur: number;
  overall_status?: 'balanced' | 'under_planned' | 'over_budget';
  budget_lines: BudgetLineSummary[];
  note?: string;
}

export interface Roadmap {
  id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
  features: RoadmapFeature[];
  budget_summary: Record<number, YearBudgetSummary>;
}

export interface RoadmapListItem {
  id: string;
  product_id: string;
  product_name: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  feature_count: number;
  total_budget_keur: number;
  years_covered: number[];
  created_at: string;
  updated_at: string;
}

export interface RoadmapCreateRequest {
  product_id: string;
  name: string;
  description?: string;
}

export interface RoadmapUpdateRequest {
  name?: string;
  description?: string;
}

export interface FeatureCreateRequest {
  budget_line_id: string;
  budget_category_id?: string;
  name: string;
  description?: string;
  priority?: number;
  year_allocations: Array<{ year: number; budget_keur: number }>;
}

export interface FeatureUpdateRequest {
  name?: string;
  description?: string;
  budget_line_id?: string;
  budget_category_id?: string;
  priority?: number;
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  year_allocations?: Array<{ year: number; budget_keur: number }>;
}

export interface BudgetCalculationResponse {
  effort_days: number;
  budget_keur: number;
  calculation: {
    year: number;
    formula: string;
  };
}

export interface BudgetLineOption {
  budget_line_id: string;
  budget_line_name: string;
  budget_line_code: string;
  categories: Array<{
    budget_category_id: string;
    budget_category_name: string;
    budget_category_code: string;
  }>;
  allocations_by_year: Record<number, {
    fiscal_year_id: string;
    budget_version_id: string;
    budget_version_name: string;
    is_active: boolean;
    allocated_keur: number;
  }>;
}

export interface FeatureCreateResponse {
  feature: RoadmapFeature;
  budget_alerts: BudgetAlert[];
}

// ============================================
// Roadmap Management API
// ============================================

export const getRoadmaps = async (params?: {
  product_id?: string;
  status?: string;
}) => {
  const response = await axios.get(`${API_BASE_URL}/roadmaps`, { params });
  return response.data;
};

export const getRoadmap = async (roadmapId: string): Promise<Roadmap> => {
  const response = await axios.get(`${API_BASE_URL}/roadmaps/${roadmapId}`);
  return response.data;
};

export const createRoadmap = async (data: RoadmapCreateRequest): Promise<Roadmap> => {
  const response = await axios.post(`${API_BASE_URL}/roadmaps`, data);
  return response.data;
};

export const updateRoadmap = async (
  roadmapId: string,
  data: RoadmapUpdateRequest
): Promise<Roadmap> => {
  const response = await axios.put(`${API_BASE_URL}/roadmaps/${roadmapId}`, data);
  return response.data;
};

export const activateRoadmap = async (roadmapId: string) => {
  const response = await axios.post(`${API_BASE_URL}/roadmaps/${roadmapId}/activate`);
  return response.data;
};

export const archiveRoadmap = async (roadmapId: string) => {
  const response = await axios.post(`${API_BASE_URL}/roadmaps/${roadmapId}/archive`);
  return response.data;
};

export const deleteRoadmap = async (roadmapId: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/roadmaps/${roadmapId}`);
};

// ============================================
// Feature Management API
// ============================================

export const createFeature = async (
  roadmapId: string,
  data: FeatureCreateRequest
): Promise<FeatureCreateResponse> => {
  const response = await axios.post(`${API_BASE_URL}/roadmaps/${roadmapId}/features`, data);
  return response.data;
};

export const updateFeature = async (
  roadmapId: string,
  featureId: string,
  data: FeatureUpdateRequest
): Promise<FeatureCreateResponse> => {
  const response = await axios.put(
    `${API_BASE_URL}/roadmaps/${roadmapId}/features/${featureId}`,
    data
  );
  return response.data;
};

export const deleteFeature = async (roadmapId: string, featureId: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/roadmaps/${roadmapId}/features/${featureId}`);
};

// ============================================
// Budget Summary & Calculations API
// ============================================

export const getBudgetStatus = async (roadmapId: string): Promise<Record<number, YearBudgetSummary>> => {
  const response = await axios.get(`${API_BASE_URL}/roadmaps/${roadmapId}/budget-status`);
  return response.data;
};

export const getBudgetLines = async (year?: number): Promise<{ data: BudgetLineOption[] }> => {
  const params = year ? { year } : {};
  const response = await axios.get(`${API_BASE_URL}/roadmaps/budget-lines`, { params });
  return response.data;
};

export const calculateBudget = async (
  effortDays: number,
  year: number
): Promise<BudgetCalculationResponse> => {
  const response = await axios.post(`${API_BASE_URL}/roadmaps/calculate-budget`, {
    effort_days: effortDays,
    year,
  });
  return response.data;
};

export const calculateEffortDays = async (
  budgetKeur: number,
  year: number
): Promise<BudgetCalculationResponse> => {
  const response = await axios.post(`${API_BASE_URL}/roadmaps/calculate-effort`, {
    budget_keur: budgetKeur,
    year,
  });
  return response.data;
};
