import axios from 'axios';
import { storage } from '../utils/storage';
import { API_URL } from '@env';
import { logger } from '../utils/logger';


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

// User Info
export interface UserInfo {
  id: number;
  email: string;
  username: string;
  is_admin?: boolean;
}

// Waste Types
export interface WasteEntry {
  id?: number;
  waste_type: string;
  total_amount: number;
  created_at?: string;
}

export interface WasteResponse {
  message?: string;
  data: WasteEntry[];
}

export interface AddWasteResponse {
  message: string;
  data?: WasteEntry;
}

// Tips
export interface Tip {
  id: number;
  title: string;
  description: string;
  creator_username?: string;
  like_count: number;
  dislike_count: number;
  is_user_liked?: boolean;
  is_user_disliked?: boolean;
  created_at?: string;
}

export interface TipsResponse {
  data: Tip[];
}

// Achievements
export interface AchievementDetails {
  id: number;
  title: string;
  description: string;
  icon?: string | null;
}

export interface UserAchievement {
  id: number;
  achievement: AchievementDetails;
  earned_at: string;
}

export interface AchievementsData {
  achievements: UserAchievement[];
}

export interface AchievementsResponse {
  data: AchievementsData;
}

// Leaderboard
export interface LeaderboardUser {
  rank: number;
  username: string;
  total_waste: number | string;
  points: number;
  profile_picture?: string | null;
  isCurrentUser?: boolean;
}

export interface LeaderboardData {
  top_users: LeaderboardUser[];
  current_user?: LeaderboardUser | null;
}

export interface LeaderboardResponse {
  data: LeaderboardData;
}

export interface UserBio {
  username: string;
  bio: string;
}

// Posts
export interface Post {
  id: number;
  text?: string;
  image?: string;
  image_url?: string;
  date?: string;
  creator_username: string;
  creator_profile_image?: string;
  like_count: number;
  dislike_count: number;
  is_user_liked?: boolean;
  is_user_disliked?: boolean;
  created_at?: string;
}

export interface PostsResponse {
  data: Post[];
}

export interface Comment {
  id: number;
  content: string;
  date: string;
  post?: number;
  author?: number;
  author_username: string;
  author_profile_image?: string;
}

export interface CommentsResponse {
  data: Comment[];
}

// Challenges
export interface Challenge {
  id: number;
  title: string;
  description: string;
  target_amount: number;
  current_progress: number;
  is_public: boolean;
  deadline?: string;
  reward?: {
    id: number;
    title?: string;
    points?: number;
  };
  creator?: {
    id: number;
    username: string;
  };
  participants_count?: number;
  created_at?: string;
  is_enrolled?: boolean;
}

export interface UserChallenge {
  id?: number;
  challenge: number;
  progress?: number;
  joined_at?: string;
  joined_date?: string;
}

// Profile
export interface ProfilePictureResponse {
  message: string;
  url?: string;
}

export interface FollowResponse {
  message: string;
  is_following?: boolean;
}

export interface FollowStatusResponse {
  data: {
    is_following: boolean;
    followers_count: number;
    following_count: number;
  };
}

export interface FollowUser {
  id: number;
  username: string;
  profile_image?: string | null;
  bio?: string | null;
}

export interface FollowersResponse {
  data: {
    followers: FollowUser[];
    followers_count: number;
  };
}

export interface FollowingResponse {
  data: {
    following: FollowUser[];
    following_count: number;
  };
}

// Admin/Moderation
export interface ReportContent {
  id: number;
  title?: string;
  content?: string;
  text?: string;
  description?: string;
  username?: string;
  email?: string;
  profile_picture?: string;
  creator?: string;
  target_amount?: number;
  current_progress?: number;
  is_public?: boolean;
  created_at?: string;
  participants_count?: number;
  likes_count?: number;
  comments_count?: number;
  post_title?: string;
  post_id?: number;
  bio?: string;
  followers_count?: number;
  is_active?: boolean;
}

export interface Report {
  id: number;
  content_type: string;
  reason: string;
  description: string;
  created_at: string;
  reporter: {
    username: string;
  };
  content: ReportContent;
}

export interface ReportsResponse {
  results?: Report[];
  data?: Report[];
}

export interface ModerationResponse {
  message: string;
  success: boolean;
}

// Weather
export interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
  time?: string;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
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

// Token cache to avoid reading from AsyncStorage on every request
let cachedToken: string | null = null;

// Initialize token cache from storage
storage.getToken().then(token => {
  cachedToken = token;
});

// Function to update cached token
export const updateCachedToken = (token: string | null) => {
  cachedToken = token;
};

// Add token to requests if it exists
api.interceptors.request.use(
  async (config) => {
    try {
      // Use cached token first, fallback to storage if cache is empty
      let token = cachedToken;
      if (token === null) {
        token = await storage.getToken();
        cachedToken = token;
      }
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      logger.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    logger.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Add response interceptor for better error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      // Handle 401 Unauthorized - try to refresh token
      if (error.response.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await storage.getRefreshToken();
          if (refreshToken) {
            const response = await axios.post(`${API_URL}/jwt/refresh/`, {
              refresh: refreshToken,
            });

            if (response.data.access) {
              const newToken = response.data.access;
              await storage.setToken(newToken);
              cachedToken = newToken; // Update cache

              processQueue(null, newToken);

              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          }
        } catch (refreshError) {
          logger.error('Token refresh failed:', refreshError);
          processQueue(refreshError as Error, null);
          // Clear tokens on refresh failure
          await storage.clearTokens();
          cachedToken = null; // Clear cache
        } finally {
          isRefreshing = false;
        }
      }
    }
    return Promise.reject(error);
  }
);

