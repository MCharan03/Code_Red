from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import get_smart_route
from .models import Checkpoint, Route
from .serializers import CheckpointSerializer, RouteSerializer

class SmartRouteAPIView(APIView):
    """
    API endpoint to get a smart route.
    """
    def post(self, request, *args, **kwargs):
        """
        Accepts start and end checkpoint IDs and returns a smart route.
        """
        start_checkpoint_id = request.data.get('start_checkpoint_id')
        end_checkpoint_id = request.data.get('end_checkpoint_id')

        if not start_checkpoint_id or not end_checkpoint_id:
            return Response(
                {"error": "Both start_checkpoint_id and end_checkpoint_id are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Call the service layer to get the smart route
        route_data = get_smart_route(start_checkpoint_id, end_checkpoint_id)

        return Response(route_data, status=status.HTTP_200_OK)

class OfflineDataAPIView(APIView):
    """
    API endpoint to provide all essential data for offline use.
    """
    def get(self, request, *args, **kwargs):
        checkpoints = Checkpoint.objects.all()
        routes = Route.objects.all()

        checkpoint_serializer = CheckpointSerializer(checkpoints, many=True)
        route_serializer = RouteSerializer(routes, many=True)

        return Response({
            'checkpoints': checkpoint_serializer.data,
            'routes': route_serializer.data,
        }, status=status.HTTP_200_OK)

from datetime import datetime
from django.utils import timezone

class SyncDataAPIView(APIView):
    """
    API endpoint to provide data that has been updated since a given timestamp (delta sync).
    """
    def post(self, request, *args, **kwargs):
        last_sync_timestamp_str = request.data.get('last_sync_timestamp')

        if not last_sync_timestamp_str:
            return Response(
                {"error": "last_sync_timestamp is required for delta sync."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Assuming timestamp is in ISO format
            last_sync_timestamp = datetime.fromisoformat(last_sync_timestamp_str)
            # Ensure timezone awareness if your database stores timezone info
            if timezone.is_naive(last_sync_timestamp):
                last_sync_timestamp = timezone.make_aware(last_sync_timestamp)
        except ValueError:
            return Response(
                {"error": "Invalid last_sync_timestamp format. Use ISO 8601 (e.g., '2023-01-01T12:30:00Z')."},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated_checkpoints = Checkpoint.objects.filter(updated_at__gt=last_sync_timestamp)
        updated_routes = Route.objects.filter(updated_at__gt=last_sync_timestamp)

        checkpoint_serializer = CheckpointSerializer(updated_checkpoints, many=True)
        route_serializer = RouteSerializer(updated_routes, many=True)

        return Response({
            'updated_checkpoints': checkpoint_serializer.data,
            'updated_routes': route_serializer.data,
            'current_server_time': timezone.now().isoformat() # Provide server time for next sync
        }, status=status.HTTP_200_OK)

