// src/services/recyclingCentersService.js
import apiClient from './api.js';

export const recyclingCentersService = {
  // Get all cities
  getCities: async () => {
    const response = await apiClient.get('/api/recycling-centers/cities/');
    return response.data;
  },

  // Get districts for a specific city
  getDistricts: async (city) => {
    const response = await apiClient.get('/api/recycling-centers/districts/', {
      params: { city },
    });
    return response.data;
  },

  // Get recycling centers for a specific city and district
  getCenters: async (city, district) => {
    const response = await apiClient.get('/api/recycling-centers/', {
      params: { city, district },
    });
    return response.data;
  },
};
