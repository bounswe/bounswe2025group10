import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const CommunityScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Welcome to Community Screen</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eafbe6',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
}); 