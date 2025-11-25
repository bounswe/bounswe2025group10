// src/services/tipsService.js
import apiClient from './api.js';

export const tipsService = {
  // Get all tips
  getTips: async (token, lang, pageSize) => {
    const params = {};
    if (lang) params.lang = lang;
    if (pageSize) params.page_size = pageSize;

    const response = await apiClient.get('/api/tips/all', {
      headers: { Authorization: `Bearer ${token} ` },
      params,
    });
    return response.data;
  },

  // Get tips from a specific URL (for pagination)
  getTipsFromUrl: async (url, token, lang, pageSize) => {
    // Extract path from full URL (e.g., "http://...api/tips/all/?page=2" -> "/api/tips/all/?page=2")
    const path = url.includes('://') ? new URL(url).pathname + new URL(url).search : url;
    const params = {};
    if (lang) params.lang = lang;
    if (pageSize) params.page_size = pageSize;

    const response = await apiClient.get(path, {
      headers: { Authorization: `Bearer ${token} ` },
      params,
    });
    return response.data;
  },

  // Get recent tips
  getRecentTips: async (lang) => {
    const response = await apiClient.get('/api/tips/get_recent_tips', {
      params: { lang },
    });
    return response.data;
  },

  // Create a new tip
  createTip: async (tipData, token, lang) => {
    const payload = { ...tipData };
    if (lang) {
      payload.lang = lang;
    }
    const response = await apiClient.post('/api/tips/create/', payload, {
      headers: { Authorization: `Bearer ${token} ` },
    });
    return response.data;
  },

  // Like a tip
  likeTip: async (tipId, token) => {
    const response = await apiClient.post(`/api/tips/${tipId}/like/`, {}, {
      headers: { Authorization: `Bearer ${token} ` },
    });
    return response.data;
  },

  // Dislike a tip
  dislikeTip: async (tipId, token) => {
    const response = await apiClient.post(`/api/tips/${tipId}/dislike/`, {}, {
      headers: { Authorization: `Bearer ${token} ` },
    });
    return response.data;
  },

  // Report a tip
  reportTip: async (tipId, reportData, token) => {
    const response = await apiClient.post(`/ api / tips / ${tipId} /report/`, reportData, {
      headers: { Authorization: `Bearer ${token} ` },
    });
    return response.data;
  },
};