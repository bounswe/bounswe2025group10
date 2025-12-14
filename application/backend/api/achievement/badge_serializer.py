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


class EarnedBadgeSerializer(serializers.Serializer):
    """Serializer for an earned badge record"""
    id = serializers.IntegerField()
    category = serializers.CharField()
    level = serializers.IntegerField()
    criteria_value = serializers.FloatField()
    earned_at = serializers.DateTimeField()


class BadgesByCategorySerializer(serializers.Serializer):
    """Serializer for mapping categories to earned badge lists"""
    badges_by_category = serializers.DictField(
        child=serializers.ListSerializer(child=EarnedBadgeSerializer())
    )


class NextBadgeSerializer(serializers.Serializer):
    """Serializer for the next badge information in progress"""
    id = serializers.IntegerField()
    category = serializers.CharField()
    level = serializers.IntegerField()


class BadgeProgressEntrySerializer(serializers.Serializer):
    """Serializer for badge progress per category"""
    current_value = serializers.FloatField()
    required_value = serializers.FloatField(allow_null=True)
    percentage = serializers.FloatField()
    next_badge = NextBadgeSerializer(allow_null=True)
    all_earned = serializers.BooleanField(default=False)


class GetUserBadgesResponseSerializer(BadgesByCategorySerializer):
    """Response schema for get_user_badges"""
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    total_badges = serializers.IntegerField()


class GetBadgeProgressResponseSerializer(serializers.Serializer):
    """Response schema for get_badge_progress"""
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    progress = serializers.DictField(child=BadgeProgressEntrySerializer())


class GetUserBadgeSummaryResponseSerializer(serializers.Serializer):
    """Response schema for get_user_badge_summary"""
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    total_badges = serializers.IntegerField()
    badges_by_category = serializers.DictField(
        child=serializers.ListSerializer(child=EarnedBadgeSerializer())
    )
    progress = serializers.DictField(child=BadgeProgressEntrySerializer())


class AllBadgesResponseSerializer(serializers.Serializer):
    """Response schema for get_all_badges"""
    count = serializers.IntegerField()
    badges = BadgeSerializer(many=True)


class ManualCheckBadgesResponseSerializer(serializers.Serializer):
    """Response schema for manually_check_badges"""
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    newly_awarded_count = serializers.IntegerField()
    newly_awarded_badges = BadgeSerializer(many=True)


class LeaderboardEntrySerializer(serializers.Serializer):
    """Serializer for a leaderboard entry"""
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    profile_image_url = serializers.CharField(allow_null=True)
    badge_count = serializers.IntegerField()


class LeaderboardResponseSerializer(serializers.Serializer):
    """Response schema for get_leaderboard"""
    leaderboard = LeaderboardEntrySerializer(many=True)
