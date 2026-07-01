import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import {
  PlanService,
  type PlanPayload,
  type UpdatePlanPayload,
} from "@/services/planService";

export const planKeys = {
  all: ["plans"] as const,
};

export function usePlans(params?: {
  page?: number;
  size?: number;
  search?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: [...planKeys.all, params],
    queryFn: () => PlanService.getPlans(params),
  });
}

export function usePlan(id: number) {
  return useQuery({
    queryKey: [...planKeys.all, id],
    queryFn: () => PlanService.getPlanById(id),
    enabled: !!id,
  });
}

export function useCreatePlanMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PlanPayload) => PlanService.createPlan(payload),
    onSuccess: () => {
      toast.success("Plan created successfully");
      void queryClient.invalidateQueries({ queryKey: planKeys.all });
      navigate("/plans/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to create plan");
    },
  });
}

export function useUpdatePlanMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePlanPayload }) =>
      PlanService.updatePlan(id, payload),
    onSuccess: () => {
      toast.success("Plan updated successfully");
      void queryClient.invalidateQueries({ queryKey: planKeys.all });
      navigate("/plans/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to update plan");
    },
  });
}

export function useDeletePlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => PlanService.deletePlan(id),
    onSuccess: () => {
      toast.success("Plan deleted successfully");
      void queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
    onError: (error) => {
      handleApiError(error, "Failed to delete plan");
    },
  });
}

export function useReorderPlansMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => PlanService.reorderPlans(ids),
    onSuccess: () => {
      toast.success("Plan order updated");
      void queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
    onError: (error) => {
      handleApiError(error, "Failed to update plan order");
    },
  });
}
