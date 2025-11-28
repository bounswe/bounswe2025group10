import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, Image, ScrollView as RNScrollView, TouchableOpacity, Platform, Alert, RefreshControl, TextInput, Modal, Switch } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { colors as defaultColors, spacing, typography, commonStyles, lightColors, darkColors } from '../utils/theme';
import { useRTL } from '../hooks/useRTL';
import { MIN_TOUCH_TARGET } from '../utils/accessibility';
import { wasteService, achievementService, profileService, profilePublicService, getProfilePictureUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { storage } from '../utils/storage';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useAppNavigation } from '../hooks/useNavigation';
import { useTranslation } from 'react-i18next';
import { changeLanguage, LANGUAGES, isRTL } from '../i18n';
import { I18nManager } from 'react-native';

// Chart config will be computed dynamically based on theme
const getChartConfig = (colors: typeof defaultColors, isDarkMode: boolean) => ({
  backgroundGradientFrom: colors.backgroundSecondary,
  backgroundGradientTo: colors.backgroundSecondary,
  color: (opacity = 1) => isDarkMode
    ? `rgba(102, 187, 106, ${opacity})` // dark mode primary
    : `rgba(46, 125, 50, ${opacity})`, // light mode primary
  labelColor: (opacity = 1) => isDarkMode
    ? `rgba(255, 255, 255, ${opacity})` // dark mode text
    : `rgba(33, 33, 33, ${opacity})`, // light mode text
  barPercentage: 0.7,
  decimalPlaces: 0,
});

const PROFILE_PLACEHOLDER = require('../assets/profile_placeholder.png');

// Theme mode options for display
const THEME_OPTIONS: { mode: ThemeMode; labelKey: string }[] = [
  { mode: 'light', labelKey: 'profile.themeLight' },
  { mode: 'dark', labelKey: 'profile.themeDark' },
  { mode: 'system', labelKey: 'profile.themeSystem' },
];

