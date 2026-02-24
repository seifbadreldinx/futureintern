// Authentication utility functions
import { getAuthToken, removeAuthToken } from '../services/api';

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return !!token;
};

export const logout = (): void => {
  removeAuthToken();
  // Clear any cached user data from sessionStorage/localStorage
  sessionStorage.clear();
  // Replace current history entry so back button can't return to authenticated pages
  window.location.replace('/login');
};

export const requireAuth = (): boolean => {
  if (!isAuthenticated()) {
    window.location.href = '/login';
    return false;
  }
  return true;
};

