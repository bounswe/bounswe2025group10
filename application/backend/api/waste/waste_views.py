from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .waste_serializer import UserWasteSerializer
from django.core.exceptions import ObjectDoesNotExist
from ..models import SuspiciousWaste, UserWastes, Waste, Users, UserAchievements
from api.profile.privacy_utils import can_view_profile_field
from api.profile.anonymity_utils import display_name_for_viewer, can_show_profile_image
from challenges.models import UserChallenge
from django.db.models import Sum, F
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
import requests
from django.utils import timezone
from rest_framework.permissions import IsAdminUser
from notifications.utils import send_notification, send_bulk_notifications


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


@extend_schema(
    summary="Log waste disposal",
    description="Record waste disposal for the authenticated user. Automatically calculates points and CO2 emissions, updates user totals, and progresses the first joined incomplete challenge (oldest by joined_date). Awards achievements when challenges are completed.",
    request=UserWasteSerializer,
    responses={
        201: OpenApiResponse(
            response=UserWasteSerializer,
            description="Waste recorded successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Waste recorded successfully',
                        'data': {
                            'id': 15,
                            'waste_type': 'PLASTIC',
                            'type': 'PLASTIC',
                            'amount': 2.5,
                            'date': '2025-11-22T14:30:00Z'
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(description="Bad request - invalid waste type or amount"),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Waste Management']
)
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

            # Get the challenges the user is participating in, ordered by joined_date (oldest first)
            user_challenges = UserChallenge.objects.filter(user=request.user).order_by('joined_date')

            # Only progress the first challenge (oldest joined, not yet completed)
            first_incomplete_challenge = None
            for user_challenge in user_challenges:
                challenge = user_challenge.challenge
                # Check if this challenge is not yet completed
                if challenge.current_progress < challenge.target_amount:
                    first_incomplete_challenge = challenge
                    break
            
            # Update only the first incomplete challenge
            if first_incomplete_challenge:
                challenge = first_incomplete_challenge
                challenge.current_progress = F('current_progress') + logged_amount # F expression ensures that the update is atomic
                challenge.save() # Save the F expression to the database

                # Refresh the challenge instance to get the updated value
                challenge.refresh_from_db()

                # Distribute achievements if challenge is completed
                if challenge.current_progress >= challenge.target_amount:

                    challenge.current_progress = challenge.target_amount

                    # fetch all users that are participating in the challenge
                    users_in_challenge = UserChallenge.objects.filter(challenge=challenge).values_list('user', flat=True)
                    participants = Users.objects.filter(id__in=users_in_challenge)
                    
                    for user_instance in participants:

                        # assert that challenge.reward exists
                        if challenge.reward is None:
                            raise ObjectDoesNotExist("Challenge reward does not exist. The reward achievement should be automatically generated in our new API, so this is likely a server issue.")

                        # Check if the achievement already exists for the user
                        if not UserAchievements.objects.filter(user=user_instance, achievement=challenge.reward).exists():
                            # Create achievement for the user
                            UserAchievements.objects.create(user=user_instance, achievement=challenge.reward, earned_at=timezone.now())
                    
                    # Send notifications to all participants about challenge completion
                    send_bulk_notifications(
                        participants,
                        f"🎉 Challenge '{challenge.title}' completed! You've earned the achievement '{challenge.reward.title}'!"
                    )

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


@extend_schema(
    summary="Get user's waste statistics",
    description="Retrieve comprehensive waste disposal statistics for the authenticated user. Returns data grouped by waste type (PLASTIC, PAPER, GLASS, METAL, ELECTRONIC, OIL&FATS, ORGANIC) with total amounts and individual waste records including creation timestamps.",
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'},
                    'data': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'waste_type': {'type': 'string', 'enum': ['PLASTIC', 'PAPER', 'GLASS', 'METAL', 'ELECTRONIC', 'OIL&FATS', 'ORGANIC']},
                                'total_amount': {'type': 'number', 'format': 'float'},
                                'records': {
                                    'type': 'array',
                                    'items': {
                                        'type': 'object',
                                        'properties': {
                                            'id': {'type': 'integer'},
                                            'type': {'type': 'string'},
                                            'amount': {'type': 'number', 'format': 'float'},
                                            'date': {'type': 'string', 'format': 'date-time'}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            description="User wastes retrieved successfully. Returns array of waste type objects with total amounts and individual records with timestamps.",
            examples=[
                OpenApiExample(
                    'Complete waste statistics with records',
                    value={
                        'message': 'User wastes retrieved successfully',
                        'data': [
                            {
                                'waste_type': 'PLASTIC',
                                'total_amount': 15.5,
                                'records': [
                                    {
                                        'id': 1,
                                        'type': 'PLASTIC',
                                        'amount': 5.5,
                                        'date': '2025-12-10T10:30:00Z'
                                    },
                                    {
                                        'id': 2,
                                        'type': 'PLASTIC',
                                        'amount': 10.0,
                                        'date': '2025-12-12T14:20:00Z'
                                    }
                                ]
                            },
                            {
                                'waste_type': 'PAPER',
                                'total_amount': 8.2,
                                'records': [
                                    {
                                        'id': 3,
                                        'type': 'PAPER',
                                        'amount': 8.2,
                                        'date': '2025-12-11T09:15:00Z'
                                    }
                                ]
                            },
                            {
                                'waste_type': 'GLASS',
                                'total_amount': 0,
                                'records': []
                            }
                        ]
                    },
                    response_only=True
                ),
                OpenApiExample(
                    'User with no waste records',
                    value={
                        'message': 'User wastes retrieved successfully',
                        'data': [
                            {'waste_type': 'PLASTIC', 'total_amount': 0, 'records': []},
                            {'waste_type': 'PAPER', 'total_amount': 0, 'records': []},
                            {'waste_type': 'GLASS', 'total_amount': 0, 'records': []},
                            {'waste_type': 'METAL', 'total_amount': 0, 'records': []},
                            {'waste_type': 'ELECTRONIC', 'total_amount': 0, 'records': []},
                            {'waste_type': 'OIL&FATS', 'total_amount': 0, 'records': []},
                            {'waste_type': 'ORGANIC', 'total_amount': 0, 'records': []}
                        ]
                    },
                    response_only=True
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Waste Management']
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
        - records: List of individual waste records with timestamps
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

            # Serialize the waste records including created_at timestamp
            waste_records = UserWasteSerializer(wastes, many=True).data
            
            response_data.append({
                'waste_type': waste_type.type,
                'total_amount': total_amount,
                'records': waste_records
            })

        return Response({
            'message': 'User wastes retrieved successfully',
            'data': response_data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@extend_schema(
    summary="Get top users leaderboard",
    description="Retrieve top 10 users with highest waste contributions (points and CO2 emissions). Users whose waste stats are not visible to the requester (per their privacy settings) are omitted. If a user enabled anonymization, the `username` field will contain their anonymous identifier and their `profile_picture` will be null. If authenticated, also returns current user's stats and ranking.",
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'},
                    'data': {
                        'type': 'object',
                        'properties': {
                            'top_users': {
                                'type': 'array',
                                'items': {
                                    'type': 'object',
                                    'properties': {
                                        'rank': {'type': 'integer'},
                                        'username': {'type': 'string'},
                                        'total_waste': {'type': 'string'},
                                        'profile_picture': {'type': 'string', 'nullable': True},
                                        'points': {'type': 'integer'}
                                    }
                                }
                            },
                            'current_user': {
                                'type': 'object',
                                'nullable': True,
                                'properties': {
                                    'username': {'type': 'string'},
                                    'total_waste': {'type': 'string'},
                                    'profile_picture': {'type': 'string', 'nullable': True},
                                    'points': {'type': 'integer'},
                                    'rank': {'type': 'integer'}
                                }
                            }
                        }
                    }
                }
            },
            description="Top users retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Top users retrieved successfully',
                        'data': {
                            'top_users': [
                                {
                                    'rank': 1,
                                    'username': 'eco_champion',
                                    'total_waste': '125.4567',
                                    'profile_picture': 'http://localhost:8000/media/users/5/profile.jpg',
                                    'points': 450
                                },
                                {
                                    'rank': 2,
                                    'username': 'green_warrior',
                                    'total_waste': '98.3210',
                                    'profile_picture': 'http://localhost:8000/media/users/3/profile.jpg',
                                    'points': 380
                                }
                            ],
                            'current_user': {
                                'username': 'john_doe',
                                'total_waste': '45.1234',
                                'profile_picture': 'http://localhost:8000/media/users/7/profile.jpg',
                                'points': 150,
                                'rank': 15
                            }
                        }
                    }
                )
            ]
        ),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Waste Management']
)
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
        
        top_users_data = []
        visible_rank = 1
        for user in all_users_with_waste:
            if not can_view_profile_field(request.user, user, user.waste_stats_privacy):
                continue

            # Get the profile image URL with absolute URI
            profile_picture = None
            if can_show_profile_image(request.user, user) and user.profile_image:
                if user.profile_image.startswith(('http://', 'https://')):
                    profile_picture = user.profile_image
                else:
                    from django.conf import settings
                    media_url = request.build_absolute_uri(settings.MEDIA_URL)
                    # Ensure we're using https if the request came through https
                    if request.is_secure() and media_url.startswith('http://'):
                        media_url = media_url.replace('http://', 'https://', 1)
                    profile_picture = f"{media_url.rstrip('/')}/{user.profile_image.lstrip('/')}"
            
            top_users_data.append({
                'rank': visible_rank,
                'username': display_name_for_viewer(request.user, user),
                'total_waste': f"{user.total_co2:.4f}",  # CO2 emission formatted to 4 decimals
                'profile_picture': profile_picture,
                'points': user.total_points,
            })
            visible_rank += 1
            if len(top_users_data) >= 10:
                break
        
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
                        media_url = request.build_absolute_uri(settings.MEDIA_URL)
                        # Ensure we're using https if the request came through https
                        if request.is_secure() and media_url.startswith('http://'):
                            media_url = media_url.replace('http://', 'https://', 1)
                        profile_picture = f"{media_url.rstrip('/')}/{request.user.profile_image.lstrip('/')}"
                
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
from django.conf import settings

def get_co2_emission(amount_kg, waste_type):
    """
    Local CO2 emission calculator using internal carbon factors
    that mimic Climatiq activity_id structure.
    """
    # Get mapped activity id
    activity_id = settings.WASTE_TYPE_TO_ACTIVITY_ID.get(
        waste_type,
        'waste_type_disposal_mixed_unspecified'
    )

    # Get factor from local registry
    factor = settings.LOCAL_EMISSION_FACTORS.get(activity_id)

    # If unknown type → return 0
    if factor is None:
        return 0.0

    # CO2e = weight * factor
    co2e = amount_kg * factor

    # Apply rounding
    return round(co2e, settings.CARBON_DECIMALS)
    
#import parsers for file upload
from rest_framework.decorators import parser_classes
from rest_framework.parsers import MultiPartParser, FormParser

@extend_schema(
    summary="Report suspicious waste",
    description="Create a suspicious waste report with photo evidence. Used for reporting unusual or potentially fraudulent waste disposal.",
    request={
        'multipart/form-data': {
            'type': 'object',
            'properties': {
                'amount': {'type': 'number', 'description': 'Amount of waste in kg'},
                'waste': {'type': 'string', 'description': 'Waste type (PLASTIC, PAPER, GLASS, etc.)'},
                'photo': {'type': 'string', 'format': 'binary', 'description': 'Photo evidence of suspicious waste'}
            },
            'required': ['photo']
        }
    },
    responses={
        201: OpenApiResponse(
            description="Suspicious waste report created successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={'message': 'Suspicious waste report created successfully'}
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Waste Management - Admin']
)
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
        waste = Waste.objects.filter(type=waste_type).first() if waste_type else None
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
    
@extend_schema(
    summary="Get all suspicious waste reports (Admin only)",
    description="Retrieve all suspicious waste reports with user information and photo evidence. Admin authentication required.",
    responses={
        200: OpenApiResponse(
            description="Suspicious waste reports retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Suspicious waste reports retrieved successfully',
                        'data': [
                            {
                                'id': 5,
                                'username': 'suspicious_user',
                                'amount': 50.0,
                                'waste_type': 'PLASTIC',
                                'profile_picture': 'http://localhost:8000/media/users/12/profile.jpg',
                                'photo_url': 'http://localhost:8000/media/suspicious/photo_12345.jpg',
                                'reported_at': '2025-11-22T14:30:00Z'
                            }
                        ]
                    }
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized"),
        403: OpenApiResponse(description="Forbidden - admin only"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Waste Management - Admin']
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
