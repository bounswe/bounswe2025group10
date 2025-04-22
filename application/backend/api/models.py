# Import necessary Django modules
from django.db import models
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser


# Custom user manager for handling user creation
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password, **extra_fields):
        # Normalize email address
        email = self.normalize_email(email)

        # Create new user instance
        user = self.model(email=email, **extra_fields)

        # Set password and save user
        user.set_password(password)
        user.save()

        return user
    
    def create_superuser(self, email, password, **extra_fields):
        # Set superuser privileges
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        # Validate superuser privileges
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email=email, password=password, **extra_fields)
        
# Custom user model
class User(AbstractUser):
    class Meta:
        db_table = 'Users'
        managed = False
    # Custom fields
    email = models.EmailField(max_length=80, unique=True)
    username = models.CharField(max_length=50, unique=True)

    # Set custom manager
    objects = CustomUserManager()
    
    # Use email as the unique identifier
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.username
