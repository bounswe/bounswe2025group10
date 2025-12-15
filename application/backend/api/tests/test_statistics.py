from datetime import timedelta

from django.db.models import F, Q, Sum
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from api.models import Posts, Tips, Users
from challenges.models import Challenge, UserChallenge


class StatisticsViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Baseline system counts before creating fixtures
        now = timezone.now()
        self.baseline_tip_count = Tips.objects.count()
        self.baseline_post_count = Posts.objects.count()
        self.baseline_total_co2 = Users.objects.aggregate(total=Sum("total_co2"))["total"] or 0
        self.baseline_active_challenges = Challenge.objects.filter(
            Q(target_amount__isnull=True) | Q(current_progress__lt=F("target_amount"))
        ).filter(Q(deadline__isnull=True) | Q(deadline__gt=now)).count()

        # Users
        self.user1 = Users.objects.create_user(
            email="user1@example.com", username="user1", password="testpass123"
        )
        self.user2 = Users.objects.create_user(
            email="user2@example.com", username="user2", password="testpass123"
        )
        self.user1.total_co2 = 5.4321
        self.user2.total_co2 = 1.25
        self.user1.waste_stats_privacy = "private"
        self.user1.save(update_fields=["total_co2", "waste_stats_privacy"])
        self.user2.save(update_fields=["total_co2"])

        # Tips (system-wide)
        Tips.objects.create(title="Tip 1", text="Do X")
        Tips.objects.create(title="Tip 2", text="Do Y")

        # Posts
        Posts.objects.create(creator=self.user1, text="Post A")
        Posts.objects.create(creator=self.user1, text="Post B")
        Posts.objects.create(creator=self.user2, text="Post C")

        # Challenges
        self.active_challenge = Challenge.objects.create(
            title="Active",
            target_amount=10,
            current_progress=2,
            is_public=True,
            deadline=now + timedelta(days=5),
        )
        self.completed_challenge = Challenge.objects.create(
            title="Completed",
            target_amount=5,
            current_progress=5,
            is_public=True,
            deadline=now + timedelta(days=5),
        )
        self.expired_challenge = Challenge.objects.create(
            title="Expired",
            target_amount=5,
            current_progress=1,
            is_public=True,
            deadline=now - timedelta(days=1),
        )

        # User participations
        UserChallenge.objects.create(user=self.user1, challenge=self.active_challenge, joined_date=now)
        UserChallenge.objects.create(user=self.user1, challenge=self.completed_challenge, joined_date=now)
        UserChallenge.objects.create(user=self.user1, challenge=self.expired_challenge, joined_date=now)
        UserChallenge.objects.create(user=self.user2, challenge=self.active_challenge, joined_date=now)

    def test_system_statistics_returns_aggregates(self):
        url = reverse("system-statistics")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["total_tip_count"], self.baseline_tip_count + 2)
        self.assertEqual(data["total_post_count"], self.baseline_post_count + 3)
        # only the newly created active challenge adds to baseline actives
        self.assertEqual(data["total_active_challenges"], self.baseline_active_challenges + 1)
        self.assertEqual(len(data["all_challenges"]), Challenge.objects.count())
        self.assertEqual(
            data["total_co2"],
            round(self.baseline_total_co2 + self.user1.total_co2 + self.user2.total_co2, 4),
        )

    def test_user_statistics_respects_privacy(self):
        url = reverse("user-statistics", kwargs={"username": self.user1.username})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["username"], "user1")
        self.assertEqual(data["total_tip_count"], self.baseline_tip_count + 2)
        self.assertEqual(data["total_post_count"], Posts.objects.filter(creator=self.user1).count())
        # only active challenges for the user are counted
        active_for_user1 = Challenge.objects.filter(userchallenge__user=self.user1).filter(
            Q(target_amount__isnull=True) | Q(current_progress__lt=F("target_amount"))
        ).filter(Q(deadline__isnull=True) | Q(deadline__gt=timezone.now())).count()
        self.assertEqual(data["total_active_challenges"], active_for_user1)
        self.assertEqual(len(data["challenges"]), Challenge.objects.filter(userchallenge__user=self.user1).distinct().count())
        self.assertIsNone(data["total_co2"])  # hidden due to private privacy setting

    def test_user_statistics_allows_owner_to_view_co2(self):
        url = reverse("user-statistics", kwargs={"username": self.user1.username})
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["total_co2"], round(self.user1.total_co2, 4))
