from django.contrib.auth import authenticate
from .login_serializer import LoginSerializer
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .tokens import create_jwt_pair_for_user

# User registration view
@permission_classes([AllowAny])
class SignUpView(generics.GenericAPIView):
    serializer_class = LoginSerializer

    def post(self, request: Request):
        data = request.data
        print(data)
        serializer = self.serializer_class(data=data)

        if serializer.is_valid():
            serializer.save()
            
            response = {
                "message": "User created successfully.",
                "data": serializer.data
            }
            return Response(data = response, status=status.HTTP_201_CREATED)
        import sys
        print("SIGNUP VALIDATION ERRORS:", serializer.errors, file=sys.stderr, flush=True)
        return Response(data = serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# User authentication view
@permission_classes([AllowAny])
class LoginView(APIView):

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
                }
            else:
                response = {
                    "message": "Login successful.",
                    "token": tokens,
                    "isAdmin": False,
                }
            return Response(data=response, status=status.HTTP_200_OK)
        
        return Response(data={"error": "Invalid credentials!"}, status=status.HTTP_401_UNAUTHORIZED)

    # Get user info
    def get(self, request: Request):
        content = {
            "user": str(request.user),  
            "auth": str(request.auth)
        }
        return Response(data = content, status = status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def server_status(request):
    data = {
        "status": "Server is running",
    }
    return Response(data = data, status = status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    """
    Protected view that returns user info
    Requires valid JWT token in Authorization header
    """
    data = {
        "username": request.user.username,
        "is_authenticated": True
    }
    return Response(data=data, status=status.HTTP_200_OK)

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