import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { login } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  const onLogin = async () => {
    setError('');
    try {
      const data = await login(email, password);
      if (data.error) {
        setError(data.error);
      } else {
        // TODO: securely store data.token.access
        navigation.replace('Home');
      }
    } catch {
      setError('An unexpected error occurred.');
    }
  };

  return (
    <View style={styles.container}>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        value={email}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      <Button title="Log In" onPress={onLogin} />
      <Text
        style={styles.link}
        onPress={() => navigation.navigate('Signup')}
      >
        Don't have an account? Sign Up
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:16 },
  input:     { borderWidth:1, marginVertical:8, padding:8, borderRadius:4 },
  error:     { color:'red', marginBottom:8 },
  link:      { color:'blue', marginTop:12, textAlign:'center' },
});
