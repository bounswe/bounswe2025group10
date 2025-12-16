import os
import shutil
import tempfile

from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIRequestFactory

from api.models import Users
from api.profile.profile_views import download_profile_picture_public


class PublicProfilePictureDownloadTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = Users.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )
        self.temp_media_root = tempfile.mkdtemp(prefix="media_root_")

    def tearDown(self):
        shutil.rmtree(self.temp_media_root, ignore_errors=True)

    def test_download_profile_picture_redirects_for_external_url(self):
        self.user.profile_image = "https://example.com/profile.png"
        self.user.save(update_fields=["profile_image"])

        request = self.factory.get(f"/api/profile/{self.user.username}/picture/")
        response = download_profile_picture_public(request, username=self.user.username)

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], self.user.profile_image)

    def test_download_profile_picture_streams_from_media_root(self):
        rel_path = f"users/{self.user.id}/profile.jpg"
        abs_path = os.path.join(self.temp_media_root, rel_path)
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        with open(abs_path, "wb") as f:
            f.write(b"fake image bytes")

        self.user.profile_image = rel_path
        self.user.save(update_fields=["profile_image"])

        with override_settings(MEDIA_ROOT=self.temp_media_root, MEDIA_URL="/media/"):
            request = self.factory.get(f"/api/profile/{self.user.username}/picture/")
            response = download_profile_picture_public(request, username=self.user.username)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('attachment; filename="profile.jpg"', response["Content-Disposition"])

    def test_download_profile_picture_accepts_media_url_prefixed_path(self):
        rel_path = f"users/{self.user.id}/profile2.png"
        abs_path = os.path.join(self.temp_media_root, rel_path)
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        with open(abs_path, "wb") as f:
            f.write(b"fake image bytes 2")

        self.user.profile_image = f"/media/{rel_path}"
        self.user.save(update_fields=["profile_image"])

        with override_settings(MEDIA_ROOT=self.temp_media_root, MEDIA_URL="/media/"):
            request = self.factory.get(f"/api/profile/{self.user.username}/picture/")
            response = download_profile_picture_public(request, username=self.user.username)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('attachment; filename="profile2.png"', response["Content-Disposition"])

