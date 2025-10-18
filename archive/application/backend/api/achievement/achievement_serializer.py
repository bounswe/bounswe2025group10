from rest_framework import serializers
from ..models import Achievements, UserAchievements

class AchievementSerializer(serializers.ModelSerializer):
    """
    Serializer for the Achievement model
    """
    class Meta:
        model = Achievements
        fields = ['id', 'title', 'description', 'icon']

class UserAchievementSerializer(serializers.ModelSerializer):
    """
    Serializer for the UserAchievement model with nested Achievement details
    """
    achievement = AchievementSerializer(read_only=True)
    
    class Meta:
        model = UserAchievements
        fields = ['id', 'achievement', 'earned_at']
