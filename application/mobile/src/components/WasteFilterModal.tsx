import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { spacing, typography } from '../utils/theme';
import { MIN_TOUCH_TARGET } from '../utils/accessibility';
import { useRTL } from '../hooks/useRTL';

// Time range options
export type TimeRange = 'day' | 'week' | 'month' | 'year' | 'all' | 'custom';

// All available waste types
export const WASTE_TYPE_OPTIONS = [
  'PLASTIC',
  'PAPER',
  'GLASS',
  'METAL',
  'ELECTRONIC',
  'OIL&FATS',
  'ORGANIC',
] as const;

export type WasteType = typeof WASTE_TYPE_OPTIONS[number];

export interface WasteFilters {
  timeRange: TimeRange;
  customStartDate?: Date;
  customEndDate?: Date;
  wasteTypes: WasteType[];
}

interface WasteFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: WasteFilters) => void;
  currentFilters: WasteFilters;
}

export const getDefaultFilters = (): WasteFilters => ({
  timeRange: 'all',
  wasteTypes: [...WASTE_TYPE_OPTIONS],
});

export const WasteFilterModal: React.FC<WasteFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
}) => {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();
  const { textStyle, rowStyle } = useRTL();

  // Local state for filters (applied on confirm)
  const [timeRange, setTimeRange] = useState<TimeRange>(currentFilters.timeRange);
  const [selectedWasteTypes, setSelectedWasteTypes] = useState<WasteType[]>(currentFilters.wasteTypes);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(currentFilters.customStartDate);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(currentFilters.customEndDate);

  // Reset local state when modal opens
  useEffect(() => {
    if (visible) {
      setTimeRange(currentFilters.timeRange);
      setSelectedWasteTypes(currentFilters.wasteTypes);
      setCustomStartDate(currentFilters.customStartDate);
      setCustomEndDate(currentFilters.customEndDate);
    }
  }, [visible, currentFilters]);

  // Time range options with translations
  const TIME_RANGE_OPTIONS: { key: TimeRange; labelKey: string }[] = [
    { key: 'day', labelKey: 'filter.timeRanges.day' },
    { key: 'week', labelKey: 'filter.timeRanges.week' },
    { key: 'month', labelKey: 'filter.timeRanges.month' },
    { key: 'year', labelKey: 'filter.timeRanges.year' },
    { key: 'all', labelKey: 'filter.timeRanges.all' },
  ];

  // Toggle waste type selection
  const toggleWasteType = (wasteType: WasteType) => {
    setSelectedWasteTypes((prev) => {
      if (prev.includes(wasteType)) {
        // Don't allow deselecting all types
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== wasteType);
      } else {
        return [...prev, wasteType];
      }
    });
  };

  // Select/Deselect all waste types
  const toggleAllWasteTypes = () => {
    if (selectedWasteTypes.length === WASTE_TYPE_OPTIONS.length) {
      // Deselect all except first one (must have at least one)
      setSelectedWasteTypes([WASTE_TYPE_OPTIONS[0]]);
    } else {
      setSelectedWasteTypes([...WASTE_TYPE_OPTIONS]);
    }
  };

  // Apply filters
  const handleApply = () => {
    onApply({
      timeRange,
      wasteTypes: selectedWasteTypes,
      customStartDate,
      customEndDate,
    });
    onClose();
  };

  // Clear filters (reset to defaults)
  const handleClear = () => {
    const defaults = getDefaultFilters();
    setTimeRange(defaults.timeRange);
    setSelectedWasteTypes(defaults.wasteTypes);
    setCustomStartDate(undefined);
    setCustomEndDate(undefined);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, rowStyle]}>
            <Text style={[styles.modalTitle, textStyle, { color: colors.primary }]}>
              {t('filter.title')}
            </Text>
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButton}
              accessibilityLabel={t('filter.clearAll')}
              accessibilityRole="button"
            >
              <Text style={[styles.clearButtonText, { color: colors.error }]}>
                {t('filter.clearAll')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Time Range Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, textStyle, { color: colors.textPrimary }]}>
                {t('filter.timeRange')}
              </Text>
              <View style={styles.optionsContainer}>
                {TIME_RANGE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.optionChip,
                      { 
                        backgroundColor: timeRange === option.key 
                          ? colors.primary 
                          : colors.backgroundSecondary,
                        borderColor: timeRange === option.key 
                          ? colors.primary 
                          : colors.lightGray,
                      },
                    ]}
                    onPress={() => setTimeRange(option.key)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: timeRange === option.key }}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        {
                          color: timeRange === option.key
                            ? colors.textOnPrimary
                            : colors.textPrimary,
                        },
                      ]}
                    >
                      {t(option.labelKey)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Waste Types Section */}
            <View style={styles.section}>
              <View style={[styles.sectionHeader, rowStyle]}>
                <Text style={[styles.sectionTitle, textStyle, { color: colors.textPrimary }]}>
                  {t('filter.wasteTypes')}
                </Text>
                <TouchableOpacity
                  onPress={toggleAllWasteTypes}
                  style={styles.selectAllButton}
                  accessibilityLabel={
                    selectedWasteTypes.length === WASTE_TYPE_OPTIONS.length
                      ? t('filter.deselectAll')
                      : t('filter.selectAll')
                  }
                  accessibilityRole="button"
                >
                  <Text style={[styles.selectAllText, { color: colors.primary }]}>
                    {selectedWasteTypes.length === WASTE_TYPE_OPTIONS.length
                      ? t('filter.deselectAll')
                      : t('filter.selectAll')}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.wasteTypesGrid}>
                {WASTE_TYPE_OPTIONS.map((wasteType) => {
                  const isSelected = selectedWasteTypes.includes(wasteType);
                  return (
                    <TouchableOpacity
                      key={wasteType}
                      style={[
                        styles.wasteTypeChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.backgroundSecondary,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.lightGray,
                        },
                      ]}
                      onPress={() => toggleWasteType(wasteType)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      accessibilityLabel={t(`home.wasteTypes.${wasteType}`)}
                    >
                      <Text
                        style={[
                          styles.wasteTypeText,
                          {
                            color: isSelected
                              ? colors.textOnPrimary
                              : colors.textPrimary,
                          },
                        ]}
                      >
                        {t(`home.wasteTypes.${wasteType}`)}
                      </Text>
                      {isSelected && (
                        <Text style={[styles.checkmark, { color: colors.textOnPrimary }]}>
                          ✓
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Selected filters summary */}
            <View style={[styles.summarySection, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.summaryTitle, textStyle, { color: colors.textSecondary }]}>
                {t('filter.selectedFilters')}
              </Text>
              <Text style={[styles.summaryText, textStyle, { color: colors.textPrimary }]}>
                {t('filter.timeRange')}: {t(`filter.timeRanges.${timeRange}`)}
              </Text>
              <Text style={[styles.summaryText, textStyle, { color: colors.textPrimary }]}>
                {t('filter.wasteTypes')}: {selectedWasteTypes.length}/{WASTE_TYPE_OPTIONS.length} {t('filter.selected')}
              </Text>
            </View>
          </ScrollView>

          {/* Footer buttons */}
          <View style={styles.footerButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.lightGray }]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApply}
              accessibilityRole="button"
              accessibilityLabel={t('filter.apply')}
            >
              <Text style={[styles.applyButtonText, { color: colors.textOnPrimary }]}>
                {t('filter.apply')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl + 20 : spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
  },
  clearButton: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  clearButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 0,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  selectAllButton: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  selectAllText: {
    ...typography.caption,
    fontWeight: '600',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionChipText: {
    ...typography.body,
    fontWeight: '500',
  },
  wasteTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  wasteTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
  },
  wasteTypeText: {
    ...typography.body,
    fontWeight: '500',
  },
  checkmark: {
    marginLeft: spacing.xs,
    fontSize: 14,
    fontWeight: 'bold',
  },
  summarySection: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    ...typography.caption,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.button,
  },
  applyButton: {
    flex: 2,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    ...typography.button,
  },
});

export default WasteFilterModal;

