import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert, Switch, Modal,
} from 'react-native';
import { colors as defaultColors, spacing, typography, commonStyles, ThemeColors } from '../utils/theme';
import { MIN_TOUCH_TARGET } from '../utils/accessibility';
import { challengeService } from '../services/api';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/errors';

interface Challenge {
  id: number;
  title: string;
  description: string;
  target_amount: number;
  current_progress: number;
  is_public: boolean;
  deadline?: string; // ISO date string
  reward?: { id: number; title?: string; points?: number };
  creator?: { id: number; username: string };
  is_enrolled?: boolean;
}

interface UserChallenge {
  challenge: number; // challenge ID
  joined_date: string;
}

// Helper function to calculate days remaining
const getDaysRemaining = (deadline: string): number => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper function to format deadline display
const formatDeadline = (deadline: string): string => {
  const daysRemaining = getDaysRemaining(deadline);
  
  if (daysRemaining < 0) {
    return `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''}`;
  } else if (daysRemaining === 0) {
    return 'Due today';
  } else if (daysRemaining === 1) {
    return 'Due tomorrow';
  } else if (daysRemaining <= 7) {
    return `${daysRemaining} days left`;
  } else {
    const date = new Date(deadline);
    return `Due ${date.toLocaleDateString()}`;
  }
};

// Helper function to get deadline urgency color
const getDeadlineUrgencyColor = (deadline: string, colors: ThemeColors): string => {
  const daysRemaining = getDaysRemaining(deadline);
  
  if (daysRemaining < 0) {
    return colors.error; // Overdue - red
  } else if (daysRemaining <= 1) {
    return colors.error; // Due today/tomorrow - red
  } else if (daysRemaining <= 3) {
    return colors.warning; // 1-3 days - yellow/orange
  } else {
    return colors.success; // > 3 days - green
  }
};

