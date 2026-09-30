import uuid
from django.contrib.gis.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class SpringType(models.TextChoices):
    FRACTURE = 'Fracture', 'Fracture / Joint Spring'
    DEPRESSION = 'Depression', 'Depression Spring'
    CONTACT = 'Contact', 'Lithological Contact Spring'
    FAULT = 'Fault-controlled', 'Fault-controlled Spring'
    KARST = 'Karst', 'Karst / Solution Spring'

class AquiferType(models.TextChoices):
    UNCONFINED_FRACTURED = 'Unconfined Fractured Rock', 'Unconfined Fractured Rock'
    CONFINED = 'Confined', 'Confined Aquifer'
    SEMICONFINED = 'Semi-confined Colluvium', 'Semi-confined Colluvium / Debris'

class SpringStatus(models.TextChoices):
    ACTIVE = 'Active', 'Active & Stable'
    DRYING = 'Drying', 'Discharge Declining'
    CRITICAL = 'Critical', 'Severely Depleted'
    REVIVED = 'Revived', 'Post-Intervention Revived'

class Spring(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    spring_code = models.CharField(max_length=64, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    state = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    block_tehsil = models.CharField(max_length=100, blank=True)
    village = models.CharField(max_length=100)
    
    # Geodetic coordinates (WGS84 EPSG:4326)
    location = models.PointField(srid=4326, spatial_index=True)
    elevation = models.FloatField(help_text="Elevation above MSL in meters")
    
    # Hydrogeology
    spring_type = models.CharField(max_length=32, choices=SpringType.choices, default=SpringType.FRACTURE)
    geological_formation = models.CharField(max_length=255)
    aquifer_type = models.CharField(max_length=48, choices=AquiferType.choices)
    strike_deg = models.FloatField(null=True, blank=True, help_text="Strike azimuth (0-360)")
    dip_deg = models.FloatField(null=True, blank=True, help_text="Dip angle (0-90)")
    dip_direction = models.CharField(max_length=16, blank=True)
    
    # Discharge dynamics (Liters Per Minute - LPM)
    average_discharge = models.FloatField(help_text="Annual Average Discharge (LPM)")
    min_discharge = models.FloatField(help_text="Lean season minimum discharge (LPM)")
    max_discharge = models.FloatField(help_text="Peak monsoon discharge (LPM)")
    monsoon_discharge = models.FloatField(default=0.0)
    summer_discharge = models.FloatField(default=0.0)
    seasonality = models.CharField(max_length=32, default="Perennial")
    status = models.CharField(max_length=32, choices=SpringStatus.choices, default=SpringStatus.ACTIVE)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_springs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.spring_code} - {self.name}"

class DischargeMeasurement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    spring = models.ForeignKey(Spring, on_delete=models.CASCADE, related_name='discharge_records')
    measurement_date = models.DateField(db_index=True)
    discharge_lpm = models.FloatField(help_text="Discharge rate in Liters Per Minute")
    season = models.CharField(max_length=32)
    measurement_method = models.CharField(max_length=64, help_text="V-notch weir, bucket timing, electromagnetic flowmeter")
    water_temperature_c = models.FloatField(null=True, blank=True)
    ph = models.FloatField(null=True, blank=True)
    electrical_conductivity = models.FloatField(null=True, blank=True, help_text="µS/cm")
    observer = models.CharField(max_length=120)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-measurement_date']
