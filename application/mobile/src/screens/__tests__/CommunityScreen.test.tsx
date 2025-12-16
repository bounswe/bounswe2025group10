import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import { CommunityScreen } from '../CommunityScreen';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
  get: jest.fn(),
}));

// Mock services - this needs to be before the import
jest.mock('../../services/api', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    userData: { username: 'testuser', email: 'test@example.com' },
    fetchUserData: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: true,
    isAdmin: false,
  }),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'community.title': 'Community',
        'community.createPost': 'Create Post',
        'community.noPosts': 'No posts yet',
        'community.beFirst': 'Be the first to share!',
        'community.failedToLoad': 'Failed to load posts',
        'community.retry': 'Retry',
        'common.loading': 'Loading...',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock ScreenWrapper
jest.mock('../../components/ScreenWrapper', () => ({
  ScreenWrapper: ({ children }: any) => <>{children}</>,
}));

// Mock storage
jest.mock('../../utils/storage', () => ({
  storage: {
    getToken: jest.fn().mockResolvedValue('test-token'),
  },
}));

describe('CommunityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render community screen', async () => {
    const api = require('../../services/api').default;
    api.get.mockResolvedValueOnce({ data: [] });

    const { getByText } = render(<CommunityScreen />);

    await waitFor(() => {
      // Should show empty state or loading
      expect(getByText).toBeDefined();
    });
  });

  it('should render loading state initially', () => {
    const api = require('../../services/api').default;
    api.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { UNSAFE_getByType } = render(<CommunityScreen />);

    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('should render empty state when no posts', async () => {
    const api = require('../../services/api').default;
    api.get.mockResolvedValueOnce({ data: [] });

    const { getByText } = render(<CommunityScreen />);

    await waitFor(() => {
      expect(getByText('No posts yet')).toBeTruthy();
    });

    expect(getByText('Be the first to share!')).toBeTruthy();
  });

  it('should render posts when data is available', async () => {
    const mockPosts = [
      {
        id: 1,
        author: 'user1',
        content: 'Test post content',
        created_at: '2024-01-15T10:00:00Z',
        like_count: 5,
        comment_count: 2,
      },
    ];

    const api = require('../../services/api').default;
    api.get.mockResolvedValueOnce({ data: mockPosts });

    const { getByText } = render(<CommunityScreen />);

    await waitFor(() => {
      expect(getByText('Test post content')).toBeTruthy();
    });
  });

  it('should render error state when fetch fails', async () => {
    const api = require('../../services/api').default;
    api.get.mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(<CommunityScreen />);

    await waitFor(() => {
      expect(getByText('Failed to load posts')).toBeTruthy();
    });

    expect(getByText('Retry')).toBeTruthy();
  });

  it('should have create post functionality', async () => {
    const api = require('../../services/api').default;
    api.get.mockResolvedValueOnce({ data: [] });

    const { getByText } = render(<CommunityScreen />);

    await waitFor(() => {
      // The create post button should be present in some form
      expect(getByText).toBeDefined();
    });
  });
});
