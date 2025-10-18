import "@testing-library/jest-dom";
import React from 'react';
import { vi } from 'vitest';

// Ensure DOM is available
if (typeof document === 'undefined') {
  throw new Error('DOM is not available. Make sure tests are running with jsdom environment');
}

// Make React available globally for JSX
global.React = React;

// Mock global objects that might be needed
global.URL.createObjectURL = vi.fn(() => 'mocked-blob-url');
global.URL.revokeObjectURL = vi.fn();

// Mock window.fs for file reading (used in component)
global.window = global.window || {};
global.window.fs = {
  readFile: vi.fn()
};

// Setup any global mocks
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});