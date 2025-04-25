from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class AuthenticationTests(APITestCase):
    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        self.signup_url = reverse('signup')
        self.login_url = reverse('login')
        self.jwt_create_url = reverse('jwt_create')
        self.jwt_refresh_url = reverse('token_refresh')
        self.jwt_verify_url = reverse('token_verify')
        
        self.user_data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'testpass123'
        }
        self.login_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }

    def test_user_signup(self):
        """Test user registration"""
        response = self.client.post(self.signup_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().email, 'test@example.com')

    def test_user_signup_invalid_data(self):
        """Test user registration with invalid data"""
        invalid_data = {
            'email': 'invalid-email',
            'username': '',
            'password': 'short'
        }
        response = self.client.post(self.signup_url, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login(self):
        """Test user login with valid credentials"""
        # First create a user
        User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        
        response = self.client.post(self.login_url, self.login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_jwt_token_creation(self):
        """Test JWT token creation"""
        User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        
        response = self.client.post(self.jwt_create_url, self.login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_jwt_token_refresh(self):
        """Test JWT token refresh"""
        # First get a refresh token
        User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        
        token_response = self.client.post(self.jwt_create_url, self.login_data)
        refresh_token = token_response.data['refresh']
        
        response = self.client.post(self.jwt_refresh_url, {'refresh': refresh_token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

class ProtectedEndpointsTests(APITestCase):
    def setUp(self):
        """Set up test data and authenticated client"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_get_user_info(self):
        """Test protected user info endpoint"""
        url = reverse('user-info')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertTrue(response.data['is_authenticated'])

    def test_get_user_info_unauthorized(self):
        """Test protected endpoint without authentication"""
        self.client.force_authenticate(user=None)
        url = reverse('user-info')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class ServerStatusTests(APITestCase):
    def test_server_status(self):
        """Test server status endpoint"""
        url = reverse('server_status')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'Server is running')