// URL Construction Helpers
export const getProfilePictureUrl = (username: string): string => {
  return `${API_URL}/api/profile/${username}/picture/`;
};

export const getPostImageUrl = (imageUrl: string): string => {
  // Post images come with full URL from backend
  return imageUrl.startsWith('http') ? imageUrl : `${API_URL}${imageUrl}`;
};

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

  getUserInfo: async (): Promise<UserInfo> => {
    const response = await api.get<UserInfo>('/me/');
    logger.log('User info response received');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post('/jwt/refresh/', { refresh: refreshToken });
    return response.data;
  },

  fakeLogin: async (): Promise<AuthResponse> => {
    if (!__DEV__) {
      throw new Error('fakeLogin is only available in development mode');
    }
    const response = await axios.post(`${API_URL}/fake-login/`);
    return response.data;
  },
};

export const wasteService = {
  getUserWastes: async (): Promise<WasteResponse> => {
    logger.log('Fetching user wastes...');
    const response = await api.get<WasteEntry[]>('/api/waste/get/');
    logger.log('Waste data response:', response.status);
    return { data: response.data };
  },
  addUserWaste: async (waste_type: string, amount: number): Promise<AddWasteResponse> => {
    logger.log('Adding user waste:', { waste_type, amount });
    const response = await api.post<AddWasteResponse>('/api/waste/', { waste_type, amount });
    logger.log('Add waste response:', response.status);
    return response.data;
  },
};

export const tipService = {
  /**
   * Fetch the most recent tips (backend returns latest N records)
   */
  getRecentTips: async (): Promise<TipsResponse> => {
    const response = await api.get<TipsResponse>('/api/tips/get_recent_tips');
    return response.data;
  },

  /**
   * Fetch all tips (could be used for paginated lists later)
   */
  getAllTips: async (): Promise<TipsResponse> => {
    logger.log('[Tips API] Fetching all tips...');
    try {
      // Try the all endpoint first
      const response = await api.get('/api/tips/all');
      const data = response.data;
      const tips = data.results || data.data || (Array.isArray(data) ? data : []);
      logger.log('[Tips API] Extracted tips count:', tips.length);
      return { data: tips as Tip[] };
    } catch (error: unknown) {
      logger.log('[Tips API] /all endpoint failed, trying getRecentTips...');
      // Fallback to getRecentTips if /all doesn't exist
      const response = await api.get('/api/tips/get_recent_tips');
      const data = response.data;
      const tips = data.data || (Array.isArray(data) ? data : []);
      logger.log('[Tips API] Extracted tips count:', tips.length);
      return { data: tips as Tip[] };
    }
  },

  /**
   * Create a new tip
   */
  createTip: async (title: string, description: string): Promise<Tip> => {
    const response = await api.post<Tip>('/api/tips/create/', { title, description });
    return response.data;
  },

  /**
   * Like a tip
   */
  likeTip: async (tipId: number): Promise<void> => {
    await api.post(`/api/tips/${tipId}/like/`, {});
  },

  /**
   * Dislike a tip
   */
  dislikeTip: async (tipId: number): Promise<void> => {
    await api.post(`/api/tips/${tipId}/dislike/`, {});
  },

  /**
   * Report a tip
   */
  reportTip: async (tipId: number, reason: string, description: string): Promise<void> => {
    await api.post(`/api/tips/${tipId}/report/`, { reason, description });
  },
};

export const achievementService = {
  getUserAchievements: async (): Promise<AchievementsResponse> => {
    const response = await api.get<AchievementsData>('/api/achievements/');
    return { data: response.data };
  },
};

export const leaderboardService = {
  getLeaderboard: async (): Promise<LeaderboardResponse> => {
    const response = await api.get<LeaderboardData>('/api/waste/leaderboard/');
    return { data: response.data };
  },
  getUserBio: async (username: string): Promise<UserBio> => {
    const response = await api.get<UserBio>(`/api/profile/${username}/bio/`);
    return response.data;
  },
};

