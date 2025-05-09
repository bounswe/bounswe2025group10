from rest_framework import generics
from .models import Challenge
from .serializers import ChallengeSerializer

class ChallengeListCreateView(generics.ListCreateAPIView):
    queryset = Challenge.objects.all()
    serializer_class = ChallengeSerializer
