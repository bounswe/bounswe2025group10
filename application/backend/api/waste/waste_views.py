from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .waste_serializer import UserWasteSerializer
from django.core.exceptions import ObjectDoesNotExist
from ..models import UserWastes, Waste, Users, UserAchievements
from challenges.models import UserChallenge
from django.db.models import Sum, F
import requests


# Point coefficients for different waste types
point_coefficients = {
    'PLASTIC': 0.03,  # 3 points per 100g
    'PAPER': 0.02,    # 2 points per 100g
    'GLASS': 0.015,   # 1.5 points per 100g
    'METAL': 0.04,    # 4 points per 100g
}


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
        if serializer.is_valid():            # Save the waste record
            waste_record = serializer.save(user=request.user)
            logged_amount = waste_record.amount
            waste_type = waste_record.waste.type

            # Calculate CO2 and points for this waste
            co2_emission = get_co2_emission(logged_amount, waste_type)
            points = logged_amount * point_coefficients.get(waste_type, 0)

            # Update user's total points and CO2 using F() to prevent race conditions
            request.user.total_points = F('total_points') + points
            request.user.total_co2 = F('total_co2') + co2_emission
            request.user.save()

            # Get the challenges the user is participating in
            user_challenges = UserChallenge.objects.filter(user=request.user)

            # Update the current_progress of each challenge
            for user_challenge in user_challenges:
                challenge = user_challenge.challenge
                challenge.current_progress = F('current_progress') + logged_amount # F expression ensures that the update is atomic

                # Distribute achievements if challenge is completed
                challenge.refresh_from_db()
                if challenge.current_progress > challenge.target_amount:
                    challenge.current_progress = challenge.target_amount

                    # fetch all users that are participating in the challenge
                    users_in_challenge = UserChallenge.objects.filter(challenge=challenge).values_list('user', flat=True)
                    for user in users_in_challenge:
                        user_instance = Users.objects.get(id=user)

                        # assert that challenge.reward exists
                        if challenge.reward is None:
                            raise ObjectDoesNotExist("Challenge reward does not exist. The reward achievement should be automatically generated in our new API, so this is likely a server issue.")

                        # Create achievement for the user
                        UserAchievements.objects.create(user=user_instance, challenge=challenge.reward)

                challenge.save()

            # Refresh user object to get actual values after F() expressions
            request.user.refresh_from_db()

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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_wastes(request):
    """
    Get all wastes for the authenticated user grouped by waste type.
    
    Returns:
        Response with waste data grouped by type, including:
        - waste_type: The type of waste (PLASTIC, PAPER, GLASS, METAL)
        - total_amount: Total amount for this waste type
        - records: List of individual waste records
    """
    try:
        # Get all waste types
        waste_types = Waste.objects.all()
        response_data = []

        for waste_type in waste_types:
            # Get all waste records for this type
            wastes = UserWastes.objects.filter(
                user=request.user,
                waste=waste_type
            )
            
            # Calculate total amount for this waste type
            total_amount = wastes.aggregate(total=Sum('amount'))['total'] or 0

            # Serialize the waste records
            
            response_data.append({
                'waste_type': waste_type.type,
                'total_amount': total_amount,
            })

        return Response({
            'message': 'User wastes retrieved successfully',
            'data': response_data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_top_users(request):
    """
    Get top 10 users with most total waste contributions (as points and CO2 emission).
    Returns a list of users with their total CO2 emissions.
    """
    try:
        # Get top 10 users who have waste records, sorted by total CO2
        users_with_waste = Users.objects.filter(
            id__in=UserWastes.objects.values('user_id')
        ).order_by('-total_points')[:10]
        
        # Prepare response data
        response_data = []
        for user in users_with_waste:
            response_data.append({
                'username': user.username,
                'total_waste': f"{user.total_co2:.4f}",  # CO2 emission formatted to 4 decimals
                'profile_picture': user.profile_image_url,
                'points': user.total_points,
            })
            
        return Response({
            'message': 'Top users retrieved successfully',
            'data': response_data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
CLIMATIQ_API_KEY = '3QMDVSHM8X6FQ5B97P8PBKPXHW'

# Map waste types to Climatiq activity IDs
WASTE_TYPE_TO_ACTIVITY_ID = {
    'PLASTIC': 'waste-type_plastics-disposal_method_landfill',
    'PAPER': 'waste_type_paper_and_cardboard-disposal_method_landfill',
    'GLASS': 'waste-type_glass-disposal_method_landfilled',
    'METAL': 'waste_type_scrap_metal_steel_cans-disposal_method_landfill',
}

def get_co2_emission(amount_kg, waste_type):
    """
    Calls Climatiq API to convert waste amount (kg) to CO2 emission (kg CO2e) for a specific waste type.
    """
    if not CLIMATIQ_API_KEY:
        return 0
        
    activity_id = WASTE_TYPE_TO_ACTIVITY_ID.get(waste_type, 'waste_type_disposal_mixed_unspecified')
    url = 'https://api.climatiq.io/data/v1/estimate'
    headers = {
        'Authorization': f'Bearer {CLIMATIQ_API_KEY}',
        'Content-Type': 'application/json',
    }
    data = {
        "emission_factor": {
            "activity_id": activity_id,
            "data_version": "21.21",
        },
        "parameters": {
            "weight": amount_kg,
            "weight_unit": "kg"
        }
    }
    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            result = response.json()
            return result.get('co2e', 0)
        else:
            # Handle non-200 responses
            return 0
    except Exception:
        # Handle any other exceptions (network errors, etc.)
        return 0