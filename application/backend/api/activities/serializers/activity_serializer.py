# activities/serializers.py
from copy import deepcopy
from rest_framework import serializers
from ..models.activity_model import ActivityEvent, Visibility


def _deep_merge(a: dict | None, b: dict | None) -> dict:
    """
    Non-destructive deep merge: values in b override/extend a.
    """
    out = deepcopy(a) if a else {}
    for k, v in (b or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out


def _as2_from_fields(*, actor_id, type, object_type, object_id,
                     community_id=None, visibility=Visibility.PUBLIC,
                     summary="", published_iso=None) -> dict:
    """
    Build a minimal ActivityStreams 2.0 payload from denormalized fields.
    """
    to, cc = [], []
    if visibility == Visibility.PUBLIC:
        to = ["https://www.w3.org/ns/activitystreams#Public"]
    elif visibility == Visibility.UNLISTED:
        cc = ["https://www.w3.org/ns/activitystreams#Public"]
    # For FOLLOWERS/DIRECT, you can inject your collections/IRIs later.

    base = {
        "@context": "https://www.w3.org/ns/activitystreams",
        "type": type,
        "actor": actor_id,
        "object": {"type": object_type, "id": object_id},
        "to": to,
        "cc": cc,
    }
    if community_id:
        base["audience"] = community_id
    if summary:
        base["summary"] = summary
    if published_iso:
        base["published"] = published_iso
    return base


class ActivityEventSerializer(serializers.ModelSerializer):
    """
    Serializer that:
      - Validates core fields
      - Merges denormalized fields into as2_json (without dropping client extras)
      - Ensures 'published' in as2_json matches model's published_at
    """

    class Meta:
        model = ActivityEvent
        fields = [
            "id",
            "as2_json",
            "actor_id",
            "type",
            "object_type",
            "object_id",
            "community_id",
            "published_at",
            "visibility",
            "summary",
        ]
        read_only_fields = ["id", "published_at"]  # let model set published_at; keep AS2 'published' in sync

    # ---- Field-level validation (optional but helpful) ----------------------
    def validate_as2_json(self, value):
        if value is None:
            return {}
        if not isinstance(value, dict):
            raise serializers.ValidationError("as2_json must be a JSON object.")
        return value

    def validate(self, attrs):
        """
        Cross-field checks.
        """
        obj_type = attrs.get("object_type") or getattr(self.instance, "object_type", None)
        obj_id = attrs.get("object_id") or getattr(self.instance, "object_id", None)
        if obj_type and not obj_id:
            raise serializers.ValidationError({"object_id": "object_id is required when object_type is set."})
        if obj_id and not obj_type:
            raise serializers.ValidationError({"object_type": "object_type is required when object_id is set."})
        return attrs

    # ---- Create / Update ----------------------------------------------------
    def _merge_as2(self, instance_or_data, incoming_as2: dict | None) -> dict:
        """
        Build canonical AS2 from current (or soon-to-be) model values and merge with incoming.
        """
        # When creating, instance is not yet saved; when updating, we have an instance.
        if isinstance(instance_or_data, ActivityEvent):
            actor_id = instance_or_data.actor_id
            typ = instance_or_data.type
            object_type = instance_or_data.object_type
            object_id = instance_or_data.object_id
            community_id = instance_or_data.community_id
            visibility = instance_or_data.visibility
            summary = instance_or_data.summary
            published_iso = instance_or_data.published_at.isoformat().replace("+00:00", "Z")
        else:
            # validated_data path
            actor_id = instance_or_data["actor_id"]
            typ = instance_or_data["type"]
            object_type = instance_or_data["object_type"]
            object_id = instance_or_data["object_id"]
            community_id = instance_or_data.get("community_id")
            visibility = instance_or_data.get("visibility", Visibility.PUBLIC)
            summary = instance_or_data.get("summary", "")
            # published_at not yet final; add after instance is saved
            published_iso = None

        base = _as2_from_fields(
            actor_id=actor_id,
            type=typ,
            object_type=object_type,
            object_id=object_id,
            community_id=community_id,
            visibility=visibility,
            summary=summary,
            published_iso=published_iso,
        )
        return _deep_merge(incoming_as2 or {}, base)

    def create(self, validated_data):
        incoming_as2 = validated_data.get("as2_json", {})
        # First merge without 'published' (instance not saved yet)
        merged = self._merge_as2(validated_data, incoming_as2)
        validated_data["as2_json"] = merged

        instance = super().create(validated_data)

        # Now ensure 'published' matches model timestamp
        instance.as2_json = _deep_merge(
            instance.as2_json,
            {"published": instance.published_at.isoformat().replace("+00:00", "Z")},
        )
        instance.save(update_fields=["as2_json"])
        return instance

    def update(self, instance, validated_data):
        incoming_as2 = validated_data.get("as2_json", instance.as2_json)
        # Apply incoming field changes to a temp dict derived from instance
        current = {
            "actor_id": validated_data.get("actor_id", instance.actor_id),
            "type": validated_data.get("type", instance.type),
            "object_type": validated_data.get("object_type", instance.object_type),
            "object_id": validated_data.get("object_id", instance.object_id),
            "community_id": validated_data.get("community_id", instance.community_id),
            "visibility": validated_data.get("visibility", instance.visibility),
            "summary": validated_data.get("summary", instance.summary),
        }
        merged = self._merge_as2(current, incoming_as2)
        validated_data["as2_json"] = merged

        instance = super().update(instance, validated_data)

        # Keep 'published' in sync after save
        instance.as2_json = _deep_merge(
            instance.as2_json,
            {"published": instance.published_at.isoformat().replace("+00:00", "Z")},
        )
        instance.save(update_fields=["as2_json"])
        return instance