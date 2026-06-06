import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import {
  VisaCategoryService,
  type VisaCategoryDTO,
} from "@/services/visaCategoryService";
import type { VisaSection } from "@/services/visaService";
import type { VisaCategoryFormValues } from "@/schemas/visa-category.schema";

export type VisaCategoriesListParams = {
  page?: number;
  size?: number;
  search?: string;
  section?: VisaSection;
};

export const visaCategoryKeys = {
  all: ["visa-categories"] as const,
  list: (params?: VisaCategoriesListParams) =>
    [...visaCategoryKeys.all, "list", params] as const,
  detail: (id?: number) => [...visaCategoryKeys.all, "detail", id] as const,
};

export function useVisaCategories(params?: VisaCategoriesListParams) {
  return useQuery({
    queryKey: visaCategoryKeys.list(params),
    queryFn: () => VisaCategoryService.getCategories(params),
    retry: 1,
  });
}

export function useVisaCategory(id?: number) {
  return useQuery({
    queryKey: visaCategoryKeys.detail(id),
    queryFn: () => VisaCategoryService.getCategoryById(id as number),
    enabled: typeof id === "number" && id > 0,
    retry: 1,
  });
}

export function useCreateVisaCategoryMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: VisaCategoryFormValues) =>
      VisaCategoryService.createCategory(values),
    onSuccess: () => {
      toast.success("Visa category created successfully");
      void queryClient.invalidateQueries({ queryKey: visaCategoryKeys.all });
      navigate("/visa/categories/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to create visa category");
    },
  });
}

export function useUpdateVisaCategoryMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: VisaCategoryFormValues }) =>
      VisaCategoryService.updateCategory(id, values),
    onSuccess: (_data, variables) => {
      toast.success("Visa category updated successfully");
      void queryClient.invalidateQueries({ queryKey: visaCategoryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: visaCategoryKeys.detail(variables.id),
      });
      navigate("/visa/categories/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to update visa category");
    },
  });
}

export function useDeleteVisaCategoryMutation(options?: { navigateOnSuccess?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const navigateOnSuccess = options?.navigateOnSuccess ?? false;

  return useMutation({
    mutationFn: (id: number) => VisaCategoryService.deleteCategory(id),
    onSuccess: () => {
      toast.success("Visa category deleted successfully");
      void queryClient.invalidateQueries({ queryKey: visaCategoryKeys.all });
      if (navigateOnSuccess) {
        navigate("/visa/categories/manage");
      }
    },
    onError: (error) => {
      handleApiError(error, "Failed to delete visa category");
    },
  });
}

export type { VisaCategoryDTO };
