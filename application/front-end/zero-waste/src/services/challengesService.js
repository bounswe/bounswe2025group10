// src/services/challengesService.js
import apiClient, { createAuthenticatedFetch } from './api.js';

export const challengesService = {
  // Get all challenges
  getChallenges: async (token) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await apiClient.get('/api/challenges/', config);
    return response.data; // Return full paginated response
  },

  // Get challenges from a specific URL (for pagination)
  getChallengesFromUrl: async (url, token) => {
    // Extract path from full URL (e.g., "http://...api/challenges/?page=2" -> "/api/challenges/?page=2")
    const path = url.includes('://') ? new URL(url).pathname + new URL(url).search : url;
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await apiClient.get(path, config);
    return response.data;
  },

  // Create new challenge
  createChallenge: async (challengeData, token) => {
    const response = await apiClient.post('/api/challenges/', challengeData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Enroll in challenge (participate)
  enrollInChallenge: async (challengeId, token) => {
    const response = await apiClient.post('/api/challenges/participate/',
      { challenge: challengeId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Get enrolled challenges
  getEnrolledChallenges: async (token) => {
    const response = await apiClient.get('/api/challenges/enrolled/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; // Return full paginated response
  },

  // Get enrolled challenges from a specific URL (for pagination)
  getEnrolledChallengesFromUrl: async (url, token) => {
    // Extract path from full URL (e.g., "http://...api/challenges/enrolled/?page=2" -> "/api/challenges/enrolled/?page=2")
    const path = url.includes('://') ? new URL(url).pathname + new URL(url).search : url;
    const response = await apiClient.get(path, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Submit challenge progress
  submitProgress: async (challengeId, amount, token) => {
    const response = await apiClient.post(`/api/challenges/${challengeId}/submit/`,
      { amount },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Report challenge
  reportChallenge: async (challengeId, reason, description, token) => {
    const response = await apiClient.post(
      `/api/challenge/${challengeId}/report/`,
      { reason, description },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
};