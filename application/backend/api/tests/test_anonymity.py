from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from api.models import Users, Waste, UserWastes
from api.waste.waste_views import get_top_users
from api.post.post_serializer import PostSerializer
from api.comment.comment_serializer import CommentSerializer
from api.models import Posts, Comments


class AnonymityTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = Users.objects.create_user(
            username="anonuser",
            email="anonuser@example.com",
            password="pass1234",
        )
        self.viewer = Users.objects.create_user(
            username="viewer",
            email="viewer@example.com",
            password="pass1234",
        )

        self.user.is_anonymous = True
        self.user.anonymous_identifier = "anon_test_123"
        self.user.profile_image = "users/1/profile.jpg"
        self.user.save(update_fields=['is_anonymous', 'anonymous_identifier', 'profile_image'])

        self.plastic = Waste.objects.get(type='PLASTIC')

    def test_leaderboard_shows_anonymous_identifier(self):
        UserWastes.objects.create(user=self.user, waste=self.plastic, amount=1.0, date=timezone.now())
        self.user.total_points = 10
        self.user.total_co2 = 2.5
        self.user.save(update_fields=['total_points', 'total_co2'])

        request = self.factory.get('/api/waste/leaderboard/')
        response = get_top_users(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        top = response.data['data']['top_users']
        self.assertEqual(len(top), 0)

    def test_post_serializer_anonymizes_creator_username(self):
        post = Posts.objects.create(creator=self.user, text="hello", date=timezone.now())
        request = self.factory.get('/api/posts/all/')
        serializer = PostSerializer(post, context={'request': request})
        self.assertEqual(serializer.data['creator_username'], "anon_test_123")
        self.assertIsNone(serializer.data['creator_profile_image'])

    def test_comment_serializer_anonymizes_author_username(self):
        post = Posts.objects.create(creator=self.viewer, text="hello", date=timezone.now())
        comment = Comments.objects.create(post=post, author=self.user, content="c", date=timezone.now())
        request = self.factory.get(f'/api/posts/{post.id}/comments/')
        serializer = CommentSerializer(comment, context={'request': request})
        self.assertEqual(serializer.data['author_username'], "anon_test_123")
        self.assertIsNone(serializer.data['author_profile_image'])

    def test_owner_sees_real_username(self):
        post = Posts.objects.create(creator=self.user, text="hello", date=timezone.now())
        request = self.factory.get('/api/posts/all/')
        request.user = self.user
        serializer = PostSerializer(post, context={'request': request})
        self.assertEqual(serializer.data['creator_username'], "anonuser")
