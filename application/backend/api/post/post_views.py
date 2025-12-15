import os
from datetime import datetime
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.pagination import PageNumberPagination
from django.conf import settings
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
from .post_serializer import PostSerializer
from ..models import Posts, Comments, PostLikes, SavedPosts
from django.utils import timezone
from django.shortcuts import get_object_or_404
from ..comment.comment_serializer import CommentSerializer
from django.db import transaction

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


#function to send real-time notification via channels
def send_realtime_notification(user_id, message, notif_id, created_at):
    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        f"user_{user_id}",
        {
            "type": "notify",
            "data": {
                "id": notif_id,
                "message": message,
                "created_at": created_at.isoformat(),
                "read": False
            }
        }
    )

@extend_schema(
    summary="Create a new post",
    description="Create a post with text and/or image. At least one must be provided. Image must be JPEG/PNG and max 5MB.",
    request={
        'multipart/form-data': {
            'type': 'object',
            'properties': {
                'text': {'type': 'string', 'description': 'Post text content'},
                'image': {'type': 'string', 'format': 'binary', 'description': 'Post image (JPEG/PNG, max 5MB)'}
            }
        }
    },
    responses={
        201: OpenApiResponse(
            response=PostSerializer,
            description="Post created successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Post created successfully',
                        'data': {
                            'id': 10,
                            'text': 'My first zero waste post!',
                            'image': 'posts/3/post_20251122_143000.jpg',
                            'image_url': 'http://localhost:8000/media/posts/3/post_20251122_143000.jpg',
                            'date': '2025-11-22T14:30:00Z',
                            'creator': 3,
                            'creator_username': 'john_doe',
                            'creator_profile_image': '/media/users/john_doe.jpg',
                            'like_count': 0,
                            'dislike_count': 0,
                            'is_saved': False,
                            'is_user_liked': False,
                            'is_user_disliked': False
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(description="Bad request - missing text/image or invalid file"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Posts']
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def create_post(request):
    """
    Create a new post.
    
    Request should include:
    - text: str (optional if image is provided)
    - image: File object (optional if text is provided)
    """
    try:
        # Validate that at least text or image is provided
        if not request.data.get('text') and 'image' not in request.FILES:
            return Response(
                {'error': 'At least text or image must be provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle image upload if provided
        image_path = None
        if 'image' in request.FILES:
            image = request.FILES['image']
            
            # Validate file type
            allowed_types = ['image/jpeg', 'image/png', 'image/jpg']
            if image.content_type not in allowed_types:
                return Response({
                    'error': 'Invalid file type. Only JPEG and PNG files are allowed.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate file size (max 5MB)
            if image.size > 5 * 1024 * 1024:
                return Response({
                    'error': 'File too large. Maximum size is 5MB.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create post-specific directory
            post_directory = os.path.join('posts', str(request.user.id))
            full_directory = os.path.join(settings.MEDIA_ROOT, post_directory)
            os.makedirs(full_directory, exist_ok=True)
            
            # Generate unique filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            file_extension = os.path.splitext(image.name)[1].lower()
            filename = f'post_{timestamp}{file_extension}'
            
            # Full path for the new file
            filepath = os.path.join(post_directory, filename)
            full_filepath = os.path.join(settings.MEDIA_ROOT, filepath)
            
            # Save the file
            with open(full_filepath, 'wb+') as destination:
                for chunk in image.chunks():
                    destination.write(chunk)
                    
            image_path = filepath.replace('\\', '/')  # Use forward slashes for URLs
        
        # Prepare data for serializer
        post_data = {
            'text': request.data.get('text', ''),
            'image': image_path
        }
        
        serializer = PostSerializer(data=post_data, context={'request': request})
        
        if serializer.is_valid():
            # Set the creator to the current user and the date to now
            serializer.save(creator=request.user, date=timezone.now())
            
            return Response({
                'message': 'Post created successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        return Response(
            {'error': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@extend_schema(
    summary="Get all posts",
    description="Retrieve all posts ordered by most recent first with pagination support. If a post creator enabled anonymization, `creator_username` will contain an anonymous identifier and `creator_profile_image` may be null.",
    parameters=[
        OpenApiParameter(
            name='page',
            type=int,
            location=OpenApiParameter.QUERY,
            description='Page number (default: 1)'
        ),
        OpenApiParameter(
            name='page_size',
            type=int,
            location=OpenApiParameter.QUERY,
            description='Number of items per page (default: 60, max: 60)'
        )
    ],
    responses={
        200: OpenApiResponse(
            response=PostSerializer(many=True),
            description="Posts retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'count': 150,
                        'next': 'http://localhost:8000/api/posts/?page=2',
                        'previous': None,
                        'results': [
                            {
                                'id': 10,
                                'text': 'Latest post about recycling',
                                'image': 'posts/3/post_20251122_143000.jpg',
                                'image_url': 'http://localhost:8000/media/posts/3/post_20251122_143000.jpg',
                                'date': '2025-11-22T14:30:00Z',
                                'creator': 3,
                                'creator_username': 'john_doe',
                                'creator_profile_image': '/media/users/john_doe.jpg',
                                'like_count': 15,
                                'dislike_count': 2,
                                'is_saved': False,
                                'is_user_liked': False,
                                'is_user_disliked': False
                            }
                        ]
                    }
                )
            ]
        ),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Posts']
)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_posts(request):
    """
    Get all posts ordered by most recent first with pagination.
    Query parameters:
    - page: page number (default: 1)
    - page_size: number of items per page (default: 10, max: 100)
    """
    try:
        posts = Posts.objects.all().order_by('-date')
        
        # Initialize paginator
        paginator = PageNumberPagination()
        
        # Allow custom page size via query parameter
        page_size = request.query_params.get('page_size', 60)
        try:
            page_size = int(page_size)
            # Limit max page size to prevent abuse
            if page_size > 60:
                page_size = 60
            elif page_size < 1:
                page_size = 60
        except (ValueError, TypeError):
            page_size = 10
            
        paginator.page_size = page_size
        
        # Paginate the queryset
        paginated_posts = paginator.paginate_queryset(posts, request)
        serializer = PostSerializer(paginated_posts, many=True, context={'request': request})
        
        # Provide unified response shape expected by tests/clients
        pagination_meta = {
            'count': paginator.page.paginator.count if hasattr(paginator, 'page') else len(posts),
            'next': paginator.get_next_link(),
            'previous': paginator.get_previous_link(),
            'page_size': paginator.page_size,
        }

        return Response({
            'message': 'Posts retrieved successfully',
            'data': serializer.data,
            'pagination': pagination_meta
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@extend_schema(
    summary="Get post details",
    description="Retrieve detailed information about a specific post, including comments and user reaction if authenticated. If a user enabled anonymization, username fields (`creator_username`/`author_username`) may contain an anonymous identifier and profile image fields may be null.",
    parameters=[
        OpenApiParameter(
            name='post_id',
            type=int,
            location=OpenApiParameter.PATH,
            required=True,
            description='ID of the post to retrieve'
        )
    ],
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'},
                    'data': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'integer'},
                            'text': {'type': 'string'},
                            'image': {'type': 'string'},
                            'image_url': {'type': 'string'},
                            'date': {'type': 'string', 'format': 'date-time'},
                            'creator': {'type': 'integer'},
                            'creator_username': {'type': 'string'},
                            'creator_profile_image': {'type': 'string', 'nullable': True},
                            'like_count': {'type': 'integer'},
                            'dislike_count': {'type': 'integer'},
                            'is_saved': {'type': 'boolean'},
                            'is_user_liked': {'type': 'boolean'},
                            'is_user_disliked': {'type': 'boolean'},
                            'user_reaction': {'type': 'string', 'nullable': True},
                            'comments': {
                                'type': 'array',
                                'items': {
                                    'type': 'object',
                                    'properties': {
                                        'id': {'type': 'integer'},
                                        'content': {'type': 'string'},
                                        'date': {'type': 'string', 'format': 'date-time'},
                                        'author': {'type': 'integer'},
                                        'author_username': {'type': 'string'},
                                        'author_profile_image': {'type': 'string', 'nullable': True}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            description="Post details retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Post retrieved successfully',
                        'data': {
                            'id': 10,
                            'text': 'Great recycling tips!',
                            'image': 'posts/3/post_20251122_143000.jpg',
                            'image_url': 'http://localhost:8000/media/posts/3/post_20251122_143000.jpg',
                            'date': '2025-11-22T14:30:00Z',
                            'creator': 3,
                            'creator_username': 'john_doe',
                            'creator_profile_image': '/media/users/john_doe.jpg',
                            'like_count': 15,
                            'dislike_count': 2,
                            'is_saved': True,
                            'is_user_liked': True,
                            'is_user_disliked': False,
                            'user_reaction': 'LIKE',
                            'comments': [
                                {
                                    'id': 1,
                                    'content': 'Thanks for sharing!',
                                    'date': '2025-11-22T15:00:00Z',
                                    'author': 5,
                                    'author_username': 'jane_smith',
                                    'author_profile_image': '/media/users/jane_smith.jpg'
                                }
                            ]
                        }
                    }
                )
            ]
        ),
        404: OpenApiResponse(description="Post not found"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Posts']
)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_post_detail(request, post_id):
    """
    Get details of a specific post, including its comments.
    If user is authenticated, also includes their reaction to the post.
    """
    try:
        post = get_object_or_404(Posts, pk=post_id)
        post_serializer = PostSerializer(post, context={'request': request})
        
        # Get comments for the post
        comments = Comments.objects.filter(post=post).order_by('date')
        comments_serializer = CommentSerializer(comments, many=True)
        
        # Combine post and comments data
        response_data = post_serializer.data
        response_data['comments'] = comments_serializer.data
        
        # If user is authenticated, get their reaction to the post
        if request.user.is_authenticated:
            user_reaction = PostLikes.objects.filter(user=request.user, post=post).first()
            if user_reaction:
                response_data['user_reaction'] = user_reaction.reaction_type
            else:
                response_data['user_reaction'] = None
        
        return Response({
            'message': 'Post retrieved successfully',
            'data': response_data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@extend_schema(
    summary="Get current user's posts",
    description="Retrieve all posts created by the authenticated user, ordered by most recent first.",
    responses={
        200: OpenApiResponse(
            response=PostSerializer(many=True),
            description="User posts retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'User posts retrieved successfully',
                        'data': [
                            {
                                'id': 10,
                                'text': 'My latest post',
                                'image': 'posts/3/post_20251122_143000.jpg',
                                'image_url': 'http://localhost:8000/media/posts/3/post_20251122_143000.jpg',
                                'date': '2025-11-22T14:30:00Z',
                                'creator': 3,
                                'creator_username': 'john_doe',
                                'creator_profile_image': '/media/users/john_doe.jpg',
                                'like_count': 10,
                                'dislike_count': 1,
                                'is_saved': False,
                                'is_user_liked': False,
                                'is_user_disliked': False
                            }
                        ]
                    }
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Posts']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_posts(request):
    """
    Get all posts by the currently authenticated user.
    """
    try:
        posts = Posts.objects.filter(creator=request.user).order_by('-date')
        serializer = PostSerializer(posts, many=True, context={'request': request})
        
        return Response({
            'message': 'User posts retrieved successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@extend_schema(
    summary="Like a post",
    description="Like a post. Toggles like if already liked. If previously disliked, changes to like.",
    parameters=[
        OpenApiParameter(
            name='post_id',
            type=int,
            location=OpenApiParameter.PATH,
            required=True,
            description='ID of the post to like'
        )
    ],
    responses={
        200: OpenApiResponse(
            response=PostSerializer,
            description="Post liked successfully (or like removed if already liked)",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Post liked successfully',
                        'data': {
                            'id': 10,
                            'text': 'Great post!',
                            'like_count': 16,
                            'dislike_count': 2,
                            'is_user_liked': True,
                            'is_user_disliked': False
                        }
                    }
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        404: OpenApiResponse(description="Post not found"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Posts']
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_post(request, post_id):
    """
    Like a post.
    
    This endpoint will:
    1. Create a like record if one doesn't exist
    2. Update the like if the user previously disliked the post
    3. Remove the like if the user already liked the post (toggle behavior)
    """
    try:
        post = get_object_or_404(Posts, pk=post_id)
        
        # Check if user already reacted to this post
        with transaction.atomic():
            user_reaction = PostLikes.objects.filter(user=request.user, post=post).first()
            
            if user_reaction:
                if user_reaction.reaction_type == 'LIKE':
                    # User already liked this post, so remove the like (toggle behavior)
                    user_reaction.delete()
                    
                    # Update post counter
                    if post.like_count > 0:
                        post.like_count -= 1
                        post.save()
                    
                    return Response({
                        'message': 'Like removed successfully',
                        'data': PostSerializer(post, context={'request': request}).data
                    }, status=status.HTTP_200_OK)
                
                # User previously disliked, so update to like and adjust counts
                user_reaction.reaction_type = 'LIKE'
                user_reaction.date = timezone.now()
                user_reaction.save()
                
                post.dislike_count = max(0, post.dislike_count - 1)
                post.like_count += 1
                post.save()
            else:                # Create new like
                PostLikes.objects.create(
                    user=request.user,
                    post=post,
                    reaction_type='LIKE',
                    date=timezone.now()
                )

                #create notification for post creator
                if post.creator != request.user:
                    from ...notifications.models import Notification
                    notif_message = f"{request.user.username} liked your post."
                    notif = Notification.objects.create(
                        user=post.creator,
                        message=notif_message,
                        created_at=timezone.now(),
                        read=False
                    )
                    #send real-time notification
                    send_realtime_notification(
                        user_id=post.creator.id,
                        message=notif_message,
                        notif_id=notif.id,
                        created_at=notif.created_at
                    )
                
                post.like_count += 1
                post.save()
        
        serializer = PostSerializer(post, context={'request': request})
        return Response({
            'message': 'Post liked successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@extend_schema(
    summary="Dislike a post",
    description="Dislike a post. Toggles dislike if already disliked. If previously liked, changes to dislike.",
    parameters=[
        OpenApiParameter(
            name='post_id',
            type=int,
            location=OpenApiParameter.PATH,
            required=True,
            description='ID of the post to dislike'
        )
    ],
    responses={
        200: OpenApiResponse(
            response=PostSerializer,
            description="Post disliked successfully (or dislike removed if already disliked)",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Post disliked successfully',
                        'data': {
                            'id': 10,
                            'text': 'Some post',
                            'like_count': 15,
                            'dislike_count': 3,
                            'is_user_liked': False,
                            'is_user_disliked': True
                        }
                    }
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        404: OpenApiResponse(description="Post not found"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Posts']
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dislike_post(request, post_id):
    """
    Dislike a post.
    
    This endpoint will:
    1. Create a dislike record if one doesn't exist
    2. Update the dislike if the user previously liked the post
    3. Remove the dislike if the user already disliked the post (toggle behavior)
    """
    try:
        post = get_object_or_404(Posts, pk=post_id)
        
        # Check if user already reacted to this post
        with transaction.atomic():
            user_reaction = PostLikes.objects.filter(user=request.user, post=post).first()
            
            if user_reaction:
                if user_reaction.reaction_type == 'DISLIKE':
                    # User already disliked this post, so remove the dislike (toggle behavior)
                    user_reaction.delete()
                    
                    # Update post counter
                    if post.dislike_count > 0:
                        post.dislike_count -= 1
                        post.save()
                    
                    return Response({
                        'message': 'Dislike removed successfully',
                        'data': PostSerializer(post, context={'request': request}).data
                    }, status=status.HTTP_200_OK)
                
                # User previously liked, so update to dislike and adjust counts
                user_reaction.reaction_type = 'DISLIKE'
                user_reaction.date = timezone.now()
                user_reaction.save()
                
                post.like_count = max(0, post.like_count - 1)
                post.dislike_count += 1
                post.save()
            else:
                # Create new dislike
                PostLikes.objects.create(
                    user=request.user,
                    post=post,
                    reaction_type='DISLIKE',
                    date=timezone.now()
                )
                post.dislike_count += 1
                post.save()
        
        serializer = PostSerializer(post, context={'request': request})
        return Response({
            'message': 'Post disliked successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@extend_schema(
    summary="Get user's reaction to a post",
    description="Retrieve the current user's reaction (like/dislike) to a specific post. Returns reaction type (LIKE/DISLIKE) and date if user has reacted, or null if no reaction exists.",
    parameters=[
        OpenApiParameter(
            name='post_id',
            type=int,
            location=OpenApiParameter.PATH,
            required=True,
            description='ID of the post to check reaction for'
        )
    ],
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'},
                    'data': {
                        'type': 'object',
                        'properties': {
                            'post_id': {'type': 'integer'},
                            'reaction_type': {'type': 'string', 'enum': ['LIKE', 'DISLIKE', None], 'nullable': True},
                            'date': {'type': 'string', 'format': 'date-time', 'nullable': True}
                        }
                    }
                }
            },
            description="User reaction retrieved successfully",
            examples=[
                OpenApiExample(
                    'Liked post',
                    value={
                        'message': 'User reaction retrieved successfully',
                        'data': {
                            'post_id': 10,
                            'reaction_type': 'LIKE',
                            'date': '2025-11-22T14:30:00Z'
                        }
                    },
                    response_only=True
                ),
                OpenApiExample(
                    'No reaction',
                    value={
                        'message': 'User reaction retrieved successfully',
                        'data': {
                            'post_id': 10,
                            'reaction_type': None
                        }
                    },
                    response_only=True
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        404: OpenApiResponse(description="Post not found"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Posts']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_reaction(request, post_id):
    """
    Get the current user's reaction (like/dislike) to a post
    """
    try:
        post = get_object_or_404(Posts, pk=post_id)
        user_reaction = PostLikes.objects.filter(user=request.user, post=post).first()
        
        if user_reaction:
            reaction_data = {
                'post_id': post_id,
                'reaction_type': user_reaction.reaction_type,
                'date': user_reaction.date
            }
        else:
            reaction_data = {
                'post_id': post_id,
                'reaction_type': None
            }
        
        return Response({
            'message': 'User reaction retrieved successfully',
            'data': reaction_data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@extend_schema(
    summary="Save a post",
    description="Add a post to the current user's saved posts collection.",
    parameters=[
        OpenApiParameter(
            name='post_id',
            type=int,
            location=OpenApiParameter.PATH,
            required=True,
            description='ID of the post to save'
        )
    ],
    responses={
        201: OpenApiResponse(
            response=PostSerializer,
            description="Post saved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Post saved successfully',
                        'data': {
                            'id': 10,
                            'text': 'Saved post',
                            'is_saved': True
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(description="Post is already saved"),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        404: OpenApiResponse(description="Post not found"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Posts']
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_post(request, post_id):
    """
    Save a post to the current user's saved posts.
    """
    try:
        post = get_object_or_404(Posts, pk=post_id)
        
        # Check if the post is already saved
        saved_post, created = SavedPosts.objects.get_or_create(
            user=request.user,
            post=post
        )
        
        if not created:
            return Response(
                {'error': 'Post is already saved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Pass the request in the context to handle is_saved field
        serializer = PostSerializer(post, context={'request': request})
        return Response({
            'message': 'Post saved successfully',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@extend_schema(
    summary="Unsave a post",
    description="Remove a post from the current user's saved posts collection.",
    parameters=[
        OpenApiParameter(
            name='post_id',
            type=int,
            location=OpenApiParameter.PATH,
            required=True,
            description='ID of the post to unsave'
        )
    ],
    responses={
        200: OpenApiResponse(
            response=PostSerializer,
            description="Post removed from saved posts",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Post removed from saved posts',
                        'data': {
                            'id': 10,
                            'text': 'Unsaved post',
                            'is_saved': False
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(description="Post is not saved"),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        404: OpenApiResponse(description="Post not found"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Posts']
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unsave_post(request, post_id):
    """
    Remove a post from the current user's saved posts.
    """
    try:
        post = get_object_or_404(Posts, pk=post_id)
        
        # Check if the post is saved
        saved_post = SavedPosts.objects.filter(
            user=request.user,
            post=post
        ).first()
        
        if not saved_post:
            return Response(
                {'error': 'Post is not saved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove the saved post
        saved_post.delete()
        
        # Pass the request in the context to handle is_saved field
        serializer = PostSerializer(post, context={'request': request})
        return Response({
            'message': 'Post removed from saved posts',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@extend_schema(
    summary="Get saved posts",
    description="Retrieve all posts saved by the current user, ordered by most recently saved.",
    responses={
        200: OpenApiResponse(
            response=PostSerializer(many=True),
            description="Saved posts retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Saved posts retrieved successfully',
                        'data': [
                            {
                                'id': 10,
                                'text': 'My saved post',
                                'image_url': 'http://localhost:8000/media/posts/3/post_20251122_143000.jpg',
                                'date': '2025-11-22T14:30:00Z',
                                'creator_username': 'john_doe',
                                'like_count': 20,
                                'dislike_count': 1,
                                'is_saved': True
                            }
                        ]
                    }
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Posts']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_saved_posts(request):
    """
    Get all posts saved by the current user.
    """
    try:
        # Get all saved post ids for the current user
        saved_post_ids = SavedPosts.objects.filter(
            user=request.user
        ).values_list('post_id', flat=True).order_by('-date_saved')
        
        # Get the actual posts
        saved_posts = Posts.objects.filter(id__in=saved_post_ids)
        
        # Preserve the order from saved_post_ids
        # This is needed because the SQL join might not preserve the order
        saved_posts_ordered = sorted(
            saved_posts,
            key=lambda x: list(saved_post_ids).index(x.id)
        )
        
        serializer = PostSerializer(
            saved_posts_ordered, 
            many=True, 
            context={'request': request}
        )
        
        return Response({
            'message': 'Saved posts retrieved successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    summary="Get top liked posts",
    description="Retrieve the top 5 posts with the highest number of likes.",
    responses={
        200: OpenApiResponse(
            response=PostSerializer(many=True),
            description="Top liked posts retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Top liked posts retrieved successfully',
                        'data': [
                            {
                                'id': 10,
                                'text': 'Most popular post',
                                'image_url': 'http://localhost:8000/media/posts/3/post_20251122_143000.jpg',
                                'date': '2025-11-22T14:30:00Z',
                                'creator_username': 'john_doe',
                                'like_count': 150,
                                'dislike_count': 5,
                                'is_saved': False
                            }
                        ]
                    }
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Posts']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_top_liked_posts(request):
    """
    Get top 5 posts with the highest number of likes.
    """
    try:
        top_posts = Posts.objects.all().order_by('-like_count')[:5]
        serializer = PostSerializer(top_posts, many=True, context={'request': request})
        
        return Response({
            'message': 'Top liked posts retrieved successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
