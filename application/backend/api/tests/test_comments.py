from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIRequestFactory, APIClient
from rest_framework import status
from api.models import Posts, Users, Comments
from api.comment.comment_serializer import CommentSerializer
from api.comment.comment_views import create_comment, get_post_comments
from django.utils import timezone

class CommentViewsTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.client = APIClient()
        
        # Create test users
        self.user1 = Users.objects.create_user(
            email='testuser1@example.com',
            username='testuser1',
            password='testpass123'
        )
        
        self.user2 = Users.objects.create_user(
            email='testuser2@example.com',
            username='testuser2',
            password='testpass123'
        )

        # Create test post
        self.post = Posts.objects.create(
            creator=self.user1,
            text="Test post content",
            date=timezone.now(),
            like_count=0,
            dislike_count=0
        )
        
        # Create test comments
        self.comments = [
            Comments.objects.create(
                post=self.post,
                author=self.user1,
                content="First test comment",
                date=timezone.now()
            ),
            Comments.objects.create(
                post=self.post,
                author=self.user2,
                content="Second test comment",
                date=timezone.now()
            )
        ]

    def test_create_comment_success(self):
        """Test successful comment creation"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('create_comment', kwargs={'post_id': self.post.id})
        data = {
            'content': 'New test comment'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'Comment created successfully')
        self.assertEqual(Comments.objects.count(), 3)
        latest_comment = Comments.objects.latest('id')
        self.assertEqual(latest_comment.content, 'New test comment')
        self.assertEqual(latest_comment.author, self.user1)
        self.assertEqual(latest_comment.post, self.post)

    def test_create_comment_unauthenticated(self):
        """Test comment creation without authentication"""
        url = reverse('create_comment', kwargs={'post_id': self.post.id})
        data = {
            'content': 'This comment should not be created'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Comments.objects.count(), 2)  # No new comment should be created

    def test_create_comment_missing_content(self):
        """Test comment creation with missing content"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('create_comment', kwargs={'post_id': self.post.id})
        data = {}  # Empty data
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Comments.objects.count(), 2)  # No new comment should be created

    def test_create_comment_post_not_found(self):
        """Test comment creation for a non-existent post"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('create_comment', kwargs={'post_id': 9999})
        data = {
            'content': 'This comment should not be created'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(Comments.objects.count(), 2)  # No new comment should be created

    def test_get_post_comments_success(self):
        """Test successful retrieval of post comments"""
        url = reverse('get_post_comments', kwargs={'post_id': self.post.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Comments retrieved successfully')
        self.assertEqual(len(response.data['data']), 2)
        
        # Check if comments are in correct order (oldest first)
        self.assertEqual(response.data['data'][0]['content'], 'First test comment')
        self.assertEqual(response.data['data'][1]['content'], 'Second test comment')

    def test_get_post_comments_not_found(self):
        """Test retrieval of comments for a non-existent post"""
        url = reverse('get_post_comments', kwargs={'post_id': 9999})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_get_post_comments_empty(self):
        """Test retrieval of comments for a post with no comments"""
        # Create a new post with no comments
        new_post = Posts.objects.create(
            creator=self.user1,
            text="Post with no comments",
            date=timezone.now(),
            like_count=0,
            dislike_count=0
        )
        
        url = reverse('get_post_comments', kwargs={'post_id': new_post.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Comments retrieved successfully')
        self.assertEqual(len(response.data['data']), 0)  # No comments should be returned

    def test_create_comment_empty_content(self):
        """Test comment creation with empty content"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('create_comment', kwargs={'post_id': self.post.id})
        data = {'content': ''}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_comment_very_long_content(self):
        """Test comment creation with very long content"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('create_comment', kwargs={'post_id': self.post.id})
        data = {'content': 'A' * 10000}  # Very long content
        
        response = self.client.post(url, data, format='json')
        # Should either succeed or fail based on validation
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_create_comment_special_characters(self):
        """Test comment creation with special characters"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('create_comment', kwargs={'post_id': self.post.id})
        data = {'content': 'Special: !@#$%^&*()_+-=[]{}|;:,.<>?'}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        latest_comment = Comments.objects.latest('id')
        self.assertEqual(latest_comment.content, data['content'])

    def test_create_comment_unicode_characters(self):
        """Test comment creation with unicode characters"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('create_comment', kwargs={'post_id': self.post.id})
        data = {'content': 'Unicode: 你好世界 🌍 🎉 émojis'}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        latest_comment = Comments.objects.latest('id')
        self.assertEqual(latest_comment.content, data['content'])

    def test_get_post_comments_ordering(self):
        """Test that comments are returned in correct order (oldest first)"""
        # Create additional comments with explicit timestamps
        from django.utils import timezone
        import time
        
        comment1 = Comments.objects.create(
            post=self.post,
            author=self.user1,
            content="First comment",
            date=timezone.now()
        )
        time.sleep(0.01)  # Small delay to ensure different timestamps
        
        comment2 = Comments.objects.create(
            post=self.post,
            author=self.user2,
            content="Second comment",
            date=timezone.now()
        )
        
        url = reverse('get_post_comments', kwargs={'post_id': self.post.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should have all comments (2 existing + 2 new = 4 total)
        self.assertGreaterEqual(len(response.data['data']), 4)
        
        # First comment should be the oldest
        self.assertEqual(response.data['data'][0]['content'], 'First test comment')

    def test_create_comment_whitespace_only(self):
        """Test comment creation with whitespace-only content"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('create_comment', kwargs={'post_id': self.post.id})
        data = {'content': '   \n\t   '}  # Only whitespace
        
        response = self.client.post(url, data, format='json')
        # Should fail validation
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_multiple_comments_same_post(self):
        """Test creating multiple comments on the same post"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('create_comment', kwargs={'post_id': self.post.id})
        
        initial_count = Comments.objects.filter(post=self.post).count()
        
        # Create 3 comments
        for i in range(3):
            data = {'content': f'Comment {i+1}'}
            response = self.client.post(url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify all comments were created
        final_count = Comments.objects.filter(post=self.post).count()
        self.assertEqual(final_count, initial_count + 3)
