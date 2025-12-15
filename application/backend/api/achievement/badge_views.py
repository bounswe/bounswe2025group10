"""
Views for the badge system
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Count
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample

from api.models import Users, Badges, UserBadges
from api.achievement.badge_serializer import (
    BadgeSerializer,
    AllBadgesResponseSerializer,
    GetBadgeProgressResponseSerializer,
    GetUserBadgeSummaryResponseSerializer,
    GetUserBadgesResponseSerializer,
    LeaderboardResponseSerializer,
    ManualCheckBadgesResponseSerializer,
)
from api.utils.badge_system import (
    check_and_award_badges, get_user_progress_towards_next_badge,
    get_user_badges_by_category
)
from api.profile.privacy_utils import can_view_waste_stats



@extend_schema(
    summary="Get user badges",
    description="Retrieve all badges earned by a specific user or the authenticated user (subject to privacy/anonymity). Returns badges organized by category.",
    parameters=[
        OpenApiParameter(
            name='user_id',
            type=int,
            location=OpenApiParameter.PATH,
            description='ID of the user to retrieve badges for. If not provided, returns badges for the authenticated user.',
            required=False
        )
    ],
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'user_id': {'type': 'integer'},
                    'username': {'type': 'string'},
                    'total_badges': {'type': 'integer'},
                    'badges_by_category': {
                        'type': 'object',
                        'additionalProperties': {
                            'type': 'array',
                            'items': {
                                'type': 'object',
                                'properties': {
                                    'id': {'type': 'integer'},
                                    'category': {'type': 'string'},
                                    'level': {'type': 'integer'},
                                    'criteria_value': {'type': 'number', 'format': 'float'},
                                    'earned_at': {'type': 'string', 'format': 'date-time'}
                                }
                            }
                        }
                    }
                }
            },
            description="Badges retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'user_id': 1,
                        'username': 'john_doe',
                        'total_badges': 5,
                        'badges_by_category': {
                            'PLASTIC': [
                                {
                                    'id': 1,
                                    'category': 'PLASTIC',
                                    'level': 1,
                                    'criteria_value': 1000.0,
                                    'earned_at': '2024-12-13T10:30:00Z'
                                }
                            ],
                            'TOTAL_WASTE': [
                                {
                                    'id': 36,
                                    'category': 'TOTAL_WASTE',
                                    'level': 1,
                                    'criteria_value': 5000.0,
                                    'earned_at': '2024-12-13T11:00:00Z'
                                }
                            ]
                        }
                    }
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        404: OpenApiResponse(description="User not found")
    },
    tags=['Badges']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_badges(request, user_id=None):
    """
    Get all badges earned by a user.
    If user_id is not provided, return badges for the authenticated user.
    """
    if user_id:
        user = get_object_or_404(Users, id=user_id)
    else:
        user = request.user

    if user.id != request.user.id and not can_view_waste_stats(request.user, user):
        return Response({
            'user_id': user.id,
            'username': user.username,
            'total_badges': 0,
            'badges_by_category': {}
        }, status=status.HTTP_200_OK)
    
    badges_by_category = get_user_badges_by_category(user)
    total_badges = sum(len(badges) for badges in badges_by_category.values())
    
    return Response({
        'user_id': user.id,
        'username': user.username,
        'total_badges': total_badges,
        'badges_by_category': badges_by_category
    }, status=status.HTTP_200_OK)


@extend_schema(
    summary="Get badge progress",
    description="Get the authenticated user's progress towards the next badge in each category. Shows current progress and what's needed for the next level.",
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'user_id': {'type': 'integer'},
                    'username': {'type': 'string'},
                    'progress': {
                        'type': 'object',
                        'additionalProperties': {
                            'type': 'object',
                            'properties': {
                                'current_value': {'type': 'number', 'format': 'float'},
                                'required_value': {'type': ['number', 'null'], 'format': 'float'},
                                'percentage': {'type': 'number', 'format': 'float'},
                                'next_badge': {
                                    'type': ['object', 'null'],
                                    'properties': {
                                        'id': {'type': 'integer'},
                                        'category': {'type': 'string'},
                                        'level': {'type': 'integer'}
                                    }
                                },
                                'all_earned': {'type': 'boolean'}
                            }
                        }
                    }
                }
            },
            description="Progress retrieved successfully",
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required")
    },
    tags=['Badges']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_badge_progress(request):
    """
    Get authenticated user's progress towards next badges in all categories.
    """
    user = request.user
    progress = get_user_progress_towards_next_badge(user)
    
    return Response({
        'user_id': user.id,
        'username': user.username,
        'progress': progress
    }, status=status.HTTP_200_OK)


@extend_schema(
    summary="Get user badge summary",
    description="Get a complete summary of a user's badges including earned badges organized by category and progress towards next badges.",
    parameters=[
        OpenApiParameter(
            name='user_id',
            type=int,
            location=OpenApiParameter.PATH,
            description='ID of the user to retrieve badge summary for. If not provided, returns summary for the authenticated user.',
            required=False
        )
    ],
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'user_id': {'type': 'integer'},
                    'username': {'type': 'string'},
                    'total_badges': {'type': 'integer'},
                    'badges_by_category': {
                        'type': 'object',
                        'additionalProperties': {
                            'type': 'array',
                            'items': {
                                'type': 'object',
                                'properties': {
                                    'id': {'type': 'integer'},
                                    'category': {'type': 'string'},
                                    'level': {'type': 'integer'},
                                    'criteria_value': {'type': 'number', 'format': 'float'},
                                    'earned_at': {'type': 'string', 'format': 'date-time'}
                                }
                            }
                        }
                    },
                    'progress': {
                        'type': 'object',
                        'additionalProperties': {
                            'type': 'object',
                            'properties': {
                                'current_value': {'type': 'number', 'format': 'float'},
                                'required_value': {'type': ['number', 'null'], 'format': 'float'},
                                'percentage': {'type': 'number', 'format': 'float'},
                                'next_badge': {
                                    'type': ['object', 'null'],
                                    'properties': {
                                        'id': {'type': 'integer'},
                                        'category': {'type': 'string'},
                                        'level': {'type': 'integer'}
                                    }
                                },
                                'all_earned': {'type': 'boolean'}
                            }
                        }
                    }
                }
            },
            description="Badge summary retrieved successfully",
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        404: OpenApiResponse(description="User not found")
    },
    tags=['Badges']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_badge_summary(request, user_id=None):
    """
    Get a complete summary of user's badges including earned badges and progress.
    """
    if user_id:
        user = get_object_or_404(Users, id=user_id)
    else:
        user = request.user

    if user.id != request.user.id and not can_view_waste_stats(request.user, user):
        return Response({
            'user_id': user.id,
            'username': user.username,
            'total_badges': 0,
            'badges_by_category': {},
            'progress': {},
        }, status=status.HTTP_200_OK)
    
    badges_by_category = get_user_badges_by_category(user)
    progress = get_user_progress_towards_next_badge(user)
    total_badges = sum(len(badges) for badges in badges_by_category.values())
    
    return Response({
        'user_id': user.id,
        'username': user.username,
        'total_badges': total_badges,
        'badges_by_category': badges_by_category,
        'progress': progress
    }, status=status.HTTP_200_OK)


@extend_schema(
    summary="Get all available badges",
    description="Retrieve all badges available in the system. Can be filtered by category using query parameter.",
    parameters=[
        OpenApiParameter(
            name='category',
            type=str,
            location=OpenApiParameter.QUERY,
            description='Filter badges by category (PLASTIC, PAPER, GLASS, METAL, ELECTRONIC, OIL_AND_FATS, ORGANIC, TOTAL_WASTE, CONTRIBUTIONS, LIKES_RECEIVED)',
            required=False,
            enum=['PLASTIC', 'PAPER', 'GLASS', 'METAL', 'ELECTRONIC', 'OIL_AND_FATS', 'ORGANIC', 'TOTAL_WASTE', 'CONTRIBUTIONS', 'LIKES_RECEIVED']
        )
    ],
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'count': {'type': 'integer'},
                    'badges': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'id': {'type': 'integer'},
                                'category': {'type': 'string'},
                                'category_display': {'type': 'string'},
                                'level': {'type': 'integer'},
                                'level_display': {'type': 'string'},
                                'criteria_value': {'type': 'number', 'format': 'float'},
                                'description': {'type': 'string'}
                            }
                        }
                    }
                }
            },
            description="Badges retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'count': 50,
                        'badges': [
                            {
                                'id': 1,
                                'category': 'PLASTIC',
                                'category_display': 'Plastic Recycler',
                                'level': 1,
                                'level_display': 'Bronze',
                                'criteria_value': 1000.0,
                                'description': 'Recycle 1000g of plastic waste'
                            },
                            {
                                'id': 2,
                                'category': 'PLASTIC',
                                'category_display': 'Plastic Recycler',
                                'level': 2,
                                'level_display': 'Silver',
                                'criteria_value': 5000.0,
                                'description': 'Recycle 5000g of plastic waste'
                            }
                        ]
                    }
                )
            ]
        )
    },
    tags=['Badges']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_badges(request):
    """
    Get all available badges in the system.
    Can be filtered by category using query parameter.
    """
    category = request.query_params.get('category', None)
    
    if category:
        badges = Badges.objects.filter(category=category).order_by('level')
    else:
        badges = Badges.objects.all().order_by('category', 'level')
    
    serializer = BadgeSerializer(badges, many=True)
    
    return Response({
        'count': badges.count(),
        'badges': serializer.data
    }, status=status.HTTP_200_OK)


@extend_schema(
    summary="Manually check and award badges",
    description="Manually trigger badge checking for the authenticated user. Useful for retroactively awarding badges after manual data corrections or debugging. Returns newly awarded badges.",
    request=None,
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'user_id': {'type': 'integer'},
                    'username': {'type': 'string'},
                    'newly_awarded_count': {'type': 'integer'},
                    'newly_awarded_badges': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'id': {'type': 'integer'},
                                'category': {'type': 'string'},
                                'category_display': {'type': 'string'},
                                'level': {'type': 'integer'},
                                'level_display': {'type': 'string'},
                                'criteria_value': {'type': 'number', 'format': 'float'},
                                'description': {'type': 'string'}
                            }
                        }
                    }
                }
            },
            description="Badge check completed successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'user_id': 1,
                        'username': 'john_doe',
                        'newly_awarded_count': 2,
                        'newly_awarded_badges': [
                            {
                                'id': 1,
                                'category': 'PLASTIC',
                                'category_display': 'Plastic Recycler',
                                'level': 1,
                                'level_display': 'Bronze',
                                'criteria_value': 1000.0,
                                'description': 'Recycle 1000g of plastic waste'
                            },
                            {
                                'id': 36,
                                'category': 'TOTAL_WASTE',
                                'category_display': 'Waste Warrior',
                                'level': 1,
                                'level_display': 'Bronze',
                                'criteria_value': 5000.0,
                                'description': 'Recycle 5000g of total waste'
                            }
                        ]
                    }
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required")
    },
    tags=['Badges']
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def manually_check_badges(request):
    """
    Manually trigger badge checking for the authenticated user.
    Useful for retroactively awarding badges or debugging.
    """
    user = request.user
    newly_awarded = check_and_award_badges(user)
    
    return Response({
        'user_id': user.id,
        'username': user.username,
        'newly_awarded_count': len(newly_awarded),
        'newly_awarded_badges': BadgeSerializer(newly_awarded, many=True).data
    }, status=status.HTTP_200_OK)


@extend_schema(
    summary="Get badge leaderboard",
    description="Retrieve the badge leaderboard showing top 50 users with the most badges. Users with zero badges are excluded.",
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'leaderboard': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'user_id': {'type': 'integer'},
                                'username': {'type': 'string'},
                                'profile_image_url': {'type': ['string', 'null']},
                                'badge_count': {'type': 'integer'}
                            }
                        }
                    }
                }
            },
            description="Leaderboard retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'leaderboard': [
                            {
                                'user_id': 1,
                                'username': 'john_doe',
                                'profile_image_url': '/media/users/john.jpg',
                                'badge_count': 15
                            },
                            {
                                'user_id': 2,
                                'username': 'jane_smith',
                                'profile_image_url': '/media/users/jane.jpg',
                                'badge_count': 12
                            },
                            {
                                'user_id': 3,
                                'username': 'eco_warrior',
                                'profile_image_url': None,
                                'badge_count': 10
                            }
                        ]
                    }
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required")
    },
    tags=['Badges']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_leaderboard(request):
    """
    Get badge leaderboard showing users with most badges.
    """
    # Get users with badge counts
    users_with_badges = Users.objects.annotate(
        badge_count=Count('user_badges')
    ).filter(
        badge_count__gt=0
    ).order_by('-badge_count')[:50]  # Top 50 users
    
    leaderboard_data = []
    for user in users_with_badges:
        leaderboard_data.append({
            'user_id': user.id,
            'username': user.username,
            'profile_image_url': user.profile_image_url,
            'badge_count': user.badge_count,
        })
    
    return Response({
        'leaderboard': leaderboard_data
    }, status=status.HTTP_200_OK)
