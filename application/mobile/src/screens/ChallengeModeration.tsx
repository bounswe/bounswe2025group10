import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, spacing, typography } from '../utils/theme';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { AdminTabBar } from '../components/AdminTabBar';
import { useNavigation } from '@react-navigation/native';
import { adminService } from '../services/api';

interface ChallengeReport {
  id: number;
  content_type: string;
  reason: string;
  description: string;
  created_at: string;
  reporter: {
    username: string;
  };
  content: {
    id: number;
    title: string;
    description: string;
    creator: string;
    target_amount: number;
    current_progress: number;
    is_public: boolean;
    created_at: string;
    participants_count: number;
  };
}

export const ChallengeModeration: React.FC = () => {
  const navigation = useNavigation();
  const [reports, setReports] = useState<ChallengeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChallengeReports = useCallback(async () => {
    if (!refreshing) setLoading(true);
    setError(null);

    try {
      const response = await adminService.getReports('challenges');
      const reports = response.results || response.data || [];
      setReports(reports);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch challenge reports');
      console.error('Error fetching challenge reports:', err);
      
      // Fallback to mock data for development
      const mockReports: ChallengeReport[] = [
        {
          id: 1,
          content_type: 'challenges',
          reason: 'INAPPROPRIATE',
          description: 'Challenge contains inappropriate content and misleading information',
          created_at: '2025-01-20T10:30:00Z',
          reporter: { username: 'community_user' },
          content: {
            id: 1,
            title: 'Dangerous Challenge',
            description: 'This challenge promotes dangerous activities that could harm participants',
            creator: 'bad_creator',
            target_amount: 100,
            current_progress: 25,
            is_public: true,
            created_at: '2025-01-18T14:30:00Z',
            participants_count: 5,
          },
        },
        {
          id: 2,
          content_type: 'challenges',
          reason: 'SPAM',
          description: 'Challenge is spam and promotes unrelated products',
          created_at: '2025-01-20T11:45:00Z',
          reporter: { username: 'moderator_user' },
          content: {
            id: 2,
            title: 'Buy My Product Challenge',
            description: 'Join this challenge to buy my amazing products! Click here for deals!',
            creator: 'spam_creator',
            target_amount: 50,
            current_progress: 0,
            is_public: true,
            created_at: '2025-01-19T09:15:00Z',
            participants_count: 0,
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
    await fetchChallengeReports();
  }, [fetchChallengeReports]);

  useEffect(() => {
    fetchChallengeReports();
  }, [fetchChallengeReports]);

  const handleModerate = async (reportId: number, action: string) => {
    try {
      await adminService.moderateContent(reportId, action);
      Alert.alert('Success', `Challenge ${action} successfully`);
      fetchChallengeReports();
    } catch (error) {
      console.error('Moderation error:', error);
      Alert.alert('Error', 'Failed to moderate challenge');
    }
  };

  const renderChallengeReport = ({ item }: { item: ChallengeReport }) => {
    const progressPercentage = item.content.target_amount > 0 
      ? Math.min((item.content.current_progress / item.content.target_amount) * 100, 100)
      : 0;

    return (
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportType}>CHALLENGE REPORT</Text>
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

        <View style={styles.challengePreview}>
          <View style={styles.challengeHeader}>
            <Text style={styles.challengeTitle}>{item.content.title}</Text>
            <Text style={styles.challengeCreator}>by {item.content.creator}</Text>
          </View>
          
          <Text style={styles.challengeDescription} numberOfLines={3}>
            {item.content.description}
          </Text>
          
          <View style={styles.challengeStats}>
            <View style={styles.challengeStat}>
              <Text style={styles.statLabel}>Target:</Text>
              <Text style={styles.statValue}>{item.content.target_amount}</Text>
            </View>
            <View style={styles.challengeStat}>
              <Text style={styles.statLabel}>Progress:</Text>
              <Text style={styles.statValue}>{item.content.current_progress}</Text>
            </View>
            <View style={styles.challengeStat}>
              <Text style={styles.statLabel}>Participants:</Text>
              <Text style={styles.statValue}>{item.content.participants_count}</Text>
            </View>
            <View style={styles.challengeStat}>
              <Text style={styles.statLabel}>Type:</Text>
              <Text style={styles.statValue}>
                {item.content.is_public ? 'Public' : 'Private'}
              </Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progressPercentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {progressPercentage.toFixed(1)}%
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleModerate(item.id, 'approve')}
          >
            <Text style={styles.approveButtonText}>Approve Challenge</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleModerate(item.id, 'delete_media')}
          >
            <Text style={styles.rejectButtonText}>Delete Challenge</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'SPAM': return colors.error;
      case 'INAPPROPRIATE': return '#FF6B35';
      case 'HARASSMENT': return '#8B0000';
      case 'MISINFORMATION': return '#FF8C00';
      default: return colors.gray;
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>✅</Text>
      <Text style={styles.emptyStateText}>No challenge reports to review</Text>
      <Text style={styles.emptyStateSubtext}>
        All challenges have been moderated. Great job!
      </Text>
    </View>
  );

  return (
    <ScreenWrapper
      title="🎯 Challenge Moderation"
      showBackButton={true}
      onBackPress={() => (navigation as any).navigate('AdminPanel')}
      scrollable={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      testID="challenge-moderation-screen"
      accessibilityLabel="Challenge moderation screen"
    >
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Failed to load challenge reports</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchChallengeReports}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : reports.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderChallengeReport}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        />
      )}

      <AdminTabBar activeTab="challenges" />
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
  challengePreview: {
    backgroundColor: colors.lightGray,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  challengeHeader: {
    marginBottom: spacing.sm,
  },
  challengeTitle: {
    ...typography.h3,
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  challengeCreator: {
    ...typography.caption,
    color: colors.gray,
    fontStyle: 'italic',
  },
  challengeDescription: {
    ...typography.body,
    color: colors.gray,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  challengeStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  challengeStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    ...typography.caption,
    color: colors.gray,
    marginRight: spacing.xs,
  },
  statValue: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.darkGray,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.darkGray,
    minWidth: 40,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  approveButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
  },
  rejectButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
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
