from django.db.models import F, Q, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample
from rest_framework.response import Response

from api.models import Posts, Tips, Users
from api.profile.privacy_utils import can_view_waste_stats
from challenges.models import Challenge
from challenges.serializers import ChallengeSerializer


def _active_challenges_queryset():
    """Return challenges that are not completed and not past their deadline."""
    now = timezone.now()
    return Challenge.objects.filter(
        Q(target_amount__isnull=True) | Q(current_progress__lt=F("target_amount"))
    ).filter(Q(deadline__isnull=True) | Q(deadline__gt=now))



@extend_schema(
    summary="Get system-wide statistics",
    description="Aggregate system-wide statistics for tips, posts, challenges, and CO2.",
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'},
                    'data': {
                        'type': 'object',
                        'properties': {
                            'total_tip_count': {'type': 'integer'},
                            'total_post_count': {'type': 'integer'},
                            'total_active_challenges': {'type': 'integer'},
                            'all_challenges': {'type': 'array', 'items': {'type': 'object'}},
                            'total_co2': {'type': 'number', 'format': 'float'},
                        }
                    }
                }
            },
            description="Statistics retrieved successfully.",
            examples=[
                OpenApiExample(
                    'Success',
                    value={
                        'message': 'Statistics retrieved successfully',
                        'data': {
                            'total_tip_count': 123,
                            'total_post_count': 456,
                            'total_active_challenges': 3,
                            'all_challenges': [
                                {
                                    'id': 1,
                                    'title': 'Plastic Free Week',
                                    'description': 'Avoid plastic for a week',
                                    'target_amount': 10,
                                    'current_progress': 5,
                                    'is_public': True,
                                    'reward': 2,
                                    'creator': 1,
                                    'deadline': '2025-12-31T23:59:59Z'
                                }
                            ],
                            'total_co2': 789.1234
                        }
                    },
                    response_only=True
                )
            ]
        ),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=["Statistics"]
)
@api_view(["GET"])
@permission_classes([AllowAny])
def get_system_statistics(request):
    """
    Aggregate system-wide statistics for tips, posts, challenges, and CO2.
    """
    try:
        active_challenges = _active_challenges_queryset()
        total_co2 = Users.objects.aggregate(total=Sum("total_co2"))["total"] or 0

        data = {
            "total_tip_count": Tips.objects.count(),
            "total_post_count": Posts.objects.count(),
            "total_active_challenges": active_challenges.count(),
            "all_challenges": ChallengeSerializer(Challenge.objects.all(), many=True).data,
            "total_co2": round(total_co2, 4),
        }

        return Response(
            {"message": "Statistics retrieved successfully", "data": data},
            status=status.HTTP_200_OK,
        )
    except Exception as exc:  # pragma: no cover - defensive catch for API response
        return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@extend_schema(
    summary="Get statistics for a user",
    description="Aggregate statistics for a specific user. Tip count remains system-wide because tips are not user-owned.",
    parameters=[],
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'},
                    'data': {
                        'type': 'object',
                        'properties': {
                            'username': {'type': 'string'},
                            'total_tip_count': {'type': 'integer'},
                            'total_post_count': {'type': 'integer'},
                            'total_active_challenges': {'type': 'integer'},
                            'challenges': {'type': 'array', 'items': {'type': 'object'}},
                            'total_co2': {'type': ['number', 'null'], 'format': 'float', 'description': 'Visible only if privacy allows'},
                        }
                    }
                }
            },
            description="User statistics retrieved successfully.",
            examples=[
                OpenApiExample(
                    'Success',
                    value={
                        'message': 'User statistics retrieved successfully',
                        'data': {
                            'username': 'john_doe',
                            'total_tip_count': 123,
                            'total_post_count': 45,
                            'total_active_challenges': 2,
                            'challenges': [
                                {
                                    'id': 1,
                                    'title': 'Plastic Free Week',
                                    'description': 'Avoid plastic for a week',
                                    'target_amount': 10,
                                    'current_progress': 5,
                                    'is_public': True,
                                    'reward': 2,
                                    'creator': 1,
                                    'deadline': '2025-12-31T23:59:59Z'
                                }
                            ],
                            'total_co2': 123.4567
                        }
                    },
                    response_only=True
                ),
                OpenApiExample(
                    'CO2 hidden due to privacy',
                    value={
                        'message': 'User statistics retrieved successfully',
                        'data': {
                            'username': 'jane_doe',
                            'total_tip_count': 50,
                            'total_post_count': 10,
                            'total_active_challenges': 1,
                            'challenges': [],
                            'total_co2': None
                        }
                    },
                    response_only=True
                )
            ]
        ),
        404: OpenApiResponse(description="User not found."),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=["Statistics"]
)
@api_view(["GET"])
@permission_classes([AllowAny])
def get_user_statistics(request, username):
    """
    Aggregate statistics for a specific user.
    Tip count remains system-wide because tips are not user-owned.
    """
    try:
        user = Users.objects.get(username=username)
    except Users.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    try:
        user_challenges = Challenge.objects.filter(userchallenge__user=user).distinct()
        active_user_challenges = user_challenges.filter(
            id__in=_active_challenges_queryset().values_list("id", flat=True)
        )

        can_view_co2 = can_view_waste_stats(request.user, user)
        data = {
            "username": user.username,
            "total_tip_count": Tips.objects.count(),
            "total_post_count": Posts.objects.filter(creator=user).count(),
            "total_active_challenges": active_user_challenges.count(),
            "challenges": ChallengeSerializer(user_challenges, many=True).data,
            "total_co2": round(user.total_co2, 4) if can_view_co2 else None,
        }

        return Response(
            {"message": "User statistics retrieved successfully", "data": data},
            status=status.HTTP_200_OK,
        )
    except Exception as exc:  # pragma: no cover - defensive catch for API response
        return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
