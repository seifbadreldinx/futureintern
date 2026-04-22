import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAuthToken } from '../services/api';

interface ProtectedRouteProps {
    children: JSX.Element;
    role?: 'student' | 'company' | 'admin';
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
    const location = useLocation();
    const { user, loading, isAuthenticated } = useAuth();
    const hasToken = !!getAuthToken();

    // Back/forward button protection: re-check auth on popstate
    useEffect(() => {
        const handlePopState = () => {
            if (!isAuthenticated && !getAuthToken()) {
                window.location.replace('/login');
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isAuthenticated]);

    // Wait for auth check to finish before rendering
    if (loading || (hasToken && !user)) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
            </div>
        );
    }

    // No token at all — redirect to login
    if (!hasToken || !isAuthenticated || !user) {
        return <Navigate to={`/login?redirect=${location.pathname}${location.search}`} replace />;
    }

    // Role check
    if (role && user.role !== role && user.role !== 'admin') {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}
