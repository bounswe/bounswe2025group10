from rest_framework import generics, permissions, status
from rest_framework.response import Response
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


class ChallengeUpdateView(generics.UpdateAPIView):
    queryset = Challenge.objects.all()
    serializer_class = ChallengeSerializer
    permission_classes = [permissions.IsAuthenticated] # Only authenticated users can update challenges

    def update(self, request, *args, **kwargs):
        '''
        Custom update logic to restrict updates based on challenge type and user permissions.
        '''
        challenge = self.get_object()
        user = request.user

        if challenge.is_public:
            # Public challenges can only be updated by admins
            if not user.is_staff:
                return Response(
                    {"detail": "You do not have permission to update this public challenge."},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            # Non-public challenges can only be updated by their creator
            if challenge.creator != user:
                return Response(
                    {"detail": "You do not have permission to update this private challenge."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
        # Handle `current_progress` if included in the request
        if 'current_progress' in request.data:
            # Example: Prevent users from manually updating `current_progress`
            return Response(
                {"detail": "You cannot manually update current_progress."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Proceed with the update
        return super().update(request, *args, **kwargs)
    

class ChallengeDeleteView(generics.DestroyAPIView):
    queryset = Challenge.objects.all()
    permission_classes = [permissions.IsAuthenticated] # Only authenticated users can delete challenges

    def destroy(self, request, *args, **kwargs):
        '''
        Custom delete logic to restrict deletion based on challenge type and user permissions.
        '''
        challenge = self.get_object()
        user = request.user

        if challenge.is_public:
            # Public challenges can only be deleted by admins
            if not user.is_staff:
                return Response(
                    {"detail": "You do not have permission to delete this public challenge."},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            # Non-public challenges can only be deleted by their creator
            if challenge.creator != user:
                return Response(
                    {"detail": "You do not have permission to delete this private challenge."},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().destroy(request, *args, **kwargs)

