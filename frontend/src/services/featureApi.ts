/**
 * Feature API Service - Roadmap V4
 * 
 * API calls for effort-centric roadmap planning
 */
import axios from 'axios';
import {
  RoadmapFeature,
  FeatureListResponse,
  CreateFeatureRequest,
  UpdateFeatureRequest,
  CreateJiraRecordRequest,
  UpdateJiraRecordRequest,
  JiraRecord,
  CalculateSizingRequest,
  CalculateSizingResponse,
  BudgetValidationResult,
  CapacityValidationResult,
  TrainConfig,
  FeatureFilters
} from '../types/roadmap_v4';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Feature CRUD
export const createFeature = async (data: CreateFeatureRequest): Promise<RoadmapFeature> => {
  const response = await axios.post(`${API_BASE_URL}/features`, data);
  return response.data;
};

export const listFeatures = async (filters?: FeatureFilters): Promise<FeatureListResponse> => {
  const response = await axios.get(`${API_BASE_URL}/features`, { params: filters });
  return response.data;
};

export const getFeature = async (featureId: string, includeJira: boolean = true): Promise<RoadmapFeature> => {
  const response = await axios.get(`${API_BASE_URL}/features/${featureId}`, {
    params: { include_jira: includeJira }
  });
  return response.data;
};

export const updateFeature = async (featureId: string, data: UpdateFeatureRequest): Promise<RoadmapFeature> => {
  const response = await axios.put(`${API_BASE_URL}/features/${featureId}`, data);
  return response.data;
};

export const deleteFeature = async (featureId: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/features/${featureId}`);
};

// JIRA Record CRUD
export const createJiraRecord = async (featureId: string, data: CreateJiraRecordRequest): Promise<JiraRecord> => {
  const response = await axios.post(`${API_BASE_URL}/features/${featureId}/jira-records`, data);
  return response.data;
};

export const updateJiraRecord = async (jiraId: string, data: UpdateJiraRecordRequest): Promise<JiraRecord> => {
  const response = await axios.put(`${API_BASE_URL}/features/jira-records/${jiraId}`, data);
  return response.data;
};

export const deleteJiraRecord = async (jiraId: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/features/jira-records/${jiraId}`);
};

// Calculations
export const calculateSizing = async (data: CalculateSizingRequest): Promise<CalculateSizingResponse> => {
  const response = await axios.post(`${API_BASE_URL}/features/calculate`, data);
  return response.data;
};

// Validations
export const validateBudget = async (
  productId: string,
  budgetLineId: string,
  year: number,
  categoryId?: string
): Promise<{
  product_validation: BudgetValidationResult | null;
  budget_line_validation: BudgetValidationResult | null;
  category_validation: BudgetValidationResult | null;
}> => {
  const response = await axios.get(`${API_BASE_URL}/features/validation/budget`, {
    params: {
      product_id: productId,
      budget_line_id: budgetLineId,
      year,
      category_id: categoryId
    }
  });
  return response.data;
};

export const validateCapacity = async (
  teamId: string,
  year: number,
  quarter: number
): Promise<CapacityValidationResult> => {
  const response = await axios.get(`${API_BASE_URL}/features/validation/capacity`, {
    params: { team_id: teamId, year, quarter }
  });
  return response.data;
};

export const validateFeature = async (
  featureId: string,
  year: number,
  quarter: number
): Promise<any> => {
  const response = await axios.get(`${API_BASE_URL}/features/validation/feature/${featureId}`, {
    params: { year, quarter }
  });
  return response.data;
};

// Train Configuration
export const getTrainConfig = async (): Promise<TrainConfig> => {
  const response = await axios.get(`${API_BASE_URL}/features/settings/train-config`);
  return response.data;
};

export const updateTrainConfig = async (data: Partial<TrainConfig>): Promise<TrainConfig> => {
  const response = await axios.put(`${API_BASE_URL}/features/settings/train-config`, data);
  return response.data;
};
