import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { hasAccess, AdminRole } from '@/utils/rbac';

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: AdminRole | AdminRole[];
}

/** At least one of `auth_token` or `refresh_token` in localStorage. */
function hasStoredAuthCredential(): boolean {
    const access = authService.getToken()?.trim();
    const refresh = authService.getRefreshToken()?.trim();
    return Boolean(access) || Boolean(refresh);
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
    const location = useLocation();
    const userFromStore = useAuthStore((s) => s.user)

    if (!hasStoredAuthCredential() || !userFromStore) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole) {
        const userRole = userFromStore.role;

        if (!hasAccess(userRole, requiredRole)) {
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};
