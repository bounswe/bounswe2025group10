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
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
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
          console.error('Token refresh failed:', refreshError);
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
    console.log('[Tips API] Fetching all tips...');
    try {
      // Try the all endpoint first
      const response = await api.get('/api/tips/all');
      console.log('[Tips API] Response from /all:', JSON.stringify(response.data, null, 2).slice(0, 500));
      const data = response.data;
      const tips = data.results || data.data || (Array.isArray(data) ? data : []);
      console.log('[Tips API] Extracted tips count:', tips.length);
      return { data: tips };
    } catch (error: any) {
      console.log('[Tips API] /all endpoint failed, trying getRecentTips...');
      // Fallback to getRecentTips if /all doesn't exist
      const response = await api.get('/api/tips/get_recent_tips');
      console.log('[Tips API] Response from getRecentTips:', JSON.stringify(response.data, null, 2).slice(0, 500));
      const data = response.data;
      const tips = data.data || (Array.isArray(data) ? data : []);
      console.log('[Tips API] Extracted tips count:', tips.length);
      return { data: tips };
    }
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
  // Get another user's achievements by username
  getUserAchievementsByUsername: async (username: string): Promise<any> => {
    const response = await api.get(`/api/achievements/${username}/`);
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

export const postService = {
  getAllPosts: async (): Promise<any> => {
    const response = await api.get('/api/posts/all/');
    // API returns paginated format: { count, next, previous, results: [...] }
    // Normalize to { data: [...] } format for consistency with other endpoints
    const data = response.data;
    return { data: data.results || data };
  },

  createPost: async (formData: FormData): Promise<any> => {
    // Use cached token for auth
    const token = cachedToken || await storage.getToken();

    // Use axios directly for multipart uploads to avoid Content-Type issues
    const response = await axios.post(`${API_URL}/api/posts/create/`, formData, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Don't set Content-Type - let the browser/RN set it with boundary
      },
    });
    return response.data;
  },

  likePost: async (postId: number): Promise<any> => {
    const response = await api.post(`/api/posts/${postId}/like/`);
    return response.data;
  },

  dislikePost: async (postId: number): Promise<any> => {
    const response = await api.post(`/api/posts/${postId}/dislike/`);
    return response.data;
  },

  getComments: async (postId: number): Promise<any> => {
    const response = await api.get(`/api/posts/${postId}/comments/`);
    // API may return paginated format: { count, next, previous, results: [...] }
    // or direct format: { data: [...] }
    const data = response.data;
    return { data: data.results || data.data || data };
  },

  createComment: async (postId: number, content: string): Promise<any> => {
    const response = await api.post(`/api/posts/${postId}/comments/create/`, {
      content,
    });
    return response.data;
  },

  reportPost: async (postId: number, reason: string, description: string): Promise<any> => {
    const response = await api.post(`/api/posts/${postId}/report/`, {
      reason,
      description,
    });
    return response.data;
  },
};

export const challengeService = {
  getChallenges: async (): Promise<any> => {
    const response = await api.get('/api/challenges/');
    // API returns paginated format: { count, next, previous, results: [...] }
    // Return the array directly for consistency
    const data = response.data;
    return data.results || data;
  },

  getEnrolledChallenges: async (): Promise<any> => {
    const response = await api.get('/api/challenges/enrolled/');
    // API returns paginated format: { count, next, previous, results: [...] }
    // Return the array directly for consistency
    const data = response.data;
    return data.results || data;
  },

  createChallenge: async (data: {
    title: string;
    description: string;
    target_amount: number;
    is_public: boolean;
    deadline: string;
  }): Promise<any> => {
    const response = await api.post('/api/challenges/', data);
    return response.data;
  },

  joinChallenge: async (challengeId: number): Promise<any> => {
    const response = await api.post('/api/challenges/participate/', {
      challenge: challengeId,
    });
    return response.data;
  },

  leaveChallenge: async (userChallengeId: number): Promise<any> => {
    const response = await api.delete(`/api/challenges/participate/${userChallengeId}/`);
    return response.data;
  },

  deleteChallenge: async (id: number): Promise<any> => {
    const response = await api.delete(`/api/challenges/${id}/delete/`);
    return response.data;
  },
};

