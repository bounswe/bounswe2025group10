import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { MoreDropdown } from '../components/MoreDropdown';
import { activityService, profileService, postService, ActivityItem } from '../services/api';
import { colors as defaultColors, spacing, typography } from '../utils/theme';
import { useAppNavigation } from '../hooks/useNavigation';

const PROFILE_PLACEHOLDER = require('../assets/profile_placeholder.png');

// Activity type filters (posts includes created, liked, disliked)
const ACTIVITY_TYPES = ['all', 'posts', 'waste', 'achievement', 'challenge', 'follow'] as const;
type ActivityTypeFilter = typeof ACTIVITY_TYPES[number];

// Post-related activity types (grouped under 'posts' filter)
const POST_ACTIVITY_TYPES = ['post', 'like', 'dislike'];

// Activity type icons
const ACTIVITY_ICONS: Record<string, string> = {
  post: '📝',
  posts: '📝',
  like: '👍',
  dislike: '👎',
  waste: '♻️',
  achievement: '🏆',
  challenge: '🎯',
  follow: '👥',
};

export const ActivityFeedScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { userData } = useAuth();
  const navigation = useAppNavigation();
  const { navigateToScreen } = navigation;

  // Navigation handlers for MoreDropdown
  const handleTipsPress = () => navigateToScreen('Tips');
  const handleAchievementsPress = () => navigateToScreen('Achievements');
  const handleLeaderboardPress = () => navigateToScreen('Leaderboard');
  const handleActivityFeedPress = () => {
    // Already on Activity Feed, do nothing
  };

  // State
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<ActivityTypeFilter>('all');
  const [feedType, setFeedType] = useState<'following' | 'own'>('own'); // Default to "My Activity" since it's more likely to have content
  const [followingUsernames, setFollowingUsernames] = useState<string[]>([]);

  // Combined fetch function
  const loadActivities = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    try {
      let usernames = followingUsernames;
      
      // For following feed, make sure we have the latest following list
      if (feedType === 'following' && userData?.username) {
        try {
          const data = await profileService.getFollowing(userData.username);
          if (data?.data?.following) {
            usernames = data.data.following.map((user: any) => user.username);
            setFollowingUsernames(usernames);
          }
        } catch (error) {
          console.warn('Error fetching following list:', error);
        }
      }
      
      // Fetch activities
      let fetchedActivities: ActivityItem[] = [];
      
      if (feedType === 'following') {
        fetchedActivities = await activityService.getActivityFeed(usernames);
      } else {
        // Pass username to get own posts
        fetchedActivities = await activityService.getOwnActivities(userData?.username);
      }
      
      setActivities(fetchedActivities);
    } catch (error) {
      console.warn('Error fetching activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [feedType, userData?.username, followingUsernames]);

  // Initial load and when feedType changes
  useEffect(() => {
    loadActivities();
  }, [feedType]); // Only re-run when feedType changes

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadActivities(false); // Don't show loading spinner for refresh
  }, [loadActivities]);

  // Filter activities by type
  const filteredActivities = selectedFilter === 'all'
    ? activities
    : selectedFilter === 'posts'
      ? activities.filter(activity => POST_ACTIVITY_TYPES.includes(activity.type))
      : activities.filter(activity => activity.type === selectedFilter);

  // Handle activity press
  const handleActivityPress = (activity: ActivityItem) => {
    // If actor is another user, navigate to their profile
    if (activity.actorUsername && activity.actorUsername !== 'You') {
      navigateToScreen('OtherProfile', { username: activity.actorUsername });
    }
    // For posts/likes/dislikes with post data, could add post detail navigation later
  };

  // Handle like on post activity
  const handleLikePost = async (activity: ActivityItem) => {
    if (activity.type !== 'post' || !activity.data?.id) return;
    try {
      await postService.likePost(activity.data.id);
      // Refresh to update like count
      loadActivities(false);
    } catch (error) {
      console.warn('Error liking post:', error);
    }
  };

  // Handle dislike on post activity
  const handleDislikePost = async (activity: ActivityItem) => {
    if (activity.type !== 'post' || !activity.data?.id) return;
    try {
      await postService.dislikePost(activity.data.id);
      // Refresh to update dislike count
      loadActivities(false);
    } catch (error) {
      console.warn('Error disliking post:', error);
    }
  };

  // Render activity item
  const renderActivityItem = ({ item }: { item: ActivityItem }) => {
    const icon = ACTIVITY_ICONS[item.type] || '📌';
    const formattedDate = new Date(item.timestamp).toLocaleDateString();
    const formattedTime = new Date(item.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return (
      <TouchableOpacity
        style={[styles.activityCard, { backgroundColor: colors.background, borderColor: colors.lightGray }]}
        onPress={() => handleActivityPress(item)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.activityHeader}>
          <View style={[styles.activityIconContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={styles.activityIcon}>{icon}</Text>
          </View>
          <View style={styles.activityMeta}>
            <Text style={[styles.actorName, { color: colors.primary }]}>
              {item.actorUsername}
            </Text>
            <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
              {formattedDate} • {formattedTime}
            </Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.typeBadgeText, { color: colors.textSecondary }]}>
              {t(`activity.types.${item.type}`, item.type)}
            </Text>
          </View>
        </View>

        {/* Content */}
        <Text style={[styles.activitySummary, { color: colors.textPrimary }]}>
          {item.summary}
        </Text>

        {/* Post Image if exists */}
        {item.type === 'post' && item.data?.image_url && (
          <Image
            source={{ uri: item.data.image_url }}
            style={styles.postImage}
            resizeMode="cover"
          />
        )}

        {/* Actions for posts */}
        {item.type === 'post' && item.data && (
          <View style={[styles.actionsRow, { borderTopColor: colors.lightGray }]}>
            {/* Like Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                item.data.is_user_liked && { backgroundColor: colors.successLight || '#e8f5e9' }
              ]}
              onPress={() => handleLikePost(item)}
            >
              <Text style={styles.actionIcon}>{item.data.is_user_liked ? '👍' : '👍🏻'}</Text>
              <Text style={[
                styles.actionText, 
                { color: item.data.is_user_liked ? colors.success || '#4caf50' : colors.textSecondary }
              ]}>
                {item.data.like_count || 0}
              </Text>
            </TouchableOpacity>
            
            {/* Dislike Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                item.data.is_user_disliked && { backgroundColor: colors.errorLight || '#ffebee' }
              ]}
              onPress={() => handleDislikePost(item)}
            >
              <Text style={styles.actionIcon}>{item.data.is_user_disliked ? '👎' : '👎🏻'}</Text>
              <Text style={[
                styles.actionText, 
                { color: item.data.is_user_disliked ? colors.error || '#f44336' : colors.textSecondary }
              ]}>
                {item.data.dislike_count || 0}
              </Text>
            </TouchableOpacity>
            
            {/* Comment Button */}
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                {item.data.comments?.length || item.data.comment_count || 0}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render filter button
  const renderFilterButton = (filter: ActivityTypeFilter) => {
    const isSelected = selectedFilter === filter;
    return (
      <TouchableOpacity
        key={filter}
        style={[
          styles.filterChip,
          {
            backgroundColor: isSelected ? colors.primary : colors.backgroundSecondary,
            borderColor: isSelected ? colors.primary : colors.lightGray,
          },
        ]}
        onPress={() => setSelectedFilter(filter)}
      >
        <Text
          style={[
            styles.filterChipText,
            { color: isSelected ? colors.textOnPrimary : colors.textPrimary },
          ]}
        >
          {filter === 'all' ? t('activity.filterAll', 'All') : ACTIVITY_ICONS[filter]} {t(`activity.types.${filter}`, filter)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper
      title={t('activity.title', 'Activity Feed')}
      scrollable={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      rightComponent={
        <MoreDropdown
          onTipsPress={handleTipsPress}
          onAchievementsPress={handleAchievementsPress}
          onLeaderboardPress={handleLeaderboardPress}
          onActivityFeedPress={handleActivityFeedPress}
          testID="activity-feed-more-dropdown"
        />
      }
    >
      <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
        {/* Feed Type Toggle */}
        <View style={[styles.feedToggle, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[
              styles.feedToggleButton,
              feedType === 'following' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFeedType('following')}
          >
            <Text
              style={[
                styles.feedToggleText,
                { color: feedType === 'following' ? colors.textOnPrimary : colors.textPrimary },
              ]}
            >
              {t('activity.followingFeed', 'Following')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.feedToggleButton,
              feedType === 'own' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFeedType('own')}
          >
            <Text
              style={[
                styles.feedToggleText,
                { color: feedType === 'own' ? colors.textOnPrimary : colors.textPrimary },
              ]}
            >
              {t('activity.myActivity', 'My Activity')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          <FlatList
            horizontal
            data={ACTIVITY_TYPES}
            renderItem={({ item }) => renderFilterButton(item)}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
          />
        </View>

        {/* Activity List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t('common.loading', 'Loading...')}
            </Text>
          </View>
        ) : filteredActivities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {feedType === 'following'
                ? t('activity.noFollowingActivity', 'No activity from followed users')
                : t('activity.noOwnActivity', 'No activity yet')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {feedType === 'following'
                ? t('activity.followUsersHint', 'Follow users to see their activity here')
                : t('activity.startActivityHint', 'Log waste, join challenges to see your activity')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredActivities}
            renderItem={renderActivityItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
              />
            }
          />
        )}
      </View>

    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  feedToggle: {
    flexDirection: 'row',
    margin: spacing.md,
    borderRadius: 12,
    padding: 4,
  },
  feedToggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  feedToggleText: {
    ...typography.body,
    fontWeight: '600',
  },
  filterContainer: {
    marginBottom: spacing.sm,
  },
  filterList: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.xs,
  },
  filterChipText: {
    ...typography.caption,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.md,
  },
  activityCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  activityIcon: {
    fontSize: 20,
  },
  activityMeta: {
    flex: 1,
  },
  actorName: {
    ...typography.body,
    fontWeight: '600',
  },
  activityTime: {
    ...typography.caption,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeBadgeText: {
    ...typography.caption,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  activitySummary: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    ...typography.caption,
  },
});

export default ActivityFeedScreen;

