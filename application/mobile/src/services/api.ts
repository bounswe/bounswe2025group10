import axios from 'axios';
import { storage } from '../utils/storage';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token?: {
    access: string;
    refresh: string;
  };
  data?: {
    email: string;
    username: string;
  };
}

// API Configuration
const API_URL = 'http://10.0.2.2:8000'; // Android emulator localhost

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication Services
export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/login/', credentials);
    return response.data;
  },

  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/signup/', credentials);
    return response.data;
  },

  getUserInfo: async (): Promise<any> => {
    const response = await api.get('/me/');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post('/jwt/refresh/', { refresh: refreshToken });
    return response.data;
  },

  fakeLogin: async (): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}/fake-login/`);
    return response.data;
  },
};

export const wasteService = {
  getUserWastes: async (): Promise<any> => {
    const response = await api.get('/api/waste/get/');
    return response.data;
  },
  addUserWaste: async (waste_type: string, amount: number): Promise<any> => {
    const response = await api.post('/api/waste/', { waste_type, amount });
    return response.data;
  },
};

export const tipService = {
  getTips: async (): Promise<any> => {
    const response = await api.get('/api/tips/');
    return response.data;
  },
};

export default api; 