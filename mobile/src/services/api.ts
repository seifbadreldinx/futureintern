import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://futureintern-production.up.railway.app/api';

// ── Token helpers (SecureStore replaces localStorage on mobile) ──────────────

export const getAuthToken = async (): Promise<string | null> => {
  try { return await SecureStore.getItemAsync('access_token'); }
  catch { return null; }
};

export const saveAuthToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync('access_token', token);
};

export const removeAuthToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
};

export const getRefreshToken = async (): Promise<string | null> => {
  try { return await SecureStore.getItemAsync('refresh_token'); }
  catch { return null; }
};

export const saveRefreshToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync('refresh_token', token);
};

// ── Generic request helper ───────────────────────────────────────────────────

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit & { _timeout?: number } = {}
): Promise<T> => {
  const { _timeout = 15000, ...opts } = options as any;
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(opts.headers as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), _timeout);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...opts,
      headers,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error('Request timed out. Please try again.');
    throw new Error('Network error. Please check your connection.');
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    return {} as T;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || `Error ${response.status}`);
  }
  return data;
};

// ── API Surface ──────────────────────────────────────────────────────────────

export const api = {

  // ── Auth ─────────────────────────────────────────────────────────────────
  auth: {
    login: async (email: string, password: string) => {
      const data = await apiRequest<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.access_token) await saveAuthToken(data.access_token);
      if (data.refresh_token) await saveRefreshToken(data.refresh_token);
      return data;
    },

    register: async (payload: {
      name: string; email: string; password: string;
      university: string; major: string; interests?: string[];
    }) => {
      const data = await apiRequest<any>('/auth/register/student', {
        method: 'POST',
        body: JSON.stringify(payload),
        _timeout: 30000,
      } as any);
      // Auto-login after registration
      try {
        const login = await api.auth.login(payload.email, payload.password);
        return login;
      } catch {
        return data;
      }
    },

    logout: async () => {
      await removeAuthToken();
    },

    getCurrentUser: async () => {
      try {
        const res = await apiRequest<{ profile: any }>('/users/profile');
        return { user: res.profile };
      } catch {
        return apiRequest<any>('/users/me');
      }
    },

    googleLogin: async (accessToken: string) => {
      const data = await apiRequest<any>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ access_token: accessToken }),
      });
      if (data.access_token) await saveAuthToken(data.access_token);
      if (data.refresh_token) await saveRefreshToken(data.refresh_token);
      return data;
    },

    forgotPassword: async (email: string) => {
      return apiRequest<any>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
        _timeout: 30000,
      } as any);
    },

    verify2fa: async (userId: number, code: string) => {
      const data = await apiRequest<any>('/auth/verify-2fa', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, code }),
      });
      if (data.access_token) await saveAuthToken(data.access_token);
      if (data.refresh_token) await saveRefreshToken(data.refresh_token);
      return data;
    },

    updateProfile: async (profileData: any) => {
      return apiRequest<any>('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
    },

    uploadCV: async (fileUri: string, fileName: string) => {
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append('cv', {
        uri: fileUri,
        type: 'application/pdf',
        name: fileName,
      } as any);
      const response = await fetch(`${API_BASE_URL}/users/upload-cv`, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }
      return response.json();
    },

    resendVerification: async (email: string) =>
      apiRequest<any>('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  },

  // ── Internships ──────────────────────────────────────────────────────────
  internships: {
    list: async (params?: Record<string, any>) => {
      const q = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => v != null && q.append(k, String(v)));
      const qs = q.toString();
      return apiRequest<any>(qs ? `/internships?${qs}` : '/internships');
    },

    // Alias
    getAll: async (params?: { page?: number; per_page?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', String(params.page));
      if (params?.per_page) q.append('per_page', String(params.per_page));
      if (params?.search) q.append('search', params.search);
      const qs = q.toString();
      return apiRequest<any>(qs ? `/internships?${qs}` : '/internships');
    },

    detail: async (id: number) => apiRequest<any>(`/internships/${id}`),

    getById: async (id: number) => apiRequest<any>(`/internships/${id}`),

    saved: async () => apiRequest<any>('/users/saved-internships'),

    listSaved: async () => {
      const res = await apiRequest<any>('/users/saved-internships');
      return res.saved_internships ?? [];
    },

    save: async (id: number) =>
      apiRequest<any>(`/users/saved-internships/${id}`, { method: 'POST' }),

    unsave: async (id: number) =>
      apiRequest<any>(`/users/saved-internships/${id}`, { method: 'DELETE' }),

    checkSaved: async (id: number) =>
      apiRequest<any>(`/users/saved-internships/${id}/check`),

    listRecommendations: async () => {
      const res = await apiRequest<any>('/matching/recommendations');
      return res.recommendations ?? res ?? [];
    },
  },

  // ── Applications ─────────────────────────────────────────────────────────
  applications: {
    list: async () => apiRequest<any>('/applications/my-applications'),

    myApplications: async () => {
      const res = await apiRequest<any>('/applications/my-applications');
      return res.applications ?? res ?? [];
    },

    apply: async (internshipId: number) =>
      apiRequest<any>('/applications/apply', {
        method: 'POST',
        body: JSON.stringify({ internship_id: internshipId }),
      }),
  },

  // ── Points ───────────────────────────────────────────────────────────────
  points: {
    balance: async () => apiRequest<{ balance: number }>('/points/balance'),

    getBalance: async () => apiRequest<{ balance: number }>('/points/balance'),

    getPricing: async () => apiRequest<{ services: any[] }>('/points/pricing'),

    getTransactions: async () => apiRequest<any>('/points/transactions'),

    getStore: async () => apiRequest<any>('/points/store'),
  },

  // ── Notifications ────────────────────────────────────────────────────────
  notifications: {
    register: async (token: string, platform: string) =>
      apiRequest<any>('/notifications/register', {
        method: 'POST',
        body: JSON.stringify({ token, platform }),
      }),

    unregister: async (token: string) =>
      apiRequest<any>('/notifications/unregister', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
  },

  // ── Companies ────────────────────────────────────────────────────────────
  companies: {
    list: async () => apiRequest<{ companies: any[] }>('/users/companies'),
  },

  // ── CV Builder ───────────────────────────────────────────────────────────
  cv: {
    get: async () => apiRequest<{ cv: any | null }>('/cv/'),

    saveHeader: async (data: any) =>
      apiRequest<any>('/cv/', { method: 'POST', body: JSON.stringify(data) }),

    addSection: async (data: any) =>
      apiRequest<any>('/cv/sections', { method: 'POST', body: JSON.stringify(data) }),

    updateSection: async (id: number, data: any) =>
      apiRequest<any>(`/cv/sections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    deleteSection: async (id: number) =>
      apiRequest<any>(`/cv/sections/${id}`, { method: 'DELETE' }),

    exportPDF: async () => {
      const token = await getAuthToken();
      return fetch(`${API_BASE_URL}/cv/export/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
  },
};
