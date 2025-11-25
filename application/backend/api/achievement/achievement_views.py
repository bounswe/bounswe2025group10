from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample

from ..models import Users, UserAchievements
from .achievement_serializer import UserAchievementSerializer

@extend_schema(
    summary="Get user achievements",
    description="Retrieve all achievements earned by a user. If username is provided, returns that user's achievements. Otherwise, returns authenticated user's achievements.",
    parameters=[
        OpenApiParameter(
            name='username',
            type=str,
            location=OpenApiParameter.PATH,
            required=False,
            description='Username of the user whose achievements to retrieve. If omitted, returns authenticated user achievements.'
        )
    ],
    responses={
        200: OpenApiResponse(
            response=UserAchievementSerializer(many=True),
            description="Achievements retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'User achievements retrieved successfully',
                        'data': {
                            'username': 'john_doe',
                            'achievements': [
                                {
                                    'id': 1,
                                    'achievement': {
                                        'id': 1,
                                        'title': 'Eco Warrior',
                                        'description': 'Complete first recycling challenge',
                                        'icon': 'eco_warrior.png'
                                    },
                                    'earned_at': '2025-11-20T10:30:00Z'
                                }
                            ]
                        }
                    }
                )
            ]
        ),
        404: OpenApiResponse(description="User not found"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Achievements']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_achievements(request, username=None):
    """
    Get all achievements earned by a user.
    
    If username is provided, returns that user's achievements.
    If no username is provided, returns the authenticated user's achievements.
    
    Returns:
        Response with user achievement data.
    """
    try:
        # Determine which user's achievements to fetch
        if username:
            user = get_object_or_404(Users, username=username)
        else:
            user = request.user
            
        # Get all achievements for the user
        user_achievements = UserAchievements.objects.filter(user=user).order_by('-earned_at')
        
        # Serialize the achievements
        serializer = UserAchievementSerializer(user_achievements, many=True)
        
        return Response({
            'message': 'User achievements retrieved successfully',
            'data': {
                'username': user.username,
                'achievements': serializer.data
            }
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
