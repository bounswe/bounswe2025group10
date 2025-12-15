import os
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import generics
from django.conf import settings
from django.http import FileResponse
from django.http import HttpResponseRedirect
from datetime import datetime
import mimetypes
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample


from api.models import Users
from .privacy_utils import can_view_profile_field, can_view_waste_stats, VALID_PRIVACY_VALUES
from api.account_deletion import request_account_deletion, cancel_account_deletion, cancel_account_deletion_by_token, get_account_deletion_request
from .anonymity_utils import get_or_create_anonymous_identifier
from .account_deletion_serializers import (
    AccountDeletionRequestPostResponseSerializer,
    AccountDeletionRequestStatusResponseSerializer,
    AccountDeletionCancelResponseSerializer,
    AccountDeletionCancelByTokenRequestSerializer,
)

@extend_schema(
    summary="Upload profile picture",
    description="Upload or update the profile picture for the authenticated user. Accepts JPEG/PNG files up to 5MB. Replaces existing profile picture if present.",
    request={
        'multipart/form-data': {
            'type': 'object',
            'properties': {
                'image': {'type': 'string', 'format': 'binary', 'description': 'Profile picture image (JPEG/PNG, max 5MB)'}
            },
            'required': ['image']
        }
    },
    responses={
        200: OpenApiResponse(
            description="Profile picture uploaded successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Profile picture uploaded successfully',
                        'data': {
                            'profile_picture': 'http://localhost:8000/media/users/3/profile_20251122_143000.jpg'
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(description="Bad request - no image provided or invalid file type/size"),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        500: OpenApiResponse(description="Internal server error")
    },
    tags=['Profile']
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_profile_picture(request):
    """
    Upload a profile picture for the authenticated user.
    
    Request should include:
    - image: File object (image file)
    """
    if not request.FILES or 'image' not in request.FILES:
        return Response({
            'error': 'No image file provided'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    image = request.FILES['image']
    
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/jpg']
    if image.content_type not in allowed_types:
        return Response({
            'error': 'Invalid file type. Only JPEG and PNG files are allowed.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate file size (max 5MB)
    if image.size > 5 * 1024 * 1024:
        return Response({
            'error': 'File too large. Maximum size is 5MB.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Delete old profile picture if exists
        if request.user.profile_image:
            old_image_path = os.path.join(settings.MEDIA_ROOT, request.user.profile_image)
            if os.path.exists(old_image_path):
                os.remove(old_image_path)
        
        # Create user-specific directory
        user_directory = os.path.join('users', str(request.user.id))
        full_directory = os.path.join(settings.MEDIA_ROOT, user_directory)
        os.makedirs(full_directory, exist_ok=True)
        
        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        file_extension = os.path.splitext(image.name)[1].lower()
        filename = f'profile_{timestamp}{file_extension}'
        
        # Full path for the new file
        filepath = os.path.join(user_directory, filename)
        full_filepath = os.path.join(settings.MEDIA_ROOT, filepath)
        
        # Save the file
        with open(full_filepath, 'wb+') as destination:
            for chunk in image.chunks():
                destination.write(chunk)
        
        # Update user's profile_image field
        request.user.profile_image = filepath.replace('\\', '/')  # Use forward slashes for URLs
        request.user.save(update_fields=['profile_image'])
        
        # Build absolute HTTPS URL for profile picture
        profile_picture_url = None
        if request.user.profile_image:
            if request.user.profile_image.startswith(('http://', 'https://')):
                profile_picture_url = request.user.profile_image
            else:
                media_url = request.build_absolute_uri(settings.MEDIA_URL)
                if request.is_secure() and media_url.startswith('http://'):
                    media_url = media_url.replace('http://', 'https://', 1)
                profile_picture_url = f"{media_url.rstrip('/')}/{request.user.profile_image.lstrip('/')}"
        
        return Response({
            'message': 'Profile picture uploaded successfully',
            'data': {
                'profile_picture': profile_picture_url
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@extend_schema(
    summary="Get or update user bio",
    description="GET: Retrieve user bio subject to the user's privacy settings (public/private/followers). PUT: Update own bio (must be authenticated and can only update own bio).",
    parameters=[
        OpenApiParameter(
            name='username',
            type=str,
            location=OpenApiParameter.PATH,
            required=True,
            description='Username of the user'
        )
    ],
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'bio': {
                    'type': 'string',
                    'description': 'New bio text (max 500 characters)',
                    'example': 'Environmental advocate passionate about zero waste living and sustainable practices.'
                }
            },
            'required': ['bio']
        }
    },
    examples=[
        OpenApiExample(
            'PUT Request',
            value={'bio': 'Environmental advocate passionate about zero waste living and sustainable practices.'},
            request_only=True
        )
    ],
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'username': {'type': 'string'},
                    'bio': {'type': 'string', 'nullable': True, 'description': 'Null when hidden by privacy settings.'},
                    'message': {'type': 'string'}
                }
            },
            description="Bio retrieved or updated successfully",
            examples=[
                OpenApiExample(
                    'GET Response',
                    value={'username': 'john_doe', 'bio': 'Passionate about zero waste living'},
                    response_only=True
                ),
                OpenApiExample(
                    'GET Response (Hidden)',
                    value={'username': 'john_doe', 'bio': None},
                    response_only=True
                ),
                OpenApiExample(
                    'PUT Response',
                    value={'message': 'Bio updated successfully.', 'bio': 'Updated bio text'}
                )
            ]
        ),
        400: OpenApiResponse(description="Bad request - no bio provided"),
        401: OpenApiResponse(description="Unauthorized - authentication required for PUT"),
        403: OpenApiResponse(description="Forbidden - can only update own bio"),
        404: OpenApiResponse(description="User not found")
    },
    tags=['Profile']
)
@api_view(['GET', 'PUT'])
@permission_classes([AllowAny])
def user_bio(request, username):
    """
    GET  /api/profile/<username>/bio/   → public: returns { username, bio }
    PUT  /api/profile/<username>/bio/   → allows the *owner* (authenticated) to update their bio
    """
    try:
        user = Users.objects.get(username=username)
    except Users.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        bio = user.bio if can_view_profile_field(request.user, user, user.bio_privacy) else None
        return Response({'username': user.username, 'bio': bio}, status=status.HTTP_200_OK)

    # PUT
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
    if request.user.username != username:
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    new_bio = request.data.get('bio')
    if new_bio is None:
        return Response({'error': 'No bio provided.'}, status=status.HTTP_400_BAD_REQUEST)

    user.bio = new_bio
    user.save(update_fields=['bio'])
    return Response({'message': 'Bio updated successfully.', 'bio': user.bio}, status=status.HTTP_200_OK)

@extend_schema(
    summary="Get or update profile privacy settings",
    description="Get or update the authenticated user's privacy settings for bio and waste reduction statistics.",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'bio_privacy': {'type': 'string', 'enum': ['public', 'private', 'followers']},
                'waste_stats_privacy': {'type': 'string', 'enum': ['public', 'private', 'followers']},
                'is_anonymous': {'type': 'boolean', 'description': 'When true, public leaderboards and posts/comments will show an anonymous identifier instead of username.'},
            }
        }
    },
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'},
                    'data': {
                        'type': 'object',
                        'properties': {
                            'bio_privacy': {'type': 'string', 'enum': ['public', 'private', 'followers']},
                            'waste_stats_privacy': {'type': 'string', 'enum': ['public', 'private', 'followers']},
                            'is_anonymous': {'type': 'boolean'},
                            'anonymous_identifier': {'type': 'string', 'nullable': True},
                        }
                    }
                }
            },
            description="Privacy settings retrieved/updated successfully",
            examples=[
                OpenApiExample(
                    'GET Response',
                    value={'data': {'bio_privacy': 'public', 'waste_stats_privacy': 'public', 'is_anonymous': False, 'anonymous_identifier': None}},
                    response_only=True
                ),
                OpenApiExample(
                    'PUT Response',
                    value={
                        'message': 'Privacy settings updated successfully.',
                        'data': {'bio_privacy': 'private', 'waste_stats_privacy': 'followers', 'is_anonymous': True, 'anonymous_identifier': 'anon_xxxxxxxx'}
                    },
                    response_only=True
                ),
            ]
        ),
        400: OpenApiResponse(description="Bad request - invalid privacy value"),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
    },
    tags=['Profile']
)
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile_privacy_settings(request):
    if request.method == 'GET':
        return Response({
            'data': {
                'bio_privacy': request.user.bio_privacy,
                'waste_stats_privacy': request.user.waste_stats_privacy,
                'is_anonymous': request.user.is_anonymous,
                'anonymous_identifier': request.user.anonymous_identifier,
            }
        }, status=status.HTTP_200_OK)

    bio_privacy = request.data.get('bio_privacy', request.user.bio_privacy)
    waste_stats_privacy = request.data.get('waste_stats_privacy', request.user.waste_stats_privacy)
    is_anonymous = request.data.get('is_anonymous', request.user.is_anonymous)

    invalid_fields = {}
    if bio_privacy not in VALID_PRIVACY_VALUES:
        invalid_fields['bio_privacy'] = 'Invalid privacy value.'
    if waste_stats_privacy not in VALID_PRIVACY_VALUES:
        invalid_fields['waste_stats_privacy'] = 'Invalid privacy value.'
    if not isinstance(is_anonymous, bool):
        invalid_fields['is_anonymous'] = 'Must be a boolean.'
    if invalid_fields:
        return Response({'error': invalid_fields}, status=status.HTTP_400_BAD_REQUEST)

    request.user.bio_privacy = bio_privacy
    request.user.waste_stats_privacy = waste_stats_privacy
    request.user.is_anonymous = is_anonymous
    request.user.save(update_fields=['bio_privacy', 'waste_stats_privacy', 'is_anonymous'])

    if request.user.is_anonymous and not request.user.anonymous_identifier:
        get_or_create_anonymous_identifier(request.user)

    return Response({
        'message': 'Privacy settings updated successfully.',
        'data': {
            'bio_privacy': request.user.bio_privacy,
            'waste_stats_privacy': request.user.waste_stats_privacy,
            'is_anonymous': request.user.is_anonymous,
            'anonymous_identifier': request.user.anonymous_identifier,
        }
    }, status=status.HTTP_200_OK)


