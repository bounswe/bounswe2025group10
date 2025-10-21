import axios from 'axios';
import { storage } from '../utils/storage';
import { API_URL } from '@env';

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
  isAdmin?: boolean;
  username?: string;
  data?: {
    email: string;
    username: string;
  };
}

// API Configuration
// API_URL is imported from environment variables (.env file)
// To change the backend URL, update the .env file

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
      console.log('Retrieved token from storage:', token ? 'Token exists' : 'No token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Added Authorization header:', `Bearer ${token.substring(0, 20)}...`);
      } else {
        console.log('No token available, request will be sent without Authorization header');
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
        url: error.config?.url,
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
    console.log('Fetching user wastes...');
    const response = await api.get('/api/waste/get/');
    console.log('Waste data response:', response.status, response.data);
    return response.data;
  },
  addUserWaste: async (waste_type: string, amount: number): Promise<any> => {
    console.log('Adding user waste:', { waste_type, amount });
    const response = await api.post('/api/waste/', { waste_type, amount });
    console.log('Add waste response:', response.status, response.data);
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

  /**
   * Create a new tip
   */
  createTip: async (title: string, description: string): Promise<any> => {
    const response = await api.post('/api/tips/create/', { title, description });
    return response.data;
  },

  /**
   * Like a tip
   */
  likeTip: async (tipId: number): Promise<any> => {
    const response = await api.post(`/api/tips/${tipId}/like/`, {});
    return response.data;
  },

  /**
   * Dislike a tip
   */
  dislikeTip: async (tipId: number): Promise<any> => {
    const response = await api.post(`/api/tips/${tipId}/dislike/`, {});
    return response.data;
  },

  /**
   * Report a tip
   */
  reportTip: async (tipId: number, reason: string, description: string): Promise<any> => {
    const response = await api.post(`/api/tips/${tipId}/report/`, { reason, description });
    return response.data;
  },
};

export const achievementService = {
  getUserAchievements: async (): Promise<any> => {
    const response = await api.get('/api/achievements/');
    return response.data;
  },
};

export const leaderboardService = {
  getLeaderboard: async (): Promise<any> => {
    const response = await api.get('/api/waste/leaderboard/');
    return response.data;
  },
  getUserBio: async (username: string): Promise<any> => {
    const response = await api.get(`/api/profile/${username}/bio/`);
    return response.data;
  },
};

export const challengeService = {
  deleteChallenge: async (id: number): Promise<any> => {
    const response = await api.delete(`/api/challenges/${id}/delete/`);
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
  updateBio: async (username: string, bio: string): Promise<any> => {
    const response = await api.put(`/api/profile/${username}/bio/`, { bio });
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

// Admin service for moderation functionality
export const adminService = {
  getReports: async (contentType?: string): Promise<any> => {
    const url = contentType ? `/api/admin/reports/?content_type=${contentType}` : '/api/admin/reports/';
    const response = await api.get(url);
    return response.data;
  },
  
  moderateContent: async (reportId: number, action: string): Promise<any> => {
    const response = await api.post(`/api/admin/reports/${reportId}/moderate/`, {
      action: action
    });
    return response.data;
  },
};

// External weather API (Open-Meteo)
export const weatherService = {
  /**
   * Get current weather for given coordinates using the free Open-Meteo API (no key needed).
   */
  getCurrentWeather: async (latitude: number, longitude: number): Promise<any> => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    const response = await axios.get(url);
    return response.data.current_weather; // { temperature, windspeed, weathercode, ... }
  },
};

export default api;
