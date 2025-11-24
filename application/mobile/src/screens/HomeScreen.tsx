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
import { colors, spacing, typography, commonStyles } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { wasteService, tipService, weatherService } from '../services/api';
import { BarChart } from 'react-native-chart-kit';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useAppNavigation, SCREEN_NAMES } from '../hooks/useNavigation';
import { MoreDropdown } from '../components/MoreDropdown';
import { useTranslation } from 'react-i18next';

const chartConfig = {
  backgroundGradientFrom: '#eafbe6',
  backgroundGradientTo: '#eafbe6',
  color: (opacity = 1) => `rgba(34, 139, 34, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  barPercentage: 0.7,
  decimalPlaces: 0,
};

export const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  
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
  const barLabels = wasteData.map((i) => {
    const wasteType = i.waste_type?.toUpperCase();
    // Translate waste type if translation exists, otherwise use original
    return t(`home.wasteTypes.${wasteType}`, { defaultValue: i.waste_type });
  });
  const barData = wasteData.map((i) => i.total_amount);
  const screenWidth = Dimensions.get('window').width - 32;

  // tip item renderer
  const renderTipItem = ({ item }: { item: any }) => (
    <View style={styles.tipItem}>
      <Text style={styles.tipTitle}>{item.title}</Text>
      <Text style={styles.tipDescription}>{item.description}</Text>
      <View style={styles.tipStatsRow}>
        <Text style={styles.tipStat}>👍 {item.like_count}</Text>
        <Text style={styles.tipStat}>👎 {item.dislike_count}</Text>
      </View>
    </View>
  );

  const renderEmptyTips = () => (
    <Text style={styles.tipText}>{t('home.noWasteLogged')}</Text>
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
      <View style={styles.userInfoRow}>
        <Text style={styles.username}>
          {userData?.username ? t('home.greeting', { username: userData.username }) : t('common.loading')}
        </Text>
      </View>

      {/* Weather line */}
      {weather && (
        <Text style={{ alignSelf: 'center', marginBottom: spacing.sm, color: colors.gray }}>
          {t('home.istanbulWeather', { temperature: weather.temperature })}
        </Text>
      )}

      {/* Bar chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>{t('home.wasteHistory')}</Text>
        <View style={styles.chartPlaceholder}>
          {loadingWaste ? (
            <Text style={{ color: colors.gray }}>[Loading waste data...]</Text>
          ) : (
            <BarChart
              data={{ labels: barLabels, datasets: [{ data: barData }] }}
              width={screenWidth}
              height={180}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              verticalLabelRotation={0}
              fromZero
              style={{ borderRadius: 12 }}
            />
          )}
        </View>
      </View>

      {/* 40px gap */}
      <View style={{ height: 40 }} />

      {/* Waste logging inputs */}
      <View style={styles.logRow}>
        <TouchableOpacity 
          style={[styles.input, styles.wasteTypeButton]} 
          onPress={() => setShowWasteTypeModal(true)}
        >
          <Text style={[styles.wasteTypeButtonText, !selectedWasteType && styles.placeholderText]}>
            {selectedWasteType ? selectedWasteType.label : t('home.selectWasteType')}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder={t('home.quantity')}
          value={wasteQuantity}
          onChangeText={setWasteQuantity}
          keyboardType="numeric"
        />
        
        <TouchableOpacity 
          style={[styles.addButton, (!selectedWasteType || !wasteQuantity) && styles.addButtonDisabled]} 
          onPress={handleAddWaste}
          disabled={!selectedWasteType || !wasteQuantity}
        >
          <Text style={styles.addButtonText}>{t('home.addWaste')}</Text>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('home.selectWasteType')}</Text>
            <ScrollView style={styles.wasteTypeList}>
              {WASTE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={styles.wasteTypeItem}
                  onPress={() => handleWasteTypeSelect(type)}
                >
                  <Text style={styles.wasteTypeItemText}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowWasteTypeModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Latest Tips header */}
      <Text style={[styles.sectionTitle, { marginBottom: spacing.sm }]}>
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
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>{t('common.logout')}</Text>
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
    color: colors.primary,
  },
  chartContainer: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  chartPlaceholder: {
    height: 120,
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  input: {
    ...commonStyles.input,
    flex: 1,
    marginRight: spacing.xs,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: colors.lightGray,
    opacity: 0.6,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  wasteTypeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  wasteTypeButtonText: {
    flex: 1,
    color: colors.black,
  },
  placeholderText: {
    color: colors.gray,
  },
  dropdownArrow: {
    color: colors.gray,
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
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  wasteTypeList: {
    maxHeight: 200,
  },
  wasteTypeItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  wasteTypeItemText: {
    ...typography.body,
    color: colors.black,
  },
  modalCloseButton: {
    backgroundColor: colors.lightGray,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modalCloseButtonText: {
    ...typography.button,
    color: colors.black,
  },
  tipItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  tipTitle: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  tipDescription: {
    ...typography.body,
    color: colors.gray,
    marginBottom: spacing.xs,
  },
  tipStatsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  tipStat: {
    ...typography.body,
    color: colors.gray,
    marginLeft: spacing.sm,
  },
  tipText: {
    color: colors.gray,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  logoutButton: {
    backgroundColor: colors.error,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  logoutButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});
