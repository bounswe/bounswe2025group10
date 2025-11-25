import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {colors as defaultColors, spacing, typography} from '../utils/theme';
import {useRTL} from '../hooks/useRTL';
import {useTheme} from '../context/ThemeContext';

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  accessibilityLabel?: string;
  testID?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightComponent,
  accessibilityLabel,
  testID = 'app-header',
}) => {
  const navigation = useNavigation();
  const { textStyle, rowStyle, backArrow } = useRTL();
  const { colors, isDarkMode } = useTheme();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
        translucent={false}
      />
      <View style={[styles.container, rowStyle, { backgroundColor: colors.background }]} testID={testID}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.lightGray }]}
              onPress={handleBackPress}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              accessibilityHint="Navigates to the previous screen"
              testID="back-button">
              <Text style={[styles.backButtonText, { color: colors.primary }]}>{backArrow}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.centerSection}>
          <Text
            style={[styles.title, textStyle, { color: colors.primary }]}
            accessibilityRole="header">
            {title}
          </Text>
        </View>

        <View style={styles.rightSection}>{rightComponent}</View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: defaultColors.white,
    elevation: 2,
    shadowColor: defaultColors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: defaultColors.white,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerSection: {
    flex: 3,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: defaultColors.lightGray,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: defaultColors.primary,
    fontWeight: 'bold',
  },
  title: {
    ...typography.h2,
    color: defaultColors.primary,
    textAlign: 'center',
    maxWidth: '100%',
  },
});
