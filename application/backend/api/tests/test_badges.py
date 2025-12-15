from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIRequestFactory, APIClient
from rest_framework import status
from api.models import Users, Badges, UserBadges, UserWastes, Waste, Posts, Tips, PostLikes, TipLikes
from api.achievement.badge_views import (
    get_user_badges, get_badge_progress, get_user_badge_summary,
    get_all_badges, manually_check_badges, get_leaderboard
)
from api.utils.badge_system import (
    check_and_award_badges, get_user_waste_totals,
    get_user_contribution_count, get_user_likes_received,
    get_user_progress_towards_next_badge, get_user_badges_by_category
)
from django.utils import timezone


class BadgeSystemTests(TestCase):
    def setUp(self):
        """Set up test data"""
        self.factory = APIRequestFactory()
        self.client = APIClient()
        
        # Create test users
        self.user1 = Users.objects.create_user(
            email='testuser1@example.com',
            username='testuser1',
            password='testpass123'
        )
        
        self.user2 = Users.objects.create_user(
            email='testuser2@example.com',
            username='testuser2',
            password='testpass123'
        )
        
        # Create waste types
        self.plastic = Waste.objects.get_or_create(type='PLASTIC')[0]
        self.paper = Waste.objects.get_or_create(type='PAPER')[0]
        self.glass = Waste.objects.get_or_create(type='GLASS')[0]
        self.metal = Waste.objects.get_or_create(type='METAL')[0]
        
        # Create badges for testing
        # Plastic badges
        self.plastic_bronze = Badges.objects.create(
            category='PLASTIC',
            level=1,
            criteria_value=1000.0
        )
        self.plastic_silver = Badges.objects.create(
            category='PLASTIC',
            level=2,
            criteria_value=5000.0
        )
        self.plastic_gold = Badges.objects.create(
            category='PLASTIC',
            level=3,
            criteria_value=10000.0
        )
        
        # Total waste badges
        self.total_bronze = Badges.objects.create(
            category='TOTAL_WASTE',
            level=1,
            criteria_value=5000.0
        )
        self.total_silver = Badges.objects.create(
            category='TOTAL_WASTE',
            level=2,
            criteria_value=20000.0
        )
        
        # Contribution badges
        self.contrib_bronze = Badges.objects.create(
            category='CONTRIBUTIONS',
            level=1,
            criteria_value=5
        )
        self.contrib_silver = Badges.objects.create(
            category='CONTRIBUTIONS',
            level=2,
            criteria_value=20
        )
        
        # Likes received badges
        self.likes_bronze = Badges.objects.create(
            category='LIKES_RECEIVED',
            level=1,
            criteria_value=10
        )
        self.likes_silver = Badges.objects.create(
            category='LIKES_RECEIVED',
            level=2,
            criteria_value=50
        )


