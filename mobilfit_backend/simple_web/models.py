from django.db import models

class AccountDeletionRequest(models.Model):
    email = models.EmailField()
    message = models.TextField()
    requested_at = models.DateTimeField(auto_now_add=True)
    is_processed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.email} @ {self.requested_at.strftime('%Y-%m-%d %H:%M')}"
