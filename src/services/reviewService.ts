import { apiClient } from './apiClient';
import { config } from '@/config/config';

export type ReviewType = 'SHOPS' | 'ITEMS';

export interface Review {
  id: string;
  reviewerName: string;
  reviewerEmail?: string;
  rating: number;
  comment: string;
  commentMm?: string | null;
  isVisible: boolean;
  isVerified: boolean;
  helpfulCount: number;
  photoCount: number;
  ownerResponse?: string | null;
  ownerResponseAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  photoUrls?: string[];
  shopId?: number;
  shopName?: string;
  itemName?: string;
  targetName?: string; // Unified name
  userId?: number | null;
  userFullName?: string | null;
  userPhone?: string | null;
}

export interface ReviewPage {
  content: Review[];
  totalElements: number;
  totalPages: number;
  number: number;
}

class ReviewService {
  async getReviews(
    type: ReviewType, 
    page = 0, 
    size = 10, 
    filters?: { search?: string; rating?: number | string; startDate?: string; endDate?: string }
  ): Promise<ReviewPage> {
    const endpoint = type === 'SHOPS' 
      ? config.endpoints.admin.reviews.shops 
      : config.endpoints.admin.reviews.items;
    
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (filters?.search) params.append('search', filters.search);
    if (filters?.rating && filters.rating !== 'ALL') params.append('rating', String(filters.rating));
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get<ReviewPage>(`${endpoint}?${params.toString()}`);
    
    // Map shopName/itemName to targetName for consistent UI rendering
    if (response.content) {
      response.content = response.content.map(r => ({
        ...r,
        targetName: r.targetName || r.shopName || r.itemName || 'N/A'
      }));
    }
    
    return response;
  }

  async toggleVisibility(type: ReviewType, id: string, visible: boolean): Promise<Review> {
    const endpoint = type === 'SHOPS' 
      ? config.endpoints.admin.reviews.shopVisibility(id) 
      : config.endpoints.admin.reviews.itemVisibility(id);
    const response = await apiClient.put<Review>(`${endpoint}?visible=${visible}`, {});
    return response;
  }

  async deleteReview(type: ReviewType, id: string): Promise<void> {
    const endpoint = type === 'SHOPS' 
      ? config.endpoints.admin.reviews.shopDetail(id) 
      : config.endpoints.admin.reviews.itemDetail(id);
    return apiClient.delete<void>(endpoint);
  }

  async deleteReviewPhoto(type: ReviewType, photoId: string): Promise<void> {
    const endpoint = type === 'SHOPS' 
      ? config.endpoints.admin.reviews.photos.shops(photoId) 
      : config.endpoints.admin.reviews.photos.items(photoId);
    return apiClient.delete<void>(endpoint);
  }

  async getReviewDetail(type: ReviewType, id: string): Promise<Review> {
    const endpoint = type === 'SHOPS' 
      ? config.endpoints.admin.reviews.shopDetail(id) 
      : config.endpoints.admin.reviews.itemDetail(id);
    const response = await apiClient.get<Review>(endpoint);
    
    // Set targetName
    if (response) {
        response.targetName = response.targetName || response.shopName || response.itemName || 'N/A';
    }
    
    return response;
  }
}

export const reviewService = new ReviewService();
