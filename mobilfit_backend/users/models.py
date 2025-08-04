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
    total_distance_km = models.FloatField(default=0.0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s data"

class EmailVerification(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.email} - {self.code}"


class RideLog(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='ride_logs')
    distance_km = models.FloatField()
    duration_seconds = models.FloatField()
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField()
    provider = models.CharField(max_length=50, null=True, blank=True)
    saved_money = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class Feedback(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="feedbacks")
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.user.nickname}] {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"


class Notice(models.Model):
    title = models.CharField(max_length=100)
    content = models.TextField()
    is_active = models.BooleanField(default=True)  # 노출 여부
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