class BadgeUtilityFunctionsTests(BadgeSystemTests):
    """Test badge utility functions"""
    
    def test_get_user_waste_totals_no_waste(self):
        """Test waste totals for user with no waste"""
        totals_dict, overall_total = get_user_waste_totals(self.user1)
        self.assertEqual(totals_dict, {})
        self.assertEqual(overall_total, 0.0)
    
    def test_get_user_waste_totals_with_waste(self):
        """Test waste totals for user with waste entries"""
        UserWastes.objects.create(user=self.user1, waste=self.plastic, amount=1500.0)
        UserWastes.objects.create(user=self.user1, waste=self.plastic, amount=500.0)
        UserWastes.objects.create(user=self.user1, waste=self.paper, amount=3000.0)
        
        totals_dict, overall_total = get_user_waste_totals(self.user1)
        
        self.assertEqual(totals_dict['PLASTIC'], 2000.0)
        self.assertEqual(totals_dict['PAPER'], 3000.0)
        self.assertEqual(overall_total, 5000.0)
    
    def test_get_user_contribution_count_no_contributions(self):
        """Test contribution count for user with no posts/tips"""
        count = get_user_contribution_count(self.user1)
        self.assertEqual(count, 0)
    
    def test_get_user_contribution_count_with_posts(self):
        """Test contribution count with posts"""
        Posts.objects.create(creator=self.user1, text="Post 1", date=timezone.now())
        Posts.objects.create(creator=self.user1, text="Post 2", date=timezone.now())
        Posts.objects.create(creator=self.user1, text="Post 3", date=timezone.now())
        
        count = get_user_contribution_count(self.user1)
        self.assertEqual(count, 3)
    
    def test_get_user_likes_received_no_likes(self):
        """Test likes received for user with no likes"""
        likes = get_user_likes_received(self.user1)
        self.assertEqual(likes, 0)
    
    def test_get_user_likes_received_with_post_likes(self):
        """Test likes received on posts"""
        post1 = Posts.objects.create(creator=self.user1, text="Post 1", date=timezone.now())
        post2 = Posts.objects.create(creator=self.user1, text="Post 2", date=timezone.now())
        post3 = Posts.objects.create(creator=self.user1, text="Post 3", date=timezone.now())
        
        # Create likes from user2 on different posts
        PostLikes.objects.create(user=self.user2, post=post1, reaction_type='LIKE')
        PostLikes.objects.create(user=self.user2, post=post2, reaction_type='LIKE')
        # Dislike on a different post (user can only have one reaction per post)
        PostLikes.objects.create(user=self.user2, post=post3, reaction_type='DISLIKE')
        
        likes = get_user_likes_received(self.user1)
        self.assertEqual(likes, 2)  # Only LIKE reactions count


class BadgeAwardingTests(BadgeSystemTests):
    """Test automatic badge awarding"""
    
    def test_award_plastic_badge_on_threshold(self):
        """Test awarding plastic badge when threshold is met"""
        # Note: Badges are automatically awarded via signals when UserWastes is created
        UserWastes.objects.create(user=self.user1, waste=self.plastic, amount=1000.0)
        
        # Badge should already be awarded by the signal
        self.assertTrue(UserBadges.objects.filter(user=self.user1, badge=self.plastic_bronze).exists())
        
        # Verify the badge is in the user's badges
        user_badge = UserBadges.objects.get(user=self.user1, badge=self.plastic_bronze)
        self.assertEqual(user_badge.badge, self.plastic_bronze)
    
    def test_award_multiple_badges_at_once(self):
        """Test awarding multiple badges when user exceeds multiple thresholds"""
        # Signals auto-award badges when UserWastes is created
        UserWastes.objects.create(user=self.user1, waste=self.plastic, amount=6000.0)
        
        # Should have awarded bronze and silver automatically
        self.assertTrue(UserBadges.objects.filter(user=self.user1, badge=self.plastic_bronze).exists())
        self.assertTrue(UserBadges.objects.filter(user=self.user1, badge=self.plastic_silver).exists())
        
        # Verify count
        plastic_badges = UserBadges.objects.filter(user=self.user1, badge__category='PLASTIC')
        self.assertGreaterEqual(plastic_badges.count(), 2)
    
    def test_no_duplicate_badge_awarding(self):
        """Test that badges are not awarded twice"""
        UserWastes.objects.create(user=self.user1, waste=self.plastic, amount=1000.0)
        
        # Badge awarded by signal
        self.assertTrue(UserBadges.objects.filter(user=self.user1, badge=self.plastic_bronze).exists())
        initial_count = UserBadges.objects.filter(user=self.user1, badge=self.plastic_bronze).count()
        
        # Manual check should not award again
        newly_awarded = check_and_award_badges(self.user1)
        self.assertEqual(len(newly_awarded), 0)
        
        # Count should still be 1
        final_count = UserBadges.objects.filter(user=self.user1, badge=self.plastic_bronze).count()
        self.assertEqual(initial_count, final_count)
    
    def test_award_total_waste_badge(self):
        """Test awarding badge based on total waste across all types"""
        UserWastes.objects.create(user=self.user1, waste=self.plastic, amount=2000.0)
        UserWastes.objects.create(user=self.user1, waste=self.paper, amount=2000.0)
        UserWastes.objects.create(user=self.user1, waste=self.glass, amount=1000.0)
        
        # Should have awarded total waste bronze automatically (5000g total)
        self.assertTrue(UserBadges.objects.filter(user=self.user1, badge=self.total_bronze).exists())
    
    def test_award_contribution_badge(self):
        """Test awarding badge based on contributions (posts + tips)"""
        # Signals auto-award badges when Posts are created
        for i in range(5):
            Posts.objects.create(creator=self.user1, text=f"Post {i}", date=timezone.now())
        
        # Should have awarded contribution bronze automatically
        self.assertTrue(UserBadges.objects.filter(user=self.user1, badge=self.contrib_bronze).exists())
    
    def test_award_likes_received_badge(self):
        """Test awarding badge based on likes received"""
        # Create posts
        posts = []
        for i in range(10):
            post = Posts.objects.create(creator=self.user1, text=f"Post {i}", date=timezone.now())
            posts.append(post)
        
        # Add likes to reach threshold (10 likes needed for bronze)
        for i in range(10):
            PostLikes.objects.create(user=self.user2, post=posts[i], reaction_type='LIKE')
        
        # Should have awarded likes bronze automatically
        self.assertTrue(UserBadges.objects.filter(user=self.user1, badge=self.likes_bronze).exists())


