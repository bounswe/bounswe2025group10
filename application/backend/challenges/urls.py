from django.urls import path
from .views import ChallengeListCreateView

urlpatterns = [
    path('', ChallengeListCreateView.as_view(), name='challenge-list-create'),
]
