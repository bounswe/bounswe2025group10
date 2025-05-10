import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, FlatList } from 'react-native';
import { colors, spacing, typography, commonStyles } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

const DUMMY_TIPS = [
  'Choose reusable products instead of single-use plastics.',
  'Bring your own bag when grocery shopping.',
  'Compost food scraps to reduce landfill waste.'
];

export const HomeScreen: React.FC = () => {
  const { logout } = useAuth();
  const [wasteType, setWasteType] = useState('');
  const [wasteQuantity, setWasteQuantity] = useState('');
  // Placeholder user info
  const username = 'Username';
  const profilePic = null; // Replace with actual image URI if available

  const handleLogout = async () => {
    await logout();
  };

  const handleAddWaste = () => {
    // TODO: Connect to backend
    setWasteType('');
    setWasteQuantity('');
  };

  return (
    <View style={styles.container}>
      {/* User Info Row */}
      <View style={styles.userInfoRow}>
        <Image
          source={profilePic ? { uri: profilePic } : require('../assets/profile_placeholder.png')}
          style={styles.profilePic}
        />
        <Text style={styles.username}>{username}</Text>
      </View>

      {/* Progress Chart Placeholder */}
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={{ color: colors.gray }}>[Progress Chart Here]</Text>
        </View>
      </View>

      {/* Waste Logging Inputs */}
      <View style={styles.logRow}>
        <TextInput
          style={styles.input}
          placeholder="Log the waste type (e.g. Plastic)"
          value={wasteType}
          onChangeText={setWasteType}
        />
        <TextInput
          style={styles.input}
          placeholder="Log the waste quantity (e.g. 2)"
          value={wasteQuantity}
          onChangeText={setWasteQuantity}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddWaste}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Latest Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.sectionTitle}>Latest Tips</Text>
        <FlatList
          data={DUMMY_TIPS}
          keyExtractor={(item, idx) => idx.toString()}
          renderItem={({ item }) => (
            <View style={styles.tipItem}>
              <Text style={styles.tipText}>{item}</Text>
            </View>
          )}
        />
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
    padding: spacing.md,
    backgroundColor: '#eafbe6',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lightGray,
    marginRight: spacing.sm,
  },
  username: {
    ...typography.h2,
    color: colors.primary,
  },
  chartContainer: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  chartPlaceholder: {
    height: 120,
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  input: {
    ...commonStyles.input,
    flex: 1,
    marginRight: spacing.xs,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  tipsContainer: {
    marginBottom: spacing.md,
  },
  tipItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  tipText: {
    color: colors.gray,
  },
  logoutButton: {
    backgroundColor: colors.error,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  logoutButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
}); 