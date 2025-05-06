from django.db import models
from django.contrib.auth.models import AbstractUser, Group # Import Group
from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext_lazy as _ # For verbose names

class CustomUserManager(BaseUserManager):
    """
    Custom user model manager where email is the unique identifiers
    for authentication instead of usernames.
    """
    def create_user(self, email, password, **extra_fields):
        """
        Create and save a User with the given email and password.
        """
        if not email:
            raise ValueError(_("The Email field must be set"))
        email = self.normalize_email(email)
        # The model is obtained from self.model
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        """
        Create and save a SuperUser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True) # Superusers should be active
        extra_fields.setdefault('isAdmin', True) # Your custom admin field

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        if extra_fields.get('isAdmin') is not True: # For your custom field
            raise ValueError(_('Superuser must have isAdmin=True.'))
        
        return self.create_user(email, password, **extra_fields)


class Users(AbstractUser):
    """
    Custom User model inheriting from AbstractUser.
    It uses email as the USERNAME_FIELD.
    It inherits 'groups' and 'user_permissions' ManyToManyFields from AbstractUser,
    which depend on 'auth_group' and 'auth_permission' tables respectively.
    """
    class Meta:
        db_table = 'Users' # Specifies the database table name
        verbose_name = _('user')
        verbose_name_plural = _('users')

    # AbstractUser already provides:
    # id (AutoField), username, first_name, last_name, password (hashed),
    # is_staff, is_active, date_joined, last_login.
    # It also provides 'groups' and 'user_permissions' ManyToManyFields.

    # Override email to make it unique and the USERNAME_FIELD.
    # AbstractUser's email is not unique by default.
    email = models.EmailField(
        _('email address'),
        max_length=100, # Consider Django's default of 254 for emails if appropriate
        unique=True,
        help_text=_('Required. Format: user@example.com')
    )

    # You are keeping the 'username' field from AbstractUser.
    # AbstractUser's username has validators and max_length=150 by default.
    # If you need to change its properties, you can redefine it:
    # username = models.CharField(max_length=50, unique=True)

    # Custom fields
    isAdmin = models.BooleanField(
        db_column='isAdmin', # Use db_column if your DB column name differs from field name
        default=False,
        help_text=_('Designates whether this user has admin privileges (custom field).')
    )
    profile_id = models.IntegerField(
        unique=True, 
        null=True, 
        blank=True,
        help_text=_('Optional. Unique ID for an associated profile.')
    )
    profile_image = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        help_text=_('Optional. URL or path to the profile image.')
    )
    bio = models.TextField(
        null=True, 
        blank=True,
        help_text=_('Optional. A short biography of the user.')
    )
    
    # is_superuser is already provided by AbstractUser and handled by CustomUserManager.
    # is_staff is already provided by AbstractUser and handled by CustomUserManager.

    # Set the manager
    objects = CustomUserManager()

    USERNAME_FIELD = 'email' # Use email for login
    REQUIRED_FIELDS = ['username'] # Fields prompted for when creating a superuser (besides email and password)


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
