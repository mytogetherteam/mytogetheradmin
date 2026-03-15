import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';

interface ProtectedRouteProps {
    children: ReactNode;
    requiredAuthorities?: string[];
}

export const ProtectedRoute = ({ children, requiredAuthorities }: ProtectedRouteProps) => {
    const location = useLocation();
    const userData = authService.getUserData();

    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredAuthorities && requiredAuthorities.length > 0) {
        const userAuthorities = userData?.authorities || [];
        const userRole = userData?.role || "";
        
        // MASTER_ADMIN can always access
        const isMaster = userRole === "MASTER_ADMIN" || userAuthorities.includes("MASTER_ADMIN");
        
        if (!isMaster) {
            // Legacy ADMIN role support: maps to OPS, FINANCE, SETUP
            const effectiveAuthorities = [...userAuthorities];
            if (userRole === "ADMIN") {
                effectiveAuthorities.push("ADMIN_OPS", "ADMIN_FINANCE", "ADMIN_SETUP");
            }

            const hasAccess = requiredAuthorities.some(auth => effectiveAuthorities.includes(auth));
            if (!hasAccess) {
                // If they are authenticated but not authorized, redirect to dashboard
                // In a real app, maybe an "Access Denied" page is better
                return <Navigate to="/" replace />;
            }
        }
    }

    return <>{children}</>;
};
