import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminsService } from "@/services/adminsService";
import { handleApiError } from "@/lib/error-utils";

interface AdminSessionsListParams {
  page?: number;
  size?: number;
  search?: string;
}

export const adminSessionKeys = {
  all: ["admin-sessions"] as const,
  list: (params?: AdminSessionsListParams) =>
    [...adminSessionKeys.all, "list", params] as const,
};

export function useAdminSessions(params: AdminSessionsListParams) {
  return useQuery({
    queryKey: adminSessionKeys.list(params),
    queryFn: () => AdminsService.getActiveSessions(params),
  });
}

export function useForceLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => AdminsService.forceLogout(id),
    onSuccess: () => {
      toast.success("Admin has been force-logged out");
      void queryClient.invalidateQueries({ queryKey: adminSessionKeys.all });
    },
    onError: (error) => {
      handleApiError(error, "Failed to force-logout admin");
    },
  });
}
