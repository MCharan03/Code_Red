# operations/urls.py
from django.urls import path
from .views import FleetStatusAPIView, ActiveConvoysAPIView

urlpatterns = [
    path('api/fleet-status/', FleetStatusAPIView.as_view(), name='fleet-status'),
    path('api/active-convoys/', ActiveConvoysAPIView.as_view(), name='active-convoys'),
]