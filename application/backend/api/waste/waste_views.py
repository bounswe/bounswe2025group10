from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .waste_serializer import UserWasteSerializer
from django.core.exceptions import ObjectDoesNotExist

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user_waste(request):
    """
    Create a new waste record for the authenticated user.
    
    Required POST data:
    - waste_type: str (PLASTIC, PAPER, GLASS, METAL)
    - amount: float (positive number)
    """
    serializer = UserWasteSerializer(data=request.data)
    
    try:
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({
                'message': 'Waste recorded successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(
            {'error': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    except ObjectDoesNotExist:
        return Response(
            {'error': 'Invalid waste type'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )