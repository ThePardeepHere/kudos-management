
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include


api_v1_prefix = 'api/v1/'


urlpatterns = [
    path('admin/', admin.site.urls),
    # API v1 endpoints
    path(api_v1_prefix+'accounts/', include('accounts.urls.api_v1_urls')),
    path(api_v1_prefix+'kudos/', include('kudos_app.urls.api_v1_urls')), 
    path(api_v1_prefix+'utils/', include('utils_app.urls.api_v1_urls')),
    
]

if settings.DEBUG:
   # urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
