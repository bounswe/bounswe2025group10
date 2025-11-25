from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status


class RecyclingCentersTests(TestCase):
    """Test suite for recycling centers endpoints"""
    
    def setUp(self):
        """Set up test client"""
        self.client = APIClient()
        
    def test_get_cities_success(self):
        """Test successful retrieval of all cities"""
        url = reverse('get_cities')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreater(len(response.data), 0)
        
        # Check that expected cities are in the response
        expected_cities = ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana", "Gaziantep", "Aydin"]
        for city in expected_cities:
            self.assertIn(city, response.data)
    
    def test_get_cities_returns_correct_count(self):
        """Test that get_cities returns the correct number of cities"""
        url = reverse('get_cities')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # We have 8 cities in the data
        self.assertEqual(len(response.data), 8)
    
    def test_get_districts_success_istanbul(self):
        """Test successful retrieval of districts for Istanbul"""
        url = reverse('get_districts')
        response = self.client.get(url, {'city': 'Istanbul'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreater(len(response.data), 0)
        
        # Check expected districts
        expected_districts = ["Sultangazi", "Beylikduzu", "Atasehir"]
        for district in expected_districts:
            self.assertIn(district, response.data)
    
    def test_get_districts_success_ankara(self):
        """Test successful retrieval of districts for Ankara"""
        url = reverse('get_districts')
        response = self.client.get(url, {'city': 'Ankara'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 5)  # Ankara has 5 districts
        
        # Check some expected districts
        self.assertIn("Mamak", response.data)
        self.assertIn("Kecioren", response.data)
    
    def test_get_districts_missing_city_parameter(self):
        """Test get_districts without city parameter returns 400"""
        url = reverse('get_districts')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'City parameter is required')
    
    def test_get_districts_city_not_found(self):
        """Test get_districts with non-existent city returns 404"""
        url = reverse('get_districts')
        response = self.client.get(url, {'city': 'NonExistentCity'})
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'City not found')
    
    def test_get_districts_case_sensitive(self):
        """Test that city name is case-sensitive"""
        url = reverse('get_districts')
        response = self.client.get(url, {'city': 'istanbul'})  # lowercase
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_get_recycling_centers_by_city_only(self):
        """Test getting all recycling centers for a city"""
        url = reverse('get_recycling_centers')
        response = self.client.get(url, {'city': 'Istanbul'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 3)  # Istanbul has 3 centers
        
        # Verify structure of returned data
        center = response.data[0]
        self.assertIn('ilce', center)
        self.assertIn('adres', center)
        self.assertIn('not', center)
        self.assertIn('turler', center)
        self.assertIsInstance(center['turler'], list)
    
    def test_get_recycling_centers_by_city_and_district(self):
        """Test getting recycling centers filtered by city and district"""
        url = reverse('get_recycling_centers')
        response = self.client.get(url, {'city': 'Istanbul', 'district': 'Beylikduzu'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 1)
        
        center = response.data[0]
        self.assertEqual(center['ilce'], 'Beylikduzu')
        self.assertIn('Beylikduzu 1. Sinif Atik Getirme Merkezi', center['adres'])
        self.assertIn('paper', center['turler'])
        self.assertIn('plastic', center['turler'])
        self.assertIn('electronic', center['turler'])
    
    def test_get_recycling_centers_ankara_multiple_centers(self):
        """Test getting multiple recycling centers for Ankara"""
        url = reverse('get_recycling_centers')
        response = self.client.get(url, {'city': 'Ankara'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)  # Ankara has 5 centers
    
    def test_get_recycling_centers_missing_city_parameter(self):
        """Test get_recycling_centers without city parameter returns 400"""
        url = reverse('get_recycling_centers')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'City parameter is required')
    
    def test_get_recycling_centers_city_not_found(self):
        """Test get_recycling_centers with non-existent city returns 404"""
        url = reverse('get_recycling_centers')
        response = self.client.get(url, {'city': 'NonExistentCity'})
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
    
    def test_get_recycling_centers_district_not_found(self):
        """Test get_recycling_centers with non-existent district returns 404"""
        url = reverse('get_recycling_centers')
        response = self.client.get(url, {'city': 'Istanbul', 'district': 'NonExistentDistrict'})
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'No recycling centers found for the given filters')
    
    def test_recycling_center_waste_types(self):
        """Test that recycling centers have correct waste types"""
        url = reverse('get_recycling_centers')
        response = self.client.get(url, {'city': 'Istanbul', 'district': 'Sultangazi'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        center = response.data[0]
        
        # Sultangazi center only accepts electronic waste
        self.assertEqual(center['turler'], ['electronic'])
    
    def test_recycling_center_multiple_waste_types(self):
        """Test recycling center with multiple waste types"""
        url = reverse('get_recycling_centers')
        response = self.client.get(url, {'city': 'Ankara', 'district': 'Mamak'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        center = response.data[0]
        
        # Mamak center accepts many types of waste
        expected_types = ['paper', 'plastic', 'metal', 'glass', 'electronic', 'battery']
        for waste_type in expected_types:
            self.assertIn(waste_type, center['turler'])
    
    def test_all_endpoints_allow_unauthenticated_access(self):
        """Test that all endpoints work without authentication"""
        # Test cities endpoint
        url_cities = reverse('get_cities')
        response = self.client.get(url_cities)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test districts endpoint
        url_districts = reverse('get_districts')
        response = self.client.get(url_districts, {'city': 'Istanbul'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test centers endpoint
        url_centers = reverse('get_recycling_centers')
        response = self.client.get(url_centers, {'city': 'Istanbul'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_bursa_recycling_centers(self):
        """Test specific data for Bursa"""
        url = reverse('get_recycling_centers')
        response = self.client.get(url, {'city': 'Bursa'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)
        
        # Check for Nilufer district
        nilufer_centers = [c for c in response.data if 'Nilufer' in c['ilce']]
        self.assertGreater(len(nilufer_centers), 0)
    
    def test_aydin_multiple_districts(self):
        """Test Aydin which has multiple centers in different districts"""
        url = reverse('get_recycling_centers')
        response = self.client.get(url, {'city': 'Aydin'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)
        
        # Check that different districts exist
        districts = [center['ilce'] for center in response.data]
        self.assertIn('Kusadasi', districts)
        self.assertIn('Didim', districts)
    
    def test_response_data_structure_completeness(self):
        """Test that response contains all required fields"""
        url = reverse('get_recycling_centers')
        response = self.client.get(url, {'city': 'Antalya', 'district': 'Konyaalti'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        center = response.data[0]
        
        # All required fields should be present
        required_fields = ['ilce', 'adres', 'not', 'turler']
        for field in required_fields:
            self.assertIn(field, center)
            self.assertIsNotNone(center[field])
        
        # Verify data types
        self.assertIsInstance(center['ilce'], str)
        self.assertIsInstance(center['adres'], str)
        self.assertIsInstance(center['not'], str)
        self.assertIsInstance(center['turler'], list)
