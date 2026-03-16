import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';
import { hasAccess, AdminRole } from '@/utils/rbac';

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: AdminRole | AdminRole[];
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
    const location = useLocation();
    const userData = authService.getUserData();

    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole) {
        const userRole = userData?.role;
        
        if (!hasAccess(userRole, requiredRole)) {
            // If they are authenticated but not authorized, redirect to dashboard
            // In a real app, maybe an "Access Denied" page is better
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};
