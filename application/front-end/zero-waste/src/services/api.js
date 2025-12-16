// src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for common error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 403 Forbidden and 401 Unauthorized
    if (error.response?.status === 403 || error.response?.status === 401) {
      // Clear auth tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('username');
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function for fetch API calls (for consistency with existing code)
export const createAuthenticatedFetch = (token) => {
  return async (url, options = {}) => {
    let headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };
    // Only set Content-Type to application/json if body is not FormData
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    return fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });
  };
};

export { apiClient, API_BASE_URL };
export default apiClient;