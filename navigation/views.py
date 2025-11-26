from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import get_smart_route

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

