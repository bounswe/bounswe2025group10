import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, Image, ScrollView as RNScrollView, TouchableOpacity, Platform, Alert, RefreshControl, TextInput, Modal, Switch } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors as defaultColors, spacing, typography, commonStyles, lightColors, darkColors } from '../utils/theme';
import { useRTL } from '../hooks/useRTL';
import { MIN_TOUCH_TARGET } from '../utils/accessibility';
import { wasteService, achievementService, badgeService, profileService, profilePublicService, getProfilePictureUrl, UserBadge } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { storage } from '../utils/storage';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useAppNavigation } from '../hooks/useNavigation';
import { useTranslation } from 'react-i18next';
import { changeLanguage, LANGUAGES, isRTL } from '../i18n';
import { I18nManager } from 'react-native';
import { WasteFilterModal, WasteFilters, getDefaultFilters } from '../components/WasteFilterModal';
import { useWasteFilters, WasteDataItem } from '../hooks/useWasteFilters';
import { logger } from '../utils/logger';


const PROFILE_PLACEHOLDER = require('../assets/profile_placeholder.png');

// Badge helper functions
const getBadgeTierColor = (tier?: string): string => {
  switch (tier?.toLowerCase()) {
    case 'bronze': return '#CD7F32';
    case 'silver': return '#C0C0C0';
    case 'gold': return '#FFD700';
    case 'platinum': return '#E5E4E2';
    case 'diamond': return '#B9F2FF';
    default: return '#CD7F32';
  }
};

const getBadgeCategoryEmoji = (category?: string): string => {
  switch (category?.toUpperCase()) {
    case 'PLASTIC': return '♳';
    case 'PAPER': return '📄';
    case 'GLASS': return '🫙';
    case 'METAL': return '🥫';
    case 'ELECTRONIC': return '📱';
    case 'OIL_AND_FATS': return '🛢️';
    case 'OIL&FATS': return '🛢️'; // Legacy support
    case 'ORGANIC': return '🥬';
    case 'TOTAL_WASTE': return '♻️';
    case 'CONTRIBUTIONS': return '✍️';
    case 'LIKES_RECEIVED': return '❤️';
    case 'LIKES': return '❤️'; // Legacy support
    default: return '🏅';
  }
};

// Theme mode options for display
const THEME_OPTIONS: { mode: ThemeMode; labelKey: string }[] = [
  { mode: 'light', labelKey: 'profile.themeLight' },
  { mode: 'dark', labelKey: 'profile.themeDark' },
  { mode: 'system', labelKey: 'profile.themeSystem' },
];

// User type for followers/following list
interface FollowUser {
  id: number;
  username: string;
  profile_image?: string | null;
  bio?: string | null;
}

