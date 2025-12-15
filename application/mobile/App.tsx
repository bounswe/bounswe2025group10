/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, I18nManager, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import './src/i18n'; // Initialize i18n
import { initializeRTL, isRTL } from './src/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

const LANGUAGE_KEY = '@app_language';

const App = () => {
  const [isRTLInitialized, setIsRTLInitialized] = useState(false);
  const [rtlMismatch, setRtlMismatch] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeRTL();

      // Check if there's a mismatch between saved language RTL and current I18nManager state
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        const shouldBeRTL = isRTL(savedLanguage);
        const currentIsRTL = I18nManager.isRTL;

        console.log('[App] Language:', savedLanguage, 'Should be RTL:', shouldBeRTL, 'Current RTL:', currentIsRTL);

        if (shouldBeRTL !== currentIsRTL) {
          console.log('[App] RTL mismatch detected!');
          setRtlMismatch(true);
        }
      }

      setIsRTLInitialized(true);
    };
    init();
  }, []);

  // Show loading while RTL is being initialized
  if (!isRTLInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  // Show restart prompt if RTL mismatch detected
  if (rtlMismatch) {
    const handleRestart = async () => {
      try {
        await Updates.reloadAsync();
      } catch (error) {
        console.warn('Could not restart:', error);
        // If reload fails, just continue
        setRtlMismatch(false);
      }
    };

    return (
      <View style={styles.restartContainer}>
        <Text style={styles.restartTitle}>App Restart Required</Text>
        <Text style={styles.restartText}>
          You changed the language to a right-to-left layout.
          The app needs to restart to apply the changes.
        </Text>
        <TouchableOpacity
          style={styles.restartButton}
          onPress={handleRestart}
        >
          <Text style={styles.restartButtonText}>Restart Now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => setRtlMismatch(false)}
        >
          <Text style={styles.continueButtonText}>Continue Without Restart</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  restartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  restartTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
    textAlign: 'center',
  },
  restartText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  restartButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 16,
  },
  restartButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  continueButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
});

export default App;
