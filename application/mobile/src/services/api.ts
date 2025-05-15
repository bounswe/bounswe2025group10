import axios from 'axios';
import { storage } from '../utils/storage';
import { Platform } from 'react-native';

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
// Use the deployed backend for all requests
export const API_URL = 'https://134-209-253-215.sslip.io';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add token to requests if it exists
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log('Making request to:', config.url, 'with headers:', config.headers);
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
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
    console.log('Full user info response:', JSON.stringify(response.data, null, 2));
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
    const response = await api.get('/api/waste/get');
    return response.data;
  },
  addUserWaste: async (waste_type: string, amount: number): Promise<any> => {
    const response = await api.post('/api/waste/', { waste_type, amount });
    return response.data;
  },
};

export const tipService = {
  /**
   * Fetch the most recent tips (backend returns latest N records)
   */
  getRecentTips: async (): Promise<any> => {
    const response = await api.get('/api/tips/get_recent_tips');
    return response.data;
  },

  /**
   * Fetch all tips (could be used for paginated lists later)
   */
  getAllTips: async (): Promise<any> => {
    const response = await api.get('/api/tips/all/');
    return response.data;
  },
};

export const achievementService = {
  getUserAchievements: async (): Promise<any> => {
    const response = await api.get('/api/challenges/enrolled/');
    return response.data;
  },
};

export const profileService = {
  uploadProfilePicture: async (formData: FormData): Promise<any> => {
    console.log('Uploading profile picture...');
    const response = await api.post('/api/profile/profile-picture/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Profile picture upload full response:', JSON.stringify(response.data, null, 2));
    return response.data;
  },
};

// Public profile endpoints (no auth required)
export const profilePublicService = {
  /** Get public bio info of a user by username */
  getUserBio: async (username: string): Promise<any> => {
    const response = await api.get(`/api/profile/${username}/bio/`);
    return response.data; // { username, bio }
  },
};

export default api; 