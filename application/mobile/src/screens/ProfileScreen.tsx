import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

// Main profile component that handles the user data display
const ProfileMain = () => {
  return (
    <View style={styles.mainContainer}>
      <Text style={styles.title}>User Profile</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Name: John Doe</Text>
        <Text style={styles.infoText}>Email: john@example.com</Text>
        <Text style={styles.infoText}>Member Since: January 2023</Text>
      </View>
    </View>
  );
};

export const ProfileScreen = () => (
  <ScrollView style={styles.scrollView}>
    <View style={styles.container}>
      <ProfileMain />
      <Text style={styles.sectionText}>Welcome to your profile</Text>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#eafbe6',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mainContainer: {
    width: '100%',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#228B22',
  },
  infoContainer: {
    width: '100%',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
}); 