// Activity Feed Service
export interface ActivityItem {
  id: string;
  type: 'post' | 'waste' | 'achievement' | 'challenge' | 'follow' | 'like' | 'dislike';
  actorUsername: string;
  summary: string;
  timestamp: string;
  data?: any;
}

export const activityService = {
  // Get activity feed from followed users (comprehensive, like getOwnActivities)
  getActivityFeed: async (followingUsernames: string[]): Promise<ActivityItem[]> => {
    const activities: ActivityItem[] = [];
    
    if (followingUsernames.length === 0) {
      console.log('[Activity Following] No followed users');
      return activities;
    }
    
    console.log('[Activity Following] Fetching activities for', followingUsernames.length, 'followed users');
    
    // 1. Get posts from followed users
    try {
      const postsResponse = await postService.getAllPosts();
      const allPosts = postsResponse.data || [];
      
      // Posts created by followed users
      const followedPosts = allPosts.filter((post: any) => 
        followingUsernames.includes(post.creator_username)
      );
      
      followedPosts.forEach((post: any) => {
        activities.push({
          id: `post-created-${post.id}-${post.creator_username}`,
          type: 'post',
          actorUsername: post.creator_username,
          summary: `📝 Created a post: "${(post.text || 'Shared a post').slice(0, 50)}${post.text?.length > 50 ? '...' : ''}"`,
          timestamp: post.date || post.created_at || new Date().toISOString(),
          data: post,
        });
      });
      console.log('[Activity Following] Added', followedPosts.length, 'posts from followed users');
    } catch (error) {
      console.warn('[Activity Following] Error fetching posts:', error);
    }
    
    // 2. Get followers of each followed user (who started following them)
    // This shows "X started following Y" where Y is someone you follow
    for (const followedUsername of followingUsernames) {
      try {
        const followersData = await profileService.getFollowers(followedUsername);
        const followersList = followersData?.data?.followers || [];
        
        followersList.forEach((follower: any) => {
          // Don't show if it's the current user who followed them
          activities.push({
            id: `follow-${follower.id}-${followedUsername}-${follower.followed_at}`,
            type: 'follow',
            actorUsername: follower.username,
            summary: `👥 ${follower.username} started following ${followedUsername}`,
            timestamp: follower.followed_at || new Date().toISOString(),
            data: { ...follower, followedUser: followedUsername, followType: 'third-party' },
          });
        });
        console.log('[Activity Following] Added', followersList.length, 'follower activities for', followedUsername);
      } catch (error) {
        // Silently continue if we can't get followers for a user
      }
    }
    
    // 3. Get following list of each followed user (who they started following)
    // This shows "X started following Z" where X is someone you follow
    for (const followedUsername of followingUsernames) {
      try {
        const followingData = await profileService.getFollowing(followedUsername);
        const followingList = followingData?.data?.following || [];
        
        followingList.forEach((followedUser: any) => {
          activities.push({
            id: `follow-out-${followedUsername}-${followedUser.id}-${followedUser.followed_at}`,
            type: 'follow',
            actorUsername: followedUsername,
            summary: `👥 ${followedUsername} started following ${followedUser.username}`,
            timestamp: followedUser.followed_at || new Date().toISOString(),
            data: { ...followedUser, actor: followedUsername, followType: 'outgoing' },
          });
        });
        console.log('[Activity Following] Added', followingList.length, 'following activities for', followedUsername);
      } catch (error) {
        // Silently continue if we can't get following for a user
      }
    }
    
    // 4. Get achievements from followed users
    for (const followedUsername of followingUsernames) {
      try {
        const achievementsResponse = await achievementService.getUserAchievementsByUsername(followedUsername);
        const achievementsList = achievementsResponse?.data?.achievements || 
                                 achievementsResponse?.achievements || [];
        
        achievementsList.forEach((item: any) => {
          const achievementName = item.achievement?.name || item.achievement?.title || item.name || item.title || 'Achievement';
          activities.push({
            id: `achievement-${followedUsername}-${item.id || item.achievement?.id}`,
            type: 'achievement',
            actorUsername: followedUsername,
            summary: `🏆 ${followedUsername} earned: ${achievementName}`,
            timestamp: item.earned_at || item.created_at || new Date().toISOString(),
            data: item,
          });
        });
        console.log('[Activity Following] Added', achievementsList.length, 'achievements for', followedUsername);
      } catch (error) {
        // Silently continue if we can't get achievements for a user
      }
    }
    
    // 5. Get waste stats from followed users (only aggregate data available)
    for (const followedUsername of followingUsernames) {
      try {
        const response = await api.get(`/api/profile/${followedUsername}/waste-stats/`);
        const wasteStats = response.data;
        
        // Only add if user has public waste stats and has logged some waste
        if (wasteStats.total_waste && wasteStats.points !== null) {
          activities.push({
            id: `waste-stats-${followedUsername}`,
            type: 'waste',
            actorUsername: followedUsername,
            summary: `♻️ ${followedUsername} has recycled ${wasteStats.total_waste}kg (${wasteStats.points} points)`,
            timestamp: new Date().toISOString(), // No timestamp available for aggregate stats
            data: wasteStats,
          });
        }
        console.log('[Activity Following] Added waste stats for', followedUsername);
      } catch (error) {
        // Silently continue if we can't get waste stats for a user
      }
    }
    
    // Remove duplicates (same follow event seen from different perspectives)
    const uniqueActivities = activities.reduce((acc: ActivityItem[], curr) => {
      // Create a simpler key for deduplication
      const key = `${curr.type}-${curr.summary}`;
      if (!acc.find(a => `${a.type}-${a.summary}` === key)) {
        acc.push(curr);
      }
      return acc;
    }, []);
    
    // Sort by timestamp (newest first)
    uniqueActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    console.log('[Activity Following] Total unique activities:', uniqueActivities.length);
    return uniqueActivities;
  },
  
  // Get own activity history
  getOwnActivities: async (username?: string): Promise<ActivityItem[]> => {
    const activities: ActivityItem[] = [];
    
    // 0. Get user's own posts, likes, and dislikes
    if (username) {
      try {
        const postsResponse = await postService.getAllPosts();
        const allPosts = postsResponse.data || [];
        
        // Filter posts by current user (created posts)
        const myPosts = allPosts.filter((post: any) => 
          post.creator_username === username
        );
        
        myPosts.forEach((post: any) => {
          activities.push({
            id: `post-created-${post.id}`,
            type: 'post',
            actorUsername: 'You',
            summary: `📝 Created a post: "${(post.text || 'Shared a post').slice(0, 50)}${post.text?.length > 50 ? '...' : ''}"`,
            timestamp: post.date || post.created_at || new Date().toISOString(),
            data: post,
          });
        });
        console.log('[Activity] Added', myPosts.length, 'created posts');
        
        // Get ALL posts user liked (including own posts)
        const likedPosts = allPosts.filter((post: any) => post.is_user_liked);
        
        likedPosts.forEach((post: any) => {
          const isOwnPost = post.creator_username === username;
          const ownerText = isOwnPost ? 'your own' : `${post.creator_username}'s`;
          activities.push({
            id: `like-${post.id}`,
            type: 'like',
            actorUsername: 'You',
            summary: `👍 Liked ${ownerText} post: "${(post.text || 'a post').slice(0, 40)}${post.text?.length > 40 ? '...' : ''}"`,
            timestamp: post.date || post.created_at || new Date().toISOString(),
            data: post,
          });
        });
        console.log('[Activity] Added', likedPosts.length, 'liked posts');
        
        // Get ALL posts user disliked (including own posts)
        const dislikedPosts = allPosts.filter((post: any) => post.is_user_disliked);
        
        dislikedPosts.forEach((post: any) => {
          const isOwnPost = post.creator_username === username;
          const ownerText = isOwnPost ? 'your own' : `${post.creator_username}'s`;
          activities.push({
            id: `dislike-${post.id}`,
            type: 'dislike',
            actorUsername: 'You',
            summary: `👎 Disliked ${ownerText} post: "${(post.text || 'a post').slice(0, 40)}${post.text?.length > 40 ? '...' : ''}"`,
            timestamp: post.date || post.created_at || new Date().toISOString(),
            data: post,
          });
        });
        console.log('[Activity] Added', dislikedPosts.length, 'disliked posts');
      } catch (error) {
        console.warn('[Activity] Error fetching posts:', error);
      }
      
      // 0.5. Get user's follow activities (who they followed)
      try {
        const followingData = await profileService.getFollowing(username);
        const followingList = followingData?.data?.following || [];
        
        followingList.forEach((followedUser: any) => {
          activities.push({
            id: `follow-out-${followedUser.id}-${followedUser.followed_at}`,
            type: 'follow',
            actorUsername: 'You',
            summary: `👥 Started following ${followedUser.username}`,
            timestamp: followedUser.followed_at || new Date().toISOString(),
            data: { ...followedUser, followType: 'following' },
          });
        });
        console.log('[Activity] Added', followingList.length, 'following activities');
      } catch (error) {
        console.warn('[Activity] Error fetching following activities:', error);
      }
      
      // 0.6. Get who followed the user (followers)
      try {
        const followersData = await profileService.getFollowers(username);
        const followersList = followersData?.data?.followers || [];
        
        followersList.forEach((follower: any) => {
          activities.push({
            id: `follow-in-${follower.id}-${follower.followed_at}`,
            type: 'follow',
            actorUsername: follower.username,
            summary: `👥 ${follower.username} started following you`,
            timestamp: follower.followed_at || new Date().toISOString(),
            data: { ...follower, followType: 'follower' },
          });
        });
        console.log('[Activity] Added', followersList.length, 'follower activities');
      } catch (error) {
        console.warn('[Activity] Error fetching follower activities:', error);
      }
    }
    
    // 1. Get user's waste logs (individual records, not aggregates)
    try {
      const wasteResponse = await wasteService.getUserWastes();
      console.log('[Activity] Waste response:', JSON.stringify(wasteResponse).slice(0, 500));
      
      // Handle different response formats
      // Backend returns: { data: [ { waste_type, total_amount, records: [...] }, ... ] }
      const wasteData = wasteResponse?.data || wasteResponse || [];
      
      let totalRecords = 0;
      if (Array.isArray(wasteData) && wasteData.length > 0) {
        wasteData.forEach((wasteType: any) => {
          // Each wasteType has: waste_type, total_amount, records[]
          // We want individual records, not aggregates
          const records = wasteType.records || [];
          
          if (Array.isArray(records) && records.length > 0) {
            records.forEach((record: any) => {
              // Each record has: id, type, amount, date
              activities.push({
                id: `waste-${record.id || Date.now()}-${record.date}`,
                type: 'waste',
                actorUsername: 'You',
                summary: `♻️ Logged ${record.amount}g of ${record.type || wasteType.waste_type}`,
                timestamp: record.date || new Date().toISOString(),
                data: record,
              });
              totalRecords++;
            });
          }
        });
        console.log('[Activity] Added', totalRecords, 'individual waste records');
      } else {
        console.log('[Activity] No waste data found or empty array');
      }
    } catch (error) {
      console.warn('[Activity] Error fetching wastes:', error);
    }
    
    // 2. Get user's achievements
    try {
      const achievementsResponse = await achievementService.getUserAchievements();
      console.log('[Activity] Achievements response:', JSON.stringify(achievementsResponse).slice(0, 500));
      
      // Handle different response formats: 
      // Could be { data: { achievements: [...] } } or just an array
      const achievementsList = achievementsResponse?.data?.achievements || 
                               achievementsResponse?.achievements || 
                               (Array.isArray(achievementsResponse) ? achievementsResponse : []);
      
      if (Array.isArray(achievementsList) && achievementsList.length > 0) {
        achievementsList.forEach((item: any) => {
          const achievementName = item.achievement?.name || item.achievement?.title || item.name || item.title || 'Achievement';
          activities.push({
            id: `achievement-${item.id || item.achievement?.id || Date.now()}`,
            type: 'achievement',
            actorUsername: 'You',
            summary: `🏆 Earned: ${achievementName}`,
            timestamp: item.earned_at || item.joined_date || item.created_at || new Date().toISOString(),
            data: item,
          });
        });
        console.log('[Activity] Added', achievementsList.length, 'achievement activities');
      } else {
        console.log('[Activity] No achievements found');
      }
    } catch (error) {
      console.warn('[Activity] Error fetching achievements:', error);
    }
    
    // 3. Get user's enrolled challenges
    try {
      const challengesResponse = await challengeService.getEnrolledChallenges();
      console.log('[Activity] Enrolled challenges response:', JSON.stringify(challengesResponse).slice(0, 500));
      
      // Response could be array directly or { results: [...] }
      const challengesList = Array.isArray(challengesResponse) ? challengesResponse : 
                             challengesResponse?.results || [];
      
      if (Array.isArray(challengesList) && challengesList.length > 0) {
        // Also get challenge details to get titles
        let allChallenges: any[] = [];
        try {
          allChallenges = await challengeService.getChallenges();
        } catch (e) {
          console.warn('[Activity] Could not fetch challenge details');
        }
        
        challengesList.forEach((enrolled: any) => {
          const challengeId = enrolled.challenge;
          const challengeDetails = allChallenges.find((c: any) => c.id === challengeId);
          const challengeTitle = challengeDetails?.title || `Challenge #${challengeId}`;
          
          activities.push({
            id: `challenge-${enrolled.id || challengeId}-${enrolled.joined_date}`,
            type: 'challenge',
            actorUsername: 'You',
            summary: `🎯 Joined: ${challengeTitle}`,
            timestamp: enrolled.joined_date || enrolled.created_at || new Date().toISOString(),
            data: { ...enrolled, challengeDetails },
          });
        });
        console.log('[Activity] Added', challengesList.length, 'challenge activities');
      } else {
        console.log('[Activity] No enrolled challenges found');
      }
    } catch (error) {
      console.warn('[Activity] Error fetching challenges:', error);
    }
    
    console.log('[Activity] Total activities:', activities.length);
    
    // Sort by timestamp (newest first)
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return activities;
  },
};

