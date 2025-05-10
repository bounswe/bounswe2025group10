from django.db import models
from api.models import Achievements, Users


class Challenge(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    target_amount = models.FloatField(blank=True, null=True)
    current_progress = models.FloatField(blank=True, null=True)
    is_public = models.BooleanField(default=False)
    reward = models.ForeignKey(Achievements, models.DO_NOTHING, blank=True, null=True)
    creator = models.ForeignKey(Users, models.DO_NOTHING, blank=True, null=True)

    class Meta:
        db_table = 'Challenge'


class UserChallenge(models.Model):
    user = models.ForeignKey(Users, models.DO_NOTHING)
    challenge = models.ForeignKey(Challenge, models.DO_NOTHING)
    joined_date = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'UserChallenge'
        unique_together = (('user', 'challenge'),) # these two together becomes primary key
