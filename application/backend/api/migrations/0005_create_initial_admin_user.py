# Generated by Django 5.2 on 2025-05-08 17:44

from django.db import migrations
from django.contrib.auth.hashers import make_password

def create_admin_user(apps, schema_editor):
    Users = apps.get_model('api', 'Users')
    admin = Users.objects.create(
        username='admin',
        email='admin@example.com',
        isAdmin=True,
        is_staff=True,
        is_superuser=True,
        is_active=True,
        password=make_password('admin123')  # Hash the password directly
    )

def reverse_admin_user(apps, schema_editor):
    Users = apps.get_model('api', 'Users')
    Users.objects.filter(username='admin').delete()

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_alter_tips_dislike_count_alter_tips_like_count'),
    ]

    operations = [
        migrations.RunPython(create_admin_user, reverse_admin_user),
    ]
