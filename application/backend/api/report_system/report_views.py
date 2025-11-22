from django.contrib.contenttypes.models import ContentType
from rest_framework import status, permissions
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample

from ..models import Report
from .serializers import ReportCreateSerializer

@extend_schema(
    summary="Report content",
    description="Report inappropriate content (post, comment, tip, challenge) by content type and object ID.",
    parameters=[
        OpenApiParameter(
            name='content_type',
            type=str,
            location=OpenApiParameter.PATH,
            required=True,
            description='Type of content to report (e.g., post, comment, tip, challenge)'
        ),
        OpenApiParameter(
            name='object_id',
            type=int,
            location=OpenApiParameter.PATH,
            required=True,
            description='ID of the content object to report'
        )
    ],
    request=ReportCreateSerializer,
    responses={
        201: OpenApiResponse(
            response=ReportCreateSerializer,
            description="Report created successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'id': 10,
                        'content_type': 'post',
                        'object_id': 25,
                        'reason': 'spam',
                        'description': 'This post contains spam content',
                        'date_reported': '2025-11-22T14:30:00Z'
                    }
                )
            ]
        ),
        400: OpenApiResponse(description="Bad request - unsupported content type or invalid data"),
        401: OpenApiResponse(description="Unauthorized - authentication required")
    },
    tags=['Reports']
)
class ReportCreateView(GenericAPIView):
    """
    POST /api/<content_type>/<object_id>/report/
    """
    serializer_class = ReportCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, content_type, object_id):
        # 1) validate that this content_type exists
        try:
            ct = ContentType.objects.get(model=content_type)
        except ContentType.DoesNotExist:
            return Response(
                {"detail": f"Unsupported content type '{content_type}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2) bind the URL params + body into serializer data
        data = {
            "content_type": content_type,
            "object_id": object_id,
            "reason": request.data.get("reason"),
            "description": request.data.get("description", ""),
        }
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        # 3) save with reporter set to the current user
        serializer.save(reporter=request.user)

        return Response(serializer.data, status=status.HTTP_201_CREATED)