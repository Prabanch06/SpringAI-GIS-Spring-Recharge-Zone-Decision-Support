from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # path('interventions/', include('apps.interventions.urls')),
    # path('recharge/', include('apps.recharge.urls')),
    # path('springs/', include('apps.springs.urls')),
    # path('suitability/', include('apps.suitability.urls')),
]
