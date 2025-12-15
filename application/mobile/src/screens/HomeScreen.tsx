import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Dimensions,
  RefreshControl,
  Modal,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { colors as defaultColors, spacing, typography, commonStyles } from '../utils/theme';
import { useRTL } from '../hooks/useRTL';
import { MIN_TOUCH_TARGET } from '../utils/accessibility';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { wasteService, tipService, weatherService } from '../services/api';
import { BarChart } from 'react-native-chart-kit';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useAppNavigation, SCREEN_NAMES } from '../hooks/useNavigation';
import { MoreDropdown } from '../components/MoreDropdown';
import { useTranslation } from 'react-i18next';
import { WasteFilterModal, WasteFilters, getDefaultFilters } from '../components/WasteFilterModal';
import { useWasteFilters, WasteDataItem } from '../hooks/useWasteFilters';
import { logger } from '../utils/logger';

// Dynamic chart config based on theme
const getChartConfig = (isDarkMode: boolean) => ({
  backgroundGradientFrom: isDarkMode ? '#1E1E1E' : '#eafbe6',
  backgroundGradientTo: isDarkMode ? '#1E1E1E' : '#eafbe6',
  color: (opacity = 1) => isDarkMode
    ? `rgba(102, 187, 106, ${opacity})`
    : `rgba(34, 139, 34, ${opacity})`,
  labelColor: (opacity = 1) => isDarkMode
    ? `rgba(255, 255, 255, ${opacity})`
    : `rgba(0, 0, 0, ${opacity})`,
  barPercentage: 0.7,
  decimalPlaces: 2,
});

const WASTE_TYPES_DEFAULT = [
  { key: 'PLASTIC', label: 'Plastic' },
  { key: 'PAPER', label: 'Paper' },
  { key: 'GLASS', label: 'Glass' },
  { key: 'METAL', label: 'Metal' },
  { key: 'ELECTRONIC', label: 'Electronic' },
  { key: 'OIL&FATS', label: 'Oil & Fats' },
  { key: 'ORGANIC', label: 'Organic' },
];

// Unit conversions for each waste type (labelKey -> grams per unit)
const UNIT_CONVERSIONS: Record<string, { labelKey: string; grams: number }[]> = {
  PLASTIC: [
    { labelKey: 'plasticBottle', grams: 25 },
    { labelKey: 'plasticBag', grams: 5 },
    { labelKey: 'plasticCup', grams: 3 },
  ],
  PAPER: [
    { labelKey: 'paperSheet', grams: 5 },
    { labelKey: 'notebook', grams: 80 },
  ],
  GLASS: [
    { labelKey: 'glassBottle', grams: 200 },
    { labelKey: 'glassJar', grams: 150 },
  ],
  METAL: [
    { labelKey: 'aluminumCan', grams: 15 },
    { labelKey: 'metalSpoon', grams: 30 },
  ],
  ELECTRONIC: [
    { labelKey: 'phoneCharger', grams: 100 },
    { labelKey: 'usbCable', grams: 30 },
  ],
  'OIL&FATS': [
    { labelKey: 'cookingOil', grams: 14 },
    { labelKey: 'butterWrapper', grams: 1 },
  ],
  ORGANIC: [
    { labelKey: 'bananaPeel', grams: 25 },
    { labelKey: 'appleCore', grams: 20 },
    { labelKey: 'foodScraps', grams: 50 },
  ],
};

// Input method types
type InputMethod = 'grams' | 'unit' | '';

