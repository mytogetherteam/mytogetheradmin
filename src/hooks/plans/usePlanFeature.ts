import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import {
  PlanService,
  type PlanFeaturePayload,
  type UpdatePlanFeaturePayload,
} from "@/services/planService";

export const planFeatureKeys = {
  all: ["plan-features"] as const,
};

export function usePlanFeatures(params?: {
  page?: number;
  size?: number;
  search?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: [...planFeatureKeys.all, params],
    queryFn: () => PlanService.getPlanFeatures(params),
  });
}

export function usePlanFeature(id: number) {
  return useQuery({
    queryKey: [...planFeatureKeys.all, id],
    queryFn: () => PlanService.getPlanFeatureById(id),
    enabled: !!id,
  });
}

export function useCreatePlanFeatureMutation(options?: { redirectTo?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PlanFeaturePayload) =>
      PlanService.createPlanFeature(payload),
    onSuccess: () => {
      toast.success("Plan feature created successfully");
      void queryClient.invalidateQueries({ queryKey: planFeatureKeys.all });
      navigate(options?.redirectTo ?? "/plan-features/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to create plan feature");
    },
  });
}

export function useUpdatePlanFeatureMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdatePlanFeaturePayload;
    }) => PlanService.updatePlanFeature(id, payload),
    onSuccess: () => {
      toast.success("Plan feature updated successfully");
      void queryClient.invalidateQueries({ queryKey: planFeatureKeys.all });
      navigate("/plan-features/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to update plan feature");
    },
  });
}

export function useDeletePlanFeatureMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => PlanService.deletePlanFeature(id),
    onSuccess: () => {
      toast.success("Plan feature deleted successfully");
      void queryClient.invalidateQueries({ queryKey: planFeatureKeys.all });
    },
    onError: (error) => {
      handleApiError(error, "Failed to delete plan feature");
    },
  });
}

export function useReorderPlanFeaturesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => PlanService.reorderPlanFeatures(ids),
    onSuccess: () => {
      toast.success("Feature order updated");
      void queryClient.invalidateQueries({ queryKey: planFeatureKeys.all });
    },
    onError: (error) => {
      handleApiError(error, "Failed to update feature order");
    },
  });
}
