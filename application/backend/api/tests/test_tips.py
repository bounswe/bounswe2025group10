from django.test import TestCase
from rest_framework.test import APIRequestFactory
from rest_framework import status
from api.models import Tips
from api.tip.tip_views import get_recent_tips

class TipViewsTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        # Create some test tips
        self.tips = [
            Tips.objects.create( text="Test tip 1", like_count=0, dislike_count=0),
            Tips.objects.create( text="Test tip 2", like_count=5, dislike_count=2),
            Tips.objects.create( text="Test tip 3", like_count=10, dislike_count=1),
            Tips.objects.create( text="Test tip 4", like_count=3, dislike_count=0)
        ]

    def test_get_recent_tips_success(self):
        """Test successful retrieval of recent tips"""
        request = self.factory.get('/api/tips/')
        response = get_recent_tips(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Recent tips retrieved successfully')
        # Should return exactly 3 tips
        self.assertEqual(len(response.data['data']), 3)
        # Tips should be ordered by most recent (highest id) first
        self.assertEqual(response.data['data'][0]['text'], "Test tip 4")
        self.assertEqual(response.data['data'][1]['text'], "Test tip 3")
        self.assertEqual(response.data['data'][2]['text'], "Test tip 2")

    def test_get_recent_tips_empty_db(self):
        """Test getting tips when database is empty"""
        # Delete all tips
        Tips.objects.all().delete()
        
        request = self.factory.get('/api/tips/')
        response = get_recent_tips(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 0)