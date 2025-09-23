from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .comment_serializer import CommentSerializer
from ..models import Comments, Posts
from django.utils import timezone
from django.shortcuts import get_object_or_404

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
