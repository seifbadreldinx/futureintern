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
  [key: string]: any;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: () => { },
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
    try {
      const res = await api.auth.getCurrentUser();
      const userData = res?.user || res;
      if (userData) {
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    // Listen for storage changes (login/logout in this tab)
    const onStorage = () => fetchUser();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [fetchUser]);

  const logout = useCallback(() => {
    removeAuthToken();
    setUser(null);
    sessionStorage.clear();
    // Replace history entry so back button can't return to authenticated pages
    window.location.replace('/login');
  }, []);

  const refreshUserData = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}
