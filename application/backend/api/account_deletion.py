from __future__ import annotations

from datetime import timedelta
from typing import Optional

from django.db import transaction
from django.utils import timezone


DELETION_GRACE_PERIOD_DAYS = 30


def request_account_deletion(user, now=None):
    from api.models import AccountDeletionRequest

    now = now or timezone.now()
    delete_after = now + timedelta(days=DELETION_GRACE_PERIOD_DAYS)

    with transaction.atomic():
        req, created = AccountDeletionRequest.objects.select_for_update().get_or_create(
            user=user,
            defaults={'requested_at': now, 'delete_after': delete_after},
        )
        if not created:
            if req.canceled_at is not None:
                req.canceled_at = None
                req.requested_at = now
                req.delete_after = delete_after
                req.save(update_fields=['canceled_at', 'requested_at', 'delete_after'])

        if getattr(user, 'is_active', True):
            user.is_active = False
            user.save(update_fields=['is_active'])

    return req


def cancel_account_deletion(user, now=None) -> bool:
    from api.models import AccountDeletionRequest

    now = now or timezone.now()
    with transaction.atomic():
        req = AccountDeletionRequest.objects.select_for_update().filter(user=user).first()
        if not req:
            return False
        if req.canceled_at is None:
            req.canceled_at = now
            req.save(update_fields=['canceled_at'])
        if not getattr(user, 'is_active', True):
            user.is_active = True
            user.save(update_fields=['is_active'])
        return True


def get_account_deletion_request(user):
    from api.models import AccountDeletionRequest

    return AccountDeletionRequest.objects.filter(user=user).first()


def _delete_user_and_associated_data(user) -> None:
    """
    Best-effort hard deletion for data that references the user.
    """
    from api.models import (
        Comments,
        Posts,
        PostLikes,
        SavedPosts,
        TipLikes,
        UserAchievements,
        UserBadges,
        UserWastes,
        SuspiciousWaste,
        Follow,
        AccountDeletionRequest,
    )
    from challenges.models import Challenge, UserChallenge
    from notifications.models import Notification

    # Delete relations that use DO_NOTHING (avoid leaving orphans)
    Comments.objects.filter(author=user).delete()
    Posts.objects.filter(creator=user).delete()
    UserAchievements.objects.filter(user=user).delete()
    UserBadges.objects.filter(user=user).delete()
    UserChallenge.objects.filter(user=user).delete()

    # Challenges created by the user may have other participants; delete them for full data removal.
    user_challenges = Challenge.objects.filter(creator=user)
    UserChallenge.objects.filter(challenge__in=user_challenges).delete()
    user_challenges.delete()

    # Delete relations that cascade already, but do it explicitly for completeness.
    PostLikes.objects.filter(user=user).delete()
    SavedPosts.objects.filter(user=user).delete()
    TipLikes.objects.filter(user=user).delete()
    UserWastes.objects.filter(user=user).delete()
    SuspiciousWaste.objects.filter(user=user).delete()
    Follow.objects.filter(follower=user).delete()
    Follow.objects.filter(following=user).delete()
    Notification.objects.filter(user=user).delete()

    # Remove deletion request record before deleting user (optional, but avoids select-related surprises)
    AccountDeletionRequest.objects.filter(user=user).delete()

    user.delete()


def process_due_account_deletions(now: Optional[timezone.datetime] = None) -> int:
    from api.models import AccountDeletionRequest

    now = now or timezone.now()
    due = (
        AccountDeletionRequest.objects.select_related('user')
        .filter(canceled_at__isnull=True, delete_after__lte=now)
    )

    deleted = 0
    for req in due:
        with transaction.atomic():
            user = req.user
            if user is None:
                req.delete()
                continue
            _delete_user_and_associated_data(user)
            deleted += 1
    return deleted