@extend_schema(
    summary="Get user waste reduction statistics",
    description="Retrieve a user's waste reduction statistics (points and total waste/CO2). Visibility is controlled by the user's waste_stats_privacy setting and anonymization (anonymous users' waste stats are hidden from non-owners).",
    parameters=[
        OpenApiParameter(
            name='username',
            type=str,
            location=OpenApiParameter.PATH,
            required=True,
            description='Username of the user'
        )
    ],
    responses={
        200: OpenApiResponse(
            response={
                'type': 'object',
                'properties': {
                    'username': {'type': 'string'},
                    'total_waste': {'type': 'string', 'nullable': True, 'description': 'Null when hidden by privacy settings.'},
                    'points': {'type': 'number', 'nullable': True, 'description': 'Null when hidden by privacy settings.'},
                }
            },
            description="Waste statistics retrieved successfully",
            examples=[
                OpenApiExample(
                    'Public/Visible Response',
                    value={'username': 'john_doe', 'total_waste': '12.3456', 'points': 150},
                    response_only=True
                ),
                OpenApiExample(
                    'Hidden Response',
                    value={'username': 'john_doe', 'total_waste': None, 'points': None},
                    response_only=True
                ),
            ]
        ),
        404: OpenApiResponse(description="User not found"),
    },
    tags=['Profile']
)
@api_view(['GET'])
@permission_classes([AllowAny])
def user_waste_stats(request, username):
    try:
        user = Users.objects.get(username=username)
    except Users.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    can_view = can_view_waste_stats(request.user, user)
    return Response({
        'username': user.username,
        'total_waste': f"{user.total_co2:.4f}" if can_view else None,
        'points': user.total_points if can_view else None,
    }, status=status.HTTP_200_OK)


