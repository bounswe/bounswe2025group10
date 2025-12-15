from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from api.models import Users
from notifications.models import Notification


class NotificationsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = Users.objects.create_user(
            email="n1@example.com",
            username="n1",
            password="pw",
        )
        self.user2 = Users.objects.create_user(
            email="n2@example.com",
            username="n2",
            password="pw",
        )

    def test_list_notifications_requires_auth(self):
        resp = self.client.get("/api/notifications/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_notifications_returns_only_own(self):
        Notification.objects.create(user=self.user1, message="a1")
        Notification.objects.create(user=self.user1, message="a2", read=True)
        Notification.objects.create(user=self.user2, message="b1")

        self.client.force_authenticate(user=self.user1)
        resp = self.client.get("/api/notifications/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 2)
        messages = [r["message"] for r in resp.data["results"]]
        self.assertIn("a1", messages)
        self.assertIn("a2", messages)
        self.assertNotIn("b1", messages)

    def test_list_notifications_unread_filter(self):
        Notification.objects.create(user=self.user1, message="a1")
        Notification.objects.create(user=self.user1, message="a2", read=True)

        self.client.force_authenticate(user=self.user1)
        resp = self.client.get("/api/notifications/?unread=true")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["message"], "a1")

    def test_mark_notification_read(self):
        n = Notification.objects.create(user=self.user1, message="a1", read=False)

        self.client.force_authenticate(user=self.user1)
        resp = self.client.post(f"/api/notifications/{n.id}/read/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["notification"]["read"], True)
        n.refresh_from_db()
        self.assertTrue(n.read)

    def test_mark_notification_read_not_owner_404(self):
        n = Notification.objects.create(user=self.user2, message="b1", read=False)

        self.client.force_authenticate(user=self.user1)
        resp = self.client.post(f"/api/notifications/{n.id}/read/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_all_notifications_read(self):
        Notification.objects.create(user=self.user1, message="a1", read=False)
        Notification.objects.create(user=self.user1, message="a2", read=True)
        Notification.objects.create(user=self.user1, message="a3", read=False)

        self.client.force_authenticate(user=self.user1)
        resp = self.client.post("/api/notifications/read-all/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["updated_count"], 2)
        self.assertEqual(Notification.objects.filter(user=self.user1, read=False).count(), 0)

