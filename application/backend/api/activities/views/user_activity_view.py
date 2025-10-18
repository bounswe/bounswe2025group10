# api/activities/views/user_activity_events_view.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status,permissions

from django.contrib.auth import get_user_model
from ...models import ActivityEvent
from ..serializers.activity_serializer import ActivityEventSerializer

User = get_user_model()

class UserActivityEventsView(APIView):
    """
    POST endpoint to fetch ActivityEvents belonging to a specified user.
    - Must be authenticated
    - Expects 'username' in POST data (optional: defaults to current user)
    """
    permission_classes = [permissions.IsAdminUser]

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