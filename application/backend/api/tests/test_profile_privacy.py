from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from api.models import Follow

User = get_user_model()


class ProfilePrivacySettingsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
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

    def test_privacy_settings_requires_authentication(self):
        response = self.client.get('/api/profile/privacy/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_privacy_settings_get_defaults(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/profile/privacy/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['bio_privacy'], 'public')
        self.assertEqual(response.data['data']['waste_stats_privacy'], 'public')

    def test_privacy_settings_put_updates_values(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.put('/api/profile/privacy/', {
            'bio_privacy': 'private',
            'waste_stats_privacy': 'followers',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.bio_privacy, 'private')
        self.assertEqual(self.user1.waste_stats_privacy, 'followers')

    def test_privacy_settings_put_invalid_value(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.put('/api/profile/privacy/', {
            'bio_privacy': 'invalid',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('bio_privacy', response.data['error'])


class WasteStatsPrivacyTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email='owner@test.com',
            username='owner',
            password='testpass123'
        )
        self.other = User.objects.create_user(
            email='other@test.com',
            username='other',
            password='testpass123'
        )

        self.owner.total_points = 12.5
        self.owner.total_co2 = 3.14159
        self.owner.save(update_fields=['total_points', 'total_co2'])

    def test_user_waste_stats_public_visible_to_any(self):
        self.owner.waste_stats_privacy = 'public'
        self.owner.save(update_fields=['waste_stats_privacy'])

        response = self.client.get(f'/api/profile/{self.owner.username}/waste-stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.owner.username)
        self.assertEqual(response.data['total_waste'], f"{self.owner.total_co2:.4f}")
        self.assertAlmostEqual(response.data['points'], self.owner.total_points)

    def test_user_waste_stats_private_hidden_from_other(self):
        self.owner.waste_stats_privacy = 'private'
        self.owner.save(update_fields=['waste_stats_privacy'])

        self.client.force_authenticate(user=self.other)
        response = self.client.get(f'/api/profile/{self.owner.username}/waste-stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['total_waste'])
        self.assertIsNone(response.data['points'])

    def test_user_waste_stats_private_visible_to_owner(self):
        self.owner.waste_stats_privacy = 'private'
        self.owner.save(update_fields=['waste_stats_privacy'])

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f'/api/profile/{self.owner.username}/waste-stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_waste'], f"{self.owner.total_co2:.4f}")
        self.assertAlmostEqual(response.data['points'], self.owner.total_points)

    def test_user_waste_stats_followers_only(self):
        self.owner.waste_stats_privacy = 'followers'
        self.owner.save(update_fields=['waste_stats_privacy'])

        # Not a follower -> hidden
        self.client.force_authenticate(user=self.other)
        response = self.client.get(f'/api/profile/{self.owner.username}/waste-stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['total_waste'])
        self.assertIsNone(response.data['points'])

        # Become a follower -> visible
        Follow.objects.create(follower=self.other, following=self.owner)
        response = self.client.get(f'/api/profile/{self.owner.username}/waste-stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_waste'], f"{self.owner.total_co2:.4f}")
        self.assertAlmostEqual(response.data['points'], self.owner.total_points)