export const postService = {
  getAllPosts: async (): Promise<PostsResponse> => {
    const response = await api.get('/api/posts/all/');
    // API returns paginated format: { count, next, previous, results: [...] }
    // Normalize to { data: [...] } format for consistency with other endpoints
    const data = response.data;
    return { data: (data.results || data) as Post[] };
  },

  createPost: async (formData: FormData): Promise<Post> => {
    // Use cached token for auth
    const token = cachedToken || await storage.getToken();

    // Use axios directly for multipart uploads to avoid Content-Type issues
    const response = await axios.post<Post>(`${API_URL}/api/posts/create/`, formData, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Don't set Content-Type - let the browser/RN set it with boundary
      },
    });
    return response.data;
  },

  likePost: async (postId: number): Promise<void> => {
    await api.post(`/api/posts/${postId}/like/`);
  },

  dislikePost: async (postId: number): Promise<void> => {
    await api.post(`/api/posts/${postId}/dislike/`);
  },

  getComments: async (postId: number): Promise<CommentsResponse> => {
    const response = await api.get(`/api/posts/${postId}/comments/`);
    // API may return paginated format: { count, next, previous, results: [...] }
    // or direct format: { data: [...] }
    const data = response.data;
    return { data: (data.results || data.data || data) as Comment[] };
  },

  createComment: async (postId: number, content: string): Promise<Comment> => {
    const response = await api.post<Comment>(`/api/posts/${postId}/comments/create/`, {
      content,
    });
    return response.data;
  },

  reportPost: async (postId: number, reason: string, description: string): Promise<void> => {
    await api.post(`/api/posts/${postId}/report/`, {
      reason,
      description,
    });
  },
};

export const challengeService = {
  getChallenges: async (): Promise<Challenge[]> => {
    const response = await api.get('/api/challenges/');
    // API returns paginated format: { count, next, previous, results: [...] }
    // Return the array directly for consistency
    const data = response.data;
    return (data.results || data) as Challenge[];
  },

  getEnrolledChallenges: async (): Promise<UserChallenge[]> => {
    const response = await api.get('/api/challenges/enrolled/');
    // API returns paginated format: { count, next, previous, results: [...] }
    // Return the array directly for consistency
    const data = response.data;
    return (data.results || data) as UserChallenge[];
  },

  createChallenge: async (data: {
    title: string;
    description: string;
    target_amount: number;
    is_public: boolean;
    deadline: string;
  }): Promise<Challenge> => {
    const response = await api.post<Challenge>('/api/challenges/', data);
    return response.data;
  },

  joinChallenge: async (challengeId: number): Promise<UserChallenge> => {
    const response = await api.post<UserChallenge>('/api/challenges/participate/', {
      challenge: challengeId,
    });
    return response.data;
  },

  leaveChallenge: async (userChallengeId: number): Promise<void> => {
    await api.delete(`/api/challenges/participate/${userChallengeId}/`);
  },

  deleteChallenge: async (id: number): Promise<void> => {
    await api.delete(`/api/challenges/${id}/delete/`);
  },
};

export const profileService = {
  uploadProfilePicture: async (formData: FormData): Promise<ProfilePictureResponse> => {
    // Use cached token for auth
    const token = cachedToken || await storage.getToken();

    // Use axios directly for multipart uploads to avoid Content-Type issues
    const response = await axios.post<ProfilePictureResponse>(`${API_URL}/api/profile/profile-picture/`, formData, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Don't set Content-Type - let the browser/RN set it with boundary
      },
    });
    return response.data;
  },
  updateBio: async (username: string, bio: string): Promise<UserBio> => {
    const response = await api.put<UserBio>(`/api/profile/${username}/bio/`, { bio });
    return response.data;
  },

  // Follow a user
  followUser: async (username: string): Promise<FollowResponse> => {
    const response = await api.post<FollowResponse>(`/api/profile/${username}/follow/`);
    return response.data;
  },

  // Unfollow a user
  unfollowUser: async (username: string): Promise<FollowResponse> => {
    const response = await api.post<FollowResponse>(`/api/profile/${username}/unfollow/`);
    return response.data;
  },

  // Get follow status and counts for a user
  getFollowStatus: async (username: string): Promise<FollowStatusResponse> => {
    const response = await api.get<FollowStatusResponse>(`/api/profile/${username}/follow-status/`);
    return response.data;
  },

  // Get list of followers
  getFollowers: async (username: string): Promise<FollowersResponse> => {
    const response = await api.get<FollowersResponse>(`/api/profile/${username}/followers/`);
    return response.data;
  },

  // Get list of users being followed
  getFollowing: async (username: string): Promise<FollowingResponse> => {
    const response = await api.get<FollowingResponse>(`/api/profile/${username}/following/`);
    return response.data;
  },
};

// Public profile endpoints (no auth required)
export const profilePublicService = {
  /** Get public bio info of a user by username */
  getUserBio: async (username: string): Promise<UserBio> => {
    const response = await api.get<UserBio>(`/api/profile/${username}/bio/`);
    return response.data;
  },
};

// Admin service for moderation functionality
export const adminService = {
  getReports: async (contentType?: string): Promise<ReportsResponse> => {
    const url = contentType ? `/api/admin/reports/?content_type=${contentType}` : '/api/admin/reports/';
    const response = await api.get<ReportsResponse>(url);
    return response.data;
  },

  moderateContent: async (reportId: number, action: string): Promise<ModerationResponse> => {
    const response = await api.post<ModerationResponse>(`/api/admin/reports/${reportId}/moderate/`, {
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
  getCurrentWeather: async (latitude: number, longitude: number): Promise<WeatherData> => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    const response = await axios.get<{ current_weather: WeatherData }>(url);
    return response.data.current_weather;
  },
};

export default api;
