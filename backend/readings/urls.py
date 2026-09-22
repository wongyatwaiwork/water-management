from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import BulkReadingView, SensorReadingViewSet

router = DefaultRouter()
router.register("readings", SensorReadingViewSet, basename="reading")
urlpatterns = [path("readings/bulk/", BulkReadingView.as_view(), name="reading-bulk"), *router.urls]
