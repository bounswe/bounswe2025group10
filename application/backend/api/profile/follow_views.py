from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample

from api.models import Users, Follow


@extend_schema(
    summary="Follow a user",
    description="Follow another user by username. Cannot follow yourself or users already followed.",
    parameters=[
        OpenApiParameter(
            name='username',
            type=str,
            location=OpenApiParameter.PATH,
            required=True,
            description='Username of the user to follow'
        )
    ],
    responses={
        201: OpenApiResponse(
            description="Successfully followed user",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Successfully followed john_doe.',
                        'data': {
                            'username': 'john_doe',
                            'is_following': True
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(description="Cannot follow yourself or already following"),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        404: OpenApiResponse(description="User not found")
    },
    tags=['Profile - Follow']
)
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


@extend_schema(
    summary="Unfollow a user",
    description="Unfollow a user by username. Must be currently following the user.",
    parameters=[
        OpenApiParameter(
            name='username',
            type=str,
            location=OpenApiParameter.PATH,
            required=True,
            description='Username of the user to unfollow'
        )
    ],
    responses={
        200: OpenApiResponse(
            description="Successfully unfollowed user",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Successfully unfollowed john_doe.',
                        'data': {
                            'username': 'john_doe',
                            'is_following': False
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(description="Not following this user"),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        404: OpenApiResponse(description="User not found")
    },
    tags=['Profile - Follow']
)
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


@extend_schema(
    summary="Get user's followers",
    description="Retrieve the complete list of users following a specific user. Returns follower details including username, profile image, bio, and the date they started following.",
    parameters=[
        OpenApiParameter(
            name='username',
            type=str,
            location=OpenApiParameter.PATH,
            required=True,
            description='Username of the user to get followers for'
        )
    ],
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'data': {
                        'type': 'object',
                        'properties': {
                            'username': {'type': 'string'},
                            'followers_count': {'type': 'integer'},
                            'followers': {
                                'type': 'array',
                                'items': {
                                    'type': 'object',
                                    'properties': {
                                        'id': {'type': 'integer'},
                                        'username': {'type': 'string'},
                                        'profile_image': {'type': 'string', 'nullable': True},
                                        'bio': {'type': 'string', 'nullable': True},
                                        'followed_at': {'type': 'string', 'format': 'date-time'}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            description="Followers list retrieved successfully. Returns array of follower objects with their details.",
            examples=[
                OpenApiExample(
                    'Success Response with followers',
                    value={
                        'data': {
                            'username': 'john_doe',
                            'followers_count': 3,
                            'followers': [
                                {
                                    'id': 5,
                                    'username': 'jane_smith',
                                    'profile_image': 'http://localhost:8000/media/users/5/profile.jpg',
                                    'bio': 'Environmental activist',
                                    'followed_at': '2025-11-20T10:30:00Z'
                                },
                                {
                                    'id': 7,
                                    'username': 'eco_warrior',
                                    'profile_image': 'http://localhost:8000/media/users/7/profile.jpg',
                                    'bio': 'Zero waste enthusiast',
                                    'followed_at': '2025-11-21T14:15:00Z'
                                },
                                {
                                    'id': 12,
                                    'username': 'green_living',
                                    'profile_image': None,
                                    'bio': 'Sustainable lifestyle blogger',
                                    'followed_at': '2025-11-22T09:00:00Z'
                                }
                            ]
                        }
                    },
                    response_only=True
                ),
                OpenApiExample(
                    'User with no followers',
                    value={
                        'data': {
                            'username': 'new_user',
                            'followers_count': 0,
                            'followers': []
                        }
                    },
                    response_only=True
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        404: OpenApiResponse(
            description="User not found",
            examples=[
                OpenApiExample(
                    'User not found',
                    value={'error': 'User not found.'}
                )
            ]
        )
    },
    tags=['Profile - Follow']
)
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


@extend_schema(
    summary="Get user's following list",
    description="Retrieve the complete list of users that a specific user is following. Returns details of followed users including username, profile image, bio, and the date the follow relationship was established.",
    parameters=[
        OpenApiParameter(
            name='username',
            type=str,
            location=OpenApiParameter.PATH,
            required=True,
            description='Username of the user to get following list for'
        )
    ],
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'data': {
                        'type': 'object',
                        'properties': {
                            'username': {'type': 'string'},
                            'following_count': {'type': 'integer'},
                            'following': {
                                'type': 'array',
                                'items': {
                                    'type': 'object',
                                    'properties': {
                                        'id': {'type': 'integer'},
                                        'username': {'type': 'string'},
                                        'profile_image': {'type': 'string', 'nullable': True},
                                        'bio': {'type': 'string', 'nullable': True},
                                        'followed_at': {'type': 'string', 'format': 'date-time'}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            description="Following list retrieved successfully. Returns array of followed user objects with their details.",
            examples=[
                OpenApiExample(
                    'Success Response with following',
                    value={
                        'data': {
                            'username': 'john_doe',
                            'following_count': 3,
                            'following': [
                                {
                                    'id': 7,
                                    'username': 'eco_warrior',
                                    'profile_image': 'http://localhost:8000/media/users/7/profile.jpg',
                                    'bio': 'Zero waste lifestyle advocate',
                                    'followed_at': '2025-11-21T14:15:00Z'
                                },
                                {
                                    'id': 9,
                                    'username': 'sustainable_sam',
                                    'profile_image': 'http://localhost:8000/media/users/9/profile.jpg',
                                    'bio': 'Composting expert',
                                    'followed_at': '2025-11-20T08:45:00Z'
                                },
                                {
                                    'id': 15,
                                    'username': 'planet_protector',
                                    'profile_image': None,
                                    'bio': 'Climate activist',
                                    'followed_at': '2025-11-19T16:20:00Z'
                                }
                            ]
                        }
                    },
                    response_only=True
                ),
                OpenApiExample(
                    'User not following anyone',
                    value={
                        'data': {
                            'username': 'new_user',
                            'following_count': 0,
                            'following': []
                        }
                    },
                    response_only=True
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        404: OpenApiResponse(
            description="User not found",
            examples=[
                OpenApiExample(
                    'User not found',
                    value={'error': 'User not found.'}
                )
            ]
        )
    },
    tags=['Profile - Follow']
)
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


@extend_schema(
    summary="Check follow status",
    description="Check if authenticated user is following a specific user, and if that user follows back. Includes follower/following counts.",
    parameters=[
        OpenApiParameter(
            name='username',
            type=str,
            location=OpenApiParameter.PATH,
            required=True,
            description='Username of the user to check'
        )
    ],
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'data': {
                        'type': 'object',
                        'properties': {
                            'username': {'type': 'string'},
                            'is_following': {'type': 'boolean'},
                            'follows_back': {'type': 'boolean'},
                            'followers_count': {'type': 'integer'},
                            'following_count': {'type': 'integer'}
                        }
                    }
                }
            },
            description="Follow status retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'data': {
                            'username': 'john_doe',
                            'is_following': True,
                            'follows_back': False,
                            'followers_count': 150,
                            'following_count': 75
                        }
                    }
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        404: OpenApiResponse(description="User not found")
    },
    tags=['Profile - Follow']
)
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


@extend_schema(
    summary="Get authenticated user's follow statistics",
    description="Retrieve follow statistics (followers and following counts) for the authenticated user.",
    responses={
        200: OpenApiResponse(
            description="Follow statistics retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'data': {
                            'username': 'john_doe',
                            'followers_count': 150,
                            'following_count': 75
                        }
                    }
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required")
    },
    tags=['Profile - Follow']
)
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
