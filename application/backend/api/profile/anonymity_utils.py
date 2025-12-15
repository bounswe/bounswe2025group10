from __future__ import annotations

import secrets


def get_or_create_anonymous_identifier(user) -> str:
    """
    Ensures the user has a stable anonymous_identifier and returns it.
    """
    if getattr(user, 'anonymous_identifier', None):
        return user.anonymous_identifier

    # 16 chars urlsafe-ish token, fits in 32
    anon = f"anon_{secrets.token_urlsafe(9)[:16]}"
    user.anonymous_identifier = anon
    user.save(update_fields=['anonymous_identifier'])
    return anon


def display_name_for_viewer(viewer, subject_user) -> str:
    """
    Returns the identifier that should be displayed for `subject_user` to `viewer`.
    """
    if getattr(subject_user, 'is_anonymous', False):
        viewer_is_owner = bool(viewer and getattr(viewer, 'is_authenticated', False) and getattr(viewer, 'id', None) == subject_user.id)
        if not viewer_is_owner:
            return get_or_create_anonymous_identifier(subject_user)
    return subject_user.username


def can_show_profile_image(viewer, subject_user) -> bool:
    """
    If a user is anonymous, hide their profile image from other users.
    """
    if getattr(subject_user, 'is_anonymous', False):
        return bool(viewer and getattr(viewer, 'is_authenticated', False) and getattr(viewer, 'id', None) == subject_user.id)
    return True

