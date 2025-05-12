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
    path('me/profile-picture/', profile_views.upload_profile_picture, name='upload-profile-picture'),
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
    # Get top 10 users endpoint
    path("api/waste/leaderboard/", waste_views.get_top_users, name="get_top_users"),
    # Get top 10 users endpoint
    path("api/waste/leaderboard/", waste_views.get_top_users, name="get_top_users"),
    # User waste retrieval endpoint
    path("api/waste/get/", waste_views.get_user_wastes, name="get_user_wastes"),    # Tips endpoints
    path("api/tips/get_recent_tips", tip_views.get_recent_tips, name="get_recent_tips"),
    path("api/tips/all/", tip_views.get_all_tips, name="get_all_tips"),
    path("api/tips/create/", tip_views.create_tip, name="create_tip"),
    path("api/tips/<int:tip_id>/like/", tip_views.like_tip, name="like_tip"),
    path("api/tips/<int:tip_id>/unlike/", tip_views.unlike_tip, name="unlike_tip"),
    path("api/tips/<int:tip_id>/dislike/", tip_views.dislike_tip, name="dislike_tip"),
    path("api/tips/<int:tip_id>/undislike/", tip_views.undislike_tip, name="undislike_tip"),
    # Get a list of reported media endpoint
    path("api/admin/reports/", ModerateReportsViewSet.as_view({'get': 'list'}), name="admin-reports-list"),
    # get a specific report by report id endpoint
    path("api/admin/reports/<int:pk>/", ModerateReportsViewSet.as_view({'get': 'retrieve'}), name="admin-reports-detail"),
    # Moderate a report endpoint
    path("api/admin/reports/<int:pk>/moderate/", ModerateReportsViewSet.as_view({'post': 'moderate'}), name="admin-reports-moderate"),
    # Post report endpoint
    path("api/<str:content_type>/<int:object_id>/report/", ReportCreateView.as_view(), name="report_content"),
]
