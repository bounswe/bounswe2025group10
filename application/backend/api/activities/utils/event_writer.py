# api/activities/utils/event_writer.py
import re
from django.utils import timezone
from ...models import ActivityEvent, Visibility

PUBLIC = "https://www.w3.org/ns/activitystreams#Public"

class EventWriter:
    """
    Turns domain actions into ActivityStreams 2.0 ActivityEvent rows.
    Keep this logic independent from signal senders for reuse & testing.
    """

    VERB_MAP = {
        "Create": "create",
        "Update": "update",
        "Like": "like",
        "Undo": "delete",
        "Delete": "delete",
    }

    DOMAIN_MAP = {
        "Person": "user",
        "Note": "post",
        "Comment": "comment",
        "Report": "report",
        "UserWaste": "waste",
        "UserAchievement": "achievement",
        "UserChallenge": "challenge",
        "PostLike": "post",
        "TipLike": "tip",
    }

    @staticmethod
    def _to_kebab(s: str) -> str:
        s = (s or "").strip()
        if not s:
            return "unknown"
        # CamelCase / PascalCase -> kebab-case
        s = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", s)
        s = re.sub(r"[^a-zA-Z0-9]+", "-", s)
        return s.strip("-").lower() or "unknown"

    @staticmethod
    def domain_specific_type(activity_type: str, object_type: str) -> str:
        verb = EventWriter.VERB_MAP.get(activity_type, EventWriter._to_kebab(activity_type))
        domain = EventWriter.DOMAIN_MAP.get(object_type, EventWriter._to_kebab(object_type))
        return f"{verb}-{domain}"

    @staticmethod
    def build_as2(activity_type: str, actor_id: str, object_type: str, object_id: str,
                  summary: str | None = None, visibility: str = Visibility.PUBLIC) -> dict:
        to, cc = [], []
        if visibility == Visibility.PUBLIC:
            to = [PUBLIC]
        elif visibility == Visibility.UNLISTED:
            cc = [PUBLIC]

        as2 = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": activity_type,         # e.g. "create-waste", "like-post"
            "actor": actor_id,             # IRI or stable string id (username, pk URL, etc.)
            "object": {"type": object_type, "id": object_id},
            "to": to,
            "cc": cc,
            "published": timezone.now().isoformat().replace("+00:00", "Z"),
        }
        if summary:
            as2["summary"] = summary
        return as2

    @staticmethod
    def log_event(*, activity_type: str, actor_id: str, object_type: str, object_id: str,
                  summary: str = "", community_id: str | None = None,
                  visibility: str = Visibility.PUBLIC) -> ActivityEvent:
        domain_type = EventWriter.domain_specific_type(activity_type, object_type)
        as2_json = EventWriter.build_as2(
            activity_type=domain_type,
            actor_id=actor_id,
            object_type=object_type,
            object_id=object_id,
            summary=summary,
            visibility=visibility,
        )
        return ActivityEvent.objects.create(
            as2_json=as2_json,
            actor_id=actor_id,
            type=domain_type,
            object_type=object_type,
            object_id=object_id,
            community_id=community_id,
            visibility=visibility,
            summary=summary or "",
        )
