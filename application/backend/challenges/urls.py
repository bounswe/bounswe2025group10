from django.urls import path
from .views import ChallengeListCreateView, ChallengeUpdateView

urlpatterns = [
    path('', ChallengeListCreateView.as_view(), name='challenge-list-create'),
    path('<int:pk>/update/', ChallengeUpdateView.as_view(), name='challenge-update'),
]
