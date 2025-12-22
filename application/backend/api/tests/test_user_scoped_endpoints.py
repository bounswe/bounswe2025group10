from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from api.models import Follow, PostLikes, Posts, Users, UserWastes, Waste
from challenges.models import Challenge, UserChallenge


class UserPostReactionsEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = Users.objects.create_user(
            email="user@example.com",
            username="user",
            password="pass1234",
        )
        self.other = Users.objects.create_user(
            email="other@example.com",
            username="other",
            password="pass1234",
        )
        self.post1 = Posts.objects.create(creator=self.other, text="p1", date=timezone.now())
        self.post2 = Posts.objects.create(creator=self.other, text="p2", date=timezone.now())
        PostLikes.objects.create(user=self.user, post=self.post1, reaction_type="LIKE", date=timezone.now())
        PostLikes.objects.create(user=self.user, post=self.post2, reaction_type="DISLIKE", date=timezone.now())

    def test_get_user_post_reactions_returns_reactions(self):
        url = reverse("get_user_post_reactions", kwargs={"username": self.user.username})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "User post reactions retrieved successfully")
        self.assertEqual(len(response.data["data"]), 2)
        self.assertIn(response.data["data"][0]["reaction_type"], {"LIKE", "DISLIKE"})
        self.assertIn("post", response.data["data"][0])

    def test_get_user_post_reactions_user_not_found(self):
        url = reverse("get_user_post_reactions", kwargs={"username": "missing"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class UserWasteRecordsEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = Users.objects.create_user(
            email="owner@example.com",
            username="owner",
            password="pass1234",
        )
        self.viewer = Users.objects.create_user(
            email="viewer@example.com",
            username="viewer",
            password="pass1234",
        )
        self.plastic, _ = Waste.objects.get_or_create(type="PLASTIC")
        UserWastes.objects.create(user=self.owner, waste=self.plastic, amount=1.5, date=timezone.now())

    def test_get_user_wastes_public_visible(self):
        url = reverse("get_user_wastes_by_username", kwargs={"username": self.owner.username})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["visible"])
        self.assertIsInstance(response.data["data"], list)

    def test_get_user_wastes_private_hidden(self):
        self.owner.waste_stats_privacy = "private"
        self.owner.save(update_fields=["waste_stats_privacy"])

        url = reverse("get_user_wastes_by_username", kwargs={"username": self.owner.username})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["visible"])
        self.assertIsNone(response.data["data"])

    def test_get_user_wastes_followers_visible_for_follower(self):
        self.owner.waste_stats_privacy = "followers"
        self.owner.save(update_fields=["waste_stats_privacy"])
        Follow.objects.create(follower=self.viewer, following=self.owner)

        self.client.force_authenticate(user=self.viewer)
        url = reverse("get_user_wastes_by_username", kwargs={"username": self.owner.username})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["visible"])

    def test_get_user_wastes_hidden_when_anonymous(self):
        self.owner.is_anonymous = True
        self.owner.save(update_fields=["is_anonymous"])

        self.client.force_authenticate(user=self.viewer)
        url = reverse("get_user_wastes_by_username", kwargs={"username": self.owner.username})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["visible"])


class UserEnrolledChallengesEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = Users.objects.create_user(
            email="challenger@example.com",
            username="challenger",
            password="pass1234",
        )
        self.challenge = Challenge.objects.create(
            title="Challenge",
            description="Desc",
            target_amount=10.0,
            current_progress=0.0,
            is_public=True,
            creator=self.user,
            deadline=timezone.now() + timezone.timedelta(days=7),
        )
        UserChallenge.objects.create(user=self.user, challenge=self.challenge, joined_date=timezone.now())

    def test_get_user_enrolled_challenges(self):
        url = reverse("challenge-user-enrolled", kwargs={"username": self.user.username})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.data.get("results", response.data)
        enrolled_ids = [row["challenge"] for row in payload]
        self.assertIn(self.challenge.id, enrolled_ids)

    def test_get_user_enrolled_challenges_user_not_found(self):
        url = reverse("challenge-user-enrolled", kwargs={"username": "missing"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

