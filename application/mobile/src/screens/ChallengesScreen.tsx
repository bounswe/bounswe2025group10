import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert, Switch, Modal,
} from 'react-native';
import { colors as defaultColors, spacing, typography, commonStyles } from '../utils/theme';
import { MIN_TOUCH_TARGET } from '../utils/accessibility';
import { challengeService } from '../services/api';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

interface Challenge {
  id: number;
  title: string;
  description: string;
  target_amount: number;
  current_progress: number;
  is_public: boolean;
  reward?: any;
  creator?: any;
  is_enrolled?: boolean;
}

interface UserChallenge {
  id: number;
  challenge: Challenge;
  joined_date: string;
}

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
      console.log('Raw enrolled response:', enrolled);
      console.log('First enrolled item:', enrolled[0]);
      
      // Mark challenges as enrolled
      const enrolledChallengeIds = new Set(enrolled.map((uc: UserChallenge) => uc.challenge).filter(Boolean));
      const challengesWithEnrollment = allChallenges.map((challenge: Challenge) => ({
        ...challenge,
        is_enrolled: enrolledChallengeIds.has(challenge.id)
      }));
      
      setChallenges(challengesWithEnrollment);
      setEnrolledChallenges(enrolled);
      
      // Debug logging
      console.log('Enrolled challenge IDs:', Array.from(enrolledChallengeIds));
      console.log('Challenges with enrollment status:', challengesWithEnrollment.map((c: Challenge) => ({ id: c.id, title: c.title, is_enrolled: c.is_enrolled })));
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch challenges');
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
    if (!title || !description || !targetAmount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await challengeService.createChallenge({
        title,
        description,
        target_amount: parseFloat(targetAmount),
        is_public: isPublic,
      });
      setTitle('');
      setDescription('');
      setTargetAmount('');
      setIsPublic(true);
      setShowCreateModal(false);
      fetchChallenges();
      Alert.alert('Success', 'Challenge created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create challenge');
    }
  };

  const joinChallenge = async (challengeId: number) => {
    try {
      await challengeService.joinChallenge(challengeId);
      fetchChallenges();
      Alert.alert('Success', 'Successfully joined the challenge!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to join challenge');
    }
  };

  const leaveChallenge = async (challengeId: number) => {
    try {
      // Find the UserChallenge record to delete
      const enrolledChallenge = enrolledChallenges.find(uc => uc.challenge.id === challengeId);
      if (enrolledChallenge) {
        await challengeService.leaveChallenge(enrolledChallenge.id);
        fetchChallenges();
        Alert.alert('Success', 'Successfully left the challenge!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to leave challenge');
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert('Delete Challenge', 'Are you sure you want to delete this challenge?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await challengeService.deleteChallenge(id);
            fetchChallenges();
          } catch (error:any) {
            Alert.alert('Error', error.response?.data?.detail || 'Failed to delete');
          }
        } },
    ]);
  };

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const filteredChallenges = showEnrolledOnly 
    ? enrolledChallenges
        .filter(uc => uc.challenge) // Filter out any null/undefined challenges
        .map(uc => {
          const challengeId = uc.challenge as unknown as number;
          console.log('Processing enrolled challenge ID:', challengeId);
          
          // Find the full challenge data from the all challenges list
          const fullChallenge = challenges.find((c: Challenge) => c.id === challengeId);
          console.log('Found full challenge:', fullChallenge);
          
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
              {item.is_public === true ? '🌍 ' + t('challenges.join') : '🔒 ' + t('challenges.leave')}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              item.is_enrolled === true
                ? [styles.leaveButton, { backgroundColor: colors.lightGray }]
                : [styles.joinButton, { backgroundColor: colors.primary }]
            ]}
            onPress={() => item.is_enrolled === true
              ? leaveChallenge(item.id)
              : joinChallenge(item.id)
            }
          >
            <Text style={[
              styles.actionButtonText,
              item.is_enrolled === true
                ? [styles.leaveButtonText, { color: colors.textSecondary }]
                : [styles.joinButtonText, { color: colors.textOnPrimary }]
            ]}>
              {item.is_enrolled === true ? t('challenges.completed') : t('challenges.join')}
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

              {/* Public Toggle */}
              <View style={styles.publicToggle}>
                <Text style={[styles.publicLabel, { color: colors.textPrimary }]}>{t('challenges.join')}</Text>
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
