from rest_framework import serializers


class AccountDeletionCancelByTokenRequestSerializer(serializers.Serializer):
    cancel_token = serializers.CharField()


class AccountDeletionRequestPostDataSerializer(serializers.Serializer):
    requested_at = serializers.DateTimeField()
    delete_after = serializers.DateTimeField()
    cancel_token = serializers.CharField()


class AccountDeletionRequestPostResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    data = AccountDeletionRequestPostDataSerializer()


class AccountDeletionRequestStatusDataSerializer(serializers.Serializer):
    requested = serializers.BooleanField()
    requested_at = serializers.DateTimeField(allow_null=True)
    delete_after = serializers.DateTimeField(allow_null=True)
    canceled_at = serializers.DateTimeField(allow_null=True)


class AccountDeletionRequestStatusResponseSerializer(serializers.Serializer):
    data = AccountDeletionRequestStatusDataSerializer()


class AccountDeletionCancelResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    status = serializers.ChoiceField(choices=["canceled", "deleted"])
