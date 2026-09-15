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
  phoneNumber?: string;
  photos?: string[];
  latitude?: number;
  longitude?: number;
  likeCount?: number;
  commentCount?: number;
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
    
    try {
      const response = await apiClient.get<any>(`${config.endpoints.admin.lostFound.posts}?${params.toString()}`);
      if (!response) {
        return { content: [], totalElements: 0, totalPages: 1, number: page };
      }
      if (Array.isArray(response)) {
        return {
          content: response,
          totalElements: response.length,
          totalPages: 1,
          number: page,
        };
      }
      if (Array.isArray(response.content)) {
        return {
          content: response.content,
          totalElements: response.totalElements ?? response.content.length,
          totalPages: response.totalPages ?? 1,
          number: response.number ?? page,
        };
      }
      if (Array.isArray(response.items)) {
        return {
          content: response.items,
          totalElements: response.meta?.total ?? response.items.length,
          totalPages: response.meta?.last_page ?? 1,
          number: page,
        };
      }
      return { content: [], totalElements: 0, totalPages: 1, number: page };
    } catch (e) {
      console.error("Failed to fetch cases:", e);
      throw e;
    }
  }

  async getCaseById(id: number | string): Promise<LostFoundPost> {
    const res = await apiClient.get<any>(`${config.endpoints.admin.lostFound.posts}/${id}`);
    return res.data?.data || res.data || res;
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
    try {
      const response = await apiClient.get<any>(`${config.endpoints.admin.lostFound.sightings}?${params.toString()}`);
      if (!response) {
        return { content: [], totalElements: 0, totalPages: 0, number: page };
      }
      if (Array.isArray(response)) {
        return { content: response, totalElements: response.length, totalPages: 1, number: page };
      }
      if (Array.isArray(response.content)) {
        return {
          content: response.content,
          totalElements: response.totalElements ?? response.content.length,
          totalPages: response.totalPages ?? 0,
          number: page,
        };
      }
      return { content: [], totalElements: 0, totalPages: 0, number: page };
    } catch {
      return { content: [], totalElements: 0, totalPages: 0, number: page };
    }
  }

  async deleteSighting(id: number | string): Promise<void> {
    return apiClient.delete<void>(config.endpoints.admin.lostFound.sightingDetail(String(id)));
  }
}

export const lostFoundService = new LostFoundService();
