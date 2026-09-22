from django.urls import path

from .views import DailyConsumptionView, HeatmapView, SummaryView, UsageView

urlpatterns = [
    path("analytics/usage/", UsageView.as_view(), name="analytics-usage"),
    path("analytics/daily-consumption/", DailyConsumptionView.as_view(), name="analytics-daily"),
    path("analytics/heatmap/", HeatmapView.as_view(), name="analytics-heatmap"),
    path("analytics/summary/", SummaryView.as_view(), name="analytics-summary"),
]
