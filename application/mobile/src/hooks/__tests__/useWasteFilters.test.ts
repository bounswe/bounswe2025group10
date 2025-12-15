import {
  getStartDateForRange,
  filterRecordsByDate,
  filterWasteData,
  hasActiveFilters,
  WasteDataItem,
  WasteRecord,
} from '../useWasteFilters';
import { WasteFilters, getDefaultFilters, WASTE_TYPE_OPTIONS } from '../../components/WasteFilterModal';

describe('useWasteFilters', () => {
  // Mock data for testing
  const mockRecords: WasteRecord[] = [
    { id: 1, type: 'PLASTIC', amount: 2.5, date: new Date().toISOString() }, // Today
    { id: 2, type: 'PLASTIC', amount: 1.5, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }, // 3 days ago
    { id: 3, type: 'PLASTIC', amount: 3.0, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }, // 10 days ago
    { id: 4, type: 'PLASTIC', amount: 2.0, date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() }, // 45 days ago
    { id: 5, type: 'PLASTIC', amount: 5.0, date: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString() }, // Over a year ago
  ];

  const mockWasteData: WasteDataItem[] = [
    {
      waste_type: 'PLASTIC',
      total_amount: 14.0,
      records: mockRecords,
    },
    {
      waste_type: 'PAPER',
      total_amount: 5.0,
      records: [
        { id: 6, type: 'PAPER', amount: 5.0, date: new Date().toISOString() },
      ],
    },
    {
      waste_type: 'GLASS',
      total_amount: 3.0,
      records: [
        { id: 7, type: 'GLASS', amount: 3.0, date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
      ],
    },
  ];

  describe('getStartDateForRange', () => {
    it('should return null for "all" time range', () => {
      const result = getStartDateForRange('all');
      expect(result).toBeNull();
    });

    it('should return start of today for "day" time range', () => {
      const result = getStartDateForRange('day');
      expect(result).not.toBeNull();
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      expect(result!.getTime()).toBe(now.getTime());
    });

    it('should return 7 days ago for "week" time range', () => {
      const result = getStartDateForRange('week');
      expect(result).not.toBeNull();
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      expect(result!.getTime()).toBe(weekAgo.getTime());
    });

    it('should return 30 days ago for "month" time range', () => {
      const result = getStartDateForRange('month');
      expect(result).not.toBeNull();
      
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      monthAgo.setHours(0, 0, 0, 0);
      expect(result!.getTime()).toBe(monthAgo.getTime());
    });

    it('should return 1 year ago for "year" time range', () => {
      const result = getStartDateForRange('year');
      expect(result).not.toBeNull();
      
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      yearAgo.setHours(0, 0, 0, 0);
      expect(result!.getTime()).toBe(yearAgo.getTime());
    });
  });

  describe('filterRecordsByDate', () => {
    it('should return all records when no date filters are provided', () => {
      const result = filterRecordsByDate(mockRecords, null, null);
      expect(result.length).toBe(mockRecords.length);
    });

    it('should filter records after start date', () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const result = filterRecordsByDate(mockRecords, startDate, null);
      
      // Should include records from today and 3 days ago
      expect(result.length).toBe(2);
      expect(result.map(r => r.id)).toContain(1);
      expect(result.map(r => r.id)).toContain(2);
    });

    it('should filter records before end date', () => {
      const endDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const result = filterRecordsByDate(mockRecords, null, endDate);
      
      // Should include records from 10 days, 45 days, and over a year ago
      expect(result.length).toBe(3);
      expect(result.map(r => r.id)).toContain(3);
      expect(result.map(r => r.id)).toContain(4);
      expect(result.map(r => r.id)).toContain(5);
    });

    it('should filter records between start and end dates', () => {
      const startDate = new Date(Date.now() - 50 * 24 * 60 * 60 * 1000); // 50 days ago
      const endDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const result = filterRecordsByDate(mockRecords, startDate, endDate);
      
      // Should include records from 10 days and 45 days ago
      expect(result.length).toBe(2);
      expect(result.map(r => r.id)).toContain(3);
      expect(result.map(r => r.id)).toContain(4);
    });
  });

  describe('filterWasteData', () => {
    it('should return all data with default filters', () => {
      const filters = getDefaultFilters();
      const result = filterWasteData(mockWasteData, filters);
      
      expect(result.length).toBe(mockWasteData.length);
    });

    it('should filter by waste types', () => {
      const filters: WasteFilters = {
        timeRange: 'all',
        wasteTypes: ['PLASTIC', 'PAPER'],
      };
      const result = filterWasteData(mockWasteData, filters);
      
      expect(result.length).toBe(2);
      expect(result.map(r => r.waste_type)).toContain('PLASTIC');
      expect(result.map(r => r.waste_type)).toContain('PAPER');
      expect(result.map(r => r.waste_type)).not.toContain('GLASS');
    });

    it('should filter by time range and recalculate totals', () => {
      const filters: WasteFilters = {
        timeRange: 'week',
        wasteTypes: [...WASTE_TYPE_OPTIONS],
      };
      const result = filterWasteData(mockWasteData, filters);
      
      // PLASTIC should only have records from today and 3 days ago
      const plastic = result.find(r => r.waste_type === 'PLASTIC');
      expect(plastic).toBeDefined();
      expect(plastic!.records.length).toBe(2);
      expect(plastic!.total_amount).toBe(4.0); // 2.5 + 1.5
      
      // PAPER should have today's record
      const paper = result.find(r => r.waste_type === 'PAPER');
      expect(paper).toBeDefined();
      expect(paper!.records.length).toBe(1);
      expect(paper!.total_amount).toBe(5.0);
      
      // GLASS should have no records (20 days ago is outside week)
      const glass = result.find(r => r.waste_type === 'GLASS');
      expect(glass).toBeDefined();
      expect(glass!.records.length).toBe(0);
      expect(glass!.total_amount).toBe(0);
    });

    it('should combine waste type and time range filters', () => {
      const filters: WasteFilters = {
        timeRange: 'month',
        wasteTypes: ['PLASTIC', 'GLASS'],
      };
      const result = filterWasteData(mockWasteData, filters);
      
      expect(result.length).toBe(2);
      
      // PLASTIC should have records from today, 3 days ago, and 10 days ago
      const plastic = result.find(r => r.waste_type === 'PLASTIC');
      expect(plastic!.records.length).toBe(3);
      expect(plastic!.total_amount).toBe(7.0); // 2.5 + 1.5 + 3.0
      
      // GLASS should have its record (20 days ago is within month)
      const glass = result.find(r => r.waste_type === 'GLASS');
      expect(glass!.records.length).toBe(1);
      expect(glass!.total_amount).toBe(3.0);
    });

    it('should handle empty waste types array by returning empty results', () => {
      const filters: WasteFilters = {
        timeRange: 'all',
        wasteTypes: [],
      };
      const result = filterWasteData(mockWasteData, filters);
      
      expect(result.length).toBe(0);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false for default filters', () => {
      const filters = getDefaultFilters();
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when time range is changed', () => {
      const filters: WasteFilters = {
        timeRange: 'week',
        wasteTypes: [...WASTE_TYPE_OPTIONS],
      };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when waste types are reduced', () => {
      const filters: WasteFilters = {
        timeRange: 'all',
        wasteTypes: ['PLASTIC', 'PAPER'],
      };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when both time range and waste types are changed', () => {
      const filters: WasteFilters = {
        timeRange: 'month',
        wasteTypes: ['PLASTIC'],
      };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return false when waste types are same but in different order', () => {
      const filters: WasteFilters = {
        timeRange: 'all',
        wasteTypes: [...WASTE_TYPE_OPTIONS].reverse(),
      };
      // Since we sort before comparing, order shouldn't matter
      expect(hasActiveFilters(filters)).toBe(false);
    });
  });

  describe('getDefaultFilters', () => {
    it('should return default filter values', () => {
      const defaults = getDefaultFilters();
      
      expect(defaults.timeRange).toBe('all');
      expect(defaults.wasteTypes).toEqual(WASTE_TYPE_OPTIONS);
      expect(defaults.customStartDate).toBeUndefined();
      expect(defaults.customEndDate).toBeUndefined();
    });
  });
});