class BadgeProgressTests(BadgeSystemTests):
    """Test badge progress tracking"""
    
    def test_progress_no_activity(self):
        """Test progress tracking with no user activity"""
        progress = get_user_progress_towards_next_badge(self.user1)
        
        # User should have 0 progress in all categories
        self.assertIsInstance(progress, dict)
    
    def test_progress_towards_next_badge(self):
        """Test progress calculation towards next badge"""
        UserWastes.objects.create(user=self.user1, waste=self.plastic, amount=2000.0)
        
        progress = get_user_progress_towards_next_badge(self.user1)
        
        # User has 2000g, next badge at 5000g
        self.assertIn('PLASTIC', progress)
        self.assertEqual(progress['PLASTIC']['current_value'], 2000.0)
        self.assertEqual(progress['PLASTIC']['required_value'], 5000.0)
        self.assertEqual(progress['PLASTIC']['percentage'], 40.0)
    
    def test_progress_all_badges_earned(self):
        """Test progress when all badges in a category are earned"""
        # Award all plastic badges
        UserBadges.objects.create(user=self.user1, badge=self.plastic_bronze)
        UserBadges.objects.create(user=self.user1, badge=self.plastic_silver)
        UserBadges.objects.create(user=self.user1, badge=self.plastic_gold)
        
        UserWastes.objects.create(user=self.user1, waste=self.plastic, amount=15000.0)
        
        progress = get_user_progress_towards_next_badge(self.user1)
        
        # Should show all earned
        if 'PLASTIC' in progress:
            self.assertEqual(progress['PLASTIC']['percentage'], 100.0)


