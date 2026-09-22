from django.urls import path

from .views import health, metrics, ready

urlpatterns = [
    path("api/health/", health, name="health"),
    path("api/ready/", ready, name="ready"),
    path("metrics", metrics, name="metrics"),
]
