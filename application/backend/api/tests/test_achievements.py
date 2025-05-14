from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate, APIClient
from rest_framework import status
from api.models import Users, Achievements, UserAchievements
from api.achievement.achievement_views import get_user_achievements
from django.utils import timezone
from django.urls import reverse
from unittest.mock import patch, MagicMock
import json

class AchievementViewsTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.client = APIClient()
        
        # Create test users
        self.user1 = Users.objects.create_user(
            username="testuser1",
            email="test1@example.com",
            password="testpass123"
        )
        
        self.user2 = Users.objects.create_user(
            username="testuser2",
            email="test2@example.com",
            password="testpass123"
        )
        
        # Create test achievements
        self.achievement1 = Achievements.objects.create(
            title="Recycling Champion",
            description="Recycled over 10kg of waste",
            icon="recycling_icon.png"
        )
        
        self.achievement2 = Achievements.objects.create(
            title="Earth Saver",
            description="Completed first challenge",
            icon="earth_icon.png"
        )
        
        self.achievement3 = Achievements.objects.create(
            title="Paper Saver",
            description="Recycled over 5kg of paper",
            icon="paper_icon.png"
        )
        
        # Assign achievements to users
        UserAchievements.objects.create(
            user=self.user1,
            achievement=self.achievement1,
            earned_at=timezone.now()
        )
        
        UserAchievements.objects.create(
            user=self.user1,
            achievement=self.achievement2,
            earned_at=timezone.now()
        )
        
        UserAchievements.objects.create(
            user=self.user2,
            achievement=self.achievement3,
            earned_at=timezone.now()
        )

    def test_get_current_user_achievements(self):
        """Test retrieving the authenticated user's achievements"""
        url = reverse('get_user_achievements')
        request = self.factory.get(url)
        force_authenticate(request, user=self.user1)
        response = get_user_achievements(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'User achievements retrieved successfully')
        self.assertEqual(response.data['data']['username'], self.user1.username)
        self.assertEqual(len(response.data['data']['achievements']), 2)
        
        # Verify achievement details
        achievements = response.data['data']['achievements']
        achievement_titles = [a['achievement']['title'] for a in achievements]
        self.assertIn('Recycling Champion', achievement_titles)
        self.assertIn('Earth Saver', achievement_titles)

    def test_get_specific_user_achievements(self):
        """Test retrieving a specific user's achievements by username"""
        url = reverse('get_user_achievements_by_username', kwargs={'username': self.user2.username})
        request = self.factory.get(url)
        force_authenticate(request, user=self.user1)
        response = get_user_achievements(request, username=self.user2.username)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'User achievements retrieved successfully')
        self.assertEqual(response.data['data']['username'], self.user2.username)
        self.assertEqual(len(response.data['data']['achievements']), 1)
        
        # Verify achievement details
        achievement = response.data['data']['achievements'][0]['achievement']
        self.assertEqual(achievement['title'], 'Paper Saver')
        self.assertEqual(achievement['description'], 'Recycled over 5kg of paper')
    def test_get_user_achievements_unauthenticated(self):
        """Test retrieving achievements without authentication should fail"""
        url = reverse('get_user_achievements')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
    def test_get_nonexistent_user_achievements(self):
        """Test retrieving achievements for a user that doesn't exist"""
        url = reverse('get_user_achievements_by_username', kwargs={'username': 'nonexistentuser'})
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_user_with_no_achievements(self):
        """Test retrieving achievements for a user with no achievements"""
        # Create a user with no achievements
        user_no_achievements = Users.objects.create_user(
            username="nouserach",
            email="noach@example.com",
            password="testpass123"
        )
        
        url = reverse('get_user_achievements_by_username', kwargs={'username': user_no_achievements.username})
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'User achievements retrieved successfully')
        self.assertEqual(len(response.data['data']['achievements']), 0)

    def test_achievements_ordering(self):
        """Test that achievements are returned in reverse chronological order"""
        # Add a new achievement with a specific timestamp
        older_time = timezone.now() - timezone.timedelta(days=10)
        newer_time = timezone.now()
        
        # Create another achievement
        achievement4 = Achievements.objects.create(
            title="Water Saver",
            description="Saved water",
            icon="water_icon.png"
        )
        
        # Add achievements with specific timestamps
        UserAchievements.objects.create(
            user=self.user1,
            achievement=achievement4,
            earned_at=newer_time
        )
        
        # Update the existing achievement's timestamp to be older
        user_achievement = UserAchievements.objects.get(
            user=self.user1, 
            achievement=self.achievement1
        )
        user_achievement.earned_at = older_time
        user_achievement.save()
        
        url = reverse('get_user_achievements')
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        achievements = response.data['data']['achievements']
        
        # Check that the newest achievement is first
        self.assertEqual(achievements[0]['achievement']['title'], 'Water Saver')
        
        # Find the position of the older achievement (should be later in the list)
        recycling_champ_positions = [
            i for i, a in enumerate(achievements) 
            if a['achievement']['title'] == 'Recycling Champion'
        ]
        
        self.assertTrue(recycling_champ_positions[0] > 0)

    def tearDown(self):
        # Clean up created objects
        UserAchievements.objects.all().delete()
        Achievements.objects.all().delete()
        Users.objects.all().delete()
