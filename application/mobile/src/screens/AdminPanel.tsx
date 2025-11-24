import React, { useState, useEffect } from 'react';
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
import { ScreenWrapper } from '../components/ScreenWrapper';
import { AdminTabBar } from '../components/AdminTabBar';
import { useNavigation } from '@react-navigation/native';
import { adminService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface ReportItem {
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
    title?: string;
    content?: string;
    username?: string;
    profile_picture?: string;
  };
}

export const AdminPanel: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const fetchReports = async () => {
    if (!refreshing) setLoading(true);
    setError(null);

    try {
      const response = await adminService.getReports(activeTab);
      const reports = response.results || response.data || [];
      setReports(reports);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reports');
      console.error('Error fetching reports:', err);
      
      // Fallback to mock data for development
      const mockReports: ReportItem[] = [
        {
          id: 1,
          content_type: 'posts',
          reason: 'SPAM',
          description: 'This post contains spam content',
          created_at: '2025-01-20T10:30:00Z',
          reporter: { username: 'user1' },
          content: {
            id: 1,
            title: 'Sample Post',
            content: 'This is a sample post content...',
            username: 'reported_user',
            profile_picture: 'https://via.placeholder.com/50',
          },
        },
      ];
      setReports(mockReports);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  const handleModerate = async (reportId: number, action: string) => {
    try {
      await adminService.moderateContent(reportId, action);
      Alert.alert('Success', `Content ${action} successfully`);
      fetchReports();
    } catch (error) {
      console.error('Moderation error:', error);
      Alert.alert('Error', 'Failed to moderate content');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const renderReportItem = ({ item }: { item: ReportItem }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportType}>{item.content_type.toUpperCase()}</Text>
        <Text style={styles.reportReason}>{item.reason}</Text>
      </View>
      
      <View style={styles.reportContent}>
        <Text style={styles.reportDescription}>{item.description}</Text>
        <Text style={styles.reporterInfo}>Reported by: {item.reporter.username}</Text>
        <Text style={styles.reportDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      {item.content && (
        <View style={styles.contentPreview}>
          <Text style={styles.contentTitle}>
            {item.content.title || `Content by ${item.content.username}`}
          </Text>
          <Text style={styles.contentText} numberOfLines={3}>
            {item.content.content || 'No content available'}
          </Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleModerate(item.id, 'approve')}
        >
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleModerate(item.id, 'reject')}
        >
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>✅</Text>
      <Text style={styles.emptyStateText}>No reports to review</Text>
      <Text style={styles.emptyStateSubtext}>
        All content has been moderated. Great job!
      </Text>
    </View>
  );

  return (
    <ScreenWrapper
      title="🌿 Admin Panel"
      scrollable={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      rightComponent={
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityLabel="Logout"
          accessibilityRole="button"
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      }
      testID="admin-panel-screen"
      accessibilityLabel="Admin panel screen"
    >

      {/* Content Area */}
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Failed to load reports</Text>
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
          renderItem={renderReportItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      {/* Admin Tab Bar */}
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
    color: colors.error,
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
  contentPreview: {
    backgroundColor: colors.lightGray,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  contentTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  contentText: {
    ...typography.body,
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
  logoutButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  logoutButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
  },
});
