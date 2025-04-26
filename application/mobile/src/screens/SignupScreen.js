import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { signup } from '../services/api';

export default function SignupScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [message, setMessage]   = useState('');

  const onSignup = async () => {
    setError('');
    setMessage('');
    try {
      const data = await signup(email, username, password);
      if (data.username || data.email) {
        setError((data.username || data.email).join(', '));
      } else {
        setMessage(data.message);
        navigation.replace('Login');
      }
    } catch {
      setError('An unexpected error occurred.');
    }
  };

  return (
    <View style={styles.container}>
      {!!error   && <Text style={styles.error}>{error}</Text>}
      {!!message && <Text style={styles.success}>{message}</Text>}
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
        placeholder="Username"
        autoCapitalize="none"
        onChangeText={setUsername}
        value={username}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      <Button title="Sign Up" onPress={onSignup} />
      <Text
        style={styles.link}
        onPress={() => navigation.navigate('Login')}
      >
        Already have an account? Log In
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:16 },
  input:     { borderWidth:1, marginVertical:8, padding:8, borderRadius:4 },
  error:     { color:'red', marginBottom:8 },
  success:   { color:'green', marginBottom:8 },
  link:      { color:'blue', marginTop:12, textAlign:'center' },
});
