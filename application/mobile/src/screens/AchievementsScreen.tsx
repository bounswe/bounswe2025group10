import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { colors, spacing, typography, commonStyles } from '../utils/theme';
import { achievementService } from '../services/api';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { MoreDropdown } from '../components/MoreDropdown';
import { CustomTabBar } from '../components/CustomTabBar';
import { useAppNavigation } from '../hooks/useNavigation';

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon?: string;
}

interface UserAchievement {
  id: number;
  achievement: Achievement;
  earned_at: string;
}

export const AchievementsScreen: React.FC = () => {
  const navigation = useAppNavigation();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Navigation handlers
  const handleAchievementsPress = () => {
    // Already on achievements page, do nothing
  };

  const handleTipsPress = () => {
    navigation.navigateToScreen('Tips');
  };

  const handleLeaderboardPress = () => {
    navigation.navigateToScreen('Leaderboard');
  };

  // Fetch achievements
  const fetchAchievements = useCallback(async () => {
    if (!refreshing) setLoading(true);
    setError(null);

    try {
      const response = await achievementService.getUserAchievements();
      const data = response.data?.achievements || [];
      setAchievements(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch achievements');
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAchievements();
  }, [fetchAchievements]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Render achievement card
  const renderAchievementCard = ({ item }: { item: UserAchievement }) => (
    <View style={styles.achievementCard}>
      {/* Achievement Icon */}
      {item.achievement.icon && (
        <View style={styles.iconContainer}>
          <Image
            source={{ uri: item.achievement.icon }}
            style={styles.achievementIcon}
            resizeMode="cover"
            onError={() => {
              // Fallback to emoji if image fails to load
              console.log('Failed to load achievement icon');
            }}
          />
        </View>
      )}

      {/* Achievement Content */}
      <View style={styles.achievementContent}>
        <Text style={styles.achievementTitle}>{item.achievement.title}</Text>
        <Text style={styles.achievementDescription}>
          {item.achievement.description}
        </Text>
        <Text style={styles.earnedDate}>
          Earned: {new Date(item.earned_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🏆</Text>
      <Text style={styles.emptyStateText}>No achievements earned yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Start participating in challenges and activities to earn your first achievement!
      </Text>
    </View>
  );

  return (
    <ScreenWrapper
      title="Achievements"
      scrollable={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      rightComponent={
        <MoreDropdown
          onTipsPress={handleTipsPress}
          onAchievementsPress={handleAchievementsPress}
          onLeaderboardPress={handleLeaderboardPress}
          testID="achievements-more-dropdown"
        />
      }
      testID="achievements-screen"
      accessibilityLabel="Achievements screen"
    >
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Failed to load achievements</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAchievements}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={achievements}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAchievementCard}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      {/* Custom Tab Bar */}
      <CustomTabBar activeTab="Achievements" />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing.xl,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  achievementCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  iconContainer: {
    height: 120,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementIcon: {
    width: '100%',
    height: '100%',
  },
  achievementContent: {
    padding: spacing.md,
  },
  achievementTitle: {
    ...typography.h3,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  achievementDescription: {
    ...typography.body,
    color: colors.gray,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  earnedDate: {
    ...typography.caption,
    color: colors.gray,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyStateText: {
    ...typography.h2,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    ...typography.body,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    ...typography.h3,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
  },
});
