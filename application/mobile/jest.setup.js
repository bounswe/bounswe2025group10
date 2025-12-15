// Jest setup file
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

// Mock expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  Ionicons: 'Ionicons',
}));

// Mock react-native-chart-kit
jest.mock('react-native-chart-kit', () => {
  const React = require('react');
  return {
    BarChart: (props) => {
      const MockName = 'BarChart';
      return React.createElement(MockName, props, null);
    },
    LineChart: (props) => {
      const MockName = 'LineChart';
      return React.createElement(MockName, props, null);
    },
    PieChart: (props) => {
      const MockName = 'PieChart';
      return React.createElement(MockName, props, null);
    },
  };
});

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
  Rect: 'Rect',
  Path: 'Path',
}));

// Mock @react-native-picker/picker
jest.mock('@react-native-picker/picker', () => ({
  Picker: 'Picker',
  PickerItem: 'PickerItem',
}));

// Mock environment variables
jest.mock('@env', () => ({
  API_URL: 'http://localhost:8000/api',
}));

// Mock axios
jest.mock('axios');

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
      canGoBack: jest.fn(() => true),
    }),
    useRoute: () => ({
      params: {},
    }),
    NavigationContainer: ({ children }) => children,
  };
});

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: jest.fn(),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: jest.fn(),
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock logger utility
jest.mock('./src/utils/logger', () => ({
  logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

