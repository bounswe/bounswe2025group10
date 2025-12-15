# Import necessary views and path
from django.urls import path

from api.invite import invite_views
# Import JWT token views from rest_framework_simplejwt
from .activities.views.user_activity_view import UserActivityEventsView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from .login_and_signup import login_views
from .report_system.report_views import ReportCreateView
from .waste import waste_views
from .tip import tip_views
from .post import post_views
from .comment import comment_views
from .report_system.admin_panel_views import ModerateReportsViewSet
from .profile import profile_views
from .profile import follow_views
from .opentdb import views as opentdb_views
from .achievement import achievement_views
from .achievement import badge_views
from .activities.views.activity_view import ActivityEventViewSet
from .recycling_centers import recycling_views

# URL patterns for all API endpoints
urlpatterns = [
    # Authentication and User Management Endpoints
    # ----------------------------------------
    
    # POST: Register a new user account with email, username and password
    path('signup/', login_views.SignUpView.as_view(), name='signup'),
    
    # POST: Authenticate a user and receive an access token
    path('login/', login_views.LoginView.as_view(), name='login'),
    # Profile picture upload endpoint
    path('api/profile/profile-picture/', profile_views.upload_profile_picture, name='upload-profile-picture'),
    # User profile update endpoint
    path('api/profile/<str:username>/bio/', profile_views.user_bio, name='user-bio'),
    # User waste reduction statistics endpoint (respects privacy settings)
    path('api/profile/<str:username>/waste-stats/', profile_views.user_waste_stats, name='user-waste-stats'),
    # Public profile picture retrieval endpoint
    path('api/profile/<str:username>/picture/', profile_views.download_profile_picture_public, name='download-profile-picture-public'),
    # Profile privacy settings (authenticated user)
    path('api/profile/privacy/', profile_views.profile_privacy_settings, name='profile-privacy-settings'),
    
    # Follow/Unfollow Endpoints
    # ----------------------------------------
    
    # POST: Follow a user by username
    path('api/profile/<str:username>/follow/', follow_views.follow_user, name='follow-user'),
    
    # POST: Unfollow a user by username
    path('api/profile/<str:username>/unfollow/', follow_views.unfollow_user, name='unfollow-user'),
    
    # GET: Get list of followers for a specific user
    path('api/profile/<str:username>/followers/', follow_views.get_followers, name='get-followers'),
    
    # GET: Get list of users that a specific user is following
    path('api/profile/<str:username>/following/', follow_views.get_following, name='get-following'),
    
    # GET: Check if authenticated user is following a specific user
    path('api/profile/<str:username>/follow-status/', follow_views.check_follow_status, name='check-follow-status'),
    
    # GET: Get follow statistics for the authenticated user
    path('api/profile/follow-stats/', follow_views.get_follow_stats, name='follow-stats'),
    
    # JWT token creation endpoint
    path("jwt/create/", TokenObtainPairView.as_view(), name="jwt_create"),
    
    # POST: Refresh an expired JWT access token using a valid refresh token
    path("jwt/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    
    # POST: Verify if a given JWT token is valid
    path("jwt/verify/", TokenVerifyView.as_view(), name="token_verify"),
    
    # GET: Check if the API server is operational and healthy
    path("status/", login_views.server_status, name="server_status"),
    
    # GET: Retrieve details of the currently authenticated user
    path("me/", login_views.get_user_info, name="user-info"),
    
    # Post Management Endpoints
    # ----------------------------------------
    
    # POST: Create a new post with text and/or image
    path("api/posts/create/", post_views.create_post, name="create_post"),
    
    # GET: Retrieve all posts across the platform, sorted by most recent first
    path("api/posts/all/", post_views.get_all_posts, name="get_all_posts"),
    
    # GET: Retrieve details of a specific post by ID including its comments
    path("api/posts/<int:post_id>/", post_views.get_post_detail, name="get_post_detail"),
    
    # GET: Retrieve all posts created by the currently authenticated user
    path("api/posts/user/", post_views.get_user_posts, name="get_user_posts"),
      # POST: Like a specific post (adds user's like reaction or removes it if already liked)
    path("api/posts/<int:post_id>/like/", post_views.like_post, name="like_post"),
    
    # POST: Dislike a specific post (adds user's dislike reaction or removes it if already disliked)
    path("api/posts/<int:post_id>/dislike/", post_views.dislike_post, name="dislike_post"),
    
    # GET: Get the current user's reaction (like/dislike) to a specific post
    path("api/posts/<int:post_id>/reaction/", post_views.get_user_reaction, name="get_user_reaction"),
    
    # POST: Save a post to the user's saved posts collection
    path("api/posts/<int:post_id>/save/", post_views.save_post, name="save_post"),
    
    # POST: Remove a post from the user's saved posts collection
    path("api/posts/<int:post_id>/unsave/", post_views.unsave_post, name="unsave_post"),
    
    # GET: Retrieve all posts saved by the current user
    path("api/posts/saved/", post_views.get_saved_posts, name="get_saved_posts"),

    # GET: Retrieve top 5 posts with the highest number of likes
    path("api/posts/top-liked/", post_views.get_top_liked_posts, name="get_top_liked_posts"),
    
    # Comment Management Endpoints
    # ----------------------------------------
    
    # GET: Retrieve all comments for a specific post
    path("api/posts/<int:post_id>/comments/", comment_views.get_post_comments, name="get_post_comments"),
    
    # POST: Create a new comment on a specific post
    path("api/posts/<int:post_id>/comments/create/", comment_views.create_comment, name="create_comment"),
    
    # Waste Management Endpoints
    # ----------------------------------------
    
    # POST: Log a new waste entry for the current user (recycling tracking)
    path("api/waste/", waste_views.create_user_waste, name="create_user_waste"),
    
    # GET: Retrieve the top 10 users based on their waste recycling metrics
    path("api/waste/leaderboard/", waste_views.get_top_users, name="get_top_users"),
    
    # GET: Retrieve all waste entries logged by the current user
    path("api/waste/get/", waste_views.get_user_wastes, name="get_user_wastes"),

      # POST: Report suspicious waste item with description and image
    path("api/waste/report_suspicious/", waste_views.create_suspicious_waste, name="create_suspicious_waste"),

    path("api/waste/suspicious/list/", waste_views.get_suspicious_wastes, name="list_suspicious_wastes"),
    
    # Tips Management Endpoints
    # ----------------------------------------
    
    # GET: Retrieve the most recent recycling/environmental tips
    path("api/tips/get_recent_tips", tip_views.get_recent_tips, name="get_recent_tips"),
    
    # GET: Retrieve all available tips
    path("api/tips/all/", tip_views.get_all_tips, name="get_all_tips"),
    
    # POST: Create a new tip
    path("api/tips/create/", tip_views.create_tip, name="create_tip"),
    
    # POST: Like a specific tip
    path("api/tips/<int:tip_id>/like/", tip_views.like_tip, name="like_tip"),
    
    # POST: Dislike a specific tip
    path("api/tips/<int:tip_id>/dislike/", tip_views.dislike_tip, name="dislike_tip"),
    
    
    # Admin and Moderation Endpoints
    # ----------------------------------------
    
    # GET: Retrieve a list of all reported content for moderation
    path("api/admin/reports/", ModerateReportsViewSet.as_view({'get': 'list'}), name="admin-reports-list"),
    
    # GET: Retrieve details of a specific report by its ID
    path("api/admin/reports/<int:pk>/", ModerateReportsViewSet.as_view({'get': 'retrieve'}), name="admin-reports-detail"),
    
    # POST: Process and moderate a report (approve or reject)
    path("api/admin/reports/<int:pk>/moderate/", ModerateReportsViewSet.as_view({'post': 'moderate'}), name="admin-reports-moderate"),
    
    # Reporting Endpoint
    # ----------------------------------------
    
    # POST: Report inappropriate content (posts, comments, etc.)
    path("api/<str:content_type>/<int:object_id>/report/", ReportCreateView.as_view(), name="report_content"),

    # Achievement Endpoints
    # ----------------------------------------
    
    # GET: Retrieve the authenticated user's achievements
    path("api/achievements/", achievement_views.get_user_achievements, name="get_user_achievements"),
    
    # GET: Retrieve a specific user's achievements by username
    path("api/achievements/<str:username>/", achievement_views.get_user_achievements, name="get_user_achievements_by_username"),

    # Badge System Endpoints
    # ----------------------------------------
    
    # GET: Retrieve all badges earned by authenticated user or specific user
    path("api/badges/", badge_views.get_user_badges, name="get_user_badges"),
    path("api/badges/<int:user_id>/", badge_views.get_user_badges, name="get_user_badges_by_id"),
    
    # GET: Get progress towards next badges for authenticated user
    path("api/badges/progress/", badge_views.get_badge_progress, name="get_badge_progress"),
    
    # GET: Get complete badge summary (earned + progress)
    path("api/badges/summary/", badge_views.get_user_badge_summary, name="get_user_badge_summary"),
    path("api/badges/summary/<int:user_id>/", badge_views.get_user_badge_summary, name="get_user_badge_summary_by_id"),
    
    # GET: Get all available badges in the system
    path("api/badges/all/", badge_views.get_all_badges, name="get_all_badges"),
    
    # POST: Manually trigger badge checking (for retroactive awarding)
    path("api/badges/check/", badge_views.manually_check_badges, name="manually_check_badges"),
    
    # GET: Get badge leaderboard
    path("api/badges/leaderboard/", badge_views.get_leaderboard, name="badge_leaderboard"),

    # Opentdb Trivia API Endpoints
    path('trivia/', opentdb_views.TriviaQuestionView.as_view(), name='get_trivia_question'),

    #get activity events
    path("api/activity-events/", ActivityEventViewSet.as_view({'get': 'list'}), name="activity-event-list"),
    path("api/user-activity-events/", UserActivityEventsView.as_view(), name="user-activity-events"),

    path("api/invite/send/", invite_views.send_invitation_email, name="send_invitation_email"),
    
    # Recycling Centers Endpoints
    # ----------------------------------------
    
    # GET: Retrieve all cities with recycling centers
    path("api/recycling-centers/cities/", recycling_views.get_cities, name="get_cities"),
    
    # GET: Retrieve districts for a specific city
    path("api/recycling-centers/districts/", recycling_views.get_districts, name="get_districts"),
    
    # GET: Retrieve recycling centers by city and optionally by district
    path("api/recycling-centers/", recycling_views.get_recycling_centers, name="get_recycling_centers"),
]
