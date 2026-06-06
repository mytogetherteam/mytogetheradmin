import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { VisaService, type VisaSection } from "@/services/visaService";
import { buildVisaFormData, type VisaFormValues } from "@/schemas/visa.schema";

export type VisasListParams = {
  page?: number;
  size?: number;
  search?: string;
  section?: VisaSection;
};

export const visaKeys = {
  all: ["visas"] as const,
  list: (params?: VisasListParams) => [...visaKeys.all, "list", params] as const,
  detail: (id?: number) => [...visaKeys.all, "detail", id] as const,
};

export function useVisas(params?: VisasListParams) {
  return useQuery({
    queryKey: visaKeys.list(params),
    queryFn: () => VisaService.getVisas(params),
    retry: 1,
  });
}

export function useVisa(id?: number) {
  return useQuery({
    queryKey: visaKeys.detail(id),
    queryFn: () => VisaService.getVisaById(id as number),
    enabled: typeof id === "number" && id > 0,
    retry: 1,
  });
}

export function useCreateVisaMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      values,
      iconFile,
      bannerFile,
    }: {
      values: VisaFormValues;
      iconFile?: File;
      bannerFile?: File;
    }) =>
      VisaService.createVisa(
        buildVisaFormData(values, {
          icon: iconFile,
          banner: bannerFile,
        }),
      ),
    onSuccess: () => {
      toast.success("Visa created successfully");
      void queryClient.invalidateQueries({ queryKey: visaKeys.all });
      navigate("/visa/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to create visa");
    },
  });
}

export function useUpdateVisaMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      values,
      iconFile,
      bannerFile,
    }: {
      id: number;
      values: VisaFormValues;
      iconFile?: File;
      bannerFile?: File;
    }) =>
      VisaService.updateVisa(
        id,
        buildVisaFormData(values, {
          icon: iconFile,
          banner: bannerFile,
        }),
      ),
    onSuccess: (_data, variables) => {
      toast.success("Visa updated successfully");
      void queryClient.invalidateQueries({ queryKey: visaKeys.all });
      void queryClient.invalidateQueries({
        queryKey: visaKeys.detail(variables.id),
      });
      navigate("/visa/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to update visa");
    },
  });
}

export function useDeleteVisaMutation(options?: { navigateOnSuccess?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const navigateOnSuccess = options?.navigateOnSuccess ?? false;

  return useMutation({
    mutationFn: (id: number) => VisaService.deleteVisa(id),
    onSuccess: () => {
      toast.success("Visa deleted successfully");
      void queryClient.invalidateQueries({ queryKey: visaKeys.all });
      if (navigateOnSuccess) {
        navigate("/visa/manage");
      }
    },
    onError: (error) => {
      handleApiError(error, "Failed to delete visa");
    },
  });
}

export function useReorderVisasMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => VisaService.reorderVisas(ids),
    onSuccess: () => {
      toast.success("Visa order updated");
      void queryClient.invalidateQueries({ queryKey: visaKeys.all });
    },
    onError: (error) => {
      handleApiError(error, "Failed to reorder visas");
    },
  });
}
