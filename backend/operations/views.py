from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Vehicle, Convoy
from .serializers import VehicleSerializer, ConvoySerializer
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

@method_decorator(csrf_exempt, name='dispatch')
class FleetStatusAPIView(APIView):
    """
    API endpoint to provide a list of all vehicles in the fleet.
    """
    def get(self, request, *args, **kwargs):
        vehicles = Vehicle.objects.all()
        serializer = VehicleSerializer(vehicles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

@method_decorator(csrf_exempt, name='dispatch')
class ActiveConvoysAPIView(APIView):
    """
    API endpoint to provide a list of all active convoys.
    """
    def get(self, request, *args, **kwargs):
        # For now, we return all convoys. We could filter for 'EN_ROUTE' later.
        convoys = Convoy.objects.all()
        serializer = ConvoySerializer(convoys, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