// Main profile component that handles the user data display
const ProfileMain: React.FC = () => {
  const { userData, fetchUserData, logout } = useAuth();
  const { navigateToScreen } = useAppNavigation();
  const { t, i18n } = useTranslation();
  const { textStyle, rowStyle } = useRTL();
  const { colors, isDarkMode, themeMode, setThemeMode } = useTheme();
  const [wasteData, setWasteData] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [_refreshing, setRefreshing] = useState(false);
  const [_profileImageLoadError, setProfileImageLoadError] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [bio, setBio] = useState<string>('');
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState<string>('');
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  // Load auth token once on mount
  useEffect(() => {
    (async () => {
      const token = await storage.getToken();
      setAuthToken(token);
      console.log('Auth token loaded');
    })();
  }, []);

  const fetchBio = useCallback(async () => {
    if (!userData?.username) {return;}
    try {
      const data = await profilePublicService.getUserBio(userData.username);
      setBio(data.bio || '');
    } catch (err) {
      console.warn('Error fetching bio');
    }
  }, [userData?.username]);

  const fetchData = async () => {
    try {
      const [wasteResponse, challengesResponse] = await Promise.all([
        wasteService.getUserWastes(),
        achievementService.getUserAchievements(),
      ]);

      // Handle waste data
      if (wasteResponse.message === 'User wastes retrieved successfully') {
        setWasteData(wasteResponse.data);
      }

      // Handle challenges/achievements data
      if (Array.isArray(challengesResponse)) {
        setAchievements(challengesResponse.map(challenge => ({
          id: challenge.challenge,
          title: 'Challenge Achievement',
          description: `Joined challenge on ${new Date(challenge.joined_date).toLocaleDateString()}`,
          date_earned: challenge.joined_date,
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load profile data. Please pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchBio();
  }, [fetchBio]); // fetchBio already depends on userData?.username

  // Prepare data for BarChart - handle the specific waste data structure with translated labels
  const screenWidth = Dimensions.get('window').width - 40;
  const barLabels = wasteData.map((item) => {
    const wasteType = item.waste_type?.toUpperCase();
    // Translate waste type if translation exists, otherwise use original
    return wasteType ? t(`home.wasteTypes.${wasteType}`, { defaultValue: item.waste_type }) : '';
  });
  const barData = wasteData.map((item) => item.total_amount || 0);
  const chartWidth = Math.max(screenWidth - 32, barLabels.length * 80);

  // TODO: Re-enable profile picture loading when backend is fixed
  // For now, always use placeholder to avoid 404/500 errors
  const profileImageSource = PROFILE_PLACEHOLDER;

  // Handle selecting and uploading a new profile picture
  const handleChoosePhoto = async () => {
    if (uploading) {return;}

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) {
        console.log('User cancelled image picker');
        return;
      }

      const asset = result.assets[0];
      if (!asset?.uri) {
        console.error('No image URI available');
        Alert.alert('Error', 'Could not obtain image URI');
        return;
      }

      setUploading(true);
      const formData = new FormData();
      formData.append('image', {
        uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
        type: 'image/jpeg',
        name: `profile_${Date.now()}.jpg`,
      } as any);

      const uploadResponse = await profileService.uploadProfilePicture(formData);
      console.log('Upload response:', JSON.stringify(uploadResponse, null, 2));

      // Force reload user data
      await fetchUserData();

      // Reset error state so we try loading the new image
      setProfileImageLoadError(false);

      await fetchData();
      Alert.alert('Success', 'Profile picture updated');
    } catch (error: any) {
      console.error('Upload error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Alert.alert('Error', 'Could not upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      {/* Profile Picture */}
      <TouchableOpacity style={[styles.profilePicWrapper, { borderColor: colors.backgroundSecondary, backgroundColor: colors.backgroundSecondary }]} onPress={handleChoosePhoto} disabled={uploading}>
        <Image
          source={profileImageSource}
          style={styles.profilePic}
          onError={() => setProfileImageLoadError(true)}
          onLoad={() => setProfileImageLoadError(false)}
        />
        {uploading && (
          <View style={[StyleSheet.absoluteFill, styles.uploadingOverlay]}>
            <ActivityIndicator size="small" color="#FFF" />
          </View>
        )}
      </TouchableOpacity>
      <Text style={[styles.title, textStyle, { color: colors.primary }]}>{t('profile.myProfile')}</Text>
      <View style={styles.infoContainer}>
        <Text style={[styles.infoText, textStyle, { color: colors.textPrimary }]}><Text style={[styles.infoLabel, { color: colors.primary }]}>{t('profile.username')}:</Text> {userData?.username || t('common.loading')}</Text>
        {editingBio ? (
          <View style={{ width:'100%', alignItems:'center', marginBottom: spacing.sm }}>
            <TextInput
              style={[styles.input, {height:80, color: colors.textPrimary, borderColor: colors.lightGray, backgroundColor: colors.background}]}
              multiline
              value={bioInput}
              onChangeText={setBioInput}
              placeholder={t('profile.bio')}
              placeholderTextColor={colors.textSecondary}
            />
            <View style={{flexDirection:'row', marginTop: spacing.xs}}>
              <TouchableOpacity style={[styles.saveButton, {marginRight: spacing.sm, backgroundColor: colors.primary}]} onPress={async ()=>{
                try{
                  await profileService.updateBio(userData!.username,bioInput);
                  setBio(bioInput);
                  setEditingBio(false);
                }catch(err){Alert.alert('Error','Could not update bio');}
              }}>
                <Text style={[styles.logoutButtonText, { color: colors.textOnPrimary }]}>{t('common.save')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.error }]} onPress={()=>{setEditingBio(false);}}>
                <Text style={[styles.logoutButtonText, { color: colors.textOnPrimary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{alignItems:'center', marginBottom: spacing.sm}}>
            <Text style={[styles.bioText, { color: colors.textPrimary }]}>{bio || t('profile.bio')}</Text>
            <TouchableOpacity
              style={{minHeight: MIN_TOUCH_TARGET, justifyContent: 'center'}}
              onPress={()=>{setBioInput(bio); setEditingBio(true);}}
            >
              <Text style={{color: colors.primary, ...typography.body}}>{t('profile.editProfile')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Language Selector */}
        <View style={[styles.languageSection, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.infoLabel, { color: colors.primary }]}>{t('profile.language')}:</Text>
          <TouchableOpacity
            style={[styles.languageButton, { backgroundColor: colors.background, borderColor: colors.primary }]}
            onPress={() => setLanguageModalVisible(true)}
          >
            <Text style={[styles.languageButtonText, { color: colors.primary }]}>
              {LANGUAGES.find(lang => lang.code === i18n.language)?.nativeName || 'English'}
            </Text>
            <Text style={[styles.languageArrow, { color: colors.primary }]}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Theme Selector */}
        <View style={[styles.languageSection, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.infoLabel, { color: colors.primary }]}>{t('profile.theme')}:</Text>
          <TouchableOpacity
            style={[styles.languageButton, { backgroundColor: colors.background, borderColor: colors.primary }]}
            onPress={() => setThemeModalVisible(true)}
          >
            <Text style={[styles.languageButtonText, { color: colors.primary }]}>
              {themeMode === 'light' ? t('profile.themeLight') :
               themeMode === 'dark' ? t('profile.themeDark') :
               t('profile.themeSystem')}
            </Text>
            <Text style={[styles.languageArrow, { color: colors.primary }]}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.selectLanguage')}</Text>
            {LANGUAGES.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  i18n.language === language.code && styles.languageOptionSelected
                ]}
                onPress={async () => {
                  const currentIsRTL = I18nManager.isRTL;
                  const newIsRTL = isRTL(language.code);

                  setLanguageModalVisible(false);

                  // If switching between RTL and LTR, auto-restart will happen
                  if (currentIsRTL !== newIsRTL) {
                    // changeLanguage will auto-restart the app
                    await changeLanguage(language.code, true);
                  } else {
                    await changeLanguage(language.code, false);
                    Alert.alert(t('common.success'), `${t('profile.language')}: ${language.nativeName}`);
                  }
                }}
              >
                <Text style={[
                  styles.languageOptionText,
                  i18n.language === language.code && styles.languageOptionTextSelected
                ]}>
                  {language.nativeName}
                </Text>
                {i18n.language === language.code && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Theme Selection Modal */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setThemeModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.primary }]}>{t('profile.selectTheme')}</Text>
            {THEME_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.mode}
                style={[
                  styles.languageOption,
                  { backgroundColor: colors.backgroundSecondary },
                  themeMode === option.mode && [styles.languageOptionSelected, { backgroundColor: colors.primary }]
                ]}
                onPress={async () => {
                  setThemeModalVisible(false);
                  await setThemeMode(option.mode);
                }}
              >
                <Text style={[
                  styles.languageOptionText,
                  { color: colors.textPrimary },
                  themeMode === option.mode && [styles.languageOptionTextSelected, { color: colors.textOnPrimary }]
                ]}>
                  {t(option.labelKey)}
                </Text>
                {themeMode === option.mode && (
                  <Text style={[styles.checkmark, { color: colors.textOnPrimary }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.lightGray }]}
              onPress={() => setThemeModalVisible(false)}
            >
              <Text style={[styles.modalCloseButtonText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Progress Chart Section */}
      <View style={[styles.cardSection, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('home.wasteHistory')}</Text>
        <RNScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, alignItems: 'center' }}>
          <View style={{ width: chartWidth, alignItems: 'center' }}>
            <BarChart
              data={{
                labels: barLabels,
                datasets: [{ data: barData }],
              }}
              width={chartWidth}
              height={220}
              chartConfig={{
                ...getChartConfig(colors, isDarkMode),
                propsForLabels: { fontSize: 12 },
              }}
              verticalLabelRotation={15}
              showValuesOnTopOfBars
              fromZero
              style={{ ...styles.chart, marginBottom: spacing.sm + 4 }}
              yAxisLabel=""
              yAxisSuffix="kg"
            />
          </View>
        </RNScrollView>
        {/* End chart scroll */}
      </View>

      {/* Achievements Section */}
      <View style={styles.cardSection}>
        <Text style={styles.sectionTitle}>{t('profile.achievements')}</Text>
        {achievements.length > 0 ? (
          achievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementItem}>
              <View style={styles.achievementIconWrapper}>
                <Image source={PROFILE_PLACEHOLDER} style={styles.achievementIcon} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
                <Text style={styles.achievementDate}>Earned: {new Date(achievement.date_earned).toLocaleDateString()}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noAchievements}>{t('achievements.myAchievements')}</Text>
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>{t('common.logout')}</Text>
      </TouchableOpacity>
    </View>
  );
};

// ───────────────────────────── Profile Screen with Pull-to-Refresh

export const ProfileScreen: React.FC = () => {
  const { fetchUserData } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchUserData();             // refresh AuthContext (triggers ProfileMain rerender)
    setRefreshing(false);
  }, [fetchUserData]);

  return (
    <ScreenWrapper
      title="Profile"
      refreshing={refreshing}
      onRefresh={onRefresh}
      testID="profile-screen"
      accessibilityLabel="User profile screen with personal information and statistics"
    >
      <ProfileMain />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: defaultColors.backgroundSecondary,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  mainContainer: {
    width: '100%',
    backgroundColor: defaultColors.background,
    borderRadius: 16,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    shadowColor: defaultColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
  },
  profilePicWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: defaultColors.backgroundSecondary,
    backgroundColor: defaultColors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: defaultColors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  profilePic: {
    width: 86,
    height: 86,
    borderRadius: 43,
    resizeMode: 'cover',
  },
  title: {
    ...typography.h2,
    color: defaultColors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  infoContainer: {
    width: '100%',
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  infoText: {
    ...typography.body,
    marginBottom: spacing.xs,
    color: defaultColors.textPrimary,
    textAlign: 'center',
  },
  infoLabel: {
    fontWeight: 'bold',
    color: defaultColors.primary,
  },
  sectionTitle: {
    ...typography.h3,
    color: defaultColors.primary,
    textAlign: 'left',
    marginBottom: spacing.md,
  },
  cardSection: {
    width: '100%',
    backgroundColor: defaultColors.backgroundSecondary,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: defaultColors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  chart: {
    borderRadius: 12,
    paddingRight: 40,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: defaultColors.background,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    shadowColor: defaultColors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  achievementIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: defaultColors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  achievementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  achievementTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: defaultColors.primary,
    marginBottom: 2,
  },
  achievementDescription: {
    ...typography.caption,
    color: defaultColors.textSecondary,
    marginBottom: 2,
  },
  achievementDate: {
    ...typography.caption,
    color: defaultColors.gray,
  },
  noAchievements: {
    ...typography.body,
    color: defaultColors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  uploadingOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    backgroundColor: defaultColors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    ...typography.button,
    color: defaultColors.textOnPrimary,
  },
  bioText: {
    ...typography.body,
    color: defaultColors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    ...commonStyles.input,
    width: '100%',
  },
  saveButton: {
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: defaultColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageSection: {
    width: '100%',
    marginTop: 16,
    padding: 16,
    backgroundColor: defaultColors.backgroundSecondary,
    borderRadius: 10,
    alignItems: 'center',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: defaultColors.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: defaultColors.primary,
    marginTop: 8,
    minWidth: 200,
    minHeight: MIN_TOUCH_TARGET,
  },
  languageButtonText: {
    ...typography.body,
    color: defaultColors.primary,
    fontWeight: '600',
  },
  languageArrow: {
    fontSize: 12,
    color: defaultColors.primary,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: defaultColors.background,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    ...typography.h3,
    color: defaultColors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: defaultColors.backgroundSecondary,
    minHeight: MIN_TOUCH_TARGET,
  },
  languageOptionSelected: {
    backgroundColor: defaultColors.primary,
  },
  languageOptionText: {
    ...typography.body,
    color: defaultColors.textPrimary,
  },
  languageOptionTextSelected: {
    color: defaultColors.textOnPrimary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: defaultColors.textOnPrimary,
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: defaultColors.lightGray,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    ...typography.body,
    color: defaultColors.textSecondary,
    fontWeight: '600',
  },
});
