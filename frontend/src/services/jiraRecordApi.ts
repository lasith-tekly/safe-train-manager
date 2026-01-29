/**
 * JIRA Record API Service
 * 
 * API calls for managing JIRA records and their quarterly allocations
 */
import axios from 'axios';
import {
  JiraRecord,
  CreateJiraRecordRequest,
  UpdateJiraRecordRequest,
  QuarterlyAllocationInput
} from '../types/roadmap_v4';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export interface JiraRecordListResponse {
  data: JiraRecord[];
  total: number;
}

/**
 * Get all JIRA records for a feature
 */
export const listJiraRecords = async (featureId: string): Promise<JiraRecord[]> => {
  const response = await axios.get<JiraRecordListResponse>(
    `${API_BASE_URL}/features/${featureId}/jira-records`
  );
  return response.data.data;
};

/**
 * Get a single JIRA record
 */
export const getJiraRecord = async (jiraRecordId: string): Promise<JiraRecord> => {
  const response = await axios.get<JiraRecord>(
    `${API_BASE_URL}/jira-records/${jiraRecordId}`
  );
  return response.data;
};

/**
 * Create a new JIRA record
 */
export const createJiraRecord = async (
  featureId: string,
  data: CreateJiraRecordRequest
): Promise<JiraRecord> => {
  const response = await axios.post<JiraRecord>(
    `${API_BASE_URL}/features/${featureId}/jira-records`,
    data
  );
  return response.data;
};

/**
 * Update a JIRA record
 */
export const updateJiraRecord = async (
  jiraRecordId: string,
  data: UpdateJiraRecordRequest
): Promise<JiraRecord> => {
  const response = await axios.put<JiraRecord>(
    `${API_BASE_URL}/jira-records/${jiraRecordId}`,
    data
  );
  return response.data;
};

/**
 * Delete a JIRA record
 */
export const deleteJiraRecord = async (jiraRecordId: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/jira-records/${jiraRecordId}`);
};

/**
 * Update quarterly allocations for a JIRA record
 */
export const updateJiraAllocations = async (
  jiraRecordId: string,
  allocations: QuarterlyAllocationInput[]
): Promise<JiraRecord> => {
  const response = await axios.put<JiraRecord>(
    `${API_BASE_URL}/jira-records/${jiraRecordId}/allocations`,
    { allocations }
  );
  return response.data;
};
