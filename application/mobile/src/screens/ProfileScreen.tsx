import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, Image, ScrollView as RNScrollView, TouchableOpacity, Platform, Alert, RefreshControl, TextInput } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { colors, spacing, typography, commonStyles } from '../utils/theme';
import { MIN_TOUCH_TARGET } from '../utils/accessibility';
import { wasteService, achievementService, profileService, API_URL, profilePublicService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { storage } from '../utils/storage';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useAppNavigation } from '../hooks/useNavigation';

const chartConfig = {
  backgroundGradientFrom: colors.backgroundSecondary,
  backgroundGradientTo: colors.backgroundSecondary,
  color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`, // colors.primary
  labelColor: (opacity = 1) => `rgba(33, 33, 33, ${opacity})`, // colors.textPrimary
  barPercentage: 0.7,
  decimalPlaces: 0,
};

const PROFILE_PLACEHOLDER = require('../assets/profile_placeholder.png');

// Main profile component that handles the user data display
const ProfileMain: React.FC = () => {
  const { userData, fetchUserData, logout } = useAuth();
  const { navigateToScreen } = useAppNavigation();
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

  // Load auth token once on mount
  useEffect(() => {
    (async () => {
      const token = await storage.getToken();
      setAuthToken(token);
      console.log('Auth token loaded');
    })();
  }, []);

  const getProfilePictureUrl = (username: string) => {
    // Use the dedicated endpoint for profile pictures
    const url = `${API_URL}/api/profile/${username}/picture/`;
    console.log('Generated profile picture URL:', url);
    return url;
  };

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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchBio();
  }, [fetchBio]); // fetchBio already depends on userData?.username

  // Prepare data for BarChart - handle the specific waste data structure
  const screenWidth = Dimensions.get('window').width - 40;
  const barLabels = wasteData.map((item) => item.waste_type || '');
  const barData = wasteData.map((item) => item.total_amount || 0);
  const chartWidth = Math.max(screenWidth - 32, barLabels.length * 80);

  const profileImageSource = (() => {
    console.log('Current userData state:', JSON.stringify(userData, null, 2));

    // Always try to load the profile picture if we have a username
    if (userData?.username) {
      if (!authToken) {
        console.warn('Auth token not yet loaded, using placeholder');
        return PROFILE_PLACEHOLDER;
      }

      const source = {
        uri: getProfilePictureUrl(userData.username),
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        cache: 'reload',
      } as const;
      console.log('Using profile image source:', JSON.stringify(source, null, 2));
      return source;
    }

    console.log('No username available, using placeholder');
    return PROFILE_PLACEHOLDER;
  })();

  console.log('Profile image source:', profileImageSource);

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
      console.log('User data refreshed after upload');

      // Force a re-render by updating state
      setUploading(false); // This will trigger a re-render

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
    <View style={styles.mainContainer}>
      {/* Profile Picture */}
      <TouchableOpacity style={styles.profilePicWrapper} onPress={handleChoosePhoto} disabled={uploading}>
        <Image
          source={profileImageSource}
          style={styles.profilePic}
          onError={(error) => {
            console.error('Profile image loading error:', error.nativeEvent);
            // On error, fall back to placeholder image
            if (error.nativeEvent.error) {
              console.log('Falling back to placeholder image');
              // Force a re-render with placeholder
              setProfileImageLoadError(true);
            }
          }}
          onLoad={() => {
            console.log('Profile image loaded successfully');
            setProfileImageLoadError(false);
          }}
          // Force image refresh on each render
          key={Date.now()}
        />
        {uploading && (
          <View style={[StyleSheet.absoluteFill, styles.uploadingOverlay]}>
            <ActivityIndicator size="small" color="#FFF" />
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.title}>User Profile</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Name:</Text> {userData?.username || 'Loading...'}</Text>
        {editingBio ? (
          <View style={{ width:'100%', alignItems:'center', marginBottom: spacing.sm }}>
            <TextInput
              style={[styles.input, {height:80}]}
              multiline
              value={bioInput}
              onChangeText={setBioInput}
              placeholder="Enter your bio"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={{flexDirection:'row', marginTop: spacing.xs}}>
              <TouchableOpacity style={[styles.saveButton,{marginRight: spacing.sm}]} onPress={async ()=>{
                try{
                  await profileService.updateBio(userData!.username,bioInput);
                  setBio(bioInput);
                  setEditingBio(false);
                }catch(err){Alert.alert('Error','Could not update bio');}
              }}>
                <Text style={styles.logoutButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutButton} onPress={()=>{setEditingBio(false);}}>
                <Text style={styles.logoutButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{alignItems:'center', marginBottom: spacing.sm}}>
            <Text style={styles.bioText}>{bio || 'No bio yet.'}</Text>
            <TouchableOpacity
              style={{minHeight: MIN_TOUCH_TARGET, justifyContent: 'center'}}
              onPress={()=>{setBioInput(bio); setEditingBio(true);}}
            >
              <Text style={{color: colors.primary, ...typography.body}}>Edit Bio</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Progress Chart Section */}
      <View style={styles.cardSection}>
        <Text style={styles.sectionTitle}>Your Recycling Progress</Text>
        <RNScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}>
          <View style={{ width: chartWidth, alignItems: 'center' }}>
            <BarChart
              data={{
                labels: barLabels,
                datasets: [{ data: barData }],
              }}
              width={chartWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                propsForLabels: { fontSize: 12 },
              }}
              verticalLabelRotation={15}
              showValuesOnTopOfBars
              fromZero
              style={{ ...styles.chart, marginBottom: 12 }}
              yAxisLabel=""
              yAxisSuffix="kg"
            />
          </View>
        </RNScrollView>
        {/* End chart scroll */}
      </View>

      {/* Achievements Section */}
      <View style={styles.cardSection}>
        <Text style={styles.sectionTitle}>Your Achievements</Text>
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
          <Text style={styles.noAchievements}>No achievements yet. Keep recycling to earn badges!</Text>
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
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
    backgroundColor: colors.backgroundSecondary,
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
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    shadowColor: colors.black,
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
    borderColor: colors.backgroundSecondary,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
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
    color: colors.primary,
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
    color: colors.textPrimary,
    textAlign: 'center',
  },
  infoLabel: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
    textAlign: 'left',
    marginBottom: spacing.md,
  },
  cardSection: {
    width: '100%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
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
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  achievementIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
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
    color: colors.primary,
    marginBottom: 2,
  },
  achievementDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  achievementDate: {
    ...typography.caption,
    color: colors.gray,
  },
  noAchievements: {
    ...typography.body,
    color: colors.textSecondary,
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
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  bioText: {
    ...typography.body,
    color: colors.textPrimary,
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
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