// Main profile component that handles the user data display
const ProfileMain: React.FC = () => {
  const { userData, fetchUserData, logout } = useAuth();
  const { navigateToScreen } = useAppNavigation();
  const { t, i18n } = useTranslation();
  const { textStyle, rowStyle } = useRTL();
  const { colors, isDarkMode, themeMode, setThemeMode } = useTheme();
  const [wasteData, setWasteData] = useState<WasteDataItem[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [uploading, setUploading] = useState(false);
  const [_refreshing, setRefreshing] = useState(false);
  const [_profileImageLoadError, setProfileImageLoadError] = useState(false);
  const [profilePicTimestamp, setProfilePicTimestamp] = useState(Date.now());
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [bio, setBio] = useState<string>('');
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState<string>('');
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  
  // Follow state
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [followingModalVisible, setFollowingModalVisible] = useState(false);
  const [followersList, setFollowersList] = useState<FollowUser[]>([]);
  const [followingList, setFollowingList] = useState<FollowUser[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  
  // Privacy settings state
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loadingPrivacy, setLoadingPrivacy] = useState(false);

  // Load auth token once on mount
  useEffect(() => {
    (async () => {
      const token = await storage.getToken();
      setAuthToken(token);
      logger.log('Auth token loaded');
    })();
  }, []);

  const fetchBio = useCallback(async () => {
    if (!userData?.username) {return;}
    try {
      const data = await profilePublicService.getUserBio(userData.username);
      setBio(data.bio || '');
    } catch (err) {
      logger.warn('Error fetching bio');
    }
  }, [userData?.username]);

  const fetchFollowStats = useCallback(async () => {
    if (!userData?.username) {return;}
    try {
      const data = await profileService.getFollowStatus(userData.username);
      if (data && data.data) {
        setFollowersCount(data.data.followers_count || 0);
        setFollowingCount(data.data.following_count || 0);
      }
    } catch (err) {
      logger.warn('Error fetching follow stats:', err);
    }
  }, [userData?.username]);
  
  const fetchPrivacySettings = useCallback(async () => {
    try {
      const response = await profileService.getPrivacySettings();
      if (response && response.data) {
        setIsAnonymous(response.data.is_anonymous || false);
      }
    } catch (err) {
      console.warn('Error fetching privacy settings:', err);
    }
  }, []);
  
  const updatePrivacySetting = async (value: boolean) => {
    setLoadingPrivacy(true);
    try {
      await profileService.updatePrivacySettings({ is_anonymous: value });
      setIsAnonymous(value);
      Alert.alert(t('common.success'), t('profile.privacyUpdated'));
    } catch (err) {
      console.error('Error updating privacy settings:', err);
      Alert.alert(t('common.error'), 'Failed to update privacy settings');
      // Revert the change
      setIsAnonymous(!value);
    } finally {
      setLoadingPrivacy(false);
    }
  };

  const handleOpenFollowers = async () => {
    if (!userData?.username) {return;}
    setFollowersModalVisible(true);
    setLoadingFollowers(true);
    try {
      const data = await profileService.getFollowers(userData.username);
      if (data && data.data && data.data.followers) {
        setFollowersList(data.data.followers);
        setFollowersCount(data.data.followers_count || data.data.followers.length);
      }
    } catch (err) {
      logger.warn('Error fetching followers:', err);
      Alert.alert(t('common.error', 'Error'), t('profile.failedToLoadFollowers', 'Failed to load followers'));
    } finally {
      setLoadingFollowers(false);
    }
  };

  const handleOpenFollowing = async () => {
    if (!userData?.username) {return;}
    setFollowingModalVisible(true);
    setLoadingFollowing(true);
    try {
      const data = await profileService.getFollowing(userData.username);
      if (data && data.data && data.data.following) {
        setFollowingList(data.data.following);
        setFollowingCount(data.data.following_count || data.data.following.length);
      }
    } catch (err) {
      logger.warn('Error fetching following:', err);
      Alert.alert(t('common.error', 'Error'), t('profile.failedToLoadFollowing', 'Failed to load following'));
    } finally {
      setLoadingFollowing(false);
    }
  };

  const handleNavigateToProfile = (username: string) => {
    setFollowersModalVisible(false);
    setFollowingModalVisible(false);
    navigateToScreen('OtherProfile', { username });
  };

  const fetchData = async () => {
    try {
      const [wasteResponse, achievementsResponse, badgesResponse, progressResponse] = await Promise.all([
        wasteService.getUserWastes(),
        achievementService.getUserAchievements(),
        badgeService.getUserBadges().catch(() => ({ data: { badges: [] } })),
        badgeService.getBadgeProgress().catch(() => []),
      ]);

      // Handle waste data - map WasteEntry to WasteDataItem
      if (wasteResponse.data && Array.isArray(wasteResponse.data)) {
        const mappedData: WasteDataItem[] = wasteResponse.data.map(entry => ({
          waste_type: entry.waste_type,
          total_amount: entry.total_amount,
          records: [],
        }));
        setWasteData(mappedData);
      }

      // Handle achievements data - extract from response.data.achievements
      const achievementsData = achievementsResponse?.data?.achievements || [];
      if (Array.isArray(achievementsData)) {
        setAchievements(achievementsData.map((item: any) => ({
          id: item.id,
          title: item.achievement?.title || 'Achievement',
          description: item.achievement?.description || '',
          date_earned: item.earned_at,
        })));
      }

      // Handle badges data
      const badgesData = badgesResponse?.data?.badges || [];
      if (Array.isArray(badgesData)) {
        setBadges(badgesData);
      }

      // Handle badge progress data - API returns { progress: { CATEGORY: {...}, ... } }
      const progressObj = progressResponse?.progress || {};
      // Convert object to array format for UI iteration
      const progressArray = Object.entries(progressObj).map(([category, data]: [string, any]) => ({
        category,
        current_value: data.current_value || 0,
        required_value: data.required_value,
        percentage: data.percentage || 0,
        next_badge: data.next_badge,
        all_earned: data.all_earned || false,
      }));
      setBadgeProgress(progressArray);
    } catch (error) {
      logger.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load profile data. Please pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data when screen comes into focus (e.g., after logging waste on HomeScreen)
  useFocusEffect(
    useCallback(() => {
      fetchData();
      fetchBio();
      fetchFollowStats();
      fetchPrivacySettings();
    }, [fetchBio, fetchFollowStats, fetchPrivacySettings])
  );

  // Prepare data for horizontal bar chart
  const chartData = filteredData.map((item) => {
    const wasteType = item.waste_type?.toUpperCase();
    const translated = t(`home.wasteTypes.${wasteType}`, { defaultValue: item.waste_type });
    // Convert grams to kg for display
    const valueInKg = (item.total_amount || 0) / 1000;
    return {
      label: translated,
      value: valueInKg,
      type: wasteType,
    };
  });

  // Find max value for scaling bars
  const maxValue = Math.max(...chartData.map(d => d.value), 0.1);

  // Check if there's any data to display
  const hasData = chartData.some(d => d.value > 0);

  // Try to load profile picture from API, fall back to placeholder on error
  const profileImageSource = userData?.username && !_profileImageLoadError
    ? { uri: getProfilePictureUrl(userData.username, profilePicTimestamp) }
    : PROFILE_PLACEHOLDER;

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
        logger.log('User cancelled image picker');
        return;
      }

      const asset = result.assets[0];
      if (!asset?.uri) {
        logger.error('No image URI available');
        Alert.alert('Error', 'Could not obtain image URI');
        return;
      }

      setUploading(true);
      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || `profile_${Date.now()}.jpg`,
      } as any);

      const uploadResponse = await profileService.uploadProfilePicture(formData);
      logger.log('Upload response received');

      // Force reload user data
      await fetchUserData();

      // Reset error state and update timestamp to force image reload
      setProfileImageLoadError(false);
      setProfilePicTimestamp(Date.now());

      await fetchData();
      Alert.alert('Success', 'Profile picture updated');
    } catch (error: unknown) {
      const uploadError = error as { message?: string; response?: { data?: { error?: string }; status?: number } };
      logger.error('Upload error details:', uploadError.message);
      logger.error('Upload error response:', JSON.stringify(uploadError.response?.data));
      logger.error('Upload error status:', uploadError.response?.status);
      const errorMessage = uploadError.response?.data?.error || 'Could not upload profile picture';
      Alert.alert('Error', errorMessage);
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
      
      {/* Followers / Following Stats */}
      <View style={styles.followStatsRow}>
        <TouchableOpacity style={styles.followStatItem} onPress={handleOpenFollowers}>
          <Text style={[styles.followStatNumber, { color: colors.textPrimary }]}>{followersCount}</Text>
          <Text style={[styles.followStatLabel, { color: colors.textSecondary }]}>{t('profile.followers', 'Followers')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.followStatItem} onPress={handleOpenFollowing}>
          <Text style={[styles.followStatNumber, { color: colors.textPrimary }]}>{followingCount}</Text>
          <Text style={[styles.followStatLabel, { color: colors.textSecondary }]}>{t('profile.following', 'Following')}</Text>
        </TouchableOpacity>
      </View>
      
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
                if (!userData?.username) {
                  Alert.alert('Error', 'User data not available');
                  return;
                }
                try{
                  await profileService.updateBio(userData.username, bioInput);
                  setBio(bioInput);
                  setEditingBio(false);
                }catch(err){
                  logger.error('Error updating bio:', err);
                  Alert.alert('Error','Could not update bio');
                }
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
        
        {/* Privacy Settings Section */}
        <View style={[styles.privacySection, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.sectionTitleSmall, { color: colors.primary }]}>{t('profile.privacySettings')}</Text>
          
          {/* Anonymous Mode */}
          <View style={styles.privacySettingRow}>
            <View style={styles.privacySettingInfo}>
              <Text style={[styles.privacySettingTitle, { color: colors.textPrimary }]}>
                {t('profile.anonymousMode')}
              </Text>
              <Text style={[styles.privacySettingDesc, { color: colors.textSecondary }]}>
                {t('profile.anonymousModeDesc')}
              </Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={updatePrivacySetting}
              trackColor={{ false: colors.lightGray, true: colors.primary }}
              thumbColor={isAnonymous ? colors.white : colors.gray}
              disabled={loadingPrivacy}
            />
          </View>
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
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.primary }]}>{t('profile.selectLanguage')}</Text>
            {LANGUAGES.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  { backgroundColor: colors.backgroundSecondary },
                  i18n.language === language.code && [styles.languageOptionSelected, { backgroundColor: colors.primary }]
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
                  { color: colors.textPrimary },
                  i18n.language === language.code && [styles.languageOptionTextSelected, { color: colors.textOnPrimary }]
                ]}>
                  {language.nativeName}
                </Text>
                {i18n.language === language.code && (
                  <Text style={[styles.checkmark, { color: colors.textOnPrimary }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.lightGray }]}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={[styles.modalCloseButtonText, { color: colors.textPrimary }]}>{t('common.cancel')}</Text>
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

      {/* Followers Modal */}
      <Modal
        visible={followersModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFollowersModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFollowersModalVisible(false)}
        >
          <View style={[styles.followModalContent, { backgroundColor: colors.background }]}>
            <View style={styles.followModalHeader}>
              <Text style={[styles.modalTitle, { color: colors.primary, marginBottom: 0 }]}>{t('profile.followers', 'Followers')}</Text>
              <TouchableOpacity onPress={() => setFollowersModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {loadingFollowers ? (
              <View style={styles.followListLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : followersList.length === 0 ? (
              <Text style={[styles.emptyFollowText, { color: colors.textSecondary }]}>
                {t('profile.noFollowers', 'No followers yet.')}
              </Text>
            ) : (
              <ScrollView style={styles.followList} showsVerticalScrollIndicator={false}>
                {followersList.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[styles.followUserItem, { borderColor: colors.lightGray }]}
                    onPress={() => handleNavigateToProfile(user.username)}
                  >
                    <Image
                      source={user.profile_image ? { uri: user.profile_image } : PROFILE_PLACEHOLDER}
                      style={styles.followUserAvatar}
                    />
                    <View style={styles.followUserInfo}>
                      <Text style={[styles.followUserName, { color: colors.textPrimary }]}>{user.username}</Text>
                      {user.bio && (
                        <Text style={[styles.followUserBio, { color: colors.textSecondary }]} numberOfLines={1}>
                          {user.bio}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.followUserArrow, { color: colors.textSecondary }]}>›</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Following Modal */}
      <Modal
        visible={followingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFollowingModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFollowingModalVisible(false)}
        >
          <View style={[styles.followModalContent, { backgroundColor: colors.background }]}>
            <View style={styles.followModalHeader}>
              <Text style={[styles.modalTitle, { color: colors.primary, marginBottom: 0 }]}>{t('profile.following', 'Following')}</Text>
              <TouchableOpacity onPress={() => setFollowingModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {loadingFollowing ? (
              <View style={styles.followListLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : followingList.length === 0 ? (
              <Text style={[styles.emptyFollowText, { color: colors.textSecondary }]}>
                {t('profile.noFollowing', 'Not following anyone yet.')}
              </Text>
            ) : (
              <ScrollView style={styles.followList} showsVerticalScrollIndicator={false}>
                {followingList.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[styles.followUserItem, { borderColor: colors.lightGray }]}
                    onPress={() => handleNavigateToProfile(user.username)}
                  >
                    <Image
                      source={user.profile_image ? { uri: user.profile_image } : PROFILE_PLACEHOLDER}
                      style={styles.followUserAvatar}
                    />
                    <View style={styles.followUserInfo}>
                      <Text style={[styles.followUserName, { color: colors.textPrimary }]}>{user.username}</Text>
                      {user.bio && (
                        <Text style={[styles.followUserBio, { color: colors.textSecondary }]} numberOfLines={1}>
                          {user.bio}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.followUserArrow, { color: colors.textSecondary }]}>›</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Progress Chart Section */}
      <View style={[styles.chartContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={[styles.chartHeaderRow, rowStyle]}>
          <Text style={[styles.sectionTitle, textStyle, { color: colors.primary }]}>{t('home.wasteHistory')}</Text>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: filtersActive ? colors.primary : colors.background,
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
          <View style={[styles.activeFiltersBar, { backgroundColor: colors.background }]}>
            <Text style={[styles.activeFiltersText, { color: colors.textSecondary }]}>
              {t(`filter.timeRanges.${filters.timeRange}`)} • {filters.wasteTypes.length} {t('filter.wasteTypes').toLowerCase()}
            </Text>
          </View>
        )}

        <View style={styles.chartPlaceholder}>
          {loading ? (
            <Text style={{ color: colors.textSecondary }}>{t('common.loading')}</Text>
          ) : hasData ? (
            <View style={styles.horizontalChartContainer}>
              {chartData.map((item, index) => (
                <View key={item.type || index} style={styles.horizontalBarRow}>
                  <Text style={[styles.horizontalBarLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <View style={styles.horizontalBarWrapper}>
                    <View
                      style={[
                        styles.horizontalBar,
                        {
                          width: `${Math.max((item.value / maxValue) * 100, 2)}%`,
                          backgroundColor: isDarkMode ? '#66BB6A' : '#228B22',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.horizontalBarValue, { color: colors.textSecondary }]}>
                    {item.value.toFixed(2)} kg
                  </Text>
                </View>
              ))}
            </View>
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

      {/* Achievements Section */}
      <View style={[styles.cardSection, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('profile.achievements')}</Text>
        {achievements.length > 0 ? (
          achievements.map((achievement) => (
            <View key={achievement.id} style={[styles.achievementItem, { backgroundColor: colors.background }]}>
              <View style={[styles.achievementIconWrapper, { backgroundColor: colors.backgroundSecondary }]}>
                <Image source={PROFILE_PLACEHOLDER} style={styles.achievementIcon} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.achievementTitle, { color: colors.primary }]}>{achievement.title}</Text>
                <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>{achievement.description}</Text>
                <Text style={[styles.achievementDate, { color: colors.textSecondary }]}>Earned: {new Date(achievement.date_earned).toLocaleDateString()}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.noAchievements, { color: colors.textSecondary }]}>{t('achievements.myAchievements')}</Text>
        )}
      </View>

      {/* Badges Section */}
      <View style={[styles.cardSection, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Badges</Text>
        {badges.length > 0 ? (
          <View style={styles.badgesGrid}>
            {badges.map((userBadge) => (
              <View key={userBadge.id} style={[styles.badgeItem, { backgroundColor: colors.background }]}>
                <View style={[styles.badgeIconWrapper, { backgroundColor: getBadgeTierColor(userBadge.badge?.tier) }]}>
                  <Text style={styles.badgeEmoji}>{getBadgeCategoryEmoji(userBadge.badge?.category)}</Text>
                </View>
                <Text style={[styles.badgeName, { color: colors.textPrimary }]} numberOfLines={2}>
                  {userBadge.badge?.name || 'Badge'}
                </Text>
                <Text style={[styles.badgeTier, { color: getBadgeTierColor(userBadge.badge?.tier) }]}>
                  {userBadge.badge?.tier?.toUpperCase() || 'BRONZE'}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.noAchievements, { color: colors.textSecondary }]}>No badges earned yet. Keep recycling!</Text>
        )}
      </View>

      {/* Badge Progress Section */}
      <View style={[styles.cardSection, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Badge Progress</Text>
        {badgeProgress.length > 0 ? (
          <View style={styles.progressContainer}>
            {badgeProgress.map((item: any, index: number) => {
              const category = item.category || 'UNKNOWN';
              const currentValue = Math.round(item.current_value || 0);
              const requiredValue = item.required_value;
              const percentage = item.percentage || 0;
              const nextBadge = item.next_badge;
              const allEarned = item.all_earned || false;

              // Convert level to tier name for display
              const nextLevel = nextBadge?.level || 1;
              const tierNames = ['', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
              const nextTierName = tierNames[nextLevel] || 'Bronze';
              const tierColorMap: Record<number, string> = {
                1: '#CD7F32', // Bronze
                2: '#C0C0C0', // Silver
                3: '#FFD700', // Gold
                4: '#E5E4E2', // Platinum
                5: '#B9F2FF', // Diamond
              };
              const tierColor = tierColorMap[nextLevel] || '#CD7F32';

              // If all badges earned in this category, show completion
              if (allEarned) {
                return (
                  <View key={`progress-${category}-${index}`} style={styles.progressItem}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressEmoji}>{getBadgeCategoryEmoji(category)}</Text>
                      <View style={styles.progressInfo}>
                        <Text style={[styles.progressCategory, { color: colors.textPrimary }]}>
                          {category.replace(/_/g, ' ')}
                        </Text>
                        <Text style={[styles.progressNextBadge, { color: colors.success }]}>
                          All badges earned! 🎉
                        </Text>
                      </View>
                      <Text style={[styles.progressValues, { color: colors.success }]}>
                        ✓
                      </Text>
                    </View>
                    <View style={[styles.progressBarBackground, { backgroundColor: colors.lightGray }]}>
                      <View
                        style={[styles.progressBarFill, { width: '100%', backgroundColor: colors.success }]}
                      />
                    </View>
                    <Text style={[styles.progressPercentage, { color: colors.success }]}>100%</Text>
                  </View>
                );
              }

              return (
                <View key={`progress-${category}-${index}`} style={styles.progressItem}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressEmoji}>{getBadgeCategoryEmoji(category)}</Text>
                    <View style={styles.progressInfo}>
                      <Text style={[styles.progressCategory, { color: colors.textPrimary }]}>
                        {category.replace(/_/g, ' ')}
                      </Text>
                      <Text style={[styles.progressNextBadge, { color: colors.textSecondary }]}>
                        Next: {nextTierName} Badge
                      </Text>
                    </View>
                    <Text style={[styles.progressValues, { color: colors.textSecondary }]}>
                      {currentValue}/{requiredValue !== null ? Math.round(requiredValue) : '?'}
                    </Text>
                  </View>
                  <View style={[styles.progressBarBackground, { backgroundColor: colors.lightGray }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: tierColor,
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressPercentage, { color: tierColor }]}>
                    {percentage.toFixed(0)}%
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.noAchievements, { color: colors.textSecondary }]}>
            Start logging waste to track your progress toward badges!
          </Text>
        )}
      </View>

      {/* Legal Links */}
      <View style={[styles.legalSection, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitleSmall, { color: colors.primary }]}>Legal</Text>
        <TouchableOpacity
          style={styles.legalLink}
          onPress={() => navigateToScreen('Legal', { type: 'terms' })}
        >
          <Text style={[styles.legalLinkText, { color: colors.textPrimary }]}>Terms of Service</Text>
          <Text style={[styles.legalLinkArrow, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.legalLink}
          onPress={() => navigateToScreen('Legal', { type: 'agreement' })}
        >
          <Text style={[styles.legalLinkText, { color: colors.textPrimary }]}>User Agreement</Text>
          <Text style={[styles.legalLinkArrow, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.error }]} onPress={logout}>
        <Text style={[styles.logoutButtonText, { color: colors.textOnPrimary }]}>{t('common.logout')}</Text>
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
    ...typography.h2,
    color: defaultColors.primary,
    marginBottom: spacing.xs,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginBottom: spacing.sm,
  },
  activeFiltersText: {
    ...typography.caption,
    textAlign: 'center',
  },
  emptyChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    minHeight: 150,
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
  chartPlaceholder: {
    width: '100%',
  },
  horizontalChartContainer: {
    width: '100%',
  },
  horizontalBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  horizontalBarLabel: {
    width: 80,
    fontSize: 12,
    fontWeight: '500',
  },
  horizontalBarWrapper: {
    flex: 1,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 10,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  horizontalBar: {
    height: '100%',
    borderRadius: 10,
    minWidth: 4,
  },
  horizontalBarValue: {
    width: 70,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
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
  // Badge styles
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: spacing.sm,
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  badgeIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeName: {
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeTier: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Badge Progress styles
  progressContainer: {
    width: '100%',
  },
  progressItem: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  progressInfo: {
    flex: 1,
  },
  progressCategory: {
    ...typography.body,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  progressNextBadge: {
    ...typography.caption,
    marginTop: 2,
  },
  progressValues: {
    ...typography.caption,
    fontWeight: '600',
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 4,
  },
  progressPercentage: {
    ...typography.caption,
    fontWeight: 'bold',
    textAlign: 'right',
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
    width: '100%',
    marginTop: spacing.md,
    marginBottom: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.md,
    borderRadius: 14,
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
  // Follow styles
  followStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  followStatItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  followStatNumber: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  followStatLabel: {
    ...typography.caption,
    marginTop: 2,
  },
  followModalContent: {
    backgroundColor: defaultColors.background,
    borderRadius: 16,
    padding: spacing.lg,
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  followModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: defaultColors.lightGray,
  },
  closeButton: {
    fontSize: 24,
    padding: spacing.xs,
  },
  followListLoading: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFollowText: {
    ...typography.body,
    textAlign: 'center',
    padding: spacing.lg,
    fontStyle: 'italic',
  },
  followList: {
    maxHeight: 350,
  },
  followUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  followUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: spacing.sm,
    backgroundColor: defaultColors.lightGray,
  },
  followUserInfo: {
    flex: 1,
    minWidth: 0,
  },
  followUserName: {
    ...typography.body,
    fontWeight: '600',
  },
  followUserBio: {
    ...typography.caption,
    marginTop: 2,
  },
  followUserArrow: {
    fontSize: 20,
    opacity: 0.5,
    marginLeft: spacing.sm,
  },
  // Privacy settings styles
  privacySection: {
    width: '100%',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  legalSection: {
    width: '100%',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  legalLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: defaultColors.lightGray,
  },
  legalLinkText: {
    ...typography.body,
  },
  legalLinkArrow: {
    fontSize: 20,
    fontWeight: '300',
  },
  sectionTitleSmall: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  privacySettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
  },
  privacySettingInfo: {
    flex: 1,
    marginRight: spacing.md,
    flexShrink: 1,
  },
  privacySettingTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
    flexWrap: 'wrap',
  },
  privacySettingDesc: {
    ...typography.caption,
    lineHeight: 18,
    flexWrap: 'wrap',
  },
});
