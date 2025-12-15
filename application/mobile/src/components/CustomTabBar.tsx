import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {spacing, typography} from '../utils/theme';
import {MIN_TOUCH_TARGET} from '../utils/accessibility';
import {useTheme} from '../context/ThemeContext';

interface CustomTabBarProps {
  activeTab?: string;
}

const iconMap: Record<string, any> = {
  Home: require('../assets/home.png'),
  Community: require('../assets/community.png'),
  Challenges: require('../assets/challenge.png'),
  Profile: require('../assets/profile.png'),
};

export const CustomTabBar: React.FC<CustomTabBarProps> = ({
  activeTab = 'Tips',
}) => {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const {colors, isDarkMode} = useTheme();

  const tabs = [
    {key: 'Home', label: t('home.title'), screen: 'MainTabs'},
    {key: 'Community', label: t('community.title'), screen: 'MainTabs'},
    {key: 'Challenges', label: t('challenges.title'), screen: 'MainTabs'},
    {key: 'Profile', label: t('profile.title'), screen: 'MainTabs'},
  ];

  const handleTabPress = (tab: any) => {
    if (tab.screen === 'MainTabs') {
      navigation.navigate('MainTabs', {screen: tab.key});
    } else {
      navigation.navigate(tab.screen);
    }
  };

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.background, borderTopColor: colors.lightGray }]}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => handleTabPress(tab)}
            accessibilityLabel={`${tab.label} tab`}>
            <Image
              source={iconMap[tab.key]}
              style={{
                width: 24,
                height: 24,
                opacity: isActive ? 1 : 0.6,
                tintColor: isDarkMode ? (isActive ? colors.primary : colors.textSecondary) : undefined,
              }}
              resizeMode="contain"
              accessibilityLabel={`${tab.label} tab`}
            />
            <Text
              style={[
                styles.tabLabel,
                {color: isActive ? colors.primary : colors.textSecondary},
              ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    minHeight: 60,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  tabLabel: {
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
});
