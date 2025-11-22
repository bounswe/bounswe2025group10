// src/services/tipsService.js
import apiClient from './api.js';

export const tipsService = {
  // Get all tips
  getTips: async (token) => {
    const response = await apiClient.get('/api/tips/all', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get tips from a specific URL (for pagination)
  getTipsFromUrl: async (url, token) => {
    // Extract path from full URL (e.g., "http://...api/tips/all/?page=2" -> "/api/tips/all/?page=2")
    const path = url.includes('://') ? new URL(url).pathname + new URL(url).search : url;
    const response = await apiClient.get(path, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get recent tips
  getRecentTips: async () => {
    const response = await apiClient.get('/api/tips/get_recent_tips');
    return response.data;
  },

  // Create a new tip
  createTip: async (tipData, token) => {
    const response = await apiClient.post('/api/tips/create/', tipData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Like a tip
  likeTip: async (tipId, token) => {
    const response = await apiClient.post(`/api/tips/${tipId}/like/`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Dislike a tip
  dislikeTip: async (tipId, token) => {
    const response = await apiClient.post(`/api/tips/${tipId}/dislike/`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Report a tip
  reportTip: async (tipId, reportData, token) => {
    const response = await apiClient.post(`/api/tips/${tipId}/report/`, reportData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};