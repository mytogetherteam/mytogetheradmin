import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import {
  CollectionService,
  type CollectionPayload,
} from "@/services/collectionService";

export const collectionKeys = {
  all: ["collections"] as const,
};

export function useCollections(params?: {
  page?: number;
  size?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: [...collectionKeys.all, params],
    queryFn: () => CollectionService.getCollections(params),
  });
}

export function useCollection(id: number) {
  return useQuery({
    queryKey: [...collectionKeys.all, id],
    queryFn: () => CollectionService.getCollectionById(id),
    enabled: !!id,
  });
}

export function useCreateCollectionMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CollectionPayload) =>
      CollectionService.createCollection(payload),
    onSuccess: () => {
      toast.success("Collection created successfully");
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      navigate("/collections/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to create collection");
    },
  });
}

export function useUpdateCollectionMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CollectionPayload }) =>
      CollectionService.updateCollection(id, payload),
    onSuccess: () => {
      toast.success("Collection updated successfully");
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      navigate("/collections/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to update collection");
    },
  });
}

export function useDeleteCollectionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => CollectionService.deleteCollection(id),
    onSuccess: () => {
      toast.success("Collection deleted successfully");
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all });
    },
    onError: (error) => {
      handleApiError(error, "Failed to delete collection");
    },
  });
}
