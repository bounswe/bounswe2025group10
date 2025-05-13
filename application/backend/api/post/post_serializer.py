from rest_framework import serializers
from ..models import Posts, SavedPosts

class PostSerializer(serializers.ModelSerializer):
    creator_username = serializers.ReadOnlyField(source='creator.username')
    creator_profile_image = serializers.ReadOnlyField(source='creator.profile_image_url')
    is_saved = serializers.SerializerMethodField()
    
    class Meta:
        model = Posts
        fields = ['id', 'text', 'image', 'date', 'creator', 'creator_username', 'creator_profile_image', 'like_count', 'dislike_count', 'is_saved']
        read_only_fields = ['id', 'date', 'creator', 'creator_username', 'creator_profile_image', 'like_count', 'dislike_count', 'is_saved']
    
    def get_is_saved(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            return SavedPosts.objects.filter(user=user, post=obj).exists()
        return False
