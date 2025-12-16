import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { spacing, typography } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import { TERMS_OF_SERVICE, USER_AGREEMENT } from '../constants/legalContent';

type LegalScreenRouteProp = RouteProp<{ Legal: { type: 'terms' | 'agreement' } }, 'Legal'>;

export const LegalScreen: React.FC = () => {
  const route = useRoute<LegalScreenRouteProp>();
  const { colors } = useTheme();
  const type = route.params?.type || 'terms';

  const title = type === 'terms' ? 'Terms of Service' : 'User Agreement';
  const content = type === 'terms' ? TERMS_OF_SERVICE : USER_AGREEMENT;

  return (
    <ScreenWrapper
      title={title}
      showBackButton={true}
      scrollable={false}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        <Text style={[styles.content, { color: colors.textPrimary }]}>
          {content}
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.xl * 2,
  },
  content: {
    ...typography.body,
    lineHeight: 24,
  },
});
