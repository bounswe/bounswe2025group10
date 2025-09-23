import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { colors, spacing, typography, commonStyles } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import api, { challengeService } from '../services/api';

interface Challenge {
  id: number;
  title: string;
  description: string;
  target_amount: number;
  current_progress: number;
  is_public: boolean;
  reward?: any;
  creator?: any;
}

export const ChallengesScreen = () => {
  const { userData } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const fetchChallenges = async () => {
    if (!refreshing) setLoading(true);
    try {
      const response = await api.get('/api/challenges/');
      setChallenges(response.data); // If backend wraps in {data: [...]}, use response.data.data
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch challenges');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchChallenges();
  }, []);

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
      fetchChallenges();
    } catch (error) {
      Alert.alert('Error', 'Failed to create challenge');
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
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Challenges</Text>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.challengeItem}>
              <Text style={styles.challengeTitle}>{item.title}</Text>
              <Text>{item.description}</Text>
              <Text>Target: {item.target_amount}</Text>
              <Text>Progress: {item.current_progress}</Text>
              <Text>Type: {item.is_public ? 'Public' : 'Private'}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginTop: 4 }}>
                <Text style={{ color: 'red' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      <Text style={styles.subtitle}>Create New Challenge</Text>
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Target Amount"
        value={targetAmount}
        onChangeText={setTargetAmount}
        keyboardType="numeric"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={createChallenge}
      >
        <Text style={styles.buttonText}>Add Challenge</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { ...commonStyles.container, padding: spacing.md },
  title: { ...typography.h1, color: colors.primary, marginBottom: spacing.md },
  subtitle: { ...typography.h2, color: colors.primary, marginVertical: spacing.sm },
  input: { ...commonStyles.input },
  button: { ...commonStyles.button, marginTop: spacing.sm },
  buttonText: { ...commonStyles.buttonText },
  challengeItem: {
    backgroundColor: '#f0f0f0',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  challengeTitle: { ...typography.h2, fontWeight: 'bold' },
});
