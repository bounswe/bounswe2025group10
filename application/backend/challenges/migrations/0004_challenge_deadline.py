# Generated migration file for adding deadline field to Challenge model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('challenges', '0003_alter_challenge_options_alter_userchallenge_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='challenge',
            name='deadline',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
