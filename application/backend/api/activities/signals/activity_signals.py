# api/activities/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction
from django.contrib.auth import get_user_model

from api.models import (
    Posts, Comments, PostLikes, TipLikes, Report, UserWastes, UserAchievements
)

from django.apps import apps

# Optional UserChallenge import (adjust path if needed)
UserChallenge = apps.get_model('challenges', 'UserChallenge') if apps.is_installed('challenges') else None

from ..utils.event_writer import EventWriter
from ...models import Visibility

User = get_user_model()

# ----------------------------
# helpers
# ----------------------------
def uname(u):
    return getattr(u, "username", None) or str(getattr(u, "pk", "")) or "unknown"

def snippet(txt, n=100):
    return (txt or "")[:n]

# ============================
# Users (Register / Update / Delete)
# ============================

@receiver(post_save, sender=User, dispatch_uid="as2_user_create")
def user_created(sender, instance: User, created: bool, **kwargs):
    if not created:
        return
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Create",
        actor_id=uname(instance),
        object_type="Person",
        object_id=str(instance.pk),
        summary=f"User {uname(instance)} registered",
        visibility=Visibility.PUBLIC,
    ))

@receiver(post_save, sender=User, dispatch_uid="as2_user_update")
def user_updated(sender, instance: User, created: bool, **kwargs):
    if created:
        return
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Update",
        actor_id=uname(instance),
        object_type="Person",
        object_id=str(instance.pk),
        summary=f"User {uname(instance)} profile updated",
        visibility=Visibility.PUBLIC,
    ))

@receiver(post_delete, sender=User, dispatch_uid="as2_user_delete")
def user_deleted(sender, instance: User, **kwargs):
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Undo",
        actor_id=uname(instance),
        object_type="Person",
        object_id=str(instance.pk),
        summary=f"User {uname(instance)} deleted",
        visibility=Visibility.PUBLIC,
    ))

# ============================
# Posts (Create / Update / Delete)
# ============================

@receiver(post_save, sender=Posts, dispatch_uid="as2_post_create")
def post_created(sender, instance: Posts, created: bool, **kwargs):
    if not created:
        return
    actor = getattr(instance, "creator", None)
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Create",
        actor_id=uname(actor),
        object_type="Note",
        object_id=str(instance.pk),
        summary=snippet(getattr(instance, "text", "")),
        visibility=Visibility.PUBLIC,  # Posts has no visibility field
    ))

@receiver(post_save, sender=Posts, dispatch_uid="as2_post_update")
def post_updated(sender, instance: Posts, created: bool, **kwargs):
    if created:
        return
    actor = getattr(instance, "creator", None)
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Update",
        actor_id=uname(actor),
        object_type="Note",
        object_id=str(instance.pk),
        summary=snippet(getattr(instance, "text", "")),
        visibility=Visibility.PUBLIC,
    ))

@receiver(post_delete, sender=Posts, dispatch_uid="as2_post_delete")
def post_deleted(sender, instance: Posts, **kwargs):
    actor = getattr(instance, "creator", None)
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Undo",
        actor_id=uname(actor),
        object_type="Note",
        object_id=str(instance.pk),
        summary=f"Post {instance.pk} deleted",
        visibility=Visibility.PUBLIC,
    ))

# ============================
# Comments (Create / Update / Delete)
# ============================

@receiver(post_save, sender=Comments, dispatch_uid="as2_comment_create")
def comment_created(sender, instance: Comments, created: bool, **kwargs):
    if not created:
        return
    actor = getattr(instance, "author", None)
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Create",
        actor_id=uname(actor),
        object_type="Comment",
        object_id=str(instance.pk),
        summary=snippet(getattr(instance, "content", "")),
        visibility=Visibility.PUBLIC,
    ))

@receiver(post_save, sender=Comments, dispatch_uid="as2_comment_update")
def comment_updated(sender, instance: Comments, created: bool, **kwargs):
    if created:
        return
    actor = getattr(instance, "author", None)
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Update",
        actor_id=uname(actor),
        object_type="Comment",
        object_id=str(instance.pk),
        summary=snippet(getattr(instance, "content", "")),
        visibility=Visibility.PUBLIC,
    ))

@receiver(post_delete, sender=Comments, dispatch_uid="as2_comment_delete")
def comment_deleted(sender, instance: Comments, **kwargs):
    actor = getattr(instance, "author", None)
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Undo",
        actor_id=uname(actor),
        object_type="Comment",
        object_id=str(instance.pk),
        summary=f"Comment {instance.pk} deleted",
        visibility=Visibility.PUBLIC,
    ))

