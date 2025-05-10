const React = require('react');

// Basic component mocks
const mockComponents = {
  View: ({ children, ...props }) => React.createElement('View', props, children),
  Text: ({ children, ...props }) => React.createElement('Text', props, children),
  TextInput: (props) => React.createElement('TextInput', props),
  TouchableOpacity: ({ children, ...props }) => React.createElement('TouchableOpacity', props, children),
  StatusBar: (props) => React.createElement('StatusBar', props),
  ScrollView: ({ children, ...props }) => React.createElement('ScrollView', props, children),
};

// Mock StyleSheet and NativeModules
const mockAPIs = {
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => (Array.isArray(style) ? Object.assign({}, ...style) : style),
  },
  NativeModules: {},
};

function useColorScheme() {
  return 'light';
}

module.exports = {
  ...mockComponents,
  ...mockAPIs,
  useColorScheme,
}; 