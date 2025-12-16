// src/services/statisticsService.js
import apiClient from './api';

const statisticsService = {
    /**
     * Get system-wide statistics
     * @returns {Promise} Statistics data including total tips, posts, challenges, and CO2
     */
    getSystemStatistics: async () => {
        const response = await apiClient.get('/api/statistics/');
        return response.data;
    },

    /**
     * Get statistics for a specific user
     * @param {string} username - The username to fetch statistics for
     * @returns {Promise} User-specific statistics
     */
    getUserStatistics: async (username) => {
        const response = await apiClient.get(`/api/statistics/${username}/`);
        return response.data;
    },
};

export default statisticsService;
