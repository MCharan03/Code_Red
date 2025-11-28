from django.db import models
import uuid

class Vehicle(models.Model):
    """
    Represents a vehicle in the fleet, such as an AGV or forklift.
    """
    STATUS_CHOICES = [
        ('OPERATIONAL', 'Operational'),
        ('MAINTENANCE_DUE', 'Maintenance Due'),
        ('OUT_OF_SERVICE', 'Out of Service'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPERATIONAL')
    operating_hours = models.FloatField(default=0.0, help_text="Total hours of operation.")
    last_maintenance_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Convoy(models.Model):
    """
    Represents an active convoy of one or more vehicles, currently en route.
    """
    STATUS_CHOICES = [
        ('EN_ROUTE', 'En Route'),
        ('IDLE', 'Idle'),
        ('HALTED', 'Halted'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='IDLE')
    
    # A convoy can consist of multiple vehicles
    vehicles = models.ManyToManyField(Vehicle)

    # Real-time location
    current_latitude = models.FloatField()
    current_longitude = models.FloatField()

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
