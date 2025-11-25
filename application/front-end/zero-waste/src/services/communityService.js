// src/services/communityService.js
import apiClient from './api';

const communityService = {
    /**
     * Get community statistics
     * Returns aggregated statistics about the community
     */
    getCommunityStats: async () => {
        try {
            // TODO: Uncomment when backend endpoint is ready
            // const response = await apiClient.get('/api/community/stats/');
            // return response.data;

            // Hardcoded fallback values for now
            return {
                data: {
                    totalPosts: 1247,
                    totalTips: 856,
                    activeChallenges: 42,
                    totalUsers: 3521,
                    totalWasteRecycled: 125847, // in grams
                }
            };
        } catch (error) {
            console.error('Failed to fetch community stats:', error);
            // Return fallback data on error
            return {
                data: {
                    totalPosts: 1247,
                    totalTips: 856,
                    activeChallenges: 42,
                    totalUsers: 3521,
                    totalWasteRecycled: 125847,
                }
            };
        }
    },
};

export default communityService;
