// src/services/achievementsService.js
import apiClient from './api.js';

export const achievementsService = {
  // Get user achievements
  getAchievements: async (token) => {
    const response = await apiClient.get('/api/achievements/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data?.achievements || [];
  },

  // Get achievements for specific user
  getUserAchievements: async (username) => {
    const response = await apiClient.get(`/api/achievements/${username}/`);
    return response.data;
  },
};