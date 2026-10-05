from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from apps.springs.models import Spring, DischargeMeasurement

SPRINGS_DATA = [
    {
        "spring_code": "DEMO-SPR-001",
        "name": "Bhimtal Valley Fracture Spring (Dhara-1)",
        "state": "Uttarakhand",
        "district": "Nainital",
        "village": "Bhimtal East",
        "longitude": 79.5623,
        "latitude": 29.3512,
        "elevation": 1420.0,
        "spring_type": "Fracture",
        "geological_formation": "Krol Formation (Fractured Dolomite / Silty Shale)",
        "aquifer_type": "Unconfined Fractured Rock",
        "strike_deg": 130.0,
        "dip_deg": 26.0,
        "dip_direction": "NE",
        "average_discharge": 16.4,
        "min_discharge": 4.2,
        "max_discharge": 38.5,
        "monsoon_discharge": 34.2,
        "summer_discharge": 5.1,
        "seasonality": "Perennial",
        "status": "Drying"
    },
    {
        "spring_code": "DEMO-SPR-002",
        "name": "Bhowali Forest Ridge Contact Spring",
        "state": "Uttarakhand",
        "district": "Nainital",
        "village": "Bhowali Sanatorium",
        "longitude": 79.5235,
        "latitude": 29.3842,
        "elevation": 1740.0,
        "spring_type": "Contact",
        "geological_formation": "Blaini Boulder Bed over Nagthat Quartzite",
        "aquifer_type": "Semi-confined Colluvium",
        "strike_deg": 145.0,
        "dip_deg": 32.0,
        "dip_direction": "NE",
        "average_discharge": 24.8,
        "min_discharge": 9.5,
        "max_discharge": 52.0,
        "monsoon_discharge": 46.5,
        "summer_discharge": 10.2,
        "seasonality": "Perennial",
        "status": "Active"
    },
    {
        "spring_code": "DEMO-SPR-003",
        "name": "Solan Limestone Karst Conduit Spring",
        "state": "Himachal Pradesh",
        "district": "Solan",
        "village": "Kandaghat Sub-basin",
        "longitude": 77.1085,
        "latitude": 30.9740,
        "elevation": 1530.0,
        "spring_type": "Karst",
        "geological_formation": "Subathu Formation (Nummulitic Limestone / Calc-shale)",
        "aquifer_type": "Unconfined Fractured Rock",
        "strike_deg": 160.0,
        "dip_deg": 38.0,
        "dip_direction": "SW",
        "average_discharge": 32.5,
        "min_discharge": 8.0,
        "max_discharge": 85.0,
        "monsoon_discharge": 74.0,
        "summer_discharge": 8.8,
        "seasonality": "Perennial",
        "status": "Active"
    },
    {
        "spring_code": "DEMO-SPR-004",
        "name": "Namchi Hill Depression Spring",
        "state": "Sikkim",
        "district": "South Sikkim",
        "village": "Namchi Sub-divisional Watershed",
        "longitude": 88.3580,
        "latitude": 27.1650,
        "elevation": 1675.0,
        "spring_type": "Depression",
        "geological_formation": "Daling Group (Chlorite-Sericite Phyllite / Schist)",
        "aquifer_type": "Unconfined Fractured Rock",
        "strike_deg": 110.0,
        "dip_deg": 42.0,
        "dip_direction": "SW",
        "average_discharge": 11.2,
        "min_discharge": 1.8,
        "max_discharge": 42.0,
        "monsoon_discharge": 38.0,
        "summer_discharge": 2.1,
        "seasonality": "Seasonal",
        "status": "Critical"
    },
    {
        "spring_code": "DEMO-SPR-005",
        "name": "Mahabaleshwar Plateau Basalt Contact Spring",
        "state": "Maharashtra",
        "district": "Satara",
        "village": "Old Mahabaleshwar",
        "longitude": 73.6580,
        "latitude": 17.9230,
        "elevation": 1370.0,
        "spring_type": "Contact",
        "geological_formation": "Deccan Traps (Compound Pahoehoe Basalt)",
        "aquifer_type": "Semi-confined Colluvium",
        "strike_deg": 0.0,
        "dip_deg": 2.0,
        "dip_direction": "W",
        "average_discharge": 19.5,
        "min_discharge": 6.4,
        "max_discharge": 65.0,
        "monsoon_discharge": 58.0,
        "summer_discharge": 7.2,
        "seasonality": "Perennial",
        "status": "Active"
    }
]

class Command(BaseCommand):
    help = 'Seeds initial mountain springs into PostgreSQL/PostGIS database'

    def handle(self, *args, **options):
        count = 0
        for item in SPRINGS_DATA:
            point = Point(item['longitude'], item['latitude'], srid=4326)
            spring, created = Spring.objects.update_or_create(
                spring_code=item['spring_code'],
                defaults={
                    "name": item['name'],
                    "state": item['state'],
                    "district": item['district'],
                    "village": item['village'],
                    "location": point,
                    "elevation": item['elevation'],
                    "spring_type": item['spring_type'],
                    "geological_formation": item['geological_formation'],
                    "aquifer_type": item['aquifer_type'],
                    "strike_deg": item['strike_deg'],
                    "dip_deg": item['dip_deg'],
                    "dip_direction": item['dip_direction'],
                    "average_discharge": item['average_discharge'],
                    "min_discharge": item['min_discharge'],
                    "max_discharge": item['max_discharge'],
                    "monsoon_discharge": item['monsoon_discharge'],
                    "summer_discharge": item['summer_discharge'],
                    "seasonality": item['seasonality'],
                    "status": item['status']
                }
            )
            count += 1
            action = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{action} spring: {spring.spring_code} ({spring.name})"))

        self.stdout.write(self.style.SUCCESS(f"Successfully populated {count} springs into PostGIS."))
