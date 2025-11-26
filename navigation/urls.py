# navigation/urls.py
from django.urls import path
from .views import SmartRouteAPIView, OfflineDataAPIView, SyncDataAPIView

urlpatterns = [
    path('api/get-smart-route/', SmartRouteAPIView.as_view(), name='get-smart-route'),
    path('api/offline-data/', OfflineDataAPIView.as_view(), name='offline-data'),
    path('api/sync/', SyncDataAPIView.as_view(), name='sync-data'),
]
