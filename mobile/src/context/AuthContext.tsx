import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getAuthToken, removeAuthToken, saveAuthToken, saveRefreshToken } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  loginWithGoogle: (accessToken: string) => Promise<any>;
  loginWithTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) { setUser(null); return; }
      const res = await api.auth.getCurrentUser();
      setUser(res.user ?? res.profile ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  // Load user on mount
  useEffect(() => {
    refreshUserData().finally(() => setLoading(false));
  }, [refreshUserData]);

  const login = async (email: string, password: string) => {
    const data = await api.auth.login(email, password);
    if (data.access_token) {
      await refreshUserData();
      // Register push token in background — don't block login on failure
      import('../services/notifications').then(({ registerForPushNotifications }) => {
        registerForPushNotifications().catch(() => {});
      });
    }
    return data;
  };

  const loginWithGoogle = async (accessToken: string) => {
    const data = await api.auth.googleLogin(accessToken);
    if (data.access_token) {
      await refreshUserData();
    }
    return data;
  };

  // Used by the mobile server-side OAuth flow: JWT tokens come via deep link
  const loginWithTokens = async (accessToken: string, refreshToken: string) => {
    await saveAuthToken(accessToken);
    await saveRefreshToken(refreshToken);
    await refreshUserData();
  };

  const logout = async () => {
    // Unregister push token before clearing auth
    try {
      const { unregisterPushNotifications } = await import('../services/notifications');
      await unregisterPushNotifications();
    } catch {}
    await removeAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, loginWithTokens, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
