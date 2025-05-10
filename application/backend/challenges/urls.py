from django.urls import path
from .views import ChallengeListCreateView, ChallengeUpdateView, ChallengeDeleteView

urlpatterns = [
    path('', ChallengeListCreateView.as_view(), name='challenge-list-create'),
    path('<int:pk>/update/', ChallengeUpdateView.as_view(), name='challenge-update'),
    path('<int:pk>/delete/', ChallengeDeleteView.as_view(), name='challenge-delete'),
]
