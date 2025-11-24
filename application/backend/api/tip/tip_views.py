from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
from ..models import Tips, TipLikes
from .tip_serializer import TipSerializer

@extend_schema(
    summary="Get all tips",
    description="Retrieve all tips with pagination support. Includes user's like/dislike status for each tip.",
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
            response=TipSerializer(many=True),
            description="Tips retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'count': 50,
                        'next': 'http://localhost:8000/api/tips/?page=2',
                        'previous': None,
                        'results': [
                            {
                                'id': 1,
                                'title': 'Reduce Plastic Waste',
                                'description': 'Use reusable bags when shopping',
                                'like_count': 45,
                                'dislike_count': 2,
                                'is_user_liked': True,
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
    tags=['Tips']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])  
def get_all_tips(request):
    """
    Get all tips with pagination.
    Query parameters:
    - page: page number (default: 1)
    - page_size: number of items per page (default: 10, max: 100)
    Returns:
        Response with paginated tips and user's reaction status.
    """
    try:
        tips = Tips.objects.all().order_by('-id')
        
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
        paginated_tips = paginator.paginate_queryset(tips, request)
        serializer = TipSerializer(paginated_tips, many=True, context={'request': request})
        
        # Return paginated response
        return paginator.get_paginated_response(serializer.data)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@extend_schema(
    summary="Get recent tips",
    description="Retrieve the 3 most recent tips. No authentication required.",
    responses={
        200: OpenApiResponse(
            response=TipSerializer(many=True),
            description="Recent tips retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Recent tips retrieved successfully',
                        'data': [
                            {
                                'id': 3,
                                'title': 'Compost at Home',
                                'description': 'Start composting your food scraps',
                                'like_count': 30,
                                'dislike_count': 1,
                                'is_user_liked': False,
                                'is_user_disliked': False
                            },
                            {
                                'id': 2,
                                'title': 'Reusable Water Bottles',
                                'description': 'Always carry a reusable water bottle',
                                'like_count': 55,
                                'dislike_count': 0,
                                'is_user_liked': False,
                                'is_user_disliked': False
                            },
                            {
                                'id': 1,
                                'title': 'Reduce Plastic Waste',
                                'description': 'Use reusable bags when shopping',
                                'like_count': 45,
                                'dislike_count': 2,
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
    tags=['Tips']
)
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

@extend_schema(
    summary="Create a new tip",
    description="Create a new zero waste tip with title and description.",
    request=TipSerializer,
    responses={
        201: OpenApiResponse(
            response=TipSerializer,
            description="Tip created successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Tip created successfully',
                        'data': {
                            'id': 10,
                            'title': 'Energy Saving',
                            'description': 'Turn off lights when not in use',
                            'like_count': 0,
                            'dislike_count': 0,
                            'is_user_liked': False,
                            'is_user_disliked': False
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(description="Bad request - validation errors"),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Tips']
)
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

@extend_schema(
    summary="Like a tip",
    description="Like a tip. Toggles like if already liked. If previously disliked, changes to like.",
    parameters=[
        OpenApiParameter(
            name='tip_id',
            type=int,
            location=OpenApiParameter.PATH,
            required=True,
            description='ID of the tip to like'
        )
    ],
    responses={
        200: OpenApiResponse(
            response=TipSerializer,
            description="Tip liked successfully (or like removed if already liked)",
            examples=[
                OpenApiExample(
                    'Like added',
                    value={
                        'message': 'Tip liked successfully',
                        'data': {
                            'id': 1,
                            'title': 'Reduce Plastic Waste',
                            'description': 'Use reusable bags when shopping',
                            'like_count': 46,
                            'dislike_count': 2,
                            'is_user_liked': True,
                            'is_user_disliked': False
                        }
                    }
                ),
                OpenApiExample(
                    'Like removed',
                    value={
                        'message': 'Like removed successfully',
                        'data': {
                            'id': 1,
                            'title': 'Reduce Plastic Waste',
                            'description': 'Use reusable bags when shopping',
                            'like_count': 45,
                            'dislike_count': 2,
                            'is_user_liked': False,
                            'is_user_disliked': False
                        }
                    }
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        404: OpenApiResponse(description="Tip not found"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Tips']
)
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

@extend_schema(
    summary="Dislike a tip",
    description="Dislike a tip. Toggles dislike if already disliked. If previously liked, changes to dislike.",
    parameters=[
        OpenApiParameter(
            name='tip_id',
            type=int,
            location=OpenApiParameter.PATH,
            required=True,
            description='ID of the tip to dislike'
        )
    ],
    responses={
        200: OpenApiResponse(
            response=TipSerializer,
            description="Tip disliked successfully (or dislike removed if already disliked)",
            examples=[
                OpenApiExample(
                    'Dislike added',
                    value={
                        'message': 'Tip disliked successfully',
                        'data': {
                            'id': 1,
                            'title': 'Reduce Plastic Waste',
                            'description': 'Use reusable bags when shopping',
                            'like_count': 45,
                            'dislike_count': 3,
                            'is_user_liked': False,
                            'is_user_disliked': True
                        }
                    }
                ),
                OpenApiExample(
                    'Dislike removed',
                    value={
                        'message': 'Dislike removed successfully',
                        'data': {
                            'id': 1,
                            'title': 'Reduce Plastic Waste',
                            'description': 'Use reusable bags when shopping',
                            'like_count': 45,
                            'dislike_count': 2,
                            'is_user_liked': False,
                            'is_user_disliked': False
                        }
                    }
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        404: OpenApiResponse(description="Tip not found"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Tips']
)
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
                    'message': 'Dislike removed successfully',
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

