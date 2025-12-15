import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, FlatList, RefreshControl, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { profilePublicService, postService, profileService, getProfilePictureUrl } from '../services/api';
import { colors, spacing, typography } from '../utils/theme';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { logger } from '../utils/logger';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

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
  const { userData } = useAuth();
  const { colors: themeColors } = useTheme();

  const [bio, setBio] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchBio = useCallback(async () => {
    try {
      const data = await profilePublicService.getUserBio(username);
      setBio(data.bio || '');
    } catch (error) {
      logger.warn('Error fetching user bio:', error);
      Alert.alert(t('common.error', 'Error'), t('profile.failedToLoad', 'Failed to load profile'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [username, t]);

  const fetchFollowStatus = useCallback(async () => {
    try {
      const data = await profileService.getFollowStatus(username);
      if (data && data.data) {
        setIsFollowing(data.data.is_following || false);
        setFollowersCount(data.data.followers_count || 0);
        setFollowingCount(data.data.following_count || 0);
      }
    } catch (error) {
      console.warn('Error fetching follow status:', error);
    }
  }, [username]);

  const handleFollowToggle = async () => {
    if (!userData) {
      Alert.alert(t('common.error', 'Error'), t('profile.loginToFollow', 'Please login to follow users'));
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await profileService.unfollowUser(username);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        Alert.alert(t('common.success', 'Success'), t('profile.unfollowed', 'Unfollowed successfully'));
      } else {
        await profileService.followUser(username);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        Alert.alert(t('common.success', 'Success'), t('profile.followed', 'Followed successfully'));
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || t('common.error');
      Alert.alert(t('common.error'), message);
    } finally {
      setFollowLoading(false);
    }
  };

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
    fetchFollowStatus();
  }, [fetchBio, fetchPosts, fetchFollowStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchBio(), fetchPosts(), fetchFollowStatus()]);
  }, [fetchBio, fetchPosts, fetchFollowStatus]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isOwnProfile = userData?.username === username;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Image
        source={username ? { uri: getProfilePictureUrl(username) } : PROFILE_PLACEHOLDER}
        style={styles.profilePic}
        defaultSource={PROFILE_PLACEHOLDER}
      />
      <Text style={[styles.username, { color: themeColors.primary }]}>{username}</Text>

      {/* Follow Stats */}
      <View style={styles.followStatsRow}>
        <View style={styles.followStatItem}>
          <Text style={[styles.followStatNumber, { color: themeColors.textPrimary }]}>{followersCount}</Text>
          <Text style={[styles.followStatLabel, { color: themeColors.textSecondary }]}>{t('profile.followers', 'Followers')}</Text>
        </View>
        <View style={styles.followStatItem}>
          <Text style={[styles.followStatNumber, { color: themeColors.textPrimary }]}>{followingCount}</Text>
          <Text style={[styles.followStatLabel, { color: themeColors.textSecondary }]}>{t('profile.following', 'Following')}</Text>
        </View>
      </View>

      {/* Follow Button - only show for other users */}
      {!isOwnProfile && userData && (
        <TouchableOpacity
          style={[
            styles.followButton,
            {
              backgroundColor: isFollowing ? 'transparent' : themeColors.primary,
              borderColor: isFollowing ? themeColors.lightGray : themeColors.primary,
            }
          ]}
          onPress={handleFollowToggle}
          disabled={followLoading}
        >
          {followLoading ? (
            <ActivityIndicator size="small" color={isFollowing ? themeColors.primary : themeColors.textOnPrimary} />
          ) : (
            <Text style={[
              styles.followButtonText,
              { color: isFollowing ? themeColors.textPrimary : themeColors.textOnPrimary }
            ]}>
              {isFollowing ? t('profile.unfollow', 'Unfollow') : t('profile.follow', 'Follow')}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {bio ? <Text style={[styles.bio, { color: themeColors.textPrimary }]}>{bio}</Text> : null}
      <Text style={[styles.sectionTitle, { alignSelf: 'flex-start', color: themeColors.primary }]}>{t('profile.posts', 'Posts')}</Text>
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
    marginBottom: spacing.xs,
  },
  bio: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
    marginVertical: spacing.sm,
  },
  // Follow styles
  followStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginVertical: spacing.sm,
  },
  followStatItem: {
    alignItems: 'center',
  },
  followStatNumber: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  followStatLabel: {
    ...typography.caption,
  },
  followButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 25,
    borderWidth: 1,
    minWidth: 120,
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  followButtonText: {
    ...typography.button,
    fontWeight: 'bold',
  },
  // Post styles
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
