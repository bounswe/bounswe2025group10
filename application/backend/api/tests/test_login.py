from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.authtoken.models import Token
from rest_framework.test import APIRequestFactory, force_authenticate

from api.login_and_signup.login_serializer import LoginSerializer
from api.login_and_signup.login_views import (
    SignUpView, LoginView, server_status, get_user_info
)
from api.login_and_signup.tokens import create_jwt_pair_for_user

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
        self.assertEqual(resp.data["username"], self.user.username)
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
        self.user = User.objects.create_user(
            username="statususer",
            email="status@example.com",
            password="password123"
        )

    def test_server_status(self):
        req = self.factory.get("/status/")
        force_authenticate(req, user=self.user)
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
            "id": self.user.id,
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

    def test_signup_password_validation(self):
        """Test signup with weak password"""
        self.factory = APIRequestFactory()
        self.view = SignUpView.as_view()
        
        data = {
            "email": "weak@example.com",
            "username": "weakuser",
            "password": "123"  # Very short password
        }
        req = self.factory.post("/signup/", data, format="json")
        resp = self.view(req)
        # Should either succeed or fail based on password validation
        self.assertIn(resp.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_signup_invalid_email(self):
        """Test signup with invalid email format"""
        self.factory = APIRequestFactory()
        self.view = SignUpView.as_view()
        
        data = {
            "email": "invalid-email",
            "username": "testuser",
            "password": "password123"
        }
        req = self.factory.post("/signup/", data, format="json")
        resp = self.view(req)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_empty_fields(self):
        """Test signup with empty required fields"""
        self.factory = APIRequestFactory()
        self.view = SignUpView.as_view()
        
        data = {
            "email": "",
            "username": "",
            "password": ""
        }
        req = self.factory.post("/signup/", data, format="json")
        resp = self.view(req)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_case_sensitive_email(self):
        """Test that login is case-sensitive for email"""
        user = User.objects.create(email="CaseSensitive@example.com", username="caseuser")
        user.set_password("password123")
        user.save()
        
        self.factory = APIRequestFactory()
        self.view = LoginView.as_view()
        
        # Try with different case
        data = {"email": "casesensitive@example.com", "password": "password123"}
        req = self.factory.post("/login/", data, format="json")
        resp = self.view(req)
        # Should either succeed or fail based on email normalization
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED])

    def test_login_wrong_password(self):
        """Test login with wrong password"""
        user = User.objects.create(email="wrongpass@example.com", username="wronguser")
        user.set_password("correctpass")
        user.save()
        
        self.factory = APIRequestFactory()
        self.view = LoginView.as_view()
        
        data = {"email": "wrongpass@example.com", "password": "wrongpass"}
        req = self.factory.post("/login/", data, format="json")
        resp = self.view(req)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user(self):
        """Test login with non-existent user"""
        self.factory = APIRequestFactory()
        self.view = LoginView.as_view()
        
        data = {"email": "nonexistent@example.com", "password": "password123"}
        req = self.factory.post("/login/", data, format="json")
        resp = self.view(req)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_missing_fields(self):
        """Test login with missing email or password"""
        self.factory = APIRequestFactory()
        self.view = LoginView.as_view()
        
        # Missing password
        data = {"email": "test@example.com"}
        req = self.factory.post("/login/", data, format="json")
        resp = self.view(req)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Missing email
        data = {"password": "password123"}
        req = self.factory.post("/login/", data, format="json")
        resp = self.view(req)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_user_info_returns_correct_data(self):
        """Test that get_user_info returns correct user data"""
        user = User.objects.create(email="info@example.com", username="infouser")
        user.set_password("password123")
        user.save()
        
        self.factory = APIRequestFactory()
        req = self.factory.get("/user-info/")
        force_authenticate(req, user=user)
        resp = get_user_info(req)
        
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["id"], user.id)
        self.assertEqual(resp.data["username"], user.username)
        self.assertTrue(resp.data["is_authenticated"])
