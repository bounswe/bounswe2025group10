from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from api.models import Users
from api.profile.profile_views import upload_profile_picture
import os
from django.conf import settings
import shutil

class ProfilePictureUploadTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        # Create test user
        self.user = Users.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        
        # Create test image
        self.image_content = b"fake image content"
        self.image = SimpleUploadedFile(
            "test_image.jpg",
            self.image_content,
            content_type="image/jpeg"
        )

    def tearDown(self):
        # Clean up uploaded files after tests
        user_media_dir = os.path.join(settings.MEDIA_ROOT, 'users', str(self.user.id))
        if os.path.exists(user_media_dir):
            shutil.rmtree(user_media_dir)

    def test_upload_profile_picture_success(self):
        """Test successful profile picture upload"""
        request = self.factory.post('/me/profile-picture/', 
                                  {'image': self.image}, 
                                  format='multipart')
        force_authenticate(request, user=self.user)
        response = upload_profile_picture(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Profile picture uploaded successfully')
        self.assertTrue('profile_picture' in response.data['data'])
        
        # Verify file was saved
        self.user.refresh_from_db()
        self.assertTrue(self.user.profile_image)
        file_path = os.path.join(settings.MEDIA_ROOT, self.user.profile_image)
        self.assertTrue(os.path.exists(file_path))

    def test_upload_profile_picture_no_image(self):
        """Test upload without providing an image"""
        request = self.factory.post('/me/profile-picture/', {}, format='multipart')
        force_authenticate(request, user=self.user)
        response = upload_profile_picture(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'No image file provided')

    def test_upload_profile_picture_invalid_type(self):
        """Test upload with invalid file type"""
        invalid_file = SimpleUploadedFile(
            "test.txt",
            b"text content",
            content_type="text/plain"
        )
        request = self.factory.post('/me/profile-picture/', 
                                  {'image': invalid_file}, 
                                  format='multipart')
        force_authenticate(request, user=self.user)
        response = upload_profile_picture(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 
                        'Invalid file type. Only JPEG and PNG files are allowed.')

    def test_upload_profile_picture_unauthenticated(self):
        """Test upload without authentication"""
        request = self.factory.post('/me/profile-picture/', 
                                  {'image': self.image}, 
                                  format='multipart')
        response = upload_profile_picture(request)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
