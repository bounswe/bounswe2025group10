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
    class Meta:
        db_table = 'Users'
        managed = False

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

    # Keep Django’s staff/superuser flags in sync if you need them
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.username


class Achievements(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Achievements'


class Challenges(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    target_amount = models.FloatField(blank=True, null=True)
    current_progress = models.FloatField(blank=True, null=True)
    is_public = models.IntegerField(blank=True, null=True)
    reward = models.ForeignKey(Achievements, models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Challenges'


class Comments(models.Model):
    post = models.ForeignKey('Posts', models.DO_NOTHING)
    author = models.ForeignKey('Users', models.DO_NOTHING)
    content = models.TextField()
    date = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Comments'


class Posts(models.Model):
    creator = models.ForeignKey('Users', models.DO_NOTHING)
    date = models.DateTimeField(blank=True, null=True)
    text = models.TextField(blank=True, null=True)
    image = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Posts'


class Tips(models.Model):
    text = models.TextField()
    like_count = models.IntegerField(blank=True, null=True)
    dislike_count = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Tips'


class Userachievements(models.Model):
    pk = models.CompositePrimaryKey('user_id', 'achievement_id')
    user = models.ForeignKey('Users', models.DO_NOTHING)
    achievement = models.ForeignKey(Achievements, models.DO_NOTHING)
    earned_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'UserAchievements'
        unique_together = (('user', 'achievement'),)


class Userchallenges(models.Model):
    pk = models.CompositePrimaryKey('user_id', 'challenge_id')
    user = models.ForeignKey('Users', models.DO_NOTHING)
    challenge = models.ForeignKey(Challenges, models.DO_NOTHING)
    joined_date = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'UserChallenges'
        unique_together = (('user', 'challenge'),)

class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group', 'permission'),)


class AuthPermission(models.Model):
    name = models.CharField(max_length=255)
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
    codename = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type', 'codename'),)


class AuthtokenToken(models.Model):
    key = models.CharField(primary_key=True, max_length=40)
    created = models.DateTimeField()
    user = models.OneToOneField(Users, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'authtoken_token'


class DjangoAdminLog(models.Model):
    action_time = models.DateTimeField()
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.PositiveSmallIntegerField()
    change_message = models.TextField()
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey(Users, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    id = models.BigAutoField(primary_key=True)
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'
