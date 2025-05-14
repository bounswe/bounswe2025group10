from rest_framework import serializers
from .models import Challenge, UserChallenge, Achievements
from django.utils import timezone

class ChallengeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Challenge
        fields = [
            'id', 
            'title', 
            'description', 
            'target_amount', 
            'current_progress', 
            'is_public', 
            'reward', 
            'creator'
            ]

    def create(self, validated_data):
        if not validated_data.get('reward'):
            title = validated_data.get('title', 'Unnamed Challenge')
            if title.lower().endswith(' challenge'):
                title = title[:-9]
            description = f"Given for completing '{title}' challenge."
            reward = Achievements.objects.create(name=title, description=description)
            validated_data['reward'] = reward

        return super().create(validated_data)
        

class ChallengeParticipationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserChallenge
        fields = ['challenge', 'joined_date']

    def validate(self, data):
        '''
        Ensure that the challenge is public and the user is not already participating.
        '''
        user = self.context['request'].user
        challenge = data['challenge']

        # Check if the challenge is public or if the user is the challenge creator
        if not challenge.is_public and challenge.creator != user:
            raise serializers.ValidationError("You can only join public challenges.")
        
        # Check if the user is already participating in the challenge
        if UserChallenge.objects.filter(user=user, challenge=challenge).exists():
            raise serializers.ValidationError("You are already participating in this challenge.")
        
        return data
    
    def create(self, validated_data):
        '''
        Automatically set the user and joined_date when creating a new participation record.
        '''
        user = self.context['request'].user
        validated_data['user'] = user
        validated_data['joined_date'] = timezone.now()
        
        return UserChallenge.objects.create(**validated_data)
