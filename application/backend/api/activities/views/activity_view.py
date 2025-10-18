# activities/views.py
from rest_framework import viewsets, permissions, filters, decorators, response, status
from django_filters.rest_framework import DjangoFilterBackend
from ..models.activity_model import ActivityEvent
from ..serializers.activity_serializer import ActivityEventSerializer

class ActivityEventViewSet(viewsets.ModelViewSet):
    """
    CRUD + list with:
      - Filtering: actor_id, type, object_type, object_id, community_id, visibility,
                   published_at__gte, published_at__lte
      - Search: summary
      - Ordering: published_at (default newest first), actor_id, type
    """
    queryset = ActivityEvent.objects.all().order_by("-published_at")
    serializer_class = ActivityEventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        "actor_id": ["exact"],
        "type": ["exact"],
        "object_type": ["exact"],
        "object_id": ["exact"],
        "community_id": ["exact", "isnull"],
        "visibility": ["exact"],
        "published_at": ["gte", "lte"],  # ?published_at__gte=...&published_at__lte=...
    }
    search_fields = ["summary"]
    ordering_fields = ["published_at", "actor_id", "type"]
    ordering = ["-published_at"]

    @decorators.action(methods=["get"], detail=False, url_path="recent")
    def recent(self, request):
        """
        Shortcut: /activity-events/recent/?limit=50
        """
        limit = int(request.query_params.get("limit", 20))
        qs = self.get_queryset()[: max(1, min(limit, 200))]
        page = self.paginate_queryset(qs)
        if page is not None:
            ser = self.get_serializer(page, many=True)
            return self.get_paginated_response(ser.data)
        ser = self.get_serializer(qs, many=True)
        return response.Response(ser.data, status=status.HTTP_200_OK)