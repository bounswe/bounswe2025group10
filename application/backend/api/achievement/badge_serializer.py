"""
Serializers for the badge system
"""
from rest_framework import serializers
from api.models import Badges, UserBadges


class BadgeSerializer(serializers.ModelSerializer):
    """Serializer for Badge model"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    
    class Meta:
        model = Badges
        fields = [
            'id',
            'category', 'category_display',
            'level', 'level_display',
            'criteria_value'
        ]


class UserBadgeSerializer(serializers.ModelSerializer):
    """Serializer for UserBadge model"""
    badge = BadgeSerializer(read_only=True)
    
    class Meta:
        model = UserBadges
        fields = ['id', 'user', 'badge', 'earned_at']


class BadgeProgressSerializer(serializers.Serializer):
    """Serializer for badge progress information"""
    category = serializers.CharField()
    current_value = serializers.FloatField()
    required_value = serializers.FloatField(allow_null=True)
    percentage = serializers.FloatField()
    next_badge = serializers.DictField(allow_null=True)
    all_earned = serializers.BooleanField(default=False)


class UserBadgeSummarySerializer(serializers.Serializer):
    """Serializer for user's badge summary"""
    total_badges = serializers.IntegerField()
    badges_by_category = serializers.DictField()
    progress = serializers.DictField()
