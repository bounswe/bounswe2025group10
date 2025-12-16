import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {colors as defaultColors, spacing, typography} from '../utils/theme';
import {useTheme} from '../context/ThemeContext';
import {useTranslation} from 'react-i18next';

interface MoreDropdownProps {
  onTipsPress?: () => void;
  onAchievementsPress?: () => void;
  onLeaderboardPress?: () => void;
  onActivityFeedPress?: () => void;
  testID?: string;
}

export const MoreDropdown: React.FC<MoreDropdownProps> = ({
  onTipsPress,
  onAchievementsPress,
  onLeaderboardPress,
  onActivityFeedPress,
  testID = 'more-dropdown',
}) => {
  const {t} = useTranslation();
  const {colors} = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  const menuItems = [
    {
      id: 'activity',
      title: t('activity.title', 'Activity Feed'),
      icon: '📰',
      onPress: onActivityFeedPress,
    },
    {
      id: 'tips',
      title: t('tips.title'),
      icon: '💡',
      onPress: onTipsPress,
    },
    {
      id: 'achievements',
      title: t('achievements.title'),
      icon: '🏆',
      onPress: onAchievementsPress,
    },
    {
      id: 'leaderboard',
      title: t('leaderboard.title'),
      icon: '📊',
      onPress: onLeaderboardPress,
    },
  ];

  const handleItemPress = (item: (typeof menuItems)[0]) => {
    setIsVisible(false);
    if (item.onPress) {
      item.onPress();
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.moreButton, { backgroundColor: colors.backgroundSecondary }]}
        onPress={() => setIsVisible(true)}
        accessibilityLabel="More options"
        accessibilityRole="button"
        accessibilityHint="Opens a menu with additional options"
        testID={testID}>
        <Text style={[styles.moreButtonText, { color: colors.primary }]}>{t('common.more') || 'More'}</Text>
        <Text style={[styles.dropdownArrow, { color: colors.primary }]}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}>
          <View style={[styles.dropdownContainer, { backgroundColor: colors.background }]}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  { borderBottomColor: colors.lightGray },
                  index === menuItems.length - 1 && styles.lastMenuItem,
                ]}
                onPress={() => handleItemPress(item)}
                accessibilityLabel={item.title}
                accessibilityRole="button"
                testID={`${testID}-item-${item.id}`}>
                <Text style={styles.menuItemIcon}>{item.icon}</Text>
                <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const {width} = Dimensions.get('window');

const styles = StyleSheet.create({
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  moreButtonText: {
    ...typography.body,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  dropdownArrow: {
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: spacing.md,
  },
  dropdownContainer: {
    borderRadius: 12,
    alignSelf: 'flex-end',
    shadowColor: defaultColors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    minWidth: 200,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
    width: 24,
    textAlign: 'center',
  },
  menuItemText: {
    ...typography.body,
    fontWeight: '500',
    marginRight: spacing.sm,
  },
  menuItemArrow: {
    fontSize: 14,
    marginLeft: spacing.sm,
  },
});
