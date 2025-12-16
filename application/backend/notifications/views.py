from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from .models import Notification
from .serializers import (
    NotificationSerializer,
    NotificationListResponseSerializer,
    NotificationMarkReadResponseSerializer,
    NotificationMarkAllReadResponseSerializer,
)


class NotificationPagination(PageNumberPagination):
    page_size = 60
    page_size_query_param = "page_size"
    max_page_size = 100


class NotificationListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer
    pagination_class = NotificationPagination

    @extend_schema(
        summary="List notifications",
        description="List notifications for the authenticated user. Supports pagination and filtering unread notifications.",
        parameters=[
            OpenApiParameter(name="page", type=int, location=OpenApiParameter.QUERY, required=False),
            OpenApiParameter(name="page_size", type=int, location=OpenApiParameter.QUERY, required=False),
            OpenApiParameter(name="unread", type=bool, location=OpenApiParameter.QUERY, required=False, description="When true, returns only unread notifications."),
        ],
        responses={200: NotificationListResponseSerializer},
        tags=["Notifications"],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        qs = Notification.objects.filter(user=self.request.user).order_by("-created_at")
        unread = self.request.query_params.get("unread")
        if isinstance(unread, str) and unread.lower() in {"1", "true", "yes"}:
            qs = qs.filter(read=False)
        return qs


class NotificationMarkReadView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    @extend_schema(
        summary="Mark notification as read",
        description="Mark a single notification as read for the authenticated user.",
        parameters=[
            OpenApiParameter(name="notification_id", type=int, location=OpenApiParameter.PATH, required=True),
        ],
        responses={
            200: NotificationMarkReadResponseSerializer,
            404: OpenApiResponse(description="Notification not found"),
        },
        tags=["Notifications"],
    )
    def post(self, request, notification_id: int):
        n = Notification.objects.filter(id=notification_id, user=request.user).first()
        if not n:
            return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        if not n.read:
            n.read = True
            n.save(update_fields=["read"])

        return Response(
            {"message": "Notification marked as read.", "notification": NotificationSerializer(n).data},
            status=status.HTTP_200_OK,
        )


class NotificationMarkAllReadView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationMarkAllReadResponseSerializer

    @extend_schema(
        summary="Mark all notifications as read",
        description="Marks all notifications for the authenticated user as read.",
        responses={200: NotificationMarkAllReadResponseSerializer},
        tags=["Notifications"],
    )
    def post(self, request):
        updated = Notification.objects.filter(user=request.user, read=False).update(read=True)
        return Response(
            {"message": "All notifications marked as read.", "updated_count": updated},
            status=status.HTTP_200_OK,
        )
