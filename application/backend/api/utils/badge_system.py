"""
Badge System Utilities
Handles automatic badge awarding based on user achievements
"""
from django.db.models import Sum, Count, Q
from django.utils import timezone
from api.models import (
    Users, Badges, UserBadges, UserWastes,
    Posts, Tips, PostLikes, TipLikes
)
from notifications.utils import send_notification


def get_user_waste_totals(user):
    """
    Calculate total waste recycled by type for a user.
    Returns a dict with waste types as keys and totals (in grams) as values.
    """
    waste_totals = UserWastes.objects.filter(user=user).values('waste__type').annotate(
        total_amount=Sum('amount')
    )
    
    # Amounts are stored in grams, so use them directly
    totals_dict = {item['waste__type']: float(item['total_amount']) for item in waste_totals if item['total_amount']}
    
    # Calculate overall total
    overall_total = sum(totals_dict.values()) if totals_dict else 0.0
    
    return totals_dict, overall_total


def get_user_contribution_count(user):
    """
    Calculate total contributions (posts + tips) for a user.
    """
    post_count = Posts.objects.filter(creator=user).count()
    tip_count = Tips.objects.filter(creator=user).count() if hasattr(Tips, 'creator') else 0
    
    return post_count + tip_count


def get_user_likes_received(user):
    """
    Calculate total likes received on user's posts and tips.
    """
    # Count likes on posts (exclude dislikes)
    post_likes = PostLikes.objects.filter(
        post__creator=user,
        reaction_type='LIKE'
    ).count()
    
    # Count likes on tips (if tips have creator field)
    tip_likes = TipLikes.objects.filter(
        tip__creator=user,
        reaction_type='LIKE'
    ).count() if hasattr(Tips, 'creator') else 0
    
    return post_likes + tip_likes


def check_and_award_badges(user):
    """
    Check if user qualifies for any new badges and award them automatically.
    Returns a list of newly awarded badges.
    """
    newly_awarded = []
    
    # Get current user stats
    waste_totals, total_waste = get_user_waste_totals(user)
    contribution_count = get_user_contribution_count(user)
    likes_received = get_user_likes_received(user)
    
    # Get all existing user badges to avoid duplicates
    existing_badges = set(
        UserBadges.objects.filter(user=user).values_list('badge_id', flat=True)
    )
    
    # Check waste type badges (7 categories)
    for waste_type, amount in waste_totals.items():
        eligible_badges = Badges.objects.filter(
            category=waste_type,
            criteria_value__lte=amount
        ).exclude(
            id__in=existing_badges
        ).order_by('level')
        
        for badge in eligible_badges:
            user_badge = UserBadges.objects.create(
                user=user,
                badge=badge
            )
            newly_awarded.append(badge)
            # Send notification for badge earned
            send_notification(
                user=user,
                message=f"🎉 Congratulations! You've earned the {badge.get_level_display()} {badge.get_category_display()} badge!"
            )
    
    # Check total waste badges
    eligible_total_badges = Badges.objects.filter(
        category='TOTAL_WASTE',
        criteria_value__lte=total_waste
    ).exclude(
        id__in=existing_badges
    ).order_by('level')
    
    for badge in eligible_total_badges:
        user_badge = UserBadges.objects.create(
            user=user,
            badge=badge
        )
        newly_awarded.append(badge)
        # Send notification for badge earned
        send_notification(
            user=user,
            message=f"🎉 Congratulations! You've earned the {badge.get_level_display()} {badge.get_category_display()} badge!"
        )
    
    # Check contribution badges
    eligible_contribution_badges = Badges.objects.filter(
        category='CONTRIBUTIONS',
        criteria_value__lte=contribution_count
    ).exclude(
        id__in=existing_badges
    ).order_by('level')
    
    for badge in eligible_contribution_badges:
        user_badge = UserBadges.objects.create(
            user=user,
            badge=badge
        )
        newly_awarded.append(badge)
        # Send notification for badge earned
        send_notification(
            user=user,
            message=f"🎉 Congratulations! You've earned the {badge.get_level_display()} {badge.get_category_display()} badge!"
        )
    
    # Check likes received badges
    eligible_likes_badges = Badges.objects.filter(
        category='LIKES_RECEIVED',
        criteria_value__lte=likes_received
    ).exclude(
        id__in=existing_badges
    ).order_by('level')
    
    for badge in eligible_likes_badges:
        user_badge = UserBadges.objects.create(
            user=user,
            badge=badge
        )
        newly_awarded.append(badge)
        # Send notification for badge earned
        send_notification(
            user=user,
            message=f"🎉 Congratulations! You've earned the {badge.get_level_display()} {badge.get_category_display()} badge!"
        )
    
    return newly_awarded


def get_user_progress_towards_next_badge(user):
    """
    Get user's progress towards the next badge in each category.
    Returns a dict with category as key and progress info as value.
    """
    progress = {}
    
    # Get current user stats
    waste_totals, total_waste = get_user_waste_totals(user)
    contribution_count = get_user_contribution_count(user)
    likes_received = get_user_likes_received(user)
    
    # Map categories to their current values
    category_values = {
        'TOTAL_WASTE': total_waste,
        'CONTRIBUTIONS': contribution_count,
        'LIKES_RECEIVED': likes_received,
    }
    
    # Add waste type values
    for waste_type, amount in waste_totals.items():
        category_values[waste_type] = amount
    
    # Get existing badges
    earned_badges = UserBadges.objects.filter(user=user).values_list('badge_id', flat=True)
    
    # For each category, find the next unearned badge
    for category, current_value in category_values.items():
        next_badge = Badges.objects.filter(
            category=category,
            criteria_value__gt=current_value
        ).exclude(
            id__in=earned_badges
        ).order_by('criteria_value').first()
        
        if next_badge:
            progress[category] = {
                'current_value': current_value,
                'required_value': next_badge.criteria_value,
                'percentage': (current_value / next_badge.criteria_value * 100) if next_badge.criteria_value > 0 else 100,
                'next_badge': {
                    'id': next_badge.id,
                    'category': next_badge.category,
                    'level': next_badge.level,
                }
            }
        else:
            # All badges in this category are earned
            progress[category] = {
                'current_value': current_value,
                'required_value': None,
                'percentage': 100,
                'next_badge': None,
                'all_earned': True
            }
    
    return progress


def get_user_badges_by_category(user):
    """
    Get all badges earned by a user, organized by category.
    """
    user_badges = UserBadges.objects.filter(user=user).select_related('badge')
    
    badges_by_category = {}
    for ub in user_badges:
        category = ub.badge.category
        if category not in badges_by_category:
            badges_by_category[category] = []
        
        badges_by_category[category].append({
            'id': ub.badge.id,
            'category': ub.badge.category,
            'level': ub.badge.level,
            'criteria_value': ub.badge.criteria_value,
            'earned_at': ub.earned_at,
        })
    
    # Sort badges within each category by level
    for category in badges_by_category:
        badges_by_category[category].sort(key=lambda x: x['level'])
    
    return badges_by_category
