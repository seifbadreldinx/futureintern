// API Service for backend communication
// Handles all HTTP requests to the Flask backend

// Get API base URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Helper function to save auth token
const saveAuthToken = (token: string): void => {
  localStorage.setItem('access_token', token);
  // Dispatch an event so other components in the same tab can react to auth changes
  try { window.dispatchEvent(new Event('storage')); } catch (e) { /* no-op */ }
};

// Helper function to remove auth token
const removeAuthToken = (): void => {
  localStorage.removeItem('access_token');
  // Dispatch event so components update immediately on logout
  try { window.dispatchEvent(new Event('storage')); } catch (e) { /* no-op */ }
};

// Generic API request function
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Perform request with robust error handling for network/CORS issues
  const url = `${API_BASE_URL}${endpoint}`;
  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...headers,
      },
      mode: 'cors',
    });
  } catch (err) {
    // Network errors (e.g., server down, CORS blocked) end up here
    console.error('Network or fetch error', { url, error: err });
    throw new Error(
      err instanceof Error && err.message ? `NetworkError: ${err.message}` : 'NetworkError: Failed to fetch'
    );
  }

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    if (!response.ok) {
      console.error('Request failed (non-JSON response)', { url, status: response.status });
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return {} as T;
  }

  const data = await response.json();

  if (!response.ok) {
    // Don't auto-logout here - let components handle 401 errors themselves
    // Components can check the error and decide whether to logout or show an error message
    console.error('API responded with error', { url, status: response.status, body: data });
    throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
  }

  return data;
};