export const profileService = {
  uploadProfilePicture: async (formData: FormData): Promise<any> => {
    // Use cached token for auth
    const token = cachedToken || await storage.getToken();

    // Use axios directly for multipart uploads to avoid Content-Type issues
    const response = await axios.post(`${API_URL}/api/profile/profile-picture/`, formData, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Don't set Content-Type - let the browser/RN set it with boundary
      },
    });
    return response.data;
  },
  updateBio: async (username: string, bio: string): Promise<any> => {
    const response = await api.put(`/api/profile/${username}/bio/`, { bio });
    return response.data;
  },
  
  // Follow a user
  followUser: async (username: string): Promise<any> => {
    const response = await api.post(`/api/profile/${username}/follow/`);
    return response.data;
  },
  
  // Unfollow a user
  unfollowUser: async (username: string): Promise<any> => {
    const response = await api.post(`/api/profile/${username}/unfollow/`);
    return response.data;
  },
  
  // Get follow status and counts for a user
  getFollowStatus: async (username: string): Promise<any> => {
    const response = await api.get(`/api/profile/${username}/follow-status/`);
    return response.data;
  },
  
  // Get list of followers
  getFollowers: async (username: string): Promise<any> => {
    const response = await api.get(`/api/profile/${username}/followers/`);
    return response.data;
  },
  
  // Get list of users being followed
  getFollowing: async (username: string): Promise<any> => {
    const response = await api.get(`/api/profile/${username}/following/`);
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
