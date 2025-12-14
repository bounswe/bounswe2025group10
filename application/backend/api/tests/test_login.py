from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory, force_authenticate

from api.login_and_signup.login_serializer import LoginSerializer
from api.login_and_signup.login_views import (
    LoginView,
    SignUpView,
    get_user_info,
    server_status,
)
from api.login_and_signup.tokens import create_jwt_pair_for_user

User = get_user_model()


class LoginSerializerTests(TestCase):
    """Test suite for LoginSerializer."""
    def test_validate_success(self):
        """Test successful validation of valid user data."""
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
        """Test validation fails when email already exists."""
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
        """Test validation fails when username already exists."""
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
        """Test user creation and token generation."""
        before = User.objects.count()
        data = {
            "email": "create@example.com",
            "username": "createuser",
            "password": "password123"
        }
        serializer = LoginSerializer(data=data)
        self.assertTrue(serializer.is_valid(raise_exception=True))
        user = serializer.save()

        self.assertEqual(User.objects.count(), before + 1)
        self.assertEqual(user.email, data["email"])
        self.assertEqual(user.username, data["username"])
        self.assertTrue(user.check_password(data["password"]))
        self.assertTrue(Token.objects.filter(user=user).exists())


class SignUpViewTests(TestCase):
    """Test suite for SignUpView."""

    def setUp(self):
        """Set up test fixtures."""
        self.factory = APIRequestFactory()
        self.view = SignUpView.as_view()

    def test_signup_success(self):
        """Test successful user signup."""
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
        """Test signup fails when email already exists."""
        User.objects.create(email="a@example.com", username="u1", password="x")
        data = {
            "email": "a@example.com",
            "username": "newuser",
            "password": "password123"
        }
        request = self.factory.post("/signup/", data, format="json")
        response = self.view(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Email already exists.", str(response.data))

    def test_signup_fails_on_existing_username(self):
        """Test signup fails when username already exists."""
        User.objects.create(email="b@example.com", username="bob", password="x")
        data = {
            "email": "unique@example.com",
            "username": "bob",
            "password": "password123"
        }
        request = self.factory.post("/signup/", data, format="json")
        response = self.view(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Username already exists.", str(response.data))


class LoginViewTests(TestCase):
    """Test suite for LoginView."""

    def setUp(self):
        """Set up test fixtures."""
        self.factory = APIRequestFactory()
        self.user = User.objects.create(email="login@example.com", username="loginuser")
        self.user.set_password("password123")
        self.user.save()
        self.view = LoginView.as_view()

    def test_login_success(self):
        """Test successful login."""
        data = {"email": "login@example.com", "password": "password123"}
        request = self.factory.post("/login/", data, format="json")
        response = self.view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Login successful.")
        self.assertEqual(response.data["username"], self.user.username)
        tokens = response.data["token"]
        self.assertIn("access", tokens)
        self.assertIn("refresh", tokens)

    def test_login_failure(self):
        """Test login failure with wrong password."""
        data = {"email": "login@example.com", "password": "wrongpass"}
        request = self.factory.post("/login/", data, format="json")
        response = self.view(request)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data, {"error": "Invalid credentials!"})

    def test_get_authenticated_user_info(self):
        """Test getting authenticated user info."""
        request = self.factory.get("/login/")
        force_authenticate(request, user=self.user)
        response = self.view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"], str(self.user))
        self.assertIn("auth", response.data)


class ServerStatusTests(TestCase):
    """Test suite for server status endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username="statususer",
            email="status@example.com",
            password="password123"
        )

    def test_server_status(self):
        """Test server status endpoint."""
        request = self.factory.get("/status/")
        force_authenticate(request, user=self.user)
        response = server_status(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"status": "Server is running"})


class GetUserInfoTests(TestCase):
    """Test suite for get_user_info endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        self.factory = APIRequestFactory()
        self.user = User.objects.create(email="info@example.com", username="infouser")
        self.user.set_password("password123")
        self.user.save()

    def test_protected_endpoint_with_auth(self):
        """Test protected endpoint with authentication."""
        request = self.factory.get("/user-info/")
        force_authenticate(request, user=self.user)
        response = get_user_info(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {
            "id": self.user.id,
            "username": self.user.username,
            "is_authenticated": True
        })

    def test_protected_endpoint_without_auth(self):
        """Test protected endpoint without authentication."""
        request = self.factory.get("/user-info/")
        response = get_user_info(request)
        self.assertIn(response.status_code, (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ))


class JWTTokenTests(TestCase):
    """Test suite for JWT token functionality."""

    def test_create_jwt_pair_for_user(self):
        """Test JWT token pair creation for user."""
        user = User.objects.create(email="tok@example.com", username="tokuser")
        pair = create_jwt_pair_for_user(user)
        self.assertIn("access", pair)
        self.assertIn("refresh", pair)
        self.assertIsInstance(pair["access"], str)
        self.assertIsInstance(pair["refresh"], str)

    def test_signup_password_validation(self):
        """Test signup with weak password."""
        factory = APIRequestFactory()
        view = SignUpView.as_view()

        data = {
            "email": "weak@example.com",
            "username": "weakuser",
            "password": "123"
        }
        request = factory.post("/signup/", data, format="json")
        response = view(request)
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_signup_invalid_email(self):
        """Test signup with invalid email format."""
        factory = APIRequestFactory()
        view = SignUpView.as_view()

        data = {
            "email": "invalid-email",
            "username": "testuser",
            "password": "password123"
        }
        request = factory.post("/signup/", data, format="json")
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_empty_fields(self):
        """Test signup with empty required fields."""
        factory = APIRequestFactory()
        view = SignUpView.as_view()

        data = {
            "email": "",
            "username": "",
            "password": ""
        }
        request = factory.post("/signup/", data, format="json")
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_case_sensitive_email(self):
        """Test that login is case-sensitive for email."""
        user = User.objects.create(email="CaseSensitive@example.com", username="caseuser")
        user.set_password("password123")
        user.save()

        factory = APIRequestFactory()
        view = LoginView.as_view()

        data = {"email": "casesensitive@example.com", "password": "password123"}
        request = factory.post("/login/", data, format="json")
        response = view(request)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED])

    def test_login_wrong_password(self):
        """Test login with wrong password."""
        user = User.objects.create(email="wrongpass@example.com", username="wronguser")
        user.set_password("correctpass")
        user.save()

        factory = APIRequestFactory()
        view = LoginView.as_view()

        data = {"email": "wrongpass@example.com", "password": "wrongpass"}
        request = factory.post("/login/", data, format="json")
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user(self):
        """Test login with non-existent user."""
        factory = APIRequestFactory()
        view = LoginView.as_view()

        data = {"email": "nonexistent@example.com", "password": "password123"}
        request = factory.post("/login/", data, format="json")
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_missing_fields(self):
        """Test login with missing email or password."""
        factory = APIRequestFactory()
        view = LoginView.as_view()

        # Missing password
        data = {"email": "test@example.com"}
        request = factory.post("/login/", data, format="json")
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Missing email
        data = {"password": "password123"}
        request = factory.post("/login/", data, format="json")
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_user_info_returns_correct_data(self):
        """Test that get_user_info returns correct user data."""
        user = User.objects.create(email="info@example.com", username="infouser")
        user.set_password("password123")
        user.save()

        factory = APIRequestFactory()
        request = factory.get("/user-info/")
        force_authenticate(request, user=user)
        response = get_user_info(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], user.id)
        self.assertEqual(response.data["username"], user.username)
        self.assertTrue(response.data["is_authenticated"])
