import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';

interface ProtectedRouteProps {
    children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const location = useLocation();

    if (!authService.isAuthenticated()) {
        // Redirect to login and save the attempted url so we can redirect back later if needed
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
