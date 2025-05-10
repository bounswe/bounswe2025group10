# Import necessary views and path
from django.urls import path
# Import JWT token views from rest_framework_simplejwt
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from .login_and_signup import login_views
from .waste import waste_views
from .tip import tip_views
from .admin_panel.admin_panel_views import ReportViewSet

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
    # User waste creation endpoint
    path("api/waste/", waste_views.create_user_waste, name="create_user_waste"),
    # User waste retrieval endpoint
    path("api/waste/get/", waste_views.get_user_wastes, name="get_user_wastes"),
    # Sending 3 recent tips endpoint
    path("api/tips/", tip_views.get_recent_tips, name="get_recent_tips"),
    # Get a list of reported media endpoint
    path("api/admin/reports/", ReportViewSet.as_view({'get': 'list'}), name="admin-reports-list"),
    # get a specific report by report id endpoint
    path("api/admin/reports/<int:pk>/", ReportViewSet.as_view({'get': 'retrieve'}), name="admin-reports-detail"),
    # Moderate a report endpoint
    path("api/admin/reports/<int:pk>/moderate/", ReportViewSet.as_view({'post': 'moderate'}), name="admin-reports-moderate"),
]
