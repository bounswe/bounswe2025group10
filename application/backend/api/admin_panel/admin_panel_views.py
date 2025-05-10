# admin_panel_views.py
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from ..models import Report
from .admin_panel_serializer import (
    ReportSerializer,
    ModerationActionSerializer,
)

User = get_user_model()


class StandardResultsSetPagination(PageNumberPagination):
    """
    Default page size is 20, override with ?page_size=N (max 100).
    """
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class ReportViewSet(viewsets.ReadOnlyModelViewSet):
    """
    list:   GET /api/admin/reports/
    retrieve: GET /api/admin/reports/{id}/
    moderate: POST /api/admin/reports/{id}/moderate/
    """
    queryset = (
        Report.objects.select_related("reporter", "content_type")
        .order_by("-date_reported")
    )
    serializer_class = ReportSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """
        Optional filtering:
        ?type=post/comment/challenge/tip  – filter by content_type
        ?reporter_id=xx                   – filter by reporter
        """
        qs = super().get_queryset()
        ctype = self.request.query_params.get("type")
        reporter_id = self.request.query_params.get("reporter_id")

        if ctype:
            qs = qs.filter(content_type__model__iexact=ctype)
        if reporter_id:
            qs = qs.filter(reporter_id=reporter_id)
        return qs

    # ----------------------------- Moderation ---------------------------------
    @action(detail=True, methods=["post"], url_path="moderate")
    def moderate(self, request, pk=None):
        """
        Perform a moderation action on the report’s target object or owner.

        Body:
        {
            "action": "delete_media" | "ban_user" | "ignore"
        }
        """
        report = self.get_object()
        serializer = ModerationActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action_type = serializer.validated_data["action"]

        target_obj = report.content_object
        target_owner = None

        # figure out the owner (creator/author/user field names differ)
        if hasattr(target_obj, "creator_id"):
            target_owner = getattr(target_obj, "creator", None)
        elif hasattr(target_obj, "author_id"):
            target_owner = getattr(target_obj, "author", None)
        elif hasattr(target_obj, "user_id"):
            target_owner = getattr(target_obj, "user", None)

        # Perform requested action
        if action_type == "delete_media":
            target_obj.delete()
            detail = "Media deleted."
        elif action_type == "ban_user":
            if target_owner:
                target_owner.is_active = False
                target_owner.save(update_fields=["is_active"])
                detail = f"User {target_owner.id} deactivated."
            else:
                return Response(
                    {"detail": "Unable to determine media owner."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:  # ignore
            detail = "Report marked as resolved – no action taken."

        # delete or mark report as handled
        report.delete()

        return Response({"detail": detail}, status=status.HTTP_200_OK)