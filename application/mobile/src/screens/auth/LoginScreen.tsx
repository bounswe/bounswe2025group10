import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {colors, spacing, typography, commonStyles} from '../../utils/theme';
import {MIN_TOUCH_TARGET} from '../../utils/accessibility';
import {authService} from '../../services/api';
import {useAuth} from '../../context/AuthContext';
import axios from 'axios';

interface LoginScreenProps {
  navigation: any; // We'll type this properly when we set up navigation
}

export const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const {login} = useAuth();

  // Quote state
  const [jokeSetup, setJokeSetup] = useState('');
  const [jokePunchline, setJokePunchline] = useState('');

  useEffect(() => {
    axios
      .get('https://official-joke-api.appspot.com/random_joke')
      .then(res => {
        setJokeSetup(res.data.setup);
        setJokePunchline(res.data.punchline);
      })
      .catch(err => {
        console.error('Joke API error:', err);
        setJokeSetup('Welcome to the app!');
        setJokePunchline('');
      });
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting login with email:', email);

      // First try to get the token
      const response = await authService.login({email, password});
      console.log('Login response received:', response);

      if (!response || !response.token) {
        console.error('Invalid response format:', response);
        Alert.alert('Error', 'Invalid server response');
        return;
      }

      console.log('Token received:', response.token.access ? 'Yes' : 'No');

      // Then try to login with the context
      const loginResult = await login(email, password);
      console.log('Context login result:', loginResult);

      if (!loginResult) {
        Alert.alert('Error', 'Failed to complete login process');
        return;
      }

      console.log('Login completed successfully!');
    } catch (error: any) {
      console.error('Login error:', error);

      let errorMessage = 'An error occurred during login';

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server error response:', {
          status: error.response.status,
          data: error.response.data,
        });
        errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          errorMessage;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage =
          'No response from server. Please check your internet connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
        errorMessage = error.message || errorMessage;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      {/* Random joke section */}
      {jokeSetup ? (
        <View style={styles.jokeContainer}>
          <Text style={styles.jokeSetup}>{jokeSetup}</Text>
          {jokePunchline ? (
            <Text style={styles.jokePunchline}>{jokePunchline}</Text>
          ) : null}
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.signupLink}
        onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.signupText}>
          Don't have an account?{' '}
          <Text style={styles.signupTextBold}>Sign up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  input: {
    ...commonStyles.input,
  },
  button: {
    ...commonStyles.button,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...commonStyles.buttonText,
  },
  signupLink: {
    marginTop: spacing.md,
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  signupText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  signupTextBold: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  jokeContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  jokeSetup: {
    fontStyle: 'italic',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  jokePunchline: {
    color: colors.primary,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: 'bold',
  },
});
