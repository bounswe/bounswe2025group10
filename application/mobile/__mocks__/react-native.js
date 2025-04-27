const React = require('react');

// Mock specific components
const mockComponents = {
  View: ({ children, ...props }) => React.createElement('View', props, children),
  Text: ({ children, ...props }) => React.createElement('Text', props, children),
  ScrollView: ({ children, ...props }) => React.createElement('ScrollView', props, children),
  StatusBar: ({ ...props }) => React.createElement('StatusBar', props),
  TextInput: ({ onChangeText, value, ...props }) => React.createElement('TextInput', {
    ...props,
    value: value || '',
    onChange: (e) => onChangeText && onChangeText(e.target.value),
  }),
  TouchableOpacity: ({ onPress, children, ...props }) => React.createElement('TouchableOpacity', {
    ...props,
    onClick: onPress,
  }, children),
  ActivityIndicator: ({ ...props }) => React.createElement('ActivityIndicator', props),
  Image: ({ source, ...props }) => React.createElement('Image', {
    ...props,
    src: typeof source === 'object' ? source.uri : source,
  }),
};

// Mock APIs
const mockAPIs = {
  StyleSheet: {
    create: styles => styles,
    flatten: style => {
      if (Array.isArray(style)) {
        return Object.assign({}, ...style);
      }
      return style;
    },
  },
  Platform: {
    OS: 'ios',
    select: obj => obj.ios,
  },
  Dimensions: {
    get: () => ({ width: 375, height: 812 }),
  },
  Animated: {
    Value: jest.fn(),
    timing: jest.fn(() => ({ start: jest.fn() })),
    spring: jest.fn(() => ({ start: jest.fn() })),
  },
};

// Export mocked modules
module.exports = {
  ...mockComponents,
  ...mockAPIs,
}; 