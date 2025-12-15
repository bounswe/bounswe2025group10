import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import ActivityEvent, Visibility

User = get_user_model()


def make_event(**kwargs) -> ActivityEvent:
    """Helper to create ActivityEvent objects with sensible defaults."""
    now = timezone.now()
    defaults = {
        "as2_json": {"type": "Create", "actor": "u:alice", "object": {"type": "Note", "id": "n:1"}},
        "actor_id": "u:alice",
        "type": "Create",
        "object_type": "Note",
        "object_id": f"note:{uuid.uuid4()}",
        "community_id": None,
        "published_at": now,
        "visibility": Visibility.PUBLIC,
        "summary": "hello world",
    }
    defaults.update(kwargs)
    return ActivityEvent.objects.create(**defaults)


class ActivityEventViewSetTests(APITestCase):
    """Test suite for ActivityEvent ViewSet."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for all tests."""
        # Times for range queries
        cls.t0 = timezone.now() - timedelta(days=2)
        cls.t1 = timezone.now() - timedelta(days=1)
        cls.t2 = timezone.now()

        # Visibility matrix
        cls.ev_public = make_event(
            object_id="note:public",
            visibility=Visibility.PUBLIC,
            published_at=cls.t0,
            summary="public post deploy log",
            actor_id="u:alice",
        )
        cls.ev_unlisted = make_event(
            object_id="note:unlisted",
            visibility=Visibility.UNLISTED,
            published_at=cls.t1,
            summary="unlisted note",
            actor_id="u:bob",
        )
        cls.ev_followers = make_event(
            object_id="note:followers",
            visibility=Visibility.FOLLOWERS,
            published_at=cls.t2 - timedelta(minutes=5),
            summary="followers-only update",
            actor_id="u:alice",
        )
        cls.ev_direct = make_event(
            object_id="note:direct",
            visibility=Visibility.DIRECT,
            published_at=cls.t2,
            summary="direct msg",
            actor_id="u:carol",
        )

        # Extra for pagination & filters
        make_event(object_id="note:extra1", actor_id="u:alice", summary="deployment summary alpha")
        make_event(object_id="note:extra2", actor_id="u:alice", type="Like", summary="liked something")
        make_event(object_id="note:extra3", actor_id="u:dave", summary="random chatter")

        # Test user
        cls.user = User.objects.create_user(
            username="tester",
            email="tester@example.com",
            password="pass1234"
        )

    def url_list(self):
        return reverse("activity-event-list")

    def setUp(self):
        """Set up test fixtures for each test."""
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            username="admin218948",
            email="admin218948@example.com",
            password="adminpass3169"
        )
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)

    def url_list(self):
        """Get the URL for the activity event list endpoint."""
        return reverse("activity-event-list")

    def test_admin_can_access(self):
        """Test that admin can access the activity events endpoint."""
        response = self.client.get("/api/activity-events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_authenticated_sees_all_visibilities(self):
        """Test that authenticated client sees all visibility types."""
        self.client.login(username="tester", password="pass1234")
        response = self.client.get(self.url_list())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data.get("results", response.data.get("items", response.data))
        object_ids = {item["object_id"] for item in data}

        for oid in ["note:public", "note:unlisted", "note:followers", "note:direct"]:
            self.assertIn(oid, object_ids)

    def test_filter_by_actor_id(self):
        """Test filtering activity events by actor ID."""
        response = self.client.get(self.url_list(), {"actor_id": "u:alice"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data.get("results", response.data.get("items", response.data))
        self.assertTrue(len(data) > 0)
        self.assertTrue(all(item["actor_id"] == "u:alice" for item in data))

    def test_filter_by_type(self):
        """Test filtering activity events by type."""
        response = self.client.get(self.url_list(), {"type": "Like"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data.get("results", response.data.get("items", response.data))
        self.assertTrue(len(data) > 0)
        self.assertTrue(all(item["type"] == "Like" for item in data))

    def test_filter_by_time_range(self):
        """Test filtering activity events by time range."""
        response = self.client.get(
            self.url_list(),
            {"published_at__gte": (self.t1 - timedelta(seconds=1)).isoformat()}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data.get("results", response.data.get("items", response.data))
        # All returned items should be >= t1-1s
        for item in data:
            self.assertGreaterEqual(
                timezone.datetime.fromisoformat(item["published_at"].replace("Z", "+00:00")),
                self.t1 - timedelta(seconds=1),
            )

    def test_search_summary(self):
        """Test searching activity events by summary."""
        response = self.client.get(self.url_list(), {"search": "deploy"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data.get("results", response.data.get("items", response.data))
        summaries = " | ".join([item.get("summary", "") for item in data])
        self.assertIn("deploy", summaries.lower())

    def test_ordering_by_published_at_asc(self):
        """Test ordering activity events by published_at ascending."""
        response = self.client.get(self.url_list(), {"ordering": "published_at"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data.get("results", response.data.get("items", response.data))
        dates = [
            timezone.datetime.fromisoformat(item["published_at"].replace("Z", "+00:00"))
            for item in data
        ]
        self.assertEqual(dates, sorted(dates))

    @override_settings(REST_FRAMEWORK={
        "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
        "PAGE_SIZE": 2,
        "DEFAULT_FILTER_BACKENDS": [
            "django_filters.rest_framework.DjangoFilterBackend",
            "rest_framework.filters.SearchFilter",
            "rest_framework.filters.OrderingFilter",
        ],
    })
    def test_pagination_page_size_and_navigation(self):
        """Test pagination with PAGE_SIZE=2."""
        url = self.url_list()
        res1 = self.client.get(url, {"page_size": 2})  # Use query parameter to force page size
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        if "@context" in res1.data:  # AS2 response
           self.assertIn("totalItems", res1.data)
           self.assertIn("items", res1.data)
           # Check that we got at most 2 items on this page
           self.assertLessEqual(len(res1.data["items"]), 2)
        else:  # paginated DRF response
           self.assertIn("count", res1.data)
           self.assertIn("results", res1.data)
           self.assertLessEqual(len(res1.data["results"]), 2)

        # Fetch page 2
        res2 = self.client.get(url, {"page": 2, "page_size": 2})
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        if "@context" in res2.data:  # AS2 response
            self.assertIn("totalItems", res2.data)
            self.assertGreaterEqual(len(res2.data["items"]), 1)
        else:  # paginated DRF response
            self.assertIn("count", res2.data)
            self.assertIn("results", res2.data)

    # -------------------- AS2 COLLECTION SHAPE (non-paginated) --------------------

    @override_settings(REST_FRAMEWORK={
        "DEFAULT_PAGINATION_CLASS": None,
        "DEFAULT_FILTER_BACKENDS": [
            "django_filters.rest_framework.DjangoFilterBackend",
            "rest_framework.filters.SearchFilter",
            "rest_framework.filters.OrderingFilter",
        ],
    })
    def test_as2_collection_envelope_when_not_paginated(self):
        """Test AS2 collection envelope when pagination is disabled."""
        response = self.client.get(self.url_list())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        body = response.data
        self.assertIn("@context", body)
        self.assertIn("type", body)
        self.assertIn("totalItems", body)
        self.assertTrue("items" in body or "orderedItems" in body)

    def test_user_as2(self):
        """Test that a user's activity events are returned in AS2 format."""
        response = self.client.get(self.url_list(), {"username": "alice"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        body = response.data
        self.assertIn("@context", body)
        self.assertIn("type", body)
        self.assertIn("totalItems", body)
        self.assertTrue("items" in body or "orderedItems" in body)
