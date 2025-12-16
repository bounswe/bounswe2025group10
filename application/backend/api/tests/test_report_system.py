import uuid

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Posts, Report

User = get_user_model()


def make_admin(**kwargs):
    """Helper to create and return an active superuser (staff)."""
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
    """Helper to create a normal user."""
    unique_suffix = uuid.uuid4().hex[:8]
    email = kwargs.get("email", f"user_{unique_suffix}@example.com")
    username = kwargs.get("username", f"user_{unique_suffix}")
    return User.objects.create_user(
        email=email,
        password="userpass",
        username=username,
    )


class AdminReportAPITests(APITestCase):
    """Test suite for ReportViewSet (admin panel)."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for all tests."""
        cls.admin = make_admin()
        cls.media_owner = make_regular_user(email="owner@example.com", username="owner")
        cls.reporter = make_regular_user(email="rep@example.com", username="reporter")

        # Create a Post & corresponding Report
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

        # URL helpers
        cls.list_url = reverse("admin-reports-list")
        cls.detail_url = reverse("admin-reports-detail", args=[cls.report.id])
        cls.moderate_url = reverse("admin-reports-moderate", args=[cls.report.id])

    def auth_as_admin(self):
        """Authenticate as admin user."""
        self.client.login(email=self.admin.email, password="adminpass")

    def auth_as_user(self):
        """Authenticate as regular user."""
        self.client.login(email=self.reporter.email, password="userpass")

    def test_admin_can_list_reports(self):
        """Test that admin can list reports."""
        self.auth_as_admin()
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"][0]["id"], self.report.id)

    def test_filter_by_type(self):
        """Test filtering reports by type."""
        self.auth_as_admin()
        response = self.client.get(self.list_url, {"type": "post"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(all(r["content_type"] == "posts" for r in response.data["results"]))

    def test_non_admin_cannot_access(self):
        """Test that non-admin users cannot access reports."""
        self.auth_as_user()
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_single_report(self):
        """Test retrieving a single report."""
        self.auth_as_admin()
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.report.id)
        self.assertEqual(response.data["content"]["text"], self.post.text)

    def test_delete_media_action(self):
        """Test delete media moderation action."""
        self.auth_as_admin()
        response = self.client.post(
            self.moderate_url,
            {"action": "delete_media"},
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Posts.objects.filter(id=self.post.id).exists())
        self.assertFalse(Report.objects.filter(id=self.report.id).exists())

    def test_ban_user_action(self):
        """Test ban user moderation action."""
        post = Posts.objects.create(creator=self.media_owner, text="Another post")
        report = Report.objects.create(
            reporter=self.reporter,
            reason="SPAM",
            content_type=ContentType.objects.get_for_model(Posts),
            object_id=post.id,
        )
        url = reverse("admin-reports-moderate", args=[report.id])
        self.auth_as_admin()
        response = self.client.post(url, {"action": "ban_user"}, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.media_owner.refresh_from_db()
        self.assertFalse(self.media_owner.is_active)
        self.assertFalse(Report.objects.filter(id=report.id).exists())

    def test_ban_user_action_when_target_is_user(self):
        """Reporting a User and banning should deactivate that user (not 400)."""
        reported_user = make_regular_user(email="reported@example.com", username="reported_user")
        report = Report.objects.create(
            reporter=self.reporter,
            reason="SPAM",
            content_type=ContentType.objects.get_for_model(User),
            object_id=reported_user.id,
        )
        url = reverse("admin-reports-moderate", args=[report.id])

        self.auth_as_admin()
        response = self.client.post(url, {"action": "ban_user"}, content_type="application/json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        reported_user.refresh_from_db()
        self.assertFalse(reported_user.is_active)
        self.assertFalse(Report.objects.filter(id=report.id).exists())

    def test_ignore_action(self):
        """Test ignore moderation action."""
        post = Posts.objects.create(creator=self.media_owner, text="Minor issue")
        report = Report.objects.create(
            reporter=self.reporter,
            reason="OTHER",
            content_type=ContentType.objects.get_for_model(Posts),
            object_id=post.id,
        )
        url = reverse("admin-reports-moderate", args=[report.id])
        self.auth_as_admin()
        response = self.client.post(url, {"action": "ignore"}, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Posts.objects.filter(id=post.id).exists())
        self.assertFalse(Report.objects.filter(id=report.id).exists())

    def test_invalid_action(self):
        """Test invalid moderation action."""
        post = Posts.objects.create(creator=self.media_owner, text="Minor issue")
        report = Report.objects.create(
            reporter=self.reporter,
            reason="OTHER",
            content_type=ContentType.objects.get_for_model(Posts),
            object_id=post.id,
        )
        url = reverse("admin-reports-moderate", args=[report.id])
        self.auth_as_admin()
        response = self.client.post(
            url,
            {"action": "invalid_action"},
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Posts.objects.filter(id=post.id).exists())
        self.assertTrue(Report.objects.filter(id=report.id).exists())


class UserReportAPITests(APITestCase):
    """Test suite for the user-facing report creation endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for all tests."""
        cls.user = make_regular_user()
        cls.media_owner = make_regular_user()
        cls.post = Posts.objects.create(
            creator=cls.media_owner,
            text="Test post"
        )
        cls.url = reverse("report_content", args=["posts", cls.post.id])

    def test_unauthenticated_cannot_report(self):
        """Test that anonymous users get 403 when reporting."""
        response = self.client.post(
            self.url,
            {"reason": "SPAM", "description": "spammy"},
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_can_report(self):
        """Test that logged-in users can successfully file a report."""
        self.client.login(email=self.user.email, password="userpass")
        response = self.client.post(
            self.url,
            {"reason": "SPAM", "description": "spammy"},
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify the report was created correctly
        report = Report.objects.get(id=response.data["id"])
        self.assertEqual(report.reporter, self.user)
        self.assertEqual(report.content_type.model, "posts")
        self.assertEqual(report.object_id, self.post.id)
        self.assertEqual(report.reason, "SPAM")
        self.assertEqual(report.description, "spammy")

    def test_report_without_description_is_allowed(self):
        """Test that omitting description defaults to empty string."""
        self.client.login(email=self.user.email, password="userpass")
        response = self.client.post(
            self.url,
            {"reason": "INAPPROPRIATE"},
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        report = Report.objects.get(id=response.data["id"])
        self.assertEqual(report.description, "")

    def test_missing_reason_returns_bad_request(self):
        """Test that missing required 'reason' field returns 400 with error."""
        self.client.login(email=self.user.email, password="userpass")
        response = self.client.post(
            self.url,
            {"description": "just because"},
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("reason", response.data)

    def test_invalid_content_type_returns_bad_request(self):
        """Test that reporting with unsupported content_type returns 400."""
        self.client.login(email=self.user.email, password="userpass")
        invalid_url = reverse("report_content", args=["invalid", self.post.id])
        response = self.client.post(
            invalid_url,
            {"reason": "SPAM"},
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)
