# Import necessary views and path
from . import views
from django.urls import path
# Import JWT token views from rest_framework_simplejwt
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

# URL patterns for authentication endpoints
urlpatterns = [
    # User registration endpoint
    path('signup/', views.SignUpView.as_view(), name='signup'),
    # User login endpoint
    path('login/', views.LoginView.as_view(), name='login'),
    # JWT token creation endpoint
    path("jwt/create/", TokenObtainPairView.as_view(), name="jwt_create"),
    # JWT token refresh endpoint
    path("jwt/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # JWT token verification endpoint
    path("jwt/verify/", TokenVerifyView.as_view(), name="token_verify"),
    # Server status endpoint
    path("status/", views.server_status, name="server_status"),
    # User info endpoint
    path("me/", views.get_user_info, name="user-info"),
]