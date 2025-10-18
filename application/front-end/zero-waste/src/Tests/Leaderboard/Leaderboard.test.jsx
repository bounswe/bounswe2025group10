/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import axios from 'axios';
import LeaderboardPage from '../../Leaderboard/Leaderboard';

// Mock dependencies
vi.mock('axios');
vi.mock('../../Login/AuthContent', () => ({
  useAuth: vi.fn()
}));
vi.mock('../../components/Navbar', () => ({
  default: () => <div data-testid="navbar">Navbar</div>
}));

// Import mocked modules
import { useAuth } from '../../Login/AuthContent';

describe('LeaderboardPage', () => {
  const mockLogout = vi.fn();
  const mockToken = 'test-token';
  
  const mockLeaderboardData = [
    {
      username: 'user1',
      total_waste: 100.5,
      points: 150.7,
      profile_picture: true
    },
    {
      username: 'user2',
      total_waste: 95.2,
      points: 140.3,
      profile_picture: false
    },
    {
      username: 'user3',
      total_waste: 89.1,
      points: 130.8,
      profile_picture: true
    },
    {
      username: 'currentUser',
      total_waste: 50.0,
      points: 75.5,
      profile_picture: false
    }
  ];

  const mockCurrentUser = {
    username: 'currentUser'
  };

  const mockProfilePictureBlob = new Blob(['fake image data'], { type: 'image/jpeg' });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default auth mock
    useAuth.mockReturnValue({
      logout: mockLogout,
      token: mockToken
    });

    // Setup axios mocks
    axios.get.mockImplementation((url) => {
      if (url.includes('/me/')) {
        return Promise.resolve({ data: mockCurrentUser });
      }
      if (url.includes('/api/waste/leaderboard/')) {
        return Promise.resolve({ data: { data: mockLeaderboardData } });
      }
      if (url.includes('/picture/')) {
        return Promise.resolve({ data: mockProfilePictureBlob });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // Mock URL.createObjectURL (already done in setupTests.js)
    global.URL.createObjectURL = vi.fn(() => 'mocked-blob-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock environment variable
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000');
  });

  describe('Loading States', () => {
    it('should show loading spinner initially', () => {
      render(<LeaderboardPage />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should hide loading spinner after data is loaded', async () => {
      render(<LeaderboardPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when leaderboard fetch fails', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/waste/leaderboard/')) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ data: mockCurrentUser });
      });

      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Failed to load leaderboard data')).toBeInTheDocument();
      });
    });

    it('should handle current user fetch failure gracefully', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/me/')) {
          return Promise.reject(new Error('Auth error'));
        }
        if (url.includes('/api/waste/leaderboard/')) {
          return Promise.resolve({ data: { data: mockLeaderboardData } });
        }
        return Promise.resolve({ data: mockProfilePictureBlob });
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch current user:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Leaderboard Display', () => {
    it('should render top 10 leaderboard correctly', async () => {
      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.getByText('🌿 Top 10 Zero Waste Champions')).toBeInTheDocument();
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByText('user2')).toBeInTheDocument();
        expect(screen.getByText('100.5')).toBeInTheDocument();
        expect(screen.getByText('95.2')).toBeInTheDocument();
      });
    });

    it('should display medals for top 3 positions', async () => {
      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.getByText('🥇')).toBeInTheDocument();
        expect(screen.getByText('🥈')).toBeInTheDocument();
        expect(screen.getByText('🥉')).toBeInTheDocument();
      });
    });

    it('should round points to integers', async () => {
      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.getByText('151')).toBeInTheDocument(); // 150.7 rounded
        expect(screen.getByText('140')).toBeInTheDocument(); // 140.3 rounded
        expect(screen.getByText('131')).toBeInTheDocument(); // 130.8 rounded
      });
    });

    it('should highlight current user in leaderboard', async () => {
      const extendedMockData = Array.from({ length: 15 }, (_, i) => ({
        username: `user${i + 1}`,
        total_waste: 100 - i,
        points: 150 - i,
        profile_picture: false
      }));
      
      // Put current user at position 5
      extendedMockData[4] = {
        username: 'currentUser',
        total_waste: 95,
        points: 145,
        profile_picture: false
      };

      axios.get.mockImplementation((url) => {
        if (url.includes('/me/')) {
          return Promise.resolve({ data: mockCurrentUser });
        }
        if (url.includes('/api/waste/leaderboard/')) {
          return Promise.resolve({ data: { data: extendedMockData } });
        }
        return Promise.resolve({ data: mockProfilePictureBlob });
      });

      render(<LeaderboardPage />);

      await waitFor(() => {
        const currentUserRow = screen.getByText('currentUser').closest('tr');
        expect(currentUserRow).toHaveClass('fw-bold');
      });
    });
  });

  describe('User Rank Display', () => {
    it('should show current user rank section when user is not in top 10', async () => {
      const extendedMockData = Array.from({ length: 15 }, (_, i) => ({
        username: `user${i + 1}`,
        total_waste: 100 - i,
        points: 150 - i,
        profile_picture: false
      }));
      
      // Put current user at position 12
      extendedMockData[11] = {
        username: 'currentUser',
        total_waste: 88,
        points: 138,
        profile_picture: false
      };

      axios.get.mockImplementation((url) => {
        if (url.includes('/me/')) {
          return Promise.resolve({ data: mockCurrentUser });
        }
        if (url.includes('/api/waste/leaderboard/')) {
          return Promise.resolve({ data: { data: extendedMockData } });
        }
        return Promise.resolve({ data: mockProfilePictureBlob });
      });

      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Your Ranking')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
      });
    });

    it('should not show user rank section when user is in top 10', async () => {
      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.queryByText('Your Ranking')).not.toBeInTheDocument();
      });
    });
  });

  describe('Profile Pictures', () => {
    it('should display profile pictures when available', async () => {
      render(<LeaderboardPage />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
        
        images.forEach(img => {
          expect(img).toHaveClass('rounded-circle');
          expect(img).toHaveAttribute('style', expect.stringContaining('width: 50px'));
        });
      });
    });

    it('should use pravatar fallback when profile picture fails to load', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/me/')) {
          return Promise.resolve({ data: mockCurrentUser });
        }
        if (url.includes('/api/waste/leaderboard/')) {
          return Promise.resolve({ data: { data: mockLeaderboardData } });
        }
        if (url.includes('/picture/')) {
          return Promise.reject(new Error('Picture not found'));
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(URL.createObjectURL).not.toHaveBeenCalledWith(mockProfilePictureBlob);
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to fetch profile picture'),
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Authentication', () => {
    it('should handle unauthenticated users', async () => {
      useAuth.mockReturnValue({
        logout: mockLogout,
        token: null
      });

      axios.get.mockImplementation((url) => {
        if (url.includes('/api/waste/leaderboard/')) {
          return Promise.resolve({ data: { data: mockLeaderboardData } });
        }
        return Promise.resolve({ data: mockProfilePictureBlob });
      });

      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(axios.get).not.toHaveBeenCalledWith(
          expect.stringContaining('/me/'),
          expect.any(Object)
        );
      });
    });

    it('should call logout when logout button is clicked', async () => {
      render(<LeaderboardPage />);

      await waitFor(() => {
        const logoutButton = screen.getByRole('button', { name: /log out/i });
        logoutButton.click();
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Responsive Design', () => {
    it('should include responsive styles', () => {
      render(<LeaderboardPage />);
      
      // Check if the style tag is present (style-jsx injects styles)
      const styleElement = document.querySelector('style');
      expect(styleElement).toBeInTheDocument();
    });
  });

  describe('Table Structure', () => {
    it('should render all required table headers', async () => {
      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.getByText('#')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Username')).toBeInTheDocument();
        expect(screen.getByText('Avoided CO2 emissions')).toBeInTheDocument();
        expect(screen.getByText('Points')).toBeInTheDocument();
      });
    });

    it('should apply correct styling to medal positions', async () => {
      render(<LeaderboardPage />);

      await waitFor(() => {
        const goldRow = screen.getByText('🥇').closest('tr');
        const silverRow = screen.getByText('🥈').closest('tr');
        const bronzeRow = screen.getByText('🥉').closest('tr');

        expect(goldRow).toHaveClass('fw-bold');
        expect(silverRow).toHaveClass('fw-bold');
        expect(bronzeRow).toHaveClass('fw-bold');
      });
    });
  });

  describe('Component Integration', () => {
    it('should render navbar component', () => {
      render(<LeaderboardPage />);
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });

    it('should make correct API calls with proper headers', async () => {
      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          'http://localhost:3000/me/',
          {
            headers: {
              Authorization: 'Bearer test-token'
            }
          }
        );

        expect(axios.get).toHaveBeenCalledWith(
          'http://localhost:3000/api/waste/leaderboard/'
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty leaderboard data', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/me/')) {
          return Promise.resolve({ data: mockCurrentUser });
        }
        if (url.includes('/api/waste/leaderboard/')) {
          return Promise.resolve({ data: { data: [] } });
        }
        return Promise.resolve({ data: mockProfilePictureBlob });
      });

      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.getByText('🌿 Top 10 Zero Waste Champions')).toBeInTheDocument();
        // Should not render any user rows
        expect(screen.queryByText('user1')).not.toBeInTheDocument();
      });
    });

    it('should handle missing points field', async () => {
      const dataWithoutPoints = mockLeaderboardData.map(user => ({
        ...user,
        points: undefined
      }));

      axios.get.mockImplementation((url) => {
        if (url.includes('/me/')) {
          return Promise.resolve({ data: mockCurrentUser });
        }
        if (url.includes('/api/waste/leaderboard/')) {
          return Promise.resolve({ data: { data: dataWithoutPoints } });
        }
        return Promise.resolve({ data: mockProfilePictureBlob });
      });

      render(<LeaderboardPage />);

      await waitFor(() => {
        // Check that points columns exist and contain 0 values
        const pointsCells = screen.getAllByText('0');
        // We expect at least one 0 in the points column
        expect(pointsCells.length).toBeGreaterThan(0);
        
        // Verify specific user rows have 0 points
        const user1Row = screen.getByText('user1').closest('tr');
        expect(user1Row).toHaveTextContent('0');
      });
    });
  });
});