import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, getAuthToken, removeAuthToken } from '../services/api';

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  profile_image?: string;
  profile_image_url?: string;
  companyName?: string;
  company_name?: string;
  logo_url?: string;
  university_name?: string;
  major?: string;
  bio?: string;
  phone_number?: string;
  graduation_date?: string;
  skills?: string[];
  preferred_locations?: string[];
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  interests?: string[];
  two_factor_enabled?: boolean;
  [key: string]: any;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAuthenticated: false,
  logout: () => { },
  updateUser: () => { },
  refreshUserData: async () => { },
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    // Start rendering the app immediately; update user when response arrives
    setLoading(false);
    try {
      const res = await api.auth.getCurrentUser();
      const userData = res?.user || res?.profile || res;
      if (userData && userData.id) {
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      const msg = String(err?.message || '');
      // Only clear token on definitive auth failures (bad signature, expired, revoked)
      // NOT on network errors or temporary 401s right after login
      const isDefinitiveAuthFailure =
        msg.includes('Signature verification failed') ||
        msg.includes('Token has expired') ||
        msg.includes('token_revoked') ||
        msg.includes('Invalid token');
      if (isDefinitiveAuthFailure) {
        removeAuthToken();
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    fetchUser();
    // Listen for storage changes (login/logout in same tab)
    const onStorage = () => fetchUser();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [fetchUser]);

  const logout = useCallback(() => {
    removeAuthToken();
    setUser(null);
    sessionStorage.clear();
    window.location.replace('/login');
  }, []);

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  }, []);

  const refreshUserData = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, logout, updateUser, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}