class AccountDeletionRequestView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AccountDeletionRequestStatusResponseSerializer

    @extend_schema(
        summary="Request account deletion",
        description="Create an account deletion request for the authenticated user. The system will permanently delete the account and associated data within 30 days of the request. The account is immediately deactivated.",
        responses={
            200: AccountDeletionRequestPostResponseSerializer,
            401: OpenApiResponse(description="Unauthorized - authentication required"),
        },
        tags=['Profile']
    )
    def post(self, request):
        req, cancel_token = request_account_deletion(request.user)
        return Response({
            'message': 'Account deletion requested.',
            'data': {
                'requested_at': req.requested_at.isoformat(),
                'delete_after': req.delete_after.isoformat(),
                'cancel_token': cancel_token,
            }
        }, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Get account deletion request status",
        description="Get the authenticated user's current account deletion request (if any).",
        responses={
            200: AccountDeletionRequestStatusResponseSerializer,
            401: OpenApiResponse(description="Unauthorized - authentication required"),
        },
        tags=['Profile']
    )
    def get(self, request):
        req = get_account_deletion_request(request.user)
        if not req:
            return Response({'data': {'requested': False, 'requested_at': None, 'delete_after': None, 'canceled_at': None}}, status=status.HTTP_200_OK)
        return Response({
            'data': {
                'requested': req.canceled_at is None,
                'requested_at': req.requested_at.isoformat(),
                'delete_after': req.delete_after.isoformat(),
                'canceled_at': req.canceled_at.isoformat() if req.canceled_at else None,
            }
        }, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Cancel account deletion request",
        description="Cancel a pending account deletion request for the authenticated user (reactivates the account).",
        responses={
            200: AccountDeletionCancelResponseSerializer,
            404: OpenApiResponse(description="No deletion request found"),
            401: OpenApiResponse(description="Unauthorized - authentication required"),
        },
        tags=['Profile']
    )
    def delete(self, request):
        ok = cancel_account_deletion(request.user)
        if not ok:
            return Response({'error': 'No deletion request found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'message': 'Account deletion request canceled.', 'status': 'canceled'}, status=status.HTTP_200_OK)


class AccountDeletionCancelByTokenView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = AccountDeletionCancelByTokenRequestSerializer

    @extend_schema(
        summary="Cancel account deletion request (by token)",
        description=(
            "Cancels a pending account deletion request using the cancel token returned when requesting deletion. "
            "This works even if the account was deactivated and can no longer authenticate."
        ),
        request=AccountDeletionCancelByTokenRequestSerializer,
        responses={
            200: AccountDeletionCancelResponseSerializer,
        },
        tags=['Profile']
    )
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ok = cancel_account_deletion_by_token(serializer.validated_data['cancel_token'])
        if not ok:
            return Response({'message': 'Account already deleted.', 'status': 'deleted'}, status=status.HTTP_200_OK)
        return Response({'message': 'Account deletion request canceled.', 'status': 'canceled'}, status=status.HTTP_200_OK)

@extend_schema(
    summary="Download user profile picture",
    description=(
        "Download the profile picture for a specific user. If the stored `profile_image` is an external URL, "
        "this endpoint redirects (302) to that URL. Otherwise, it streams the file from MEDIA_ROOT."
    ),
    parameters=[
        OpenApiParameter(
            name='username',
            type=str,
            location=OpenApiParameter.PATH,
            required=True,
            description='Username of the user whose profile picture to download'
        )
    ],
    responses={
        200: OpenApiResponse(
            response={'type': 'string', 'format': 'binary'},
            description="Profile picture file (binary image data with content-type: image/jpeg or image/png)"
        ),
        302: OpenApiResponse(
            description="Redirect to external profile picture URL (Location header)"
        ),
        404: OpenApiResponse(
            description="User not found or no profile picture available",
            examples=[
                OpenApiExample(
                    'User not found',
                    value={'error': 'User not found.'}
                ),
                OpenApiExample(
                    'No profile picture',
                    value={'error': 'No profile picture found.'}
                ),
                OpenApiExample(
                    'Missing file on server',
                    value={'error': 'Profile picture not found on server.'}
                )
            ]
        )
    },
    tags=['Profile']
)
@api_view(['GET'])
@permission_classes([AllowAny])
def download_profile_picture_public(request, username):
    """
    GET /api/profile/<username>/picture/ → streams back the user's profile_image file
    """
    try:
        user = Users.objects.get(username=username)
    except Users.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    if not user.profile_image:
        return Response({'error': 'No profile picture found.'}, status=status.HTTP_404_NOT_FOUND)

    # If profile_image is an external URL (e.g., seeded mock data), redirect to it.
    if user.profile_image.startswith(('http://', 'https://')):
        return HttpResponseRedirect(user.profile_image)

    # Normalize relative path (handle "/media/..." or leading "/")
    rel_path = user.profile_image
    media_url = getattr(settings, "MEDIA_URL", "/media/")
    if rel_path.startswith(media_url):
        rel_path = rel_path[len(media_url):]
    rel_path = rel_path.lstrip("/\\")

    media_root = os.path.abspath(os.fspath(settings.MEDIA_ROOT))
    file_path = os.path.abspath(os.path.normpath(os.path.join(media_root, rel_path)))
    if not file_path.startswith(media_root + os.sep) and file_path != media_root:
        return Response({'error': 'Invalid profile picture path.'}, status=status.HTTP_404_NOT_FOUND)

    if not os.path.exists(file_path):
        return Response({'error': 'Profile picture not found on server.'}, status=status.HTTP_404_NOT_FOUND)

    content_type, _ = mimetypes.guess_type(file_path)
    try:
        response = FileResponse(open(file_path, 'rb'),
                                content_type=content_type or 'application/octet-stream')
    except OSError:
        return Response({'error': 'Profile picture not found on server.'}, status=status.HTTP_404_NOT_FOUND)
    response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
    return response
