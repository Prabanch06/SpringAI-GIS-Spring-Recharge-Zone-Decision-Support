from django.contrib import admin
from django.urls import path, include

# Basic URL configuration for the SpringAI GIS project.
# Adjust and extend as needed for your apps.
urlpatterns = [
    path('admin/', admin.site.urls),
    # path('interventions/', include('apps.interventions.urls')),
    # path('recharge/', include('apps.recharge.urls')),
    # path('springs/', include('apps.springs.urls')),
    # path('suitability/', include('apps.suitability.urls')),
]
