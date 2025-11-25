import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography, commonStyles } from '../utils/theme';
import { MIN_TOUCH_TARGET } from '../utils/accessibility';
import { tipService } from '../services/api';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { MoreDropdown } from '../components/MoreDropdown';
import { CustomTabBar } from '../components/CustomTabBar';
import { useAppNavigation } from '../hooks/useNavigation';
import { useTranslation } from 'react-i18next';

interface Tip {
  id: number;
  title: string;
  description: string;
  like_count: number;
  dislike_count: number;
  is_user_liked?: boolean;
  is_user_disliked?: boolean;
  created_at?: string;
  author?: string;
}

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'MISLEADING', label: 'Misleading or Fake' },
  { value: 'OTHER', label: 'Other' },
];

export const TipsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useAppNavigation();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Translation state - track which tips are translated
  const [translatedTips, setTranslatedTips] = useState<{[key: number]: {title: string, description: string}}>({});

  // Create tip modal state
  const [isCreating, setIsCreating] = useState(false);
  const [newTip, setNewTip] = useState({ title: '', description: '' });

  // Report modal state
  const [reportingId, setReportingId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  // Navigation handlers
  const handleTipsPress = () => {
    // Already on tips page, do nothing
  };

  const handleAchievementsPress = () => {
    navigation.navigateToScreen('Achievements');
  };

  const handleLeaderboardPress = () => {
    navigation.navigateToScreen('Leaderboard');
  };

  // Fetch tips
  const fetchTips = useCallback(async () => {
    if (!refreshing) setLoading(true);
    setError(null);
    try {
      const response = await tipService.getAllTips();
      setTips(response.data || []);
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Error', 'Failed to fetch tips');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTips();
  }, [fetchTips]);

  // Create tip
  const handleCreateTip = async () => {
    if (!newTip.title.trim() || !newTip.description.trim()) {
      Alert.alert('Error', 'Title and description are required');
      return;
    }

    try {
      await tipService.createTip(newTip.title.trim(), newTip.description.trim());
      setNewTip({ title: '', description: '' });
      setIsCreating(false);
      await fetchTips();
      Alert.alert('Success', 'Tip created successfully!');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to create tip');
    }
  };

  // Like tip
  const handleLike = async (tipId: number) => {
    try {
      await tipService.likeTip(tipId);
      await fetchTips();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to like tip');
    }
  };

  // Dislike tip
  const handleDislike = async (tipId: number) => {
    try {
      await tipService.dislikeTip(tipId);
      await fetchTips();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to dislike tip');
    }
  };

  // Report tip
  const handleReport = async () => {
    if (!reportReason || !reportDescription.trim()) {
      Alert.alert('Error', 'Please select a reason and provide a description');
      return;
    }

    if (!reportingId) return;

    try {
      await tipService.reportTip(reportingId, reportReason, reportDescription.trim());
      closeReportModal();
      Alert.alert('Success', 'Report submitted successfully');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to submit report');
    }
  };

  // Close modals
  const closeCreateModal = () => {
    setIsCreating(false);
    setNewTip({ title: '', description: '' });
  };

  const closeReportModal = () => {
    setReportingId(null);
    setReportReason('');
    setReportDescription('');
  };

  // Initial load
  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  // Toggle translation for a tip
  const toggleTranslation = (tipId: number, originalTitle: string, originalDescription: string) => {
    if (translatedTips[tipId]) {
      // Remove translation (show original)
      const newTranslated = { ...translatedTips };
      delete newTranslated[tipId];
      setTranslatedTips(newTranslated);
    } else {
      // Add simple mock translation (in real app, call translation API)
      const isCurrentlyTurkish = i18n.language === 'tr';
      setTranslatedTips({
        ...translatedTips,
        [tipId]: {
          title: isCurrentlyTurkish ? `[EN] ${originalTitle}` : `[TR] ${originalTitle}`,
          description: isCurrentlyTurkish ? `[EN] ${originalDescription}` : `[TR] ${originalDescription}`,
        }
      });
    }
  };

  // Render tip card
  const renderTipCard = ({ item }: { item: Tip }) => {
    const isTranslated = !!translatedTips[item.id];
    const displayTitle = isTranslated ? translatedTips[item.id].title : item.title;
    const displayDescription = isTranslated ? translatedTips[item.id].description : item.description;

    return (
      <View style={styles.tipCard}>
        <View style={styles.tipHeader}>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>{displayTitle}</Text>
            <Text style={styles.tipDescription}>{displayDescription}</Text>
          </View>
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity
              style={[styles.translateButton, isTranslated && styles.translateButtonActive]}
              onPress={() => toggleTranslation(item.id, item.title, item.description)}
            >
              <Text style={styles.translateButtonText}>🌐</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => setReportingId(item.id)}
              accessibilityLabel="Report this tip"
              accessibilityRole="button"
            >
              <Text style={styles.reportButtonText}>⚠️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tipActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            item.is_user_liked && styles.actionButtonActive
          ]}
          onPress={() => handleLike(item.id)}
        >
          <Text style={[
            styles.actionButtonText,
            item.is_user_liked && styles.actionButtonTextActive
          ]}>
            👍 {item.like_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            item.is_user_disliked && styles.actionButtonActive
          ]}
          onPress={() => handleDislike(item.id)}
        >
          <Text style={[
            styles.actionButtonText,
            item.is_user_disliked && styles.actionButtonTextActive
          ]}>
            👎 {item.dislike_count}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>{t('tips.noTips')}</Text>
      <Text style={styles.emptyStateSubtext}>{t('tips.createFirst')}</Text>
    </View>
  );

  return (
    <ScreenWrapper
      title={t('tips.title')}
      scrollable={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      rightComponent={
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setIsCreating(true)}
            accessibilityLabel="Create new tip"
            accessibilityRole="button"
          >
            <Text style={styles.createButtonText}>{t('common.submit')}</Text>
          </TouchableOpacity>
          <MoreDropdown
            onTipsPress={handleTipsPress}
            onAchievementsPress={handleAchievementsPress}
            onLeaderboardPress={handleLeaderboardPress}
            testID="tips-more-dropdown"
          />
        </View>
      }
      testID="tips-screen"
      accessibilityLabel="Sustainability tips screen"
    >
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={tips}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTipCard}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      {/* Create Tip Modal */}
      <Modal
        visible={isCreating}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('tips.title')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeCreateModal}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter tip title"
                value={newTip.title}
                onChangeText={(text) => setNewTip({ ...newTip, title: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter tip description"
                value={newTip.description}
                onChangeText={(text) => setNewTip({ ...newTip, description: text })}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeCreateModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateTip}
              >
                <Text style={styles.submitButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={reportingId !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report Tip</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeReportModal}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.reportDescription}>
              Let us know what's wrong with this tip.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reason</Text>
              <ScrollView style={styles.reasonList}>
                {REPORT_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      styles.reasonItem,
                      reportReason === reason.value && styles.reasonItemSelected
                    ]}
                    onPress={() => setReportReason(reason.value)}
                  >
                    <Text style={[
                      styles.reasonItemText,
                      reportReason === reason.value && styles.reasonItemTextSelected
                    ]}>
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Please explain briefly..."
                value={reportDescription}
                onChangeText={setReportDescription}
                multiline
                numberOfLines={5}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeReportModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!reportReason || !reportDescription.trim()) && styles.submitButtonDisabled
                ]}
                onPress={handleReport}
                disabled={!reportReason || !reportDescription.trim()}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Custom Tab Bar */}
      <CustomTabBar activeTab="Tips" />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
  },
  loader: {
    marginTop: spacing.xl,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  tipCard: {
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
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  tipContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  tipTitle: {
    ...typography.h3,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  tipDescription: {
    ...typography.body,
    color: colors.gray,
    lineHeight: 20,
  },
  translateButton: {
    padding: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    marginRight: spacing.xs,
  },
  translateButtonActive: {
    backgroundColor: colors.primary,
  },
  translateButtonText: {
    fontSize: 16,
  },
  reportButton: {
    padding: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportButtonText: {
    fontSize: 16,
    color: colors.gray,
  },
  tipActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.md,
    borderRadius: 8,
    minHeight: MIN_TOUCH_TARGET,
  },
  actionButtonActive: {
    backgroundColor: colors.lightGray,
  },
  actionButtonText: {
    ...typography.caption,
    color: colors.gray,
  },
  actionButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    ...typography.h3,
    color: colors.gray,
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    ...typography.body,
    color: colors.gray,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.darkGray,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    ...typography.h2,
    color: colors.gray,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: spacing.sm,
  },
  input: {
    ...commonStyles.input,
    marginBottom: 0,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cancelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    ...commonStyles.button,
    backgroundColor: colors.primary,
    marginTop: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  submitButtonDisabled: {
    backgroundColor: colors.lightGray,
    opacity: 0.6,
  },
  submitButtonText: {
    ...commonStyles.buttonText,
    color: colors.white,
    fontWeight: '600',
  },
  reportDescription: {
    ...typography.body,
    color: colors.gray,
    marginBottom: spacing.md,
  },
  reasonList: {
    maxHeight: 200,
  },
  reasonItem: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    marginBottom: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  reasonItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGray,
  },
  reasonItemText: {
    ...typography.body,
    color: colors.darkGray,
  },
  reasonItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});
