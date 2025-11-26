from rest_framework import serializers
from .models import Checkpoint, Route, RouteSegment

class CheckpointSerializer(serializers.ModelSerializer):
    class Meta:
        model = Checkpoint
        fields = '__all__'

class RouteSegmentSerializer(serializers.ModelSerializer):
    start_checkpoint = CheckpointSerializer(read_only=True)
    end_checkpoint = CheckpointSerializer(read_only=True)

    class Meta:
        model = RouteSegment
        fields = '__all__'

class RouteSerializer(serializers.ModelSerializer):
    segments = RouteSegmentSerializer(many=True, read_only=True)
    start_checkpoint = CheckpointSerializer(read_only=True)
    end_checkpoint = CheckpointSerializer(read_only=True)

    class Meta:
        model = Route
        fields = '__all__'
