import os
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from django.http import FileResponse
from datetime import datetime
import mimetypes
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample


from api.models import Users

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
        
        return Response({
            'message': 'Profile picture uploaded successfully',
            'data': {
                'profile_picture': request.user.profile_image_url
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@extend_schema(
    summary="Get or update user bio",
    description="GET: Retrieve user bio (public, no authentication required). PUT: Update own bio (must be authenticated and can only update own bio).",
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
                    'bio': {'type': 'string', 'nullable': True},
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
        return Response({'username': user.username, 'bio': user.bio}, status=status.HTTP_200_OK)

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
    summary="Download user profile picture",
    description="Download the profile picture file for a specific user. Returns the actual image file (JPEG/PNG) as binary data with appropriate content-type headers. Use this endpoint to retrieve and display profile pictures.",
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

    file_path = os.path.join(settings.MEDIA_ROOT, user.profile_image)
    if not os.path.exists(file_path):
        return Response({'error': 'Profile picture not found on server.'}, status=status.HTTP_404_NOT_FOUND)

    content_type, _ = mimetypes.guess_type(file_path)
    response = FileResponse(open(file_path, 'rb'),
                            content_type=content_type or 'application/octet-stream')
    response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
    return response