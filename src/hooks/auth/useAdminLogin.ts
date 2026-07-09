import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { LoginRequest } from '@/interfaces/auth/auth.interface';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { useNavigate } from 'react-router-dom';

export const adminLoginMutationKey = ['auth', 'admin-login'] as const;

export function useAdminLoginMutation() {
  const navigate = useNavigate()
  return useMutation({
    mutationKey: [...adminLoginMutationKey],
    mutationFn: (credentials: LoginRequest) => authService.adminLogin(credentials),
    onSuccess: () => {
      toast.success("Login successful!", {
        description: "Welcome back to MyTogether Admin Panel",
      })
      navigate("/")
    },
    onError: (error) => {
      handleApiError(error, "Login failed")
    },
    retry: false,
  });
}
