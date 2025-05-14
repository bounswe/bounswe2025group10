from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .post_serializer import PostSerializer
from ..models import Posts, Comments, PostLikes, SavedPosts
from django.utils import timezone
from django.shortcuts import get_object_or_404
from ..comment.comment_serializer import CommentSerializer
from django.db import transaction

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request):
    """
    Create a new post.
    
    Required POST data:
    - text: str (optional if image is provided)
    - image: str (optional if text is provided)
    """
    try:        # Validate that at least text or image is provided
        if not request.data.get('text') and not request.data.get('image'):
            return Response(
                {'error': 'At least text or image must be provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = PostSerializer(data=request.data, context={'request': request})
        
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

@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_posts(request):
    """
    Get all posts ordered by most recent first.
    """
    try:
        posts = Posts.objects.all().order_by('-date')
        serializer = PostSerializer(posts, many=True, context={'request': request})
        
        return Response({
            'message': 'Posts retrieved successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
