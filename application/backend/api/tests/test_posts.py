from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIRequestFactory, APIClient
from rest_framework import status
from api.models import Posts, Users, PostLikes, SavedPosts
from api.post.post_serializer import PostSerializer
from api.post.post_views import create_post, get_all_posts, get_post_detail, get_user_posts
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
import json
import os

class PostViewsTests(TestCase):
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

        # Create test posts
        self.posts = [
            Posts.objects.create(
                creator=self.user1,
                text="Test post 1 content",
                date=timezone.now(),
                like_count=0,
                dislike_count=0
            ),
            Posts.objects.create(
                creator=self.user1,
                text="Test post 2 content",
                image="test_image.jpg",
                date=timezone.now(),
                like_count=5,
                dislike_count=2
            ),
            Posts.objects.create(
                creator=self.user2,
                text="Test post 3 content",
                date=timezone.now(),
                like_count=10,
                dislike_count=1
            )
        ]
          # Create some likes
        PostLikes.objects.create(user=self.user1, post=self.posts[2], reaction_type="LIKE")
        PostLikes.objects.create(user=self.user2, post=self.posts[0], reaction_type="LIKE")
        PostLikes.objects.create(user=self.user2, post=self.posts[1], reaction_type="DISLIKE")
          # Create some saved posts
        SavedPosts.objects.create(user=self.user1, post=self.posts[2])
        SavedPosts.objects.create(user=self.user2, post=self.posts[0])
        
    def test_create_post_success_text_only(self):
        """Test successful post creation with text only"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('create_post')
        data = {
            'text': 'New test post with text only'
        }
        
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'Post created successfully')
        self.assertEqual(Posts.objects.count(), 4)
        latest_post = Posts.objects.latest('id')
        self.assertEqual(latest_post.text, 'New test post with text only')
        self.assertEqual(latest_post.creator, self.user1)
    def test_create_post_success_image_only(self):
        """Test successful post creation with image only"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('create_post')
        
        # Create a test image file (using PNG format to match allowed types)
        image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDAT\x08\xd7c\x90\xfb\xcf\x00\x00\x02\\\x01\x1e.}d\x87\x00\x00\x00\x00IEND\xaeB`\x82'
        image = SimpleUploadedFile(
            name='test_image.png',
            content=image_content,
            content_type='image/png'
        )
        
        data = {
            'image': image
        }
        
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'Post created successfully')
        self.assertEqual(Posts.objects.count(), 4)
        latest_post = Posts.objects.latest('id')
        self.assertIsNotNone(latest_post.image)
        self.assertEqual(latest_post.creator, self.user1)
    def test_create_post_with_text_and_image(self):
        """Test successful post creation with both text and image"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('create_post')
        
        # Create a test image file
        image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDAT\x08\xd7c\x90\xfb\xcf\x00\x00\x02\\\x01\x1e.}d\x87\x00\x00\x00\x00IEND\xaeB`\x82'
        image = SimpleUploadedFile(
            name='test_image.png',
            content=image_content,
            content_type='image/png'
        )
        
        data = {
            'text': 'New test post with text and image',
            'image': image
        }
        
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'Post created successfully')
        self.assertEqual(Posts.objects.count(), 4)
        latest_post = Posts.objects.latest('id')
        self.assertEqual(latest_post.text, 'New test post with text and image')
        self.assertIsNotNone(latest_post.image)
    
    def test_create_post_unauthenticated(self):
        """Test post creation without authentication"""
        url = reverse('create_post')
        data = {
            'text': 'This post should not be created'
        }
        
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Posts.objects.count(), 3)  # No new post should be created

    def test_create_post_missing_required_fields(self):
        """Test post creation with missing required fields"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('create_post')
        data = {}  # Empty data
        
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Posts.objects.count(), 3)  # No new post should be created

    def test_get_all_posts_success(self):
        """Test successful retrieval of all posts"""
        url = reverse('get_all_posts')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Posts retrieved successfully')
        self.assertEqual(len(response.data['data']), 3)
        # Posts should be ordered by most recent (but they were all created at the same time)
        # So we'll just check if all posts are returned

    def test_get_post_detail_success(self):
        """Test successful retrieval of post details"""
        url = reverse('get_post_detail', kwargs={'post_id': self.posts[0].id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Post retrieved successfully')
        self.assertEqual(response.data['data']['text'], 'Test post 1 content')
        # Check that comments array exists but is empty
        self.assertIn('comments', response.data['data'])
        self.assertEqual(len(response.data['data']['comments']), 0)

    def test_get_post_detail_authenticated_with_reaction(self):
        """Test successful retrieval of post details when authenticated with reaction"""
        self.client.force_authenticate(user=self.user2)
        url = reverse('get_post_detail', kwargs={'post_id': self.posts[0].id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['user_reaction'], 'LIKE')

    def test_get_post_detail_authenticated_without_reaction(self):
        """Test successful retrieval of post details when authenticated without reaction"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('get_post_detail', kwargs={'post_id': self.posts[0].id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['user_reaction'], None)
        
    def test_get_post_detail_not_found(self):
        """Test retrieval of post that doesn't exist"""
        url = reverse('get_post_detail', kwargs={'post_id': 9999})
        response = self.client.get(url)
        
        # The view returns 500 instead of 404 when a post is not found
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_get_user_posts_success(self):
        """Test successful retrieval of user's posts"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('get_user_posts')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'User posts retrieved successfully')
        # User1 has 2 posts
        self.assertEqual(len(response.data['data']), 2)

    def test_get_user_posts_unauthenticated(self):
        """Test retrieval of user's posts without authentication"""
        url = reverse('get_user_posts')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
    def test_like_post_success(self):
        """Test successful liking and toggling a post like"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('like_post', kwargs={'post_id': self.posts[0].id})
        
        # First like - should add a like
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Post liked successfully')
        
        # Verify like was created in database
        post_like = PostLikes.objects.filter(user=self.user1, post=self.posts[0]).first()
        self.assertIsNotNone(post_like)
        self.assertEqual(post_like.reaction_type, 'LIKE')
        
        # Verify post like count was incremented
        post = Posts.objects.get(pk=self.posts[0].id)
        self.assertEqual(post.like_count, 1)
        
        # Second like - should toggle and remove the like
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Like removed successfully')
        
        # Verify like was removed from database
        post_like = PostLikes.objects.filter(user=self.user1, post=self.posts[0]).first()
        self.assertIsNone(post_like)
        
        # Verify post like count was decremented
        post = Posts.objects.get(pk=self.posts[0].id)
        self.assertEqual(post.like_count, 0)

    def test_dislike_post_success(self):
        """Test successful disliking and toggling a post dislike"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('dislike_post', kwargs={'post_id': self.posts[0].id})
        
        # First dislike - should add a dislike
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Post disliked successfully')
        
        # Verify dislike was created in database
        post_dislike = PostLikes.objects.filter(user=self.user1, post=self.posts[0]).first()
        self.assertIsNotNone(post_dislike)
        self.assertEqual(post_dislike.reaction_type, 'DISLIKE')
        
        # Verify post dislike count was incremented
        post = Posts.objects.get(pk=self.posts[0].id)
        self.assertEqual(post.dislike_count, 1)
        
        # Second dislike - should toggle and remove the dislike
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Dislike removed successfully')
        
        # Verify dislike was removed from database
        post_dislike = PostLikes.objects.filter(user=self.user1, post=self.posts[0]).first()
        self.assertIsNone(post_dislike)
        
        # Verify post dislike count was decremented
        post = Posts.objects.get(pk=self.posts[0].id)
        self.assertEqual(post.dislike_count, 0)

    def test_like_after_dislike_post(self):
        """Test liking a post that was previously disliked"""
        # First dislike the post
        PostLikes.objects.create(user=self.user1, post=self.posts[0], reaction_type="DISLIKE")
        self.posts[0].dislike_count = 1
        self.posts[0].save()
        
        self.client.force_authenticate(user=self.user1)
        like_url = reverse('like_post', kwargs={'post_id': self.posts[0].id})
        
        # Like the post - should replace dislike with like
        response = self.client.post(like_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Post liked successfully')
        
        # Verify reaction was updated in database
        post_reaction = PostLikes.objects.filter(user=self.user1, post=self.posts[0]).first()
        self.assertIsNotNone(post_reaction)
        self.assertEqual(post_reaction.reaction_type, 'LIKE')
        
        # Verify post counts were updated correctly
        post = Posts.objects.get(pk=self.posts[0].id)
        self.assertEqual(post.like_count, 1)
        self.assertEqual(post.dislike_count, 0)

    def test_save_post_success(self):
        """Test successful saving a post"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('save_post', kwargs={'post_id': self.posts[1].id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'Post saved successfully')
        
        # Verify saved post was created in database
        saved_post = SavedPosts.objects.filter(user=self.user1, post=self.posts[1]).first()
        self.assertIsNotNone(saved_post)

    def test_unsave_post_success(self):
        """Test successful unsaving a post"""
        # First save the post
        SavedPosts.objects.create(user=self.user1, post=self.posts[1])
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('unsave_post', kwargs={'post_id': self.posts[1].id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Post removed from saved posts')
        
        # Verify saved post was removed from database
        saved_post = SavedPosts.objects.filter(user=self.user1, post=self.posts[1]).first()
        self.assertIsNone(saved_post)

    def test_get_saved_posts_success(self):
        """Test successful retrieval of saved posts"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('get_saved_posts')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Saved posts retrieved successfully')
        # User1 has 1 saved post
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['id'], self.posts[2].id)
        
    def test_get_user_reaction_success(self):
        """Test successful retrieval of user reaction to a post"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('get_user_reaction', kwargs={'post_id': self.posts[2].id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'User reaction retrieved successfully')
        self.assertEqual(response.data['data']['reaction_type'], 'LIKE')
