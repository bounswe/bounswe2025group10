from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate, APIClient
from rest_framework import status
from api.models import Users, Waste, UserWastes
from challenges.models import Challenge, UserChallenge
from api.waste.waste_views import create_user_waste, get_user_wastes, get_top_users
from django.utils import timezone
from unittest.mock import patch, MagicMock

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
        """Test successful retrieval of top users with waste contributions as CO2 emissions"""
        # Set up mock return values for CO2 emissions
        # We'll use a multiplier of 2 for simplicity (e.g., 10kg waste = 20kg CO2)
        def mock_co2_calculation(amount, waste_type):
            return amount * 2
            
        mock_get_co2_emission.side_effect = mock_co2_calculation
        
        # Create additional test users with different waste amounts
        user2 = Users.objects.create_user(
            username="testuser2",
            email="test2@example.com",
            password="testpass123"
        )
        user3 = Users.objects.create_user(
            username="testuser3",
            email="test3@example.com",
            password="testpass123"
        )
        
        # Create waste records for users
        # User 2 has most waste (10.0)
        UserWastes.objects.create(
            user=user2,
            waste=self.plastic,
            amount=5.0,
            date=timezone.now()
        )
        UserWastes.objects.create(
            user=user2,
            waste=self.paper,
            amount=5.0,
            date=timezone.now()
        )
        
        # User 3 has second most waste (4.0)
        UserWastes.objects.create(
            user=user3,
            waste=self.glass,
            amount=4.0,
            date=timezone.now()
        )
          # Original test user has 3.5 total (1.5 + 2.0 from setUp)
        
        request = self.factory.get('/api/waste/leaderboard/')
        response = get_top_users(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Top users retrieved successfully')
        
        # Verify the response data
        users_data = response.data['data']
        self.assertTrue(len(users_data) <= 10)  # Should not exceed 10 users
        
        # Verify CO2 emission values with 4 decimal places format
        self.assertEqual(users_data[0]['username'], 'testuser2')
        self.assertEqual(users_data[0]['total_waste'], "20.0000")  # 10.0 kg waste * 2, formatted to 4 decimals
        self.assertEqual(users_data[1]['username'], 'testuser3')
        self.assertEqual(users_data[1]['total_waste'], "8.0000")   # 4.0 kg waste * 2, formatted to 4 decimals
        self.assertEqual(users_data[2]['username'], 'testuser')
        self.assertEqual(users_data[2]['total_waste'], "7.0000")   # 3.5 kg waste * 2, formatted to 4 decimals
        
        # Verify that points are included in the response
        point_coefficients = {
            'PLASTIC': 0.03,  # 3 points per 100g
            'PAPER': 0.02,    # 2 points per 100g
            'GLASS': 0.015,   # 1.5 points per 100g
            'METAL': 0.04,    # 4 points per 100g
        }
        
        # Calculate expected points for each user
        user2_points = 5.0 * point_coefficients['PLASTIC'] + 5.0 * point_coefficients['PAPER']  # 0.15 + 0.10 = 0.25
        user3_points = 4.0 * point_coefficients['GLASS']  # 0.06
        testuser_points = 1.5 * point_coefficients['PLASTIC'] + 2.0 * point_coefficients['PAPER']  # 0.045 + 0.04 = 0.085
        
        self.assertEqual(users_data[0]['points'], user2_points)
        self.assertEqual(users_data[1]['points'], user3_points)
        self.assertEqual(users_data[2]['points'], testuser_points)
        
        # Verify that get_co2_emission was called for each waste type
        self.assertTrue(mock_get_co2_emission.called)
        self.assertGreaterEqual(mock_get_co2_emission.call_count, 3)  # Called at least once for each user

    @patch('api.waste.waste_views.get_co2_emission')
    def test_get_top_users_no_waste(self, mock_get_co2_emission):
        """Test top users endpoint when there are no waste records"""
        # Delete all waste records
        UserWastes.objects.all().delete()
        
        request = self.factory.get('/api/waste/leaderboard/')
        response = get_top_users(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 0)  # Should return empty list
        # Verify that get_co2_emission was not called
        mock_get_co2_emission.assert_not_called()
    @patch('api.waste.waste_views.get_co2_emission')
    def test_get_top_users_single_user(self, mock_get_co2_emission):
        """Test top users endpoint with only one user having waste records"""        # Set up mock return values for CO2 emissions
        # We'll use a fixed value of 3.0 for simplicity
        def mock_co2_calculation(amount, waste_type):
            return 3.0
            
        mock_get_co2_emission.side_effect = mock_co2_calculation
        
        # Delete any existing waste records from setUp
        UserWastes.objects.all().delete()
        
        # Create single waste record
        UserWastes.objects.create(
            user=self.user,
            waste=self.plastic,
            amount=1.5,
            date=timezone.now()
        )
        
        request = self.factory.get('/api/waste/leaderboard/')
        response = get_top_users(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['username'], 'testuser')
        self.assertEqual(response.data['data'][0]['total_waste'], "3.0000")  # CO2 emission value with 4 decimal places
        
        # Verify points are included in the response
        expected_points = 1.5 * 0.03  # 1.5kg of PLASTIC * 0.03 points per 100g = 0.045 points
        self.assertEqual(response.data['data'][0]['points'], expected_points)
        
        mock_get_co2_emission.assert_called_once()

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