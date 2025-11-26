from django.db import models
import uuid

class Checkpoint(models.Model):
    """Represents a physical checkpoint or point of interest on the map."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    # Geo-spatial data for the checkpoint
    latitude = models.FloatField()
    longitude = models.FloatField()
    is_choke_point = models.BooleanField(default=False, help_text="Is this a known traffic choke-point?")

    def __str__(self):
        return self.name

class Route(models.Model):
    """Represents a planned convoy route from a start to an end checkpoint."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    start_checkpoint = models.ForeignKey(Checkpoint, related_name='starting_routes', on_delete=models.CASCADE)
    end_checkpoint = models.ForeignKey(Checkpoint, related_name='ending_routes', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    # Overall calculated stats for the route
    total_distance = models.FloatField(help_text="Total distance in kilometers.")
    estimated_duration_mins = models.IntegerField(help_text="Estimated travel time in minutes without stops.")

    def __str__(self):
        return f"Route from {self.start_checkpoint} to {self.end_checkpoint}"

class RouteSegment(models.Model):
    """Represents a segment of a Route between two checkpoints. This will hold the AI risk score."""
    route = models.ForeignKey(Route, related_name='segments', on_delete=models.CASCADE)
    start_checkpoint = models.ForeignKey(Checkpoint, related_name='segment_starts', on_delete=models.CASCADE)
    end_checkpoint = models.ForeignKey(Checkpoint, related_name='segment_ends', on_delete=models.CASCADE)
    order = models.PositiveIntegerField()
    distance = models.FloatField(help_text="Distance of this segment in kilometers.")
    
    # AI-Generated Score
    terrain_risk_score = models.IntegerField(default=0, help_text="TARI Score (0-5) based on terrain, slope, etc.")

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Segment {self.order} of {self.route.name}"
