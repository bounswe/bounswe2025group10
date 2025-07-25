from django.db import models
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.conf import settings

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

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
    class Meta:
        db_table = 'Users'

    # Primary key
    id = models.AutoField(primary_key=True)
    email = models.EmailField(max_length=100, unique=True)
    username = models.CharField(max_length=50, unique=True)
    password = models.CharField(max_length=100)

    # Additional columns
    isAdmin = models.BooleanField(default=False, db_column='isAdmin')
    profile_id = models.IntegerField(unique=True, null=True, blank=True)
    profile_image = models.CharField(max_length=255, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    total_points = models.FloatField(default=0)
    total_co2 = models.FloatField(default=0)

    # Keep Django’s staff/superuser flags in sync if you need them
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    @property
    def profile_image_url(self):
        """
        Returns the full URL for the profile image if it exists.
        If the image is already a full URL, returns it as is.
        If it's a relative path, prepends the MEDIA_URL.
        """
        if not self.profile_image:
            return None
        if self.profile_image.startswith(('http://', 'https://')):
            return self.profile_image
        return f"{settings.MEDIA_URL}{self.profile_image}"

    def __str__(self):
        return self.username

class Achievements(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'Achievements'


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
    image = models.CharField(max_length=255, blank=True, null=True)  # Store relative path to image
    like_count = models.IntegerField(blank=True, null=True, default=0)
    dislike_count = models.IntegerField(blank=True, null=True, default=0)

    @property
    def image_url(self):
        """
        Returns the full URL for the post image if it exists.
        If the image is already a full URL, returns it as is.
        If it's a relative path, prepends the MEDIA_URL.
        """
        if not self.image:
            return None
        if self.image.startswith(('http://', 'https://')):
            return self.image
        return f"{settings.MEDIA_URL}{self.image}"

    class Meta:
        db_table = 'Posts'


class Tips(models.Model):
    title = models.CharField(max_length=255, default = "")
    text = models.TextField()
    like_count = models.IntegerField(blank=True, null=True, default=0)
    dislike_count = models.IntegerField(blank=True, null=True, default=0)

    class Meta:
        db_table = 'Tips'


class UserAchievements(models.Model):
    user = models.ForeignKey('Users', models.DO_NOTHING)
    achievement = models.ForeignKey(Achievements, models.DO_NOTHING)
    earned_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'UserAchievements'
        unique_together = (('user', 'achievement'),) # these two together becomes primary key

class Waste(models.Model):
    WASTE_TYPES = [
        ('PLASTIC', 'Plastic'),
        ('PAPER', 'Paper'),
        ('GLASS', 'Glass'),
        ('METAL', 'Metal'),
    ]
    type = models.CharField(
        max_length=50,
        choices=WASTE_TYPES,
        blank=False,
        null=False
    )

    class Meta:
        db_table = 'Waste'

    def __str__(self):
        return self.type

class UserWastes(models.Model):
    user = models.ForeignKey('Users', on_delete=models.CASCADE)
    waste = models.ForeignKey(Waste, on_delete=models.PROTECT)
    amount = models.FloatField(blank=False, null=False)
    date = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'UserWastes'
        ordering = ['-date']

class PostLikes(models.Model):
    REACTION_CHOICES = [
        ('LIKE', 'Like'),
        ('DISLIKE', 'Dislike'),
    ]
    
    user = models.ForeignKey('Users', on_delete=models.CASCADE)
    post = models.ForeignKey('Posts', on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=10, choices=REACTION_CHOICES)
    date = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'PostLikes'
        unique_together = (('user', 'post'),)  # Prevent multiple reactions from the same user on the same post

class SavedPosts(models.Model):
    user = models.ForeignKey('Users', on_delete=models.CASCADE)
    post = models.ForeignKey('Posts', on_delete=models.CASCADE)
    date_saved = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'SavedPosts'
        unique_together = (('user', 'post'),)  # Prevent saving the same post multiple times
        
# Report logs for all kinds of media and users
class Report(models.Model):
    REPORT_REASON_CHOICES = [
        ('SPAM', 'Spam'),
        ('INAPPROPRIATE', 'Inappropriate'),
        ('OTHER', 'Other'),
    ]

    reporter = models.ForeignKey('Users', on_delete=models.CASCADE)
    reason = models.CharField(max_length=50, choices=REPORT_REASON_CHOICES)
    description = models.TextField(blank=True, null=True)
    date_reported = models.DateTimeField(default=timezone.now)

    # Generic foreign key fields
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        db_table = 'Reports'


class TipLikes(models.Model):
    REACTION_CHOICES = [
        ('LIKE', 'Like'),
        ('DISLIKE', 'Dislike'),
    ]
    
    user = models.ForeignKey('Users', on_delete=models.CASCADE)
    tip = models.ForeignKey('Tips', on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=10, choices=REACTION_CHOICES)
    date = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'TipLikes'
        unique_together = (('user', 'tip'),)  