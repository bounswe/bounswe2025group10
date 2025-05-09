from rest_framework import serializers
from ..models import Tips

class TipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tips
        fields = ['id', 'text', 'like_count', 'dislike_count']
        read_only_fields = ['like_count', 'dislike_count']  # These fields should only be modified by the system



