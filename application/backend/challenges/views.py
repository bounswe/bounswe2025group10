from rest_framework import generics, permissions
from .models import Challenge
from .serializers import ChallengeSerializer

class ChallengeListCreateView(generics.ListCreateAPIView):
    queryset = Challenge.objects.all()
    serializer_class = ChallengeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        '''
        Customize the queryset to show public challenges to everyone and non-public challenges only to their creators.
        '''
        user = self.request.user
        if user.is_authenticated:
            # Authorized users can see their own challenges and public challenges
            return Challenge.objects.filter(is_public=True) | Challenge.objects.filter(creator=user)
        else:
            # Unauthenticated users can only see public challenges
            return Challenge.objects.filter(is_public=True)
        
    def perform_create(self, serializer):
        '''
        Set the creator of the challenge to the current user when creating a new challenge.
        '''
        serializer.save(creator=self.request.user)
