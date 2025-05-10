# Import necessary views and path
from django.urls import path
# Import JWT token views from rest_framework_simplejwt
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from .login_and_signup import login_views

# URL patterns for authentication endpoints
urlpatterns = [
    # User registration endpoint
    path('signup/', login_views.SignUpView.as_view(), name='signup'),
    # User login endpoint
    path('login/', login_views.LoginView.as_view(), name='login'),
    # JWT token creation endpoint
    path("jwt/create/", TokenObtainPairView.as_view(), name="jwt_create"),
    # JWT token refresh endpoint
    path("jwt/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # JWT token verification endpoint
    path("jwt/verify/", TokenVerifyView.as_view(), name="token_verify"),
    # Server status endpoint
    path("status/", login_views.server_status, name="server_status"),
    # User info endpoint
    path("me/", login_views.get_user_info, name="user-info"),
    # Fake login endpoint
    path('fake-login/', login_views.fake_login, name='fake_login'),
]