from rest_framework import serializers
from ..models import Comments, Posts

class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')
    author_profile_image = serializers.ReadOnlyField(source='author.profile_image_url')
    
    class Meta:
        model = Comments
        fields = ['id', 'content', 'date', 'post', 'author', 'author_username', 'author_profile_image']
        read_only_fields = ['id', 'date', 'author', 'author_username', 'author_profile_image']
    
    def validate_post(self, value):
        """
        Check that the post exists.
        """
        try:
            Posts.objects.get(pk=value.pk)
        except Posts.DoesNotExist:
            raise serializers.ValidationError("Post does not exist")
        return value
