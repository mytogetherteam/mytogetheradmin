import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cityService, CityDTO } from '@/services/cityService';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { useNavigate } from 'react-router-dom';

export const cityKeys = {
  all: ['cities'] as const,
};

export function useCities(params?: { page?: number; size?: number; search?: string }) {
  return useQuery({
    queryKey: [...cityKeys.all, params],
    queryFn: () => cityService.getCities(params),
  });
}

export function useCity(id: number) {
  return useQuery({
    queryKey: [...cityKeys.all, id],
    queryFn: () => cityService.getCityById(id),
    enabled: !!id,
  });
}

export function useCreateCityMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CityDTO>) => cityService.createCity(data),
    onSuccess: () => {
      toast.success('City created successfully');
      void queryClient.invalidateQueries({ queryKey: cityKeys.all });
      navigate('/cities/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to create city');
    },
  });
}

export function useUpdateCityMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CityDTO> }) =>
      cityService.updateCity(id, data),
    onSuccess: () => {
      toast.success('City updated successfully');
      void queryClient.invalidateQueries({ queryKey: cityKeys.all });
      navigate('/cities/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to update city');
    },
  });
}

export function useDeleteCityMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cityService.deleteCity(id),
    onSuccess: () => {
      toast.success('City deleted successfully');
      void queryClient.invalidateQueries({ queryKey: cityKeys.all });
      navigate('/cities/manage');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to delete city');
    },
  });
}