# ============================
# PostLikes (Like / Update / Undo)
# ============================

@receiver(post_save, sender=PostLikes, dispatch_uid="as2_post_like_create_or_update")
def post_like_create_or_update(sender, instance: PostLikes, created: bool, **kwargs):
    if created:
        # new reaction → Like
        transaction.on_commit(lambda: EventWriter.log_event(
            activity_type="Like",
            actor_id=uname(instance.user),
            object_type="Like",
            object_id=str(instance.pk),
            summary=f"User {uname(instance.user)} liked post {instance.post.pk}",
            visibility=Visibility.PUBLIC,
        ))
    else:
        # changed reaction → Update
        transaction.on_commit(lambda: EventWriter.log_event(
            activity_type="Update",
            actor_id=uname(instance.user),
            object_type="Like",
            object_id=str(instance.pk),
            summary=f"User {uname(instance.user)} changed reaction on post {instance.post.pk} to {instance.reaction_type}",
            visibility=Visibility.PUBLIC,
        ))

@receiver(post_delete, sender=PostLikes, dispatch_uid="as2_post_like_undo")
def post_like_deleted(sender, instance: PostLikes, **kwargs):
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Undo",
        actor_id=uname(instance.user),
        object_type="Like",
        object_id=str(instance.pk),
        summary=f"User {uname(instance.user)} removed reaction on post {instance.post.pk}",
        visibility=Visibility.PUBLIC,
    ))

# ============================
# TipLikes (Like / Update / Undo)
# ============================

@receiver(post_save, sender=TipLikes, dispatch_uid="as2_tip_like_create_or_update")
def tip_like_create_or_update(sender, instance: TipLikes, created: bool, **kwargs):
    if created:
        transaction.on_commit(lambda: EventWriter.log_event(
            activity_type="Like",
            actor_id=uname(instance.user),
            object_type="Like",
            object_id=str(instance.pk),
            summary=f"User {uname(instance.user)} liked tip {instance.tip.pk}",
            visibility=Visibility.PUBLIC,
        ))
    else:
        transaction.on_commit(lambda: EventWriter.log_event(
            activity_type="Update",
            actor_id=uname(instance.user),
            object_type="Like",
            object_id=str(instance.pk),
            summary=f"User {uname(instance.user)} changed reaction on tip {instance.tip.pk} to {instance.reaction_type}",
            visibility=Visibility.PUBLIC,
        ))

@receiver(post_delete, sender=TipLikes, dispatch_uid="as2_tip_like_undo")
def tip_like_deleted(sender, instance: TipLikes, **kwargs):
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Undo",
        actor_id=uname(instance.user),
        object_type="Like",
        object_id=str(instance.pk),
        summary=f"User {uname(instance.user)} removed reaction on tip {instance.tip.pk}",
        visibility=Visibility.PUBLIC,
    ))

# ============================
# Reports (Create / Update / Delete)
# ============================

@receiver(post_save, sender=Report, dispatch_uid="as2_report_create")
def report_created(sender, instance: Report, created: bool, **kwargs):
    if not created:
        return
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Create",
        actor_id=uname(getattr(instance, "reporter", None)),
        object_type="Report",
        object_id=str(instance.pk),
        summary=snippet(getattr(instance, "reason", "")),
        visibility=Visibility.PUBLIC,
    ))

@receiver(post_save, sender=Report, dispatch_uid="as2_report_update")
def report_updated(sender, instance: Report, created: bool, **kwargs):
    if created:
        return
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Update",
        actor_id=uname(getattr(instance, "reporter", None)),
        object_type="Report",
        object_id=str(instance.pk),
        summary=f"Report {instance.pk} updated",
        visibility=Visibility.PUBLIC,
    ))

@receiver(post_delete, sender=Report, dispatch_uid="as2_report_delete")
def report_deleted(sender, instance: Report, **kwargs):
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Undo",
        actor_id=uname(getattr(instance, "reporter", None)),
        object_type="Report",
        object_id=str(instance.pk),
        summary=f"Report {instance.pk} deleted",
        visibility=Visibility.PUBLIC,
    ))

# ============================
# UserWastes (Create / Update / Delete)
# ============================

