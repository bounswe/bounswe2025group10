import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useNavigation, NavigationProp, ParamListBase} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {spacing} from '../utils/theme';
import {MIN_TOUCH_TARGET} from '../utils/accessibility';
import {useTheme} from '../context/ThemeContext';

interface CustomTabBarProps {
  activeTab?: string;
}

interface TabItem {
  key: string;
  label: string;
  screen: string;
  icon: string;
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({
  activeTab = 'Tips',
}) => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const {t} = useTranslation();
  const {colors} = useTheme();

  const tabs: TabItem[] = [
    {key: 'Home', label: t('home.title'), screen: 'MainTabs', icon: '🏠'},
    {key: 'Community', label: t('community.title'), screen: 'MainTabs', icon: '👥'},
    {key: 'Challenges', label: t('challenges.title'), screen: 'MainTabs', icon: '🎯'},
    {key: 'Profile', label: t('profile.title'), screen: 'MainTabs', icon: '👤'},
  ];

  const handleTabPress = (tab: TabItem) => {
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
            <Text style={[styles.tabIcon, {opacity: isActive ? 1 : 0.5}]}>
              {tab.icon}
            </Text>
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
    paddingBottom: 50,
    paddingTop: spacing.sm,
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  tabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
});
