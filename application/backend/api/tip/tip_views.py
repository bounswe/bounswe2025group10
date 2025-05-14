from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ..models import Tips, TipLikes
from .tip_serializer import TipSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])  
def get_all_tips(request):
    """
    Get all tips.
    Returns:
        Response with all tips and user's reaction status.
    """
    try:
        tips = Tips.objects.all().order_by('-id')
        serializer = TipSerializer(tips, many=True, context={'request': request})
        return Response({
            'message': 'Tips retrieved successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_recent_tips(request):
    """
    Get 3 most recent tips.
    Returns:
        Response with 3 most recent tips.
    """
    try:
        tips = Tips.objects.all().order_by('-id')[:3]
        serializer = TipSerializer(tips, many=True, context={'request': request})
        return Response({
            'message': 'Recent tips retrieved successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_tip(request):
    """
    Create a new tip.
    Returns:
        Response with created tip data.
    """
    try:
        serializer = TipSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Tip created successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_tip(request, tip_id):
    """
    Like a tip.
    Returns:
        Response with updated tip data.
    """
    try:
        tip = get_object_or_404(Tips, id=tip_id)
          # Check if user already has any reaction to this tip
        existing_reaction = TipLikes.objects.filter(user=request.user, tip=tip).first()
        
        if existing_reaction:
            if existing_reaction.reaction_type == 'LIKE':
                # User already liked this tip, so remove the like (toggle behavior)
                existing_reaction.delete()
                
                # Update tip counter
                if tip.like_count > 0:
                    tip.like_count -= 1
                    tip.save()
                
                return Response({
                    'message': 'Like removed successfully',
                    'data': TipSerializer(tip).data
                }, status=status.HTTP_200_OK)
            else:
                # User previously disliked, now changing to like
                existing_reaction.reaction_type = 'LIKE'
                existing_reaction.date = timezone.now()
                existing_reaction.save()
                
                # Update tip counters
                if tip.dislike_count > 0:
                    tip.dislike_count -= 1
                tip.like_count += 1
                tip.save()
        else:
            # Create new like
            TipLikes.objects.create(
                user=request.user,
                tip=tip,
                reaction_type='LIKE',
                date=timezone.now()
            )
            
            # Update tip counter
            tip.like_count += 1
            tip.save()
        
        serializer = TipSerializer(tip, context={'request': request})
        return Response({
            'message': 'Tip liked successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dislike_tip(request, tip_id):
    """
    Dislike a tip.
    Returns:
        Response with updated tip data.
    """
    try:
        tip = get_object_or_404(Tips, id=tip_id)
        
        # Check if user already has any reaction to this tip
        existing_reaction = TipLikes.objects.filter(user=request.user, tip=tip).first()
        
        if existing_reaction:
            if existing_reaction.reaction_type == 'DISLIKE':
                # User already disliked this tip, so remove the dislike (toggle behavior)
                existing_reaction.delete()
                
                # Update tip counter
                if tip.dislike_count > 0:
                    tip.dislike_count -= 1
                    tip.save()
                
                return Response({
                    'message': 'Disike removed successfully',
                    'data': TipSerializer(tip).data
                }, status=status.HTTP_200_OK)
            else:
                # User previously liked, now changing to dislike
                existing_reaction.reaction_type = 'DISLIKE'
                existing_reaction.date = timezone.now()
                existing_reaction.save()
                
                # Update tip counters
                if tip.like_count > 0:
                    tip.like_count -= 1
                tip.dislike_count += 1
                tip.save()
        else:
            # Create new dislike
            TipLikes.objects.create(
                user=request.user,
                tip=tip,
                reaction_type='DISLIKE',
                date=timezone.now()
            )
            
            # Update tip counter
            tip.dislike_count += 1
            tip.save()
        
        serializer = TipSerializer(tip, context={'request': request})
        return Response({
            'message': 'Tip disliked successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

