import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../utils/theme';

interface AdminTabBarProps {
  activeTab?: string;
}

export const AdminTabBar: React.FC<AdminTabBarProps> = ({ activeTab = 'posts' }) => {
  const navigation = useNavigation();

  const tabs = [
    { key: 'posts', label: 'Posts', icon: '📝', screen: 'PostModeration' },
    { key: 'users', label: 'Users', icon: '👥', screen: 'UserModeration' },
    { key: 'challenges', label: 'Challenges', icon: '🎯', screen: 'ChallengeModeration' },
    { key: 'comments', label: 'Comments', icon: '💬', screen: 'CommentModeration' },
  ];

  const handleTabPress = (tab: any) => {
    (navigation as any).navigate(tab.screen);
  };

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => handleTabPress(tab)}
            accessibilityLabel={`${tab.label} moderation`}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabLabel,
              { color: isActive ? colors.primary : colors.gray }
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
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
