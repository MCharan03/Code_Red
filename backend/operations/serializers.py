from rest_framework import serializers
from .models import Vehicle, Convoy

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'

class ConvoySerializer(serializers.ModelSerializer):
    # Use the existing VehicleSerializer to show nested vehicle data
    vehicles = VehicleSerializer(many=True, read_only=True)

    class Meta:
        model = Convoy
        fields = ['id', 'name', 'status', 'current_latitude', 'current_longitude', 'updated_at', 'vehicles']