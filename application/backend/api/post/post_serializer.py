from rest_framework import serializers

from django.conf import settings
from ..models import Posts, SavedPosts, PostLikes
from ..utils.translation import translate_text, get_requested_language
from api.profile.anonymity_utils import display_name_for_viewer, can_show_profile_image

class PostSerializer(serializers.ModelSerializer):
    creator_username = serializers.SerializerMethodField()
    creator_profile_image = serializers.SerializerMethodField()
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
        if obj.image:
            if obj.image.startswith(('http://', 'https://')):
                return obj.image
            if request:
                # Build absolute URI with proper scheme
                media_url = request.build_absolute_uri(settings.MEDIA_URL)
                # Ensure we're using https if the request came through https
                if request.is_secure() and media_url.startswith('http://'):
                    media_url = media_url.replace('http://', 'https://', 1)
                return f"{media_url.rstrip('/')}/{obj.image.lstrip('/')}"
        return None

    def get_creator_username(self, obj):
        request = self.context.get('request')
        viewer = getattr(request, 'user', None) if request else None
        return display_name_for_viewer(viewer, obj.creator)

    def get_creator_profile_image(self, obj):
        request = self.context.get('request')
        viewer = getattr(request, 'user', None) if request else None
        if not can_show_profile_image(viewer, obj.creator):
            return None
        return obj.creator.profile_image_url

    
    def get_is_saved(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if user and user.is_authenticated:
            return SavedPosts.objects.filter(user=user, post=obj).exists()
        return False
        
    def get_is_user_liked(self, obj):
        """
        Returns whether the current user has liked this post
        """
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if not user or not user.is_authenticated:
            return False
            
        user_reaction = PostLikes.objects.filter(
            user=user,
            post=obj,
            reaction_type='LIKE'
        ).exists()
        
        return user_reaction
        
    def get_is_user_disliked(self, obj):
        """
        Returns whether the current user has disliked this post
        """
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if not user or not user.is_authenticated:
            return False
            
        user_reaction = PostLikes.objects.filter(
            user=user,
            post=obj,
            reaction_type='DISLIKE'
        ).exists()
        
        return user_reaction
