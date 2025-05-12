from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from ..models import Tips
from .tip_serializer import TipSerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_tips(request):
    """
    Get all tips.
    Returns:
        Response with all tips.
    """
    try:
        tips = Tips.objects.all().order_by('-id')
        serializer = TipSerializer(tips, many=True)
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
        serializer = TipSerializer(tips, many=True)
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