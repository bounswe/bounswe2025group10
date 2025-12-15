from rest_framework import serializers

from .activity_serializer import ActivityEventSerializer


class UserActivityEventsRequestSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, allow_blank=True)


class AS2ActivityCollectionSerializer(serializers.Serializer):
    """
    Minimal ActivityStreams2 Collection wrapper used by activity endpoints.
    """
    context = serializers.CharField(source='@context')
    type = serializers.CharField()
    totalItems = serializers.IntegerField()
    items = ActivityEventSerializer(many=True)

