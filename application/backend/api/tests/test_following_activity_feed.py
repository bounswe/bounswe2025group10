from django.test import TransactionTestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from api.models import Users, Follow, Posts, ActivityEvent


class FollowingActivityFeedTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.client = APIClient()

        self.user = Users.objects.create_user(email="u1@example.com", password="pw", username="u1")
        self.followed = Users.objects.create_user(email="u2@example.com", password="pw", username="u2")
        self.not_followed = Users.objects.create_user(email="u3@example.com", password="pw", username="u3")

        Follow.objects.create(follower=self.user, following=self.followed)

    def test_returns_events_from_followed_users(self):
        self.client.force_authenticate(user=self.user)

        post = Posts.objects.create(creator=self.followed, text="hello", date=timezone.now())

        response = self.client.get("/api/following-activity-events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("items", response.data)

        # Should contain an event from followed user
        actor_ids = [e["actor_id"] for e in response.data["items"]]
        self.assertIn(self.followed.username, actor_ids)

    def test_does_not_return_events_from_non_followed_users(self):
        self.client.force_authenticate(user=self.user)

        Posts.objects.create(creator=self.not_followed, text="hello", date=timezone.now())

        response = self.client.get("/api/following-activity-events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        actor_ids = [e["actor_id"] for e in response.data["items"]]
        self.assertNotIn(self.not_followed.username, actor_ids)

    def test_excludes_direct_visibility(self):
        self.client.force_authenticate(user=self.user)

        ActivityEvent.objects.create(
            as2_json={"type": "create-post", "actor": self.followed.username, "object": {"type": "Note", "id": "x"}},
            actor_id=self.followed.username,
            type="create-post",
            object_type="Note",
            object_id="x",
            visibility="direct",
            summary="direct",
        )

        response = self.client.get("/api/following-activity-events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(all(item["visibility"] != "direct" for item in response.data["items"]))
