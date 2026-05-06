import axios from 'axios';
import type {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductListResponse,
  BudgetVersion,
  BudgetVersionCreate,
  BudgetVersionUpdate,
  BudgetVersionListResponse,
  Team,
  TeamCreate,
  TeamUpdate,
  TeamListResponse,
  TeamCapacity,
  TeamCapacityUpdate,
  Feature,
  FeatureUpdate,
  FeatureListResponse,
  BulkFeatureCreate,
  BulkFeatureResponse,
  JiraConfig,
  JiraConfigCreate,
  JiraTestResponse,
  JiraSearchRequest,
  JiraSearchResponse,
  TeamMember,
  TeamMemberCreate,
  TeamMemberUpdate,
  MemberAvailability,
  MemberAvailabilityCreate,
  MemberAvailabilityUpdate,
  MemberCapacity,
  DashboardSummary,
  GlobalSettings,
  GlobalSettingsUpdate,
  PI,
  PICreate,
  PIUpdate,
  PIListResponse,
  PIGenerateRequest,
  Iteration,
  IterationCreate,
  IterationUpdate,
  Holiday,
  HolidayCreate,
  HolidayUpdate,
  HolidayListResponse,
  HolidayImportRequest,
  MemberLeave,
  // Capacity Dashboard types
  CapacitySummaryResponse,
  ProductCapacityResponse,
  SiteCapacityResponse,
  TeamCapacityResponse,
  AllocationCapacityResponse,
  MemberLeaveCreate,
  CapacitySummary,
  TeamIterationCapacity,
  CapacityOverrideRequest,
  // Team PI Capacity Detail types
  TeamPICapacityDetail,
  IterationCapacity,
  CascadePreviewResponse,
  CascadeApplyRequest,
  CapacityAllocationCategory,
  CapacityAllocationCategoryCreate,
  CapacityAllocationCategoryUpdate,
  CapacityAllocationSummary,
  ComponentHat,
  ComponentHatCreate,
  ComponentHatUpdate,
  IterationMemberLeave,
  IterationMemberLeaveCreate,
  IterationMemberLeaveUpdate,
  SiteHoliday,
  SiteHolidayCreate,
  SiteHolidayUpdate,
  MemberPIAllocation,
  MemberPIAllocationCreate,
  MemberPIAllocationListResponse,
  MemberIterationProductivity,
  MemberIterationProductivityCreate,
  TeamCapacitySummary,
  TrainDashboardOverview,
  TeamDetailExpanded
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Products API
export const getProducts = async (
  status?: string,
  search?: string
): Promise<ProductListResponse> => {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (search) params.search = search;
  
  const response = await api.get<ProductListResponse>('/products', { params });
  return response.data;
};

export const getProduct = async (id: string): Promise<Product> => {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
};

export const createProduct = async (data: ProductCreate): Promise<Product> => {
  const response = await api.post<Product>('/products', data);
  return response.data;
};

export const updateProduct = async (
  id: string,
  data: ProductUpdate
): Promise<Product> => {
  const response = await api.put<Product>(`/products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`);
};

// Budgets API
export const getBudgetVersions = async (
  productId: string,
  year?: number
): Promise<BudgetVersionListResponse> => {
  const params: Record<string, string | number> = { product_id: productId };
  if (year) params.year = year;
  
  const response = await api.get<BudgetVersionListResponse>('/budgets/versions', { params });
  return response.data;
};

export const getBudgetVersion = async (id: string): Promise<BudgetVersion> => {
  const response = await api.get<BudgetVersion>(`/budgets/versions/${id}`);
  return response.data;
};

export const createBudgetVersion = async (data: BudgetVersionCreate): Promise<BudgetVersion> => {
  const response = await api.post<BudgetVersion>('/budgets/versions', data);
  return response.data;
};

export const updateBudgetVersion = async (
  id: string,
  data: BudgetVersionUpdate
): Promise<BudgetVersion> => {
  const response = await api.put<BudgetVersion>(`/budgets/versions/${id}`, data);
  return response.data;
};

export const copyBudgetVersion = async (id: string): Promise<BudgetVersion> => {
  const response = await api.post<BudgetVersion>(`/budgets/versions/${id}/copy`);
  return response.data;
};

export const activateBudgetVersion = async (id: string): Promise<BudgetVersion> => {
  const response = await api.post<BudgetVersion>(`/budgets/versions/${id}/activate`);
  return response.data;
};

export const lockBudgetVersion = async (id: string): Promise<BudgetVersion> => {
  const response = await api.post<BudgetVersion>(`/budgets/versions/${id}/lock`);
  return response.data;
};

export const deleteBudgetVersion = async (id: string): Promise<void> => {
  await api.delete(`/budgets/versions/${id}`);
};

// Teams API
export const getTeams = async (
  status?: string,
  search?: string,
  year?: number,
  pi_id?: string
): Promise<TeamListResponse> => {
  const params: Record<string, string | number> = {};
  if (status) params.status = status;
  if (search) params.search = search;
  if (year) params.year = year;
  if (pi_id) params.pi_id = pi_id;
  
  const response = await api.get<TeamListResponse>('/teams', { params });
  return response.data;
};

export const getTeam = async (id: string, year?: number): Promise<Team> => {
  const params: Record<string, number> = {};
  if (year) params.year = year;
  
  const response = await api.get<Team>(`/teams/${id}`, { params });
  return response.data;
};

export const createTeam = async (data: TeamCreate): Promise<Team> => {
  const response = await api.post<Team>('/teams', data);
  return response.data;
};

export const updateTeam = async (id: string, data: TeamUpdate): Promise<Team> => {
  const response = await api.put<Team>(`/teams/${id}`, data);
  return response.data;
};

export const deleteTeam = async (id: string): Promise<void> => {
  await api.delete(`/teams/${id}`);
};

export const getTeamCapacity = async (id: string, year: number): Promise<TeamCapacity> => {
  const response = await api.get<TeamCapacity>(`/teams/${id}/capacity/${year}`);
  return response.data;
};

export const updateTeamCapacity = async (
  id: string,
  year: number,
  data: TeamCapacityUpdate
): Promise<TeamCapacity> => {
  const response = await api.put<TeamCapacity>(`/teams/${id}/capacity/${year}`, data);
  return response.data;
};

// Features API
export const getFeatures = async (params: {
  product_id?: string;
  budget_line_id?: string;
  team_id?: string;
  year?: number;
  quarter?: number;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<FeatureListResponse> => {
  const response = await api.get<FeatureListResponse>('/features', { params });
  return response.data;
};

export const getFeature = async (id: string): Promise<Feature> => {
  const response = await api.get<Feature>(`/features/${id}`);
  return response.data;
};

export const createFeatures = async (data: BulkFeatureCreate): Promise<BulkFeatureResponse> => {
  const response = await api.post<BulkFeatureResponse>('/features', data);
  return response.data;
};

export const updateFeature = async (id: string, data: FeatureUpdate): Promise<Feature> => {
  const response = await api.put<Feature>(`/features/${id}`, data);
  return response.data;
};

export const deleteFeature = async (id: string): Promise<void> => {
  await api.delete(`/features/${id}`);
};

export const syncFeature = async (id: string): Promise<Feature> => {
  const response = await api.post<Feature>(`/features/${id}/sync`);
  return response.data;
};

export const syncAllFeatures = async (): Promise<BulkFeatureResponse> => {
  const response = await api.post<BulkFeatureResponse>('/features/sync-all');
  return response.data;
};

// JIRA API
export const getJiraConfig = async (): Promise<JiraConfig> => {
  const response = await api.get<JiraConfig>('/jira/config');
  return response.data;
};

export const saveJiraConfig = async (data: JiraConfigCreate): Promise<JiraConfig> => {
  const response = await api.put<JiraConfig>('/jira/config', data);
  return response.data;
};

export const testJiraConnection = async (): Promise<JiraTestResponse> => {
  const response = await api.post<JiraTestResponse>('/jira/test');
  return response.data;
};

export const getJiraProjects = async (): Promise<{ projects: string[] }> => {
  const response = await api.get<{ projects: string[] }>('/jira/projects');
  return response.data;
};

export const searchJiraIssues = async (data: JiraSearchRequest): Promise<JiraSearchResponse> => {
  const response = await api.post<JiraSearchResponse>('/jira/search', data);
  return response.data;
};

// Manual Feature Creation
export interface ManualFeatureCreate {
  title: string;
  description?: string;
  product_id?: string;
  budget_line_id?: string;
  team_id?: string;
  quarter?: number;
  year?: number;
  story_points?: number;
  cost?: number;
  internal_status?: string;
}

export const createManualFeature = async (data: ManualFeatureCreate): Promise<Feature> => {
  const response = await api.post<Feature>('/features/manual', data);
  return response.data;
};

// Team Members API
export const getTeamMembers = async (teamId: string, piId?: string, status?: string): Promise<TeamMember[]> => {
  const params: Record<string, string> = {};
  if (piId) params.pi_id = piId;
  if (status) params.status = status;
  const response = await api.get<TeamMember[]>(`/teams/${teamId}/members`, { params });
  return response.data;
};

export const getTeamMember = async (teamId: string, memberId: string): Promise<TeamMember> => {
  const response = await api.get<TeamMember>(`/teams/${teamId}/members/${memberId}`);
  return response.data;
};

export const createTeamMember = async (teamId: string, data: TeamMemberCreate): Promise<TeamMember> => {
  const response = await api.post<TeamMember>(`/teams/${teamId}/members`, data);
  return response.data;
};

export const updateTeamMember = async (
  teamId: string,
  memberId: string,
  data: TeamMemberUpdate
): Promise<TeamMember> => {
  const response = await api.put<TeamMember>(`/teams/${teamId}/members/${memberId}`, data);
  return response.data;
};

export const deleteTeamMember = async (teamId: string, memberId: string): Promise<void> => {
  await api.delete(`/teams/${teamId}/members/${memberId}`);
};

export const getMemberAvailability = async (
  teamId: string,
  memberId: string,
  year: number
): Promise<MemberAvailability[]> => {
  const response = await api.get<MemberAvailability[]>(
    `/teams/${teamId}/members/${memberId}/availability/${year}`
  );
  return response.data;
};

export const updateMemberAvailability = async (
  teamId: string,
  memberId: string,
  year: number,
  quarter: number,
  data: MemberAvailabilityUpdate
): Promise<MemberAvailability> => {
  const response = await api.put<MemberAvailability>(
    `/teams/${teamId}/members/${memberId}/availability/${year}/${quarter}`,
    data
  );
  return response.data;
};

export const setMemberAvailability = async (
  teamId: string,
  memberId: string,
  data: MemberAvailabilityCreate
): Promise<MemberAvailability> => {
  const response = await api.post<MemberAvailability>(
    `/teams/${teamId}/members/${memberId}/availability`,
    data
  );
  return response.data;
};

export const getMemberCapacity = async (
  teamId: string,
  memberId: string,
  year: number,
  quarter: number
): Promise<MemberCapacity> => {
  const response = await api.get<MemberCapacity>(
    `/teams/${teamId}/members/${memberId}/capacity/${year}/${quarter}`
  );
  return response.data;
};

// Dashboard API
export const getDashboardSummary = async (year?: number): Promise<DashboardSummary> => {
  const params: Record<string, number> = {};
  if (year) params.year = year;
  const response = await api.get<DashboardSummary>('/dashboard/summary', { params });
  return response.data;
};

// Global Settings API
export const getGlobalSettings = async (year: number): Promise<GlobalSettings> => {
  const response = await api.get<GlobalSettings>(`/settings/global/${year}`);
  return response.data;
};

export const updateGlobalSettings = async (
  year: number,
  data: GlobalSettingsUpdate
): Promise<GlobalSettings> => {
  const response = await api.put<GlobalSettings>(`/settings/global/${year}`, data);
  return response.data;
};

// PI (Program Increment) API
export const getPIs = async (year?: number, status?: string): Promise<PIListResponse> => {
  const params: Record<string, string | number> = {};
  if (year !== undefined) params.year = year;
  if (status) params.status = status;
  const response = await api.get<PIListResponse>('/pis', { params });
  return response.data;
};

export const getPI = async (id: string): Promise<PI> => {
  const response = await api.get<PI>(`/pis/${id}`);
  return response.data;
};

export const createPI = async (data: PICreate): Promise<PI> => {
  const response = await api.post<PI>('/pis', data);
  return response.data;
};

export const updatePI = async (id: string, data: PIUpdate): Promise<PI> => {
  const response = await api.put<PI>(`/pis/${id}`, data);
  return response.data;
};

export const deletePI = async (id: string): Promise<void> => {
  await api.delete(`/pis/${id}`);
};

export const generatePIs = async (data: PIGenerateRequest): Promise<PIListResponse> => {
  const response = await api.post<PIListResponse>('/pis/generate', data);
  return response.data;
};

export const addIteration = async (piId: string, data: IterationCreate): Promise<Iteration> => {
  const response = await api.post<Iteration>(`/pis/${piId}/iterations`, data);
  return response.data;
};

export const updateIteration = async (id: string, data: IterationUpdate): Promise<Iteration> => {
  const response = await api.put<Iteration>(`/pis/iterations/${id}`, data);
  return response.data;
};

export const deleteIteration = async (id: string): Promise<void> => {
  await api.delete(`/pis/iterations/${id}`);
};

export const recalculatePI = async (piId: string): Promise<PI> => {
  const response = await api.post<PI>(`/pis/${piId}/recalculate`);
  return response.data;
};

export const commitPI = async (piId: string): Promise<PI> => {
  const response = await api.post<PI>(`/pis/${piId}/commit`);
  return response.data;
};

export const uncommitPI = async (piId: string): Promise<PI> => {
  const response = await api.post<PI>(`/pis/${piId}/uncommit`);
  return response.data;
};

export const commitYear = async (year: number): Promise<PIListResponse> => {
  const response = await api.post<PIListResponse>(`/pis/year/${year}/commit`);
  return response.data;
};

export const uncommitYear = async (year: number): Promise<PIListResponse> => {
  const response = await api.post<PIListResponse>(`/pis/year/${year}/uncommit`);
  return response.data;
};

export const getCascadePreview = async (iterationId: string, newDurationWeeks: number): Promise<CascadePreviewResponse> => {
  const response = await api.get<CascadePreviewResponse>(`/pis/iterations/${iterationId}/cascade-preview`, {
    params: { new_duration_weeks: newDurationWeeks }
  });
  return response.data;
};

export const applyCascade = async (data: CascadeApplyRequest): Promise<PI> => {
  const response = await api.post<PI>('/pis/cascade-apply', data);
  return response.data;
};

// Holiday API
export const getHolidays = async (year: number, countryId?: string, teamId?: string): Promise<HolidayListResponse> => {
  const params: Record<string, string | number> = { year };
  if (countryId) params.country_id = countryId;
  if (teamId) params.team_id = teamId;
  const response = await api.get<HolidayListResponse>('/holidays', { params });
  return response.data;
};

export const createHoliday = async (data: HolidayCreate): Promise<Holiday> => {
  const response = await api.post<Holiday>('/holidays', data);
  return response.data;
};

export const updateHoliday = async (id: string, data: HolidayUpdate): Promise<Holiday> => {
  const response = await api.put<Holiday>(`/holidays/${id}`, data);
  return response.data;
};

export const deleteHoliday = async (id: string): Promise<void> => {
  await api.delete(`/holidays/${id}`);
};

export const importHolidays = async (data: HolidayImportRequest): Promise<HolidayListResponse> => {
  const response = await api.post<HolidayListResponse>('/holidays/import', data);
  return response.data;
};

export const getHolidayPresets = async (): Promise<{ presets: string[] }> => {
  const response = await api.get<{ presets: string[] }>('/holidays/presets/list');
  return response.data;
};

// Member Leave API
export const getMemberLeaves = async (memberId: string, year?: number): Promise<MemberLeave[]> => {
  const params: Record<string, number> = {};
  if (year) params.year = year;
  const response = await api.get<MemberLeave[]>(`/members/${memberId}/leaves`, { params });
  return response.data;
};

export const createMemberLeave = async (memberId: string, data: MemberLeaveCreate): Promise<MemberLeave> => {
  const response = await api.post<MemberLeave>(`/members/${memberId}/leaves`, data);
  return response.data;
};

export const updateMemberLeave = async (
  memberId: string,
  leaveId: string,
  data: MemberLeaveCreate
): Promise<MemberLeave> => {
  const response = await api.put<MemberLeave>(`/members/${memberId}/leaves/${leaveId}`, data);
  return response.data;
};

export const deleteMemberLeave = async (memberId: string, leaveId: string): Promise<void> => {
  await api.delete(`/members/${memberId}/leaves/${leaveId}`);
};

// Iteration Capacity API
export const getCapacitySummary = async (year: number, piId?: string): Promise<CapacitySummary> => {
  const params: Record<string, string | number> = { year };
  if (piId) params.pi_id = piId;
  const response = await api.get<CapacitySummary>('/capacity/summary', { params });
  return response.data;
};

export const getTeamIterationCapacity = async (
  teamId: string,
  piId: string
): Promise<TeamIterationCapacity> => {
  const response = await api.get<TeamIterationCapacity>(
    `/capacity/teams/${teamId}/iterations`,
    { params: { pi_id: piId } }
  );
  return response.data;
};

export const calculateTeamCapacity = async (teamId: string, piId?: string): Promise<void> => {
  const params: Record<string, string> = {};
  if (piId) params.pi_id = piId;
  await api.post(`/capacity/teams/${teamId}/calculate`, null, { params });
};

export const overrideIterationCapacity = async (
  teamId: string,
  iterationId: string,
  data: CapacityOverrideRequest
): Promise<IterationCapacity> => {
  const response = await api.put<IterationCapacity>(
    `/capacity/teams/${teamId}/iterations/${iterationId}`,
    data
  );
  return response.data;
};

export const resetCapacityOverride = async (teamId: string, iterationId: string): Promise<void> => {
  await api.delete(`/capacity/teams/${teamId}/iterations/${iterationId}/override`);
};

// ============================================
// Country & Site APIs
// ============================================

export interface Country {
  id: string;
  code: string;
  name: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  site_count: number;
  team_count: number;
}

export interface CountryCreate {
  code: string;
  name: string;
  timezone?: string;
  is_active?: boolean;
}

export interface CountryUpdate {
  code?: string;
  name?: string;
  timezone?: string;
  is_active?: boolean;
}

export interface Site {
  id: string;
  code: string;
  name: string;
  country_id: string;
  address: string | null;
  unit_cost_keur: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  team_count: number;
  country_name: string | null;
  country_code: string | null;
}

export interface SiteCreate {
  code: string;
  name: string;
  country_id: string;
  address?: string;
  unit_cost_keur?: number;
  is_active?: boolean;
}

export interface SiteUpdate {
  code?: string;
  name?: string;
  country_id?: string;
  address?: string;
  unit_cost_keur?: number;
  is_active?: boolean;
}

// Countries
export const getCountries = async (includeInactive = false): Promise<Country[]> => {
  const response = await api.get<Country[]>('/countries', {
    params: { include_inactive: includeInactive }
  });
  return response.data;
};

export const getCountry = async (id: string): Promise<Country> => {
  const response = await api.get<Country>(`/countries/${id}`);
  return response.data;
};

export const createCountry = async (data: CountryCreate): Promise<Country> => {
  const response = await api.post<Country>('/countries', data);
  return response.data;
};

export const updateCountry = async (id: string, data: CountryUpdate): Promise<Country> => {
  const response = await api.put<Country>(`/countries/${id}`, data);
  return response.data;
};

export const deleteCountry = async (id: string): Promise<void> => {
  await api.delete(`/countries/${id}`);
};

export const getCountrySites = async (countryId: string, includeInactive = false): Promise<Site[]> => {
  const response = await api.get<Site[]>(`/countries/${countryId}/sites`, {
    params: { include_inactive: includeInactive }
  });
  return response.data;
};

// Sites
export const getSites = async (countryId?: string, includeInactive = false): Promise<Site[]> => {
  const params: Record<string, unknown> = { include_inactive: includeInactive };
  if (countryId) params.country_id = countryId;
  const response = await api.get<Site[]>('/sites', { params });
  return response.data;
};

export const getSite = async (id: string): Promise<Site> => {
  const response = await api.get<Site>(`/sites/${id}`);
  return response.data;
};

export const createSite = async (data: SiteCreate): Promise<Site> => {
  const response = await api.post<Site>('/sites', data);
  return response.data;
};

export const updateSite = async (id: string, data: SiteUpdate): Promise<Site> => {
  const response = await api.put<Site>(`/sites/${id}`, data);
  return response.data;
};

export const deleteSite = async (id: string): Promise<void> => {
  await api.delete(`/sites/${id}`);
};

// Capacity Allocation API
export const getCapacityAllocations = async (year: number): Promise<CapacityAllocationCategory[]> => {
  const response = await api.get<CapacityAllocationCategory[]>(`/capacity-allocations/${year}`);
  return response.data;
};

export const getCapacityAllocationSummary = async (year: number): Promise<CapacityAllocationSummary> => {
  const response = await api.get<CapacityAllocationSummary>(`/capacity-allocations/${year}/summary`);
  return response.data;
};

export const createCapacityAllocation = async (data: CapacityAllocationCategoryCreate): Promise<CapacityAllocationCategory> => {
  const response = await api.post<CapacityAllocationCategory>('/capacity-allocations', data);
  return response.data;
};

export const updateCapacityAllocation = async (id: string, data: CapacityAllocationCategoryUpdate): Promise<CapacityAllocationCategory> => {
  const response = await api.put<CapacityAllocationCategory>(`/capacity-allocations/${id}`, data);
  return response.data;
};

export const deleteCapacityAllocation = async (id: string, hard: boolean = false): Promise<void> => {
  await api.delete(`/capacity-allocations/${id}`, { params: { hard } });
};

// Component Hats API
export const getComponentHats = async (): Promise<{ data: ComponentHat[]; total: number }> => {
  const response = await api.get<{ data: ComponentHat[]; total: number }>('/component-hats');
  return response.data;
};

export const createComponentHat = async (data: ComponentHatCreate): Promise<ComponentHat> => {
  const response = await api.post<ComponentHat>('/component-hats', data);
  return response.data;
};

export const updateComponentHat = async (id: string, data: ComponentHatUpdate): Promise<ComponentHat> => {
  const response = await api.put<ComponentHat>(`/component-hats/${id}`, data);
  return response.data;
};

export const deleteComponentHat = async (id: string): Promise<void> => {
  await api.delete(`/component-hats/${id}`);
};

// Iteration Member Leave API
export const getIterationLeave = async (iterationId: string): Promise<{ data: IterationMemberLeave[]; total: number }> => {
  const response = await api.get<{ data: IterationMemberLeave[]; total: number }>(`/iterations/${iterationId}/leave`);
  return response.data;
};

export const getTeamIterationLeave = async (teamId: string, iterationId: string): Promise<{ data: IterationMemberLeave[]; total: number }> => {
  const response = await api.get<{ data: IterationMemberLeave[]; total: number }>(`/teams/${teamId}/iterations/${iterationId}/leave`);
  return response.data;
};

export const getMemberLeaveByIteration = async (memberId: string, iterationId?: string): Promise<{ data: IterationMemberLeave[]; total: number }> => {
  const params = iterationId ? { iteration_id: iterationId } : {};
  const response = await api.get<{ data: IterationMemberLeave[]; total: number }>(`/members/${memberId}/leave`, { params });
  return response.data;
};

export const createIterationMemberLeave = async (memberId: string, data: IterationMemberLeaveCreate): Promise<IterationMemberLeave> => {
  const response = await api.post<IterationMemberLeave>(`/members/${memberId}/leave`, data);
  return response.data;
};

export const updateIterationMemberLeave = async (leaveId: string, data: IterationMemberLeaveUpdate): Promise<IterationMemberLeave> => {
  const response = await api.put<IterationMemberLeave>(`/leave/${leaveId}`, data);
  return response.data;
};

export const deleteIterationMemberLeave = async (leaveId: string): Promise<void> => {
  await api.delete(`/leave/${leaveId}`);
};

// Site Holidays API
export const getSiteHolidays = async (siteId: string, year?: number): Promise<{ data: SiteHoliday[]; total: number }> => {
  const params = year ? { year } : {};
  const response = await api.get<{ data: SiteHoliday[]; total: number }>(`/sites/${siteId}/holidays`, { params });
  return response.data;
};

export const createSiteHoliday = async (siteId: string, data: SiteHolidayCreate): Promise<SiteHoliday> => {
  const response = await api.post<SiteHoliday>(`/sites/${siteId}/holidays`, data);
  return response.data;
};

export const updateSiteHoliday = async (holidayId: string, data: SiteHolidayUpdate): Promise<SiteHoliday> => {
  const response = await api.put<SiteHoliday>(`/site-holidays/${holidayId}`, data);
  return response.data;
};

export const deleteSiteHoliday = async (holidayId: string): Promise<void> => {
  await api.delete(`/site-holidays/${holidayId}`);
};

// Member PI Allocation API
export const getTeamPIAllocations = async (teamId: string, piId: string): Promise<MemberPIAllocationListResponse> => {
  const response = await api.get<MemberPIAllocationListResponse>(`/teams/${teamId}/pi/${piId}/allocations`);
  return response.data;
};

export const getMemberPIAllocations = async (memberId: string): Promise<{ data: MemberPIAllocation[]; total: number }> => {
  const response = await api.get<{ data: MemberPIAllocation[]; total: number }>(`/members/${memberId}/pi-allocations`);
  return response.data;
};

export const createOrUpdatePIAllocation = async (memberId: string, piId: string, data: MemberPIAllocationCreate): Promise<MemberPIAllocation> => {
  const response = await api.post<MemberPIAllocation>(`/members/${memberId}/pi/${piId}/allocation`, data);
  return response.data;
};

export const bulkCreatePIAllocations = async (teamId: string, piId: string, allocations: MemberPIAllocationCreate[]): Promise<{ data: MemberPIAllocation[]; total: number }> => {
  const response = await api.post<{ data: MemberPIAllocation[]; total: number }>(`/teams/${teamId}/pi/${piId}/allocations/bulk`, { allocations });
  return response.data;
};

export const deletePIAllocation = async (allocationId: string): Promise<void> => {
  await api.delete(`/pi-allocations/${allocationId}`);
};

// Member Iteration Productivity API
export const getTeamIterationProductivity = async (teamId: string, piId: string): Promise<MemberIterationProductivity[]> => {
  const response = await api.get<MemberIterationProductivity[]>(`/teams/${teamId}/pi/${piId}/iteration-productivity`);
  return response.data;
};

export const bulkCreateIterationProductivity = async (teamId: string, items: MemberIterationProductivityCreate[]): Promise<MemberIterationProductivity[]> => {
  const response = await api.post<MemberIterationProductivity[]>(`/teams/${teamId}/iteration-productivity/bulk`, { items });
  return response.data;
};

export const deleteIterationProductivity = async (recordId: string): Promise<void> => {
  await api.delete(`/iteration-productivity/${recordId}`);
};

// Team Capacity Summary API (with role breakdown)
export const getTeamCapacitySummary = async (teamId: string, piId?: string): Promise<TeamCapacitySummary> => {
  const params = piId ? { pi_id: piId } : {};
  const response = await api.get<TeamCapacitySummary>(`/teams/${teamId}/capacity/summary`, { params });
  return response.data;
};

// ============================================
// Train Capacity Dashboard API
// ============================================

export const getPICapacitySummary = async (piId: string): Promise<CapacitySummaryResponse> => {
  const response = await api.get<CapacitySummaryResponse>('/dashboard/capacity/summary', { params: { pi_id: piId } });
  return response.data;
};

export const getCapacityByProduct = async (piId: string): Promise<ProductCapacityResponse> => {
  const response = await api.get<ProductCapacityResponse>('/dashboard/capacity/by-product', { params: { pi_id: piId } });
  return response.data;
};

export const getCapacityBySite = async (piId: string): Promise<SiteCapacityResponse> => {
  const response = await api.get<SiteCapacityResponse>('/dashboard/capacity/by-site', { params: { pi_id: piId } });
  return response.data;
};

export const getCapacityByTeam = async (piId: string, productId?: string, siteId?: string): Promise<TeamCapacityResponse> => {
  const params: Record<string, string> = { pi_id: piId };
  if (productId) params.product_id = productId;
  if (siteId) params.site_id = siteId;
  const response = await api.get<TeamCapacityResponse>('/dashboard/capacity/by-team', { params });
  return response.data;
};

export const getCapacityByAllocation = async (piId: string): Promise<AllocationCapacityResponse> => {
  const response = await api.get<AllocationCapacityResponse>('/dashboard/capacity/by-allocation', { params: { pi_id: piId } });
  return response.data;
};

// ============================================
// Team PI Capacity Detail API
// ============================================

export const getTeamPICapacityDetail = async (teamId: string, piId: string): Promise<TeamPICapacityDetail> => {
  const response = await api.get<TeamPICapacityDetail>(`/teams/${teamId}/capacity/pi/${piId}`);
  return response.data;
};

// ============================================
// Train Dashboard API
// ============================================

export const getTrainDashboardOverview = async (piId: string): Promise<TrainDashboardOverview> => {
  const response = await api.get<TrainDashboardOverview>('/dashboard/train-overview', { params: { pi_id: piId } });
  return response.data;
};

export const getTeamDetailExpanded = async (teamId: string, piId: string): Promise<TeamDetailExpanded> => {
  const response = await api.get<TeamDetailExpanded>('/dashboard/team-detail', { params: { team_id: teamId, pi_id: piId } });
  return response.data;
};

export default api;
