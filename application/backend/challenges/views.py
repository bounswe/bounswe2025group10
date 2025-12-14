from rest_framework import generics, permissions, status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample
from django.db.models import Q, F
from .models import Challenge, UserChallenge
from .serializers import ChallengeSerializer, ChallengeParticipationSerializer
from notifications.utils import send_notification, send_bulk_notifications

@extend_schema(
    tags=['Challenges'],
    responses={
        200: OpenApiResponse(
            response=ChallengeSerializer(many=True),
            description="Challenges retrieved successfully"
        ),
        201: OpenApiResponse(
            response=ChallengeSerializer,
            description="Challenge created successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'id': 5,
                        'title': '100kg Plastic Recycling Challenge',
                        'description': 'Recycle 100kg of plastic waste',
                        'target_amount': 100.0,
                        'current_progress': 0.0,
                        'is_public': True,
                        'reward': 3,
                        'creator': 1
                    }
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required for creation")
    }
)
class ChallengeListCreateView(generics.ListCreateAPIView):
    queryset = Challenge.objects.all()
    serializer_class = ChallengeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @extend_schema(
        summary="List all incomplete challenges",
        description="Retrieve all incomplete challenges (excluding completed ones where current_progress >= target_amount). Authenticated users see public incomplete challenges and their own incomplete private challenges. Unauthenticated users see only public incomplete challenges."
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Create a new challenge",
        description="Create a new challenge. Automatically generates a reward achievement if not provided. Sets the creator to the authenticated user."
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def get_queryset(self):
        '''
        Customize the queryset to show public challenges to everyone and non-public challenges only to their creators.
        Exclude completed challenges (where current_progress >= target_amount).
        '''
        from django.db.models import Q
        user = self.request.user
        
        # Filter out completed challenges
        incomplete_filter = Q(current_progress__lt=F('target_amount')) | Q(target_amount__isnull=True)
        
        if user.is_authenticated:
            # Authorized users can see their own incomplete challenges and public incomplete challenges
            return (Challenge.objects.filter(is_public=True) | Challenge.objects.filter(creator=user)).filter(incomplete_filter)
        else:
            # Unauthenticated users can only see public incomplete challenges
            return Challenge.objects.filter(is_public=True).filter(incomplete_filter)
        
    def perform_create(self, serializer):
        '''
        Set the creator of the challenge to the current user when creating a new challenge.
        '''
        serializer.save(creator=self.request.user)


@extend_schema(
    summary="Update a challenge",
    description="Update challenge details. Public challenges can only be updated by admins. Private challenges can only be updated by their creator. Cannot manually update current_progress.",
    request=ChallengeSerializer,
    responses={
        200: OpenApiResponse(
            response=ChallengeSerializer,
            description="Challenge updated successfully"
        ),
        400: OpenApiResponse(description="Bad request - cannot manually update current_progress"),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        403: OpenApiResponse(description="Forbidden - insufficient permissions"),
        404: OpenApiResponse(description="Challenge not found")
    },
    tags=['Challenges']
)
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
    

@extend_schema(
    summary="Delete a challenge",
    description="Delete a challenge. Public challenges can only be deleted by admins. Private challenges can only be deleted by their creator.",
    responses={
        204: OpenApiResponse(description="Challenge deleted successfully"),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        403: OpenApiResponse(description="Forbidden - insufficient permissions"),
        404: OpenApiResponse(description="Challenge not found")
    },
    tags=['Challenges']
)
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
    

@extend_schema(
    summary="Join a challenge",
    description="Enroll the authenticated user in a challenge. Users can only join public challenges or challenges they created. Cannot join a challenge twice. Maximum of 3 active challenges per user.",
    request=ChallengeParticipationSerializer,
    responses={
        201: OpenApiResponse(
            response=ChallengeParticipationSerializer,
            description="Successfully joined challenge",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'challenge': 5,
                        'joined_date': '2025-11-22T14:30:00Z'
                    }
                )
            ]
        ),
        400: OpenApiResponse(description="Bad request - already participating, challenge not public, or maximum 3 challenges reached"),
        401: OpenApiResponse(description="Unauthorized - authentication required"),
        404: OpenApiResponse(description="Challenge not found")
    },
    tags=['Challenges']
)
class ChallengeParticipationView(generics.CreateAPIView):
    queryset = UserChallenge.objects.all()
    serializer_class = ChallengeParticipationSerializer
    permission_classes = [permissions.IsAuthenticated] # Only authenticated users can participate in challenges

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Override to send notification after joining challenge"""
        user_challenge = serializer.save()
        challenge = user_challenge.challenge
        
        # Send notification to user
        deadline_info = f" Deadline: {challenge.deadline.strftime('%B %d, %Y at %I:%M %p')}" if challenge.deadline else ""
        send_notification(
            user_challenge.user,
            f"You've joined the challenge '{challenge.title}'! Target: {challenge.target_amount} kg.{deadline_info}"
        )
        
        # Notify challenge creator if it's not the same user
        if challenge.creator and challenge.creator != user_challenge.user:
            send_notification(
                challenge.creator,
                f"{user_challenge.user.username} has joined your challenge '{challenge.title}'!"
            )


@extend_schema(
    summary="Get enrolled challenges",
    description="Retrieve all challenges that the authenticated user is currently enrolled in.",
    responses={
        200: OpenApiResponse(
            response=ChallengeParticipationSerializer(many=True),
            description="Enrolled challenges retrieved successfully",
            examples=[
                OpenApiExample(
                    'Success Response',
                    value=[
                        {
                            'challenge': 5,
                            'joined_date': '2025-11-20T10:00:00Z'
                        },
                        {
                            'challenge': 8,
                            'joined_date': '2025-11-21T14:30:00Z'
                        }
                    ]
                )
            ]
        ),
        401: OpenApiResponse(description="Unauthorized - authentication required")
    },
    tags=['Challenges']
)
class ChallengeEnrolledView(generics.ListAPIView):
    serializer_class = ChallengeParticipationSerializer
    permission_classes = [permissions.IsAuthenticated] # Only authenticated users can view their enrolled challenges

    def get_queryset(self):
        '''
        Return challenges the user is currently enrolled in.
        '''
        user = self.request.user
        return UserChallenge.objects.filter(user=user)

