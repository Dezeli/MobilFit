from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import *

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ('username', 'nickname', 'email', 'is_active', 'is_staff')
    search_fields = ('username', 'nickname', 'email')
    ordering = ('-date_joined',)

@admin.register(UserToken)
class UserTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at', 'expired_at')
    search_fields = ('user__username',)
    ordering = ('-created_at',)

@admin.register(UserData)
class UserDataAdmin(admin.ModelAdmin):
    list_display = ('user', 'ride_score', 'app_usage_count', 'total_saved_money', 'updated_at')
    search_fields = ('user__username',)
    ordering = ('-updated_at',)

@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ('email', 'code', 'created_at')
    search_fields = ('email',)
    ordering = ('-created_at',)