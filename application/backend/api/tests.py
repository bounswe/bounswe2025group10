from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import User

class AuthenticationTests(APITestCase):
    def setUp(self):
        """Setup test data"""
        self.signup_url = reverse('signup')
        self.login_url = reverse('login')
        self.me_url = reverse('user-info')
        self.status_url = reverse('server_status')
        
        self.test_user_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        # Create a test user
        self.user = User.objects.create_user(
            username='existinguser',
            password='existing123'
        )

    def test_signup_success(self):
        """Test successful user registration"""
        response = self.client.post(self.signup_url, self.test_user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 2)
        self.assertIn('message', response.data)
        self.assertIn('data', response.data)

    def test_signup_duplicate_username(self):
        """Test registration with existing username"""
        duplicate_data = {
            'username': 'existinguser',
            'password': 'newpass123'
        }
        response = self.client.post(self.signup_url, duplicate_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        """Test successful login"""
        response = self.client.post(self.login_url, {
            'username': 'existinguser',
            'password': 'existing123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_login_wrong_credentials(self):
        """Test login with wrong credentials"""
        response = self.client.post(self.login_url, {
            'username': 'existinguser',
            'password': 'wrongpass'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_server_status(self):
        """Test server status endpoint"""
        response = self.client.get(self.status_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.data)
        self.assertEqual(response.data['status'], 'Server is running')

    def test_user_info_authenticated(self):
        """Test user info endpoint with authentication"""
        # Login to get token
        login_response = self.client.post(self.login_url, {
            'username': 'existinguser',
            'password': 'existing123'
        })
        token = login_response.data['token']['access']
        
        # Test /me/ endpoint with token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'existinguser')

    def test_user_info_unauthenticated(self):
        """Test user info endpoint without authentication"""
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
