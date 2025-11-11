"""
Tests for follow/unfollow functionality
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import Follow

User = get_user_model()


class FollowUnfollowTestCase(TestCase):
    """Test cases for follow and unfollow functionality"""
    
    def setUp(self):
        """Set up test client and create test users"""
        self.client = APIClient()
        
        # Create test users
        self.user1 = User.objects.create_user(
            email='user1@test.com',
            username='user1',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            email='user2@test.com',
            username='user2',
            password='testpass123'
        )
        self.user3 = User.objects.create_user(
            email='user3@test.com',
            username='user3',
            password='testpass123'
        )
        
    def test_follow_user_success(self):
        """Test successfully following a user"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(f'/api/profile/{self.user2.username}/follow/')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['data']['is_following'])
        self.assertTrue(
            Follow.objects.filter(
                follower=self.user1,
                following=self.user2
            ).exists()
        )
        
    def test_follow_self_fails(self):
        """Test that users cannot follow themselves"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(f'/api/profile/{self.user1.username}/follow/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cannot follow yourself', response.data['error'].lower())
        
    def test_follow_nonexistent_user_fails(self):
        """Test following a user that doesn't exist"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.post('/api/profile/nonexistent/follow/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_follow_already_following_fails(self):
        """Test that following a user twice fails"""
        self.client.force_authenticate(user=self.user1)
        
        # First follow should succeed
        response1 = self.client.post(f'/api/profile/{self.user2.username}/follow/')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Second follow should fail
        response2 = self.client.post(f'/api/profile/{self.user2.username}/follow/')
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already following', response2.data['error'].lower())
        
    def test_unfollow_user_success(self):
        """Test successfully unfollowing a user"""
        # First create a follow relationship
        Follow.objects.create(follower=self.user1, following=self.user2)
        
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(f'/api/profile/{self.user2.username}/unfollow/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['data']['is_following'])
        self.assertFalse(
            Follow.objects.filter(
                follower=self.user1,
                following=self.user2
            ).exists()
        )
        
    def test_unfollow_not_following_fails(self):
        """Test unfollowing a user you're not following"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(f'/api/profile/{self.user2.username}/unfollow/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('not following', response.data['error'].lower())
        
    def test_get_followers_list(self):
        """Test getting a user's followers list"""
        # Create some follow relationships
        Follow.objects.create(follower=self.user1, following=self.user2)
        Follow.objects.create(follower=self.user3, following=self.user2)
        
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/profile/{self.user2.username}/followers/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['followers_count'], 2)
        self.assertEqual(len(response.data['data']['followers']), 2)
        
        # Check that follower usernames are in the response
        follower_usernames = [f['username'] for f in response.data['data']['followers']]
        self.assertIn('user1', follower_usernames)
        self.assertIn('user3', follower_usernames)
        
    def test_get_following_list(self):
        """Test getting a user's following list"""
        # user1 follows user2 and user3
        Follow.objects.create(follower=self.user1, following=self.user2)
        Follow.objects.create(follower=self.user1, following=self.user3)
        
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/profile/{self.user1.username}/following/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['following_count'], 2)
        self.assertEqual(len(response.data['data']['following']), 2)
        
        # Check that following usernames are in the response
        following_usernames = [f['username'] for f in response.data['data']['following']]
        self.assertIn('user2', following_usernames)
        self.assertIn('user3', following_usernames)
        
    def test_check_follow_status(self):
        """Test checking follow status between users"""
        # user1 follows user2, user2 follows user1 back
        Follow.objects.create(follower=self.user1, following=self.user2)
        Follow.objects.create(follower=self.user2, following=self.user1)
        
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/profile/{self.user2.username}/follow-status/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['data']['is_following'])
        self.assertTrue(response.data['data']['follows_back'])
        self.assertEqual(response.data['data']['followers_count'], 1)
        self.assertEqual(response.data['data']['following_count'], 1)
        
    def test_get_follow_stats(self):
        """Test getting follow statistics for authenticated user"""
        # user1 follows user2 and user3
        Follow.objects.create(follower=self.user1, following=self.user2)
        Follow.objects.create(follower=self.user1, following=self.user3)
        # user2 follows user1
        Follow.objects.create(follower=self.user2, following=self.user1)
        
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/profile/follow-stats/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['followers_count'], 1)  # user2 follows user1
        self.assertEqual(response.data['data']['following_count'], 2)  # user1 follows user2 and user3
        
    def test_authentication_required(self):
        """Test that authentication is required for all endpoints"""
        endpoints = [
            ('post', f'/api/profile/{self.user2.username}/follow/'),
            ('post', f'/api/profile/{self.user2.username}/unfollow/'),
            ('get', f'/api/profile/{self.user2.username}/followers/'),
            ('get', f'/api/profile/{self.user2.username}/following/'),
            ('get', f'/api/profile/{self.user2.username}/follow-status/'),
            ('get', '/api/profile/follow-stats/'),
        ]
        
        for method, endpoint in endpoints:
            if method == 'post':
                response = self.client.post(endpoint)
            else:
                response = self.client.get(endpoint)
            
            self.assertEqual(
                response.status_code, 
                status.HTTP_403_FORBIDDEN,
                f"Endpoint {endpoint} should require authentication"
            )
