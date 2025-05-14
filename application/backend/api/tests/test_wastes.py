from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate, APIClient
from rest_framework import status
from api.models import Users, Waste, UserWastes
from challenges.models import Challenge, UserChallenge
from api.waste.waste_views import create_user_waste, get_user_wastes, get_top_users, point_coefficients
from django.utils import timezone
from unittest.mock import patch, MagicMock
from django.db.models import F

class WasteViewsTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        # Create test user
        self.user = Users.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        # Get or create waste types
        self.plastic, _ = Waste.objects.get_or_create(type='PLASTIC')
        self.paper, _ = Waste.objects.get_or_create(type='PAPER')
        self.glass, _ = Waste.objects.get_or_create(type='GLASS')
        self.metal, _ = Waste.objects.get_or_create(type='METAL')
        
        # Create some test waste records
        UserWastes.objects.create(
            user=self.user,
            waste=self.plastic,
            amount=1.5,
            date=timezone.now()
        )
        UserWastes.objects.create(
            user=self.user,
            waste=self.paper,
            amount=2.0,
            date=timezone.now()
        )

    def test_create_user_waste_success(self):
        """Test successful creation of user waste"""
        request = self.factory.post('/api/waste/', {
            'waste_type': 'GLASS',
            'amount': 3.5
        }, format='json')
        force_authenticate(request, user=self.user)
        response = create_user_waste(request)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'Waste recorded successfully')
        self.assertEqual(response.data['data']['amount'], 3.5)
        self.assertEqual(response.data['data']['type'], 'GLASS')

    def test_create_user_waste_invalid_type(self):
        """Test creation with invalid waste type"""
        request = self.factory.post('/api/waste/', {
            'waste_type': 'INVALID',
            'amount': 1.0
        }, format='json')
        force_authenticate(request, user=self.user)
        response = create_user_waste(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_user_waste_missing_data(self):
        """Test creation with missing data"""
        request = self.factory.post('/api/waste/', {
            'waste_type': 'PLASTIC'
        }, format='json')
        force_authenticate(request, user=self.user)
        response = create_user_waste(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_user_waste_unauthenticated(self):
        """Test creation without authentication"""
        request = self.factory.post('/api/waste/', {
            'waste_type': 'PLASTIC',
            'amount': 1.0
        }, format='json')
        response = create_user_waste(request)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_user_wastes_success(self):
        """Test successful retrieval of user wastes"""
        request = self.factory.get('/api/waste/get/')
        force_authenticate(request, user=self.user)
        response = get_user_wastes(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'User wastes retrieved successfully')
        # Should return all waste types (4)
        self.assertEqual(len(response.data['data']), 4)
        
        # Verify the amounts for waste types we created
        waste_data = {item['waste_type']: item['total_amount'] for item in response.data['data']}
        self.assertEqual(waste_data['PLASTIC'], 1.5)
        self.assertEqual(waste_data['PAPER'], 2.0)
        self.assertEqual(waste_data['GLASS'], 0)
        self.assertEqual(waste_data['METAL'], 0)

    def test_get_user_wastes_unauthenticated(self):
        """Test retrieval without authentication"""
        request = self.factory.get('/api/waste/get/')
        response = get_user_wastes(request)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_user_wastes_empty(self):
        """Test retrieval with no waste records"""
        # Delete all user wastes
        UserWastes.objects.all().delete()
        
        request = self.factory.get('/api/waste/get/')
        force_authenticate(request, user=self.user)
        response = get_user_wastes(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should still return all waste types with 0 amounts
        self.assertEqual(len(response.data['data']), 4)
        for item in response.data['data']:
            self.assertEqual(item['total_amount'], 0)

            
    @patch('api.waste.waste_views.get_co2_emission')
    def test_get_top_users_success(self, mock_get_co2_emission):
        """Test successful retrieval of top users with waste contributions"""
        # Set up mock CO2 calculation
        def mock_co2_calculation(amount, waste_type):
            return amount * 2
        mock_get_co2_emission.side_effect = mock_co2_calculation
        
        # Create test users with initial values
        user2 = Users.objects.create_user(
            username="testuser2",
            email="test2@example.com",
            password="testpass123",
            total_points=0,
            total_co2=0
        )
        user3 = Users.objects.create_user(
            username="testuser3",
            email="test3@example.com",
            password="testpass123",
            total_points=0,
            total_co2=0
        )
        
        # Reset original test user's totals
        self.user.total_points = 0
        self.user.total_co2 = 0
        self.user.save()
        
        # Create waste records and update user2's totals (10kg total)
        waste1 = UserWastes.objects.create(
            user=user2,
            waste=self.plastic,
            amount=5.0,
            date=timezone.now()
        )
        waste2 = UserWastes.objects.create(
            user=user2,
            waste=self.paper,
            amount=5.0,
            date=timezone.now()
        )
        
        # Update user2's totals
        user2.total_points = (5.0 * 0.03) + (5.0 * 0.02)  # Plastic + Paper points
        user2.total_co2 = 20.0  # 10kg total * 2 (mock multiplier)
        user2.save()
        
        # Create waste record and update user3's totals (4kg)
        waste3 = UserWastes.objects.create(
            user=user3,
            waste=self.glass,
            amount=4.0,
            date=timezone.now()
        )
        user3.total_points = 4.0 * 0.015  # Glass points
        user3.total_co2 = 8.0  # 4kg * 2
        user3.save()
        
        request = self.factory.get('/api/waste/leaderboard/')
        response = get_top_users(request)
          # Verify response structure
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Top users retrieved successfully')
        
        # Check data format
        self.assertIn('top_users', response.data['data'])
        top_users = response.data['data']['top_users']
        self.assertTrue(len(top_users) <= 10)
        
        # Verify user2 (highest contributor)
        self.assertEqual(top_users[0]['username'], 'testuser2')
        self.assertEqual(top_users[0]['total_waste'], "20.0000")
        self.assertEqual(top_users[0]['points'], 0.25)  # (5*0.03 + 5*0.02)
        
        # Verify user3 (second highest)
        self.assertEqual(top_users[1]['username'], 'testuser3')
        self.assertEqual(top_users[1]['total_waste'], "8.0000")
        self.assertEqual(top_users[1]['points'], 0.06)  # 4*0.015

    @patch('api.waste.waste_views.get_co2_emission')
    def test_get_top_users_no_waste(self, mock_get_co2_emission):
        """Test top users endpoint when there are no waste records"""
        # Delete all waste records
        UserWastes.objects.all().delete()
        
        request = self.factory.get('/api/waste/leaderboard/')
        response = get_top_users(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('top_users', response.data['data'])
        self.assertEqual(len(response.data['data']['top_users']), 0)  # Should return empty list
        # Verify that get_co2_emission was not called
        mock_get_co2_emission.assert_not_called()

    @patch('api.waste.waste_views.get_co2_emission')
    def test_get_top_users_single_user(self, mock_get_co2_emission):
        """Test top users endpoint with single user"""
        # Set up mock CO2 calculation
        def mock_co2_calculation(amount, waste_type):
            return amount * 2
        mock_get_co2_emission.side_effect = mock_co2_calculation
        
        # Clear existing records and reset user totals
        UserWastes.objects.all().delete()
        self.user.total_points = 0
        self.user.total_co2 = 0
        self.user.save()
        
        # Create waste record and calculate CO2
        amount = 1.5
        waste = UserWastes.objects.create(
            user=self.user,
            waste=self.plastic,
            amount=amount,
            date=timezone.now()
        )
        
        # Calculate values using the mock
        co2_emission = mock_get_co2_emission(amount, 'PLASTIC')
        points = amount * 0.03  # Plastic points
        
        # Update user totals with calculated values
        self.user.total_points = points
        self.user.total_co2 = co2_emission
        self.user.save()
        
        # Test the endpoint
        request = self.factory.get('/api/waste/leaderboard/')
        response = get_top_users(request)
          # Verify response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('top_users', response.data['data'])
        top_users = response.data['data']['top_users']
        self.assertEqual(len(top_users), 1)
        
        user_data = top_users[0]
        self.assertEqual(user_data['username'], 'testuser')
        self.assertEqual(user_data['total_waste'], "3.0000")  # 1.5 * 2 from mock
        self.assertEqual(user_data['points'], 0.045)  # 1.5 * 0.03
        
        # Verify that the mock was called with correct parameters
        mock_get_co2_emission.assert_called_with(amount, 'PLASTIC')


    @patch('api.waste.waste_views.get_co2_emission')
    def test_get_top_users_with_unranked_user(self, mock_get_co2_emission):
        """Test get_top_users with an authenticated user who has no waste records"""
        # Clear all existing waste records and reset user totals
        UserWastes.objects.all().delete()
        Users.objects.all().update(total_points=0, total_co2=0)
        
        # Set up mock CO2 calculation
        def mock_co2_calculation(amount, waste_type):
            return amount * 2
        mock_get_co2_emission.side_effect = mock_co2_calculation
        
        # Create a few users with waste records
        for i in range(1, 5):
            user = Users.objects.create_user(
                username=f"user{i}",
                email=f"user{i}@example.com",
                password="password"
            )
            
            # Add waste records
            waste = UserWastes.objects.create(
                user=user,
                waste=self.plastic,
                amount=i,
                date=timezone.now()
            )
            
            # Calculate and update totals
            co2 = i * 2  # From mock
            points = i * point_coefficients.get('PLASTIC', 0)
            user.total_co2 = co2
            user.total_points = points
            user.save()
        
        # Make sure our test user has no waste records
        UserWastes.objects.filter(user=self.user).delete()
        self.user.total_co2 = 0
        self.user.total_points = 0
        self.user.save()
        
        # Test the endpoint with authentication
        request = self.factory.get('/api/waste/leaderboard/')
        force_authenticate(request, user=self.user)
        response = get_top_users(request)
        
        # Verify response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify current_user is present
        self.assertIn('current_user', response.data['data'])
        current_user = response.data['data']['current_user']
        
        # Fix indentation of assertion
        self.assertEqual(current_user['rank'], 'Not ranked')
        self.assertEqual(current_user['total_waste'], "0.0000")
        self.assertEqual(current_user['points'], 0)

@patch('api.waste.waste_views.requests.post')
def test_climatiq_api_integration(self, mock_post):
    """Test the integration with Climatiq API for CO2 emission calculation"""
    # Create mock response for Climatiq API call
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {'co2e': 2.5, 'co2e_unit': 'kg'}
    mock_post.return_value = mock_response
    
    # Import the function directly for testing
    from api.waste.waste_views import get_co2_emission
    
    # Test plastic waste CO2 calculation
    result = get_co2_emission(1.0, 'PLASTIC')
    self.assertEqual(result, 2.5)
    
    # Verify the API was called with correct parameters
    mock_post.assert_called_once()
    args, kwargs = mock_post.call_args
    
    # Check the request sent to Climatiq
    self.assertEqual(kwargs['json']['parameters']['weight'], 1.0)
    self.assertEqual(kwargs['json']['parameters']['weight_unit'], 'kg')
    self.assertIn('emission_factor', kwargs['json'])
    self.assertIn('activity_id', kwargs['json']['emission_factor'])
    self.assertIn('data_version', kwargs['json']['emission_factor'])
    
    # Reset the mock to test error handling
    mock_post.reset_mock()
    
    # Test error handling with HTTP error
    mock_response.status_code = 400
    mock_post.return_value = mock_response
    result = get_co2_emission(1.0, 'PAPER')
    self.assertEqual(result, 0)