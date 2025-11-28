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
  decimalPlaces: 0,
});

const WASTE_TYPES = [
  { key: 'PLASTIC', label: 'Plastic' },
  { key: 'PAPER', label: 'Paper' },
  { key: 'GLASS', label: 'Glass' },
  { key: 'METAL', label: 'Metal' },
];

export const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL, textStyle, rowStyle } = useRTL();
  const { colors, isDarkMode } = useTheme();

  // Waste types with translations
  const WASTE_TYPES = [
    { key: 'PLASTIC', label: t('home.wasteTypes.PLASTIC') },
    { key: 'PAPER', label: t('home.wasteTypes.PAPER') },
    { key: 'GLASS', label: t('home.wasteTypes.GLASS') },
    { key: 'METAL', label: t('home.wasteTypes.METAL') },
  ];
  const { logout, userData } = useAuth();
  const { navigateToScreen } = useAppNavigation();

  // waste form state
  const [wasteType, setWasteType] = useState('');
  const [wasteQuantity, setWasteQuantity] = useState('');
  const [showWasteTypeModal, setShowWasteTypeModal] = useState(false);
  const [selectedWasteType, setSelectedWasteType] = useState<{ key: string; label: string } | null>(null);

  // data state
  const [wasteData, setWasteData] = useState<any[]>([]);
  const [loadingWaste, setLoadingWaste] = useState(true);
  const [tips, setTips] = useState<any[]>([]);
  const [loadingTips, setLoadingTips] = useState(true);

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
      console.error('Error fetching waste data:', err);
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
      console.error('Error fetching tips:', err);
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
      console.warn('Weather fetch error:', err);
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
    if (!selectedWasteType || !wasteQuantity) {
      Alert.alert('Error', 'Please select a waste type and enter quantity');
      return;
    }
    
    const quantity = parseFloat(wasteQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity (positive number)');
      return;
    }

    try {
      await wasteService.addUserWaste(
        selectedWasteType.key,
        quantity
      );
      setWasteType('');
      setWasteQuantity('');
      setSelectedWasteType(null);
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
  };

  // prepare chart data with translated labels
  const screenWidth = Dimensions.get('window').width - 32;
  const barLabels = wasteData.map((i) => {
    const wasteType = i.waste_type?.toUpperCase();
    // Translate waste type if translation exists, otherwise use original
    const translated = t(`home.wasteTypes.${wasteType}`, { defaultValue: i.waste_type });
    // Truncate labels to max 6 chars to fit on mobile
    return translated.length > 6 ? translated.substring(0, 5) + '.' : translated;
  });
  const barData = wasteData.map((i) => i.total_amount || 0);
  // Chart fits screen width - labels are rotated to fit
  const chartWidth = screenWidth;

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
        <Text style={[styles.sectionTitle, textStyle, { color: colors.primary }]}>{t('home.wasteHistory')}</Text>
        <View style={[styles.chartPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
          {loadingWaste ? (
            <Text style={{ color: colors.textSecondary }}>[Loading waste data...]</Text>
          ) : barData.length > 0 ? (
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
            <Text style={{ color: colors.textSecondary }}>{t('home.noWasteLogged')}</Text>
          )}
        </View>
      </View>

      {/* Spacer */}
      <View style={{ height: spacing.xl + spacing.sm }} />

      {/* Waste logging inputs */}
      <View style={styles.logRow}>
        <TouchableOpacity
          style={[styles.wasteTypeButton, { backgroundColor: colors.background, borderColor: colors.lightGray }]}
          onPress={() => setShowWasteTypeModal(true)}
        >
          <Text style={[styles.wasteTypeButtonText, { color: colors.textPrimary }, !selectedWasteType && { color: colors.textSecondary }]} numberOfLines={1}>
            {selectedWasteType ? selectedWasteType.label : t('home.selectWasteType')}
          </Text>
          <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>▼</Text>
        </TouchableOpacity>

        <TextInput
          style={[styles.quantityInput, { backgroundColor: colors.background, borderColor: colors.lightGray, color: colors.textPrimary }]}
          placeholder="0.0"
          placeholderTextColor={colors.textSecondary}
          value={wasteQuantity}
          onChangeText={setWasteQuantity}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }, (!selectedWasteType || !wasteQuantity) && { backgroundColor: colors.lightGray, opacity: 0.6 }]}
          onPress={handleAddWaste}
          disabled={!selectedWasteType || !wasteQuantity}
        >
          <Text style={[styles.addButtonText, { color: colors.textOnPrimary }]}>{t('home.addWaste')}</Text>
        </TouchableOpacity>
      </View>

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
  sectionTitle: {
    ...typography.h2,
    color: defaultColors.primary,
    marginBottom: spacing.xs,
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
