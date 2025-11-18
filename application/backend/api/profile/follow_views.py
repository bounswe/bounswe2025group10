from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from api.models import Users, Follow


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def follow_user(request, username):
    """
    Follow a user by username.
    
    POST /api/profile/<username>/follow/
    
    Returns:
        - 201: Successfully followed the user
        - 400: Cannot follow yourself or already following
        - 404: User not found
    """
    if request.user.username == username:
        return Response({
            'error': 'You cannot follow yourself.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user_to_follow = Users.objects.get(username=username)
    except Users.DoesNotExist:
        return Response({
            'error': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if already following
    existing_follow = Follow.objects.filter(
        follower=request.user,
        following=user_to_follow
    ).first()
    
    if existing_follow:
        return Response({
            'error': 'You are already following this user.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create follow relationship
    Follow.objects.create(
        follower=request.user,
        following=user_to_follow
    )
    
    return Response({
        'message': f'Successfully followed {username}.',
        'data': {
            'username': username,
            'is_following': True
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unfollow_user(request, username):
    """
    Unfollow a user by username.
    
    POST /api/profile/<username>/unfollow/
    
    Returns:
        - 200: Successfully unfollowed the user
        - 400: Not following this user
        - 404: User not found
    """
    try:
        user_to_unfollow = Users.objects.get(username=username)
    except Users.DoesNotExist:
        return Response({
            'error': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if following
    follow_relationship = Follow.objects.filter(
        follower=request.user,
        following=user_to_unfollow
    ).first()
    
    if not follow_relationship:
        return Response({
            'error': 'You are not following this user.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Delete follow relationship
    follow_relationship.delete()
    
    return Response({
        'message': f'Successfully unfollowed {username}.',
        'data': {
            'username': username,
            'is_following': False
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_followers(request, username):
    """
    Get list of followers for a specific user.
    
    GET /api/profile/<username>/followers/
    
    Returns:
        - 200: List of followers with their details
        - 404: User not found
    """
    try:
        user = Users.objects.get(username=username)
    except Users.DoesNotExist:
        return Response({
            'error': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Get all followers
    followers = Follow.objects.filter(following=user).select_related('follower')
    
    followers_data = [
        {
            'id': f.follower.id,
            'username': f.follower.username,
            'profile_image': f.follower.profile_image_url,
            'bio': f.follower.bio,
            'followed_at': f.created_at.isoformat()
        }
        for f in followers
    ]
    
    return Response({
        'data': {
            'username': username,
            'followers_count': len(followers_data),
            'followers': followers_data
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_following(request, username):
    """
    Get list of users that a specific user is following.
    
    GET /api/profile/<username>/following/
    
    Returns:
        - 200: List of users being followed with their details
        - 404: User not found
    """
    try:
        user = Users.objects.get(username=username)
    except Users.DoesNotExist:
        return Response({
            'error': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Get all users being followed
    following = Follow.objects.filter(follower=user).select_related('following')
    
    following_data = [
        {
            'id': f.following.id,
            'username': f.following.username,
            'profile_image': f.following.profile_image_url,
            'bio': f.following.bio,
            'followed_at': f.created_at.isoformat()
        }
        for f in following
    ]
    
    return Response({
        'data': {
            'username': username,
            'following_count': len(following_data),
            'following': following_data
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_follow_status(request, username):
    """
    Check if the authenticated user is following a specific user.
    
    GET /api/profile/<username>/follow-status/
    
    Returns:
        - 200: Follow status information
        - 404: User not found
    """
    try:
        user = Users.objects.get(username=username)
    except Users.DoesNotExist:
        return Response({
            'error': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if authenticated user is following this user
    is_following = Follow.objects.filter(
        follower=request.user,
        following=user
    ).exists()
    
    # Check if this user is following the authenticated user back
    follows_back = Follow.objects.filter(
        follower=user,
        following=request.user
    ).exists()
    
    # Get counts
    followers_count = Follow.objects.filter(following=user).count()
    following_count = Follow.objects.filter(follower=user).count()
    
    return Response({
        'data': {
            'username': username,
            'is_following': is_following,
            'follows_back': follows_back,
            'followers_count': followers_count,
            'following_count': following_count
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_follow_stats(request):
    """
    Get follow statistics for the authenticated user.
    
    GET /api/profile/follow-stats/
    
    Returns:
        - 200: Follow statistics including followers and following counts
    """
    user = request.user
    
    followers_count = Follow.objects.filter(following=user).count()
    following_count = Follow.objects.filter(follower=user).count()
    
    return Response({
        'data': {
            'username': user.username,
            'followers_count': followers_count,
            'following_count': following_count
        }
    }, status=status.HTTP_200_OK)
