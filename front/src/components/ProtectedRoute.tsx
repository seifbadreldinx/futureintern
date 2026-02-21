import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface ProtectedRouteProps {
    children: JSX.Element;
    role?: 'student' | 'company' | 'admin';
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
    const location = useLocation();
    const authenticated = isAuthenticated();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authenticated && role) {
            api.auth.getCurrentUser()
                .then(data => setUser(data.user || data))
                .catch(() => setUser(null))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [authenticated, role]);

    if (!authenticated) {
        // Redirect to login but save the current location they were trying to access
        return <Navigate to={`/login?redirect=${location.pathname}${location.search}`} replace />;
    }

    if (role && loading) {
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
