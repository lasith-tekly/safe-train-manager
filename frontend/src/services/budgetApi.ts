/**
 * Budget API Helper Functions
 * 
 * Helper functions for budget-related API calls.
 */
import axios from 'axios';
import { API as API_BASE_URL } from '../config/api';

export interface FiscalYear {
  id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
}

export interface BudgetVersion {
  id: string;
  fiscal_year_id: string;
  version_name: string;
  is_active: boolean;
  created_at: string;
}

export const getFiscalYears = async (): Promise<FiscalYear[]> => {
  const response = await axios.get(`${API_BASE_URL}/budget/fiscal-years`);
  return response.data.data || response.data;
};

export const getBudgetVersions = async (fiscalYearId: string): Promise<BudgetVersion[]> => {
  const response = await axios.get(`${API_BASE_URL}/budget/versions`, {
    params: { fiscal_year_id: fiscalYearId },
  });
  return response.data.data || response.data;
};
