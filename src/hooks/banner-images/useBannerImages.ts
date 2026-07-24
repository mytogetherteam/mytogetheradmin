import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bannerImageService,
  type BannersListParams,
} from "@/services/bannerImageService";
import type { BannerFormValues } from "@/schemas/banner-image.schema";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";

export const bannerImageKeys = {
  all: ["banner-images"] as const,
  list: (params?: BannersListParams) =>
    [...bannerImageKeys.all, "list", params] as const,
  detail: (id?: number) => [...bannerImageKeys.all, "detail", id] as const,
};

export function useBanners(params: BannersListParams = {}) {
  return useQuery({
    queryKey: bannerImageKeys.list(params),
    queryFn: () => bannerImageService.getBanners(params),
    retry: 1,
  });
}

export function useBanner(id?: number) {
  return useQuery({
    queryKey: bannerImageKeys.detail(id),
    queryFn: () => bannerImageService.getBannerById(id as number),
    enabled: typeof id === "number" && id > 0,
  });
}

export function useCreateBannerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      values,
      imageFile,
    }: {
      values: BannerFormValues;
      imageFile: File;
    }) => bannerImageService.createBanner(values, imageFile),
    onSuccess: () => {
      toast.success("Banner created");
      void queryClient.invalidateQueries({ queryKey: bannerImageKeys.all });
    },
    onError: (error) => {
      handleApiError(error, "Failed to create banner");
    },
  });
}

export function useUpdateBannerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      imageFile,
    }: {
      id: number;
      values: Partial<BannerFormValues>;
      imageFile?: File;
    }) => bannerImageService.updateBanner(id, values, imageFile),
    onSuccess: (_data, variables) => {
      toast.success("Banner updated");
      void queryClient.invalidateQueries({ queryKey: bannerImageKeys.all });
      void queryClient.invalidateQueries({
        queryKey: bannerImageKeys.detail(variables.id),
      });
    },
    onError: (error) => {
      handleApiError(error, "Failed to update banner");
    },
  });
}

export function useDeleteBannerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bannerImageService.deleteBanner(id),
    onSuccess: () => {
      toast.success("Banner removed");
      void queryClient.invalidateQueries({ queryKey: bannerImageKeys.all });
    },
    onError: (error) => {
      handleApiError(error, "Failed to remove banner");
    },
  });
}

export function useReorderBannersMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => bannerImageService.reorderBanners(ids),
    onSuccess: () => {
      toast.success("Order updated");
      void queryClient.invalidateQueries({ queryKey: bannerImageKeys.all });
    },
    onError: (error) => {
      handleApiError(error, "Failed to update order");
    },
  });
}
