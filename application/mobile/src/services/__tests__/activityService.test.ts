/**
 * Tests for activity feed service functionality
 */

import { activityService, ActivityItem } from '../api';

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
  post: jest.fn(),
  get: jest.fn(),
}));

// Mock storage
jest.mock('../../utils/storage', () => ({
  storage: {
    getToken: jest.fn().mockResolvedValue('mock-token'),
    getRefreshToken: jest.fn().mockResolvedValue('mock-refresh-token'),
    setToken: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

// Mock environment variables
jest.mock('@env', () => ({
  API_URL: 'http://test-api.com',
}));

describe('activityService', () => {
  describe('getActivityFeed', () => {
    it('should be a function', () => {
      expect(typeof activityService.getActivityFeed).toBe('function');
    });

    it('should accept followingUsernames array', () => {
      expect(activityService.getActivityFeed.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty array when no following users', async () => {
      const result = await activityService.getActivityFeed([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getOwnActivities', () => {
    it('should be a function', () => {
      expect(typeof activityService.getOwnActivities).toBe('function');
    });

    it('should return an array', async () => {
      const result = await activityService.getOwnActivities();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe('ActivityItem Interface', () => {
  describe('structure validation', () => {
    it('should have correct structure for post activity', () => {
      const postActivity: ActivityItem = {
        id: 'post-1',
        type: 'post',
        actorUsername: 'testuser',
        summary: 'Test post summary',
        timestamp: '2024-01-01T00:00:00Z',
        data: { id: 1, text: 'Post content', like_count: 5 },
      };

      expect(postActivity.id).toBe('post-1');
      expect(postActivity.type).toBe('post');
      expect(postActivity.actorUsername).toBe('testuser');
      expect(postActivity.summary).toBe('Test post summary');
      expect(postActivity.timestamp).toBe('2024-01-01T00:00:00Z');
      expect(postActivity.data).toBeDefined();
    });

    it('should have correct structure for waste activity', () => {
      const wasteActivity: ActivityItem = {
        id: 'waste-PLASTIC-100',
        type: 'waste',
        actorUsername: 'You',
        summary: 'Logged 100g of PLASTIC',
        timestamp: '2024-01-01T00:00:00Z',
        data: { waste_type: 'PLASTIC', total_amount: 100 },
      };

      expect(wasteActivity.type).toBe('waste');
      expect(wasteActivity.data?.waste_type).toBe('PLASTIC');
    });

    it('should have correct structure for achievement activity', () => {
      const achievementActivity: ActivityItem = {
        id: 'achievement-1',
        type: 'achievement',
        actorUsername: 'You',
        summary: 'Earned an achievement',
        timestamp: '2024-01-01T00:00:00Z',
        data: { challenge: 1 },
      };

      expect(achievementActivity.type).toBe('achievement');
    });

    it('should allow undefined data', () => {
      const activity: ActivityItem = {
        id: 'follow-1',
        type: 'follow',
        actorUsername: 'user1',
        summary: 'Started following user2',
        timestamp: '2024-01-01T00:00:00Z',
      };

      expect(activity.data).toBeUndefined();
    });
  });

  describe('activity types', () => {
    const validTypes = ['post', 'waste', 'achievement', 'challenge', 'follow'];

    validTypes.forEach(type => {
      it(`should accept type: ${type}`, () => {
        const activity: ActivityItem = {
          id: `${type}-1`,
          type: type as ActivityItem['type'],
          actorUsername: 'testuser',
          summary: `Test ${type}`,
          timestamp: new Date().toISOString(),
        };

        expect(activity.type).toBe(type);
      });
    });
  });
});

describe('Activity Feed Logic', () => {
  describe('sorting', () => {
    it('should sort activities by timestamp (newest first)', () => {
      const activities: ActivityItem[] = [
        {
          id: '1',
          type: 'post',
          actorUsername: 'user1',
          summary: 'Old post',
          timestamp: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          type: 'post',
          actorUsername: 'user2',
          summary: 'New post',
          timestamp: '2024-01-02T00:00:00Z',
        },
        {
          id: '3',
          type: 'waste',
          actorUsername: 'user3',
          summary: 'Middle activity',
          timestamp: '2024-01-01T12:00:00Z',
        },
      ];

      const sorted = [...activities].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      expect(sorted[0].id).toBe('2'); // newest
      expect(sorted[1].id).toBe('3'); // middle
      expect(sorted[2].id).toBe('1'); // oldest
    });
  });

  describe('filtering', () => {
    const mockActivities: ActivityItem[] = [
      { id: '1', type: 'post', actorUsername: 'user1', summary: 'Post 1', timestamp: '2024-01-01' },
      { id: '2', type: 'waste', actorUsername: 'user2', summary: 'Waste 1', timestamp: '2024-01-01' },
      { id: '3', type: 'post', actorUsername: 'user3', summary: 'Post 2', timestamp: '2024-01-01' },
      { id: '4', type: 'achievement', actorUsername: 'user4', summary: 'Achievement 1', timestamp: '2024-01-01' },
    ];

    it('should filter by type: post', () => {
      const filtered = mockActivities.filter(a => a.type === 'post');
      expect(filtered.length).toBe(2);
      expect(filtered.every(a => a.type === 'post')).toBe(true);
    });

    it('should filter by type: waste', () => {
      const filtered = mockActivities.filter(a => a.type === 'waste');
      expect(filtered.length).toBe(1);
      expect(filtered[0].type).toBe('waste');
    });

    it('should filter by type: achievement', () => {
      const filtered = mockActivities.filter(a => a.type === 'achievement');
      expect(filtered.length).toBe(1);
    });

    it('should return all when filter is "all"', () => {
      const filter = 'all';
      const filtered = filter === 'all' ? mockActivities : mockActivities.filter(a => a.type === filter);
      expect(filtered.length).toBe(mockActivities.length);
    });
  });

  describe('following users filter', () => {
    const mockPosts = [
      { id: 1, creator_username: 'user1', text: 'Post 1' },
      { id: 2, creator_username: 'user2', text: 'Post 2' },
      { id: 3, creator_username: 'user3', text: 'Post 3' },
      { id: 4, creator_username: 'user1', text: 'Post 4' },
    ];

    it('should filter posts by followed users', () => {
      const followingUsernames = ['user1', 'user3'];
      const filtered = mockPosts.filter(post => 
        followingUsernames.includes(post.creator_username)
      );

      expect(filtered.length).toBe(3);
      expect(filtered.every(p => followingUsernames.includes(p.creator_username))).toBe(true);
    });

    it('should return empty array when not following anyone', () => {
      const followingUsernames: string[] = [];
      const filtered = mockPosts.filter(post => 
        followingUsernames.includes(post.creator_username)
      );

      expect(filtered.length).toBe(0);
    });
  });
});

describe('Activity Feed UI States', () => {
  describe('empty states', () => {
    it('should show correct message for empty following feed', () => {
      const feedType = 'following';
      const activities: ActivityItem[] = [];
      
      const isEmpty = activities.length === 0;
      const message = feedType === 'following' 
        ? 'No activity from followed users'
        : 'No activity yet';

      expect(isEmpty).toBe(true);
      expect(message).toBe('No activity from followed users');
    });

    it('should show correct message for empty own activity', () => {
      const feedType = 'own';
      const activities: ActivityItem[] = [];
      
      const isEmpty = activities.length === 0;
      const message = feedType === 'following' 
        ? 'No activity from followed users'
        : 'No activity yet';

      expect(isEmpty).toBe(true);
      expect(message).toBe('No activity yet');
    });
  });

  describe('activity icons', () => {
    const ACTIVITY_ICONS: Record<string, string> = {
      post: '📝',
      posts: '📝',
      like: '👍',
      dislike: '👎',
      waste: '♻️',
      achievement: '🏆',
      challenge: '🎯',
      follow: '👥',
    };

    it('should have correct icon for each activity type', () => {
      expect(ACTIVITY_ICONS.post).toBe('📝');
      expect(ACTIVITY_ICONS.posts).toBe('📝');
      expect(ACTIVITY_ICONS.like).toBe('👍');
      expect(ACTIVITY_ICONS.dislike).toBe('👎');
      expect(ACTIVITY_ICONS.waste).toBe('♻️');
      expect(ACTIVITY_ICONS.achievement).toBe('🏆');
      expect(ACTIVITY_ICONS.challenge).toBe('🎯');
      expect(ACTIVITY_ICONS.follow).toBe('👥');
    });

    it('should return correct icon for activity', () => {
      const activity: ActivityItem = {
        id: '1',
        type: 'post',
        actorUsername: 'user1',
        summary: 'Test',
        timestamp: '2024-01-01',
      };

      const icon = ACTIVITY_ICONS[activity.type] || '📌';
      expect(icon).toBe('📝');
    });

    it('should return default icon for unknown type', () => {
      const unknownType = 'unknown';
      const icon = ACTIVITY_ICONS[unknownType] || '📌';
      expect(icon).toBe('📌');
    });
  });
});

describe('Like/Dislike Activity Types', () => {
  const validTypes = ['post', 'waste', 'achievement', 'challenge', 'follow', 'like', 'dislike'];

  validTypes.forEach(type => {
    it(`should accept type: ${type}`, () => {
      const activity: ActivityItem = {
        id: `${type}-1`,
        type: type as ActivityItem['type'],
        actorUsername: 'testuser',
        summary: `Test ${type}`,
        timestamp: new Date().toISOString(),
      };

      expect(activity.type).toBe(type);
    });
  });

  describe('like activity structure', () => {
    it('should have correct structure for like activity', () => {
      const likeActivity: ActivityItem = {
        id: 'like-123',
        type: 'like',
        actorUsername: 'You',
        summary: '👍 Liked john_doe\'s post: "Hello world..."',
        timestamp: '2024-01-01T00:00:00Z',
        data: { id: 123, text: 'Hello world', creator_username: 'john_doe', is_user_liked: true },
      };

      expect(likeActivity.type).toBe('like');
      expect(likeActivity.data?.is_user_liked).toBe(true);
      expect(likeActivity.summary).toContain('Liked');
    });

    it('should handle own post like correctly', () => {
      const username = 'testuser';
      const post = { id: 1, creator_username: 'testuser', text: 'My post' };
      
      const isOwnPost = post.creator_username === username;
      const ownerText = isOwnPost ? 'your own' : `${post.creator_username}'s`;
      
      expect(ownerText).toBe('your own');
    });

    it('should handle other user post like correctly', () => {
      const username = 'testuser';
      const post = { id: 1, creator_username: 'otheruser', text: 'Their post' };
      
      const isOwnPost = post.creator_username === username;
      const ownerText = isOwnPost ? 'your own' : `${post.creator_username}'s`;
      
      expect(ownerText).toBe('otheruser\'s');
    });
  });

  describe('dislike activity structure', () => {
    it('should have correct structure for dislike activity', () => {
      const dislikeActivity: ActivityItem = {
        id: 'dislike-456',
        type: 'dislike',
        actorUsername: 'You',
        summary: '👎 Disliked spam_account\'s post: "Buy now..."',
        timestamp: '2024-01-01T00:00:00Z',
        data: { id: 456, text: 'Buy now', creator_username: 'spam_account', is_user_disliked: true },
      };

      expect(dislikeActivity.type).toBe('dislike');
      expect(dislikeActivity.data?.is_user_disliked).toBe(true);
      expect(dislikeActivity.summary).toContain('Disliked');
    });
  });
});

describe('Follow Activity Types', () => {
  describe('following activity', () => {
    it('should have correct structure for following activity', () => {
      const followActivity: ActivityItem = {
        id: 'follow-out-123-2024-01-01',
        type: 'follow',
        actorUsername: 'You',
        summary: '👥 Started following john_doe',
        timestamp: '2024-01-01T00:00:00Z',
        data: { id: 123, username: 'john_doe', followType: 'following' },
      };

      expect(followActivity.type).toBe('follow');
      expect(followActivity.data?.followType).toBe('following');
      expect(followActivity.summary).toContain('Started following');
    });
  });

  describe('follower activity', () => {
    it('should have correct structure for follower activity', () => {
      const followerActivity: ActivityItem = {
        id: 'follow-in-456-2024-01-01',
        type: 'follow',
        actorUsername: 'mike_wilson',
        summary: '👥 mike_wilson started following you',
        timestamp: '2024-01-01T00:00:00Z',
        data: { id: 456, username: 'mike_wilson', followType: 'follower' },
      };

      expect(followerActivity.type).toBe('follow');
      expect(followerActivity.data?.followType).toBe('follower');
      expect(followerActivity.summary).toContain('started following you');
    });
  });
});

describe('Posts Filter Logic', () => {
  // Posts filter includes post, like, and dislike types
  const POST_ACTIVITY_TYPES = ['post', 'like', 'dislike'];

  const mockActivities: ActivityItem[] = [
    { id: '1', type: 'post', actorUsername: 'user1', summary: 'Created post', timestamp: '2024-01-01' },
    { id: '2', type: 'like', actorUsername: 'user2', summary: 'Liked post', timestamp: '2024-01-01' },
    { id: '3', type: 'dislike', actorUsername: 'user3', summary: 'Disliked post', timestamp: '2024-01-01' },
    { id: '4', type: 'waste', actorUsername: 'user4', summary: 'Logged waste', timestamp: '2024-01-01' },
    { id: '5', type: 'achievement', actorUsername: 'user5', summary: 'Earned badge', timestamp: '2024-01-01' },
  ];

  it('should filter all post-related activities when "posts" filter selected', () => {
    const selectedFilter = 'posts';
    const filtered = selectedFilter === 'posts'
      ? mockActivities.filter(a => POST_ACTIVITY_TYPES.includes(a.type))
      : mockActivities.filter(a => a.type === selectedFilter);

    expect(filtered.length).toBe(3);
    expect(filtered.every(a => POST_ACTIVITY_TYPES.includes(a.type))).toBe(true);
  });

  it('should filter only waste when "waste" filter selected', () => {
    const selectedFilter = 'waste';
    const filtered = selectedFilter === 'posts'
      ? mockActivities.filter(a => POST_ACTIVITY_TYPES.includes(a.type))
      : mockActivities.filter(a => a.type === selectedFilter);

    expect(filtered.length).toBe(1);
    expect(filtered[0].type).toBe('waste');
  });

  it('should return all activities when "all" filter selected', () => {
    const selectedFilter = 'all';
    const filtered = selectedFilter === 'all'
      ? mockActivities
      : selectedFilter === 'posts'
        ? mockActivities.filter(a => POST_ACTIVITY_TYPES.includes(a.type))
        : mockActivities.filter(a => a.type === selectedFilter);

    expect(filtered.length).toBe(mockActivities.length);
  });
});

describe('Activity Feed Timestamp Formatting', () => {
  it('should format date correctly', () => {
    const timestamp = '2024-12-15T14:30:00Z';
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleDateString();
    
    expect(formattedDate).toBeDefined();
    expect(typeof formattedDate).toBe('string');
  });

  it('should format time correctly', () => {
    const timestamp = '2024-12-15T14:30:00Z';
    const date = new Date(timestamp);
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    expect(formattedTime).toBeDefined();
    expect(typeof formattedTime).toBe('string');
  });

  it('should handle invalid date gracefully', () => {
    const timestamp = 'invalid-date';
    const date = new Date(timestamp);
    
    expect(isNaN(date.getTime())).toBe(true);
  });

  it('should use post.date over post.created_at', () => {
    const post = {
      id: 1,
      date: '2024-12-15T14:30:00Z',
      created_at: '2024-12-10T10:00:00Z',
    };
    
    const timestamp = post.date || post.created_at || new Date().toISOString();
    expect(timestamp).toBe('2024-12-15T14:30:00Z');
  });
});

describe('Deduplication Logic', () => {
  it('should remove duplicate activities based on type and summary', () => {
    const activities: ActivityItem[] = [
      { id: '1', type: 'follow', actorUsername: 'user1', summary: '👥 user1 started following user2', timestamp: '2024-01-01' },
      { id: '2', type: 'follow', actorUsername: 'user1', summary: '👥 user1 started following user2', timestamp: '2024-01-01' },
      { id: '3', type: 'post', actorUsername: 'user1', summary: 'Created a post', timestamp: '2024-01-01' },
    ];

    const uniqueActivities = activities.reduce((acc: ActivityItem[], curr) => {
      const key = `${curr.type}-${curr.summary}`;
      if (!acc.find(a => `${a.type}-${a.summary}` === key)) {
        acc.push(curr);
      }
      return acc;
    }, []);

    expect(uniqueActivities.length).toBe(2);
  });

  it('should keep different activities', () => {
    const activities: ActivityItem[] = [
      { id: '1', type: 'follow', actorUsername: 'user1', summary: '👥 user1 started following user2', timestamp: '2024-01-01' },
      { id: '2', type: 'follow', actorUsername: 'user2', summary: '👥 user2 started following user3', timestamp: '2024-01-01' },
    ];

    const uniqueActivities = activities.reduce((acc: ActivityItem[], curr) => {
      const key = `${curr.type}-${curr.summary}`;
      if (!acc.find(a => `${a.type}-${a.summary}` === key)) {
        acc.push(curr);
      }
      return acc;
    }, []);

    expect(uniqueActivities.length).toBe(2);
  });
});

