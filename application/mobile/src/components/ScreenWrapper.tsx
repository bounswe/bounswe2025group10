import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { AppHeader } from './AppHeader';
import { colors as defaultColors, spacing } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';

interface ScreenWrapperProps {
  children: React.ReactNode;
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentContainerStyle?: any;
  keyboardAvoidingView?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  title,
  showBackButton = false,
  onBackPress,
  leftComponent,
  rightComponent,
  scrollable = true,
  refreshing = false,
  onRefresh,
  contentContainerStyle,
  keyboardAvoidingView = true,
  accessibilityLabel,
  testID,
}) => {
  const { colors } = useTheme();

  const content = (
    <View style={styles.content}>
      {children}
    </View>
  );

  const scrollableContent = scrollable ? (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      accessibilityLabel={accessibilityLabel}
      testID={testID ? `${testID}-scroll` : undefined}
    >
      {content}
    </ScrollView>
  ) : (
    content
  );

  const keyboardAvoidingContent = keyboardAvoidingView ? (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {scrollableContent}
    </KeyboardAvoidingView>
  ) : (
    scrollableContent
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID={testID}>
      <AppHeader
        title={title}
        showBackButton={showBackButton}
        onBackPress={onBackPress}
        leftComponent={leftComponent}
        rightComponent={rightComponent}
        accessibilityLabel={accessibilityLabel}
        testID={testID ? `${testID}-header` : undefined}
      />
      {keyboardAvoidingContent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: defaultColors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
});

