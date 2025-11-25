"""
Serializers for follow/unfollow functionality
"""
from rest_framework import serializers
from api.models import Follow, Users


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user information serializer for followers/following lists"""
    profile_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Users
        fields = ['id', 'username', 'profile_image', 'bio']
        read_only_fields = fields
    
    def get_profile_image(self, obj):
        """Get profile image URL as absolute HTTPS URL"""
        request = self.context.get('request')
        if obj.profile_image:
            if obj.profile_image.startswith(('http://', 'https://')):
                return obj.profile_image
            if request:
                from django.conf import settings
                media_url = request.build_absolute_uri(settings.MEDIA_URL)
                if request.is_secure() and media_url.startswith('http://'):
                    media_url = media_url.replace('http://', 'https://', 1)
                return f"{media_url.rstrip('/')}/{obj.profile_image.lstrip('/')}"
        return None


class FollowSerializer(serializers.ModelSerializer):
    """Serializer for Follow model"""
    follower = UserBasicSerializer(read_only=True)
    following = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'created_at']
        read_only_fields = fields


class FollowerSerializer(serializers.ModelSerializer):
    """Serializer for displaying follower information"""
    user = UserBasicSerializer(source='follower', read_only=True)
    followed_at = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = Follow
        fields = ['user', 'followed_at']


class FollowingSerializer(serializers.ModelSerializer):
    """Serializer for displaying following information"""
    user = UserBasicSerializer(source='following', read_only=True)
    followed_at = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = Follow
        fields = ['user', 'followed_at']


class FollowStatsSerializer(serializers.Serializer):
    """Serializer for follow statistics"""
    username = serializers.CharField(read_only=True)
    followers_count = serializers.IntegerField(read_only=True)
    following_count = serializers.IntegerField(read_only=True)


class FollowStatusSerializer(serializers.Serializer):
    """Serializer for follow status information"""
    username = serializers.CharField(read_only=True)
    is_following = serializers.BooleanField(read_only=True)
    follows_back = serializers.BooleanField(read_only=True)
    followers_count = serializers.IntegerField(read_only=True)
    following_count = serializers.IntegerField(read_only=True)
