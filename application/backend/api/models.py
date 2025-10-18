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


# activity model from .activities.models.activity_model import ActivityEvent, Visibility
# activities/models.py
import uuid
from copy import deepcopy


class Visibility(models.TextChoices):
    PUBLIC = "public", "Public"
    UNLISTED = "unlisted", "Unlisted"
    FOLLOWERS = "followers", "Followers"
    DIRECT = "direct", "Direct"

def _deep_merge(a: dict, b: dict) -> dict:
    """Non-destructive deep merge: values in b override/extend a."""
    out = deepcopy(a) if a else {}
    for k, v in (b or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out

class ActivityEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    as2_json = models.JSONField()

    actor_id = models.CharField(max_length=255, db_index=True)
    type = models.CharField(max_length=64, db_index=True)
    object_type = models.CharField(max_length=64, db_index=True)
    object_id = models.CharField(max_length=255, db_index=True)
    community_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)

    published_at = models.DateTimeField(default=timezone.now, db_index=True)

    visibility = models.CharField(
        max_length=16, choices=Visibility.choices, default=Visibility.PUBLIC, db_index=True
    )

    summary = models.TextField(blank=True, default="")

    class Meta:
        db_table = "activity_event"
        
        indexes = [
            models.Index(fields=["actor_id", "published_at"], name="idx_actor_ts"),
            models.Index(fields=["community_id", "published_at"], name="idx_comm_ts"),
            models.Index(fields=["type", "published_at"], name="idx_type_ts"),
            models.Index(fields=["object_type", "object_id"], name="idx_obj_pair"),
            models.Index(fields=["visibility", "published_at"], name="idx_vis_ts"),
        ]

    def __str__(self):
        return f"{self.type} by {self.actor_id} on {self.object_type}:{self.object_id}"

    # ---- AS2 helpers --------------------------------------------------------
    def build_as2_from_fields(self) -> dict:
        """
        Build a minimal-but-complete ActivityStreams 2.0 payload from denormalized fields.
        This is the canonical shape most Fediverse software expects.
        """
        # Map visibility to AS2 addressing
        to = []
        cc = []
        if self.visibility == Visibility.PUBLIC:
            to = ["https://www.w3.org/ns/activitystreams#Public"]
        elif self.visibility == Visibility.UNLISTED:
            # Common pattern: unlisted -> not in "to", but cc Public
            cc = ["https://www.w3.org/ns/activitystreams#Public"]
        # FOLLOWERS/DIRECT can stay empty or point to collections/inboxes you maintain.

        as2_object = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": self.type,                          # e.g. "Create", "Like", "Announce", "Follow"
            "actor": self.actor_id,                     # can be an IRI or opaque id you use
            "object": {
                "type": self.object_type,               # e.g. "Note", "Article", "Person", ...
                "id": self.object_id,                   # an IRI/ID for the object
            },
            "published": self.published_at.isoformat().replace("+00:00", "Z"),
            "to": to,
            "cc": cc,
        }
        if self.community_id:
            # Include community/group as audience or tag—tweak to your data model
            as2_object["audience"] = self.community_id
        if self.summary:
            # AS2 allows "summary" at activity or object level; use activity-level here
            as2_object["summary"] = self.summary

        return as2_object

    def sync_as2_json(self):
        """Merge denormalized fields → AS2 payload into as2_json, preserving any extra keys already present."""
        computed = self.build_as2_from_fields()
        self.as2_json = _deep_merge(self.as2_json or {}, computed)

    # ---- Save override ------------------------------------------------------
    def save(self, *args, **kwargs):
        # Ensure AS2 payload always reflects the current row
        self.sync_as2_json()
        super().save(*args, **kwargs)