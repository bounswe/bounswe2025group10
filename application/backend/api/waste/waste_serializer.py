from rest_framework import serializers
from ..models import Waste, UserWastes

class WasteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Waste
        fields = ['type']

class UserWasteSerializer(serializers.ModelSerializer):
    waste_type = serializers.ChoiceField(choices=Waste.WASTE_TYPES, write_only=True)
    type = serializers.CharField(source='waste.type', read_only=True)
    
    class Meta:
        model = UserWastes
        fields = ['id', 'waste_type', 'type', 'amount', 'date']
        read_only_fields = ['id', 'date', 'type']

    def create(self, validated_data):
        waste_type = validated_data.pop('waste_type')
        waste = Waste.objects.get(type=waste_type.upper())
        return UserWastes.objects.create(
            waste=waste,
            **validated_data
        )