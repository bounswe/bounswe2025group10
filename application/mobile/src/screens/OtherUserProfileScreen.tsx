import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { API_URL, profilePublicService } from '../services/api';
import { colors } from '../utils/theme';

const PROFILE_PLACEHOLDER = require('../assets/profile_placeholder.png');

type RouteParams = {
  OtherProfile: {
    username: string;
  };
};

export const OtherUserProfileScreen: React.FC = () => {
  const route = useRoute<RouteProp<RouteParams, 'OtherProfile'>>();
  const { username } = route.params;

  const [bio, setBio] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getProfilePictureUrl = (u: string) => `${API_URL}/api/profile/${u}/picture/`;

  const fetchBio = async () => {
    try {
      const data = await profilePublicService.getUserBio(username);
      setBio(data.bio || '');
    } catch (error) {
      console.warn('Error fetching user bio:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBio();
  }, [username]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBio();
  }, [username]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Image source={{ uri: getProfilePictureUrl(username) }} style={styles.profilePic} defaultSource={PROFILE_PLACEHOLDER} />
      <Text style={styles.username}>{username}</Text>
      {bio ? <Text style={styles.bio}>{bio}</Text> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#eafbe6',
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eafbe6',
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    resizeMode: 'cover',
    backgroundColor: colors.lightGray,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
}); 