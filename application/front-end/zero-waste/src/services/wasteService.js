// src/services/wasteService.js
import apiClient from './api';

const wasteService = {
  /**
   * Get all waste data for the current user
   */
  getWasteData: async () => {
    try {
      const response = await apiClient.get('/api/waste/get/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch waste data:', error);
      throw error;
    }
  },

  /**
   * Add new waste entry
   * @param {Object} wasteData - { waste_type: string, amount: number }
   */
  addWaste: async (wasteData) => {
    try {
      const response = await apiClient.post('/api/waste/', wasteData);
      return response.data;
    } catch (error) {
      console.error('Failed to add waste:', error);
      throw error;
    }
  },

  /**
   * Transform backend waste data to chart format
   * @param {Array} backendData - Raw data from API
   */
  transformWasteDataForChart: (backendData) => {
    if (!Array.isArray(backendData)) {
      console.error('Waste data is not an array:', backendData);
      return [];
    }
    return backendData.map((item) => ({
      type: item.waste_type.charAt(0) + item.waste_type.slice(1).toLowerCase(),
      quantity: item.total_amount,
    }));
  },
};

export default wasteService;