class BadgeViewTests(BadgeSystemTests):
    """Test badge API endpoints"""
    
    def test_get_user_badges_authenticated(self):
        """Test getting badges for authenticated user"""
        # Award some badges
        UserBadges.objects.create(user=self.user1, badge=self.plastic_bronze)
        UserBadges.objects.create(user=self.user1, badge=self.total_bronze)
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('get_user_badges')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user_id'], self.user1.id)
        self.assertEqual(response.data['total_badges'], 2)
        self.assertIn('badges_by_category', response.data)
    
    def test_get_user_badges_by_id(self):
        """Test getting badges for specific user"""
        UserBadges.objects.create(user=self.user2, badge=self.plastic_bronze)
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('get_user_badges_by_id', kwargs={'user_id': self.user2.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user_id'], self.user2.id)
        self.assertEqual(response.data['total_badges'], 1)

    def test_get_user_badges_by_id_hidden_when_private(self):
        """Badges should be hidden when target user's waste stats are private."""
        self.user2.waste_stats_privacy = "private"
        self.user2.save(update_fields=["waste_stats_privacy"])
        UserBadges.objects.create(user=self.user2, badge=self.plastic_bronze)

        self.client.force_authenticate(user=self.user1)
        url = reverse('get_user_badges_by_id', kwargs={'user_id': self.user2.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user_id'], self.user2.id)
        self.assertEqual(response.data['total_badges'], 0)
        self.assertEqual(response.data['badges_by_category'], {})
    
    def test_get_user_badges_unauthenticated(self):
        """Test getting badges without authentication"""
        url = reverse('get_user_badges')
        response = self.client.get(url)
        
        # DRF returns 403 Forbidden for unauthenticated requests
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_get_badge_progress(self):
        """Test getting badge progress"""
        UserWastes.objects.create(user=self.user1, waste=self.plastic, amount=2500.0)
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('get_badge_progress')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('progress', response.data)
        self.assertEqual(response.data['user_id'], self.user1.id)
    
    def test_get_user_badge_summary(self):
        """Test getting complete badge summary"""
        UserBadges.objects.create(user=self.user1, badge=self.plastic_bronze)
        UserWastes.objects.create(user=self.user1, waste=self.plastic, amount=3000.0)
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('get_user_badge_summary')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_badges'], 1)
        self.assertIn('badges_by_category', response.data)
        self.assertIn('progress', response.data)
    
    def test_get_all_badges(self):
        """Test getting all available badges"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('get_all_badges')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('badges', response.data)
        self.assertIn('count', response.data)
        self.assertGreater(response.data['count'], 0)
    
    def test_get_all_badges_filtered_by_category(self):
        """Test getting badges filtered by category"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('get_all_badges') + '?category=PLASTIC'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)  # Bronze, Silver, Gold
        for badge in response.data['badges']:
            self.assertEqual(badge['category'], 'PLASTIC')
    
    def test_manually_check_badges(self):
        """Test manual badge checking endpoint"""
        # Create waste but don't rely on return value since signal already awarded it
        UserWastes.objects.create(user=self.user1, waste=self.plastic, amount=1000.0)
        
        # Badge should already exist from signal
        self.assertTrue(UserBadges.objects.filter(user=self.user1, badge=self.plastic_bronze).exists())
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('manually_check_badges')
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Signal already awarded it, so manual check returns 0 new badges
        self.assertEqual(response.data['newly_awarded_count'], 0)
        self.assertIn('newly_awarded_badges', response.data)
    
    def test_manually_check_badges_no_new_awards(self):
        """Test manual badge check when no new badges are earned"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('manually_check_badges')
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['newly_awarded_count'], 0)
    
    def test_get_leaderboard(self):
        """Test badge leaderboard endpoint"""
        # Give user1 more badges than user2
        UserBadges.objects.create(user=self.user1, badge=self.plastic_bronze)
        UserBadges.objects.create(user=self.user1, badge=self.plastic_silver)
        UserBadges.objects.create(user=self.user1, badge=self.total_bronze)
        UserBadges.objects.create(user=self.user2, badge=self.plastic_bronze)
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('badge_leaderboard')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('leaderboard', response.data)
        self.assertEqual(len(response.data['leaderboard']), 2)
        
        # user1 should be first (3 badges)
        self.assertEqual(response.data['leaderboard'][0]['user_id'], self.user1.id)
        self.assertEqual(response.data['leaderboard'][0]['badge_count'], 3)
        
        # user2 should be second (1 badge)
        self.assertEqual(response.data['leaderboard'][1]['user_id'], self.user2.id)
        self.assertEqual(response.data['leaderboard'][1]['badge_count'], 1)
    
    def test_get_leaderboard_excludes_zero_badges(self):
        """Test that leaderboard excludes users with no badges"""
        UserBadges.objects.create(user=self.user1, badge=self.plastic_bronze)
        # user2 has no badges
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('badge_leaderboard')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['leaderboard']), 1)
        self.assertEqual(response.data['leaderboard'][0]['user_id'], self.user1.id)


class BadgeModelTests(BadgeSystemTests):
    """Test badge models"""
    
    def test_badge_creation(self):
        """Test badge model creation"""
        badge = Badges.objects.create(
            category='PAPER',
            level=1,
            criteria_value=2000.0
        )
        
        self.assertEqual(badge.category, 'PAPER')
        self.assertEqual(badge.level, 1)
        self.assertEqual(badge.criteria_value, 2000.0)
    
    def test_badge_unique_together(self):
        """Test that category and level combination is unique"""
        Badges.objects.create(category='PAPER', level=1, criteria_value=1000.0)
        
        # Trying to create duplicate should raise error
        with self.assertRaises(Exception):
            Badges.objects.create(category='PAPER', level=1, criteria_value=2000.0)
    
    def test_user_badge_creation(self):
        """Test user badge relationship creation"""
        user_badge = UserBadges.objects.create(
            user=self.user1,
            badge=self.plastic_bronze
        )
        
        self.assertEqual(user_badge.user, self.user1)
        self.assertEqual(user_badge.badge, self.plastic_bronze)
        self.assertIsNotNone(user_badge.earned_at)
    
    def test_user_badge_unique_together(self):
        """Test that user can't earn same badge twice"""
        UserBadges.objects.create(user=self.user1, badge=self.plastic_bronze)
        
        # Trying to create duplicate should raise error
        with self.assertRaises(Exception):
            UserBadges.objects.create(user=self.user1, badge=self.plastic_bronze)
    
    def test_badge_string_representation(self):
        """Test badge string representation"""
        badge_str = str(self.plastic_bronze)
        self.assertIn('Plastic', badge_str)
        self.assertIn('Bronze', badge_str)
    
    def test_get_user_badges_by_category(self):
        """Test helper function to get badges organized by category"""
        UserBadges.objects.create(user=self.user1, badge=self.plastic_bronze)
        UserBadges.objects.create(user=self.user1, badge=self.plastic_silver)
        UserBadges.objects.create(user=self.user1, badge=self.total_bronze)
        
        badges_by_category = get_user_badges_by_category(self.user1)
        
        self.assertIn('PLASTIC', badges_by_category)
        self.assertIn('TOTAL_WASTE', badges_by_category)
        self.assertEqual(len(badges_by_category['PLASTIC']), 2)
        self.assertEqual(len(badges_by_category['TOTAL_WASTE']), 1)


class BadgeIntegrationTests(BadgeSystemTests):
    """Integration tests for badge system with signals"""
    
    def test_badge_awarded_on_waste_creation(self):
        """Test that badge is automatically awarded when waste is logged"""
        # Create waste that meets badge threshold
        UserWastes.objects.create(user=self.user1, waste=self.plastic, amount=1000.0)
        
        # Badge should be automatically awarded via signal
        self.assertTrue(UserBadges.objects.filter(user=self.user1, badge=self.plastic_bronze).exists())
    
    def test_badge_awarded_on_post_creation(self):
        """Test that contribution badge is awarded when posts are created"""
        # Create 5 posts to meet contribution threshold
        for i in range(5):
            Posts.objects.create(creator=self.user1, text=f"Post {i}", date=timezone.now())
        
        # Contribution badge should be automatically awarded
        self.assertTrue(UserBadges.objects.filter(user=self.user1, badge=self.contrib_bronze).exists())
    
    def test_multiple_users_independent_badges(self):
        """Test that multiple users can earn badges independently"""
        UserWastes.objects.create(user=self.user1, waste=self.plastic, amount=1000.0)
        UserWastes.objects.create(user=self.user2, waste=self.plastic, amount=1000.0)
        
        # Both users should have the badge
        self.assertTrue(UserBadges.objects.filter(user=self.user1, badge=self.plastic_bronze).exists())
        self.assertTrue(UserBadges.objects.filter(user=self.user2, badge=self.plastic_bronze).exists())
        
        # Each user should have exactly 1 badge
        self.assertEqual(UserBadges.objects.filter(user=self.user1).count(), 1)
        self.assertEqual(UserBadges.objects.filter(user=self.user2).count(), 1)
