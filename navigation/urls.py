# navigation/urls.py
from django.urls import path
from .views import SmartRouteAPIView

urlpatterns = [
    path('api/get-smart-route/', SmartRouteAPIView.as_view(), name='get-smart-route'),
]
