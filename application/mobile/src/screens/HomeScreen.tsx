import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, commonStyles } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

interface HomeScreenProps {
  navigation: any; // We'll type this properly when we set up navigation
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // No manual navigation needed; AuthContext will handle it
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