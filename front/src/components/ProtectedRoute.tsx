import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: JSX.Element;
    role?: 'student' | 'company' | 'admin';
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
    const location = useLocation();
    const authenticated = isAuthenticated();
    const { user, loading } = useAuth();

    // Back/forward button protection: re-check auth on popstate
    useEffect(() => {
        const handlePopState = () => {
            if (!isAuthenticated()) {
                window.location.replace('/login');
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    if (!authenticated) {
        // Redirect to login but save the current location they were trying to access
        return <Navigate to={`/login?redirect=${location.pathname}${location.search}`} replace />;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // If a specific role is required and the user doesn't have it
    if (role && (!user || (user.role !== role && user.role !== 'admin'))) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}
