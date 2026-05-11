import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface FiscalYear {
  id: string;
  year: number;
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
  is_current: boolean;
  created_at: string;
  updated_at?: string;
}

export interface FiscalYearCreate {
  year: number;
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
  is_current: boolean;
}

export interface BudgetVersion {
  id: string;
  fiscal_year_id: string;
  version_number: number;
  effective_date: string;
  notes?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface BudgetVersionCreate {
  fiscal_year_id: string;
  effective_date: string;
  notes?: string;
  copy_from_version_id?: string;
}

export interface ProductInfo {
  id: string;
  name: string;
  short_code: string;
}

export interface ProductBudget {
  id: string;
  budget_version_id: string;
  product: ProductInfo;
  allocated_amount: number;
  consumed_amount: number;
  remaining_amount: number;
  utilization_percentage: number;
  budget_lines_count: number;
  created_at: string;
  updated_at?: string;
}

export interface ProductBudgetCreate {
  budget_version_id: string;
  product_id: string;
  allocated_amount: number;
}

export interface BudgetLineAllocation {
  id: string;
  product_budget_id: string;
  allocation_type: 'PERCENTAGE' | 'ABSOLUTE';
  allocation_value: number;
}

export interface BudgetCategory {
  id: string;
  budget_line_id: string;
  name: string;
  allocated_amount: number;
  consumed_amount: number;
  remaining_amount: number;
  created_at: string;
  updated_at?: string;
}

export interface BudgetLine {
  id: string;
  product_budget_id?: string;
  code: string;
  name: string;
  allocated_amount: number;
  consumed_amount: number;
  remaining_amount: number;
  is_transversal: boolean;
  is_roadmap_eligible: boolean;
  created_at: string;
  updated_at?: string;
  categories: BudgetCategory[];
  product_allocations: BudgetLineAllocation[];
}

export interface TrainBudgetLineCreate {
  code: string;
  name: string;
  allocated_amount: number;
}

export interface BudgetLineCreate {
  budget_version_id: string;
  product_id?: string;
  product_budget_id?: string;
  code: string;
  name: string;
  allocated_amount: number;
  is_transversal: boolean;
  is_roadmap_eligible?: boolean;
  product_allocations?: {
    product_budget_id: string;
    allocation_type: 'PERCENTAGE' | 'ABSOLUTE';
    allocation_value: number;
  }[];
}

export interface BudgetCategoryCreate {
  budget_line_id: string;
  name: string;
  allocated_amount: number;
}

export interface BudgetSummary {
  total_budget: number;
  total_consumed: number;
  total_remaining: number;
  utilization_percentage: number;
}

export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  changed_by: {
    id: string;
    name: string;
  };
  changed_at: string;
}

// Fiscal Year API
export const getFiscalYears = async (): Promise<FiscalYear[]> => {
  const response = await api.get('/budget/fiscal-years');
  return response.data.data;
};

export const createFiscalYear = async (data: FiscalYearCreate): Promise<FiscalYear> => {
  const { train_id, ...fiscalYearData } = data as any;
  const headers: any = {};
  if (train_id) {
    headers['X-Train-Context'] = train_id;
  }
  const response = await api.post('/budget/fiscal-years', fiscalYearData, { headers });
  return response.data;
};

export const updateFiscalYear = async (id: string, is_current: boolean): Promise<FiscalYear> => {
  const response = await api.put(`/budget/fiscal-years/${id}`, { is_current });
  return response.data;
};

// Budget Version API
export const getBudgetVersions = async (fiscal_year_id: string): Promise<BudgetVersion[]> => {
  const response = await api.get('/budget/versions', {
    params: { fiscal_year_id }
  });
  return response.data.data;
};

export const createBudgetVersion = async (data: BudgetVersionCreate): Promise<BudgetVersion> => {
  const response = await api.post('/budget/versions', data);
  return response.data;
};

export const getBudgetVersionDetail = async (version_id: string): Promise<any> => {
  const response = await api.get(`/budget/versions/${version_id}`);
  return response.data;
};

