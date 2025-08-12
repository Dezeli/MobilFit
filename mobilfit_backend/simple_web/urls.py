from django.urls import path
from django.views.generic import TemplateView
from .views import account_deletion_view, account_deletion_done_view

urlpatterns = [
    path('', TemplateView.as_view(template_name="landing.html"), name="landing"),
    path('terms/privacy/', TemplateView.as_view(template_name="terms/privacy.html"), name="privacy"),
    path('terms/service/', TemplateView.as_view(template_name="terms/service.html"), name="terms"),

    path('account-deletion/', account_deletion_view, name="account_deletion"),
    path('account-deletion/done/', account_deletion_done_view, name="account_deletion_done"),
]
