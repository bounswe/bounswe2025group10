from django.apps import apps
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase, override_settings
from django.utils import timezone

from api.models import (
    Achievements,
    ActivityEvent,
    Comments,
    Posts,
    PostLikes,
    Report,
    TipLikes,
    UserAchievements,
    UserWastes,
    Visibility,
    Waste,
)

User = get_user_model()

# Optional: If you actually have this model; otherwise tests will be skipped
UserChallenge = apps.get_model('challenges', 'UserChallenge') if apps.is_installed('challenges') else None
Challenge = apps.get_model('challenges', 'Challenge') if apps.is_installed('challenges') else None


def latest_event_for(**filters) -> ActivityEvent | None:
    """Return the most recent ActivityEvent instance matching filters."""
    return (
        ActivityEvent.objects
        .filter(**filters)
        .order_by("-published_at")
        .first()
    )


@override_settings(AUTH_USER_MODEL="api.Users")
class ActivitySignalTests(TransactionTestCase):
    """Test suite for activity signals."""

    reset_sequences = True

    @classmethod
    def setUpClass(cls):
        """Set up test class."""
        super().setUpClass()
        cls.User = get_user_model()

    def setUp(self):
        """Set up test fixtures."""
        ActivityEvent.objects.all().delete()

    def test_user_create_logs_register(self):
        """Test that user creation logs a Create event."""
        user = self.User.objects.create_user(email="u1@example.com", password="pw", username="u1")
        event = latest_event_for(object_type="Person", object_id=str(user.pk))
        self.assertIsNotNone(event, "Expected Create event for user create")
        self.assertEqual(event.type, "create-user")
        self.assertEqual(event.actor_id, "u1")
        self.assertEqual(event.visibility, Visibility.PUBLIC)

    def test_user_delete_logs_delete(self):
        """Test that user deletion logs an Undo event."""
        user = self.User.objects.create_user(email="u3@example.com", password="pw", username="u3")
        pk = user.pk
        user.delete()
        event = latest_event_for(object_type="Person", object_id=str(pk))
        self.assertIsNotNone(event, "Expected Delete event for user delete")
        self.assertEqual(event.type, "delete-user")

    def test_post_create_delete(self):
        """Test that post creation and deletion log appropriate events."""
        author = self.User.objects.create_user(email="p1@example.com", password="pw", username="p1")
        post = Posts.objects.create(creator=author, text="first post", date=timezone.now())

        ev_create = latest_event_for(object_type="Note", object_id=str(post.pk))
        self.assertIsNotNone(ev_create, "Expected Create event for post create")
        self.assertEqual(ev_create.type, "create-post")

        pk = post.pk
        post.delete()
        ev_delete = latest_event_for(object_type="Note", object_id=str(pk))
        self.assertIsNotNone(ev_delete, "Expected Delete event for post delete")
        self.assertEqual(ev_delete.type, "delete-post")

    def test_comment_create_delete(self):
        """Test that comment creation and deletion log appropriate events."""
        user = self.User.objects.create_user(email="c1@example.com", password="pw", username="c1")
        post = Posts.objects.create(creator=user, text="host", date=timezone.now())
        comment = Comments.objects.create(post=post, author=user, content="hi", date=timezone.now())

        ev_create = latest_event_for(object_type="Comment", object_id=str(comment.pk))
        self.assertIsNotNone(ev_create, "Expected Create event for comment create")
        self.assertEqual(ev_create.type, "create-comment")

        pk = comment.pk
        comment.delete()
        ev_delete = latest_event_for(object_type="Comment", object_id=str(pk))
        self.assertIsNotNone(ev_delete, "Expected Delete event for comment delete")
        self.assertEqual(ev_delete.type, "delete-comment")

    def test_post_like_create_undo(self):
        """Test that post like creation and deletion log appropriate events."""
        user = self.User.objects.create_user(email="l1@example.com", password="pw", username="l1")
        post = Posts.objects.create(creator=user, text="like host", date=timezone.now())
        like = PostLikes.objects.create(user=user, post=post, reaction_type="LIKE")

        ev_like = latest_event_for(object_type="PostLike", object_id=str(like.pk))
        self.assertIsNotNone(ev_like, "Expected Like event for post like create")
        self.assertEqual(ev_like.type, "like-post")

        pk = like.pk
        like.delete()
        ev_undo = latest_event_for(object_type="PostLike", object_id=str(pk))
        self.assertIsNotNone(ev_undo, "Expected Undo event for post like delete")
        self.assertEqual(ev_undo.type, "delete-post")

    def test_tip_like_create_undo(self):
        """Test that tip like creation and deletion log appropriate events."""
        from api.models import Tips

        user = self.User.objects.create_user(email="t1@example.com", password="pw", username="t1")
        tip = Tips.objects.create(title="be green", text="tip text")
        tip_like = TipLikes.objects.create(user=user, tip=tip, reaction_type="LIKE")

        ev_like = latest_event_for(object_type="TipLike", object_id=str(tip_like.pk))
        self.assertIsNotNone(ev_like, "Expected Like event for tip like create")
        self.assertEqual(ev_like.type, "like-tip")

        pk = tip_like.pk
        tip_like.delete()

        ev_undo = latest_event_for(object_type="TipLike", object_id=str(pk))
        self.assertIsNotNone(ev_undo, "Expected Undo event for tip like delete")
        self.assertEqual(ev_undo.type, "delete-tip")

    def test_report_create_delete(self):
        """Test that report creation and deletion log appropriate events."""
        from django.contrib.contenttypes.models import ContentType

        user = self.User.objects.create_user(email="r1@example.com", password="pw", username="r1")
        post = Posts.objects.create(creator=user, text="to report", date=timezone.now())

        content_type = ContentType.objects.get_for_model(Posts)
        report = Report.objects.create(
            reporter=user,
            reason="SPAM",
            description="x",
            content_type=content_type,
            object_id=post.pk
        )

        ev_create = latest_event_for(object_type="Report", object_id=str(report.pk))
        self.assertIsNotNone(ev_create, "Expected Create event for report create")
        self.assertEqual(ev_create.type, "create-report")

        pk = report.pk
        report.delete()
        ev_delete = latest_event_for(object_type="Report", object_id=str(pk))
        self.assertIsNotNone(ev_delete, "Expected Delete event for report delete")
        self.assertEqual(ev_delete.type, "delete-report")

    def test_user_waste_create_delete(self):
        """Test that user waste creation and deletion log appropriate events."""
        user = self.User.objects.create_user(email="w1@example.com", password="pw", username="w1")
        waste = Waste.objects.create(type="PLASTIC")
        user_waste = UserWastes.objects.create(user=user, waste=waste, amount=3.5, date=timezone.now())

        ev_create = latest_event_for(object_type="UserWaste", object_id=str(user_waste.pk))
        self.assertIsNotNone(ev_create, "Expected Create event for waste create")
        self.assertEqual(ev_create.type, "create-waste")

        pk = user_waste.pk
        user_waste.delete()
        ev_delete = latest_event_for(object_type="UserWaste", object_id=str(pk))
        self.assertIsNotNone(ev_delete, "Expected Delete event for waste delete")
        self.assertEqual(ev_delete.type, "delete-waste")

    def test_user_achievement_create_delete(self):
        """Test that user achievement creation and deletion log appropriate events."""
        user = self.User.objects.create_user(email="a1@example.com", password="pw", username="a1")
        achievement = Achievements.objects.create(title="Starter", description="first badge")
        user_achievement = UserAchievements.objects.create(
            user=user,
            achievement=achievement,
            earned_at=timezone.now()
        )

        ev_create = latest_event_for(object_type="UserAchievement", object_id=str(user_achievement.pk))
        self.assertIsNotNone(ev_create, "Expected Create event for user achievement create")
        self.assertEqual(ev_create.type, "create-achievement")

        pk = user_achievement.pk
        user_achievement.delete()
        ev_delete = latest_event_for(object_type="UserAchievement", object_id=str(pk))
        self.assertIsNotNone(ev_delete, "Expected Delete event for user achievement delete")
        self.assertEqual(ev_delete.type, "delete-achievement")

    def test_user_waste_and_achievement_not_logged_when_anonymous(self):
        user = self.User.objects.create_user(email="pa1@example.com", password="pw", username="pa1")
        user.is_anonymous = True
        user.save(update_fields=["is_anonymous"])

        waste = Waste.objects.create(type="PLASTIC")
        user_waste = UserWastes.objects.create(user=user, waste=waste, amount=1.0, date=timezone.now())
        ev_waste = latest_event_for(object_type="UserWaste", object_id=str(user_waste.pk))
        self.assertIsNone(ev_waste, "Did not expect waste event for anonymous user")

        achievement = Achievements.objects.create(title="A", description="B")
        user_achievement = UserAchievements.objects.create(user=user, achievement=achievement, earned_at=timezone.now())
        ev_ach = latest_event_for(object_type="UserAchievement", object_id=str(user_achievement.pk))
        self.assertIsNone(ev_ach, "Did not expect achievement event for anonymous user")

    def test_user_waste_and_achievement_not_logged_when_waste_stats_private(self):
        user = self.User.objects.create_user(email="pp1@example.com", password="pw", username="pp1")
        user.waste_stats_privacy = "private"
        user.save(update_fields=["waste_stats_privacy"])

        waste = Waste.objects.create(type="PLASTIC")
        user_waste = UserWastes.objects.create(user=user, waste=waste, amount=1.0, date=timezone.now())
        ev_waste = latest_event_for(object_type="UserWaste", object_id=str(user_waste.pk))
        self.assertIsNone(ev_waste, "Did not expect waste event for private waste stats")

        achievement = Achievements.objects.create(title="A2", description="B2")
        user_achievement = UserAchievements.objects.create(user=user, achievement=achievement, earned_at=timezone.now())
        ev_ach = latest_event_for(object_type="UserAchievement", object_id=str(user_achievement.pk))
        self.assertIsNone(ev_ach, "Did not expect achievement event for private waste stats")

    def test_user_challenge_create_update_delete(self):
        """Test that user challenge creation and deletion log appropriate events."""
        if UserChallenge is None or Challenge is None:
            self.skipTest("Challenges app not installed")

        user = self.User.objects.create_user(email="uc1@example.com", password="pw", username="uc1")

        # Create an achievement to attach as reward
        reward = Achievements.objects.create(
            title="Eco Master",
            description="Award for challenge completion"
        )

        # Create the Challenge object
        challenge = Challenge.objects.create(
            title="30-Day Recycling Challenge",
            description="Recycle plastic every day for 30 days.",
            target_amount=30,
            current_progress=0,
            is_public=True,
            reward=reward,
            creator=user
        )

        # User joins the challenge
        user_challenge = UserChallenge.objects.create(
            user=user,
            challenge=challenge,
            joined_date=timezone.now()
        )

        # Verify Challenge creation signal
        ev_create = latest_event_for(object_type="UserChallenge", object_id=str(user_challenge.pk))
        self.assertIsNotNone(ev_create)
        self.assertEqual(ev_create.type, "create-challenge")

        # Delete the UserChallenge
        pk = user_challenge.pk
        user_challenge.delete()

        ev_delete = latest_event_for(object_type="UserChallenge")
        self.assertIsNotNone(ev_delete)
        self.assertEqual(ev_delete.type, "delete-challenge")
