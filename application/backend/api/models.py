from django.db import models
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('isAdmin', True)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('isAdmin') is not True:
            raise ValueError('Superuser must have isAdmin=True.')
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Meta:
        db_table = 'Users'
        managed = False

    # Primary key
    id = models.AutoField(primary_key=True)

    # Override fields to match table
    email = models.EmailField(max_length=100, unique=True)
    username = models.CharField(max_length=50, unique=True)
    password = models.CharField(max_length=100)

    # Additional columns
    isAdmin = models.BooleanField(default=False, db_column='isAdmin')
    profile_id = models.IntegerField(unique=True, null=True, blank=True)
    profile_image = models.CharField(max_length=255, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)

    # Keep Django’s staff/superuser flags in sync if you need them
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.username
