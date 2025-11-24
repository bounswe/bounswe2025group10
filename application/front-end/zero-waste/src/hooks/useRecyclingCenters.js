// src/hooks/useRecyclingCenters.js
import { useState, useEffect } from 'react';
import { recyclingCentersService } from '../services/recyclingCentersService';
import { useApi } from './useApi';

export const useRecyclingCenters = () => {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Fetch cities
  const {
    data: cities,
    loading: citiesLoading,
    error: citiesError,
    execute: fetchCities,
  } = useApi(
    () => recyclingCentersService.getCities(),
    {
      initialData: [],
      showErrorToast: true,
      errorMessage: 'Failed to fetch cities',
    }
  );

  // Fetch districts
  const {
    data: districts,
    loading: districtsLoading,
    execute: fetchDistricts,
    setData: setDistricts,
  } = useApi(
    (city) => recyclingCentersService.getDistricts(city),
    {
      initialData: [],
      showErrorToast: true,
      errorMessage: 'Failed to fetch districts',
    }
  );

  // Fetch centers
  const {
    data: centers,
    loading: centersLoading,
    execute: fetchCenters,
    setData: setCenters,
  } = useApi(
    (city, district) => recyclingCentersService.getCenters(city, district),
    {
      initialData: [],
      showErrorToast: true,
      errorMessage: 'Failed to fetch recycling centers',
    }
  );

  // Load cities on mount
  useEffect(() => {
    fetchCities();
  }, []);

  // Load districts when city changes
  useEffect(() => {
    if (selectedCity) {
      fetchDistricts(selectedCity);
    } else {
      setDistricts([]);
    }
  }, [selectedCity]);

  // Load centers when district changes
  useEffect(() => {
    if (selectedCity && selectedDistrict) {
      fetchCenters(selectedCity, selectedDistrict);
    } else {
      setCenters([]);
    }
  }, [selectedCity, selectedDistrict]);

  // Handle city change
  const handleCityChange = (city) => {
    setSelectedCity(city);
    setSelectedDistrict('');
    setCenters([]);
  };

  // Handle district change
  const handleDistrictChange = (district) => {
    setSelectedDistrict(district);
  };

  return {
    // Data
    cities,
    districts,
    centers,

    // Loading states
    citiesLoading,
    districtsLoading,
    centersLoading,

    // Selection
    selectedCity,
    selectedDistrict,
    handleCityChange,
    handleDistrictChange,

    // Errors
    citiesError,
  };
};
