import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, Image, ScrollView as RNScrollView, TouchableOpacity, Platform, Alert, RefreshControl } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { colors } from '../utils/theme';
import { wasteService, achievementService, profileService, API_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { storage } from '../utils/storage';

const chartConfig = {
  backgroundGradientFrom: '#eafbe6',
  backgroundGradientTo: '#eafbe6',
  color: (opacity = 1) => `rgba(34, 139, 34, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  barPercentage: 0.7,
  decimalPlaces: 0,
};

const PROFILE_PLACEHOLDER = require('../assets/profile_placeholder.png');

// Main profile component that handles the user data display
const ProfileMain: React.FC = () => {
  const { userData, fetchUserData, logout } = useAuth();
  const [wasteData, setWasteData] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profileImageLoadError, setProfileImageLoadError] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

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

  const fetchData = async () => {
    try {
      const [wasteResponse, challengesResponse] = await Promise.all([
        wasteService.getUserWastes(),
        achievementService.getUserAchievements()
      ]);
      
      // Handle waste data
      if (wasteResponse.message === "User wastes retrieved successfully") {
        setWasteData(wasteResponse.data);
      }

      // Handle challenges/achievements data
      if (Array.isArray(challengesResponse)) {
        setAchievements(challengesResponse.map(challenge => ({
          id: challenge.challenge,
          title: 'Challenge Achievement',
          description: `Joined challenge on ${new Date(challenge.joined_date).toLocaleDateString()}`,
          date_earned: challenge.joined_date
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData(); // Refresh user data including profile picture
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [userData]); // Add userData as dependency to refresh when it changes

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
  const handleChoosePhoto = () => {
    if (uploading) return;
    launchImageLibrary({ 
      mediaType: 'photo', 
      quality: 0.8,
      includeBase64: false,
    }, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      }
      if (response.errorCode) {
        console.error('ImagePicker Error:', response.errorCode, response.errorMessage);
        Alert.alert('Image Picker Error', response.errorMessage || 'Unknown error');
        return;
      }
      
      const asset: Asset | undefined = response.assets && response.assets[0];
      if (!asset?.uri) {
        console.error('No image URI available');
        Alert.alert('Error', 'Could not obtain image URI');
        return;
      }

      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('image', {
          uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `profile_${Date.now()}.jpg`,
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
    });
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
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={{ alignItems: 'center', paddingVertical: 24 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.container}>
        <ProfileMain />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#eafbe6',
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
    padding: 20,
  },
  mainContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
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
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#eafbe6',
    backgroundColor: '#eafbe6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
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
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#228B22',
    textAlign: 'center',
  },
  infoContainer: {
    width: '100%',
    marginBottom: 18,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
    textAlign: 'center',
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#228B22',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#228B22',
    textAlign: 'left',
  },
  cardSection: {
    width: '100%',
    backgroundColor: '#f8fff6',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  chart: {
    borderRadius: 12,
    paddingRight: 40,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  achievementIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eafbe6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#228B22',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  achievementDate: {
    fontSize: 12,
    color: '#888',
  },
  noAchievements: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  uploadingOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    marginTop: 6,
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#ff4d4f',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
}); 