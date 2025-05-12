from rest_framework import serializers
from ..models import Tips

class TipSerializer(serializers.ModelSerializer):
    description = serializers.CharField(source='text')  # Map text field to description

    class Meta:
        model = Tips
        fields = ['id', 'title', 'description', 'like_count', 'dislike_count']
        read_only_fields = ['like_count', 'dislike_count']
        
    def create(self, validated_data):
        # Handle the text/description mapping
        text_data = validated_data.pop('text', None)
        if text_data:
            validated_data['text'] = text_data
        return super().create(validated_data)



