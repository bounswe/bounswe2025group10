from django.contrib.auth import authenticate
from .login_serializer import LoginSerializer
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample
from .tokens import create_jwt_pair_for_user

# User registration view
@extend_schema(
    summary="Register a new user",
    description="Create a new user account with email, username, and password. Returns user data upon successful registration.",
    request=LoginSerializer,
    responses={
        201: OpenApiResponse(
            response=LoginSerializer,
            description="User created successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'User created successfully.',
                        'data': {
                            'email': 'user@example.com',
                            'username': 'newuser'
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            description="Bad request - validation errors",
            examples=[
                OpenApiExample(
                    'Email exists',
                    value={'email': ['Email already exists.']}
                ),
                OpenApiExample(
                    'Username exists',
                    value={'username': ['Username already exists.']}
                )
            ]
        )
    },
    tags=['Authentication']
)
@permission_classes([AllowAny])
class SignUpView(generics.GenericAPIView):
    serializer_class = LoginSerializer

    def post(self, request: Request):
        data = request.data
        serializer = self.serializer_class(data=data)

        if serializer.is_valid():
            serializer.save()
            
            response = {
                "message": "User created successfully.",
                "data": serializer.data
            }
            return Response(data = response, status=status.HTTP_201_CREATED)
        import sys
        return Response(data = serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# User authentication view
@extend_schema(
    summary="User login",
    description="Authenticate a user with email and password. Returns JWT tokens and user information upon successful login.",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'email': {'type': 'string', 'format': 'email', 'example': 'user@example.com'},
                'password': {'type': 'string', 'format': 'password', 'example': 'password123'}
            },
            'required': ['email', 'password']
        }
    },
    responses={
        200: OpenApiResponse(
            description="Login successful",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Login successful.',
                        'token': {
                            'access': 'eyJ0eXAiOiJKV1QiLCJhbGc...',
                            'refresh': 'eyJ0eXAiOiJKV1QiLCJhbGc...'
                        },
                        'isAdmin': False,
                        'username': 'john_doe'
                    }
                )
            ]
        ),
        401: OpenApiResponse(
            description="Invalid credentials",
            examples=[
                OpenApiExample(
                    'Invalid credentials',
                    value={'error': 'Invalid credentials!'}
                )
            ]
        )
    },
    tags=['Authentication']
)
@permission_classes([AllowAny])
class LoginView(APIView):

    @extend_schema(
        summary="User login",
        description="Authenticate user and return JWT tokens",
        exclude=False
    )
    def post(self, request: Request):
        # Extract credentials from request
        email = request.data.get('email')
        password = request.data.get('password')

        # Authenticate user
        user = authenticate(email=email, password=password)

        if user is not None:
            # Generate JWT tokens for authenticated user
            tokens = create_jwt_pair_for_user(user)
            if user.isAdmin:
                response = {
                    "message": "Login successful.",
                    "token": tokens,
                    "isAdmin": True,
                    "username": user.username,
                }
            else:
                response = {
                    "message": "Login successful.",
                    "token": tokens,
                    "isAdmin": False,
                    "username": user.username,
                }
            return Response(data=response, status=status.HTTP_200_OK)
        
        return Response(data={"error": "Invalid credentials!"}, status=status.HTTP_401_UNAUTHORIZED)

    # Get user info
    @extend_schema(
        summary="Get current user info",
        description="Retrieve information about the currently authenticated user",
        responses={
            200: OpenApiResponse(
                description="User information retrieved",
                examples=[
                    OpenApiExample(
                        'Success Response',
                        value={
                            'user': 'john_doe',
                            'auth': 'Token abc123...'
                        }
                    )
                ]
            )
        },
        tags=['Authentication']
    )
    def get(self, request: Request):
        content = {
            "user": str(request.user),  
            "auth": str(request.auth)
        }
        return Response(data = content, status = status.HTTP_200_OK)

@extend_schema(
    summary="Check server status",
    description="Health check endpoint to verify the server is running",
    responses={
        200: OpenApiResponse(
            description="Server is running",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={'status': 'Server is running'}
                )
            ]
        )
    },
    tags=['System']
)
@api_view(['GET'])
@permission_classes([AllowAny])
def server_status(request):
    data = {
        "status": "Server is running",
    }
    return Response(data = data, status = status.HTTP_200_OK)

@extend_schema(
    summary="Get authenticated user information",
    description="Retrieve detailed information about the currently authenticated user. Requires valid JWT token in Authorization header.",
    responses={
        200: OpenApiResponse(
            description="User information retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'id': 5,
                        'username': 'john_doe',
                        'is_authenticated': True
                    }
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - invalid or missing token")
    },
    tags=['Authentication']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    """
    Protected view that returns user info
    Requires valid JWT token in Authorization header
    """
    data = {
        "id": request.user.id,
        "username": request.user.username,
        "is_authenticated": True
    }
    return Response(data=data, status=status.HTTP_200_OK)

@extend_schema(
    summary="Fake login for testing",
    description="Testing endpoint that returns hardcoded tokens. Should not be used in production.",
    responses={
        200: OpenApiResponse(
            description="Fake login successful",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'message': 'Fake login successful',
                        'token': {
                            'access': 'fake_access_token',
                            'refresh': 'fake_refresh_token'
                        },
                        'data': {
                            'user': {
                                'id': 1,
                                'email': 'fake@example.com',
                                'username': 'fakeuser'
                            }
                        }
                    }
                )
            ]
        )
    },
    tags=['Testing']
)
@api_view(['POST'])
def fake_login(request):
    """
    A fake login endpoint that returns a hardcoded token for testing.
    """
    fake_token = {
        'access': 'fake_access_token',
        'refresh': 'fake_refresh_token'
    }
    return Response({
        'message': 'Fake login successful',
        'token': fake_token,
        'data': {
            'user': {
                'id': 1,
                'email': 'fake@example.com',
                'username': 'fakeuser'
            }
        }
    }, status=200)