@receiver(post_save, sender=UserWastes, dispatch_uid="as2_user_waste_create")
def user_waste_created(sender, instance: UserWastes, created: bool, **kwargs):
    if not created:
        return
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Create",
        actor_id=uname(instance.user),
        object_type="UserWaste",
        object_id=str(instance.pk),
        summary=f"User {uname(instance.user)} logged waste of amount {instance.amount} kg",
        visibility=Visibility.PUBLIC,
    ))

@receiver(post_save, sender=UserWastes, dispatch_uid="as2_user_waste_update")
def user_waste_updated(sender, instance: UserWastes, created: bool, **kwargs):
    if created:
        return
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Update",
        actor_id=uname(instance.user),
        object_type="UserWaste",
        object_id=str(instance.pk),
        summary=f"User {uname(instance.user)} updated waste to {instance.amount} kg",
        visibility=Visibility.PUBLIC,
    ))

@receiver(post_delete, sender=UserWastes, dispatch_uid="as2_user_waste_delete")
def user_waste_deleted(sender, instance: UserWastes, **kwargs):
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Undo",
        actor_id=uname(instance.user),
        object_type="UserWaste",
        object_id=str(instance.pk),
        summary=f"User {uname(instance.user)} deleted waste log",
        visibility=Visibility.PUBLIC,
    ))

# ============================
# UserAchievements (Create / Update / Delete)
# ============================

@receiver(post_save, sender=UserAchievements, dispatch_uid="as2_user_achievement_create")
def user_achievement_created(sender, instance: UserAchievements, created: bool, **kwargs):
    if not created:
        return
    title_or_name = getattr(instance.achievement, "name", "") or getattr(instance.achievement, "title", "")
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Create",
        actor_id=uname(instance.user),
        object_type="UserAchievement",
        object_id=str(instance.pk),
        summary=f"User {uname(instance.user)} earned achievement {title_or_name}",
        visibility=Visibility.PUBLIC,
    ))

@receiver(post_save, sender=UserAchievements, dispatch_uid="as2_user_achievement_update")
def user_achievement_updated(sender, instance: UserAchievements, created: bool, **kwargs):
    if created:
        return
    title_or_name = getattr(instance.achievement, "name", "") or getattr(instance.achievement, "title", "")
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Update",
        actor_id=uname(instance.user),
        object_type="UserAchievement",
        object_id=str(instance.pk),
        summary=f"User {uname(instance.user)} updated achievement {title_or_name}",
        visibility=Visibility.PUBLIC,
    ))

@receiver(post_delete, sender=UserAchievements, dispatch_uid="as2_user_achievement_delete")
def user_achievement_deleted(sender, instance: UserAchievements, **kwargs):
    title_or_name = getattr(instance.achievement, "name", "") or getattr(instance.achievement, "title", "")
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Undo",
        actor_id=uname(instance.user),
        object_type="UserAchievement",
        object_id=str(instance.pk),
        summary=f"User {uname(instance.user)} removed achievement {title_or_name}",
        visibility=Visibility.PUBLIC,
    ))

# ============================
# UserChallenge (optional: Create / Update / Delete)
# ============================


@receiver(post_save, sender=UserChallenge, dispatch_uid="as2_user_challenge_create")
def user_challenge_created(sender, instance: UserChallenge, created: bool, **kwargs):
    if not created:
        return
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Create",
        actor_id=uname(instance.user),
            object_type="UserChallenge",
            object_id=str(instance.pk),
            summary=f"User {uname(instance.user)} started challenge {getattr(instance, 'challenge_name', '')}",
            visibility=Visibility.PUBLIC,
        ))

@receiver(post_save, sender=UserChallenge, dispatch_uid="as2_user_challenge_update")
def user_challenge_updated(sender, instance: UserChallenge, created: bool, **kwargs):
    if created:
        return
    transaction.on_commit(lambda: EventWriter.log_event(
        activity_type="Update",
        actor_id=uname(instance.user),
            object_type="UserChallenge",
            object_id=str(instance.pk),
            summary=f"User {uname(instance.user)} updated challenge {getattr(instance, 'challenge_name', '')}",
            visibility=Visibility.PUBLIC,
        ))

@receiver(post_delete, sender=UserChallenge, dispatch_uid="as2_user_challenge_delete")
def user_challenge_deleted(sender, instance: "UserChallenge", **kwargs):
    transaction.on_commit(lambda: EventWriter.log_event(
            activity_type="Undo",
            actor_id=uname(instance.user),
            object_type="UserChallenge",
            object_id=str(instance.pk),
            summary=f"User {uname(instance.user)} ended challenge {getattr(instance, 'challenge_name', '')}",
            visibility=Visibility.PUBLIC,
))