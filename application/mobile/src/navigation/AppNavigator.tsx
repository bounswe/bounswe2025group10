import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { ChallengesScreen } from '../screens/ChallengesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { OtherUserProfileScreen } from '../screens/OtherUserProfileScreen';
import { TipsScreen } from '../screens/TipsScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { ActivityFeedScreen } from '../screens/ActivityFeedScreen';
import { LegalScreen } from '../screens/LegalScreen';
import { AdminPanel } from '../screens/AdminPanel';
import { PostModeration } from '../screens/PostModeration';
import { UserModeration } from '../screens/UserModeration';
import { ChallengeModeration } from '../screens/ChallengeModeration';
import { CommentModeration } from '../screens/CommentModeration';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { Image } from 'react-native';
import { SCREEN_NAMES } from '../hooks/useNavigation';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const CommunityStack = createNativeStackNavigator();
const ChallengesStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

const iconMap: Record<string, any> = {
  Home: require('../assets/home.png'),
  Community: require('../assets/community.png'),
  Challenges: require('../assets/challenge.png'),
  Profile: require('../assets/profile.png'),
};

// Stack navigators for each tab to allow navigating to Tips, Achievements, etc. while keeping tab bar visible
const HomeStackScreen = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeMain" component={HomeScreen} />
    <HomeStack.Screen name={SCREEN_NAMES.TIPS} component={TipsScreen} />
    <HomeStack.Screen name={SCREEN_NAMES.ACHIEVEMENTS} component={AchievementsScreen} />
    <HomeStack.Screen name={SCREEN_NAMES.LEADERBOARD} component={LeaderboardScreen} />
    <HomeStack.Screen name={SCREEN_NAMES.ACTIVITY_FEED} component={ActivityFeedScreen} />
    <HomeStack.Screen name={SCREEN_NAMES.OTHER_PROFILE} component={OtherUserProfileScreen} />
    <HomeStack.Screen name={SCREEN_NAMES.LEGAL} component={LegalScreen} />
  </HomeStack.Navigator>
);

const CommunityStackScreen = () => (
  <CommunityStack.Navigator screenOptions={{ headerShown: false }}>
    <CommunityStack.Screen name="CommunityMain" component={CommunityScreen} />
    <CommunityStack.Screen name={SCREEN_NAMES.TIPS} component={TipsScreen} />
    <CommunityStack.Screen name={SCREEN_NAMES.ACHIEVEMENTS} component={AchievementsScreen} />
    <CommunityStack.Screen name={SCREEN_NAMES.LEADERBOARD} component={LeaderboardScreen} />
    <CommunityStack.Screen name={SCREEN_NAMES.ACTIVITY_FEED} component={ActivityFeedScreen} />
    <CommunityStack.Screen name={SCREEN_NAMES.OTHER_PROFILE} component={OtherUserProfileScreen} />
    <CommunityStack.Screen name={SCREEN_NAMES.LEGAL} component={LegalScreen} />
  </CommunityStack.Navigator>
);

const ChallengesStackScreen = () => (
  <ChallengesStack.Navigator screenOptions={{ headerShown: false }}>
    <ChallengesStack.Screen name="ChallengesMain" component={ChallengesScreen} />
    <ChallengesStack.Screen name={SCREEN_NAMES.TIPS} component={TipsScreen} />
    <ChallengesStack.Screen name={SCREEN_NAMES.ACHIEVEMENTS} component={AchievementsScreen} />
    <ChallengesStack.Screen name={SCREEN_NAMES.LEADERBOARD} component={LeaderboardScreen} />
    <ChallengesStack.Screen name={SCREEN_NAMES.ACTIVITY_FEED} component={ActivityFeedScreen} />
    <ChallengesStack.Screen name={SCREEN_NAMES.OTHER_PROFILE} component={OtherUserProfileScreen} />
    <ChallengesStack.Screen name={SCREEN_NAMES.LEGAL} component={LegalScreen} />
  </ChallengesStack.Navigator>
);

