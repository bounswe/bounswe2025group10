from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from challenges.models import Challenge


User = get_user_model()


class ChallengeTests(TestCase):
    def setUp(self):
        '''
        Method to set up the test environment.
        '''
        # Create a test client
        self.client = APIClient()

        # Create a regular user
        self.user = User.objects.create_user(
            email="user@example.com",
            username="user",
            password="password123"
        )

        # Create an admin user
        self.admin = User.objects.create_superuser(
            email="admin@example.com",
            username="admin",
            password="admin1234"
        )

        # Create a public challenge
        self.public_challenge = Challenge.objects.create(
            title="Public Challenge",
            description="This is a public challenge.",
            is_public=True,
            creator=self.user
        )

        # Create a non-public challenge
        self.private_challenge = Challenge.objects.create(
            title="Private Challenge",
            description="This is a private challenge.",
            is_public=False,
            creator=self.user
        )


    def test_list_challenges(self):
        # Unauthenticated user should see only public challenges
        response = self.client.get('/api/challenges/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Only public challenge is visible

        # Authenticate as a regular user
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/challenges/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Both public and private challenges are visible

    def test_create_challenge(self):
        # Unauthenticated user cannot create a challenge
        data = {
            "title": "New Challenge",
            "description": "This is a new challenge.",
            "is_public": True
        }
        response = self.client.post('/api/challenges/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Authenticate as a regular user
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/challenges/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Challenge.objects.count(), 3)  # Two initial challenges + one new

    def test_update_challenge(self):
        # Authenticate as a regular user
        self.client.force_authenticate(user=self.user)

        # Try updating a public challenge (should fail for non-admin)
        data = {"title": "Updated Public Challenge"}
        response = self.client.put(f'/api/challenges/{self.public_challenge.id}/update/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Authenticate as an admin
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(f'/api/challenges/{self.public_challenge.id}/update/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.public_challenge.refresh_from_db()
        self.assertEqual(self.public_challenge.title, "Updated Public Challenge")

    def test_delete_challenge(self):
        # Authenticate as a regular user
        self.client.force_authenticate(user=self.user)

        # Try deleting a public challenge (should fail for non-admin)
        response = self.client.delete(f'/api/challenges/{self.public_challenge.id}/delete/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Try deleting a private challenge (should succeed for the creator)
        response = self.client.delete(f'/api/challenges/{self.private_challenge.id}/delete/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Challenge.objects.count(), 1)  # Only the public challenge remains

        # Authenticate as an admin
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f'/api/challenges/{self.public_challenge.id}/delete/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Challenge.objects.count(), 0)  # All challenges deleted

