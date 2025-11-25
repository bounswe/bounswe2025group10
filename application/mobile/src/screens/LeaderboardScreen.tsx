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
  Modal,
} from 'react-native';
import { colors, spacing, typography, commonStyles } from '../utils/theme';
import { MIN_TOUCH_TARGET } from '../utils/accessibility';
import { leaderboardService } from '../services/api';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { MoreDropdown } from '../components/MoreDropdown';
import { CustomTabBar } from '../components/CustomTabBar';
import { useAppNavigation } from '../hooks/useNavigation';
import { useTranslation } from 'react-i18next';

const DEFAULT_PROFILE_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541';

interface LeaderboardUser {
  rank: number;
  username: string;
  total_waste: string;
  profile_picture?: string;
  points: number;
  isCurrentUser?: boolean;
}

interface UserBio {
  username: string;
  bio?: string;
}

export const LeaderboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useAppNavigation();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBioModal, setShowBioModal] = useState(false);
  const [selectedUserBio, setSelectedUserBio] = useState<UserBio | null>(null);
  const [bioLoading, setBioLoading] = useState(false);

  // Navigation handlers
  const handleLeaderboardPress = () => {
    // Already on leaderboard page, do nothing
  };

  const handleTipsPress = () => {
    navigation.navigateToScreen('Tips');
  };

  const handleAchievementsPress = () => {
    navigation.navigateToScreen('Achievements');
  };

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    if (!refreshing) setLoading(true);
    setError(null);

    try {
      const response = await leaderboardService.getLeaderboard();
      const data = response.data;
      
      // Process top users
      const topUsers: LeaderboardUser[] = (data.top_users || []).map((user: any) => ({
        rank: user.rank,
        username: user.username,
        total_waste: user.total_waste,
        profile_picture: user.profile_picture || DEFAULT_PROFILE_IMAGE,
        points: user.points || 0,
        isCurrentUser: false,
      }));

      setLeaderboard(topUsers);

      // Set current user if exists and not in top 10
      if (data.current_user && data.current_user.rank > 10) {
        setCurrentUser({
          rank: data.current_user.rank,
          username: data.current_user.username,
          total_waste: data.current_user.total_waste,
          profile_picture: data.current_user.profile_picture || DEFAULT_PROFILE_IMAGE,
          points: data.current_user.points || 0,
          isCurrentUser: true,
        });
      } else {
        setCurrentUser(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leaderboard');
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Fetch user bio
  const fetchUserBio = async (username: string) => {
    setBioLoading(true);
    try {
      const response = await leaderboardService.getUserBio(username);
      setSelectedUserBio(response);
      setShowBioModal(true);
    } catch (error) {
      console.error(`Failed to fetch bio for ${username}:`, error);
      setSelectedUserBio({ username, bio: 'Bio could not be loaded.' });
      setShowBioModal(true);
    } finally {
      setBioLoading(false);
    }
  };

  const handleProfileClick = (username: string) => {
    fetchUserBio(username);
  };

  const getRankDisplay = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return position.toString();
  };

  const getUserRowStyle = (isCurrentUser: boolean, index: number) => {
    let backgroundColor = colors.white;
    
    // Medal colors for top 3
    if (index === 0) {
      backgroundColor = '#FFD700'; // Gold
    } else if (index === 1) {
      backgroundColor = '#C0C0C0'; // Silver
    } else if (index === 2) {
      backgroundColor = '#CD7F32'; // Bronze
    } else if (index % 2 !== 0) {
      backgroundColor = colors.lightGray;
    }
    
    return {
      backgroundColor,
      borderWidth: isCurrentUser ? 2 : 0,
      borderColor: isCurrentUser ? colors.primary : 'transparent',
      borderRadius: 8,
    };
  };

  // Render leaderboard item
  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardUser; index: number }) => (
    <View style={[styles.leaderboardRow, getUserRowStyle(item.isCurrentUser || false, index)]}>
      <View style={styles.rankColumn}>
        <Text style={[
          styles.rankText,
          { fontSize: (item.rank <= 3) ? 24 : 16 }
        ]}>
          {getRankDisplay(item.rank)}
        </Text>
      </View>
      
      <View style={styles.profileColumn}>
        <TouchableOpacity
          onPress={() => handleProfileClick(item.username)}
          style={styles.profileImageContainer}
        >
          <Image
            source={{ uri: item.profile_picture }}
            style={styles.profileImage}
            onError={() => {
              console.log('Failed to load profile image');
            }}
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.usernameColumn}>
        <Text style={[
          styles.usernameText,
          { fontWeight: (item.isCurrentUser || item.rank <= 3) ? 'bold' : 'normal' }
        ]}>
          {item.username}
        </Text>
      </View>
      
      <View style={styles.scoreColumn}>
        <Text style={styles.scoreText}>{item.total_waste}</Text>
      </View>
      
      <View style={styles.pointsColumn}>
        <Text style={styles.pointsText}>{item.points}</Text>
      </View>
    </View>
  );

  // Render current user row
  const renderCurrentUserRow = () => {
    if (!currentUser) return null;
    
    return (
      <View style={styles.currentUserSection}>
        <Text style={styles.currentUserTitle}>{t('leaderboard.yourRanking')}</Text>
        <View style={[styles.leaderboardRow, getUserRowStyle(true, currentUser.rank - 1)]}>
          <View style={styles.rankColumn}>
            <Text style={[
              styles.rankText,
              { fontSize: (currentUser.rank <= 3) ? 24 : 16 }
            ]}>
              {getRankDisplay(currentUser.rank)}
            </Text>
          </View>
          
          <View style={styles.profileColumn}>
            <TouchableOpacity
              onPress={() => handleProfileClick(currentUser.username)}
              style={styles.profileImageContainer}
            >
              <Image
                source={{ uri: currentUser.profile_picture }}
                style={styles.profileImage}
                onError={() => {
                  console.log('Failed to load profile image');
                }}
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.usernameColumn}>
            <Text style={[styles.usernameText, { fontWeight: 'bold' }]}>
              {currentUser.username}
            </Text>
          </View>
          
          <View style={styles.scoreColumn}>
            <Text style={styles.scoreText}>{currentUser.total_waste}</Text>
          </View>
          
          <View style={styles.pointsColumn}>
            <Text style={styles.pointsText}>{currentUser.points}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🏆</Text>
      <Text style={styles.emptyStateText}>{t('leaderboard.noDataAvailable')}</Text>
      <Text style={styles.emptyStateSubtext}>
        {t('leaderboard.startContributing')}
      </Text>
    </View>
  );

  return (
    <ScreenWrapper
      title={t('leaderboard.topZeroWasteChampions')}
      scrollable={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      rightComponent={
        <MoreDropdown
          onTipsPress={handleTipsPress}
          onAchievementsPress={handleAchievementsPress}
          onLeaderboardPress={handleLeaderboardPress}
          testID="leaderboard-more-dropdown"
        />
      }
      testID="leaderboard-screen"
      accessibilityLabel={t('leaderboard.title')}
    >
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{t('leaderboard.failedToLoad')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLeaderboard}>
            <Text style={styles.retryButtonText}>{t('leaderboard.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : leaderboard.length === 0 ? (
        renderEmptyState()
      ) : (
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.rankHeader]}>#</Text>
            <Text style={[styles.headerText, styles.profileHeader]}>{t('leaderboard.profile')}</Text>
            <Text style={[styles.headerText, styles.usernameHeader]}>{t('leaderboard.username')}</Text>
            <Text style={[styles.headerText, styles.scoreHeader]}>{t('leaderboard.co2Avoided')}</Text>
            <Text style={[styles.headerText, styles.pointsHeader]}>{t('leaderboard.points')}</Text>
          </View>

          {/* Leaderboard List */}
          <FlatList
            data={leaderboard}
            keyExtractor={(item) => item.username}
            renderItem={renderLeaderboardItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />

          {/* Current User Section */}
          {renderCurrentUserRow()}
        </View>
      )}

      {/* Bio Modal */}
      <Modal
        visible={showBioModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBioModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalUserInfo}>
              <Image
                source={{ 
                  uri: leaderboard.find(u => u.username === selectedUserBio?.username)?.profile_picture || 
                       (currentUser && currentUser.username === selectedUserBio?.username ? currentUser.profile_picture : DEFAULT_PROFILE_IMAGE)
                }}
                style={styles.modalProfileImage}
              />
              <View style={styles.modalUserDetails}>
                <Text style={styles.modalUsername}>{selectedUserBio?.username}</Text>
                <Text style={styles.modalSubtitle}>{t('leaderboard.profileBio')}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowBioModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {bioLoading ? (
              <View style={styles.bioLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.bioLoadingText}>{t('leaderboard.loadingBio')}</Text>
              </View>
            ) : (
              <View style={styles.bioContainer}>
                <Text style={[
                  styles.bioText,
                  { 
                    color: selectedUserBio?.bio ? colors.darkGray : colors.gray,
                    fontStyle: selectedUserBio?.bio ? 'normal' : 'italic'
                  }
                ]}>
                  {selectedUserBio?.bio || t('leaderboard.noBioYet')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Tab Bar */}
      <CustomTabBar activeTab="Leaderboard" />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginTop: spacing.xl,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerText: {
    ...typography.button,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.darkGray,
  },
  rankHeader: {
    flex: 0.8,
  },
  profileHeader: {
    flex: 1,
  },
  usernameHeader: {
    flex: 1.5,
  },
  scoreHeader: {
    flex: 1.2,
  },
  pointsHeader: {
    flex: 0.8,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  rankColumn: {
    flex: 0.8,
    alignItems: 'center',
  },
  profileColumn: {
    flex: 1,
    alignItems: 'center',
  },
  usernameColumn: {
    flex: 1.5,
    alignItems: 'center',
  },
  scoreColumn: {
    flex: 1.2,
    alignItems: 'center',
  },
  pointsColumn: {
    flex: 0.8,
    alignItems: 'center',
  },
  rankText: {
    ...typography.body,
    fontWeight: 'bold',
  },
  profileImageContainer: {
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.gray,
    overflow: 'hidden',
  },
  profileImage: {
    width: 50,
    height: 50,
  },
  usernameText: {
    ...typography.body,
    color: colors.darkGray,
  },
  scoreText: {
    ...typography.body,
    color: colors.darkGray,
  },
  pointsText: {
    ...typography.body,
    color: colors.darkGray,
  },
  currentUserSection: {
    marginTop: spacing.lg,
  },
  currentUserTitle: {
    ...typography.h3,
    textAlign: 'center',
    color: colors.darkGray,
    marginBottom: spacing.md,
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  modalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: colors.white,
    marginRight: spacing.md,
  },
  modalUserDetails: {
    flex: 1,
  },
  modalUsername: {
    ...typography.h3,
    color: colors.white,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.8,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    ...typography.h2,
    color: colors.white,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  bioLoading: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  bioLoadingText: {
    ...typography.body,
    color: colors.gray,
    marginTop: spacing.sm,
  },
  bioContainer: {
    backgroundColor: colors.lightGray,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderStyle: 'dashed',
    minHeight: 100,
    justifyContent: 'center',
  },
  bioText: {
    ...typography.body,
    lineHeight: 24,
    textAlign: 'center',
  },
});
