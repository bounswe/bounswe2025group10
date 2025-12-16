import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {colors, spacing, typography, commonStyles} from '../../utils/theme';
import {MIN_TOUCH_TARGET} from '../../utils/accessibility';
import {authService} from '../../services/api';
import {useTranslation} from 'react-i18next';
import {logger} from '../../utils/logger';
import {TERMS_OF_SERVICE, USER_AGREEMENT} from '../../constants/legalContent';

interface SignupScreenProps {
  navigation: any; // We'll type this properly when we set up navigation
}

export const SignupScreen: React.FC<SignupScreenProps> = ({navigation}) => {
  const {t} = useTranslation();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'agreement'>('terms');

  const openLegalModal = (type: 'terms' | 'agreement') => {
    setLegalModalType(type);
    setLegalModalVisible(true);
  };

  const handleSignup = async () => {
    logger.log('Signup button pressed');
    if (!email || !username || !password) {
      Alert.alert(t('common.error'), t('auth.allFieldsRequired'));
      return;
    }

    if (password.length < 8) {
      Alert.alert(t('common.error'), t('auth.passwordTooShort'));
      return;
    }

    try {
      setLoading(true);
      const response = await authService.signup({email, username, password});

      if (response.message === 'User created successfully.') {
        Alert.alert(t('common.success'), t('auth.signupSuccess'), [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]);
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } }; message?: string };
      logger.log('Signup error:', axiosError.message);
      Alert.alert(
        t('common.error'),
        axiosError.response?.data?.error || t('auth.invalidCredentials'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.signup')}</Text>
      <Text style={styles.subtitle}>{t('auth.signup')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('auth.email')}
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder={t('auth.username')}
        placeholderTextColor={colors.textSecondary}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder={t('auth.password')}
        placeholderTextColor={colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Text style={styles.legalText}>
        By signing up, you agree to our{' '}
        <Text style={styles.legalLink} onPress={() => openLegalModal('terms')}>
          Terms of Service
        </Text>
        {' '}and{' '}
        <Text style={styles.legalLink} onPress={() => openLegalModal('agreement')}>
          User Agreement
        </Text>
      </Text>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <Text style={styles.buttonText}>{t('auth.signup')}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>
          {t('auth.alreadyHaveAccount')} <Text style={styles.loginTextBold}>{t('auth.login')}</Text>
        </Text>
      </TouchableOpacity>

      {/* Legal Content Modal */}
      <Modal
        visible={legalModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLegalModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {legalModalType === 'terms' ? 'Terms of Service' : 'User Agreement'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setLegalModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
          >
            <Text style={styles.modalText}>
              {legalModalType === 'terms' ? TERMS_OF_SERVICE : USER_AGREEMENT}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  loginLink: {
    marginTop: spacing.md,
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  loginText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  loginTextBold: {
    color: colors.primary,
    fontWeight: '700',
  },
  legalText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  legalLink: {
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  modalText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 24,
  },
});
