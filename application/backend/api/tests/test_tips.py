from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIRequestFactory, APIClient
from rest_framework import status
from api.models import Tips, Users
from api.tip.tip_serializer import TipSerializer
from api.tip.tip_views import get_recent_tips, get_all_tips, create_tip

class TipViewsTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.client = APIClient()
        
        # Create a test user
        self.user = Users.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )

        # Create some test tips
        self.tips = [
            Tips.objects.create(title="Test Tip 1", text="Test tip description 1", like_count=0, dislike_count=0),
            Tips.objects.create(title="Test Tip 2", text="Test tip description 2", like_count=5, dislike_count=2),
            Tips.objects.create(title="Test Tip 3", text="Test tip description 3", like_count=10, dislike_count=1),
            Tips.objects.create(title="Test Tip 4", text="Test tip description 4", like_count=3, dislike_count=0)
        ]
        
        # Store the initial count for later assertions
        self.initial_tip_count = Tips.objects.count()
        
    def test_get_all_tips_success(self):
        """Test successful retrieval of all tips"""
        # Authenticate user for the request to include reaction data
        self.client.force_authenticate(user=self.user)
        request = self.factory.get('/api/tips/all/')
        request.user = self.user  # Manually set user for factory request
        
        response = get_all_tips(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), self.initial_tip_count)
        # Tips should be ordered by most recent (highest id) first
        self.assertEqual(response.data['results'][0]['title'], "Test Tip 4")
        self.assertEqual(response.data['results'][1]['title'], "Test Tip 3")
        
        # Check for the new fields
        self.assertIn('is_user_liked', response.data['results'][0])
        self.assertIn('is_user_disliked', response.data['results'][0])
        # By default, user hasn't liked/disliked any tips
        self.assertFalse(response.data['results'][0]['is_user_liked'])
        self.assertFalse(response.data['results'][0]['is_user_disliked'])

    def test_get_recent_tips_success(self):
        """Test successful retrieval of recent tips"""
        request = self.factory.get('/api/tips/')
        response = get_recent_tips(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Recent tips retrieved successfully')
        # Should return up to 3 tips, or fewer if we have less than 3 tips total
        expected_count = min(3, self.initial_tip_count)
        self.assertEqual(len(response.data['data']), expected_count)
        
        # If we have tips, check the order
        if self.initial_tip_count > 0:
            # Tips should be ordered by most recent (highest id) first
            self.assertEqual(response.data['data'][0]['title'], "Test Tip 4")
            
        if self.initial_tip_count > 1:
            self.assertEqual(response.data['data'][1]['title'], "Test Tip 3")
            
        if self.initial_tip_count > 2:
            self.assertEqual(response.data['data'][2]['title'], "Test Tip 2")

    def test_get_recent_tips_empty_db(self):
        """Test getting tips when database is empty"""
        # Delete all tips
        Tips.objects.all().delete()
        
        request = self.factory.get('/api/tips/')
        response = get_recent_tips(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 0)

    def test_create_tip_success(self):
        """Test successful tip creation"""
        self.client.force_authenticate(user=self.user)
        url = reverse('create_tip')
        data = {
            'title': 'New Test Tip',
            'description': 'New test tip description'
        }

        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'Tip created successfully')
        self.assertEqual(Tips.objects.count(), self.initial_tip_count + 1)
        latest_tip = Tips.objects.latest('id')
        self.assertEqual(latest_tip.title, 'New Test Tip')
        self.assertEqual(latest_tip.text, 'New test tip description')

    def test_create_tip_unauthenticated(self):
        """Test tip creation without authentication"""
        url = reverse('create_tip')
        data = {
            'title': 'New Test Tip',
            'description': 'New test tip description'
        }

        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Tips.objects.count(), self.initial_tip_count)  # No new tip should be created

    def test_create_tip_missing_fields(self):
        """Test tip creation with missing required fields"""
        self.client.force_authenticate(user=self.user)
        url = reverse('create_tip')
        data = {
            'title': 'New Test Tip'
            # Missing description
        }

        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Tips.objects.count(), self.initial_tip_count)  # No new tip should be created

    def test_create_tip_empty_fields(self):
        """Test tip creation with empty fields"""
        self.client.force_authenticate(user=self.user)
        url = reverse('create_tip')
        data = {
            'title': '',
            'description': ''
        }

        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Tips.objects.count(), self.initial_tip_count)  # No new tip should be created    def test_like_tip_authenticated(self):
        """Test liking a tip when authenticated"""
        self.client.force_authenticate(user=self.user)
        url = reverse('like_tip', args=[self.tips[0].id])
        initial_likes = self.tips[0].like_count

        # First like - should add a like
        response = self.client.post(url)
        self.tips[0].refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Tip liked successfully')
        self.assertEqual(self.tips[0].like_count, initial_likes + 1)
        
        # Second like - should toggle/remove the like
        response = self.client.post(url)
        self.tips[0].refresh_from_db()
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Like removed successfully')
        self.assertEqual(self.tips[0].like_count, initial_likes)


    def test_dislike_tip_authenticated(self):
        """Test disliking a tip when authenticated"""
        self.client.force_authenticate(user=self.user)
        url = reverse('dislike_tip', args=[self.tips[0].id])
        initial_dislikes = self.tips[0].dislike_count

        # First dislike - should add a dislike
        response = self.client.post(url)
        self.tips[0].refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Tip disliked successfully')
        self.assertEqual(self.tips[0].dislike_count, initial_dislikes + 1)
        
        # Second dislike - should toggle/remove the dislike
        response = self.client.post(url)
        self.tips[0].refresh_from_db()
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Dislike removed successfully')
        self.assertEqual(self.tips[0].dislike_count, initial_dislikes)

    def test_like_tip_unauthenticated(self):
        """Test liking a tip when not authenticated"""
        url = reverse('like_tip', args=[self.tips[0].id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_dislike_tip_unauthenticated(self):
        """Test disliking a tip when not authenticated"""
        url = reverse('dislike_tip', args=[self.tips[0].id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_tip_empty_title(self):
        """Test tip creation with empty title"""
        self.client.force_authenticate(user=self.user)
        url = reverse('create_tip')
        data = {
            'title': '',
            'description': 'Valid description'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_tip_very_long_title(self):
        """Test tip creation with very long title"""
        self.client.force_authenticate(user=self.user)
        url = reverse('create_tip')
        data = {
            'title': 'A' * 500,  # Very long title
            'description': 'Valid description'
        }
        response = self.client.post(url, data, format='json')
        # Should either succeed or fail based on validation
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_create_tip_special_characters(self):
        """Test tip creation with special characters"""
        self.client.force_authenticate(user=self.user)
        url = reverse('create_tip')
        data = {
            'title': 'Special: !@#$%^&*()',
            'description': 'Description with special chars: <>?[]{}'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_tip_unicode_characters(self):
        """Test tip creation with unicode characters"""
        self.client.force_authenticate(user=self.user)
        url = reverse('create_tip')
        data = {
            'title': 'Unicode: 你好世界 🌍',
            'description': 'Description with émojis 🎉'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_like_then_dislike_tip(self):
        """Test liking a tip then disliking it should replace like with dislike"""
        self.client.force_authenticate(user=self.user)
        tip = self.tips[0]
        initial_likes = tip.like_count
        initial_dislikes = tip.dislike_count
        
        # First like
        like_url = reverse('like_tip', args=[tip.id])
        response = self.client.post(like_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tip.refresh_from_db()
        self.assertEqual(tip.like_count, initial_likes + 1)
        
        # Then dislike - should remove like and add dislike
        dislike_url = reverse('dislike_tip', args=[tip.id])
        response = self.client.post(dislike_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tip.refresh_from_db()
        self.assertEqual(tip.like_count, initial_likes)
        self.assertEqual(tip.dislike_count, initial_dislikes + 1)

    def test_dislike_then_like_tip(self):
        """Test disliking a tip then liking it should replace dislike with like"""
        self.client.force_authenticate(user=self.user)
        tip = self.tips[0]
        initial_likes = tip.like_count
        initial_dislikes = tip.dislike_count
        
        # First dislike
        dislike_url = reverse('dislike_tip', args=[tip.id])
        response = self.client.post(dislike_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tip.refresh_from_db()
        self.assertEqual(tip.dislike_count, initial_dislikes + 1)
        
        # Then like - should remove dislike and add like
        like_url = reverse('like_tip', args=[tip.id])
        response = self.client.post(like_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tip.refresh_from_db()
        self.assertEqual(tip.like_count, initial_likes + 1)
        self.assertEqual(tip.dislike_count, initial_dislikes)

    def test_like_tip_not_found(self):
        """Test liking a non-existent tip"""
        self.client.force_authenticate(user=self.user)
        url = reverse('like_tip', args=[99999])
        response = self.client.post(url)
        # Should return error
        self.assertIn(response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_500_INTERNAL_SERVER_ERROR])

    def test_get_all_tips_includes_reaction_data(self):
        """Test that get_all_tips includes user reaction data when authenticated"""
        self.client.force_authenticate(user=self.user)
        request = self.factory.get('/api/tips/all/')
        request.user = self.user
        
        response = get_all_tips(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # All tips should have reaction fields
        for tip_data in response.data['results']:
            self.assertIn('is_user_liked', tip_data)
            self.assertIn('is_user_disliked', tip_data)

    def test_get_recent_tips_limit(self):
        """Test that get_recent_tips returns at most 3 tips"""
        # Create 5 tips
        for i in range(5):
            Tips.objects.create(
                title=f"Tip {i}",
                text=f"Description {i}",
                like_count=0,
                dislike_count=0
            )
        
        request = self.factory.get('/api/tips/')
        response = get_recent_tips(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(response.data['data']), 3)