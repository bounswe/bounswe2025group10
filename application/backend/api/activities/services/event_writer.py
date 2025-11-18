"""Event writer utility for Activity Streams 2.0 events.

Provides a single entry point `log_event` that validates inputs, generates a
canonical AS2 payload (including @context, addressing and published), and
persists the event using the existing ActivityEventSerializer.
"""
from __future__ import annotations

from typing import Any, Dict, Optional
from rest_framework import serializers

from ..serializers.activity_serializer import ActivityEventSerializer


AS2_CONTEXT = "https://www.w3.org/ns/activitystreams"
AS2_PUBLIC = "https://www.w3.org/ns/activitystreams#Public"


def _validate_inputs(
    actor: str,
    type: str,
    object: Dict[str, Any],
    visibility: str,
) -> None:
    if not isinstance(actor, str) or not actor.strip():
        raise serializers.ValidationError({"actor": "actor must be a non-empty string"})
    if not isinstance(type, str) or not type.strip():
        raise serializers.ValidationError({"type": "type must be a non-empty string"})
    if not isinstance(object, dict):
        raise serializers.ValidationError({"object": "object must be a dict with 'type' and 'id'"})
    if "type" not in object or "id" not in object:
        raise serializers.ValidationError({"object": "object must include 'type' and 'id'"})
    if visibility not in {"public", "unlisted", "followers", "direct"}:
        raise serializers.ValidationError({"visibility": "invalid visibility"})


def _addresses_for_visibility(visibility: str) -> Dict[str, Any]:
    if visibility == "public":
        return {"to": [AS2_PUBLIC], "cc": []}
    if visibility == "unlisted":
        return {"to": [], "cc": [AS2_PUBLIC]}
    # followers/direct → empty addressing here (can be enriched by caller)
    return {"to": [], "cc": []}


def _build_as2(
    *,
    actor: str,
    type: str,
    object: Dict[str, Any],
    community: Optional[str],
    visibility: str,
    published_iso: Optional[str],
) -> Dict[str, Any]:
    # Minimal canonical AS2 activity
    as2: Dict[str, Any] = {
        "@context": AS2_CONTEXT,
        "type": type,
        "actor": actor,
        "object": {"type": object["type"], "id": object["id"]},
        **_addresses_for_visibility(visibility),
    }

    # Carry additional object keys (e.g., content, attachments, tag, etc.)
    extra_object = {k: v for k, v in object.items() if k not in {"type", "id"}}
    if extra_object:
        as2["object"].update(extra_object)

    if community:
        as2["audience"] = community
    if published_iso:
        as2["published"] = published_iso
    return as2


def log_event(
    actor: str,
    type: str,
    object: Dict[str, Any],
    community: Optional[str] = None,
    visibility: str = "public",
):
    """
    Create and persist an ActivityStreams 2.0 event.

    - Validates inputs; raises serializers.ValidationError on invalid data
    - Auto-generates @context, addressing (to/cc) and published
    - Persists using ActivityEventSerializer so DB fields and as2_json remain consistent

    Returns: saved ActivityEvent instance
    """
    _validate_inputs(actor, type, object, visibility)

    # Build initial AS2 without 'published'; DB timestamp will be authoritative.
    as2_initial = _build_as2(
        actor=actor,
        type=type,
        object=object,
        community=community,
        visibility=visibility,
        published_iso=None,
    )

    payload = {
        "actor_id": actor,
        "type": type,
        "object_type": object["type"],
        "object_id": object["id"],
        "community_id": community,
        "visibility": visibility,
        "as2_json": as2_initial,
    }

    serializer = ActivityEventSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    instance = serializer.save()

    # Ensure 'published' reflects stored timestamp (serializer already does this,
    # but we keep it explicit and idempotent here).
    published_iso = instance.published_at.isoformat().replace("+00:00", "Z")
    as2_final = _build_as2(
        actor=actor,
        type=type,
        object=object,
        community=community,
        visibility=visibility,
        published_iso=published_iso,
    )
    if instance.as2_json != as2_final:
        instance.as2_json = as2_final
        instance.save(update_fields=["as2_json"])
    return instance
