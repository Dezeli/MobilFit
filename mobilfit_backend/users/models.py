from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    nickname = models.CharField(max_length=30)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.username

class UserToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tokens')
    refresh_token = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    expired_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s token"

class UserData(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='data')
    ride_score = models.IntegerField(default=80)  # 자전거 운행 점수
    app_usage_count = models.IntegerField(default=0)  # 앱 활용 횟수
    total_saved_money = models.IntegerField(default=0)  # 절약 금액 (원화)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s data"

class EmailVerification(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.email} - {self.code}"
