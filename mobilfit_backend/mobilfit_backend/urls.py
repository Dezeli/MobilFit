from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('api/v1/auth/', include('users.urls')),
    path("api/v1/ors/", include("ors.urls")),
    path('docs/', include('docs.urls')),
    path("admin/", admin.site.urls),
    
    path("", include("simple_web.urls")),
]
