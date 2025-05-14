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
        self.assertEqual(response.data['message'], 'Tips retrieved successfully')
        self.assertEqual(len(response.data['data']), self.initial_tip_count)
        # Tips should be ordered by most recent (highest id) first
        self.assertEqual(response.data['data'][0]['title'], "Test Tip 4")
        self.assertEqual(response.data['data'][1]['title'], "Test Tip 3")
        
        # Check for the new fields
        self.assertIn('is_user_liked', response.data['data'][0])
        self.assertIn('is_user_disliked', response.data['data'][0])
        # By default, user hasn't liked/disliked any tips
        self.assertFalse(response.data['data'][0]['is_user_liked'])
        self.assertFalse(response.data['data'][0]['is_user_disliked'])

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
        self.assertEqual(Tips.objects.count(), self.initial_tip_count)  # No new tip should be created

    def test_like_tip_authenticated(self):
        """Test liking a tip when authenticated"""
        self.client.force_authenticate(user=self.user)
        url = reverse('like_tip', args=[self.tips[0].id])
        initial_likes = self.tips[0].like_count

        response = self.client.post(url)
        self.tips[0].refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Tip liked successfully')
        self.assertEqual(self.tips[0].like_count, initial_likes + 1)


    def test_dislike_tip_authenticated(self):
        """Test disliking a tip when authenticated"""
        self.client.force_authenticate(user=self.user)
        url = reverse('dislike_tip', args=[self.tips[0].id])
        initial_dislikes = self.tips[0].dislike_count

        response = self.client.post(url)
        self.tips[0].refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Tip disliked successfully')
        self.assertEqual(self.tips[0].dislike_count, initial_dislikes + 1)

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