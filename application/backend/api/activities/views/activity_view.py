# activities/views.py
from rest_framework import viewsets, permissions, filters, decorators, response, status
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample, OpenApiResponse
from ...models import ActivityEvent
from ..serializers.activity_serializer import ActivityEventSerializer

class ActivityEventPagination(PageNumberPagination):
    """Custom pagination class that allows client to control page size"""
    page_size = 60
    page_size_query_param = 'page_size'
    max_page_size = 100

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
    permission_classes = [permissions.IsAdminUser]
    pagination_class = ActivityEventPagination

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
    @extend_schema(
        summary="Recent activity events (AS2)",
        description=(
            "Returns recent ActivityEvent items as an ActivityStreams 2.0 OrderedCollection.\n\n"
            "Note: `type` is domain-specific (e.g. `create-waste`, `like-post`, `delete-comment`) rather than generic `Create`."
        ),
        parameters=[
            OpenApiParameter(name="limit", type=int, location=OpenApiParameter.QUERY, required=False, description="Max items (default 20, max 200)"),
        ],
        responses={
            200: OpenApiResponse(
                response=ActivityEventSerializer(many=True),
                examples=[
                    OpenApiExample(
                        "AS2 OrderedCollection",
                        value={
                            "@context": "https://www.w3.org/ns/activitystreams",
                            "type": "OrderedCollection",
                            "totalItems": 1,
                            "items": [],
                        },
                        response_only=True,
                    )
                ],
            )
        },
        tags=["Activity"],
    )
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

    def get_paginated_response(self, data):
        """
        Override to return AS2-formatted paginated response instead of DRF default.
        """
        # Use the paginator's page object to get the count
        # The paginator is set by paginate_queryset() in the list() method
        if hasattr(self, 'paginator') and self.paginator is not None:
            try:
                count = self.paginator.page.paginator.count
            except (AttributeError, TypeError):
                count = len(data)
        else:
            count = len(data)
        
        # Return AS2-formatted response
        return response.Response({
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "OrderedCollection",
            "totalItems": count,
            "items": data,
        })

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        total = queryset.count()

        # Try to paginate - this may raise NotFound if page doesn't exist
        # Let DRF handle that naturally, but if pagination succeeds, return AS2 format
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        # No pagination - return AS2 collection
        serializer = self.get_serializer(queryset, many=True)
        data = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "Collection",
            "totalItems": total,
            "items": serializer.data,
        }
        return response.Response(data)


# Provide explicit schema docs for list/retrieve/create/update/delete on the ViewSet.
ActivityEventViewSet = extend_schema_view(
    list=extend_schema(
        summary="List activity events (AS2)",
        description=(
            "Lists ActivityEvent rows as an ActivityStreams 2.0 Collection/OrderedCollection.\n\n"
            "Filter with query params (actor_id, type, object_type, object_id, visibility, published_at__gte/lte).\n"
            "Note: `type` is domain-specific (e.g. `create-waste`, `like-post`, `delete-comment`)."
        ),
        tags=["Activity"],
    ),
    retrieve=extend_schema(
        summary="Retrieve an activity event",
        tags=["Activity"],
    ),
    create=extend_schema(
        summary="Create an activity event",
        description="Admin-only. Creates an ActivityEvent row; `type` should be domain-specific (e.g. `create-waste`).",
        tags=["Activity"],
    ),
    update=extend_schema(
        summary="Update an activity event",
        tags=["Activity"],
    ),
    partial_update=extend_schema(
        summary="Partially update an activity event",
        tags=["Activity"],
    ),
    destroy=extend_schema(
        summary="Delete an activity event",
        tags=["Activity"],
    ),
)(ActivityEventViewSet)
