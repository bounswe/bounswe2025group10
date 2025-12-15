from api.models import Follow

PRIVACY_PUBLIC = 'public'
PRIVACY_PRIVATE = 'private'
PRIVACY_FOLLOWERS = 'followers'

VALID_PRIVACY_VALUES = {PRIVACY_PUBLIC, PRIVACY_PRIVATE, PRIVACY_FOLLOWERS}


def can_view_profile_field(viewer, profile_owner, privacy_value: str) -> bool:
    """
    Returns whether `viewer` can see a profile field on `profile_owner`
    with the given privacy_value.
    """
    if viewer and getattr(viewer, 'is_authenticated', False) and getattr(viewer, 'id', None) == profile_owner.id:
        return True

    if privacy_value == PRIVACY_PUBLIC:
        return True

    if privacy_value == PRIVACY_FOLLOWERS:
        if viewer and getattr(viewer, 'is_authenticated', False):
            return Follow.objects.filter(follower=viewer, following=profile_owner).exists()
        return False

    return False


def can_view_waste_stats(viewer, profile_owner) -> bool:
    """
    Waste stats visibility:
    - Owner can always view
    - If user is anonymous, hide waste stats from everyone else
    - Otherwise respect waste_stats_privacy
    """
    if viewer and getattr(viewer, 'is_authenticated', False) and getattr(viewer, 'id', None) == profile_owner.id:
        return True
    if getattr(profile_owner, 'is_anonymous', False):
        return False
    return can_view_profile_field(viewer, profile_owner, getattr(profile_owner, 'waste_stats_privacy', PRIVACY_PUBLIC))
