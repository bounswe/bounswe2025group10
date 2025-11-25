# api/activities/tests/test_activity_signals.py
from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from django.test import override_settings

from api.models import (
    Posts, Comments, PostLikes, TipLikes, Report, UserWastes,
    UserAchievements, Achievements, Waste
)
from api.models import ActivityEvent, Visibility
from django.apps import apps

User = get_user_model()

# Optional: If you actually have this model; otherwise tests will be skipped
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
    reset_sequences = True

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.User = get_user_model()

    def setUp(self):
        ActivityEvent.objects.all().delete()

    # ---------------------------
    # Users
    # ---------------------------

    def test_user_create_logs_register(self):
        u = self.User.objects.create_user(email="u1@example.com", password="pw", username="u1")
        ev = latest_event_for(object_type="Person", object_id=str(u.pk))
        self.assertIsNotNone(ev, "Expected Create event for user create")
        self.assertEqual(ev.type, "Create")
        self.assertEqual(ev.actor_id, "u1")
        self.assertEqual(ev.visibility, Visibility.PUBLIC)

    def test_user_delete_logs_delete(self):
        u = self.User.objects.create_user(email="u3@example.com", password="pw", username="u3")
        pk = u.pk
        u.delete()
        ev = latest_event_for(object_type="Person", object_id=str(pk))
        self.assertIsNotNone(ev, "Expected Delete event for user delete")
        self.assertEqual(ev.type, "Undo")   # Delete (not Undo)

    # ---------------------------
    # Posts
    # ---------------------------

    def test_post_create_delete(self):
        author = self.User.objects.create_user(email="p1@example.com", password="pw", username="p1")
        post = Posts.objects.create(creator=author, text="first post", date=timezone.now())

        ev_create = latest_event_for(object_type="Note", object_id=str(post.pk))
        self.assertIsNotNone(ev_create, "Expected Create event for post create")
        self.assertEqual(ev_create.type, "Create")

        pk = post.pk
        post.delete()
        ev_delete = latest_event_for(object_type="Note", object_id=str(pk))
        self.assertIsNotNone(ev_delete, "Expected Delete event for post delete")
        self.assertEqual(ev_delete.type, "Undo")  # Delete (not Undo)

    # ---------------------------
    # Comments
    # ---------------------------

    def test_comment_create_delete(self):
        user = self.User.objects.create_user(email="c1@example.com", password="pw", username="c1")
        post = Posts.objects.create(creator=user, text="host", date=timezone.now())
        com = Comments.objects.create(post=post, author=user, content="hi", date=timezone.now())

        ev_create = latest_event_for(object_type="Comment", object_id=str(com.pk))
        self.assertIsNotNone(ev_create, "Expected Create event for comment create")
        self.assertEqual(ev_create.type, "Create")

        pk = com.pk
        com.delete()
        ev_delete = latest_event_for(object_type="Comment", object_id=str(pk))
        self.assertIsNotNone(ev_delete, "Expected Delete event for comment delete")
        self.assertEqual(ev_delete.type, "Undo")  # Delete (not Undo)

    # ---------------------------
    # PostLikes (Like / Undo)
    # ---------------------------

    def test_post_like_create_undo(self):
        user = self.User.objects.create_user(email="l1@example.com", password="pw", username="l1")
        post = Posts.objects.create(creator=user, text="like host", date=timezone.now())
        like = PostLikes.objects.create(user=user, post=post, reaction_type="LIKE")

        ev_like = latest_event_for(object_type="Like", object_id=str(like.pk))
        self.assertIsNotNone(ev_like, "Expected Like event for post like create")
        self.assertEqual(ev_like.type, "Like")

        pk = like.pk
        like.delete()
        ev_undo = latest_event_for(object_type="Like", object_id=str(pk))
        self.assertIsNotNone(ev_undo, "Expected Undo event for post like delete")
        self.assertEqual(ev_undo.type, "Undo")  # fixed: .type, not .activity_type

    # ---------------------------
    # TipLikes (Like / Undo)
    # ---------------------------

    def test_tip_like_create_undo(self):
        user = self.User.objects.create_user(email="t1@example.com", password="pw", username="t1")
        from api.models import Tips
        tip = Tips.objects.create(title="be green", text="tip text")
        tl = TipLikes.objects.create(user=user, tip=tip, reaction_type="LIKE")

        print(list(ActivityEvent.objects.values("type","object_type","object_id","summary")))

        ev_like = latest_event_for(object_type="Like", object_id=str(tl.pk))
        self.assertIsNotNone(ev_like, "Expected Like event for tip like create")
        self.assertEqual(ev_like.type, "Like")

        pk = tl.pk
        tl.delete()

        ev_undo = latest_event_for(object_type="Like", object_id=str(pk))

        self.assertIsNotNone(ev_undo, "Expected Undo event for tip like delete")
        self.assertEqual(ev_undo.type, "Undo")

    # ---------------------------
    # Report
    # ---------------------------

    def test_report_create_delete(self):
        user = self.User.objects.create_user(email="r1@example.com", password="pw", username="r1")
        post = Posts.objects.create(creator=user, text="to report", date=timezone.now())

        from django.contrib.contenttypes.models import ContentType
        ct = ContentType.objects.get_for_model(Posts)
        rep = Report.objects.create(
            reporter=user, reason="SPAM", description="x",
            content_type=ct, object_id=post.pk
        )

        ev_create = latest_event_for(object_type="Report", object_id=str(rep.pk))
        self.assertIsNotNone(ev_create, "Expected Create event for report create")
        self.assertEqual(ev_create.type, "Create")

        pk = rep.pk
        rep.delete()
        ev_delete = latest_event_for(object_type="Report", object_id=str(pk))
        self.assertIsNotNone(ev_delete, "Expected Delete event for report delete")
        self.assertEqual(ev_delete.type, "Undo")  # Delete (not Undo)

    # ---------------------------
    # UserWastes
    # ---------------------------

    def test_user_waste_create_delete(self):
        user = self.User.objects.create_user(email="w1@example.com", password="pw", username="w1")
        waste = Waste.objects.create(type="PLASTIC")
        uw = UserWastes.objects.create(user=user, waste=waste, amount=3.5, date=timezone.now())

        ev_create = latest_event_for(object_type="UserWaste", object_id=str(uw.pk))
        self.assertIsNotNone(ev_create, "Expected Create event for waste create")
        self.assertEqual(ev_create.type, "Create")

        pk = uw.pk
        uw.delete()
        ev_delete = latest_event_for(object_type="UserWaste", object_id=str(pk))
        self.assertIsNotNone(ev_delete, "Expected Delete event for waste delete")
        self.assertEqual(ev_delete.type, "Undo")  # Delete (not Undo)

    # ---------------------------
    # UserAchievements
    # ---------------------------

    def test_user_achievement_create_delete(self):
        user = self.User.objects.create_user(email="a1@example.com", password="pw", username="a1")
        ach = Achievements.objects.create(title="Starter", description="first badge")
        ua = UserAchievements.objects.create(user=user, achievement=ach, earned_at=timezone.now())

        ev_create = latest_event_for(object_type="UserAchievement", object_id=str(ua.pk))
        self.assertIsNotNone(ev_create, "Expected Create event for user achievement create")
        self.assertEqual(ev_create.type, "Create")

        pk = ua.pk
        ua.delete()
        ev_delete = latest_event_for(object_type="UserAchievement", object_id=str(pk))
        self.assertIsNotNone(ev_delete, "Expected Delete event for user achievement delete")
        self.assertEqual(ev_delete.type, "Undo")  # Delete (not Undo)

    # ---------------------------
    # UserChallenge (optional)
    # ---------------------------

    def test_user_challenge_create_update_delete(self):
        user = self.User.objects.create_user(email="uc1@example.com", password="pw", username="uc1")

        # Create an achievement to attach as reward
        reward = Achievements.objects.create(title="Eco Master", description="Award for challenge completion")

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
        uc = UserChallenge.objects.create(
            user=user,
            challenge=challenge,
            joined_date=timezone.now()
        )

        # Verify Challenge creation signal (if wired)
        ev_create = latest_event_for(object_type="UserChallenge", object_id=str(uc.pk))
        self.assertIsNotNone(ev_create)
        self.assertEqual(ev_create.type, "Create")

        # Delete the UserChallenge
        pk = uc.pk
        uc.delete()

        print(list(ActivityEvent.objects.values("type","object_type","object_id","summary")))

        ev_delete = latest_event_for(object_type="UserChallenge")
        self.assertIsNotNone(ev_delete)
        self.assertEqual(ev_delete.type, "Undo")