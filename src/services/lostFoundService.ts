import { apiClient } from './apiClient';
import { config } from '@/config/config';

export type LostFoundStatus = 'OPEN' | 'RESOLVED';
export type LostFoundType = 'LOST' | 'FOUND';

export interface LostFoundPost {
  id: string;
  title: string;
  description: string;
  itemType: string;
  postType: LostFoundType;
  status: LostFoundStatus;
  location: string;
  reward?: string;
  postedBy: string;
  createdAt: string;
}

export interface LostFoundPage {
  content: LostFoundPost[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface Sighting {
  id: number | string;
  postId: number | string;
  itemName: string;
  postAuthorName: string;
  witnessId?: number | string;
  witnessName: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface SightingPage {
  content: Sighting[];
  totalElements: number;
  totalPages: number;
  number: number;
}

class LostFoundService {
  async getCases(type?: LostFoundType, page = 0, size = 10, search = ''): Promise<LostFoundPage> {
    const params = new URLSearchParams({ 
      page: String(page), 
      size: String(size),
      search: search
    });
    if (type) params.append('postType', type);
    
    // Using community posts endpoint with postType=LOST or FOUND as per spec
    const response = await apiClient.get<LostFoundPage>(`${config.endpoints.admin.lostFound.posts}?${params.toString()}`);
    return response;
  }

  async forceResolve(postId: number | string): Promise<void> {
    return apiClient.put<void>(config.endpoints.admin.lostFound.resolve(String(postId)), {});
  }

  async deleteCase(id: number | string): Promise<void> {
    return apiClient.delete<void>(`${config.endpoints.admin.lostFound.posts}/${id}`);
  }

  async getSightings(postId?: number | string, page = 0, size = 10, search = ''): Promise<SightingPage> {
    const params = new URLSearchParams({ 
        page: String(page), 
        size: String(size),
        search: search
    });
    if (postId) params.append('postId', String(postId));
    const response = await apiClient.get<SightingPage>(`${config.endpoints.admin.lostFound.sightings}?${params.toString()}`);
    return response;
  }

  async deleteSighting(id: number | string): Promise<void> {
    return apiClient.delete<void>(config.endpoints.admin.lostFound.sightingDetail(String(id)));
  }
}

export const lostFoundService = new LostFoundService();
