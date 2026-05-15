import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cuisineService } from '@/services/cuisineService';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { useNavigate } from 'react-router-dom';

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

export function useCreateCuisineMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => cuisineService.createCuisine(data),
    onSuccess: () => {
      toast.success('Cuisine created successfully');
      void queryClient.invalidateQueries({ queryKey: cuisineKeys.all });
      navigate('/cuisines/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to create cuisine');
    },
  });
}

export function useUpdateCuisineMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      cuisineService.updateCuisine(id, data),
    onSuccess: () => {
      toast.success('Cuisine updated successfully');
      void queryClient.invalidateQueries({ queryKey: cuisineKeys.all });
      navigate('/cuisines/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to update cuisine');
    },
  });
}

export function useDeleteCuisineMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cuisineService.deleteCuisine(id),
    onSuccess: () => {
      toast.success('Cuisine deleted successfully');
      void queryClient.invalidateQueries({ queryKey: cuisineKeys.all });
      navigate('/cuisines/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to delete cuisine');
    },
  });
}
