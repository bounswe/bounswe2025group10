from rest_framework import serializers
from ..models import Tips, TipLikes
from ..utils.translation import translate_text, get_requested_language

class TipSerializer(serializers.ModelSerializer):
    description = serializers.CharField(source='text')  # Map text field to description
    is_user_liked = serializers.SerializerMethodField()
    is_user_disliked = serializers.SerializerMethodField()
    
    class Meta:
        model = Tips
        fields = ['id', 'title', 'description', 'like_count', 'dislike_count', 'is_user_liked', 'is_user_disliked', 'language']
        read_only_fields = ['like_count', 'dislike_count', 'is_user_liked', 'is_user_disliked']
    
    def to_representation(self, instance):
        """
        Override to_representation to translate title and description if a different language is requested.
        """
        representation = super().to_representation(instance)
        request = self.context.get('request')
        
        if request:
            requested_lang = get_requested_language(request)
            original_lang = instance.language or 'en'
            
            # Translate title and description if requested language differs from original
            if requested_lang and requested_lang != original_lang:
                if representation.get('title'):
                    representation['title'] = translate_text(
                        representation['title'],
                        original_lang,
                        requested_lang
                    )
                if representation.get('description'):
                    representation['description'] = translate_text(
                        representation['description'],
                        original_lang,
                        requested_lang
                    )
                # Add fields to indicate this was translated
                representation['translated_to'] = requested_lang
                representation['original_language'] = original_lang
        
        return representation
    
    def get_is_user_liked(self, obj):
        """
        Returns whether the current user has liked this tip
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
            
        user_reaction = TipLikes.objects.filter(
            user=request.user,
            tip=obj,
            reaction_type='LIKE'
        ).exists()
        
        return user_reaction
        
    def get_is_user_disliked(self, obj):
        """
        Returns whether the current user has disliked this tip
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
            
        user_reaction = TipLikes.objects.filter(
            user=request.user,
            tip=obj,
            reaction_type='DISLIKE'
        ).exists()
        
        return user_reaction
        
    def create(self, validated_data):
        # Handle the text/description mapping
        text_data = validated_data.pop('text', None)
        if text_data:
            validated_data['text'] = text_data
        return super().create(validated_data)



