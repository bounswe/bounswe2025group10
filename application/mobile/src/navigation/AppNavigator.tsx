import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
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
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { Image } from 'react-native';
import { SCREEN_NAMES } from '../hooks/useNavigation';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

const iconMap: Record<string, any> = {
  Home: require('../assets/home.png'),
  Community: require('../assets/community.png'),
  Challenges: require('../assets/challenge.png'),
  Profile: require('../assets/profile.png'),
};

const MainTabs = () => (
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
          }}
          resizeMode="contain"
          accessibilityLabel={`${route.name} tab`}
        />
      ),
      tabBarActiveTintColor: '#228B22',
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: {
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        height: 60,
        paddingBottom: 8,
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
      component={HomeScreen} 
      options={{ 
        tabBarLabel: 'Home',
        tabBarAccessibilityLabel: 'Home tab',
      }} 
    />
    <Tab.Screen 
      name={SCREEN_NAMES.COMMUNITY} 
      component={CommunityScreen} 
      options={{ 
        tabBarLabel: 'Community',
        tabBarAccessibilityLabel: 'Community tab',
      }} 
    />
    <Tab.Screen 
      name={SCREEN_NAMES.CHALLENGES} 
      component={ChallengesScreen} 
      options={{ 
        tabBarLabel: 'Challenges',
        tabBarAccessibilityLabel: 'Challenges tab',
      }} 
    />
    <Tab.Screen 
      name={SCREEN_NAMES.PROFILE} 
      component={ProfileScreen} 
      options={{ 
        tabBarLabel: 'Profile',
        tabBarAccessibilityLabel: 'Profile tab',
      }} 
    />
  </Tab.Navigator>
);

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
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <RootStack.Navigator 
          screenOptions={{ 
            headerShown: false,
            gestureEnabled: true,
            animation: 'slide_from_right',
          }}
        >
          <RootStack.Screen 
            name={SCREEN_NAMES.MAIN_TABS} 
            component={MainTabs}
            options={{
              title: 'Zero Waste App',
              headerShown: false,
            }}
          />
          <RootStack.Screen 
            name={SCREEN_NAMES.OTHER_PROFILE} 
            component={OtherUserProfileScreen} 
            options={{ 
              headerShown: true, 
              title: 'Profile',
              gestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <RootStack.Screen 
            name={SCREEN_NAMES.TIPS} 
            component={TipsScreen} 
            options={{ 
              headerShown: false,
              gestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <RootStack.Screen 
            name={SCREEN_NAMES.ACHIEVEMENTS} 
            component={AchievementsScreen} 
            options={{ 
              headerShown: false,
              gestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <RootStack.Screen 
            name={SCREEN_NAMES.LEADERBOARD} 
            component={LeaderboardScreen} 
            options={{ 
              headerShown: false,
              gestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
        </RootStack.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};
