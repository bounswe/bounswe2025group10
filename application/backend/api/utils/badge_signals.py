"""
Signals for automatic badge awarding
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from api.models import UserWastes, Posts, Tips, PostLikes, TipLikes
from api.utils.badge_system import check_and_award_badges


@receiver(post_save, sender=UserWastes)
def award_badges_on_waste_entry(sender, instance, created, **kwargs):
    """
    Check and award badges when a user logs waste.
    """
    if created:
        check_and_award_badges(instance.user)


@receiver(post_save, sender=Posts)
def award_badges_on_post_creation(sender, instance, created, **kwargs):
    """
    Check and award contribution badges when a user creates a post.
    """
    if created:
        check_and_award_badges(instance.creator)


@receiver(post_save, sender=PostLikes)
def award_badges_on_post_like(sender, instance, created, **kwargs):
    """
    Check and award likes received badges when a post receives a like.
    """
    if instance.reaction_type == 'LIKE':
        # Award badge to the post creator (not the liker)
        check_and_award_badges(instance.post.creator)


@receiver(post_save, sender=TipLikes)
def award_badges_on_tip_like(sender, instance, created, **kwargs):
    """
    Check and award likes received badges when a tip receives a like.
    """
    if instance.reaction_type == 'LIKE':
        # Award badge to the tip creator (not the liker)
        # Note: This assumes Tips model has a 'creator' field
        if hasattr(instance.tip, 'creator'):
            check_and_award_badges(instance.tip.creator)