export const ChallengesScreen = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [enrolledChallenges, setEnrolledChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const fetchChallenges = useCallback(async () => {
    if (!refreshing) {setLoading(true);}
    try {
      const [challengesResponse, enrolledResponse] = await Promise.all([
        challengeService.getChallenges(),
        challengeService.getEnrolledChallenges()
      ]);
      
      const allChallenges = challengesResponse;
      const enrolled = enrolledResponse;

      // Debug the structure first
      logger.log('Raw enrolled response count:', enrolled?.length);

      // Mark challenges as enrolled
      const enrolledChallengeIds = new Set(enrolled.map((uc: UserChallenge) => uc.challenge).filter(Boolean));
      const challengesWithEnrollment = allChallenges.map((challenge: Challenge) => ({
        ...challenge,
        is_enrolled: enrolledChallengeIds.has(challenge.id)
      }));

      setChallenges(challengesWithEnrollment);
      setEnrolledChallenges(enrolled);

      // Debug logging
      logger.log('Enrolled challenge IDs:', Array.from(enrolledChallengeIds));
    } catch (error) {
      logger.error('Error fetching challenges:', error);
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchChallenges();
  }, [fetchChallenges]);

  const createChallenge = async () => {
    if (!title || !description || !targetAmount || !deadline) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await challengeService.createChallenge({
        title,
        description,
        target_amount: parseFloat(targetAmount),
        is_public: isPublic,
        deadline,
      });
      setTitle('');
      setDescription('');
      setTargetAmount('');
      setIsPublic(true);
      setShowCreateModal(false);
      fetchChallenges();
      Alert.alert(t('common.success'), t('challenges.created'));
    } catch (error) {
      logger.error('Error creating challenge:', error);
      Alert.alert(t('common.error'), getErrorMessage(error));
    }
  };

  const joinChallenge = async (challengeId: number) => {
    try {
      await challengeService.joinChallenge(challengeId);
      fetchChallenges();
      Alert.alert(t('common.success'), t('challenges.joined'));
    } catch (error: unknown) {
      logger.error('Error joining challenge:', error);
      Alert.alert(t('common.error'), getErrorMessage(error));
    }
  };

  const leaveChallenge = async (challengeId: number) => {
    try {
      // Find the UserChallenge record to delete
      const enrolledChallenge = enrolledChallenges.find(uc => uc.challenge === challengeId);
      if (enrolledChallenge) {
        await challengeService.leaveChallenge(enrolledChallenge.challenge);
        fetchChallenges();
        Alert.alert(t('common.success'), t('challenges.left'));
      }
    } catch (error: unknown) {
      logger.error('Error leaving challenge:', error);
      Alert.alert(t('common.error'), getErrorMessage(error));
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(t('challenges.deleteConfirm'), t('challenges.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
          try {
            await challengeService.deleteChallenge(id);
            fetchChallenges();
          } catch (error: unknown) {
            logger.error('Error deleting challenge:', error);
            Alert.alert(t('common.error'), getErrorMessage(error));
          }
        } },
    ]);
  };

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const filteredChallenges = showEnrolledOnly 
    ? enrolledChallenges
        .filter(uc => challenges.some(c => c.id === uc.challenge)) // Filter out any null/undefined challenges
        .map(uc => {
          const challengeId = uc.challenge as unknown as number;
          logger.log('Processing enrolled challenge ID:', challengeId);

          // Find the full challenge data from the all challenges list
          const fullChallenge = challenges.find((c: Challenge) => c.id === challengeId);
          logger.log('Found full challenge:', fullChallenge?.title);

          if (fullChallenge) {
            return {
              ...fullChallenge,
              is_enrolled: true
            };
          } else {
            // Fallback if challenge not found in main list
            return {
              id: challengeId,
              title: 'Challenge Not Found',
              description: 'This challenge may have been deleted',
              target_amount: 0,
              current_progress: 0,
              is_public: false,
              is_enrolled: true,
              reward: null,
              creator: null
            } as unknown as Challenge;
          }
        })
    : challenges;

  const renderChallengeCard = ({ item }: { item: Challenge }) => {
    // Safety check for undefined/null items
    if (!item) {
      return null;
    }

    // Safety checks for progress values
    const currentProgress = item.current_progress || 0;
    const targetAmount = item.target_amount || 0;

    const progressPercentage = targetAmount > 0
      ? Math.min((currentProgress / targetAmount) * 100, 100)
      : 0;

    return (
      <View style={[styles.challengeCard, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.challengeHeader}>
          <Text style={[styles.challengeTitle, { color: colors.textPrimary }]}>{item.title || 'Untitled Challenge'}</Text>
          <Text style={[styles.challengeDescription, { color: colors.textSecondary }]}>{item.description || 'No description available'}</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.lightGray }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercentage}%`, backgroundColor: colors.primary }
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {currentProgress.toFixed(2)}/{targetAmount}
          </Text>
        </View>

        <View style={styles.challengeFooter}>
          <View style={styles.challengeInfo}>
            <Text style={[styles.challengeType, { color: colors.textSecondary }]}>
              {item.is_public === true ? '🌍 Public' : '🔒 Private'}
            </Text>
            {item.deadline && (
              <View style={styles.deadlineContainer}>
                <Text style={styles.deadlineIcon}>⏰</Text>
                <Text 
                  style={[
                    styles.deadlineText, 
                    { color: getDeadlineUrgencyColor(item.deadline, colors) }
                  ]}
                >
                  {formatDeadline(item.deadline)}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              item.is_enrolled === true
                ? [styles.leaveButton, { backgroundColor: colors.lightGray }]
                : [styles.joinButton, { backgroundColor: colors.primary }]
            ]}
            onPress={() => item.is_enrolled === true
              ? null
              : joinChallenge(item.id)
            }
            disabled={item.is_enrolled === true}
          >
            <Text style={[
              styles.actionButtonText,
              item.is_enrolled === true
                ? [styles.leaveButtonText, { color: colors.textSecondary }]
                : [styles.joinButtonText, { color: colors.textOnPrimary }]
            ]}>
              {item.is_enrolled === true ? 'Already Joined' : t('challenges.join')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper
      title={t('challenges.title')}
      scrollable={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {/* Header Controls */}
      <View style={styles.headerControls}>
        <View style={styles.toggleContainer}>
          <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>{t('challenges.myChallenges')}</Text>
          <Switch
            value={showEnrolledOnly}
            onValueChange={setShowEnrolledOnly}
            trackColor={{ false: colors.lightGray, true: colors.primary }}
            thumbColor={showEnrolledOnly ? colors.white : colors.gray}
          />
        </View>
      </View>

      <View style={styles.createButtonContainer}>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={[styles.createButtonText, { color: colors.textOnPrimary }]}>{t('challenges.createChallenge')}</Text>
        </TouchableOpacity>
      </View>

      {/* Challenges List */}
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredChallenges}
          keyExtractor={(item, index) => item?.id?.toString() || `challenge-${index}`}
          renderItem={renderChallengeCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      {/* Create Challenge Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.lightGray }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('challenges.createChallenge')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

            <View style={styles.modalContent}>
              {/* Description text */}
              <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                {t('challenges.description')}
              </Text>

              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>{t('challenges.challengeName')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.lightGray, color: colors.textPrimary }]}
                  placeholder={t('challenges.challengeName')}
                  placeholderTextColor={colors.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>{t('challenges.description')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.lightGray, color: colors.textPrimary }]}
                  placeholder={t('challenges.description')}
                  placeholderTextColor={colors.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Target Amount */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>{t('challenges.targetAmount')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.lightGray, color: colors.textPrimary }]}
                  placeholder={t('challenges.targetAmount')}
                  placeholderTextColor={colors.textSecondary}
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  keyboardType="numeric"
                />
              </View>

              {/* Deadline */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>{t('challenges.endDate')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.lightGray, color: colors.textPrimary }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  value={deadline}
                  onChangeText={setDeadline}
                />
              </View>

              {/* Public Toggle */}
              <View style={styles.publicToggle}>
                <Text style={[styles.publicLabel, { color: colors.textPrimary }]}>{t('challenges.public')}</Text>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  trackColor={{ false: colors.lightGray, true: colors.primary }}
                  thumbColor={isPublic ? colors.white : colors.gray}
                />
              </View>

              {/* Action buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: colors.primary, backgroundColor: colors.background }]}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.primary }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: colors.primary }]}
                  onPress={createChallenge}
                >
                  <Text style={[styles.submitButtonText, { color: colors.textOnPrimary }]}>{t('common.submit')}</Text>
                </TouchableOpacity>
              </View>
            </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  headerControls: {
    paddingBottom: spacing.sm,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    ...typography.body,
    color: defaultColors.darkGray,
  },
  createButtonContainer: {
    paddingBottom: spacing.md,
  },
  createButton: {
    backgroundColor: defaultColors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  createButtonText: {
    ...typography.button,
    color: defaultColors.white,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  loader: {
    marginTop: spacing.xl,
  },
  challengeCard: {
    backgroundColor: defaultColors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: defaultColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeHeader: {
    marginBottom: spacing.sm,
  },
  challengeTitle: {
    ...typography.h3,
    fontWeight: 'bold',
    color: defaultColors.darkGray,
    marginBottom: spacing.xs,
  },
  challengeDescription: {
    ...typography.body,
    color: defaultColors.gray,
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: defaultColors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: defaultColors.primary,
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption,
    color: defaultColors.gray,
    textAlign: 'right',
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeInfo: {
    flex: 1,
  },
  challengeType: {
    ...typography.caption,
    color: defaultColors.gray,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  deadlineIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  deadlineText: {
    ...typography.caption,
    fontWeight: '600',
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 120,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButton: {
    backgroundColor: defaultColors.primary,
  },
  leaveButton: {
    backgroundColor: defaultColors.lightGray,
  },
  actionButtonText: {
    ...typography.button,
    fontWeight: '600',
  },
  joinButtonText: {
    color: defaultColors.white,
  },
  leaveButtonText: {
    color: defaultColors.gray,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: defaultColors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: defaultColors.lightGray,
  },
  modalTitle: {
    ...typography.h2,
    color: defaultColors.darkGray,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    ...typography.h2,
    color: defaultColors.gray,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  modalDescription: {
    ...typography.body,
    color: defaultColors.gray,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.body,
    fontWeight: '600',
    color: defaultColors.darkGray,
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
  publicToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  publicLabel: {
    ...typography.body,
    color: defaultColors.darkGray,
    flex: 1,
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
    borderColor: defaultColors.primary,
    backgroundColor: defaultColors.white,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.button,
    color: defaultColors.primary,
    fontWeight: '600',
  },
  submitButton: {
    ...commonStyles.button,
    backgroundColor: defaultColors.primary,
    marginTop: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  submitButtonText: {
    ...commonStyles.buttonText,
    color: defaultColors.white,
    fontWeight: '600',
  },
});
