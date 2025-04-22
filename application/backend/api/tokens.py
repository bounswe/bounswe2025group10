# Import necessary modules
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from typing import Type

# Get the user model
user = get_user_model()

def create_jwt_pair_for_user(user):
    """
    Creates JWT token pair for given user
    Args:
        user: User instance
    Returns:
        dict: Contains access and refresh tokens
    """
    # Generate refresh token for user
    refresh = RefreshToken.for_user(user)

    # Create token pair
    tokens = {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }

    return tokens