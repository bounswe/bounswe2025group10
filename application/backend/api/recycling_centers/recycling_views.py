from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
from .recycling_data import RECYCLING_CENTERS_DATA


@extend_schema(
    summary="Get all cities with recycling centers",
    description="""
    Retrieve a list of all cities in Turkey that have registered recycling centers.
    
    This endpoint returns city names that can be used to query for districts and 
    recycling centers in subsequent API calls. No authentication is required.
    
    **Use Cases:**
    - Populate a dropdown or selection list of available cities
    - Discover which cities have recycling center data
    - First step in the recycling center discovery flow
    
    **Response Format:**
    Returns an array of city name strings (e.g., ["Istanbul", "Ankara", ...])
    """,
    responses={
        200: OpenApiResponse(
            description="List of cities retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value=["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana", "Gaziantep", "Aydin"],
                    response_only=True
                )
            ]
        )
    },
    tags=['Recycling Centers']
)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_cities(request):
    """
    Get all cities with recycling centers.
    Returns a list of city names.
    """
    cities = [city_data["il"] for city_data in RECYCLING_CENTERS_DATA]
    return Response(cities, status=status.HTTP_200_OK)


@extend_schema(
    summary="Get districts for a specific city",
    description="""
    Retrieve a list of all districts (ilçe) within a specific city that have recycling centers.
    
    This endpoint provides district-level data for a given city, allowing users to narrow down 
    their search for recycling centers. The results are sorted alphabetically and deduplicated.
    
    **Use Cases:**
    - Populate district dropdown after city selection
    - Display available districts for a selected city
    - Second step in the recycling center discovery flow
    
    **Parameters:**
    - `city` (required): Exact city name (case-sensitive, e.g., "Istanbul", "Ankara")
    
    **Response Format:**
    Returns an array of district name strings sorted alphabetically
    
    **Error Scenarios:**
    - 400: Missing city parameter
    - 404: City not found in the database (check spelling and case)
    
    **Example Request:**
    ```
    GET /api/recycling-centers/districts/?city=Istanbul
    ```
    """,
    parameters=[
        OpenApiParameter(
            name='city',
            type=str,
            location=OpenApiParameter.QUERY,
            description='City name (case-sensitive, e.g., "Istanbul", "Ankara")',
            required=True,
            examples=[
                OpenApiExample('Istanbul Example', value='Istanbul'),
                OpenApiExample('Ankara Example', value='Ankara'),
                OpenApiExample('Izmir Example', value='Izmir')
            ]
        )
    ],
    responses={
        200: OpenApiResponse(
            description="List of districts retrieved successfully",
            examples=[
                OpenApiExample(
                    'Istanbul Districts',
                    value=["Atasehir", "Beylikduzu", "Sultangazi"],
                    response_only=True
                ),
                OpenApiExample(
                    'Ankara Districts',
                    value=["Cankaya (Birlik Mah.)", "Cankaya (Cayyolu)", "Kecioren", "Mamak", "Yenimahalle (Ivedik OSB)"],
                    response_only=True
                )
            ]
        ),
        400: OpenApiResponse(
            description="City parameter is required",
            examples=[
                OpenApiExample(
                    'Missing City Parameter',
                    value={"error": "City parameter is required"},
                    response_only=True
                )
            ]
        ),
        404: OpenApiResponse(
            description="City not found in the database",
            examples=[
                OpenApiExample(
                    'City Not Found',
                    value={"error": "City not found"},
                    response_only=True
                )
            ]
        )
    },
    tags=['Recycling Centers']
)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_districts(request):
    """
    Get all districts for a specific city.
    Requires 'city' query parameter.
    Returns a list of district names.
    """
    city = request.query_params.get('city')
    
    if not city:
        return Response(
            {"error": "City parameter is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Find the city data
    city_data = next((c for c in RECYCLING_CENTERS_DATA if c["il"] == city), None)
    
    if not city_data:
        return Response(
            {"error": "City not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Extract unique districts
    districts = list(set([center["ilce"] for center in city_data["merkezler"]]))
    districts.sort()
    
    return Response(districts, status=status.HTTP_200_OK)


@extend_schema(
    summary="Get recycling centers by city and district",
    description="""
    Retrieve detailed information about recycling centers filtered by city and optionally by district.
    
    This is the main endpoint for finding recycling centers. It returns complete center information 
    including addresses, notes about services, and the types of waste accepted at each location.
    
    **Use Cases:**
    - Find all recycling centers in a city
    - Find recycling centers in a specific district
    - Display center details with addresses and accepted waste types
    - Help users locate the nearest recycling facility
    
    **Parameters:**
    - `city` (required): Exact city name (case-sensitive, e.g., "Istanbul", "Ankara")
    - `district` (optional): District name to filter results (case-sensitive)
    
    **Response Fields:**
    - `ilce`: District name where the center is located
    - `adres`: Full street address of the recycling center
    - `not`: Additional notes about services, operating hours, or special instructions
    - `turler`: Array of waste types accepted (e.g., "paper", "plastic", "glass", "electronic")
    
    **Waste Type Categories:**
    Common waste types include: paper, plastic, glass, metal, electronic, battery, textile, 
    wood, medicine, oil_fats, tire, organic, hazardous, bulky, accumulator, fluorescent, 
    construction, cable, it_equipment
    
    **Error Scenarios:**
    - 400: Missing required city parameter
    - 404: City not found, district not found, or no centers match the filters
    
    **Example Requests:**
    ```
    # Get all centers in Istanbul
    GET /api/recycling-centers/?city=Istanbul
    
    # Get centers in Beylikduzu district of Istanbul
    GET /api/recycling-centers/?city=Istanbul&district=Beylikduzu
    ```
    """,
    parameters=[
        OpenApiParameter(
            name='city',
            type=str,
            location=OpenApiParameter.QUERY,
            description='City name (case-sensitive, e.g., "Istanbul", "Ankara")',
            required=True,
            examples=[
                OpenApiExample('Istanbul', value='Istanbul'),
                OpenApiExample('Ankara', value='Ankara'),
                OpenApiExample('Bursa', value='Bursa')
            ]
        ),
        OpenApiParameter(
            name='district',
            type=str,
            location=OpenApiParameter.QUERY,
            description='District name for filtering (optional, case-sensitive)',
            required=False,
            examples=[
                OpenApiExample('Beylikduzu', value='Beylikduzu'),
                OpenApiExample('Mamak', value='Mamak'),
                OpenApiExample('Nilufer', value='Nilufer')
            ]
        )
    ],
    responses={
        200: OpenApiResponse(
            description="List of recycling centers retrieved successfully",
            examples=[
                OpenApiExample(
                    'Single District - Beylikduzu',
                    value=[
                        {
                            "ilce": "Beylikduzu",
                            "adres": "Beylikduzu 1. Sinif Atik Getirme Merkezi",
                            "not": "Kagit, plastik, cam, metal, atik piller ve elektrikli-elektronik esyalar kabul ediliyor.",
                            "turler": ["paper", "plastic", "glass", "metal", "battery", "electronic"]
                        }
                    ],
                    response_only=True
                ),
                OpenApiExample(
                    'All Istanbul Centers',
                    value=[
                        {
                            "ilce": "Sultangazi",
                            "adres": "Esentepe Mah. Kucuk San. Sit. 2951 Sokak 9.Blok No:28/1 Sultangazi / Istanbul",
                            "not": "Elektronik Atik Toplama Merkezi",
                            "turler": ["electronic"]
                        },
                        {
                            "ilce": "Beylikduzu",
                            "adres": "Beylikduzu 1. Sinif Atik Getirme Merkezi",
                            "not": "Kagit, plastik, cam, metal, atik piller ve elektrikli-elektronik esyalar kabul ediliyor.",
                            "turler": ["paper", "plastic", "glass", "metal", "battery", "electronic"]
                        },
                        {
                            "ilce": "Atasehir",
                            "adres": "Barbaros Mah. Sebboy Sok. No:4 PK:34746 Atasehir / Istanbul",
                            "not": "Elektronik atik toplama kutusu talebi hizmeti mevcut.",
                            "turler": ["electronic", "battery"]
                        }
                    ],
                    response_only=True
                ),
                OpenApiExample(
                    'Comprehensive Center - Ankara Mamak',
                    value=[
                        {
                            "ilce": "Mamak",
                            "adres": "Huseyingazi Mah. Mamak Cad. No:181 Mamak / Ankara",
                            "not": "Mamak Belediyesi 1. Sinif Atik Getirme Merkezi",
                            "turler": ["paper", "plastic", "metal", "glass", "wood", "textile", "electronic", "battery", "fluorescent", "accumulator", "medicine", "oil_fats", "tire"]
                        }
                    ],
                    response_only=True
                )
            ]
        ),
        400: OpenApiResponse(
            description="City parameter is required",
            examples=[
                OpenApiExample(
                    'Missing City Parameter',
                    value={"error": "City parameter is required"},
                    response_only=True
                )
            ]
        ),
        404: OpenApiResponse(
            description="City not found or no centers found for the given filters",
            examples=[
                OpenApiExample(
                    'City Not Found',
                    value={"error": "City not found"},
                    response_only=True
                ),
                OpenApiExample(
                    'No Centers Found',
                    value={"error": "No recycling centers found for the given filters"},
                    response_only=True
                )
            ]
        )
    },
    tags=['Recycling Centers']
)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_recycling_centers(request):
    """
    Get recycling centers filtered by city and optionally by district.
    Requires 'city' query parameter.
    Optional 'district' query parameter for filtering.
    Returns a list of recycling centers with their details.
    """
    city = request.query_params.get('city')
    district = request.query_params.get('district')
    
    if not city:
        return Response(
            {"error": "City parameter is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Find the city data
    city_data = next((c for c in RECYCLING_CENTERS_DATA if c["il"] == city), None)
    
    if not city_data:
        return Response(
            {"error": "City not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Filter centers by district if provided
    centers = city_data["merkezler"]
    if district:
        centers = [c for c in centers if c["ilce"] == district]
    
    if not centers:
        return Response(
            {"error": "No recycling centers found for the given filters"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    return Response(centers, status=status.HTTP_200_OK)
