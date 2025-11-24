// src/services/leaderboardService.js
import apiClient from './api.js';

const DEFAULT_PROFILE_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541";

export const leaderboardService = {
  // Get leaderboard data
  getLeaderboard: async (token) => {
    const response = await apiClient.get('/api/waste/leaderboard/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const { top_users, current_user } = response.data.data;
    
    // Process leaderboard
    const leaderboard = top_users.map((user, index) => ({
      username: user.username,
      score: user.total_waste,
      points: Math.round(user.points || 0),
      profileImage: user.profile_picture || DEFAULT_PROFILE_IMAGE,
      rank: user.rank,
      isCurrentUser: current_user && user.username === current_user.username
    }));
    
    // Process user rank if not in top 10
    let userRank = null;
    if (current_user && current_user.rank > 10) {
      userRank = {
        position: current_user.rank,
        username: current_user.username,
        score: current_user.total_waste,
        points: Math.round(current_user.points || 0),
        profileImage: current_user.profile_picture || DEFAULT_PROFILE_IMAGE
      };
    }
    
    return { leaderboard, userRank };
  },

  // Get user bio
  getUserBio: async (username) => {
    const response = await apiClient.get(`/api/profile/${username}/bio/`);
    return response.data.bio;
  },
};