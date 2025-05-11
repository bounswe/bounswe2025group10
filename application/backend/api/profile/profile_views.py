import os
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from datetime import datetime

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
