import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { authService } from "@/services/authService";
import {
  adminProfileService,
  type AdminProfile,
} from "@/services/adminProfileService";

export const adminProfileKeys = {
  all: ["admin-profile"] as const,
  detail: () => [...adminProfileKeys.all, "detail"] as const,
};

export type UpdateAdminProfileVariables = {
  fullName: string;
  username: string;
  photoFile?: File | null;
};

function syncLocalAuth(profile: AdminProfile) {
  const current = authService.getUserData();
  if (!current) return;
  authService.updateUserData({
    fullName: profile.fullName,
    username: profile.username ?? current.username,
    email: profile.email,
  });
}

export function useAdminProfileQuery() {
  return useQuery({
    queryKey: adminProfileKeys.detail(),
    queryFn: () => adminProfileService.getProfile(),
  });
}

export function useUpdateAdminProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      fullName,
      username,
      photoFile,
    }: UpdateAdminProfileVariables) => {
      if (photoFile) {
        const formData = new FormData();
        formData.append("fullName", fullName.trim());
        formData.append("username", username.trim());
        formData.append("profilePhoto", photoFile);
        return adminProfileService.updateProfile(formData);
      }

      return adminProfileService.updateProfile({
        fullName: fullName.trim(),
        username: username.trim(),
      });
    },
    onSuccess: (updated) => {
      syncLocalAuth(updated);
      queryClient.setQueryData(adminProfileKeys.detail(), updated);
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      handleApiError(error, "Failed to update profile");
    },
  });
}
