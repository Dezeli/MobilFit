from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    path('api/v1/auth/', include('users.urls')),
    path("api/v1/ors/", include("ors.urls")),
    path('', TemplateView.as_view(template_name="landing.html"), name='landing'),
    path('docs/', include('docs.urls')),
    path('terms/privacy/', TemplateView.as_view(template_name="terms/privacy.html"), name='privacy'),
    path('terms/service/', TemplateView.as_view(template_name="terms/service.html"), name='terms'),
    path("admin/", admin.site.urls),
]
