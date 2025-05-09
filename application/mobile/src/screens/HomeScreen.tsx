import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, commonStyles } from '../utils/theme';
import { storage } from '../utils/storage';

interface HomeScreenProps {
  navigation: any; // We'll type this properly when we set up navigation
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const handleLogout = async () => {
    await storage.clearTokens();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Zero Waste</Text>
      <Text style={styles.subtitle}>Your sustainable living journey starts here</Text>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.gray,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  button: {
    ...commonStyles.button,
    width: '80%',
  },
  buttonText: {
    ...commonStyles.buttonText,
  },
}); 