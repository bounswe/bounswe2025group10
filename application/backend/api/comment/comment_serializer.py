from rest_framework import serializers
from ..models import Comments, Posts

class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')
    author_profile_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Comments
        fields = ['id', 'content', 'date', 'post', 'author', 'author_username', 'author_profile_image']
        read_only_fields = ['id', 'date', 'author', 'author_username', 'author_profile_image']
    
    def get_author_profile_image(self, obj):
        """Convert profile image to absolute HTTPS URL"""
        request = self.context.get('request')
        if obj.author.profile_image:
            if obj.author.profile_image.startswith(('http://', 'https://')):
                return obj.author.profile_image
            if request:
                from django.conf import settings
                media_url = request.build_absolute_uri(settings.MEDIA_URL)
                if request.is_secure() and media_url.startswith('http://'):
                    media_url = media_url.replace('http://', 'https://', 1)
                return f"{media_url.rstrip('/')}/{obj.author.profile_image.lstrip('/')}"
        return None
    
    def validate_post(self, value):
        """
        Check that the post exists.
        """
        try:
            Posts.objects.get(pk=value.pk)
        except Posts.DoesNotExist:
            raise serializers.ValidationError("Post does not exist")
        return value
