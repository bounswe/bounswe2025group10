# activities/models.py
import uuid
from copy import deepcopy
from django.db import models
from django.utils import timezone

class Visibility(models.TextChoices):
    PUBLIC = "public", "Public"
    UNLISTED = "unlisted", "Unlisted"
    FOLLOWERS = "followers", "Followers"
    DIRECT = "direct", "Direct"

def _deep_merge(a: dict, b: dict) -> dict:
    """Non-destructive deep merge: values in b override/extend a."""
    out = deepcopy(a) if a else {}
    for k, v in (b or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out

class ActivityEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    as2_json = models.JSONField()

    actor_id = models.CharField(max_length=255, db_index=True)
    type = models.CharField(max_length=64, db_index=True)
    object_type = models.CharField(max_length=64, db_index=True)
    object_id = models.CharField(max_length=255, db_index=True)
    community_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)

    published_at = models.DateTimeField(default=timezone.now, db_index=True)

    visibility = models.CharField(
        max_length=16, choices=Visibility.choices, default=Visibility.PUBLIC, db_index=True
    )

    summary = models.TextField(blank=True, default="")

    class Meta:
        db_table = "activity_event"
        indexes = [
            models.Index(fields=["actor_id", "published_at"], name="idx_actor_ts"),
            models.Index(fields=["community_id", "published_at"], name="idx_comm_ts"),
            models.Index(fields=["type", "published_at"], name="idx_type_ts"),
            models.Index(fields=["object_type", "object_id"], name="idx_obj_pair"),
            models.Index(fields=["visibility", "published_at"], name="idx_vis_ts"),
        ]

    def __str__(self):
        return f"{self.type} by {self.actor_id} on {self.object_type}:{self.object_id}"

    # ---- AS2 helpers --------------------------------------------------------
    def build_as2_from_fields(self) -> dict:
        """
        Build a minimal-but-complete ActivityStreams 2.0 payload from denormalized fields.
        This is the canonical shape most Fediverse software expects.
        """
        # Map visibility to AS2 addressing
        to = []
        cc = []
        if self.visibility == Visibility.PUBLIC:
            to = ["https://www.w3.org/ns/activitystreams#Public"]
        elif self.visibility == Visibility.UNLISTED:
            # Common pattern: unlisted -> not in "to", but cc Public
            cc = ["https://www.w3.org/ns/activitystreams#Public"]
        # FOLLOWERS/DIRECT can stay empty or point to collections/inboxes you maintain.

        as2_object = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": self.type,                          # e.g. "Create", "Like", "Announce", "Follow"
            "actor": self.actor_id,                     # can be an IRI or opaque id you use
            "object": {
                "type": self.object_type,               # e.g. "Note", "Article", "Person", ...
                "id": self.object_id,                   # an IRI/ID for the object
            },
            "published": self.published_at.isoformat().replace("+00:00", "Z"),
            "to": to,
            "cc": cc,
        }
        if self.community_id:
            # Include community/group as audience or tag—tweak to your data model
            as2_object["audience"] = self.community_id
        if self.summary:
            # AS2 allows "summary" at activity or object level; use activity-level here
            as2_object["summary"] = self.summary

        return as2_object

    def sync_as2_json(self):
        """Merge denormalized fields → AS2 payload into as2_json, preserving any extra keys already present."""
        computed = self.build_as2_from_fields()
        self.as2_json = _deep_merge(self.as2_json or {}, computed)

    # ---- Save override ------------------------------------------------------
    def save(self, *args, **kwargs):
        # Ensure AS2 payload always reflects the current row
        self.sync_as2_json()
        super().save(*args, **kwargs)