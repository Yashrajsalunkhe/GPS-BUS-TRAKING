import { apiRequest } from '@/lib/queryClient';
import { LoginInput, RegisterStudentInput } from '@shared/schema';
import { AuthTokens } from '@shared/interfaces';

// Local storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

// Auth API endpoints
const API_LOGIN = '/api/auth/login';
const API_REGISTER = '/api/auth/register';
const API_LOGOUT = '/api/auth/logout';
const API_REFRESH_TOKEN = '/api/auth/refresh-token';

// Interface for auth user
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

// Login function
export const login = async (credentials: LoginInput): Promise<AuthTokens> => {
  try {
    const response = await apiRequest('POST', API_LOGIN, credentials);
    const data = await response.json();
    
    // Store tokens and user data
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Register function
export const register = async (userData: RegisterStudentInput): Promise<AuthTokens> => {
  try {
    const response = await apiRequest('POST', API_REGISTER, userData);
    const data = await response.json();
    
    // Store tokens and user data
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Logout function
export const logout = async (): Promise<void> => {
  try {
    // Call logout API
    await apiRequest('POST', API_LOGOUT);
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage regardless of API call result
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

// Refresh token function
export const refreshAuth = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  
  if (!refreshToken) {
    return false;
  }
  
  try {
    const response = await apiRequest('POST', API_REFRESH_TOKEN, { refreshToken });
    const data = await response.json();
    
    // Update tokens
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    
    return true;
  } catch (error) {
    console.error('Token refresh error:', error);
    // Clear storage on refresh failure
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return false;
  }
};

// Get access token
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

// Get current user
export const getCurrentUser = (): AuthUser | null => {
  const userJson = localStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAccessToken() && !!getCurrentUser();
};

// Check if user has specific role
export const hasRole = (role: string): boolean => {
  const user = getCurrentUser();
  return user ? user.role === role : false;
};

// Check if user is admin
export const isAdmin = (): boolean => {
  return hasRole('admin');
};

// Check if user is student
export const isStudent = (): boolean => {
  return hasRole('student');
};

// Check if user is driver
export const isDriver = (): boolean => {
  return hasRole('driver');
};
