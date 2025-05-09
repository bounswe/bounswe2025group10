from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from api.models import Users, Waste, UserWastes
from api.waste.waste_views import create_user_waste, get_user_wastes
from django.utils import timezone

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
        print("Response:", response.data)
        
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