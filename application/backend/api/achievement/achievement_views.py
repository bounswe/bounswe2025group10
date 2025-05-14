from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from ..models import Users, UserAchievements
from .achievement_serializer import UserAchievementSerializer

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
