import { useState, useMemo, useCallback } from 'react';
import { WasteFilters, TimeRange, WasteType, getDefaultFilters, WASTE_TYPE_OPTIONS } from '../components/WasteFilterModal';

// Individual waste record type (from API)
export interface WasteRecord {
  id: number;
  type: string;
  amount: number;
  date: string; // ISO date string
}

// Waste data grouped by type (from API)
export interface WasteDataItem {
  waste_type: string;
  total_amount: number;
  records: WasteRecord[];
}

// Filtered result for charts
export interface FilteredWasteData {
  waste_type: string;
  total_amount: number;
  records: WasteRecord[];
}

/**
 * Get the start date for a given time range
 */
export const getStartDateForRange = (range: TimeRange): Date | null => {
  const now = new Date();
  
  switch (range) {
    case 'day':
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      return dayStart;
    
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);
      return weekStart;
    
    case 'month':
      const monthStart = new Date(now);
      monthStart.setMonth(now.getMonth() - 1);
      monthStart.setHours(0, 0, 0, 0);
      return monthStart;
    
    case 'year':
      const yearStart = new Date(now);
      yearStart.setFullYear(now.getFullYear() - 1);
      yearStart.setHours(0, 0, 0, 0);
      return yearStart;
    
    case 'all':
    default:
      return null; // No time filtering
  }
};

/**
 * Filter waste records by date range
 */
export const filterRecordsByDate = (
  records: WasteRecord[],
  startDate: Date | null,
  endDate?: Date | null
): WasteRecord[] => {
  if (!startDate && !endDate) {
    return records;
  }

  return records.filter((record) => {
    const recordDate = new Date(record.date);
    
    if (startDate && recordDate < startDate) {
      return false;
    }
    
    if (endDate && recordDate > endDate) {
      return false;
    }
    
    return true;
  });
};

/**
 * Filter waste data by waste types and time range
 */
export const filterWasteData = (
  data: WasteDataItem[],
  filters: WasteFilters
): FilteredWasteData[] => {
  // Get date range
  const startDate = filters.timeRange === 'custom' 
    ? filters.customStartDate || null
    : getStartDateForRange(filters.timeRange);
  
  const endDate = filters.timeRange === 'custom'
    ? filters.customEndDate || null
    : null;

  // Filter by waste types
  const filteredByType = data.filter((item) => 
    filters.wasteTypes.includes(item.waste_type as WasteType)
  );

  // Filter records by date and recalculate totals
  return filteredByType.map((item) => {
    const filteredRecords = filterRecordsByDate(item.records, startDate, endDate);

    // If records array is empty (API doesn't provide individual records),
    // use the original total_amount instead of recalculating
    const totalAmount = item.records.length === 0
      ? item.total_amount
      : filteredRecords.reduce((sum, record) => sum + record.amount, 0);

    return {
      waste_type: item.waste_type,
      total_amount: totalAmount,
      records: filteredRecords,
    };
  });
};

/**
 * Check if any filters are active (different from defaults)
 */
export const hasActiveFilters = (filters: WasteFilters): boolean => {
  const defaults = getDefaultFilters();
  
  // Check time range
  if (filters.timeRange !== defaults.timeRange) {
    return true;
  }
  
  // Check waste types (compare sorted arrays)
  const sortedFilters = [...filters.wasteTypes].sort();
  const sortedDefaults = [...defaults.wasteTypes].sort();
  
  if (sortedFilters.length !== sortedDefaults.length) {
    return true;
  }
  
  for (let i = 0; i < sortedFilters.length; i++) {
    if (sortedFilters[i] !== sortedDefaults[i]) {
      return true;
    }
  }
  
  return false;
};

/**
 * Custom hook for managing waste filters and filtered data
 */
export const useWasteFilters = (wasteData: WasteDataItem[]) => {
  const [filters, setFilters] = useState<WasteFilters>(getDefaultFilters());
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Memoized filtered data
  const filteredData = useMemo(() => {
    return filterWasteData(wasteData, filters);
  }, [wasteData, filters]);

  // Check if filters are active
  const filtersActive = useMemo(() => {
    return hasActiveFilters(filters);
  }, [filters]);

  // Get total filtered amount
  const totalFilteredAmount = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.total_amount, 0);
  }, [filteredData]);

  // Get count of filtered records
  const totalFilteredRecords = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.records.length, 0);
  }, [filteredData]);

  // Callbacks
  const openFilterModal = useCallback(() => {
    setIsFilterModalVisible(true);
  }, []);

  const closeFilterModal = useCallback(() => {
    setIsFilterModalVisible(false);
  }, []);

  const applyFilters = useCallback((newFilters: WasteFilters) => {
    setFilters(newFilters);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(getDefaultFilters());
  }, []);

  return {
    // State
    filters,
    filteredData,
    filtersActive,
    isFilterModalVisible,
    
    // Computed values
    totalFilteredAmount,
    totalFilteredRecords,
    
    // Actions
    openFilterModal,
    closeFilterModal,
    applyFilters,
    resetFilters,
    setFilters,
  };
};

export default useWasteFilters;