// Product Budget API
export const getProductBudgets = async (
  fiscal_year_id?: string,
  version_id?: string
): Promise<ProductBudget[]> => {
  const response = await api.get('/budget/products', {
    params: { fiscal_year_id, version_id }
  });
  return response.data.data;
};

export const createOrUpdateProductBudget = async (
  data: ProductBudgetCreate
): Promise<ProductBudget> => {
  const response = await api.post('/budget/products', data);
  return response.data;
};

export const getProductBudgetDetail = async (product_budget_id: string): Promise<any> => {
  const response = await api.get(`/budget/products/${product_budget_id}`);
  return response.data;
};

// Budget Line API
export const createBudgetLine = async (data: BudgetLineCreate): Promise<BudgetLine> => {
  const response = await api.post('/budget/lines', data);
  return response.data;
};

export const updateBudgetLine = async (
  id: string,
  data: { name?: string; allocated_amount?: number; is_transversal?: boolean; is_roadmap_eligible?: boolean }
): Promise<BudgetLine> => {
  const response = await api.put(`/budget/lines/${id}`, data);
  return response.data;
};

export const deleteBudgetLine = async (id: string): Promise<void> => {
  await api.delete(`/budget/lines/${id}`);
};

// Train-Level Budget Line API
export const getTrainBudgetLines = async (versionId: string): Promise<BudgetLine[]> => {
  const response = await api.get(`/budget/versions/${versionId}/train-lines`);
  return response.data.data;
};

export const createTrainBudgetLine = async (
  versionId: string,
  data: TrainBudgetLineCreate
): Promise<BudgetLine> => {
  const response = await api.post(`/budget/versions/${versionId}/train-lines`, data);
  return response.data;
};

export const updateTrainBudgetLine = async (
  id: string,
  data: { name?: string; allocated_amount?: number }
): Promise<BudgetLine> => {
  const response = await api.put(`/budget/train-lines/${id}`, data);
  return response.data;
};

export const deleteTrainBudgetLine = async (id: string): Promise<void> => {
  await api.delete(`/budget/train-lines/${id}`);
};

// Budget Category API
export const createBudgetCategory = async (data: BudgetCategoryCreate): Promise<BudgetCategory> => {
  const response = await api.post('/budget/categories', data);
  return response.data;
};

export const updateBudgetCategory = async (
  id: string,
  data: { name?: string; allocated_amount?: number }
): Promise<BudgetCategory> => {
  const response = await api.put(`/budget/categories/${id}`, data);
  return response.data;
};

export const deleteBudgetCategory = async (id: string): Promise<void> => {
  await api.delete(`/budget/categories/${id}`);
};

// Product Budget API
export interface ProductBudgetCreate {
  budget_version_id: string;
  product_id: string;
  allocated_amount: number;
}

export const createProductBudget = async (data: ProductBudgetCreate): Promise<ProductBudget> => {
  const response = await api.post('/budget/products', data);
  return response.data;
};

export const updateProductBudget = async (
  id: string,
  data: { allocated_amount: number }
): Promise<ProductBudget> => {
  const response = await api.put(`/budget/products/${id}`, data);
  return response.data;
};

export const deleteProductBudget = async (id: string): Promise<void> => {
  await api.delete(`/budget/products/${id}`);
};

// Summary & Reports API
export const getBudgetSummary = async (
  fiscal_year_id?: string,
  version_id?: string
): Promise<any> => {
  const response = await api.get('/budget/summary', {
    params: { fiscal_year_id, version_id }
  });
  return response.data;
};

// Audit Log API
export const getAuditLog = async (params: {
  entity_type?: string;
  entity_id?: string;
  start_date?: string;
  end_date?: string;
  changed_by?: string;
  page?: number;
  page_size?: number;
}): Promise<{ data: AuditLogEntry[]; pagination: any }> => {
  const response = await api.get('/budget/audit-log', { params });
  return response.data;
};
