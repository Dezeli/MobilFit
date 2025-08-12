from django.contrib import admin
from .models import AccountDeletionRequest

@admin.register(AccountDeletionRequest)
class AccountDeletionRequestAdmin(admin.ModelAdmin):
    list_display = ["email", "requested_at", "is_processed"]
    list_filter = ["is_processed"]
    search_fields = ["email", "message"]