import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { PlaceService } from "@/services/placeService";
import { buildPlaceFormData, type PlaceFormValues } from "@/schemas/place.schema";

export type PlacesListParams = {
  page?: number;
  size?: number;
  search?: string;
};

export const placeKeys = {
  all: ["places"] as const,
  list: (params?: PlacesListParams) => [...placeKeys.all, "list", params] as const,
  detail: (id?: number) => [...placeKeys.all, "detail", id] as const,
};

export function usePlaces(params?: PlacesListParams) {
  return useQuery({
    queryKey: placeKeys.list(params),
    queryFn: () => PlaceService.getPlaces(params),
    retry: 1,
  });
}

export function usePlace(id?: number) {
  return useQuery({
    queryKey: placeKeys.detail(id),
    queryFn: () => PlaceService.getPlaceById(id as number),
    enabled: typeof id === "number" && id > 0,
    retry: 1,
  });
}

export function useCreatePlaceMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      values,
      coverFile,
      galleryFiles,
    }: {
      values: PlaceFormValues;
      coverFile?: File;
      galleryFiles?: File[];
    }) =>
      PlaceService.createPlace(
        buildPlaceFormData(values, {
          cover: coverFile,
          galleryPhotos: galleryFiles,
        }),
      ),
    onSuccess: () => {
      toast.success("Place created successfully");
      void queryClient.invalidateQueries({ queryKey: placeKeys.all });
      navigate("/places/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to create place");
    },
  });
}

export function useUpdatePlaceMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      values,
      coverFile,
      galleryFiles,
    }: {
      id: number;
      values: PlaceFormValues;
      coverFile?: File;
      galleryFiles?: File[];
    }) =>
      PlaceService.updatePlace(
        id,
        buildPlaceFormData(values, {
          cover: coverFile,
          galleryPhotos: galleryFiles,
        }),
      ),
    onSuccess: (_data, variables) => {
      toast.success("Place updated successfully");
      void queryClient.invalidateQueries({ queryKey: placeKeys.all });
      void queryClient.invalidateQueries({
        queryKey: placeKeys.detail(variables.id),
      });
      navigate("/places/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to update place");
    },
  });
}

export function useDeletePlaceMutation(options?: { navigateOnSuccess?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const navigateOnSuccess = options?.navigateOnSuccess ?? false;

  return useMutation({
    mutationFn: (id: number) => PlaceService.deletePlace(id),
    onSuccess: () => {
      toast.success("Place deleted successfully");
      void queryClient.invalidateQueries({ queryKey: placeKeys.all });
      if (navigateOnSuccess) {
        navigate("/places/manage");
      }
    },
    onError: (error) => {
      handleApiError(error, "Failed to delete place");
    },
  });
}
