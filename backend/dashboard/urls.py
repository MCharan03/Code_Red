from django.urls import path
from .views import DashboardView, health_check

urlpatterns = [
    path('', DashboardView.as_view(), name='dashboard'),
    path('api/health-check/', health_check, name='health-check'),
]