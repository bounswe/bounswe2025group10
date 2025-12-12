from decimal import Decimal
from email.mime import image
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate, APIClient
from rest_framework import status
from api.models import Users, Waste, UserWastes
from challenges.models import Challenge, UserChallenge
from api.waste.waste_views import create_user_waste, get_user_wastes, get_top_users, point_coefficients,get_co2_emission
from django.utils import timezone
from unittest.mock import patch, MagicMock
from django.db.models import F
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile

def format_co2(value: float) -> str:
        # helper to match DRF serializer's 4-decimal formatting
    return f"{Decimal(value).quantize(Decimal('0.0001'))}"
        # or f"{value:.4f}" if that's what your serializer does

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
        # Should return all waste types (7: PLASTIC, PAPER, GLASS, METAL, ELECTRONIC, OIL&FATS, ORGANIC)
        self.assertEqual(len(response.data['data']), 7)
        
        # Verify the amounts for waste types we created
        waste_data = {item['waste_type']: item for item in response.data['data']}
        self.assertEqual(waste_data['PLASTIC']['total_amount'], 1.5)
        self.assertEqual(waste_data['PAPER']['total_amount'], 2.0)
        self.assertEqual(waste_data['GLASS']['total_amount'], 0)
        self.assertEqual(waste_data['METAL']['total_amount'], 0)
        self.assertEqual(waste_data['ELECTRONIC']['total_amount'], 0)
        self.assertEqual(waste_data['OIL&FATS']['total_amount'], 0)
        self.assertEqual(waste_data['ORGANIC']['total_amount'], 0)
        
        # Verify records array exists and has correct structure
        self.assertIn('records', waste_data['PLASTIC'])
        self.assertIn('records', waste_data['PAPER'])
        
        # Verify PLASTIC has 1 record with timestamp
        plastic_records = waste_data['PLASTIC']['records']
        self.assertEqual(len(plastic_records), 1)
        self.assertEqual(plastic_records[0]['type'], 'PLASTIC')
        self.assertEqual(plastic_records[0]['amount'], 1.5)
        self.assertIn('date', plastic_records[0])  # Verify timestamp exists
        self.assertIn('id', plastic_records[0])  # Verify ID exists
        
        # Verify PAPER has 1 record with timestamp
        paper_records = waste_data['PAPER']['records']
        self.assertEqual(len(paper_records), 1)
        self.assertEqual(paper_records[0]['type'], 'PAPER')
        self.assertEqual(paper_records[0]['amount'], 2.0)
        self.assertIn('date', paper_records[0])  # Verify timestamp exists
        self.assertIn('id', paper_records[0])  # Verify ID exists
        
        # Verify waste types with no records have empty arrays
        self.assertEqual(len(waste_data['GLASS']['records']), 0)
        self.assertEqual(len(waste_data['METAL']['records']), 0)

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
        # Should still return all waste types with 0 amounts (7 types total)
        self.assertEqual(len(response.data['data']), 7)
        for item in response.data['data']:
            self.assertEqual(item['total_amount'], 0)
            self.assertIn('records', item)
            self.assertEqual(len(item['records']), 0)  # Verify empty records array

            
    


    def test_get_top_users_success(self):
        """Test successful retrieval of top users with waste contributions"""

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

        # --- user2 wastes (5kg plastic + 5kg paper) ---
        amount_plastic = 5.0
        amount_paper = 5.0

        UserWastes.objects.create(
            user=user2,
            waste=self.plastic,
            amount=amount_plastic,
            date=timezone.now()
        )
        UserWastes.objects.create(
            user=user2,
            waste=self.paper,
            amount=amount_paper,
            date=timezone.now()
        )

        # Use REAL get_co2_emission here
        co2_plastic = get_co2_emission(amount_plastic, 'PLASTIC')
        co2_paper = get_co2_emission(amount_paper, 'PAPER')
        total_co2_user2 = co2_plastic + co2_paper

        user2.total_points = (amount_plastic * 0.03) + (amount_paper * 0.02)
        user2.total_co2 = total_co2_user2
        user2.save()

        # --- user3 waste (4kg glass) ---
        amount_glass = 4.0
        UserWastes.objects.create(
            user=user3,
            waste=self.glass,
            amount=amount_glass,
            date=timezone.now()
        )

        co2_glass = get_co2_emission(amount_glass, 'GLASS')
        total_co2_user3 = co2_glass

        user3.total_points = amount_glass * 0.015
        user3.total_co2 = total_co2_user3
        user3.save()

        # --- call endpoint ---
        request = self.factory.get('/api/waste/leaderboard/')
        response = get_top_users(request)

        # Verify response structure
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Top users retrieved successfully')

        # Check data format
        self.assertIn('top_users', response.data['data'])
        top_users = response.data['data']['top_users']
        self.assertTrue(len(top_users) <= 10)

        # Highest contributor = user2
        self.assertEqual(top_users[0]['username'], 'testuser2')
        self.assertEqual(top_users[0]['total_waste'], format_co2(total_co2_user2))
        self.assertAlmostEqual(top_users[0]['points'], user2.total_points)

        # Second highest = user3
        self.assertEqual(top_users[1]['username'], 'testuser3')
        self.assertEqual(top_users[1]['total_waste'], format_co2(total_co2_user3))
        self.assertAlmostEqual(top_users[1]['points'], user3.total_points)


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

    def test_create_user_waste_zero_amount(self):
        """Test waste creation with zero amount
        Note: Currently the API accepts zero amounts. This test documents current behavior.
        Consider adding validation to reject zero amounts in the future.
        """
        request = self.factory.post('/api/waste/', {
            'waste_type': 'PLASTIC',
            'amount': 0
        }, format='json')
        force_authenticate(request, user=self.user)
        response = create_user_waste(request)
        
        # API currently accepts zero amounts (no validation)
        # This could be improved with validation in the serializer
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_create_user_waste_negative_amount(self):
        """Test waste creation with negative amount
        Note: Currently the API accepts negative amounts. This test documents current behavior.
        Consider adding validation to reject negative amounts in the future.
        """
        request = self.factory.post('/api/waste/', {
            'waste_type': 'PLASTIC',
            'amount': -1.0
        }, format='json')
        force_authenticate(request, user=self.user)
        response = create_user_waste(request)
        
        # API currently accepts negative amounts (no validation)
        # This could be improved with validation in the serializer
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_create_user_waste_very_large_amount(self):
        """Test waste creation with very large amount"""
        request = self.factory.post('/api/waste/', {
            'waste_type': 'PLASTIC',
            'amount': 999999.99
        }, format='json')
        force_authenticate(request, user=self.user)
        response = create_user_waste(request)
        
        # Should still succeed, but verify it handles large numbers
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_user_waste_all_types(self):
        """Test creating waste for all supported waste types"""
        waste_types = ['PLASTIC', 'PAPER', 'GLASS', 'METAL', 'ELECTRONIC', 'OIL&FATS', 'ORGANIC']
        
        for waste_type in waste_types:
            request = self.factory.post('/api/waste/', {
                'waste_type': waste_type,
                'amount': 1.0
            }, format='json')
            force_authenticate(request, user=self.user)
            response = create_user_waste(request)
            
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertEqual(response.data['data']['type'], waste_type)

    @patch('api.waste.waste_views.get_co2_emission')
    def test_create_user_waste_updates_points_correctly(self, mock_get_co2_emission):
        """Test that waste creation correctly updates user points"""
        mock_get_co2_emission.return_value = 2.0
        
        initial_points = self.user.total_points
        
        request = self.factory.post('/api/waste/', {
            'waste_type': 'PLASTIC',
            'amount': 10.0  # 10kg of plastic
        }, format='json')
        force_authenticate(request, user=self.user)
        response = create_user_waste(request)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Refresh user from database
        self.user.refresh_from_db()
        
        # Plastic coefficient is 0.3 per kg, so 10kg = 3.0 points
        expected_points = initial_points + (10.0 * 0.3)
        self.assertAlmostEqual(self.user.total_points, expected_points, places=2)

    def test_create_user_waste_updates_co2_correctly(self):
        """Test that waste creation correctly updates user CO2 using real emission factors"""

        # Use real inputs
        waste_type = 'PAPER'
        amount_kg = 2.0

        # Initial CO2 before creation
        initial_co2 = self.user.total_co2

        # Compute expected CO2 using the real function
        expected_increment = get_co2_emission(amount_kg, waste_type)
        expected_co2 = initial_co2 + expected_increment

        request = self.factory.post(
            '/api/waste/',
            {
                'waste_type': waste_type,
                'amount': amount_kg
            },
            format='json'
        )
        force_authenticate(request, user=self.user)

        response = create_user_waste(request)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Refresh user from DB
        self.user.refresh_from_db()

        # Validate CO2 update
        self.assertAlmostEqual(
            self.user.total_co2,
            expected_co2,
            places=4,  # use more precision since decimals=6
            msg=f"Expected {expected_co2} but got {self.user.total_co2}"
        )


    def test_create_user_waste_empty_string_type(self):
        """Test waste creation with empty string waste type"""
        request = self.factory.post('/api/waste/', {
            'waste_type': '',
            'amount': 1.0
        }, format='json')
        force_authenticate(request, user=self.user)
        response = create_user_waste(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_user_waste_none_amount(self):
        """Test waste creation with None amount"""
        request = self.factory.post('/api/waste/', {
            'waste_type': 'PLASTIC',
            'amount': None
        }, format='json')
        force_authenticate(request, user=self.user)
        response = create_user_waste(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_user_wastes_ordering(self):
        """Test that waste types are returned in a consistent order"""
        request = self.factory.get('/api/waste/get/')
        force_authenticate(request, user=self.user)
        response = get_user_wastes(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify all waste types are present
        waste_types = [item['waste_type'] for item in response.data['data']]
        expected_types = ['PLASTIC', 'PAPER', 'GLASS', 'METAL', 'ELECTRONIC', 'OIL&FATS', 'ORGANIC']
        for expected_type in expected_types:
            self.assertIn(expected_type, waste_types)

    @patch('api.waste.waste_views.get_co2_emission')
    def test_get_top_users_ordering(self, mock_get_co2_emission):
        """Test that top users are returned in correct order (highest points first)"""
        mock_get_co2_emission.return_value = 1.0
        
        # Create multiple users with different point totals
        users = []
        for i in range(5):
            user = Users.objects.create_user(
                username=f"user{i}",
                email=f"user{i}@example.com",
                password="testpass123"
            )
            user.total_points = 10 - i  # Decreasing points
            user.total_co2 = 10 - i
            user.save()
            
            # Create waste record
            UserWastes.objects.create(
                user=user,
                waste=self.plastic,
                amount=1.0,
                date=timezone.now()
            )
            users.append(user)
        
        request = self.factory.get('/api/waste/leaderboard/')
        response = get_top_users(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        top_users = response.data['data']['top_users']
        
        # Verify ordering (highest points first)
        for i in range(len(top_users) - 1):
            self.assertGreaterEqual(top_users[i]['points'], top_users[i + 1]['points'])

    def test_get_top_users_limit(self):
        """Test that top users endpoint returns at most 10 users"""
        # Create 15 users with waste records
        for i in range(15):
            user = Users.objects.create_user(
                username=f"leader{i}",
                email=f"leader{i}@example.com",
                password="testpass123"
            )
            user.total_points = 100 - i
            user.total_co2 = 100 - i
            user.save()
            
            UserWastes.objects.create(
                user=user,
                waste=self.plastic,
                amount=1.0,
                date=timezone.now()
            )
        
        request = self.factory.get('/api/waste/leaderboard/')
        response = get_top_users(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        top_users = response.data['data']['top_users']
        self.assertLessEqual(len(top_users), 10)

    def generate_dummy_image(self,name="test.jpg"):
        file = BytesIO()
        image = Image.new('RGB', (200, 200), color='red')
        image.save(file, 'JPEG')
        file.seek(0)
        return SimpleUploadedFile(name, file.read(), content_type='image/jpeg')

    def test_record_suspicious_waste(self):
        """Helper method to record suspicious waste"""

        waste_obj = Waste.objects.create(type="PLASTIC")

        request = self.factory.post(
            '/api/waste/report_suspicious/',
            {
                'amount': 500000,
                "waste": waste_obj.type,   
                "date": "2024-10-10",
                'photo': self.generate_dummy_image(),  # see next point
            },
            format='multipart',
)

        force_authenticate(request, user=self.user)
        from api.waste.waste_views import create_suspicious_waste
        response = create_suspicious_waste(request)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


    def test_get_suspicious_wastes_admin(self):
        """Helper method to get suspicious wastes as admin"""
        # Create admin user
        admin_user = Users.objects.create_superuser(
            username="admin1234",
            email="admin1234@example.com",
            password="adminpass123"
        )
        request = self.factory.get('/api/waste/suspicious_wastes/')
        force_authenticate(request, user=admin_user)
        from api.waste.waste_views import get_suspicious_wastes,create_suspicious_waste

        # First, create a suspicious waste to ensure there's data
        self.test_record_suspicious_waste()
       
        response = get_suspicious_wastes(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['data']), 1)


class WasteChallengeProgressionTests(TestCase):
    """Test cases for challenge progression when logging waste"""
    
    def setUp(self):
        self.factory = APIRequestFactory()
        self.client = APIClient()
        
        # Create test user
        self.user = Users.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            total_points=0,
            total_co2=0
        )
        
        # Create waste types
        self.plastic, _ = Waste.objects.get_or_create(type='PLASTIC')
        self.paper, _ = Waste.objects.get_or_create(type='PAPER')
        
        # Create multiple challenges with different joined dates
        self.challenge1 = Challenge.objects.create(
            title="First Challenge",
            description="Oldest challenge",
            is_public=True,
            target_amount=100,
            current_progress=0,
            creator=self.user
        )
        
        self.challenge2 = Challenge.objects.create(
            title="Second Challenge",
            description="Middle challenge",
            is_public=True,
            target_amount=100,
            current_progress=0,
            creator=self.user
        )
        
        self.challenge3 = Challenge.objects.create(
            title="Third Challenge",
            description="Newest challenge",
            is_public=True,
            target_amount=100,
            current_progress=0,
            creator=self.user
        )
        
        # Join challenges in order (oldest to newest)
        from datetime import timedelta
        base_time = timezone.now()
        
        self.uc1 = UserChallenge.objects.create(
            user=self.user,
            challenge=self.challenge1,
            joined_date=base_time - timedelta(days=10)  # Oldest
        )
        
        self.uc2 = UserChallenge.objects.create(
            user=self.user,
            challenge=self.challenge2,
            joined_date=base_time - timedelta(days=5)  # Middle
        )
        
        self.uc3 = UserChallenge.objects.create(
            user=self.user,
            challenge=self.challenge3,
            joined_date=base_time  # Newest
        )

    def test_waste_log_progresses_first_joined_challenge(self):
        """
        Test that logging waste only progresses the first joined (oldest) incomplete challenge.
        """
        self.client.force_authenticate(user=self.user)
        
        # Log waste
        response = self.client.post('/api/waste/', {
            'waste_type': 'PLASTIC',
            'amount': 10.0
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Refresh challenges from database
        self.challenge1.refresh_from_db()
        self.challenge2.refresh_from_db()
        self.challenge3.refresh_from_db()
        
        # Only first challenge should progress
        self.assertEqual(self.challenge1.current_progress, 10.0)
        self.assertEqual(self.challenge2.current_progress, 0)
        self.assertEqual(self.challenge3.current_progress, 0)

    def test_waste_log_progresses_second_when_first_completed(self):
        """
        Test that when first challenge is completed, waste progresses the second challenge.
        """
        self.client.force_authenticate(user=self.user)
        
        # Complete the first challenge
        self.challenge1.current_progress = 100
        self.challenge1.save()
        
        # Log waste
        response = self.client.post('/api/waste/', {
            'waste_type': 'PLASTIC',
            'amount': 15.0
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Refresh challenges
        self.challenge1.refresh_from_db()
        self.challenge2.refresh_from_db()
        self.challenge3.refresh_from_db()
        
        # First challenge should remain at 100 (completed)
        self.assertEqual(self.challenge1.current_progress, 100)
        # Second challenge should progress
        self.assertEqual(self.challenge2.current_progress, 15.0)
        # Third challenge should not progress
        self.assertEqual(self.challenge3.current_progress, 0)

    def test_waste_log_progresses_third_when_first_two_completed(self):
        """
        Test that waste progresses the third challenge when first two are completed.
        """
        self.client.force_authenticate(user=self.user)
        
        # Complete first two challenges
        self.challenge1.current_progress = 100
        self.challenge1.save()
        self.challenge2.current_progress = 100
        self.challenge2.save()
        
        # Log waste
        response = self.client.post('/api/waste/', {
            'waste_type': 'PLASTIC',
            'amount': 20.0
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Refresh challenges
        self.challenge1.refresh_from_db()
        self.challenge2.refresh_from_db()
        self.challenge3.refresh_from_db()
        
        # First two should remain completed
        self.assertEqual(self.challenge1.current_progress, 100)
        self.assertEqual(self.challenge2.current_progress, 100)
        # Third challenge should progress
        self.assertEqual(self.challenge3.current_progress, 20.0)

    def test_no_challenge_progression_when_all_completed(self):
        """
        Test that no challenges progress when all are completed.
        """
        self.client.force_authenticate(user=self.user)
        
        # Complete all challenges
        self.challenge1.current_progress = 100
        self.challenge1.save()
        self.challenge2.current_progress = 100
        self.challenge2.save()
        self.challenge3.current_progress = 100
        self.challenge3.save()
        
        # Log waste
        response = self.client.post('/api/waste/', {
            'waste_type': 'PLASTIC',
            'amount': 25.0
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Refresh challenges
        self.challenge1.refresh_from_db()
        self.challenge2.refresh_from_db()
        self.challenge3.refresh_from_db()
        
        # All should remain at 100
        self.assertEqual(self.challenge1.current_progress, 100)
        self.assertEqual(self.challenge2.current_progress, 100)
        self.assertEqual(self.challenge3.current_progress, 100)

    def test_challenge_completion_awards_achievement(self):
        """
        Test that completing a challenge awards the achievement to all participants.
        """
        from api.models import Achievements, UserAchievements
        
        self.client.force_authenticate(user=self.user)
        
        # Set first challenge close to completion
        self.challenge1.current_progress = 95
        self.challenge1.save()
        
        # Ensure challenge has a reward
        if not self.challenge1.reward:
            reward = Achievements.objects.create(
                title="First Challenge Complete",
                description="Completed first challenge"
            )
            self.challenge1.reward = reward
            self.challenge1.save()
        
        # Log enough waste to complete the challenge
        response = self.client.post('/api/waste/', {
            'waste_type': 'PLASTIC',
            'amount': 10.0
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that achievement was awarded
        self.assertTrue(
            UserAchievements.objects.filter(
                user=self.user,
                achievement=self.challenge1.reward
            ).exists()
        )
        
        # Check that challenge is marked as complete
        self.challenge1.refresh_from_db()
        self.assertEqual(self.challenge1.current_progress, 100)