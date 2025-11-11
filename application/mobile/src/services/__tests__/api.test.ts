import axios from 'axios';
import { storage } from '../../utils/storage';

jest.mock('axios');
jest.mock('../../utils/storage');

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create mock instance before importing services
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

mockedAxios.create = jest.fn(() => mockAxiosInstance as any);

// Import services AFTER setting up mocks
const { authService, wasteService, tipService, achievementService, leaderboardService, profileService, adminService } = require('../api');

describe('API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authService', () => {
    describe('login', () => {
      it('should successfully login with valid credentials', async () => {
        const credentials = { email: 'test@example.com', password: 'password123' };
        const mockResponse = {
          data: {
            message: 'Login successful',
            token: { access: 'access-token', refresh: 'refresh-token' },
            username: 'testuser',
          },
        };

        mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

        const result = await authService.login(credentials);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/login/', credentials);
        expect(result).toEqual(mockResponse.data);
      });

      it('should handle login failure', async () => {
        const credentials = { email: 'wrong@example.com', password: 'wrongpass' };
        const error = new Error('Invalid credentials');

        mockAxiosInstance.post.mockRejectedValueOnce(error);

        await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
      });
    });

    describe('signup', () => {
      it('should successfully signup with valid data', async () => {
        const credentials = {
          email: 'new@example.com',
          username: 'newuser',
          password: 'password123',
        };
        const mockResponse = {
          data: {
            message: 'Signup successful',
            data: { email: credentials.email, username: credentials.username },
          },
        };

        mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

        const result = await authService.signup(credentials);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/signup/', credentials);
        expect(result).toEqual(mockResponse.data);
      });

      it('should handle signup errors', async () => {
        const credentials = {
          email: 'existing@example.com',
          username: 'existinguser',
          password: 'password123',
        };
        const error = new Error('User already exists');

        mockAxiosInstance.post.mockRejectedValueOnce(error);

        await expect(authService.signup(credentials)).rejects.toThrow('User already exists');
      });
    });

    describe('getUserInfo', () => {
      it('should fetch user info successfully', async () => {
        const mockUserData = {
          email: 'user@example.com',
          username: 'testuser',
          profile_picture: 'url',
        };
        const mockResponse = { data: mockUserData };

        mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

        const result = await authService.getUserInfo();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/me/');
        expect(result).toEqual(mockUserData);
      });

      it('should handle errors when fetching user info', async () => {
        const error = new Error('Unauthorized');
        mockAxiosInstance.get.mockRejectedValueOnce(error);

        await expect(authService.getUserInfo()).rejects.toThrow('Unauthorized');
      });
    });

    describe('refreshToken', () => {
      it('should refresh token successfully', async () => {
        const refreshToken = 'refresh-token-123';
        const mockResponse = {
          data: {
            token: { access: 'new-access-token', refresh: 'new-refresh-token' },
          },
        };

        mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

        const result = await authService.refreshToken(refreshToken);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/jwt/refresh/', { refresh: refreshToken });
        expect(result).toEqual(mockResponse.data);
      });
    });
  });

  describe('wasteService', () => {
    describe('getUserWastes', () => {
      it('should fetch user waste data successfully', async () => {
        const mockWasteData = {
          data: [
            { waste_type: 'PLASTIC', total_amount: 10 },
            { waste_type: 'PAPER', total_amount: 5 },
          ],
        };
        const mockResponse = { data: mockWasteData, status: 200 };

        mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

        const result = await wasteService.getUserWastes();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/waste/get/');
        expect(result).toEqual(mockWasteData);
      });

      it('should handle errors when fetching waste data', async () => {
        const error = new Error('Network error');
        mockAxiosInstance.get.mockRejectedValueOnce(error);

        await expect(wasteService.getUserWastes()).rejects.toThrow('Network error');
      });
    });

    describe('addUserWaste', () => {
      it('should add waste entry successfully', async () => {
        const wasteType = 'PLASTIC';
        const amount = 5;
        const mockResponse = {
          data: { message: 'Waste added successfully' },
          status: 201,
        };

        mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

        const result = await wasteService.addUserWaste(wasteType, amount);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/waste/', { waste_type: wasteType, amount });
        expect(result).toEqual(mockResponse.data);
      });

      it('should handle errors when adding waste', async () => {
        const error = new Error('Invalid waste type');
        mockAxiosInstance.post.mockRejectedValueOnce(error);

        await expect(wasteService.addUserWaste('INVALID', 5)).rejects.toThrow('Invalid waste type');
      });
    });
  });

  describe('tipService', () => {
    describe('getRecentTips', () => {
      it('should fetch recent tips successfully', async () => {
        const mockTips = {
          data: [
            { id: 1, title: 'Tip 1', description: 'Description 1', like_count: 5, dislike_count: 1 },
            { id: 2, title: 'Tip 2', description: 'Description 2', like_count: 3, dislike_count: 0 },
          ],
        };
        const mockResponse = { data: mockTips };

        mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

        const result = await tipService.getRecentTips();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/tips/get_recent_tips');
        expect(result).toEqual(mockTips);
      });
    });

    describe('createTip', () => {
      it('should create a tip successfully', async () => {
        const title = 'New Tip';
        const description = 'Tip description';
        const mockResponse = {
          data: { id: 1, title, description },
        };

        mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

        const result = await tipService.createTip(title, description);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/tips/create/', { title, description });
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('likeTip', () => {
      it('should like a tip successfully', async () => {
        const tipId = 123;
        const mockResponse = { data: { message: 'Tip liked' } };

        mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

        const result = await tipService.likeTip(tipId);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(`/api/tips/${tipId}/like/`, {});
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('dislikeTip', () => {
      it('should dislike a tip successfully', async () => {
        const tipId = 123;
        const mockResponse = { data: { message: 'Tip disliked' } };

        mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

        const result = await tipService.dislikeTip(tipId);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(`/api/tips/${tipId}/dislike/`, {});
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('reportTip', () => {
      it('should report a tip successfully', async () => {
        const tipId = 123;
        const reason = 'Spam';
        const description = 'This is spam content';
        const mockResponse = { data: { message: 'Tip reported' } };

        mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

        const result = await tipService.reportTip(tipId, reason, description);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(`/api/tips/${tipId}/report/`, { reason, description });
        expect(result).toEqual(mockResponse.data);
      });
    });
  });

  describe('achievementService', () => {
    describe('getUserAchievements', () => {
      it('should fetch user achievements successfully', async () => {
        const mockAchievements = {
          data: [
            { id: 1, name: 'First Waste', unlocked: true },
            { id: 2, name: '10kg Recycled', unlocked: false },
          ],
        };
        const mockResponse = { data: mockAchievements };

        mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

        const result = await achievementService.getUserAchievements();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/achievements/');
        expect(result).toEqual(mockAchievements);
      });
    });
  });

  describe('leaderboardService', () => {
    describe('getLeaderboard', () => {
      it('should fetch leaderboard successfully', async () => {
        const mockLeaderboard = {
          data: [
            { username: 'user1', total_points: 100 },
            { username: 'user2', total_points: 80 },
          ],
        };
        const mockResponse = { data: mockLeaderboard };

        mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

        const result = await leaderboardService.getLeaderboard();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/waste/leaderboard/');
        expect(result).toEqual(mockLeaderboard);
      });
    });

    describe('getUserBio', () => {
      it('should fetch user bio successfully', async () => {
        const username = 'testuser';
        const mockBio = { data: { username, bio: 'User bio' } };
        const mockResponse = { data: mockBio };

        mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

        const result = await leaderboardService.getUserBio(username);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/api/profile/${username}/bio/`);
        expect(result).toEqual(mockBio);
      });
    });
  });

  describe('profileService', () => {
    describe('uploadProfilePicture', () => {
      it('should upload profile picture successfully', async () => {
        const formData = new FormData();
        formData.append('image', 'mock-image-data');
        const mockResponse = { data: { profile_picture: 'url' } };

        mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

        const result = await profileService.uploadProfilePicture(formData);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/api/profile/profile-picture/',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('updateBio', () => {
      it('should update bio successfully', async () => {
        const username = 'testuser';
        const bio = 'New bio text';
        const mockResponse = { data: { username, bio } };

        mockAxiosInstance.put.mockResolvedValueOnce(mockResponse);

        const result = await profileService.updateBio(username, bio);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/api/profile/${username}/bio/`, { bio });
        expect(result).toEqual(mockResponse.data);
      });
    });
  });

  describe('adminService', () => {
    describe('getReports', () => {
      it('should fetch all reports successfully', async () => {
        const mockReports = {
          data: [
            { id: 1, content_type: 'post', reason: 'Spam' },
            { id: 2, content_type: 'comment', reason: 'Offensive' },
          ],
        };
        const mockResponse = { data: mockReports };

        mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

        const result = await adminService.getReports();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/admin/reports/');
        expect(result).toEqual(mockReports);
      });

      it('should fetch reports filtered by content type', async () => {
        const contentType = 'post';
        const mockReports = { data: [{ id: 1, content_type: 'post', reason: 'Spam' }] };
        const mockResponse = { data: mockReports };

        mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

        const result = await adminService.getReports(contentType);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/api/admin/reports/?content_type=${contentType}`);
        expect(result).toEqual(mockReports);
      });
    });

    describe('moderateContent', () => {
      it('should moderate content successfully', async () => {
        const reportId = 123;
        const action = 'approve';
        const mockResponse = { data: { message: 'Content moderated' } };

        mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

        const result = await adminService.moderateContent(reportId, action);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          `/api/admin/reports/${reportId}/moderate/`,
          { action }
        );
        expect(result).toEqual(mockResponse.data);
      });
    });
  });
});

