import { apiClient, ApiResponseData } from './apiClient';

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
  id: string;
  postId: string;
  caseTitle: string;
  witnessName: string;
  description: string;
  status: 'SEEN' | 'NOT_SEEN' | 'PENDING';
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
    const response = await apiClient.get<ApiResponseData<LostFoundPage>>(`/api/admin/community/posts?${params.toString()}`);
    return response.data;
  }

  async forceResolve(id: string): Promise<void> {
    return apiClient.put<void>(`/api/admin/lost-found/${id}/resolve`, {});
  }

  async deleteCase(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/admin/community/posts/${id}`);
  }

  async getSightings(postId?: string, page = 0, size = 10): Promise<SightingPage> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (postId) params.append('postId', postId);
    const response = await apiClient.get<ApiResponseData<SightingPage>>(`/api/admin/lost-found/sightings?${params.toString()}`);
    return response.data;
  }

  async deleteSighting(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/admin/lost-found/sightings/${id}`);
  }
}

export const lostFoundService = new LostFoundService();
