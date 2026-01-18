// Authentication utility functions
import { getAuthToken, removeAuthToken } from '../services/api';

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return !!token;
};

export const logout = (): void => {
  removeAuthToken();
  // Optionally clear other user data
  window.location.href = '/login';
};

export const requireAuth = (): boolean => {
  if (!isAuthenticated()) {
    window.location.href = '/login';
    return false;
  }
  return true;
};

