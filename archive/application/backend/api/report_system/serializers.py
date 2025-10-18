# serializers.py
from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from ..models import (
    Report,
    Posts,
    Comments,
    Tips,
    Users,
)

from challenges.models import Challenge

# Per‑model “preview” serializers (minimal fields admin cares about)
class PostPreviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Posts
        fields = ["id", "text", "image", "creator_id", "date"]


class CommentPreviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comments
        fields = ["id", "content", "author_id", "post_id", "date"]


class ChallengePreviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Challenge
        fields = ["id", "title", "description", "current_progress", "target_amount"]


class TipPreviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tips
        fields = ["id", "text", "like_count", "dislike_count"]


# Polymorphic field that returns the right preview serializer
class ReportedObjectField(serializers.Field):
    """
    Serializes the underlying object (Post, Comment, Challenge, Tip)
    in a minimal form suitable for the admin list/detail view.
    """

    def to_representation(self, obj):
        if isinstance(obj, Posts):
            return PostPreviewSerializer(obj).data
        if isinstance(obj, Comments):
            return CommentPreviewSerializer(obj).data
        if isinstance(obj, Challenge):
            return ChallengePreviewSerializer(obj).data
        if isinstance(obj, Tips):
            return TipPreviewSerializer(obj).data
        return {"detail": "Unsupported object type"}

    # Incoming writes never set this field directly → read‑only
    def to_internal_value(self, data):
        raise serializers.ValidationError("Read‑only field")


# Main serializer fed to admin panel
class ReportReadSerializer(serializers.ModelSerializer):
    reporter = serializers.StringRelatedField()
    content_type = serializers.SlugRelatedField(
        slug_field="model", read_only=True
    )
    content = ReportedObjectField(source="content_object", read_only=True)

    class Meta:
        model = Report
        fields = [
            "id",
            "reporter",
            "reason",
            "description",
            "date_reported",
            "content_type",
            "object_id",
            "content",
        ]


class ReportCreateSerializer(serializers.ModelSerializer):
    # allow users to specify the model by its lowercase name, e.g. "post"
    content_type = serializers.SlugRelatedField(
        slug_field="model",
        queryset=ContentType.objects.all(),
        help_text="The model name, e.g. 'post', 'comment', 'tip', etc."
    )
    object_id = serializers.IntegerField(
        help_text="The primary key of the object being reported"
    )
    id = serializers.IntegerField(read_only=True)  # Add id field as read-only
    reason = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, required=False)

    class Meta:
        model = Report
        fields = ["id", "content_type", "object_id", "reason", "description"]


# Serializer for moderation actions
class ModerationActionSerializer(serializers.Serializer):
    """
    Used with /reports/{id}/moderate/ endpoint.

    action: "delete_media" | "ban_user" | "ignore"
    """
    ACTION_CHOICES = [
        ("delete_media", "Delete or hide the reported media"),
        ("ban_user", "Deactivate the media owner’s account"),
        ("ignore", "Mark report as resolved with no action"),
    ]

    action = serializers.ChoiceField(choices=ACTION_CHOICES)