from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from api.account_deletion import process_due_account_deletions
from api.models import (
    AccountDeletionRequest,
    Achievements,
    Comments,
    Posts,
    Follow,
    UserAchievements,
    Waste,
    UserWastes,
)


User = get_user_model()


class AccountDeletionFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='del@test.com',
            username='deluser',
            password='testpass123'
        )
        self.other = User.objects.create_user(
            email='other@test.com',
            username='otheruser',
            password='testpass123'
        )

    def test_request_deletion_creates_request_and_deactivates(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/profile/delete-request/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)

        req = AccountDeletionRequest.objects.get(user=self.user)
        self.assertIsNone(req.canceled_at)
        self.assertGreater(req.delete_after, req.requested_at)

    def test_cancel_deletion_reactivates(self):
        self.client.force_authenticate(user=self.user)
        self.client.post('/api/profile/delete-request/')

        response = self.client.delete('/api/profile/delete-request/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertTrue(self.user.is_active)

        req = AccountDeletionRequest.objects.get(user=self.user)
        self.assertIsNotNone(req.canceled_at)

    def test_process_due_deletions_hard_deletes_user_and_data(self):
        # Create associated data
        plastic = Waste.objects.get(type='PLASTIC')
        UserWastes.objects.create(user=self.user, waste=plastic, amount=1.0, date=timezone.now())
        post = Posts.objects.create(creator=self.user, text="hello", date=timezone.now())
        Comments.objects.create(post=post, author=self.user, content="c1", date=timezone.now())
        Follow.objects.create(follower=self.other, following=self.user)

        achievement = Achievements.objects.create(title="t", description="d")
        user_achievement = UserAchievements.objects.create(user=self.user, achievement=achievement, earned_at=timezone.now())
        self.assertIsNotNone(user_achievement)

        # Request deletion
        self.client.force_authenticate(user=self.user)
        self.client.post('/api/profile/delete-request/')

        req = AccountDeletionRequest.objects.get(user=self.user)
        future = req.delete_after + timedelta(days=1)
        deleted = process_due_account_deletions(now=future)
        self.assertEqual(deleted, 1)

        self.assertFalse(User.objects.filter(id=self.user.id).exists())
        self.assertEqual(Posts.objects.filter(creator_id=self.user.id).count(), 0)
        self.assertEqual(Comments.objects.filter(author_id=self.user.id).count(), 0)
        self.assertEqual(UserWastes.objects.filter(user_id=self.user.id).count(), 0)
        self.assertEqual(Follow.objects.filter(following_id=self.user.id).count(), 0)
        self.assertEqual(UserAchievements.objects.filter(user_id=self.user.id).count(), 0)
        self.assertEqual(AccountDeletionRequest.objects.filter(user_id=self.user.id).count(), 0)
