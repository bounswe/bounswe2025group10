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


class Users(AbstractUser):
    # Remove fields that are already in AbstractUser
    email = models.EmailField(max_length=100, unique=True)
    username = models.CharField(max_length=50, unique=True)
    
    # Custom fields
    isAdmin = models.BooleanField(default=False, db_column='isAdmin')
    profile_id = models.IntegerField(unique=True, null=True, blank=True)
    profile_image = models.CharField(max_length=255, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'Users'
    def __str__(self):
        return self.username


class Achievements(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'Achievements'


class Challenges(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    target_amount = models.FloatField(blank=True, null=True)
    current_progress = models.FloatField(blank=True, null=True)
    is_public = models.IntegerField(blank=True, null=True)
    reward = models.ForeignKey(Achievements, models.DO_NOTHING, blank=True, null=True)

    class Meta:
        db_table = 'Challenges'


class Comments(models.Model):
    post = models.ForeignKey('Posts', models.DO_NOTHING)
    author = models.ForeignKey('Users', models.DO_NOTHING)
    content = models.TextField()
    date = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'Comments'


class Posts(models.Model):
    creator = models.ForeignKey('Users', models.DO_NOTHING)
    date = models.DateTimeField(blank=True, null=True)
    text = models.TextField(blank=True, null=True)
    image = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'Posts'


class Tips(models.Model):
    text = models.TextField()
    like_count = models.IntegerField(blank=True, null=True)
    dislike_count = models.IntegerField(blank=True, null=True)

    class Meta:
        db_table = 'Tips'


class UserAchievements(models.Model):
    user = models.ForeignKey('Users', models.DO_NOTHING)
    achievement = models.ForeignKey(Achievements, models.DO_NOTHING)
    earned_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'UserAchievements'
        unique_together = (('user', 'achievement'),) # these two together becomes primary key


class UserChallenges(models.Model):
    user = models.ForeignKey('Users', models.DO_NOTHING)
    challenge = models.ForeignKey(Challenges, models.DO_NOTHING)
    joined_date = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'UserChallenges'
        unique_together = (('user', 'challenge'),) # these two together becomes primary key
