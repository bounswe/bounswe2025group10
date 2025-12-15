from django.core.paginator import EmptyPage
from rest_framework import permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse, OpenApiExample
from django.contrib.auth import get_user_model

from api.models import ActivityEvent, Follow
from api.activities.serializers.activity_serializer import ActivityEventSerializer

User = get_user_model()

class FollowingActivityEventsPagination(PageNumberPagination):
    page_size = 60
    page_size_query_param = "page_size"
    max_page_size = 100


class FollowingActivityEventsView(APIView):
    """
    Aggregated activity feed for users the requester follows.
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get activity feed for followed users (AS2)",
        description=(
            "Returns an ActivityStreams 2.0 OrderedCollection of ActivityEvent items created by users "
            "the authenticated user follows.\n\n"
            "Notes:\n"
            "- `type` is domain-specific (e.g. `create-waste`, `like-post`, `delete-comment`).\n"
            "- Events with `visibility=direct` are excluded.\n"
            "- Results are ordered newest first and paginated."
        ),
        parameters=[
            OpenApiParameter(name="page", type=int, location=OpenApiParameter.QUERY, required=False, description="Page number"),
            OpenApiParameter(name="page_size", type=int, location=OpenApiParameter.QUERY, required=False, description="Items per page (default 60, max 100)"),
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
            ),
        },
        tags=["Activity"],
    )
    def get(self, request):
        following_ids = Follow.objects.filter(follower=request.user).values_list("following_id", flat=True)
        following_usernames = list(
            User.objects.filter(id__in=following_ids).values_list("username", flat=True)
        )

        qs = (
            ActivityEvent.objects.filter(actor_id__in=following_usernames)
            .exclude(visibility="direct")
            .order_by("-published_at")
        )

        paginator = FollowingActivityEventsPagination()
        try:
            page = paginator.paginate_queryset(qs, request)
        except EmptyPage:
            page = []

        serializer = ActivityEventSerializer(page, many=True)

        total = qs.count()
        return Response(
            {
                "@context": "https://www.w3.org/ns/activitystreams",
                "type": "OrderedCollection",
                "totalItems": total,
                "items": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
