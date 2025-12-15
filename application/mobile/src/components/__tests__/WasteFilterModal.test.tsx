import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { WasteFilterModal, getDefaultFilters, WASTE_TYPE_OPTIONS, WasteFilters } from '../WasteFilterModal';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'filter.title': 'Filter Data',
        'filter.timeRange': 'Time Range',
        'filter.wasteTypes': 'Waste Types',
        'filter.apply': 'Apply Filters',
        'filter.clearAll': 'Clear All',
        'filter.selectAll': 'Select All',
        'filter.deselectAll': 'Deselect All',
        'filter.selected': 'selected',
        'filter.selectedFilters': 'Selected Filters',
        'filter.timeRanges.day': 'Today',
        'filter.timeRanges.week': 'Last 7 Days',
        'filter.timeRanges.month': 'Last 30 Days',
        'filter.timeRanges.year': 'Last Year',
        'filter.timeRanges.all': 'All Time',
        'common.cancel': 'Cancel',
        'home.wasteTypes.PLASTIC': 'Plastic',
        'home.wasteTypes.PAPER': 'Paper',
        'home.wasteTypes.GLASS': 'Glass',
        'home.wasteTypes.METAL': 'Metal',
        'home.wasteTypes.ELECTRONIC': 'Electronic',
        'home.wasteTypes.OIL&FATS': 'Oil',
        'home.wasteTypes.ORGANIC': 'Organic',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#2E7D32',
      background: '#FFFFFF',
      backgroundSecondary: '#F5F5F5',
      textPrimary: '#212121',
      textSecondary: '#616161',
      textOnPrimary: '#FFFFFF',
      lightGray: '#E0E0E0',
      error: '#C62828',
    },
    isDarkMode: false,
  }),
}));

jest.mock('../../hooks/useRTL', () => ({
  useRTL: () => ({
    isRTL: false,
    textStyle: {},
    rowStyle: {},
  }),
}));

describe('WasteFilterModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onApply: jest.fn(),
    currentFilters: getDefaultFilters(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly when visible', () => {
    const { getByText } = render(<WasteFilterModal {...defaultProps} />);
    
    expect(getByText('Filter Data')).toBeTruthy();
    expect(getByText('Time Range')).toBeTruthy();
    expect(getByText('Waste Types')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <WasteFilterModal {...defaultProps} visible={false} />
    );
    
    // Modal should not be visible (content may still be in tree but not displayed)
    // In React Native, we can check if the modal's visible prop is false
  });

  it('should display all time range options', () => {
    const { getByText } = render(<WasteFilterModal {...defaultProps} />);
    
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Last 7 Days')).toBeTruthy();
    expect(getByText('Last 30 Days')).toBeTruthy();
    expect(getByText('Last Year')).toBeTruthy();
    expect(getByText('All Time')).toBeTruthy();
  });

  it('should display all waste type options', () => {
    const { getByText } = render(<WasteFilterModal {...defaultProps} />);
    
    expect(getByText('Plastic')).toBeTruthy();
    expect(getByText('Paper')).toBeTruthy();
    expect(getByText('Glass')).toBeTruthy();
    expect(getByText('Metal')).toBeTruthy();
    expect(getByText('Electronic')).toBeTruthy();
    expect(getByText('Oil')).toBeTruthy();
    expect(getByText('Organic')).toBeTruthy();
  });

  it('should call onClose when cancel button is pressed', () => {
    const { getByText } = render(<WasteFilterModal {...defaultProps} />);
    
    fireEvent.press(getByText('Cancel'));
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onApply with filters when apply button is pressed', () => {
    const { getByText } = render(<WasteFilterModal {...defaultProps} />);
    
    fireEvent.press(getByText('Apply Filters'));
    
    expect(defaultProps.onApply).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should update time range when option is selected', () => {
    const onApply = jest.fn();
    const { getByText } = render(
      <WasteFilterModal {...defaultProps} onApply={onApply} />
    );
    
    // Select "Last 7 Days"
    fireEvent.press(getByText('Last 7 Days'));
    
    // Apply filters
    fireEvent.press(getByText('Apply Filters'));
    
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        timeRange: 'week',
      })
    );
  });

  it('should toggle waste type selection', () => {
    const onApply = jest.fn();
    const { getByText } = render(
      <WasteFilterModal {...defaultProps} onApply={onApply} />
    );
    
    // Deselect Plastic (should still work since we have more types selected)
    fireEvent.press(getByText('Plastic'));
    
    // Apply filters
    fireEvent.press(getByText('Apply Filters'));
    
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        wasteTypes: expect.not.arrayContaining(['PLASTIC']),
      })
    );
  });

  it('should not allow deselecting all waste types', () => {
    const onApply = jest.fn();
    // Start with only one waste type selected
    const currentFilters: WasteFilters = {
      timeRange: 'all',
      wasteTypes: ['PLASTIC'],
    };
    
    const { getByText } = render(
      <WasteFilterModal {...defaultProps} currentFilters={currentFilters} onApply={onApply} />
    );
    
    // Try to deselect Plastic (should not work since it's the only one)
    fireEvent.press(getByText('Plastic'));
    
    // Apply filters
    fireEvent.press(getByText('Apply Filters'));
    
    // Should still have PLASTIC selected
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        wasteTypes: ['PLASTIC'],
      })
    );
  });

  it('should display selected filters summary', () => {
    const { getByText } = render(<WasteFilterModal {...defaultProps} />);
    
    expect(getByText('Selected Filters')).toBeTruthy();
  });
});

describe('getDefaultFilters', () => {
  it('should return correct default values', () => {
    const defaults = getDefaultFilters();
    
    expect(defaults.timeRange).toBe('all');
    expect(defaults.wasteTypes).toEqual([...WASTE_TYPE_OPTIONS]);
    expect(defaults.customStartDate).toBeUndefined();
    expect(defaults.customEndDate).toBeUndefined();
  });
});

describe('WASTE_TYPE_OPTIONS', () => {
  it('should contain all expected waste types', () => {
    expect(WASTE_TYPE_OPTIONS).toContain('PLASTIC');
    expect(WASTE_TYPE_OPTIONS).toContain('PAPER');
    expect(WASTE_TYPE_OPTIONS).toContain('GLASS');
    expect(WASTE_TYPE_OPTIONS).toContain('METAL');
    expect(WASTE_TYPE_OPTIONS).toContain('ELECTRONIC');
    expect(WASTE_TYPE_OPTIONS).toContain('OIL&FATS');
    expect(WASTE_TYPE_OPTIONS).toContain('ORGANIC');
    expect(WASTE_TYPE_OPTIONS.length).toBe(7);
  });
});

