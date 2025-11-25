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
import { ScreenWrapper } from '../components/ScreenWrapper';
import { AdminTabBar } from '../components/AdminTabBar';
import { useNavigation } from '@react-navigation/native';
import { adminService } from '../services/api';

interface PostReport {
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
    content: string;
    username: string;
    profile_picture?: string;
    created_at: string;
    likes_count: number;
    comments_count: number;
  };
}

export const PostModeration: React.FC = () => {
  const navigation = useNavigation();
  const [reports, setReports] = useState<PostReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPostReports = useCallback(async () => {
    if (!refreshing) setLoading(true);
    setError(null);

    try {
      const response = await adminService.getReports('posts');
      const reports = response.results || response.data || [];
      setReports(reports);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch post reports');
      console.error('Error fetching post reports:', err);
      
      // Fallback to mock data for development
      const mockReports: PostReport[] = [
        {
          id: 1,
          content_type: 'posts',
          reason: 'SPAM',
          description: 'This post contains spam content and inappropriate material',
          created_at: '2025-01-20T10:30:00Z',
          reporter: { username: 'moderator_user' },
          content: {
            id: 1,
            title: 'Check out this amazing deal!',
            content: 'Buy now! Limited time offer! Click here for amazing deals!',
            username: 'spam_user',
            profile_picture: 'https://via.placeholder.com/50',
            created_at: '2025-01-20T09:15:00Z',
            likes_count: 0,
            comments_count: 0,
          },
        },
        {
          id: 2,
          content_type: 'posts',
          reason: 'INAPPROPRIATE',
          description: 'Post contains offensive language and inappropriate content',
          created_at: '2025-01-20T11:45:00Z',
          reporter: { username: 'community_user' },
          content: {
            id: 2,
            title: 'My thoughts on recycling',
            content: 'This is a very offensive post with inappropriate language that should not be allowed.',
            username: 'offensive_user',
            profile_picture: 'https://via.placeholder.com/50',
            created_at: '2025-01-20T10:20:00Z',
            likes_count: 2,
            comments_count: 5,
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
    await fetchPostReports();
  }, [fetchPostReports]);

  useEffect(() => {
    fetchPostReports();
  }, [fetchPostReports]);

  const handleModerate = async (reportId: number, action: string) => {
    try {
      await adminService.moderateContent(reportId, action);
      Alert.alert('Success', `Post ${action} successfully`);
      fetchPostReports();
    } catch (error) {
      console.error('Moderation error:', error);
      Alert.alert('Error', 'Failed to moderate post');
    }
  };

  const renderPostReport = ({ item }: { item: PostReport }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportType}>POST REPORT</Text>
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

      <View style={styles.postPreview}>
        <View style={styles.postHeader}>
          <Image
            source={{ uri: item.content.profile_picture || 'https://via.placeholder.com/40' }}
            style={styles.postAvatar}
          />
          <View style={styles.postUserInfo}>
            <Text style={styles.postUsername}>{item.content.username}</Text>
            <Text style={styles.postDate}>
              {new Date(item.content.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.postTitle}>{item.content.title}</Text>
        <Text style={styles.postContent} numberOfLines={4}>
          {item.content.content}
        </Text>
        
        <View style={styles.postStats}>
          <Text style={styles.postStat}>❤️ {item.content.likes_count}</Text>
          <Text style={styles.postStat}>💬 {item.content.comments_count}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleModerate(item.id, 'approve')}
        >
          <Text style={styles.approveButtonText}>Approve Post</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleModerate(item.id, 'delete_media')}
        >
          <Text style={styles.rejectButtonText}>Delete Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
      <Text style={styles.emptyStateText}>No post reports to review</Text>
      <Text style={styles.emptyStateSubtext}>
        All posts have been moderated. Great job!
      </Text>
    </View>
  );

  return (
    <ScreenWrapper
      title="📝 Post Moderation"
      showBackButton={true}
      onBackPress={() => (navigation as any).navigate('AdminPanel')}
      scrollable={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      testID="post-moderation-screen"
      accessibilityLabel="Post moderation screen"
    >
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Failed to load post reports</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPostReports}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : reports.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPostReport}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        />
      )}

      <AdminTabBar activeTab="posts" />
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
  postPreview: {
    backgroundColor: colors.lightGray,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  postUserInfo: {
    flex: 1,
  },
  postUsername: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.darkGray,
  },
  postDate: {
    ...typography.caption,
    color: colors.gray,
  },
  postTitle: {
    ...typography.h3,
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  postContent: {
    ...typography.body,
    color: colors.gray,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  postStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  postStat: {
    ...typography.caption,
    color: colors.gray,
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
