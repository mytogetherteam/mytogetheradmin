import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';
import { marketingPermissionsService } from '@/services/marketingPermissionsService';
import { useAuthStore } from '@/store/useAuthStore';
import { useMarketingStore } from '@/store/useMarketingStore';
import { hasAccess, isBlockedPanelRole, AdminRole } from '@/utils/rbac';
import { isMarketingRole, marketingAllows } from '@/utils/marketingAccess';

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
    const marketingReady = useMarketingStore((s) => s.ready)
    const marketingSections = useMarketingStore((s) => s.sections)
    const marketingUser = isMarketingRole(userFromStore?.role)

    useEffect(() => {
        if (!marketingUser) return;
        marketingPermissionsService.loadMine().catch(() => {
            useMarketingStore.getState().markReady();
        });
    }, [marketingUser]);

    if (isBlockedPanelRole(userFromStore?.role)) {
        authService.clearLocalSession();
        return <Navigate to="/login" replace />;
    }

    if (!hasStoredAuthCredential() || !userFromStore) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (marketingUser) {
        if (!marketingReady) {
            return (
                <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
                    Loading access…
                </div>
            );
        }
        if (
            location.pathname !== '/no-access' &&
            !marketingAllows(marketingSections, location.pathname)
        ) {
            return <Navigate to="/no-access" replace />;
        }
        return <>{children}</>;
    }

    if (requiredRole) {
        const userRole = userFromStore.role;

        if (!hasAccess(userRole, requiredRole)) {
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};
