"""
URL configuration for realtyhub_backend project.

Layout:
- /django-admin/  -> Django's built-in admin site (model-level data admin)
- /api/           -> REST API (Django REST Framework) consumed by the frontend JS
- /media/         -> uploaded property/vehicle/blog images (dev only)
- /assets/        -> the frontend's CSS/JS/image assets (served via STATICFILES)
- everything else -> the static frontend site itself (index.html, properties.html,
                      admin/dashboard.html, etc.) so the whole app runs from one server.
"""
from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve as static_serve

from .views_frontend import serve_frontend

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/', include('api.urls')),
    re_path(r'^media/(?P<path>.*)$', static_serve, {'document_root': settings.MEDIA_ROOT}),
    re_path(r'^(?P<path>.*)$', serve_frontend),
]
