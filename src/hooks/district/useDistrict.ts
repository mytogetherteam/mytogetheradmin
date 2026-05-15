import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { districtService, CreateDistrictRequest } from '@/services/districtService';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { useNavigate } from 'react-router-dom';

export const districtKeys = {
  all: ['districts'] as const,
};

export function useDistricts(params?: { page?: number; size?: number; search?: string; cityId?: number }) {
  return useQuery({
    queryKey: [...districtKeys.all, params],
    queryFn: () => districtService.getDistricts(params),
  });
}

export function useDistrict(id: number) {
  return useQuery({
    queryKey: [...districtKeys.all, id],
    queryFn: () => districtService.getDistrictById(id),
    enabled: !!id,
  });
}

export function useCreateDistrictMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDistrictRequest) => districtService.createDistrict(data),
    onSuccess: () => {
      toast.success('District created successfully');
      void queryClient.invalidateQueries({ queryKey: districtKeys.all });
      navigate('/districts/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to create district');
    },
  });
}

export function useUpdateDistrictMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateDistrictRequest> }) =>
      districtService.updateDistrict(id, data),
    onSuccess: () => {
      toast.success('District updated successfully');
      void queryClient.invalidateQueries({ queryKey: districtKeys.all });
      navigate('/districts/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to update district');
    },
  });
}

export function useDeleteDistrictMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => districtService.deleteDistrict(id),
    onSuccess: () => {
      toast.success('District deleted successfully');
      void queryClient.invalidateQueries({ queryKey: districtKeys.all });
      navigate('/districts/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to delete district');
    },
  });
}
