# Generated by Django 5.2 on 2025-05-08 15:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_create_waste_types'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tips',
            name='dislike_count',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AlterField(
            model_name='tips',
            name='like_count',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
    ]
