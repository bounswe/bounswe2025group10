from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "message", "created_at", "read"]
        read_only_fields = fields


class NotificationListResponseSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    next = serializers.CharField(allow_null=True)
    previous = serializers.CharField(allow_null=True)
    results = NotificationSerializer(many=True)


class NotificationMarkReadResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    notification = NotificationSerializer()


class NotificationMarkAllReadResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    updated_count = serializers.IntegerField()

