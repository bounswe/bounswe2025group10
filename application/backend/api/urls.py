# Import necessary views and path
from django.urls import path
# Import JWT token views from rest_framework_simplejwt
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from .login_and_signup import login_views
from .report_system.report_views import ReportCreateView
from .waste import waste_views
from .tip import tip_views
from .report_system.admin_panel_views import ModerateReportsViewSet
from .profile import profile_views

# URL patterns for authentication endpoints
urlpatterns = [
    # User registration endpoint
    path('signup/', login_views.SignUpView.as_view(), name='signup'),
    # User login endpoint
    path('login/', login_views.LoginView.as_view(), name='login'),
    # Profile picture upload endpoint
    path('api/profile/profile-picture/', profile_views.upload_profile_picture, name='upload-profile-picture'),
    # User profile update endpoint
    path('api/profile/<int:user_id>/bio/', profile_views.user_bio, name='user-bio'),
    # Public profile picture retrieval endpoint
    path('api/profile/<int:user_id>/picture/', profile_views.download_profile_picture_public, name='download-profile-picture-public'),
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
    # Get top 10 users endpoint
    path("api/waste/leaderboard/", waste_views.get_top_users, name="get_top_users"),
    # Sending 3 recent tips endpoint
    path("api/tips/", tip_views.get_recent_tips, name="get_recent_tips"),
    # Get a list of reported media endpoint
    path("api/admin/reports/", ModerateReportsViewSet.as_view({'get': 'list'}), name="admin-reports-list"),
    # get a specific report by report id endpoint
    path("api/admin/reports/<int:pk>/", ModerateReportsViewSet.as_view({'get': 'retrieve'}), name="admin-reports-detail"),
    # Moderate a report endpoint
    path("api/admin/reports/<int:pk>/moderate/", ModerateReportsViewSet.as_view({'post': 'moderate'}), name="admin-reports-moderate"),
    # Post report endpoint
    path("api/<str:content_type>/<int:object_id>/report/", ReportCreateView.as_view(), name="report_content"),
]
