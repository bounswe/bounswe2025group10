from django.contrib.contenttypes.models import ContentType
from rest_framework import status, permissions
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response

from ..models import Report
from .serializers import ReportCreateSerializer

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