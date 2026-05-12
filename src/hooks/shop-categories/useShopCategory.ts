import { useMutation, useQuery } from '@tanstack/react-query';
import { ShopCategoryService } from '@/services/shopCategoryService';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { useNavigate } from 'react-router-dom';

export const shopCategoryKeys = {
  all: ['shop-categories'] as const,
};

export function useCreateShopCategoryMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: FormData) => ShopCategoryService.createShopCategory(data),
    onSuccess: () => {
      toast.success('Shop category created successfully');
      navigate('/shop-categories/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to create shop category');
    },
  });
}

export function useUpdateShopCategoryMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      ShopCategoryService.updateShopCategory(id, data),
    onSuccess: () => {
      toast.success('Shop category updated successfully');
      navigate('/shop-categories/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to update shop category');
    },
  });
}

export function useDeleteShopCategoryMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (id: number) => ShopCategoryService.deleteShopCategory(id),
    onSuccess: () => {
      toast.success('Shop category deleted successfully');
      navigate('/shop-categories/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to delete shop category');
    },
  });
}

export function useShopCategories(params?: { page?: number; size?: number; search?: string }) {
  return useQuery({
    queryKey: [...shopCategoryKeys.all, params],
    queryFn: () => ShopCategoryService.getShopCategories(params),
  });
}
