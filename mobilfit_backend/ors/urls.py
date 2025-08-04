from django.urls import path
from .views import RouteView, combined_search

urlpatterns = [
    path("route/", RouteView.as_view()),
    path('search/', combined_search, name='combined-search'),
]