// API Service Object
export const api = {
  // ========== Authentication ==========
  auth: {
    // Register student
    registerStudent: async (data: {
      name: string;
      email: string;
      password: string;
      university: string;
      major: string;
      interests?: string[];
      cv?: File;
    }) => {
      // First register the user
      const registerResponse = await apiRequest<{ user: any; message: string }>('/auth/register/student', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          university: data.university,
          major: data.major,
          interests: data.interests,
        }),
      });

      // After registration, automatically login to get access token
      // This allows CV upload and immediate access to dashboard
      let loginResponse;
      try {
        loginResponse = await api.auth.login(data.email, data.password);
      } catch (loginError) {
        console.warn('Auto-login after registration failed:', loginError);
        // Return registration response even if login fails
        return registerResponse;
      }

      // If CV is provided and login succeeded, upload it
      if (data.cv && loginResponse.access_token) {
        try {
          await api.users.uploadCV(data.cv);
          console.log('CV uploaded successfully');
        } catch (cvError) {
          console.warn('CV upload failed, but registration succeeded:', cvError);
          // Don't fail registration if CV upload fails
        }
      }

      return loginResponse || registerResponse;
    },

    // Login
    login: async (email: string, password: string) => {
      const data = await apiRequest<{ access_token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.access_token) {
        saveAuthToken(data.access_token);
      }
      return data;
    },

    // Logout
    logout: () => {
      removeAuthToken();
    },

    // Get current user
    getCurrentUser: async () => {
      // Try /profile endpoint (more standard)
      try {
        const response = await apiRequest<{ profile: any }>('/users/profile');
        return { user: response.profile };
      } catch (error) {
        // Fallback to /me if /profile doesn't exist
        return apiRequest<any>('/users/me');
      }
    },

    // Refresh token
    refreshToken: async () => {
      const data = await apiRequest<{ access_token: string }>('/auth/refresh', {
        method: 'POST',
      });
      if (data.access_token) {
        saveAuthToken(data.access_token);
      }
      return data;
    },

    // Forgot Password
    forgotPassword: async (email: string) => {
      return apiRequest<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    // Reset Password
    resetPassword: async (token: string, password: string) => {
      return apiRequest<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
    },
  },

  // ========== Users ==========
  users: {
    // Get user profile
    getProfile: async (userId?: number) => {
      if (userId) {
        return apiRequest<any>(`/users/${userId}`);
      }
      return apiRequest<any>('/users/profile');
    },

    // Update user profile
    updateProfile: async (data: any) => {
      // Backend uses JWT to identify user, so we target /profile
      // userId param remains for interface compatibility but is unused for this specific call
      return apiRequest<any>('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    // Upload CV
    uploadCV: async (file: File) => {
      const formData = new FormData();
      formData.append('cv', file);

      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/users/upload-cv`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || error.message || 'Upload failed');
      }

      return response.json();
    },

    // Delete CV
    deleteCV: async () => {
      return apiRequest<any>('/users/delete-cv', {
        method: 'DELETE',
      });
    },

    // Get saved internships
    getSavedInternships: async () => {
      return apiRequest<any>('/users/saved-internships');
    },

    // Save an internship
    saveInternship: async (internshipId: number) => {
      return apiRequest<any>(`/users/saved-internships/${internshipId}`, {
        method: 'POST',
      });
    },

    // Unsave an internship
    unsaveInternship: async (internshipId: number) => {
      return apiRequest<any>(`/users/saved-internships/${internshipId}`, {
        method: 'DELETE',
      });
    },

    // Check if internship is saved
    checkIfSaved: async (internshipId: number) => {
      return apiRequest<any>(`/users/saved-internships/${internshipId}/check`);
    },
  },

  // ========== Internships ==========
  internships: {
    // Get all internships
    getAll: async (params?: { page?: number; per_page?: number; search?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params?.search) queryParams.append('search', params.search);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/internships?${queryString}` : '/internships';
      return apiRequest<any>(endpoint);
    },

    // Get internship by ID
    getById: async (id: number) => {
      return apiRequest<any>(`/internships/${id}`);
    },

    // Create internship (for companies)
    create: async (data: any) => {
      return apiRequest<any>('/internships', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // Update internship
    update: async (id: number, data: any) => {
      return apiRequest<any>(`/internships/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    // Delete internship
    delete: async (id: number) => {
      return apiRequest<any>(`/internships/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // ========== Applications ==========
  applications: {
    // Get all applications (for current user or all if admin)
    getAll: async () => {
      // Try /my endpoint first (for students), fallback to /applications
      try {
        return apiRequest<any>('/applications/my');
      } catch (error) {
        // If /my fails, try general endpoint
        return apiRequest<any>('/applications');
      }
    },

    // Get application by ID
    getById: async (id: number) => {
      return apiRequest<any>(`/applications/${id}`);
    },

    // Create application (student applies)
    create: async (internshipId: number, data?: any) => {
      // Backend expects POST /api/applications/apply
      return apiRequest<any>('/applications/apply', {
        method: 'POST',
        body: JSON.stringify({ internship_id: internshipId, ...data }),
      });
    },

    // Update application status
    updateStatus: async (id: number, status: string) => {
      return apiRequest<any>(`/applications/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },

    // Delete application
    delete: async (id: number) => {
      return apiRequest<any>(`/applications/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // ========== Recommendations ==========
  recommendations: {
    // Get personalized recommendations
    getRecommendations: async () => {
      return apiRequest<any>('/recommendations');
    },
  },

  // ========== Admin ==========
  admin: {
    // Get all users
    getAllUsers: async () => {
      return apiRequest<any>('/admin/users');
    },

    // Get all internships
    getAllInternships: async () => {
      return apiRequest<any>('/admin/internships');
    },

    // Get all applications
    getAllApplications: async () => {
      return apiRequest<any>('/admin/applications');
    },

    // Delete user
    deleteUser: async (userId: number) => {
      return apiRequest<any>(`/admin/users/${userId}`, {
        method: 'DELETE',
      });
    },
  },

  // ========== Chatbot ==========
  chatbot: {
    // Send message to chatbot
    sendMessage: async (message: string) => {
      return apiRequest<any>('/chatbot/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
    },
  },
};

// Export helper functions
export { getAuthToken, saveAuthToken, removeAuthToken };

