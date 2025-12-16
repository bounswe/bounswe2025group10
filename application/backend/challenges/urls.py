from django.urls import path
from .views import (
    ChallengeListCreateView,
    ChallengeUpdateView,
    ChallengeDeleteView,
    ChallengeParticipationView,
    ChallengeEnrolledView,
    ChallengeUserEnrolledView,
)

urlpatterns = [
    path('', ChallengeListCreateView.as_view(), name='challenge-list-create'),
    path('<int:pk>/update/', ChallengeUpdateView.as_view(), name='challenge-update'),
    path('<int:pk>/delete/', ChallengeDeleteView.as_view(), name='challenge-delete'),
    path('participate/', ChallengeParticipationView.as_view(), name='challenge-participation'),
    path('enrolled/', ChallengeEnrolledView.as_view(), name='challenge-enrolled'),
    path('user/<str:username>/enrolled/', ChallengeUserEnrolledView.as_view(), name='challenge-user-enrolled'),
]
