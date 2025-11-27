from django.db import models
from django.contrib.auth import get_user_model
user = get_user_model()
# Create your models here.
class Notification(models.Model):
    user = models.ForeignKey(user, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']  # newest first


    def __str__(self):
        return f"Notification for {self.user.username}: {self.message[:20]}..."