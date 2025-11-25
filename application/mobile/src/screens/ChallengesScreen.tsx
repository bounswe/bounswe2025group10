import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert, Switch, Modal,
} from 'react-native';
import { colors, spacing, typography, commonStyles } from '../utils/theme';
import { MIN_TOUCH_TARGET } from '../utils/accessibility';
import api, { challengeService } from '../services/api';
import { ScreenWrapper } from '../components/ScreenWrapper';

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
        api.get('/api/challenges/'),
        api.get('/api/challenges/enrolled/')
      ]);
      
      const allChallenges = challengesResponse.data;
      const enrolled = enrolledResponse.data;
      
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
      await api.post('/api/challenges/', {
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
      await api.post('/api/challenges/participate/', { challenge: challengeId });
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
        await api.delete(`/api/challenges/participate/${enrolledChallenge.id}/`);
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
      <View style={styles.challengeCard}>
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeTitle}>{item.title || 'Untitled Challenge'}</Text>
          <Text style={styles.challengeDescription}>{item.description || 'No description available'}</Text>
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
            {currentProgress.toFixed(2)}/{targetAmount}
          </Text>
        </View>

        <View style={styles.challengeFooter}>
          <View style={styles.challengeInfo}>
            <Text style={styles.challengeType}>
              {item.is_public === true ? '🌍 Public' : '🔒 Private'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.actionButton,
              item.is_enrolled === true ? styles.leaveButton : styles.joinButton
            ]}
            onPress={() => item.is_enrolled === true
              ? leaveChallenge(item.id) 
              : joinChallenge(item.id)
            }
          >
            <Text style={[
              styles.actionButtonText,
              item.is_enrolled === true ? styles.leaveButtonText : styles.joinButtonText
            ]}>
              {item.is_enrolled === true ? 'Already Joined' : 'Join Challenge'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Challenges</Text>
      </View>
      
      {/* Header Controls */}
      <View style={styles.headerControls}>
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Show Enrolled Only</Text>
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
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>Create Challenge</Text>
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Challenge</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

            <View style={styles.modalContent}>
              {/* Description text */}
              <Text style={styles.modalDescription}>
                Fill out the fields below to add a new sustainability challenge.
              </Text>

              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter challenge title"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter challenge description"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Target Amount */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Amount</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter target amount"
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  keyboardType="numeric"
                />
              </View>
              
              {/* Public Toggle */}
              <View style={styles.publicToggle}>
                <Text style={styles.publicLabel}>Make challenge public</Text>
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
                  style={styles.cancelButton}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={createChallenge}
                >
                  <Text style={styles.submitButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  titleContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    fontWeight: 'bold',
  },
  headerControls: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    ...typography.body,
    color: colors.darkGray,
  },
  createButtonContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  createButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  loader: {
    marginTop: spacing.xl,
  },
  challengeCard: {
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
  challengeHeader: {
    marginBottom: spacing.sm,
  },
  challengeTitle: {
    ...typography.h3,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  challengeDescription: {
    ...typography.body,
    color: colors.gray,
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.gray,
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
    color: colors.gray,
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
    backgroundColor: colors.primary,
  },
  leaveButton: {
    backgroundColor: colors.lightGray,
  },
  actionButtonText: {
    ...typography.button,
    fontWeight: '600',
  },
  joinButtonText: {
    color: colors.white,
  },
  leaveButtonText: {
    color: colors.gray,
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
  modalDescription: {
    ...typography.body,
    color: colors.gray,
    marginBottom: spacing.lg,
    lineHeight: 20,
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
  publicToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  publicLabel: {
    ...typography.body,
    color: colors.darkGray,
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
  submitButtonText: {
    ...commonStyles.buttonText,
    color: colors.white,
    fontWeight: '600',
  },
});
