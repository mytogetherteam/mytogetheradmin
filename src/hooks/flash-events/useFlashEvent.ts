import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import {
  FlashEventService,
  type FlashEventPayload,
  type FlashType,
  type FlashStatus,
} from "@/services/flashEventService";

export const flashEventKeys = {
  all: ["flash-events"] as const,
};

export function useFlashEvents(params?: {
  page?: number;
  size?: number;
  search?: string;
  type?: FlashType;
  status?: FlashStatus;
}) {
  return useQuery({
    queryKey: [...flashEventKeys.all, params],
    queryFn: () => FlashEventService.getFlashEvents(params),
  });
}

export function useFlashEvent(id: number) {
  return useQuery({
    queryKey: [...flashEventKeys.all, id],
    queryFn: () => FlashEventService.getFlashEventById(id),
    enabled: !!id,
  });
}

export function useCreateFlashEventMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FlashEventPayload) =>
      FlashEventService.createFlashEvent(payload),
    onSuccess: () => {
      toast.success("Flash event created successfully");
      void queryClient.invalidateQueries({ queryKey: flashEventKeys.all });
      navigate("/flash-events/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to create flash event");
    },
  });
}

export function useUpdateFlashEventMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FlashEventPayload }) =>
      FlashEventService.updateFlashEvent(id, payload),
    onSuccess: () => {
      toast.success("Flash event updated successfully");
      void queryClient.invalidateQueries({ queryKey: flashEventKeys.all });
      navigate("/flash-events/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to update flash event");
    },
  });
}

export function useDeleteFlashEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => FlashEventService.deleteFlashEvent(id),
    onSuccess: () => {
      toast.success("Flash event deleted successfully");
      void queryClient.invalidateQueries({ queryKey: flashEventKeys.all });
    },
    onError: (error) => {
      handleApiError(error, "Failed to delete flash event");
    },
  });
}
