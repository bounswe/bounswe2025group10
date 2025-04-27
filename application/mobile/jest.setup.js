// Mock React Native's Animated API
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  RN.Animated = {
    Value: jest.fn(),
    timing: jest.fn(() => ({
      start: jest.fn(),
    })),
    spring: jest.fn(() => ({
      start: jest.fn(),
    })),
  };

  return RN;
}); 