export const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL, textStyle, rowStyle } = useRTL();
  const { colors, isDarkMode } = useTheme();

  // Waste types with translations (all 7 types from backend)
  const WASTE_TYPES = [
    { key: 'PLASTIC', label: t('home.wasteTypes.PLASTIC') },
    { key: 'PAPER', label: t('home.wasteTypes.PAPER') },
    { key: 'GLASS', label: t('home.wasteTypes.GLASS') },
    { key: 'METAL', label: t('home.wasteTypes.METAL') },
    { key: 'ELECTRONIC', label: t('home.wasteTypes.ELECTRONIC') },
    { key: 'OIL&FATS', label: t('home.wasteTypes.OIL&FATS') },
    { key: 'ORGANIC', label: t('home.wasteTypes.ORGANIC') },
  ];
  const { logout, userData } = useAuth();
  const { navigateToScreen } = useAppNavigation();

  // waste form state
  const [wasteType, setWasteType] = useState('');
  const [wasteQuantity, setWasteQuantity] = useState('');
  const [showWasteTypeModal, setShowWasteTypeModal] = useState(false);
  const [selectedWasteType, setSelectedWasteType] = useState<{ key: string; label: string } | null>(null);
  
  // New states for two-method input (grams/unit)
  const [inputMethod, setInputMethod] = useState<InputMethod>('');
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [selectedUnitOption, setSelectedUnitOption] = useState<string>('');
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [unitCount, setUnitCount] = useState('');

  // Calculate grams when using unit method
  const calculatedGrams = inputMethod === 'unit' && selectedUnitOption && unitCount && selectedWasteType
    ? (() => {
        const conv = UNIT_CONVERSIONS[selectedWasteType.key]?.find(u => u.labelKey === selectedUnitOption);
        return conv ? conv.grams * parseInt(unitCount) : 0;
      })()
    : 0;

  // Total grams based on method
  const totalGrams = inputMethod === 'grams' 
    ? (parseFloat(wasteQuantity) || 0) 
    : calculatedGrams;
  
  // Warning thresholds
  const showWarning = totalGrams > 500;
  const exceedsMaxLimit = totalGrams > 5000;

  // data state
  const [wasteData, setWasteData] = useState<WasteDataItem[]>([]);
  const [loadingWaste, setLoadingWaste] = useState(true);
  const [tips, setTips] = useState<any[]>([]);
  const [loadingTips, setLoadingTips] = useState(true);

  // Filter hook for waste data
  const {
    filters,
    filteredData,
    filtersActive,
    isFilterModalVisible,
    openFilterModal,
    closeFilterModal,
    applyFilters,
  } = useWasteFilters(wasteData);

  // weather state
  const [weather, setWeather] = useState<{ temperature: number; weathercode: number } | null>(null);

  // pull‑to‑refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchWasteData(), fetchTips(), fetchWeather()]);
    setRefreshing(false);
  }, []);

  // More dropdown handlers
  const handleTipsPress = () => {
    try {
      navigateToScreen(SCREEN_NAMES.TIPS);
    } catch (error) {
      // Fallback if screen doesn't exist yet
      Alert.alert('Coming Soon', 'Tips page will be available soon!');
    }
  };

  const handleAchievementsPress = () => {
    navigateToScreen(SCREEN_NAMES.ACHIEVEMENTS);
  };

  const handleLeaderboardPress = () => {
    navigateToScreen(SCREEN_NAMES.LEADERBOARD);
  };

  // fetch user waste totals
  const fetchWasteData = async () => {
    setLoadingWaste(true);
    try {
      const response = await wasteService.getUserWastes();
      setWasteData(response.data);
    } catch (err) {
      logger.error('Error fetching waste data:', err);
      Alert.alert('Error', 'Failed to load waste data. Please pull to refresh.');
    } finally {
      setLoadingWaste(false);
    }
  };

  // fetch latest tips
  const fetchTips = async () => {
    setLoadingTips(true);
    try {
      const response = await tipService.getRecentTips();
      setTips(response.data);
    } catch (err) {
      logger.error('Error fetching tips:', err);
      Alert.alert('Error', 'Failed to load tips. Please try again.');
    } finally {
      setLoadingTips(false);
    }
  };

  // fetch current weather for Istanbul
  const fetchWeather = async () => {
    const lat = 41.0082;
    const lon = 28.9784;
    try {
      const data = await weatherService.getCurrentWeather(lat, lon);
      setWeather(data);
    } catch (err) {
      logger.warn('Weather fetch error:', err);
    }
  };

  // initial load
  useEffect(() => {
    fetchWasteData();
    fetchTips();
    fetchWeather();
  }, []);

  // add a new waste entry
  const handleAddWaste = async () => {
    if (!selectedWasteType || !inputMethod) {
      Alert.alert(t('common.error'), t('wasteHelper.selectTypeAndMethod'));
      return;
    }

    let gramsToSend = 0;

    if (inputMethod === 'grams') {
      gramsToSend = parseFloat(wasteQuantity);
      if (isNaN(gramsToSend) || gramsToSend <= 0) {
        Alert.alert(t('common.error'), t('wasteHelper.enterValidQuantity'));
        return;
      }
    } else if (inputMethod === 'unit') {
      if (!selectedUnitOption || !unitCount) {
        Alert.alert(t('common.error'), t('wasteHelper.selectUnitAndCount'));
        return;
      }
      gramsToSend = calculatedGrams;
    }

    if (gramsToSend <= 0) {
      Alert.alert(t('common.error'), t('wasteHelper.enterValidQuantity'));
      return;
    }

    if (exceedsMaxLimit) {
      Alert.alert(t('common.error'), t('wasteHelper.excessiveAmountError'));
      return;
    }

    try {
      await wasteService.addUserWaste(
        selectedWasteType.key,
        gramsToSend
      );
      // Reset all fields
      setWasteType('');
      setWasteQuantity('');
      setSelectedWasteType(null);
      setInputMethod('');
      setSelectedUnitOption('');
      setUnitCount('');
      fetchWasteData();
      Alert.alert(t('common.success'), t('home.addWaste'));
    } catch (error: any) {
      let message = 'Unknown error';
      if (error.response?.data) {message = JSON.stringify(error.response.data);}
      else if (error.message) {message = error.message;}
      Alert.alert(t('common.error'), `${message}`);
    }
  };

  // handle waste type selection
  const handleWasteTypeSelect = (wasteType: { key: string; label: string }) => {
    setSelectedWasteType(wasteType);
    setWasteType(wasteType.label);
    setShowWasteTypeModal(false);
    // Reset method and unit selections when waste type changes
    setInputMethod('');
    setSelectedUnitOption('');
    setUnitCount('');
    setWasteQuantity('');
  };

  // handle input method selection
  const handleMethodSelect = (method: InputMethod) => {
    setInputMethod(method);
    setShowMethodModal(false);
    // Reset quantities when method changes
    setWasteQuantity('');
    setSelectedUnitOption('');
    setUnitCount('');
  };

  // handle unit option selection
  const handleUnitSelect = (labelKey: string) => {
    setSelectedUnitOption(labelKey);
    setShowUnitModal(false);
  };

  // Get available unit options for selected waste type
  const availableUnits = selectedWasteType ? UNIT_CONVERSIONS[selectedWasteType.key] || [] : [];

  // Input methods for dropdown
  const INPUT_METHODS = [
    { key: 'grams' as InputMethod, label: t('wasteHelper.methods.grams') },
    { key: 'unit' as InputMethod, label: t('wasteHelper.methods.unit') },
  ];

  // Check if add button should be disabled
  const isAddDisabled = 
    !selectedWasteType || 
    !inputMethod || 
    (inputMethod === 'grams' && !wasteQuantity) ||
    (inputMethod === 'unit' && (!selectedUnitOption || !unitCount)) ||
    exceedsMaxLimit;

  // prepare chart data with translated labels (using filtered data)
  const screenWidth = Dimensions.get('window').width - 32;
  const barLabels = filteredData.map((i) => {
    const wasteType = i.waste_type?.toUpperCase();
    // Translate waste type if translation exists, otherwise use original
    const translated = t(`home.wasteTypes.${wasteType}`, { defaultValue: i.waste_type });
    // Truncate labels to max 6 chars to fit on mobile
    return translated.length > 6 ? translated.substring(0, 5) + '.' : translated;
  });
  // Convert grams to kg for display (backend stores in grams, chart shows kg)
  const barData = filteredData.map((i) => (i.total_amount || 0) / 1000);
  // Chart fits screen width - labels are rotated to fit
  const chartWidth = screenWidth;
  
  // Check if there's any data to display
  const hasData = barData.some(val => val > 0);

  // tip item renderer
  const renderTipItem = ({ item }: { item: any }) => (
    <View style={[styles.tipItem, { backgroundColor: colors.backgroundSecondary }]}>
      <Text style={[styles.tipTitle, textStyle, { color: colors.primary }]}>{item.title}</Text>
      <Text style={[styles.tipDescription, textStyle, { color: colors.textSecondary }]}>{item.description}</Text>
      <View style={[styles.tipStatsRow, rowStyle]}>
        <Text style={[styles.tipStat, { color: colors.textSecondary }]}>👍 {item.like_count}</Text>
        <Text style={[styles.tipStat, { color: colors.textSecondary }]}>👎 {item.dislike_count}</Text>
      </View>
    </View>
  );

  const renderEmptyTips = () => (
    <Text style={[styles.tipText, { color: colors.textSecondary }]}>{t('home.noWasteLogged')}</Text>
  );

  return (
    <ScreenWrapper
      title={t('home.title')}
      scrollable={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      rightComponent={
        <MoreDropdown
          onTipsPress={handleTipsPress}
          onAchievementsPress={handleAchievementsPress}
          onLeaderboardPress={handleLeaderboardPress}
          testID="home-more-dropdown"
        />
      }
      testID="home-screen"
      accessibilityLabel="Home screen with waste tracking and tips"
    >
      {/* User greeting */}
      <View style={[styles.userInfoRow, rowStyle]}>
        <Text style={[styles.username, textStyle, { color: colors.primary }]}>
          {userData?.username ? t('home.greeting', { username: userData.username }) : t('common.loading')}
        </Text>
      </View>

      {/* Weather line */}
      {weather && (
        <Text style={{ alignSelf: 'center', marginBottom: spacing.sm, color: colors.textSecondary }}>
          {t('home.istanbulWeather', { temperature: weather.temperature })}
        </Text>
      )}

      {/* Bar chart */}
      <View style={styles.chartContainer}>
        <View style={[styles.chartHeaderRow, rowStyle]}>
          <Text style={[styles.sectionTitle, textStyle, { color: colors.primary }]}>{t('home.wasteHistory')}</Text>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { 
                backgroundColor: filtersActive ? colors.primary : colors.backgroundSecondary,
                borderColor: colors.primary,
              },
            ]}
            onPress={openFilterModal}
            accessibilityRole="button"
            accessibilityLabel={t('filter.filterButton')}
            accessibilityHint={filtersActive ? t('filter.activeFilters') : undefined}
          >
            <Text style={[
              styles.filterButtonText,
              { color: filtersActive ? colors.textOnPrimary : colors.primary }
            ]}>
              {filtersActive ? `⚡ ${t('filter.filterButton')}` : `🔍 ${t('filter.filterButton')}`}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Active filters indicator */}
        {filtersActive && (
          <View style={[styles.activeFiltersBar, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.activeFiltersText, { color: colors.textSecondary }]}>
              {t(`filter.timeRanges.${filters.timeRange}`)} • {filters.wasteTypes.length} {t('filter.wasteTypes').toLowerCase()}
            </Text>
          </View>
        )}
        
        <View style={[styles.chartPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
          {loadingWaste ? (
            <Text style={{ color: colors.textSecondary }}>[Loading waste data...]</Text>
          ) : hasData ? (
            <BarChart
              data={{ labels: barLabels, datasets: [{ data: barData }] }}
              width={chartWidth}
              height={260}
              yAxisLabel=""
              yAxisSuffix=" kg"
              chartConfig={{
                ...getChartConfig(isDarkMode),
                barPercentage: 0.5,
                propsForLabels: { fontSize: 10 },
              }}
              verticalLabelRotation={45}
              fromZero
              showValuesOnTopOfBars
              style={{ borderRadius: 12, marginLeft: -16 }}
            />
          ) : (
            <View style={styles.emptyChartContainer}>
              <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
                {filtersActive ? t('filter.noDataForFilters') : t('home.noWasteLogged')}
              </Text>
              {filtersActive && (
                <TouchableOpacity
                  style={[styles.clearFiltersButton, { borderColor: colors.primary }]}
                  onPress={openFilterModal}
                >
                  <Text style={[styles.clearFiltersText, { color: colors.primary }]}>
                    {t('filter.clearAll')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Waste Filter Modal */}
      <WasteFilterModal
        visible={isFilterModalVisible}
        onClose={closeFilterModal}
        onApply={applyFilters}
        currentFilters={filters}
      />

      {/* Spacer */}
      <View style={{ height: spacing.xl + spacing.sm }} />

      {/* Warning Message for high amounts */}
      {showWarning && (
        <View style={[
          styles.warningBox, 
          { 
            backgroundColor: colors.backgroundSecondary,
            borderLeftColor: exceedsMaxLimit ? '#dc2626' : '#059669',
          }
        ]}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={[styles.warningText, { color: exceedsMaxLimit ? '#dc2626' : '#059669' }]}>
            {exceedsMaxLimit 
              ? t('wasteHelper.excessiveAmountError') 
              : t('wasteHelper.highAmountWarning')}
          </Text>
        </View>
      )}

      {/* Waste logging inputs - Row 1: Waste Type & Method */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.logRow}>
          {/* Waste Type Dropdown */}
          <TouchableOpacity
            style={[styles.wasteTypeButton, { backgroundColor: colors.background, borderColor: colors.lightGray, flex: 1 }]}
            onPress={() => {
              Keyboard.dismiss();
              setShowWasteTypeModal(true);
            }}
          >
            <Text style={[styles.wasteTypeButtonText, { color: colors.textPrimary }, !selectedWasteType && { color: colors.textSecondary }]} numberOfLines={1}>
              {selectedWasteType ? selectedWasteType.label : t('home.selectWasteType')}
            </Text>
            <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>▼</Text>
          </TouchableOpacity>

          {/* Method Dropdown */}
          <TouchableOpacity
            style={[
              styles.methodButton, 
              { backgroundColor: colors.background, borderColor: colors.lightGray },
              !selectedWasteType && styles.disabledButton
            ]}
            onPress={() => {
              if (selectedWasteType) {
                Keyboard.dismiss();
                setShowMethodModal(true);
              }
            }}
            disabled={!selectedWasteType}
          >
            <Text 
              style={[
                styles.wasteTypeButtonText, 
                { color: colors.textPrimary }, 
                !inputMethod && { color: colors.textSecondary }
              ]} 
              numberOfLines={1}
            >
              {inputMethod ? t(`wasteHelper.methods.${inputMethod}`) : t('wasteHelper.selectMethod')}
            </Text>
            <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>▼</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>

      {/* Waste logging inputs - Row 2: Unit/Grams & Add Button */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={[styles.logRow, { marginTop: spacing.xs }]}>
          {inputMethod === 'unit' ? (
            <>
              {/* Unit Type Dropdown */}
              <TouchableOpacity
                style={[
                  styles.unitButton, 
                  { backgroundColor: colors.background, borderColor: colors.lightGray },
                  !inputMethod && styles.disabledButton
                ]}
                onPress={() => {
                  if (inputMethod === 'unit') {
                    Keyboard.dismiss();
                    setShowUnitModal(true);
                  }
                }}
                disabled={inputMethod !== 'unit'}
              >
                <Text 
                  style={[
                    styles.wasteTypeButtonText, 
                    { color: colors.textPrimary }, 
                    !selectedUnitOption && { color: colors.textSecondary }
                  ]} 
                  numberOfLines={1}
                >
                  {selectedUnitOption 
                    ? `${t(`wasteHelper.items.${selectedUnitOption}`)} (${availableUnits.find(u => u.labelKey === selectedUnitOption)?.grams}g)`
                    : t('wasteHelper.chooseItem')}
                </Text>
                <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>▼</Text>
              </TouchableOpacity>

              {/* Unit Count Input */}
              <TextInput
                style={[
                  styles.quantityInput, 
                  { backgroundColor: colors.background, borderColor: colors.lightGray, color: colors.textPrimary },
                  !selectedUnitOption && styles.disabledInput
                ]}
                placeholder={t('wasteHelper.count')}
                placeholderTextColor={colors.textSecondary}
                value={unitCount}
                onChangeText={setUnitCount}
                keyboardType="numeric"
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={Keyboard.dismiss}
                editable={!!selectedUnitOption}
              />

              {/* Calculated Grams Display */}
              <View style={[styles.gramsDisplay, { backgroundColor: colors.backgroundSecondary, borderColor: colors.lightGray }]}>
                <Text style={[styles.gramsDisplayText, { color: colors.textPrimary }]}>
                  {calculatedGrams > 0 ? `${calculatedGrams}g` : '0g'}
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* Grams Input */}
              <TextInput
                style={[
                  styles.gramsInput, 
                  { backgroundColor: colors.background, borderColor: colors.lightGray, color: colors.textPrimary },
                  inputMethod !== 'grams' && styles.disabledInput
                ]}
                placeholder={t('wasteHelper.quantityGrams')}
                placeholderTextColor={colors.textSecondary}
                value={wasteQuantity}
                onChangeText={setWasteQuantity}
                keyboardType="numeric"
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={Keyboard.dismiss}
                editable={inputMethod === 'grams'}
              />
            </>
          )}

          {/* Add Button */}
          <TouchableOpacity
            style={[
              styles.addButton, 
              { backgroundColor: colors.primary }, 
              isAddDisabled && { backgroundColor: colors.lightGray, opacity: 0.6 }
            ]}
            onPress={() => {
              Keyboard.dismiss();
              handleAddWaste();
            }}
            disabled={isAddDisabled}
          >
            <Text style={[styles.addButtonText, { color: colors.textOnPrimary }]}>{t('home.addWaste')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>

      {/* Waste Type Selection Modal */}
      <Modal
        visible={showWasteTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWasteTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, textStyle, { color: colors.primary }]}>{t('home.selectWasteType')}</Text>
            <ScrollView style={styles.wasteTypeList}>
              {WASTE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[styles.wasteTypeItem, { borderBottomColor: colors.lightGray }]}
                  onPress={() => handleWasteTypeSelect(type)}
                >
                  <Text style={[styles.wasteTypeItemText, textStyle, { color: colors.textPrimary }]}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.lightGray }]}
              onPress={() => setShowWasteTypeModal(false)}
            >
              <Text style={[styles.modalCloseButtonText, { color: colors.textPrimary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Method Selection Modal */}
      <Modal
        visible={showMethodModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMethodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, textStyle, { color: colors.primary }]}>{t('wasteHelper.selectMethod')}</Text>
            <ScrollView style={styles.wasteTypeList}>
              {INPUT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.key}
                  style={[styles.wasteTypeItem, { borderBottomColor: colors.lightGray }]}
                  onPress={() => handleMethodSelect(method.key)}
                >
                  <Text style={[styles.wasteTypeItemText, textStyle, { color: colors.textPrimary }]}>{method.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.lightGray }]}
              onPress={() => setShowMethodModal(false)}
            >
              <Text style={[styles.modalCloseButtonText, { color: colors.textPrimary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Unit Selection Modal */}
      <Modal
        visible={showUnitModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUnitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, textStyle, { color: colors.primary }]}>{t('wasteHelper.chooseItem')}</Text>
            <ScrollView style={styles.wasteTypeList}>
              {availableUnits.map((unit) => (
                <TouchableOpacity
                  key={unit.labelKey}
                  style={[styles.wasteTypeItem, { borderBottomColor: colors.lightGray }]}
                  onPress={() => handleUnitSelect(unit.labelKey)}
                >
                  <View style={styles.unitItemRow}>
                    <Text style={[styles.wasteTypeItemText, textStyle, { color: colors.textPrimary }]}>
                      {t(`wasteHelper.items.${unit.labelKey}`)}
                    </Text>
                    <Text style={[styles.unitGramsText, { color: colors.textSecondary }]}>
                      {unit.grams}g
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.lightGray }]}
              onPress={() => setShowUnitModal(false)}
            >
              <Text style={[styles.modalCloseButtonText, { color: colors.textPrimary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Latest Tips header */}
      <Text style={[styles.sectionTitle, textStyle, { marginBottom: spacing.sm, color: colors.primary }]}>
        {t('home.recentTips')}
      </Text>

      {/* Tips list + logout footer */}
      <FlatList
        style={{ flex: 1 }}
        data={loadingTips ? [] : tips}
        keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
        renderItem={renderTipItem}
        ListEmptyComponent={loadingTips ? undefined : renderEmptyTips}
        ListFooterComponent={
          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.error }]} onPress={logout}>
            <Text style={[styles.logoutButtonText, { color: colors.textOnPrimary }]}>{t('common.logout')}</Text>
          </TouchableOpacity>
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: spacing.lg }}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#eafbe6',
    flex: 1,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  username: {
    ...typography.h2,
    color: defaultColors.primary,
  },
  chartContainer: {
    marginBottom: spacing.md,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.h2,
    color: defaultColors.primary,
    marginBottom: spacing.xs,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
  },
  filterButtonText: {
    ...typography.caption,
    fontWeight: '600',
  },
  activeFiltersBar: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  activeFiltersText: {
    ...typography.caption,
    textAlign: 'center',
  },
  emptyChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyChartText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  clearFiltersButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  clearFiltersText: {
    ...typography.button,
  },
  chartPlaceholder: {
    minHeight: 260,
    backgroundColor: defaultColors.lightGray,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  input: {
    ...commonStyles.input,
    flex: 1,
  },
  quantityInput: {
    backgroundColor: defaultColors.white,
    borderWidth: 1,
    borderColor: defaultColors.lightGray,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    height: 44,
    width: 60,
    textAlign: 'center',
    marginHorizontal: spacing.xs,
  },
  addButton: {
    backgroundColor: defaultColors.primary,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: defaultColors.lightGray,
    opacity: 0.6,
  },
  addButtonText: {
    color: defaultColors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  wasteTypeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: defaultColors.white,
    borderWidth: 1,
    borderColor: defaultColors.lightGray,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    height: 44,
  },
  wasteTypeButtonText: {
    color: defaultColors.black,
    fontSize: 14,
  },
  placeholderText: {
    color: defaultColors.gray,
  },
  dropdownArrow: {
    color: defaultColors.gray,
    fontSize: 12,
    marginLeft: spacing.xs,
  },
  methodButton: {
    flex: 0.7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: defaultColors.white,
    borderWidth: 1,
    borderColor: defaultColors.lightGray,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    height: 44,
    marginLeft: spacing.xs,
  },
  unitButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: defaultColors.white,
    borderWidth: 1,
    borderColor: defaultColors.lightGray,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    height: 44,
  },
  gramsInput: {
    flex: 1,
    backgroundColor: defaultColors.white,
    borderWidth: 1,
    borderColor: defaultColors.lightGray,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    height: 44,
  },
  gramsDisplay: {
    backgroundColor: defaultColors.lightGray,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    height: 44,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  gramsDisplayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledInput: {
    opacity: 0.5,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: spacing.sm,
  },
  warningIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  unitItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  unitGramsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: defaultColors.white,
    borderRadius: 12,
    padding: spacing.lg,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    ...typography.h3,
    color: defaultColors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  wasteTypeList: {
    maxHeight: 200,
  },
  wasteTypeItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: defaultColors.lightGray,
  },
  wasteTypeItemText: {
    ...typography.body,
    color: defaultColors.black,
  },
  modalCloseButton: {
    backgroundColor: defaultColors.lightGray,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modalCloseButtonText: {
    ...typography.button,
    color: defaultColors.black,
  },
  tipItem: {
    backgroundColor: defaultColors.white,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  tipTitle: {
    ...typography.h2,
    color: defaultColors.primary,
    marginBottom: spacing.xs,
  },
  tipDescription: {
    ...typography.body,
    color: defaultColors.gray,
    marginBottom: spacing.xs,
  },
  tipStatsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm + 4,
  },
  tipStat: {
    ...typography.body,
    color: defaultColors.gray,
    marginLeft: spacing.sm,
  },
  tipText: {
    color: defaultColors.gray,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  logoutButton: {
    backgroundColor: defaultColors.error,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  logoutButtonText: {
    color: defaultColors.white,
    fontWeight: 'bold',
  },
});
