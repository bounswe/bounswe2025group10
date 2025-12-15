import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, FlatList, RefreshControl, Dimensions, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { profilePublicService, postService, getProfilePictureUrl } from '../services/api';
import { colors, spacing, typography } from '../utils/theme';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { logger } from '../utils/logger';

const PROFILE_PLACEHOLDER = require('../assets/profile_placeholder.png');

type RouteParams = {
  OtherProfile: {
    username: string;
  };
};

export const OtherUserProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RouteParams, 'OtherProfile'>>();
  const { username } = route.params;

  const [bio, setBio] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const fetchBio = useCallback(async () => {
    try {
      const data = await profilePublicService.getUserBio(username);
      setBio(data.bio || '');
    } catch (error) {
      logger.warn('Error fetching user bio:', error);
      Alert.alert('Error', 'Failed to load user profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [username]);

  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const response = await postService.getAllPosts();
      const allPosts = response.data || [];
      const userPosts = allPosts.filter((p: { creator_username: string }) => p.creator_username === username);
      setPosts(userPosts);
    } catch (error) {
      logger.warn('Error fetching posts for user:', error);
      Alert.alert('Error', 'Failed to load posts.');
    } finally{
      setLoadingPosts(false);
    }
  }, [username]);

  useEffect(() => {
    fetchBio();
    fetchPosts();
  }, [fetchBio, fetchPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchBio(), fetchPosts()]);
  }, [fetchBio, fetchPosts]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* TODO: Re-enable profile picture loading when backend is fixed */}
      <Image source={PROFILE_PLACEHOLDER} style={styles.profilePic} />
      <Text style={styles.username}>{username}</Text>
      {bio ? <Text style={styles.bio}>{bio}</Text> : null}
      <Text style={[styles.sectionTitle, { alignSelf: 'flex-start' }]}>Posts</Text>
    </View>
  );

  const renderPost = ({ item }: { item: any }) => {
    const screenWidth = Dimensions.get('window').width - 48; // padding
    return (
      <View style={styles.postItem}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={{ width: screenWidth, height: 180, borderRadius: 8, marginBottom: 8 }} />
        ) : null}
        {item.text ? <Text style={styles.postText}>{item.text}</Text> : null}
        <View style={styles.postStatsRow}>
          <Text style={styles.postStat}>👍 {item.like_count}</Text>
          <Text style={styles.postStat}>👎 {item.dislike_count}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper
      title={`${username}'s Profile`}
      scrollable={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <FlatList
        style={{ backgroundColor: colors.backgroundSecondary }}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        data={loadingPosts ? [] : posts}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
    resizeMode: 'cover',
    backgroundColor: colors.lightGray,
  },
  username: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  bio: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
    marginVertical: spacing.sm,
  },
  postItem: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    width: '100%',
  },
  postText: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  postStatsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  postStat: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
});
