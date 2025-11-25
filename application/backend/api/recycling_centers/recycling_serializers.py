from rest_framework import serializers


class RecyclingCenterSerializer(serializers.Serializer):
    """Serializer for recycling center details"""
    ilce = serializers.CharField(
        help_text="District name where the recycling center is located"
    )
    adres = serializers.CharField(
        help_text="Full street address of the recycling center"
    )
    not_field = serializers.CharField(
        source='not',
        help_text="Additional notes about services, operating hours, or special instructions"
    )
    turler = serializers.ListField(
        child=serializers.CharField(),
        help_text="Array of waste types accepted (e.g., paper, plastic, glass, electronic)"
    )


class ErrorResponseSerializer(serializers.Serializer):
    """Serializer for error responses"""
    error = serializers.CharField(
        help_text="Error message describing what went wrong"
    )
