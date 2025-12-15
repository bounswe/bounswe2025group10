from django.test import TestCase
from rest_framework import status
from api.models import Users, Follow
from api.profile.profile_views import user_bio


class UserBioTests(TestCase):
    """Test suite for user bio functionality."""

    def setUp(self):
        """Set up test fixtures."""
        self.factory = APIRequestFactory()

        # Create two test users
        self.user1 = Users.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="pass1234"
        )
        self.user2 = Users.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="pass5678"
        )

    def test_get_bio_success(self):
        """Test retrieving an existing user's bio returns 200 and correct data."""
        self.user1.bio = "Hello world"
        self.user1.save(update_fields=['bio'])

        request = self.factory.get(f'/api/profile/{self.user1.username}/bio/')
        response = user_bio(request, username=self.user1.username)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {
            'username': self.user1.username,
            'bio': "Hello world"
        })

    def test_get_bio_not_found(self):
        """Test retrieving bio for non-existent user returns 404."""
        request = self.factory.get('/api/profile/nonexistent/bio/')
        response = user_bio(request, username="nonexistent")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'User not found.')

    def test_put_bio_unauthenticated(self):
        """Test PUT without authentication returns 401."""
        request = self.factory.put(
            f'/api/profile/{self.user1.username}/bio/',
            {'bio': 'New bio'},
            format='json'
        )
        response = user_bio(request, username=self.user1.username)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['error'], 'Authentication required.')

    def test_put_bio_permission_denied(self):
        """Test authenticated as another user returns 403."""
        request = self.factory.put(
            f'/api/profile/{self.user1.username}/bio/',
            {'bio': 'New bio'},
            format='json'
        )
        force_authenticate(request, user=self.user2)
        response = user_bio(request, username=self.user1.username)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error'], 'Permission denied.')

    def test_put_bio_no_data(self):
        """Test PUT without providing bio field returns 400."""
        request = self.factory.put(
            f'/api/profile/{self.user1.username}/bio/',
            {},
            format='json'
        )
        force_authenticate(request, user=self.user1)
        response = user_bio(request, username=self.user1.username)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'No bio provided.')

    def test_put_bio_success(self):
        """Test authenticated owner can update their bio successfully."""
        request = self.factory.put(
            f'/api/profile/{self.user1.username}/bio/',
            {'bio': 'Updated bio'},
            format='json'
        )
        force_authenticate(request, user=self.user1)
        response = user_bio(request, username=self.user1.username)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Bio updated successfully.')
        self.assertEqual(response.data['bio'], 'Updated bio')

    def test_get_bio_private_hidden_from_other_user(self):
        """Private bio should be hidden from non-owners"""
        self.user1.bio = "Secret bio"
        self.user1.bio_privacy = "private"
        self.user1.save(update_fields=['bio', 'bio_privacy'])

        request = self.factory.get(f'/api/profile/{self.user1.username}/bio/')
        force_authenticate(request, user=self.user2)
        response = user_bio(request, username=self.user1.username)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.user1.username)
        self.assertIsNone(response.data['bio'])

    def test_get_bio_private_visible_to_owner(self):
        """Private bio should be visible to the profile owner"""
        self.user1.bio = "Secret bio"
        self.user1.bio_privacy = "private"
        self.user1.save(update_fields=['bio', 'bio_privacy'])

        request = self.factory.get(f'/api/profile/{self.user1.username}/bio/')
        force_authenticate(request, user=self.user1)
        response = user_bio(request, username=self.user1.username)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['bio'], "Secret bio")

    def test_get_bio_followers_only(self):
        """Followers-only bio should be visible only to followers and the owner"""
        self.user1.bio = "Followers bio"
        self.user1.bio_privacy = "followers"
        self.user1.save(update_fields=['bio', 'bio_privacy'])

        # Not following yet -> hidden
        request = self.factory.get(f'/api/profile/{self.user1.username}/bio/')
        force_authenticate(request, user=self.user2)
        response = user_bio(request, username=self.user1.username)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['bio'])

        # Become a follower -> visible
        Follow.objects.create(follower=self.user2, following=self.user1)
        request = self.factory.get(f'/api/profile/{self.user1.username}/bio/')
        force_authenticate(request, user=self.user2)
        response = user_bio(request, username=self.user1.username)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['bio'], "Followers bio")
