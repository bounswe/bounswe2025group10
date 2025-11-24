import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {colors, spacing, typography} from '../utils/theme';

interface MoreDropdownProps {
  onTipsPress?: () => void;
  onAchievementsPress?: () => void;
  onLeaderboardPress?: () => void;
  testID?: string;
}

export const MoreDropdown: React.FC<MoreDropdownProps> = ({
  onTipsPress,
  onAchievementsPress,
  onLeaderboardPress,
  testID = 'more-dropdown',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const menuItems = [
    {
      id: 'tips',
      title: 'Tips',
      icon: '💡',
      onPress: onTipsPress,
    },
    {
      id: 'achievements',
      title: 'Achievements',
      icon: '🏆',
      onPress: onAchievementsPress,
    },
    {
      id: 'leaderboard',
      title: 'Leaderboard',
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
        style={styles.moreButton}
        onPress={() => setIsVisible(true)}
        accessibilityLabel="More options"
        accessibilityRole="button"
        accessibilityHint="Opens a menu with additional options"
        testID={testID}>
        <Text style={styles.moreButtonText}>More</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
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
          <View style={styles.dropdownContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  index === menuItems.length - 1 && styles.lastMenuItem,
                ]}
                onPress={() => handleItemPress(item)}
                accessibilityLabel={item.title}
                accessibilityRole="button"
                testID={`${testID}-item-${item.id}`}>
                <Text style={styles.menuItemIcon}>{item.icon}</Text>
                <Text style={styles.menuItemText}>{item.title}</Text>
                <Text style={styles.menuItemArrow}>→</Text>
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
    backgroundColor: colors.lightGray,
  },
  moreButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  dropdownArrow: {
    fontSize: 10,
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100, // Adjust based on header height
    paddingRight: spacing.md,
  },
  dropdownContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    alignSelf: 'flex-end',
    shadowColor: colors.black,
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
    borderBottomColor: colors.lightGray,
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
    color: colors.darkGray,
    fontWeight: '500',
    marginRight: spacing.sm,
  },
  menuItemArrow: {
    fontSize: 14,
    color: colors.gray,
    marginLeft: spacing.sm,
  },
});
