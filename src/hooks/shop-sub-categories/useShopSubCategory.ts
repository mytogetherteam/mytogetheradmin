import { useMutation, useQuery } from '@tanstack/react-query';
import { ShopCategoryService } from '@/services/shopCategoryService';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { useNavigate } from 'react-router-dom';

export const shopSubCategoryKeys = {
  all: ['shop-sub-categories'] as const,
};

export function useCreateShopSubCategoryMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: number; data: FormData }) =>
      ShopCategoryService.createShopSubCategory(categoryId, data),
    onSuccess: () => {
      toast.success('Sub-category created successfully');
      navigate('/shop-sub-categories/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to create sub-category');
    },
  });
}

export function useUpdateShopSubCategoryMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      ShopCategoryService.updateShopSubCategory(id, data),
    onSuccess: () => {
      toast.success('Sub-category updated successfully');
      navigate('/shop-sub-categories/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to update sub-category');
    },
  });
}

export function useDeleteShopSubCategoryMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (id: number) => ShopCategoryService.deleteShopSubCategory(id),
    onSuccess: () => {
      toast.success('Sub-category deleted successfully');
      navigate('/shop-sub-categories/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to delete sub-category');
    },
  });
}

export function useShopSubCategories(params?: { page?: number; size?: number; search?: string }) {
  return useQuery({
    queryKey: [...shopSubCategoryKeys.all, params],
    queryFn: () => ShopCategoryService.getShopSubCategoriesPaginated(params),
  });
}
