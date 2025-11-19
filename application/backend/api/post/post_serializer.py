from rest_framework import serializers

from django.conf import settings
from ..models import Posts, SavedPosts, PostLikes
from ..utils.translation import translate_text, get_requested_language

class PostSerializer(serializers.ModelSerializer):
    creator_username = serializers.ReadOnlyField(source='creator.username')
    creator_profile_image = serializers.ReadOnlyField(source='creator.profile_image_url')
    is_saved = serializers.SerializerMethodField()
    is_user_liked = serializers.SerializerMethodField()
    is_user_disliked = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Posts
        fields = ['id', 'text', 'image', 'image_url', 'date', 'creator', 'creator_username', 'creator_profile_image', 'like_count', 'dislike_count', 'is_saved', 'is_user_liked', 'is_user_disliked', 'language']
        read_only_fields = ['id', 'date', 'creator', 'creator_username', 'creator_profile_image', 'like_count', 'dislike_count', 'is_saved', 'image_url', 'is_user_liked', 'is_user_disliked']
    
    def to_representation(self, instance):
        """
        Override to_representation to translate text if a different language is requested.
        """
        representation = super().to_representation(instance)
        request = self.context.get('request')
        
        if request:
            requested_lang = get_requested_language(request)
            original_lang = instance.language or 'en'
            
            # Translate text if requested language differs from original
            if requested_lang and requested_lang != original_lang and representation.get('text'):
                representation['text'] = translate_text(
                    representation['text'],
                    original_lang,
                    requested_lang
                )
                # Add a field to indicate this was translated
                representation['translated_to'] = requested_lang
                representation['original_language'] = original_lang
        
        return representation
    
    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            if obj.image.startswith(('http://', 'https://')):
                return obj.image
            return request.build_absolute_uri(f'{settings.MEDIA_URL}{obj.image}')

    
    def get_is_saved(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            return SavedPosts.objects.filter(user=user, post=obj).exists()
        return False
        
    def get_is_user_liked(self, obj):
        """
        Returns whether the current user has liked this post
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
            
        user_reaction = PostLikes.objects.filter(
            user=request.user,
            post=obj,
            reaction_type='LIKE'
        ).exists()
        
        return user_reaction
        
    def get_is_user_disliked(self, obj):
        """
        Returns whether the current user has disliked this post
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
            
        user_reaction = PostLikes.objects.filter(
            user=request.user,
            post=obj,
            reaction_type='DISLIKE'
        ).exists()
        
        return user_reaction
