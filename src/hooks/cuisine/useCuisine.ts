import { useQuery } from '@tanstack/react-query';
import { cuisineService } from '@/services/cuisineService';

export const cuisineKeys = {
  all: ['cuisines'] as const,

};

export function useCuisines(params?: { page?: number; size?: number; search?: string }) {
  return useQuery({
    queryKey: [...cuisineKeys.all, params],
    queryFn: () => cuisineService.getCuisines(params),
  });
}

export function useCuisine(id: number) {
  return useQuery({
    queryKey: [...cuisineKeys.all, id],
    queryFn: () => cuisineService.getCuisineById(id),
    enabled: !!id,
  });
}