const ProfileStackScreen = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    <ProfileStack.Screen name={SCREEN_NAMES.TIPS} component={TipsScreen} />
    <ProfileStack.Screen name={SCREEN_NAMES.ACHIEVEMENTS} component={AchievementsScreen} />
    <ProfileStack.Screen name={SCREEN_NAMES.LEADERBOARD} component={LeaderboardScreen} />
    <ProfileStack.Screen name={SCREEN_NAMES.ACTIVITY_FEED} component={ActivityFeedScreen} />
    <ProfileStack.Screen name={SCREEN_NAMES.OTHER_PROFILE} component={OtherUserProfileScreen} />
    <ProfileStack.Screen name={SCREEN_NAMES.LEGAL} component={LegalScreen} />
  </ProfileStack.Navigator>
);

const MainTabs = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ size, focused }) => (
          <Image
            source={iconMap[route.name]}
            style={{
              width: size,
              height: size,
              opacity: focused ? 1 : 0.6,
              tintColor: focused ? colors.primary : undefined,
            }}
            resizeMode="contain"
            accessibilityLabel={`${route.name} tab`}
          />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.lightGray,
          height: 80,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarAccessibilityLabel: `${route.name} tab`,
      })}
    >
      <Tab.Screen
        name={SCREEN_NAMES.HOME}
        component={HomeStackScreen}
        options={{
          tabBarLabel: t('home.title'),
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.COMMUNITY}
        component={CommunityStackScreen}
        options={{
          tabBarLabel: t('community.title'),
          tabBarAccessibilityLabel: 'Community tab',
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.CHALLENGES}
        component={ChallengesStackScreen}
        options={{
          tabBarLabel: t('challenges.title'),
          tabBarAccessibilityLabel: 'Challenges tab',
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.PROFILE}
        component={ProfileStackScreen}
        options={{
          tabBarLabel: t('profile.title'),
          tabBarAccessibilityLabel: 'Profile tab',
        }}
      />
    </Tab.Navigator>
  );
};

const AuthStack = () => (
  <RootStack.Navigator 
    screenOptions={{ 
      headerShown: false,
      gestureEnabled: true,
      animation: 'slide_from_right',
    }}
  >
    <RootStack.Screen 
      name={SCREEN_NAMES.LOGIN} 
      component={LoginScreen}
      options={{
        title: 'Login',
        headerShown: false,
      }}
    />
    <RootStack.Screen 
      name={SCREEN_NAMES.SIGNUP} 
      component={SignupScreen}
      options={{
        title: 'Sign Up',
        headerShown: false,
      }}
    />
  </RootStack.Navigator>
);

export const AppNavigator = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const { colors, isDarkMode } = useTheme();

  // Custom navigation themes
  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.textPrimary,
      border: colors.lightGray,
    },
  };

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.textPrimary,
      border: colors.lightGray,
    },
  };

  return (
    <NavigationContainer theme={isDarkMode ? customDarkTheme : customLightTheme}>
      {isAuthenticated ? (
        <RootStack.Navigator 
          screenOptions={{ 
            headerShown: false,
            gestureEnabled: true,
            animation: 'slide_from_right',
          }}
        >
          {isAdmin ? (
            // Admin user sees admin panel and moderation screens
            <>
              <RootStack.Screen 
                name="AdminPanel" 
                component={AdminPanel}
                options={{
                  title: 'Admin Panel',
                  headerShown: false,
                }}
              />
              <RootStack.Screen 
                name="PostModeration" 
                component={PostModeration}
                options={{
                  title: 'Post Moderation',
                  headerShown: false,
                }}
              />
              <RootStack.Screen 
                name="UserModeration" 
                component={UserModeration}
                options={{
                  title: 'User Moderation',
                  headerShown: false,
                }}
              />
              <RootStack.Screen 
                name="ChallengeModeration" 
                component={ChallengeModeration}
                options={{
                  title: 'Challenge Moderation',
                  headerShown: false,
                }}
              />
              <RootStack.Screen 
                name="CommentModeration" 
                component={CommentModeration}
                options={{
                  title: 'Comment Moderation',
                  headerShown: false,
                }}
              />
            </>
          ) : (
            // Regular user sees normal app
            <RootStack.Screen
              name={SCREEN_NAMES.MAIN_TABS}
              component={MainTabs}
              options={{
                title: 'Zero Waste App',
                headerShown: false,
              }}
            />
          )}
        </RootStack.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};
