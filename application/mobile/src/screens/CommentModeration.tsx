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
import { adminService } from '../services/api';
import { logger } from '../utils/logger';

interface CommentReport {
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
    text: string;
    username: string;
    profile_picture?: string;
    created_at: string;
    likes_count: number;
    post_title?: string;
    post_id?: number;
  };
}

export const CommentModeration: React.FC = () => {
  const navigation = useNavigation();
  const [reports, setReports] = useState<CommentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommentReports = useCallback(async () => {
    if (!refreshing) setLoading(true);
    setError(null);

    try {
      const response = await adminService.getReports('comments');
      const reports = response.results || response.data || [];
      setReports(reports);
    } catch (err: unknown) {
      const commentErr = err as { message?: string };
      setError(commentErr.message || 'Failed to fetch comment reports');
      logger.error('Error fetching comment reports:', err);
      
      // Fallback to mock data for development
      const mockReports: CommentReport[] = [
        {
          id: 1,
          content_type: 'comments',
          reason: 'HARASSMENT',
          description: 'Comment contains harassing language and personal attacks',
          created_at: '2025-01-20T10:30:00Z',
          reporter: { username: 'victim_user' },
          content: {
            id: 1,
            text: 'You are such an idiot! Your opinion is worthless and you should just shut up!',
            username: 'harasser_user',
            profile_picture: 'https://via.placeholder.com/40',
            created_at: '2025-01-20T09:15:00Z',
            likes_count: 0,
            post_title: 'Tips for Sustainable Living',
            post_id: 123,
          },
        },
        {
          id: 2,
          content_type: 'comments',
          reason: 'SPAM',
          description: 'Comment is spam promoting unrelated products',
          created_at: '2025-01-20T11:45:00Z',
          reporter: { username: 'moderator_user' },
          content: {
            id: 2,
            text: 'Check out my amazing products! Click here for the best deals! Buy now!',
            username: 'spam_user',
            profile_picture: 'https://via.placeholder.com/40',
            created_at: '2025-01-20T10:20:00Z',
            likes_count: 0,
            post_title: 'Recycling Tips',
            post_id: 124,
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
    await fetchCommentReports();
  }, [fetchCommentReports]);

  useEffect(() => {
    fetchCommentReports();
  }, [fetchCommentReports]);

  const handleModerate = async (reportId: number, action: string) => {
    try {
      await adminService.moderateContent(reportId, action);
      Alert.alert('Success', `Comment ${action} successfully`);
      fetchCommentReports();
    } catch (error) {
      logger.error('Moderation error:', error);
      Alert.alert('Error', 'Failed to moderate comment');
    }
  };

  const renderCommentReport = ({ item }: { item: CommentReport }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportType}>COMMENT REPORT</Text>
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

      <View style={styles.commentPreview}>
        <View style={styles.commentHeader}>
          <Image
            source={{ uri: item.content.profile_picture || 'https://via.placeholder.com/40' }}
            style={styles.commentAvatar}
          />
          <View style={styles.commentUserInfo}>
            <Text style={styles.commentUsername}>@{item.content.username}</Text>
            <Text style={styles.commentDate}>
              {new Date(item.content.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.commentText}>{item.content.text}</Text>
        
        <View style={styles.commentStats}>
          <Text style={styles.commentStat}>❤️ {item.content.likes_count}</Text>
        </View>
        
        {item.content.post_title && (
          <View style={styles.postContext}>
            <Text style={styles.postContextLabel}>On post:</Text>
            <Text style={styles.postContextTitle}>{item.content.post_title}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleModerate(item.id, 'approve')}
        >
          <Text style={styles.approveButtonText}>Approve Comment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleModerate(item.id, 'delete_media')}
        >
          <Text style={styles.rejectButtonText}>Delete Comment</Text>
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
      <Text style={styles.emptyStateText}>No comment reports to review</Text>
      <Text style={styles.emptyStateSubtext}>
        All comments have been moderated. Great job!
      </Text>
    </View>
  );

  return (
    <ScreenWrapper
      title="💬 Comment Moderation"
      showBackButton={true}
      onBackPress={() => (navigation as any).navigate('AdminPanel')}
      scrollable={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      testID="comment-moderation-screen"
      accessibilityLabel="Comment moderation screen"
    >
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Failed to load comment reports</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCommentReports}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : reports.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCommentReport}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        />
      )}

      <AdminTabBar activeTab="comments" />
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
  commentPreview: {
    backgroundColor: colors.lightGray,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  commentUserInfo: {
    flex: 1,
  },
  commentUsername: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.darkGray,
  },
  commentDate: {
    ...typography.caption,
    color: colors.gray,
  },
  commentText: {
    ...typography.body,
    color: colors.gray,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  commentStats: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  commentStat: {
    ...typography.caption,
    color: colors.gray,
  },
  postContext: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray,
  },
  postContextLabel: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  postContextTitle: {
    ...typography.body,
    color: colors.primary,
    fontStyle: 'italic',
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
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
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
