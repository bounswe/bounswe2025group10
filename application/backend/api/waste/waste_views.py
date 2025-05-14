from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .waste_serializer import UserWasteSerializer
from django.core.exceptions import ObjectDoesNotExist
from ..models import UserWastes, Waste, Users
from challenges.models import UserChallenge
from django.db.models import Sum, F
import requests


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
            # Save the waste record
            waste_record = serializer.save(user=request.user)

            # Get the logged waste amount
            logged_amount = waste_record.amount

            # Get the challenges the user is participating in
            user_challenges = UserChallenge.objects.filter(user=request.user)

            # Update the current_progress of each challenge
            for user_challenge in user_challenges:
                challenge = user_challenge.challenge
                challenge.current_progress = F('current_progress') + logged_amount # F expression ensures that the update is atomic
                challenge.save()

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
    Get top 10 users with most total waste contributions (as CO2 emission).
    Returns a list of users with their total CO2 emissions.
    """

    point_coefficients = {
        'PLASTIC': 0.03, # 3 points per 100g
        'PAPER': 0.02, # 2 points per 100g
        'GLASS': 0.015, # 1.5 points per 100g
        'METAL': 0.04, # 4 points per 100g
    }
    try:        # Get all users who have waste records
        users_with_waste = Users.objects.filter(id__in=UserWastes.objects.values('user_id')).distinct()
        
        # Use a dictionary to store user data while processing
        user_data = {}
        
        # Get all waste records for all users at once to reduce DB queries
        all_waste_records = UserWastes.objects.filter(
            user__in=users_with_waste
        ).values('user_id', 'waste__type').annotate(total=Sum('amount'))
        
        # Group waste records by user
        user_waste_records = {}
        for record in all_waste_records:
            user_id = record['user_id']
            if user_id not in user_waste_records:
                user_waste_records[user_id] = []
            user_waste_records[user_id].append(record)
        
        # Calculate emissions for each user
        for user in users_with_waste:
            user_id = user.id
            if user_id not in user_waste_records:
                continue
                
            waste_records = user_waste_records[user_id]
            total_co2 = 0
            total_points = 0
            
            # Calculate CO2 and points for each waste type
            for entry in waste_records:
                waste_type = entry['waste__type']
                amount = entry['total'] or 0
                co2 = get_co2_emission(amount, waste_type)
                total_co2 += co2
                # Calculate points correctly for each waste type
                points = amount * point_coefficients.get(waste_type, 0)
                total_points += points
                
            # Store as numeric values for proper sorting
            user_data[user_id] = {
                'user': user,
                'co2_numeric': total_co2,  # Store as numeric for sorting
                'co2': f"{total_co2:.4f}",  # Formatted string for display
                'points': total_points,
            }
            
        # Create list from dictionary values, sort by CO2 emission (numeric) and take top 10
        user_emissions = list(user_data.values())
        top_users = sorted(user_emissions, key=lambda x: x['co2_numeric'], reverse=True)[:10]
        
        # Prepare response data
        response_data = []
        for entry in top_users:
            user = entry['user']
            co2_emission = entry['co2']  # Using formatted string for response
            response_data.append({
                'username': user.username,
                'total_waste': co2_emission,  # CO2 emission formatted
                'profile_picture': user.profile_image_url,
                'points': entry['points'],
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