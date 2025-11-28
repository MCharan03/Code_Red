# navigation/services.py
from .models import Checkpoint

def get_smart_route(start_checkpoint_id, end_checkpoint_id):
    """
    Analyzes terrain and conditions to generate the safest and fastest route.
    This mock version generates a plausible route between two actual checkpoints.
    """
    try:
        start_cp = Checkpoint.objects.get(id=start_checkpoint_id)
        end_cp = Checkpoint.objects.get(id=end_checkpoint_id)
    except Checkpoint.DoesNotExist:
        return {"error": "Invalid checkpoint ID provided."}

    print(f"Analyzing terrain from {start_cp.name} to {end_cp.name}...")

    # Simulate a midpoint for a more interesting route
    midpoint_lat = (start_cp.latitude + end_cp.latitude) / 2 + 0.005 # adding small offset for a curve
    midpoint_lon = (start_cp.longitude + end_cp.longitude) / 2 + 0.005

    # Simulate AI risk scoring
    risk_1 = 1
    risk_2 = 3

    # Create mock route data with coordinates for the map
    mock_route_data = {
        "primary_route": {
            "segments": [
                {
                    "from": start_cp.name,
                    "to": "Simulated Midpoint",
                    "tari_score": risk_1,
                    "path": [
                        [start_cp.latitude, start_cp.longitude],
                        [midpoint_lat, midpoint_lon]
                    ]
                },
                {
                    "from": "Simulated Midpoint",
                    "to": end_cp.name,
                    "tari_score": risk_2,
                    "path": [
                        [midpoint_lat, midpoint_lon],
                        [end_cp.latitude, end_cp.longitude]
                    ]
                },
            ],
            # These are just estimations for the mock
            "total_distance_km": 150, 
            "estimated_duration_mins": 180,
        },
        "alternative_routes": [],
    }
    
    print("Smart route generated successfully.")
    return mock_route_data