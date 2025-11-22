from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
from .comment_serializer import CommentSerializer
from ..models import Comments, Posts
from django.utils import timezone
from django.shortcuts import get_object_or_404

@extend_schema(
    summary="Create a comment on a post",
    description="Create a new comment on a specific post. Requires authentication.",
    parameters=[
        OpenApiParameter(
            name='post_id',
            type=int,
            location=OpenApiParameter.PATH,
            required=True,
            description='ID of the post to comment on'
        )
    ],
    request=CommentSerializer,
    responses={
        201: OpenApiResponse(
            response=CommentSerializer,
            description="Comment created successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Comment created successfully',
                        'data': {
                            'id': 1,
                            'content': 'Great post! Very informative.',
                            'date': '2025-11-22T14:30:00Z',
                            'post': 5,
                            'author': 3,
                            'author_username': 'john_doe',
                            'author_profile_image': '/media/users/john_doe.jpg'
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(description="Bad request - missing or invalid comment content"),
        404: OpenApiResponse(description="Post not found"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Comments']
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_comment(request, post_id):
    """
    Create a new comment on a post.
    
    Required POST data:
    - content: str (comment text)
    
    Path parameter:
    - post_id: int (ID of the post to comment on)
    """
    try:
        # Check if post exists
        post = get_object_or_404(Posts, pk=post_id)
        
        # Validate that comment content is provided
        if not request.data.get('content'):
            return Response(
                {'error': 'Comment content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create a new data dictionary with the post ID
        data = {
            'content': request.data.get('content'),
            'post': post_id
        }
        
        serializer = CommentSerializer(data=data)
        
        if serializer.is_valid():
            # Set the author to the current user and the date to now
            serializer.save(author=request.user, date=timezone.now())
            
            return Response({
                'message': 'Comment created successfully',
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
    summary="Get all comments for a post",
    description="Retrieve all comments for a specific post, ordered by date (oldest first). No authentication required.",
    parameters=[
        OpenApiParameter(
            name='post_id',
            type=int,
            location=OpenApiParameter.PATH,
            required=True,
            description='ID of the post to retrieve comments for'
        )
    ],
    responses={
        200: OpenApiResponse(
            response=CommentSerializer(many=True),
            description="Comments retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Comments retrieved successfully',
                        'data': [
                            {
                                'id': 1,
                                'content': 'Great post! Very informative.',
                                'date': '2025-11-22T10:15:00Z',
                                'post': 5,
                                'author': 3,
                                'author_username': 'john_doe',
                                'author_profile_image': '/media/users/john_doe.jpg'
                            },
                            {
                                'id': 2,
                                'content': 'Thanks for sharing this!',
                                'date': '2025-11-22T14:30:00Z',
                                'post': 5,
                                'author': 7,
                                'author_username': 'jane_smith',
                                'author_profile_image': '/media/users/jane_smith.jpg'
                            }
                        ]
                    }
                )
            ]
        ),
        404: OpenApiResponse(description="Post not found"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Comments']
)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_post_comments(request, post_id):
    """
    Get all comments for a specific post.
    
    Path parameter:
    - post_id: int (ID of the post to get comments for)
    """
    try:
        # Check if post exists
        post = get_object_or_404(Posts, pk=post_id)
        
        # Get all comments for the post ordered by date (oldest first)
        comments = Comments.objects.filter(post=post).order_by('date')
        
        serializer = CommentSerializer(comments, many=True)
        
        return Response({
            'message': 'Comments retrieved successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
