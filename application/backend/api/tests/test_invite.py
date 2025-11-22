from django.test import TestCase,override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
    EMAIL_HOST="smtp-relay.brevo.com",
    EMAIL_PORT=587,
    EMAIL_USE_TLS=True,
    EMAIL_HOST_USER="9c45cb001@smtp-brevo.com",
    EMAIL_HOST_PASSWORD="bskyBVOhTWMa17c",
    DEFAULT_FROM_EMAIL="no_reply@zerowaste.ink"
)

class RealEmailSendTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        # test için kullanıcı oluştur
        self.user = get_user_model().objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )

        # login
        self.client.force_authenticate(user=self.user)

    def test_real_email_send(self):
        """
        This test sends a real email using Brevo/Namecheap SMTP.
        NO MOCKING.
        """

        payload = {
            "email": "basar.temiz2004@gmail.com"  
        }

        response = self.client.post(
            "/api/invite/send/",    
            payload,
            format="json"
        )

        print("REAL SMTP RESPONSE:", response.data)

        # 200 dönmeli
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Invitation email sent", response.data["message"])
