from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .waste_serializer import UserWasteSerializer
from django.core.exceptions import ObjectDoesNotExist
from ..models import SuspiciousWaste, UserWastes, Waste, Users, UserAchievements
from challenges.models import UserChallenge
from django.db.models import Sum, F
import requests
from django.utils import timezone
from rest_framework.permissions import IsAdminUser


# Point coefficients for different waste types
point_coefficients = {
    'PLASTIC': 0.3,  # 30 points per 100g
    'PAPER': 0.15,    # 15 points per 100g
    'GLASS': 0.2,     # 20 points per 100g
    'METAL': 0.35,    # 35 points per 100g
    'ELECTRONIC': 0.6, # 60 points per 100g
    'OIL&FATS': 0.45,   # 45 points per 100g
    'ORGANIC': 0.1,   # 10 points per 100g
}


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user_waste(request):
    """
    Create a new waste record for the authenticated user.
    
    Required POST data:
    - waste_type: str (PLASTIC, PAPER, GLASS, METAL, etc.)
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
                challenge.save() # Save the F expression to the database

                # Refresh the challenge instance to get the updated value
                challenge.refresh_from_db()


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

                        # Check if the achievement already exists for the user
                        if not UserAchievements.objects.filter(user=user_instance, achievement=challenge.reward).exists():
                            # Create achievement for the user
                            UserAchievements.objects.create(user=user_instance, achievement=challenge.reward, earned_at=timezone.now())

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
        - waste_type: The type of waste (PLASTIC, PAPER, GLASS, METAL, etc.)
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
    Returns:
     - A list of top 10 users with their total CO2 emissions and points
     - Current user's stats and standing in the leaderboard (if authenticated)
    """
    try:
        # Get all users who have waste records, sorted by total points
        all_users_with_waste = Users.objects.filter(
            id__in=UserWastes.objects.values('user_id')
        ).order_by('-total_points')
        
        # For leaderboard: get top 10 users
        top_users = all_users_with_waste[:10]
          # Prepare response data for top users
        top_users_data = []
        for index, user in enumerate(top_users):
            # Get the profile image URL with absolute URI
            profile_picture = None
            if user.profile_image:
                if user.profile_image.startswith(('http://', 'https://')):
                    profile_picture = user.profile_image
                else:
                    from django.conf import settings
                    profile_picture = f"{request.build_absolute_uri(settings.MEDIA_URL)}{user.profile_image}"
            
            top_users_data.append({
                'rank': index + 1,
                'username': user.username,
                'total_waste': f"{user.total_co2:.4f}",  # CO2 emission formatted to 4 decimals
                'profile_picture': profile_picture,
                'points': user.total_points,
            })
        
        # Prepare response
        response_data = {
            'top_users': top_users_data
        }
        
        # Add current user info if authenticated
        if request.user.is_authenticated:
            try:
                # Find user's position in the leaderboard
                user_rank = None
                for index, user in enumerate(all_users_with_waste):
                    if user.id == request.user.id:
                        user_rank = index + 1
                        break
                
                # Get profile image URL with absolute URI for current user
                profile_picture = None
                if request.user.profile_image:
                    if request.user.profile_image.startswith(('http://', 'https://')):
                        profile_picture = request.user.profile_image
                    else:
                        from django.conf import settings
                        profile_picture = f"{request.build_absolute_uri(settings.MEDIA_URL)}{request.user.profile_image}"
                
                # Get user stats
                user_stats = {
                    'username': request.user.username,
                    'total_waste': f"{request.user.total_co2:.4f}",
                    'profile_picture': profile_picture,
                    'points': request.user.total_points,
                    'rank': user_rank if user_rank else 'Not ranked'
                }
                
                response_data['current_user'] = user_stats
            except Exception as e:
                # If there's an error getting current user info, continue without it
                response_data['current_user'] = {'error': 'Could not retrieve current user data'}
            
        return Response({
            'message': 'Top users retrieved successfully',
            'data': response_data        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
CLIMATIQ_API_KEY = 'MZ8FSSS4814K70VQY8JSBP726W'

# Map waste types to Climatiq activity IDs
WASTE_TYPE_TO_ACTIVITY_ID = {
    'PLASTIC': 'waste-type_plastics-disposal_method_landfill',
    'PAPER': 'waste_type_paper_and_cardboard-disposal_method_landfill',
    'GLASS': 'waste-type_glass-disposal_method_landfilled',
    'METAL': 'waste_type_scrap_metal_steel_cans-disposal_method_landfill',
    'ELECTRONIC': 'waste-type_weee_mixed-disposal_method_landfill',
    'OIL&FATS': 'waste_management-type_used_vegetable_cooking_oil_purified_treatment_of_used_vegetable_cooking_oil_purification-disposal_method_na',
    'ORGANIC': 'waste-type_mixed_food_and_organic_garden-disposal_method_landfill',
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
    
#import parsers for file upload
from rest_framework.decorators import parser_classes
from rest_framework.parsers import MultiPartParser, FormParser


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def create_suspicious_waste(request):
    """
    Create a suspicious waste report for the authenticated user.
    
    Required POST data:
    - description: str
    - image: file (required)
    """
    try:
        amount = request.data.get('amount', 0)
        date=timezone.now()
        waste_type=request.data.get('waste', None)
        image = request.FILES.get('photo', None)

        

        # Create the suspicious waste report
        waste = Waste.objects.get(type=waste_type) if waste_type else None
        suspicious_waste = SuspiciousWaste.objects.create(
            user=request.user,
            amount=amount,
            date=date,
            waste=waste,
            photo=image
        )

        return Response(
            {'message': 'Suspicious waste report created successfully'},
            status=status.HTTP_201_CREATED
        )
    
    except Exception as e:
        print(e)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_suspicious_wastes(request):
    """
    Get all suspicious waste reports (admin only).
    """
    try:
        reports = SuspiciousWaste.objects.all().order_by('-date')
        response_data = []

        for report in reports:
            profile_picture = None
            if report.user.profile_image:
                if report.user.profile_image.startswith(('http://', 'https://')):
                    profile_picture = report.user.profile_image
                else:
                    from django.conf import settings
                    profile_picture = f"{request.build_absolute_uri(settings.MEDIA_URL)}{report.user.profile_image}"

            response_data.append({
                'id': report.id,
                'username': report.user.username,
                'amount': report.amount,
                'waste_type': report.waste.type if report.waste else None,
                'profile_picture': profile_picture,
                'photo_url': request.build_absolute_uri(report.photo.url) if report.photo else None,
                'reported_at': report.date,
            })

        return Response(
            {
                'message': 'Suspicious waste reports retrieved successfully',
                'data': response_data
            },
            status=status.HTTP_200_OK
        )
    
    except Exception as e:
        print(e)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )