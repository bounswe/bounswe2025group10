// src/services/badgesService.js
import apiClient from './api.js';

export const badgesService = {
  // Get user badges
  getUserBadges: async (token, userId = null) => {
    const url = userId ? `/api/badges/user/${userId}/` : '/api/badges/user/';
    const response = await apiClient.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get badge progress
  getBadgeProgress: async (token) => {
    const response = await apiClient.get('/api/badges/progress/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get user badge summary (badges + progress)
  getUserBadgeSummary: async (token, userId = null) => {
    const url = userId ? `/api/badges/summary/${userId}/` : '/api/badges/summary/';
    const response = await apiClient.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get all available badges
  getAllBadges: async (token, category = null) => {
    const url = category ? `/api/badges/all/?category=${category}` : '/api/badges/all/';
    const response = await apiClient.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Manually check and award badges
  manuallyCheckBadges: async (token) => {
    const response = await apiClient.post('/api/badges/manual-check/', {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get badge leaderboard
  getBadgeLeaderboard: async (token) => {
    const response = await apiClient.get('/api/badges/leaderboard/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
