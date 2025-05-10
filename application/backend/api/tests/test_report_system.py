# tests/test_report_system.py
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
import uuid

from api.models import Report, Posts
from api.report_system.admin_panel_views import ModerateReportsViewSet
from api.report_system.serializers import ReportReadSerializer
from django.urls import reverse
from api.report_system.admin_panel_views import StandardResultsSetPagination
from api.report_system.admin_panel_views import ModerationActionSerializer


User = get_user_model()


def make_admin(**kwargs):
    """Helper — create and return an active superuser (staff)."""
    unique_suffix = uuid.uuid4().hex[:8]
    email = kwargs.get("email", f"admin_{unique_suffix}@example.com")
    username = kwargs.get("username", f"admin_{unique_suffix}")
    return User.objects.create_user(
        email=email,
        password="adminpass",
        username=username,
        is_staff=True,
        is_superuser=True,
        isAdmin=True,
    )


def make_regular_user(**kwargs):
    """Helper — create a normal user."""
    unique_suffix = uuid.uuid4().hex[:8]
    email = kwargs.get("email", f"user_{unique_suffix}@example.com")
    username = kwargs.get("username", f"user_{unique_suffix}")
    return User.objects.create_user(
        email=email,
        password="userpass",
        username=username,
    )


class AdminReportAPITests(APITestCase):
    """Unit‑tests for ReportViewSet (admin panel)."""

    @classmethod
    def setUpTestData(cls):
        # --- create users -----------------------------------------------------
        cls.admin = make_admin()
        cls.media_owner = make_regular_user(email="owner@example.com", username="owner")
        cls.reporter = make_regular_user(email="rep@example.com", username="reporter")

        # --- create a Post & corresponding Report ----------------------------
        cls.post = Posts.objects.create(
            creator=cls.media_owner,
            text="Offensive post 🛑",
        )
        post_ct = ContentType.objects.get_for_model(Posts)
        cls.report = Report.objects.create(
            reporter=cls.reporter,
            reason="INAPPROPRIATE",
            description="This post is bad",
            content_type=post_ct,
            object_id=cls.post.id,
        )

        # URL helpers (adjust if router prefix differs)
        cls.list_url = reverse("admin-reports-list")
        cls.detail_url = reverse("admin-reports-detail", args=[cls.report.id])
        cls.moderate_url = reverse("admin-reports-moderate", args=[cls.report.id])

    # --------------------------------------------------------------------- #
    #                            Helper methods                             #
    # --------------------------------------------------------------------- #
    def auth_as_admin(self):
        self.client.login(email=self.admin.email, password="adminpass")

    def auth_as_user(self):
        self.client.login(email=self.reporter.email, password="userpass")

    # --------------------------------------------------------------------- #
    #                                Tests                                  #
    # --------------------------------------------------------------------- #
    def test_admin_can_list_reports(self):
        self.auth_as_admin()
        res = self.client.get(self.list_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["results"][0]["id"], self.report.id)

    def test_filter_by_type(self):
        self.auth_as_admin()
        res = self.client.get(self.list_url, {"type": "post"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(all(r["content_type"] == "posts" for r in res.data["results"]))

    def test_non_admin_cannot_access(self):
        self.auth_as_user()
        res = self.client.get(self.list_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_single_report(self):
        self.auth_as_admin()
        res = self.client.get(self.detail_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["id"], self.report.id)
        self.assertEqual(res.data["content"]["text"], self.post.text)

    # ---------------------- Moderation Actions --------------------------- #
    def test_delete_media_action(self):
        self.auth_as_admin()
        res = self.client.post(self.moderate_url, {"action": "delete_media"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Post should be gone, report should be gone
        self.assertFalse(Posts.objects.filter(id=self.post.id).exists())
        self.assertFalse(Report.objects.filter(id=self.report.id).exists())

    def test_ban_user_action(self):
        # re‑create the post & report because previous test deleted them
        post = Posts.objects.create(creator=self.media_owner, text="Another post")
        report = Report.objects.create(
            reporter=self.reporter,
            reason="SPAM",
            content_type=ContentType.objects.get_for_model(Posts),
            object_id=post.id,
        )
        url = reverse("admin-reports-moderate", args=[report.id])
        self.auth_as_admin()
        res = self.client.post(url, {"action": "ban_user"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.media_owner.refresh_from_db()
        self.assertFalse(self.media_owner.is_active)
        # Report should be gone
        self.assertFalse(Report.objects.filter(id=report.id).exists())

    def test_ignore_action(self):
        # new report for ignore test
        post = Posts.objects.create(creator=self.media_owner, text="Minor issue")
        report = Report.objects.create(
            reporter=self.reporter,
            reason="OTHER",
            content_type=ContentType.objects.get_for_model(Posts),
            object_id=post.id,
        )
        url = reverse("admin-reports-moderate", args=[report.id])
        self.auth_as_admin()
        res = self.client.post(url, {"action": "ignore"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Post should still exist; report removed
        self.assertTrue(Posts.objects.filter(id=post.id).exists())
        self.assertFalse(Report.objects.filter(id=report.id).exists())


    def test_invalid_action(self):
        # new report for ignore test
        post = Posts.objects.create(creator=self.media_owner, text="Minor issue")
        report = Report.objects.create(
            reporter=self.reporter,
            reason="OTHER",
            content_type=ContentType.objects.get_for_model(Posts),
            object_id=post.id,
        )
        url = reverse("admin-reports-moderate", args=[report.id])
        self.auth_as_admin()
        res = self.client.post(url, {"action": "invalid_action"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        # Post should still exist; report should still exist
        self.assertTrue(Posts.objects.filter(id=post.id).exists())
        self.assertTrue(Report.objects.filter(id=report.id).exists())


# ---------------------------------------------------------------
# User-facing report creation endpoint tests
# ---------------------------------------------------------------

class UserReportAPITests(APITestCase):
    """Unit‑tests for the user-facing report creation endpoint."""

    @classmethod
    def setUpTestData(cls):
        # create a regular user and a media owner
        cls.user = make_regular_user()
        cls.media_owner = make_regular_user()
        # create a post to report
        cls.post = Posts.objects.create(
            creator=cls.media_owner,
            text="Test post"
        )
        # URL for reporting that post
        cls.url = reverse("report_content", args=["posts", cls.post.id])

    def test_unauthenticated_cannot_report(self):
        """Anonymous users should get 401 when reporting."""
        res = self.client.post(self.url, {"reason": "SPAM", "description": "spammy"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_can_report(self):
        """Logged-in users can successfully file a report."""
        self.client.login(email=self.user.email, password="userpass")
        res = self.client.post(self.url, {"reason": "SPAM", "description": "spammy"})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        # verify the report was created correctly
        report = Report.objects.get(id=res.data["id"])
        self.assertEqual(report.reporter, self.user)
        self.assertEqual(report.content_type.model, "posts")
        self.assertEqual(report.object_id, self.post.id)
        self.assertEqual(report.reason, "SPAM")
        self.assertEqual(report.description, "spammy")

    def test_report_without_description_is_allowed(self):
        """Omitting description should default to empty string."""
        self.client.login(email=self.user.email, password="userpass")
        res = self.client.post(self.url, {"reason": "INAPPROPRIATE"})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        report = Report.objects.get(id=res.data["id"])
        self.assertEqual(report.description, "")

    def test_missing_reason_returns_bad_request(self):
        """Missing required 'reason' field should return 400 with error."""
        self.client.login(email=self.user.email, password="userpass")
        res = self.client.post(self.url, {"description": "just because"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("reason", res.data)

    def test_invalid_content_type_returns_bad_request(self):
        """Reporting with an unsupported content_type should return 400."""
        self.client.login(email=self.user.email, password="userpass")
        invalid_url = reverse("report_content", args=["invalid", self.post.id])
        res = self.client.post(invalid_url, {"reason": "SPAM"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", res.data)
