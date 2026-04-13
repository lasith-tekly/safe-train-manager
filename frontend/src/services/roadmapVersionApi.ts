import axios from 'axios';
import { API as API_BASE_URL } from '../config/api';

export interface RoadmapVersion {
  id: string;
  product_id: string;
  version_name: string;
  status: 'DRAFT' | 'PUBLISHED';
  description?: string;
  created_at: string;
  published_at?: string;
  created_by?: string;
  feature_count: number;
}

export interface CreateVersionData {
  version_name?: string;
  copy_from_version_id?: string;
  description?: string;
}

export interface VersionListResponse {
  items: RoadmapVersion[];
  total: number;
}

export const roadmapVersionApi = {
  list: (productId: string) => 
    axios.get<VersionListResponse>(`${API_BASE_URL}/products/${productId}/roadmap-versions`),
  
  create: (productId: string, data: CreateVersionData) =>
    axios.post<RoadmapVersion>(`${API_BASE_URL}/products/${productId}/roadmap-versions`, data),
  
  publish: (productId: string, versionId: string) =>
    axios.post<RoadmapVersion>(`${API_BASE_URL}/products/${productId}/roadmap-versions/${versionId}/publish`, {}),
  
  getVersionFeatures: (productId: string, versionId: string) =>
    axios.get(`${API_BASE_URL}/products/${productId}/roadmap-versions/${versionId}/features`),
};
