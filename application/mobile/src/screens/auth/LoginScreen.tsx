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
import {useRTL} from '../../hooks/useRTL';
import {MIN_TOUCH_TARGET} from '../../utils/accessibility';
import {authService} from '../../services/api';
import {useAuth} from '../../context/AuthContext';
import axios from 'axios';
import {useTranslation} from 'react-i18next';
import {logger} from '../../utils/logger';

interface LoginScreenProps {
  navigation: any; // We'll type this properly when we set up navigation
}

export const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  const {t} = useTranslation();
  const {textStyle} = useRTL();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const {login} = useAuth();

  // Quote state
  const [jokeSetup, setJokeSetup] = useState('');
  const [jokePunchline, setJokePunchline] = useState('');

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    axios
      .get('https://official-joke-api.appspot.com/random_joke', {
        signal: controller.signal,
        timeout: 5000, // 5 second timeout
      })
      .then(res => {
        if (isMounted) {
          setJokeSetup(res.data.setup);
          setJokePunchline(res.data.punchline);
        }
      })
      .catch(err => {
        if (isMounted && !axios.isCancel(err)) {
          logger.error('Joke API error:', err);
          setJokeSetup('Welcome to the app!');
          setJokePunchline('');
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.allFieldsRequired'));
      return;
    }

    try {
      setLoading(true);
      logger.log('Attempting login with email:', email);

      // First try to get the token
      const response = await authService.login({email, password});
      logger.log('Login response received');

      if (!response || !response.token) {
        logger.error('Invalid response format');
        Alert.alert(t('common.error'), t('auth.invalidCredentials'));
        return;
      }

      logger.log('Token received:', response.token.access ? 'Yes' : 'No');

      // Then try to login with the context
      const loginResult = await login(email, password);
      logger.log('Context login result:', loginResult ? 'success' : 'failed');

      if (!loginResult) {
        Alert.alert(t('common.error'), t('auth.invalidCredentials'));
        return;
      }

      logger.log('Login completed successfully!');
    } catch (error: unknown) {
      logger.error('Login error:', error);

      let errorMessage = t('auth.invalidCredentials');

      const axiosError = error as { response?: { status: number; data?: { error?: string; message?: string } }; request?: unknown; message?: string };
      if (axiosError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        logger.error('Server error response:', axiosError.response.status);
        errorMessage =
          axiosError.response.data?.error ||
          axiosError.response.data?.message ||
          errorMessage;
      } else if (axiosError.request) {
        // The request was made but no response was received
        logger.error('No response received');
        errorMessage =
          'No response from server. Please check your internet connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        logger.error('Request setup error:', axiosError.message);
        errorMessage = axiosError.message || errorMessage;
      }

      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, textStyle]}>{t('auth.login')}</Text>
      <Text style={[styles.subtitle, textStyle]}>{jokeSetup || ''}</Text>

      <TextInput
        style={[styles.input, textStyle]}
        placeholder={t('auth.email')}
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={[styles.input, textStyle]}
        placeholder={t('auth.password')}
        placeholderTextColor={colors.textSecondary}
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
          <Text style={styles.buttonText}>{t('auth.login')}</Text>
        )}
      </TouchableOpacity>

      {/* Random joke section */}
      {jokeSetup ? (
        <View style={styles.jokeContainer}>
          <Text style={[styles.jokeSetup, textStyle]}>{jokeSetup}</Text>
          {jokePunchline ? (
            <Text style={[styles.jokePunchline, textStyle]}>{jokePunchline}</Text>
          ) : null}
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.signupLink}
        onPress={() => navigation.navigate('Signup')}>
        <Text style={[styles.signupText, textStyle]}>
          {t('auth.dontHaveAccount')} <Text style={styles.signupTextBold}>{t('auth.signup')}</Text>
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
