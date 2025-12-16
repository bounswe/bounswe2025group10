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
  RefreshControl,
} from 'react-native';
import { colors, spacing, typography } from '../utils/theme';
import { MIN_TOUCH_TARGET } from '../utils/accessibility';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { AdminTabBar } from '../components/AdminTabBar';
import { useNavigation } from '@react-navigation/native';
import { adminService, Report } from '../services/api';
import { logger } from '../utils/logger';

export const UserModeration: React.FC = () => {
  const navigation = useNavigation();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!refreshing) setLoading(true);
    setError(null);

    try {
      const response = await adminService.getReports('users');
      const reports = response.results || response.data || [];
      setReports(reports);
    } catch (err: unknown) {
      const userErr = err as { message?: string };
      setError(userErr.message || 'Failed to fetch user reports');
      logger.error('Error fetching user reports:', err);
      
      // Fallback to mock data for development
      const mockReports: Report[] = [
        {
          id: 1,
          content_type: 'users',
          reason: 'HARASSMENT',
          description: 'User has been sending harassing messages to other users',
          created_at: '2025-01-20T10:30:00Z',
          reporter: { username: 'victim_user' },
          content: {
            id: 1,
            username: 'harasser_user',
            email: 'harasser@example.com',
            profile_picture: 'https://via.placeholder.com/50',
            bio: 'I love to harass people online',
            created_at: '2025-01-15T08:00:00Z',
            is_active: true,
          },
        },
        {
          id: 2,
          content_type: 'users',
          reason: 'SPAM',
          description: 'User is creating multiple accounts to spam the platform',
          created_at: '2025-01-20T11:45:00Z',
          reporter: { username: 'moderator_user' },
          content: {
            id: 2,
            username: 'spam_account',
            email: 'spam@example.com',
            profile_picture: 'https://via.placeholder.com/50',
            bio: 'Buy my products! Click here for amazing deals!',
            created_at: '2025-01-18T14:30:00Z',
            is_active: true,
          },
        },
      ];
      setReports(mockReports);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleModerate = async (reportId: number, action: string) => {
    try {
      await adminService.moderateContent(reportId, action);
      Alert.alert('Success', `User ${action} successfully`);
      fetchReports();
    } catch (error) {
      logger.error('Moderation error:', error);
      Alert.alert('Error', 'Failed to moderate user');
    }
  };

  const renderReport = ({ item }: { item: Report }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportType}>USER REPORT</Text>
        <Text style={[styles.reportReason, { color: getReasonColor(item.reason) }]}>
          {item.reason}
        </Text>
      </View>
      
      <View style={styles.reportContent}>
        <Text style={styles.reportDescription}>{item.description}</Text>
        <Text style={styles.reporterInfo}>Reported by: {item.reporter.username}</Text>
        <Text style={styles.reportDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.userPreview}>
        <View style={styles.userHeader}>
          <Image
            source={{ uri: item.content.profile_picture || 'https://via.placeholder.com/60' }}
            style={styles.userAvatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userUsername}>@{item.content.username}</Text>
            <Text style={styles.userEmail}>{item.content.email}</Text>
            <Text style={styles.userStatus}>
              Status: {item.content.is_active ? 'Active' : 'Inactive'}
            </Text>
            <Text style={styles.userJoinDate}>
              Joined: {item.content.created_at ? new Date(item.content.created_at).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>
        
        {item.content.bio && (
          <View style={styles.userBio}>
            <Text style={styles.bioLabel}>Bio:</Text>
            <Text style={styles.bioText}>{item.content.bio}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleModerate(item.id, 'approve')}
        >
          <Text style={styles.approveButtonText}>Approve User</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.warnButton]}
          onPress={() => handleModerate(item.id, 'warn_user')}
        >
          <Text style={styles.warnButtonText}>Warn User</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleModerate(item.id, 'ban_user')}
        >
          <Text style={styles.rejectButtonText}>Ban User</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'SPAM': return colors.error;
      case 'HARASSMENT': return '#8B0000';
      case 'INAPPROPRIATE': return '#FF6B35';
      case 'MISINFORMATION': return '#FF8C00';
      default: return colors.gray;
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>✅</Text>
      <Text style={styles.emptyStateText}>No user reports to review</Text>
      <Text style={styles.emptyStateSubtext}>
        All users have been moderated. Great job!
      </Text>
    </View>
  );

  return (
    <ScreenWrapper
      title="👥 User Moderation"
      showBackButton={true}
      onBackPress={() => (navigation as any).navigate('AdminPanel')}
      scrollable={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      testID="user-moderation-screen"
      accessibilityLabel="User moderation screen"
    >
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Failed to load user reports</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReports}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : reports.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderReport}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        />
      )}

      <AdminTabBar activeTab="users" />
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
  reportCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reportType: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  reportReason: {
    ...typography.caption,
    fontWeight: '600',
  },
  reportContent: {
    marginBottom: spacing.sm,
  },
  reportDescription: {
    ...typography.body,
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  reporterInfo: {
    ...typography.caption,
    color: colors.gray,
    marginBottom: spacing.xs,
  },
  reportDate: {
    ...typography.caption,
    color: colors.gray,
    fontStyle: 'italic',
  },
  userPreview: {
    backgroundColor: colors.lightGray,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userUsername: {
    ...typography.h3,
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body,
    color: colors.gray,
    marginBottom: spacing.xs,
  },
  userStatus: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  userJoinDate: {
    ...typography.caption,
    color: colors.gray,
  },
  userBio: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray,
  },
  bioLabel: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  bioText: {
    ...typography.body,
    color: colors.gray,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  warnButton: {
    backgroundColor: '#FF8C00',
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  approveButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
  warnButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
  rejectButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
    fontSize: 12,
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
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
  },
});
