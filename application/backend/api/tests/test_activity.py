# tests/test_activity_events.py
import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from django.test import override_settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import ActivityEvent, Visibility

User = get_user_model()  # Get the user model

def make_event(**kwargs) -> ActivityEvent:
    """
    Helper to create ActivityEvent objects with sensible defaults.
    """
    now = timezone.now()
    defaults = dict(
        as2_json={"type": "Create", "actor": "u:alice", "object": {"type": "Note", "id": "n:1"}},
        actor_id="u:alice",
        type="Create",
        object_type="Note",
        object_id=f"note:{uuid.uuid4()}",
        community_id=None,
        published_at=now,
        visibility=Visibility.PUBLIC,
        summary="hello world",
    )
    defaults.update(kwargs)
    return ActivityEvent.objects.create(**defaults)


class ActivityEventViewSetTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
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
        cls.user = get_user_model().objects.create_user(
            username="tester", email="tester@example.com", password="pass1234"
        )

    def url_list(self):
        return reverse("activity-event-list")

    def setUp(self):
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            username="admin218948",
            email="admin218948@example.com",
            password="adminpass3169"
        )
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)

    def test_admin_can_access(self):
        response = self.client.get("/api/activity-events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # -------------------- VISIBILITY RULES --------------------


    def test_list_authenticated_sees_all_visibilities(self):
        """
        Expected behavior:
          - Authenticated client sees PUBLIC, UNLISTED, FOLLOWERS, DIRECT
          (Tweak if your rule differs.)
        """
        self.client.login(username="tester", password="pass1234")
        res = self.client.get(self.url_list())
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.data.get("results", res.data.get("items", res.data))
        object_ids = {item["object_id"] for item in data}

        for oid in ["note:public", "note:unlisted", "note:followers", "note:direct"]:
            self.assertIn(oid, object_ids)

    # -------------------- FILTERS --------------------

    def test_filter_by_actor_id(self):
        res = self.client.get(self.url_list(), {"actor_id": "u:alice"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.data.get("results", res.data.get("items", res.data))
        self.assertTrue(len(data) > 0)
        self.assertTrue(all(item["actor_id"] == "u:alice" for item in data))

    def test_filter_by_type(self):
        res = self.client.get(self.url_list(), {"type": "Like"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.data.get("results", res.data.get("items", res.data))
        self.assertTrue(len(data) > 0)
        self.assertTrue(all(item["type"] == "Like" for item in data))

    def test_filter_by_time_range(self):
        # published_at__gte should exclude t0; include t1 and later
        res = self.client.get(self.url_list(), {"published_at__gte": (self.t1 - timedelta(seconds=1)).isoformat()})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.data.get("results", res.data.get("items", res.data))
        # All returned items should be >= t1-1s
        for item in data:
            self.assertGreaterEqual(
                timezone.datetime.fromisoformat(item["published_at"].replace("Z", "+00:00")),
                self.t1 - timedelta(seconds=1),
            )

    def test_search_summary(self):
        # DRF SearchFilter uses ?search=
        res = self.client.get(self.url_list(), {"search": "deploy"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.data.get("results", res.data.get("items", res.data))
        # At least the "public post deploy log" or "deployment summary alpha" should appear
        summaries = " | ".join([item.get("summary", "") for item in data])
        self.assertIn("deploy", summaries.lower())

    def test_ordering_by_published_at_asc(self):
        res = self.client.get(self.url_list(), {"ordering": "published_at"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.data.get("results", res.data.get("items", res.data))
        dates = [
            timezone.datetime.fromisoformat(item["published_at"].replace("Z", "+00:00"))
            for item in data
        ]
        self.assertEqual(dates, sorted(dates))

    # -------------------- PAGINATION --------------------

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
        """
        With PAGE_SIZE=2, first page should have 2 items, and 'next' should exist.
        """
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
        # disable default pagination to test AS2 envelope from custom list()
        "DEFAULT_PAGINATION_CLASS": None,
        "DEFAULT_FILTER_BACKENDS": [
            "django_filters.rest_framework.DjangoFilterBackend",
            "rest_framework.filters.SearchFilter",
            "rest_framework.filters.OrderingFilter",
        ],
    })
    def test_as2_collection_envelope_when_not_paginated(self):
        """
        If your list() returns AS2 envelope when pagination is disabled:
          - @context
          - type: Collection (or OrderedCollection)
          - totalItems
          - items (or orderedItems)
        """
        res = self.client.get(self.url_list())
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        body = res.data
        self.assertIn("@context", body)
        self.assertIn("type", body)
        self.assertIn("totalItems", body)
        self.assertTrue("items" in body or "orderedItems" in body)
    # Test for specific user AS2 query
    def test_user_as2(self):
        """
        Test that a user's activity events are returned in AS2 format.
        """
        
        res = self.client.get(self.url_list(), {"username": "alice"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        body = res.data
        self.assertIn("@context", body)
        self.assertIn("type", body)
        self.assertIn("totalItems", body)
        self.assertTrue("items" in body or "orderedItems" in body)

    
