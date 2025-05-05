from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.authtoken.models import Token
from rest_framework.test import APIRequestFactory, force_authenticate

from application.backend.api.login_and_signup.login_serializer import LoginSerializer
from application.backend.api.login_and_signup.login_views import (
    SignUpView, LoginView, server_status, get_user_info
)
from application.backend.api.login_and_signup.tokens import create_jwt_pair_for_user

User = get_user_model()


class LoginSerializerTests(TestCase):
    def test_validate_success(self):
        data = {
            "email": "new@example.com",
            "username": "newuser",
            "password": "password123"
        }
        serializer = LoginSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        validated = serializer.validated_data
        self.assertEqual(validated["email"], data["email"])
        self.assertEqual(validated["username"], data["username"])

    def test_validate_email_exists(self):
        User.objects.create(email="exists@example.com", username="u1", password="x")
        data = {
            "email": "exists@example.com",
            "username": "otheruser",
            "password": "password123"
        }
        serializer = LoginSerializer(data=data)
        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_validate_username_exists(self):
        User.objects.create(email="u2@example.com", username="existsuser", password="x")
        data = {
            "email": "unique@example.com",
            "username": "existsuser",
            "password": "password123"
        }
        serializer = LoginSerializer(data=data)
        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_create_user_and_token(self):
        before = User.objects.count()
        data = {
            "email": "create@example.com",
            "username": "createuser",
            "password": "password123"
        }
        serializer = LoginSerializer(data=data)
        self.assertTrue(serializer.is_valid(raise_exception=True))
        user = serializer.save()
        # user created
        self.assertEqual(User.objects.count(), before + 1)
        self.assertEqual(user.email, data["email"])
        self.assertEqual(user.username, data["username"])
        # password is hashed
        self.assertTrue(user.check_password(data["password"]))
        # authtoken created
        self.assertTrue(Token.objects.filter(user=user).exists())


class SignUpViewTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = SignUpView.as_view()

    def test_signup_success(self):
        data = {
            "email": "signup@example.com",
            "username": "signupuser",
            "password": "password123"
        }
        req = self.factory.post("/signup/", data, format="json")
        resp = self.view(req)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["message"], "User created successfully.")
        self.assertEqual(resp.data["data"]["email"], data["email"])
        self.assertEqual(resp.data["data"]["username"], data["username"])

    def test_signup_fails_on_existing_email(self):
        User.objects.create(email="a@example.com", username="u1", password="x")
        data = {
            "email": "a@example.com",
            "username": "newuser",
            "password": "password123"
        }
        req = self.factory.post("/signup/", data, format="json")
        resp = self.view(req)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        # error comes back under non_field_errors
        self.assertIn("Email already exists.", str(resp.data))

    def test_signup_fails_on_existing_username(self):
        User.objects.create(email="b@example.com", username="bob", password="x")
        data = {
            "email": "unique@example.com",
            "username": "bob",
            "password": "password123"
        }
        req = self.factory.post("/signup/", data, format="json")
        resp = self.view(req)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Username already exists.", str(resp.data))


class LoginViewTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        # create user and set password
        self.user = User.objects.create(email="login@example.com", username="loginuser")
        self.user.set_password("password123")
        self.user.save()
        self.view = LoginView.as_view()

    def test_login_success(self):
        data = {"email": "login@example.com", "password": "password123"}
        req = self.factory.post("/login/", data, format="json")
        resp = self.view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["message"], "Login successful.")
        tokens = resp.data["token"]
        self.assertIn("access", tokens)
        self.assertIn("refresh", tokens)

    def test_login_failure(self):
        data = {"email": "login@example.com", "password": "wrongpass"}
        req = self.factory.post("/login/", data, format="json")
        resp = self.view(req)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(resp.data, {"error": "Invalid credentials!"})

    def test_get_authenticated_user_info(self):
        req = self.factory.get("/login/")
        # simulate DRF authentication
        force_authenticate(req, user=self.user)
        resp = self.view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["user"], str(self.user))
        # when using force_authenticate without token, auth is None
        self.assertIn("auth", resp.data)


class ServerStatusTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_server_status(self):
        req = self.factory.get("/status/")
        resp = server_status(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data, {"status": "Server is running"})


class GetUserInfoTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create(email="info@example.com", username="infouser")
        self.user.set_password("password123")
        self.user.save()

    def test_protected_endpoint_with_auth(self):
        req = self.factory.get("/user-info/")
        force_authenticate(req, user=self.user)
        resp = get_user_info(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data, {
            "username": self.user.username,
            "is_authenticated": True
        })

    def test_protected_endpoint_without_auth(self):
        req = self.factory.get("/user-info/")
        resp = get_user_info(req)
        # either 401 or 403 depending on your authentication setup
        self.assertIn(resp.status_code, (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ))


class JWTTokenTests(TestCase):
    def test_create_jwt_pair_for_user(self):
        user = User.objects.create(email="tok@example.com", username="tokuser")
        pair = create_jwt_pair_for_user(user)
        self.assertIn("access", pair)
        self.assertIn("refresh", pair)
        self.assertIsInstance(pair["access"], str)
        self.assertIsInstance(pair["refresh"], str)
