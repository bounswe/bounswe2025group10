import uuid

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from challenges.models import Challenge, UserChallenge

User = get_user_model()


class ChallengeTests(TestCase):
    """Test suite for challenge views."""

    def setUp(self):
        """Set up test fixtures."""
        self.client = APIClient()

        # Generate unique emails for each test run
        unique_suffix = uuid.uuid4().hex[:8]

        # Create a regular user
        self.user = User.objects.create_user(
            email=f"user_{unique_suffix}@example.com",
            username=f"user_{unique_suffix}",
            password="password123"
        )

        # Create an admin user
        self.admin = User.objects.create_superuser(
            email=f"admin_{unique_suffix}@example.com",
            username=f"admin_{unique_suffix}",
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
        """Test listing challenges."""
        # Unauthenticated user should see only public challenges
        response = self.client.get('/api/challenges/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)  # Only public challenge is visible

        # Authenticate as a regular user
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/challenges/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)  # Both public and private challenges are visible

    def test_create_challenge(self):
        """Test creating a challenge."""
        # Unauthenticated user cannot create a challenge
        data = {
            "title": "New Challenge",
            "description": "This is a new challenge.",
            "is_public": True
        }
        response = self.client.post('/api/challenges/', data, content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Authenticate as a regular user
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/challenges/', data, content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Challenge.objects.count(), 3)

    def test_update_challenge(self):
        """Test updating a challenge."""
        self.client.force_authenticate(user=self.user)

        # Try updating a public challenge (should fail for non-admin)
        data = {"title": "Updated Public Challenge"}
        response = self.client.put(
            f'/api/challenges/{self.public_challenge.id}/update/',
            data,
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Authenticate as an admin
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            f'/api/challenges/{self.public_challenge.id}/update/',
            data,
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.public_challenge.refresh_from_db()
        self.assertEqual(self.public_challenge.title, "Updated Public Challenge")

    def test_delete_challenge(self):
        """Test deleting a challenge."""
        self.client.force_authenticate(user=self.user)

        # Try deleting a public challenge (should fail for non-admin)
        response = self.client.delete(f'/api/challenges/{self.public_challenge.id}/delete/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Try deleting a private challenge (should succeed for the creator)
        response = self.client.delete(f'/api/challenges/{self.private_challenge.id}/delete/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Challenge.objects.count(), 1)

        # Authenticate as an admin
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f'/api/challenges/{self.public_challenge.id}/delete/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Challenge.objects.count(), 0)


class ChallengeParticipationTests(TestCase):
    """Test suite for challenge participation."""

    def setUp(self):
        """Set up test fixtures."""
        self.client = APIClient()

        # Generate unique emails for each test run
        unique_suffix = uuid.uuid4().hex[:8]

        # Create regular users
        self.user = User.objects.create_user(
            email=f"user_{unique_suffix}@example.com",
            username=f"user_{unique_suffix}",
            password="password123"
        )

        self.other_user = User.objects.create_user(
            email=f"other_user_{unique_suffix}@example.com",
            username=f"other_user_{unique_suffix}",
            password="password123"
        )

        # Create a public challenge
        self.public_challenge = Challenge.objects.create(
            title="Public Challenge",
            description="This is a public challenge.",
            is_public=True,
            target_amount=100,
            current_progress=0,
            creator=self.other_user
        )

        # Create a non-public challenge
        self.private_challenge = Challenge.objects.create(
            title="Private Challenge",
            description="This is a private challenge.",
            is_public=False,
            target_amount=50,
            current_progress=0,
            creator=self.user
        )

        # Create a challenge the user has already participated in
        self.participated_challenge = Challenge.objects.create(
            title="Participated Challenge",
            description="This is a challenge the user participated in.",
            is_public=True,
            target_amount=200,
            current_progress=50,
            creator=self.other_user
        )
        UserChallenge.objects.create(user=self.user, challenge=self.participated_challenge)

    def test_participate_in_public_challenge(self):
        """
        Test that a user can participate in a public challenge.
        """
        self.client.force_authenticate(user=self.user)
        data = {"challenge": self.public_challenge.id}
        response = self.client.post('/api/challenges/participate/', data, content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(UserChallenge.objects.filter(user=self.user, challenge=self.public_challenge).exists())

    def test_participate_in_private_challenge(self):
        """
        Test that a user cannot participate in another user's private challenge.
        """
        self.client.force_authenticate(user=self.other_user)
        data = {"challenge": self.private_challenge.id}
        response = self.client.post('/api/challenges/participate/', data, content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_participate_in_own_private_challenge(self):
        """
        Test that a user can participate in their own private challenge.
        """
        self.client.force_authenticate(user=self.user)
        data = {"challenge": self.private_challenge.id}
        response = self.client.post('/api/challenges/participate/', data, content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(UserChallenge.objects.filter(user=self.user, challenge=self.private_challenge).exists())

    def test_duplicate_participation(self):
        """
        Test that a user cannot participate in the same challenge twice.
        """
        self.client.force_authenticate(user=self.user)
        data = {"challenge": self.participated_challenge.id}
        response = self.client.post('/api/challenges/participate/', data, content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_view_enrolled_challenges(self):
        """
        Test that a user can view the challenges they are enrolled in.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/challenges/enrolled/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify that only enrolled challenges are returned
        enrolled_challenge_ids = [challenge['challenge'] for challenge in response.data['results']]
        self.assertIn(self.participated_challenge.id, enrolled_challenge_ids)
        self.assertNotIn(self.public_challenge.id, enrolled_challenge_ids)
        self.assertNotIn(self.private_challenge.id, enrolled_challenge_ids)

    def test_unauthenticated_user_cannot_participate(self):
        """
        Test that an unauthenticated user cannot participate in a challenge.
        """
        data = {"challenge": self.public_challenge.id}
        response = self.client.post('/api/challenges/participate/', data, content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_user_cannot_view_enrolled_challenges(self):
        """
        Test that an unauthenticated user cannot view enrolled challenges.
        """
        response = self.client.get('/api/challenges/enrolled/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_max_three_challenges_constraint(self):
        """
        Test that a user cannot participate in more than 3 challenges.
        """
        self.client.force_authenticate(user=self.user)
        
        # Create 3 more public challenges
        challenge1 = Challenge.objects.create(
            title="Challenge 1",
            is_public=True,
            target_amount=100,
            creator=self.other_user
        )
        challenge2 = Challenge.objects.create(
            title="Challenge 2",
            is_public=True,
            target_amount=100,
            creator=self.other_user
        )
        challenge3 = Challenge.objects.create(
            title="Challenge 3",
            is_public=True,
            target_amount=100,
            creator=self.other_user
        )
        
        # User is already in 1 challenge (participated_challenge)
        # Join 2 more challenges (total = 3)
        response = self.client.post('/api/challenges/participate/', 
                                   {"challenge": challenge1.id}, 
                                   content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        response = self.client.post('/api/challenges/participate/', 
                                   {"challenge": challenge2.id}, 
                                   content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify user has 3 challenges
        self.assertEqual(UserChallenge.objects.filter(user=self.user).count(), 3)
        
        # Try to join a 4th challenge - should fail
        response = self.client.post('/api/challenges/participate/', 
                                   {"challenge": challenge3.id}, 
                                   content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("maximum of 3 challenges", str(response.data))

    def test_completed_challenges_not_listed(self):
        """
        Test that completed challenges are not returned in GET request.
        """
        # Create a completed challenge
        completed_challenge = Challenge.objects.create(
            title="Completed Challenge",
            is_public=True,
            target_amount=100,
            current_progress=100,  # Completed
            creator=self.other_user
        )
        
        # Get all challenges without authentication
        response = self.client.get('/api/challenges/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that completed challenge is NOT in the results
        challenge_ids = [c['id'] for c in response.data['results']]
        self.assertNotIn(completed_challenge.id, challenge_ids)
        
        # Check that incomplete challenges ARE in the results
        self.assertIn(self.public_challenge.id, challenge_ids)

    def test_completed_challenges_not_listed_authenticated(self):
        """
        Test that completed challenges are not returned even for authenticated users.
        """
        self.client.force_authenticate(user=self.user)
        
        # Create a completed challenge owned by user
        completed_challenge = Challenge.objects.create(
            title="My Completed Challenge",
            is_public=False,
            target_amount=50,
            current_progress=50,  # Completed
            creator=self.user
        )
        
        response = self.client.get('/api/challenges/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that completed challenge is NOT in the results
        challenge_ids = [c['id'] for c in response.data['results']]
        self.assertNotIn(completed_challenge.id, challenge_ids)
