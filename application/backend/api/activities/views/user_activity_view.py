# api/activities/views/user_activity_events_view.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status,permissions
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample

from django.contrib.auth import get_user_model
from ...models import ActivityEvent
from ..serializers.activity_serializer import ActivityEventSerializer
from ..serializers.user_activity_serializers import (
    UserActivityEventsRequestSerializer,
    AS2ActivityCollectionSerializer,
)

User = get_user_model()

class UserActivityEventsView(APIView):
    """
    POST endpoint to fetch ActivityEvents belonging to a specified user.
    - Must be authenticated
    - Expects 'username' in POST data (optional: defaults to current user)
    """
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(
        summary="Get a user's activity feed (AS2)",
        description=(
            "Returns an ActivityStreams 2.0 Collection of ActivityEvent items for the given user.\n\n"
            "Note: `type` is domain-specific (e.g. `create-waste`, `like-post`, `delete-comment`) rather than generic `Create`."
        ),
        request=UserActivityEventsRequestSerializer,
        responses={
            200: OpenApiResponse(
                response=AS2ActivityCollectionSerializer,
                examples=[
                    OpenApiExample(
                        "Success",
                        value={
                            "@context": "https://www.w3.org/ns/activitystreams",
                            "type": "Collection",
                            "totalItems": 2,
                            "items": [
                                {
                                    "id": "00000000-0000-0000-0000-000000000000",
                                    "as2_json": {
                                        "@context": "https://www.w3.org/ns/activitystreams",
                                        "type": "create-waste",
                                        "actor": "john_doe",
                                        "object": {"type": "UserWaste", "id": "123"},
                                        "to": ["https://www.w3.org/ns/activitystreams#Public"],
                                        "cc": [],
                                        "published": "2025-12-15T12:00:00Z",
                                    },
                                    "actor_id": "john_doe",
                                    "type": "create-waste",
                                    "object_type": "UserWaste",
                                    "object_id": "123",
                                    "community_id": None,
                                    "published_at": "2025-12-15T12:00:00Z",
                                    "visibility": "public",
                                    "summary": "User john_doe logged waste of amount 1.0 kg",
                                }
                            ],
                        },
                        response_only=True,
                    )
                ],
            ),
            404: OpenApiResponse(description="User not found"),
        },
        tags=["Activity"],
    )
    def post(self, request):
        username = request.data.get("username")

        # Default to current user if no username provided
        if not username:
            user = request.user
        else:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return Response(
                    {"error": f"User '{username}' not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # Fetch ActivityEvents belonging to this user
        events = ActivityEvent.objects.filter(actor_id=user.username).order_by("-published_at")

        serializer = ActivityEventSerializer(events, many=True)
        data = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "Collection",
            "totalItems": len(serializer.data),
            "items": serializer.data,
        }
        return Response(data, status=status.HTTP_200_OK)
