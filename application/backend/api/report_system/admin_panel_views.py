# admin_panel_views.py
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample

from ..models import Report
from .serializers import (
    ReportReadSerializer,
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


@extend_schema(
    tags=['Reports - Admin'],
    summary="Manage reports (Admin only)",
    description="Admin endpoints for viewing and moderating user reports."
)
class ModerateReportsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    list:   GET /api/admin/reports/
    retrieve: GET /api/admin/reports/{id}/
    moderate: POST /api/admin/reports/{id}/moderate/
    """
    queryset = (
        Report.objects.select_related("reporter", "content_type")
        .order_by("-date_reported")
    )
    serializer_class = ReportReadSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        summary="List all reports",
        description="Retrieve paginated list of all reports with optional filtering by content type and reporter.",
        parameters=[
            OpenApiParameter(
                name='type',
                type=str,
                location=OpenApiParameter.QUERY,
                description='Filter by content type (post, comment, tip, challenge)'
            ),
            OpenApiParameter(
                name='reporter_id',
                type=int,
                location=OpenApiParameter.QUERY,
                description='Filter by reporter user ID'
            ),
            OpenApiParameter(
                name='page',
                type=int,
                location=OpenApiParameter.QUERY,
                description='Page number'
            ),
            OpenApiParameter(
                name='page_size',
                type=int,
                location=OpenApiParameter.QUERY,
                description='Number of items per page (max 100)'
            )
        ],
        responses={
            200: OpenApiResponse(
                response=ReportReadSerializer(many=True),
                description="Reports retrieved successfully"
            ),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Forbidden - admin only")
        }
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Get report details",
        description="Retrieve detailed information about a specific report.",
        responses={
            200: OpenApiResponse(
                response=ReportReadSerializer,
                description="Report details retrieved successfully"
            ),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Forbidden - admin only"),
            404: OpenApiResponse(description="Report not found")
        }
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

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
    @extend_schema(
        summary="Moderate a report",
        description="Perform moderation action on reported content: delete the content, ban the user, or ignore the report.",
        request=ModerationActionSerializer,
        responses={
            200: OpenApiResponse(
                description="Moderation action completed successfully",
                examples=[
                    OpenApiExample(
                        'Delete media',
                        value={'detail': 'Media deleted.'}
                    ),
                    OpenApiExample(
                        'Ban user',
                        value={'detail': 'User 25 deactivated.'}
                    ),
                    OpenApiExample(
                        'Ignore report',
                        value={'detail': 'Report marked as resolved – no action taken.'}
                    )
                ]
            ),
            400: OpenApiResponse(description="Bad request - unable to determine media owner"),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Forbidden - admin only"),
            404: OpenApiResponse(description="Report not found")
        }
    )
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
        # If the reported object *is already* a User, the user is the owner.
        if isinstance(target_obj, User):
            target_owner = target_obj
        elif hasattr(target_obj, "creator_id"):
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
